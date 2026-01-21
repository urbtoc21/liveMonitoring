import {AppBar, Toolbar, Typography, Avatar} from '@mui/material';
import AirIcon from '@mui/icons-material/Air';
import {useEffect, useState} from "react";
import { getHealth } from "../checkHealth.ts";

const Header = () => {
    const [health, setHealth] = useState<string>("Not OK");
    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const healthvalue = await getHealth();
                console.log("healthvalue", healthvalue);
                if(healthvalue === true)
                    setHealth("OK");
            } catch (err) {
                console.error("Fehler beim Laden der Health:", err);
            }
        };
        fetchHealth();
    }, []);
    return (
        <AppBar position="fixed" color="transparent"
                sx={{ backgroundColor: '#930e00', color: '#eee' }}>
            <Toolbar>
                <Avatar
                    src="react.svg"
                    alt="Logo"
                    sx={{ marginRight: 2 }}
                >
                    <AirIcon fontSize="small" />
                </Avatar>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Live Monitoring Dashboard
                </Typography>
                <Typography variant="h6" sx={{ ml: "auto" }}>
                    Health: {health}
                </Typography>
            </Toolbar>
        </AppBar>
    );
};

export default Header;