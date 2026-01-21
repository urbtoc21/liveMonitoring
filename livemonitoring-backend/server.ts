import http from "http";
import app from "./app.js";
import { WebSocketServer, WebSocket } from "ws";
import {ClientMessage} from "./types/clientmessages.js";
import {SubscribedMetricsUpdate} from "./types/servermessages.js";
import si from 'systeminformation';

interface ClientWebSocket extends WebSocket {
    clientId: string;
    isAlive?: boolean;
    subscribedMetrics: Set<"cpu_usage" | "memory_usage">;
}

const port: number = process.env.PORT ? Number(process.env.PORT) : 3001;

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`HTTP- und WebSocket-Server läuft auf Port ${port}`);
});

const wss = new WebSocketServer({ server });

let nextId = 1;
const clientsById = new Map<string, ClientWebSocket>();



const intervalId = setInterval(async () => {
    // 1. PERFORMANCE: Wenn niemand verbunden ist, sofort abbrechen
    if (clientsById.size === 0) return;

    // 2. AGGREGATION: Prüfen, welche Metriken ÜBERHAUPT benötigt werden
    // Wir wollen si.currentLoad() nicht aufrufen, wenn niemand CPU will.
    let needCpu = false;
    let needMemory = false;

    for (const client of clientsById.values()) {
        if (client.readyState === WebSocket.OPEN) {
            if (client.subscribedMetrics.has("cpu_usage")) needCpu = true;
            if (client.subscribedMetrics.has("memory_usage")) needMemory = true;
        }
    }

    // Wenn absolut keine Metriken gewünscht sind -> return
    if (!needCpu && !needMemory) return;

    try {
        // 3. DATEN ABRUFEN (Nur einmal für alle!)
        // Wir bauen das Query-Objekt dynamisch zusammen
        const query: any = {};
        if (needCpu)    query.currentLoad = 'currentLoad';
        if (needMemory) query.mem = 'active, total, used';

        const data = await si.get(query);

        // 4. VERTEILUNG: Jedem Client nur das schicken, was er abonniert hat
        for (const client of clientsById.values()) {
            if (client.readyState !== WebSocket.OPEN) continue;

            // Wenn der Client GAR NICHTS abonniert hat, überspringen
            if (client.subscribedMetrics.size === 0) continue;

            const payload: any = {}; // Hier kommt rein, was der Client bekommt

            if (client.subscribedMetrics.has("cpu_usage") && data.currentLoad) {
                payload.cpu = data.currentLoad.currentLoad;
            }

            if (client.subscribedMetrics.has("memory_usage") && data.mem) {
                payload.memory = {
                    used: data.mem.used,
                    total: data.mem.total,
                    percentage: (data.mem.active / data.mem.total) * 100
                };
            }

            // Nur senden, wenn Payload nicht leer ist
            if (Object.keys(payload).length > 0) {
                const message: SubscribedMetricsUpdate = {
                    type: "subscribed-metrics-update",
                    data: payload
                };
                client.send(JSON.stringify(message));
            }
        }

    } catch (e) {
        console.error("Fehler beim Abrufen der Metriken:", e);
    }
}, 2000);




wss.on("close", () => {
    console.log("connection closed");
    clearInterval(intervalId);
})

wss.on("error", (err) => {
    console.log("error");
    console.log(err.message);
})

wss.on("connection", (socket: ClientWebSocket) => {
    socket.clientId = `c${nextId++}`;
    socket.isAlive = true;
    socket.subscribedMetrics = new Set();
    clientsById.set(socket.clientId, socket);
    console.log("connection established to", socket.clientId);

    socket.on("close", (code: number, reason ) => {
        console.log("socket close");
        clientsById.delete(socket.clientId);
    })

    socket.on("message", (data: WebSocket.RawData) => {
        const msg: ClientMessage = JSON.parse((String(data)));
        console.log("message received", msg);

        switch (msg.type) {
            case "subscribe-cpu":
                if (msg.enabled) socket.subscribedMetrics.add("cpu_usage");
                else socket.subscribedMetrics.delete("cpu_usage");
                break;
            case "subscribe-memory":
                if (msg.enabled) socket.subscribedMetrics.add("memory_usage");
                else socket.subscribedMetrics.delete("memory_usage");
                break;
        }
    });
});