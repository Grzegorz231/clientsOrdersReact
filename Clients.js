import "./styleClients.css";
import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/clients";

function Clients() {
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [overlayType, setOverlayType] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [newClient, setNewClient] = useState({
        firstName: "",
        secondName: "",
        phoneNumber: "",
        mail: ""
    });
    const [confirmDeleteClientId, setConfirmDeleteClientId] = useState(null);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = () => {
        axios.get(API_URL)
            .then(response => setClients(response.data))
            .catch(error => console.error("Ошибка загрузки клиентов:", error));
    };

    const validateFields = (client) => {
        if (!client.firstName.trim()) {
            alert("Поле 'Имя' обязательно для заполнения");
            return false;
        }
        if (!client.secondName.trim()) {
            alert("Поле 'Фамилия' обязательно для заполнения");
            return false;
        }
        if (!client.phoneNumber.trim()) {
            alert("Поле 'Телефон' обязательно для заполнения");
            return false;
        }
        if (client.phoneNumber.replace(/\D/g, '').length !== 11) {
            alert("Номер телефона должен содержать 11 цифр");
            return false;
        }
        if (!client.mail.trim()) {
            alert("Поле 'Email' обязательно для заполнения");
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.mail)) {
            alert("Введите корректный email адрес");
            return false;
        }
        return true;
    };

    const formatPhoneNumber = (value) => {
        const numbers = value.replace(/\D/g, '');
        let formattedValue = "+7 ";
        
        if (numbers.length > 1) {
            const rest = numbers.substring(1);
            formattedValue += `(${rest.substring(0, 3)})`;
            if (rest.length > 3) {
                formattedValue += `-${rest.substring(3, 6)}`;
            }
            if (rest.length > 6) {
                formattedValue += `-${rest.substring(6, 8)}`;
            }
            if (rest.length > 8) {
                formattedValue += `-${rest.substring(8, 10)}`;
            }
        } else if (numbers.length === 1) {
            formattedValue = "+7";
        }
        
        return formattedValue;
    };

    const handlePhoneChange = (e, isNewClient) => {
        const input = e.target.value;
        const numbers = input.replace(/\D/g, '');
        
        if (numbers.length <= 11) {
            const formattedValue = formatPhoneNumber(input);
            
            if (isNewClient) {
                setNewClient({...newClient, phoneNumber: formattedValue});
            } else {
                setSelectedClient({...selectedClient, phoneNumber: formattedValue});
            }
        }
    };

    const preparePhoneForDB = (phone) => {
        const numbers = phone.replace(/\D/g, '');
        
        if (numbers.startsWith('7') && numbers.length === 11) {
            return `+${numbers}`;
        }
        else if (numbers.startsWith('8') && numbers.length === 11) {
            return `+7${numbers.substring(1)}`;
        }
        else if (numbers.startsWith('7') && numbers.length === 10) {
            return `+7${numbers}`;
        }
        else {
            return `+${numbers}`;
        }
    };

    const handleEdit = (client) => {
        setSelectedClient({
            ...client,
            phoneNumber: formatPhoneNumber(client.phoneNumber)
        });
        setOverlayType("edit");
    };

    const handleAddClient = () => {
        setNewClient({ firstName: "", secondName: "", phoneNumber: "+7 ", mail: "" });
        setOverlayType("add");
    };

    const handleSaveNewClient = () => {
        if (!validateFields(newClient)) return;
        
        const clientToSave = {
            ...newClient,
            phoneNumber: preparePhoneForDB(newClient.phoneNumber)
        };
        
        axios.post(API_URL, clientToSave)
            .then(() => {
                fetchClients();
                closeOverlay();
            })
            .catch(error => {
                console.error("Ошибка добавления клиента:", error);
                alert("Ошибка при добавлении клиента: " + error.message);
            });
    };
    
    const handleSave = () => {
        if (!validateFields(selectedClient)) return;
        
        const clientToSave = {
            ...selectedClient,
            phoneNumber: preparePhoneForDB(selectedClient.phoneNumber)
        };
        
        axios.put(`${API_URL}/${selectedClient.id}`, clientToSave)
            .then(() => {
                setClients(clients.map(c => c.id === selectedClient.id ? {
                    ...clientToSave,
                    phoneNumber: formatPhoneNumber(clientToSave.phoneNumber)
                } : c));
                closeOverlay();
            })
            .catch(error => {
                console.error("Ошибка сохранения клиента:", error);
                alert("Ошибка при сохранении изменений: " + error.message);
            });
    };

    const handleDelete = () => {
        if (confirmDeleteClientId) {
            axios.delete(`${API_URL}/${confirmDeleteClientId}`)
                .then(() => {
                    setClients(clients.filter(client => client.id !== confirmDeleteClientId));
                    closeDeleteOverlay();
                })
                .catch(error => console.error("Ошибка удаления клиента:", error));
        }
    };

    const closeOverlay = () => {
        setOverlayType(null);
        setSelectedClient(null);
    };

    const closeDeleteOverlay = () => {
        setConfirmDeleteClientId(null);
    };

    const filteredClients = clients.filter(client =>
        client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.secondName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phoneNumber.includes(searchTerm)
    );

    return (
        <div className="clients-container">
            <h1 className="clients-title">Клиенты <span className="highlight">магазина</span></h1>

            <div className="clients-header">
                <button className="add-client" onClick={handleAddClient}>Добавить клиента</button>
                <input
                    type="text"
                    placeholder="Поиск клиента..."
                    className="search-bar"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="clients-content">
                <main className="clients">
                    {filteredClients.map(client => (
                        <div className="client-card" key={client.id}>
                            <span>
                            {client.firstName} {client.secondName}, {client.phoneNumber}, {client.mail}
                            </span>
                            <div className="edit-delete-clients">
                                <button className="edit-btn" onClick={() => handleEdit(client)}>Редактировать</button>
                                <button className="delete-btn" onClick={() => handleDelete(client.id)}>Удалить</button>
                            </div>               
                        </div>
                    ))}
                </main>
            </div>

            {overlayType === "add" && (
                <div className="overlay">
                    <div className="overlay-content">
                        <h3>Добавление клиента</h3>
                        <input
                            type="text"
                            placeholder="Имя"
                            value={newClient.firstName}
                            onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                            className="edit-input"
                        />
                        <input
                            type="text"
                            placeholder="Фамилия"
                            value={newClient.secondName}
                            onChange={(e) => setNewClient({ ...newClient, secondName: e.target.value })}
                            className="edit-input"
                        />
                        <input
                            type="text"
                            placeholder="+7 (XXX)-XXX-XX-XX"
                            value={newClient.phoneNumber}
                            onChange={(e) => handlePhoneChange(e, true)}
                            className="edit-input"
                        />
                        <input
                            type="email"
                            placeholder="Почта"
                            value={newClient.mail}
                            onChange={(e) => setNewClient({ ...newClient, mail: e.target.value })}
                            className="edit-input"
                        />
                        <button className="save-btn" onClick={handleSaveNewClient}>Сохранить</button>
                        <button className="cancel-btn" onClick={closeOverlay}>Отмена</button>
                    </div>
                </div>
            )}

            {overlayType === "edit" && selectedClient && (
                <div className="overlay">
                    <div className="overlay-content">
                        <h3>Редактирование клиента</h3>
                        <input
                            type="text"
                            value={selectedClient.firstName}
                            onChange={(e) => setSelectedClient({ ...selectedClient, firstName: e.target.value })}
                            className="edit-input"
                        />
                        <input
                            type="text"
                            value={selectedClient.secondName}
                            onChange={(e) => setSelectedClient({ ...selectedClient, secondName: e.target.value })}
                            className="edit-input"
                        />
                        <input
                            type="text"
                            value={selectedClient.phoneNumber}
                            onChange={(e) => handlePhoneChange(e, false)}
                            className="edit-input"
                        />
                        <input
                            type="email"
                            value={selectedClient.mail}
                            onChange={(e) => setSelectedClient({ ...selectedClient, mail: e.target.value })}
                            className="edit-input"
                        />
                        <button className="save-btn" onClick={handleSave}>Сохранить</button>
                        <button className="cancel-btn" onClick={closeOverlay}>Отмена</button>
                    </div>
                </div>
            )}
            {confirmDeleteClientId && (
                <div className="overlay-delete">
                    <div className="overlay-delete-content">
                        <h3>Вы уверены, что хотите удалить этого клиента?</h3>
                        <button onClick={handleDelete} className="delete-client-btn">Удалить</button>
                        <button onClick={closeDeleteOverlay} className="cancel-btn">Отмена</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Clients;