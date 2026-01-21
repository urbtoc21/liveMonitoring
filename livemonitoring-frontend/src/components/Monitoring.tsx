import React, {useEffect, useRef, useState} from 'react';
import type {ServerMessage} from "../servermessages.ts";
import type {subscribeCPU, subscribeMemory} from "../clientmessages.ts";
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
    IconButton
} from '@mui/material';

import {
    Memory as MemoryIcon,
    Speed as CpuIcon,
    Dns as ServerIcon
} from '@mui/icons-material';

const WS_PATH = "ws://localhost:3001";

interface MetricsData {
    cpu?: number;
    memory?: {
        used: number;
        total: number;
        percentage: number;
    };
}

function Monitoring() {

    const [showCpu, setShowCpu] = useState(false);
    const [showMem, setShowMem] = useState(false);
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

    const toGB = (bytes: number) => (bytes / 1024 / 1024 / 1024).toFixed(2);

    const getColor = (value: number) => {
        if (value < 50) return "success"; // Grün
        if (value < 80) return "warning"; // Gelb
        return "error";   // Rot
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

            </Grid>
        </Container>
    );
}

export default Monitoring;