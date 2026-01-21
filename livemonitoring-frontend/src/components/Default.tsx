import { useEffect, useRef} from 'react';
// import type {ServerMessage} from "../servermessages.ts";
// import type {ClientMessage} from "../clientmessages.ts";

const WS_PATH = "ws://localhost:3001";

const Def = () => {
    const wsRef =
        useRef<WebSocket | null>(null);
    useEffect(() => {
        console.log("useEffect");
        const ws = new WebSocket(WS_PATH);
        wsRef.current = ws;
    },[]);

    return (
            <div style={{ flex: 2, display: "flex",
                flexDirection: "column", margin: "2rem auto",
                fontFamily: "system-ui, sans-serif"}}>
            </div>
    );
};

export default Def;