import {BrowserRouter, Routes, Route} from 'react-router-dom';
import './App.css';
import {Layout} from "./components/organisms/Layout.tsx";
import {FleetPage} from "./pages/FleetPage/FleetPage.tsx";
import {CellPage} from "./pages/CellPage/CellPage.tsx";
import {ErrorPage} from "./pages/ErrorPage/ErrorPage.tsx";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout/>}>
                    <Route index element={<FleetPage/>}/>
                    <Route path="/cell/:cellId" element={<CellPage/>}/>
                    <Route path="*" element={<ErrorPage/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    )
};
