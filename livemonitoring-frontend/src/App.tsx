import Header from "./components/Header.tsx";
import Def from "./components/Default.tsx";
import { Toolbar } from "@mui/material";
import Monitoring from "./components/Monitoring.tsx";

function App() {
    return (
        <>
            <Header></Header>
            <Toolbar />
            <Def></Def>
            <Monitoring></Monitoring>
        </>);
}

export default App;
