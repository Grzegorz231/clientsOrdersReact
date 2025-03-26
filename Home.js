import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./styleHome.css";

function Home() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post("http://localhost:8000/login", {
                login: username,
                password: password,
            });

            console.log("Успешная аутентификация:", response.data);
            navigate("/catalog");
        } catch (error) {
            if (error.response) {
                console.error("Ошибка входа:", error.response.data);
                alert(error.response.data.detail || "Ошибка входа");
            } else {
                console.error("Ошибка:", error.message);
                alert("Ошибка сервера. Попробуйте позже.");
            }
        }
    };

    return (
        <div className="home-container">
            
            <div className="login-box">
                <h2>Вход в систему</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Логин</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Пароль</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Войти</button>
                </form>
            </div>
        </div>
    );
}

export default Home;
