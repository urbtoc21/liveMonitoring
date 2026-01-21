import React, {useEffect, useRef, useState} from 'react';
import type {ServerMessage} from "../servermessages.ts";
import type {subscribeAlert, subscribeCPU, subscribeDisk, subscribeMemory} from "../clientmessages.ts";
import {
    Box,
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Checkbox,
    FormControlLabel,
    FormGroup,
    LinearProgress,
    Paper,
    Collapse,
    TextField,
    Button,
    Snackbar,
    InputAdornment,
    Alert
} from '@mui/material';

import {
    Memory as MemoryIcon,
    Speed as CpuIcon,
    Save as SaveIcon
} from '@mui/icons-material';

const WS_PATH = "ws://localhost:3001";

interface MetricsData {
    cpu?: number;
    memory?: {
        used: number;
        total: number;
        percentage: number;
    };
    disk?: {
        name: string; // Neu: Name der Partition (z.B. "C:")
        used: number;
        total: number;
        percentage: number;
    }[];
}

function Monitoring() {

    const [showCpu, setShowCpu] = useState(false);
    const [showMem, setShowMem] = useState(false);
    const [showDisk, setShowDisk] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [cpuAlertValue, setCpuAlertValue] = useState<string>("");
    const [memAlertValue, setMemAlertValue] = useState<string>("");
    const [metrics, setMetrics] = useState<MetricsData>({});

    const wsRef =
        useRef<WebSocket | null>(null);


    const handleMessage = (message : ServerMessage) => {
        switch (message.type) {
            case "subscribed-metrics-update":
                if (message.data.cpu !== undefined) {
                    console.log("CPU Usage:", message.data.cpu);
                    setMetrics((prev) => ({
                        ...prev,
                        cpu: message.data.cpu
                    }));
                }
                if (message.data.memory !== undefined) {
                    console.log("Memory Usage:", message.data.memory);
                    setMetrics((prev) => ({
                        ...prev,
                        memory: message.data.memory
                    }));
                }
                if(message.data.disk !== undefined) {
                    console.log("Disk Usage:", message.data.disk);
                    setMetrics((prev) => ({
                        ...prev,
                        disk: message.data.disk
                    }))
                }
                break;
            case "alert-triggered":
                if(message.metric === "cpu") {
                    setAlertMessage(`CPU Auslastung hat den Grenzwert von ${cpuAlertValue}% überschritten! Aktueller Wert: ${message.value.toFixed(1)}%`);
                    setAlertOpen(true);
                }
                if(message.metric === "memory") {
                    setAlertMessage(`RAM Auslastung hat den Grenzwert von ${memAlertValue}% überschritten! Aktueller Wert: ${message.value.toFixed(1)}%`);
                    setAlertOpen(true);
                }
                break;
        }
    }

    const toggleCpu = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        setShowCpu(isChecked);
        const ws = wsRef.current;
        if(ws === null || ws?.readyState !== WebSocket.OPEN)return;
        const message : subscribeCPU = {
            type: 'subscribe-cpu',
            enabled: isChecked
        }
        ws.send(JSON.stringify(message));
    };

    const toggleMem = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        setShowMem(isChecked);
        const ws = wsRef.current;
        if(ws === null || ws?.readyState !== WebSocket.OPEN)return;
        const message : subscribeMemory = {
            type: 'subscribe-memory',
            enabled: isChecked
        }
        ws.send(JSON.stringify(message));
    };

    const toggleDisk = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        setShowDisk(isChecked);
        const ws = wsRef.current;
        if(ws === null || ws?.readyState !== WebSocket.OPEN)return;
        const message : subscribeDisk = {
            type: 'subscribe-disk',
            enabled: isChecked
        }
        ws.send(JSON.stringify(message));
    }

    const toGB = (bytes: number) => (bytes / 1024 / 1024 / 1024).toFixed(2);

    const getColor = (value: number) => {
        if (value < 50) return "success"; // Grün
        if (value < 80) return "warning"; // Gelb
        return "error";   // Rot
    };


    const saveCpuAlert = () => {
        const ws = wsRef.current;
        if (ws === null || ws.readyState !== WebSocket.OPEN || !cpuAlertValue) return;
        const alertMsg : subscribeAlert = {
            type: 'subscribe-alert',
            cpuThreshold: Number(cpuAlertValue)
        }
        ws.send(JSON.stringify(alertMsg));

        console.log("CPU Alarm gesetzt auf:", cpuAlertValue);
    };

    const saveMemAlert = () => {
        const ws = wsRef.current;
        if (ws === null || ws.readyState !== WebSocket.OPEN || !memAlertValue) return;
        const alertMsg : subscribeAlert = {
            type: 'subscribe-alert',
            memoryThreshold: Number(memAlertValue)
        }
        ws.send(JSON.stringify(alertMsg));
        console.log("Memory Alarm gesetzt auf:", memAlertValue);
    };


    useEffect(() => {
        console.log("useEffect");
        const ws = new WebSocket(WS_PATH);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleMessage(message);
        }
    },[]);


    return (
        <Container>
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Metriken abonnieren
                </Typography>
                <FormGroup row>
                    <FormControlLabel
                        control={<Checkbox checked={showCpu} onChange={toggleCpu} />}
                        label="CPU Auslastung"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={showMem} onChange={toggleMem} />}
                        label="Arbeitsspeicher (RAM)"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={showDisk} onChange={toggleDisk} />}
                        label="Festplatte"
                    />
                </FormGroup>
            </Paper>

            {/* DASHBOARD GRID */}
            <Grid container spacing={3}>

                {/* CPU CARD */}
                <Grid item xs={12} md={6}>
                    <Collapse in={showCpu} timeout={500}>
                        <Card elevation={4}>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <CpuIcon fontSize="large" color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="h5">CPU</Typography>
                                </Box>

                                <Typography variant="h3" align="center" gutterBottom>
                                    {metrics.cpu ? metrics.cpu.toFixed(1) : 0}%
                                </Typography>

                                <LinearProgress
                                    variant="determinate"
                                    value={metrics.cpu || 0}
                                    color={getColor(metrics.cpu || 0)}
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                    Prozessorlast
                                </Typography>
                            </CardContent>
                        </Card>
                    </Collapse>
                </Grid>

                {/* MEMORY CARD */}
                <Grid item xs={12} md={6}>
                    <Collapse in={showMem} timeout={500}>
                        <Card elevation={4}>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <MemoryIcon fontSize="large" color="secondary" sx={{ mr: 1 }} />
                                    <Typography variant="h5">Memory</Typography>
                                </Box>

                                {metrics.memory ? (
                                    <>
                                        <Typography variant="h4" align="center">
                                            {toGB(metrics.memory.used)} <span style={{fontSize: '1rem', color: '#888'}}>/ {toGB(metrics.memory.total)} GB</span>
                                        </Typography>

                                        <Box sx={{ mt: 2 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={metrics.memory.percentage}
                                                color={getColor(metrics.memory.percentage)}
                                                sx={{ height: 10, borderRadius: 5 }}
                                            />
                                        </Box>
                                        <Typography variant="body2" align="right" sx={{ mt: 1 }}>
                                            {metrics.memory.percentage.toFixed(1)}% belegt
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography align="center">Warte auf Daten...</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Collapse>
                </Grid>

                {/* DISK CARD */}
                <Grid item xs={12} md={6}>
                    <Collapse in={showDisk} timeout={500}>
                        {metrics.disk && metrics.disk.map((disk, index) => (
                            <Card key={index}>
                                <CardContent key={index}>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <MemoryIcon fontSize="large" color="secondary" sx={{ mr: 1 }} />
                                        <Typography variant="h5">{disk.name}</Typography>
                                    </Box>

                                    <Typography variant="h4" align="center">
                                        {toGB(disk.used)} <span style={{fontSize: '1rem', color: '#888'}}>/ {toGB(disk.total)} GB</span>
                                    </Typography>

                                    <Box sx={{ mt: 2 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={disk.percentage}
                                            color={getColor(disk.percentage)}
                                            sx={{ height: 10, borderRadius: 5 }}
                                        />
                                    </Box>
                                    <Typography variant="body2" align="right" sx={{ mt: 1 }}>
                                        {disk.percentage.toFixed(1)}% belegt
                                    </Typography>

                                </CardContent>
                            </Card>
                        ))}
                    </Collapse>
                </Grid>

            </Grid>


            <Box sx={{ mt: 3, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                    label="CPU Alarm ab %"
                    type="number"
                    variant="standard"
                    size="small"
                    value={cpuAlertValue}
                    onChange={(e) => setCpuAlertValue(e.target.value)}
                    InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                />
                <Button
                    variant="contained"
                    size="small"
                    onClick={saveCpuAlert}
                    endIcon={<SaveIcon />}
                >
                    Setzen
                </Button>
            </Box>


            <Box sx={{ mt: 3, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                    label="RAM Alarm ab %"
                    type="number"
                    variant="standard"
                    size="small"
                    value={memAlertValue}
                    onChange={(e) => setMemAlertValue(e.target.value)}
                    InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                />
                <Button
                    variant="contained"
                    color="secondary" // Andere Farbe zur Unterscheidung
                    size="small"
                    onClick={saveMemAlert}
                    endIcon={<SaveIcon />}
                >
                    Setzen
                </Button>
            </Box>


            <Snackbar
                open={alertOpen}
                autoHideDuration={6000}
                onClose={() => setAlertOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setAlertOpen(false)} severity="error" sx={{ width: '100%' }}>
                    {alertMessage}
                </Alert>
            </Snackbar>

        </Container>
    );
}

export default Monitoring;