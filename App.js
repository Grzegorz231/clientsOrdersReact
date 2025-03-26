import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import "./styles/main.css";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import Home from "./pages/Home";
import Clients from "./pages/Clients";
import Catalog from "./pages/Catalog"
import Orders from "./pages/Orders";

function Layout() {
    const location = useLocation();
    const showNavbar = location.pathname !== "/";

    return (
        <>
            {showNavbar && <Navbar />}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/catalog" element={<Catalog/>} />
                <Route path="/orders" element={<Orders/>} />
            </Routes>
            <Footer />
        </>
    );
}

function App() {
    return (
        <Router>
            <Layout />
        </Router>
    );
}

export default App;