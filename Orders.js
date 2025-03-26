import "./styleOrders.css";
import { useEffect, useState } from "react";
import Select from 'react-select';
import { format } from 'date-fns';

function Orders() {
    const [orders, setOrders] = useState([]);
    const [items, setItems] = useState([]);
    const [itemsMap, setItemsMap] = useState({});
    const [clientsMap, setClientsMap] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [editOrder, setEditOrder] = useState(null);
    const [editOrderItems, setEditOrderItems] = useState([]);
    const [editSelectedClient, setEditSelectedClient] = useState(null);
    const [editItemsToDelete, setEditItemsToDelete] = useState([]);
    const [deleteOrder, setDeleteOrder] = useState(null);
    const [showAddOrder, setShowAddOrder] = useState(false);
    const [newOrderItems, setNewOrderItems] = useState([{ orders_id: "", items_id: "", quantity: 1 }]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientOptions, setClientOptions] = useState([]);
    const [itemsToDelete, setItemsToDelete] = useState([]);

    useEffect(() => {
        async function fetchOrders() {
            const response = await fetch("http://localhost:8000/orders/");
            const data = await response.json();
            setOrders(data);
        }

        async function fetchItems() {
            const response = await fetch("http://localhost:8000/items/");
            const data = await response.json();
            setItems(data);
            setItemsMap(data.reduce((acc, item) => ({ ...acc, [item.id]: item.name }), {}));
        }

        async function fetchClients() {
            const response = await fetch("http://localhost:8000/clients/");
            const data = await response.json();
            setClientsMap(data.reduce((acc, client) => ({ ...acc, [client.id]: `${client.firstName} ${client.secondName}` }), {}));
            
            const options = data.map(client => ({
                value: client.id,
                label: `${client.firstName} ${client.secondName} (${client.phoneNumber})`
            }));
            setClientOptions(options);
        }

        fetchClients();
        fetchItems();
        fetchOrders();
    }, []);

    function handleEditOrder(orderId) {
        const orderToEdit = orders.find(order => order.id === orderId);
        if (orderToEdit) {
            setEditSelectedClient({
                value: orderToEdit.clients_id,
                label: clientsMap[orderToEdit.clients_id] || "Неизвестный клиент",
            });
    
            const itemsToEdit = orderToEdit.order_items.map(item => ({
                id: item.id,
                items_id: item.items_id,
                quantity: item.quantity,
            }));
            setEditOrderItems(itemsToEdit);
    
            setEditOrder(orderId);
        }
    }

    async function addNewItemToOrder(orderId, item) {
        const response = await fetch("http://localhost:8000/order_items/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                orders_id: orderId,
                items_id: item.items_id,
                quantity: item.quantity,
            }),
        });
    
        if (response.ok) {
            const newItem = await response.json();
            return newItem;
        } else {
            throw new Error("Ошибка при добавлении товара в заказ");
        }
    }

    async function deleteOrderItem(orderItemId) {
        const response = await fetch(`http://localhost:8000/order_items/${orderItemId}`, {
            method: "DELETE",
        });
    
        if (response.ok) {
            return true;
        } else {
            throw new Error("Ошибка при удалении товара из заказа");
        }
    }

    function addNewOrderItem() {
        setNewOrderItems([...newOrderItems, { orders_id: "", items_id: "", quantity: 1 }]);
    }

    async function removeOrderItem(index, orderItemId) {
        if (orderItemId) {
            try {
                await deleteOrderItem(orderItemId);
            } catch (error) {
                console.error("Ошибка при удалении товара из заказа:", error);
                return;
            }
        }
    
        const updatedItems = newOrderItems.filter((_, i) => i !== index);
        setNewOrderItems(updatedItems);
    }

    function updateOrderItem(index, key, value) {
        const updatedItems = [...newOrderItems];
        updatedItems[index][key] = value;
        setNewOrderItems(updatedItems);
    }

    function updateEditOrderItem(index, key, value) {
        const updatedItems = [...editOrderItems];
        updatedItems[index][key] = value;
        setEditOrderItems(updatedItems);
    }

    async function removeEditOrderItem(index, orderItemId) {
        if (orderItemId) {
            setEditItemsToDelete([...editItemsToDelete, orderItemId]);
        }
        const updatedItems = editOrderItems.filter((_, i) => i !== index);
        setEditOrderItems(updatedItems);
    }

    function addNewEditOrderItem() {
        setEditOrderItems([...editOrderItems, { items_id: "", quantity: 1 }]);
    }

    async function submitEditOrder() {
        if (!editSelectedClient) {
            alert("Пожалуйста, выберите клиента");
            return;
        }
    
        const hasItems = editOrderItems.some(item => item.items_id);
        if (!hasItems) {
            alert("Пожалуйста, добавьте хотя бы один товар в заказ");
            return;
        }
    
        const emptyItems = editOrderItems.filter(item => !item.items_id);
        if (emptyItems.length > 0) {
            alert("Пожалуйста, выберите товар для всех позиций в заказе");
            return;
        }
    
        try {
            const orderResponse = await fetch(`http://localhost:8000/orders/${editOrder}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    clients_id: editSelectedClient.value, 
                    isOrderActive: true,
                }),
            });
    
            if (!orderResponse.ok) {
                throw new Error("Ошибка при обновлении заказа");
            }
    
            for (const itemId of editItemsToDelete) {
                try {
                    await deleteOrderItem(itemId);
                } catch (error) {
                    console.error("Ошибка при удалении товара из заказа:", error);
                }
            }
    
            for (const item of editOrderItems) {
                if (item.items_id) {
                    if (item.id) {
                        await fetch(`http://localhost:8000/order_items/${item.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ 
                                items_id: item.items_id, 
                                quantity: item.quantity,
                            }),
                        });
                    } else {
                        await addNewItemToOrder(editOrder, item);
                    }
                }
            }
    
            const updatedOrders = orders.map(order => 
                order.id === editOrder ? { 
                    ...order, 
                    clients_id: editSelectedClient.value,
                    isOrderActive: true,
                    order_items: editOrderItems.filter(item => item.items_id),
                } : order
            );
            setOrders(updatedOrders);
    
            setEditOrder(null);
            setEditOrderItems([{ items_id: "", quantity: 1 }]);
            setEditSelectedClient(null);
            setEditItemsToDelete([]);
        } catch (error) {
            console.error("Ошибка при сохранении заказа:", error);
            alert("Произошла ошибка при сохранении заказа");
        }
    }

    function addNewOrderItem() {
        setNewOrderItems([...newOrderItems, { items_id: "", quantity: 1 }]);
    }
    
    async function confirmDeleteOrder() {
        const response = await fetch(`http://localhost:8000/orders/${deleteOrder}`, {
            method: "DELETE",
        });
    
        if (response.ok) {
            const updatedOrders = orders.filter(order => order.id !== deleteOrder);
            setOrders(updatedOrders);
            setDeleteOrder(null);
        }
    }

    async function submitNewOrder() {
        if (!selectedClient) {
            alert("Пожалуйста, выберите клиента");
            return;
        }
    
        const hasItems = newOrderItems.some(item => item.items_id);
        if (!hasItems) {
            alert("Пожалуйста, добавьте хотя бы один товар в заказ");
            return;
        }
    
        const emptyItems = newOrderItems.filter(item => !item.items_id);
        if (emptyItems.length > 0) {
            alert("Пожалуйста, выберите товар для всех позиций в заказе");
            return;
        }
    
        const currentDate = new Date().toISOString();
    
        const orderResponse = await fetch("http://localhost:8000/orders/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                clients_id: selectedClient.value, 
                isOrderActive: true,
                date: currentDate
            }),
        });
        
        if (!orderResponse.ok) {
            alert("Ошибка при создании заказа");
            return;
        }
    
        const orderData = await orderResponse.json();
    
        try {
            for (const item of newOrderItems.filter(item => item.items_id)) {
                await fetch("http://localhost:8000/order_items/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        orders_id: orderData.id, 
                        items_id: item.items_id, 
                        quantity: item.quantity 
                    }),
                });
            }
    
            const clientName = clientsMap[selectedClient.value] || "Неизвестный клиент";
    
            const newOrder = {
                id: orderData.id,
                clients_id: selectedClient.value,
                isOrderActive: true,
                date: currentDate,
                order_items: newOrderItems.filter(item => item.items_id).map(item => ({
                    items_id: item.items_id,
                    quantity: item.quantity,
                })),
            };
    
            setOrders([...orders, newOrder]);
            setShowAddOrder(false);
            setNewOrderItems([{ items_id: "", quantity: 1 }]);
            setSelectedClient(null);
        } catch (error) {
            console.error("Ошибка при добавлении товаров в заказ:", error);
            alert("Произошла ошибка при создании заказа");
        }
    }
    

    const filteredOrders = orders.filter(order => {
        const clientName = clientsMap[order.clients_id] || "";
        const orderId = order.id.toString();

        return (
            clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            orderId.includes(searchTerm)
        );
    });

    return (
        <div className="orders-container">
            <h1 className="orders-title">Заказы <span className="highlight">магазина</span></h1>
            <div className="orders-header">
                <button className="overlay-order-add-btn" onClick={() => setShowAddOrder(true)}>Добавить новый заказ</button>
                <input
                    type="text"
                    placeholder="Поиск заказа..."
                    className="search-bar"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="orders-content">
                <main className="orders">
                    {filteredOrders.map(order => (
                        <div key={order.id} className="order-card">
                        <span>
                            №{order.id} - {clientsMap[order.clients_id] || "Неизвестный клиент"} <br />
                            {order.order_items.map(item => 
                                `${itemsMap[item.items_id] || "Товар не найден"} x${item.quantity}`
                            ).join(", ")} <br />
                            <span className="order-date">
                                Дата заказа: {format(new Date(order.date), 'dd.MM.yyyy HH:mm')}
                            </span>
                        </span>
                        <div className="order-buttons">
                            <div className={`order-status ${order.isOrderActive ? "active" : "inactive"}`}>
                                {order.isOrderActive ? "Активен" : "Неактивен"}
                            </div>
                            <button className="edit-btn" onClick={() => handleEditOrder(order.id)}>Редактировать</button>
                            <button className="delete-btn" onClick={() => setDeleteOrder(order.id)}>Удалить</button>
                        </div>
                    </div>
                    ))}
                </main>
            </div>

            {showAddOrder && (
                <div className="overlay-order-add">
                    <div className="overlay-order-add-content">
                        <h3>Создать новый заказ</h3>
                        <div className="overlay-items">
                            <div className="overlay-order-item">
                                <Select
                                    options={clientOptions}
                                    value={selectedClient}
                                    onChange={setSelectedClient}
                                    placeholder="Выберите клиента..."
                                    isSearchable
                                    noOptionsMessage={() => "Клиент не найден"}
                                    className="client-select"
                                />
                            </div>

                            {newOrderItems.map((item, index) => (
                                <div key={index} className="overlay-order-item">
                                    <select
                                        value={item.items_id}
                                        onChange={(e) => updateOrderItem(index, "items_id", e.target.value)}
                                        className="item-select"
                                    >
                                        <option value="">Выберите товар</option>
                                        {items.map((i) => (
                                            <option key={i.id} value={i.id}>{i.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateOrderItem(index, "quantity", e.target.value)}
                                        className="quantity-input"
                                    />
                                    <button
                                        onClick={() => removeOrderItem(index, item.id)}
                                        className="remove-item-btn"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}

                            <button onClick={addNewOrderItem} className="add-item-btn">
                                Добавить товар
                            </button>
                        </div>

                        <div className="overlay-buttons">
                            <button onClick={submitNewOrder} className="confirm-btn">Принять</button>
                            <button onClick={() => setShowAddOrder(false)} className="cancel-btn">Отмена</button>
                        </div>
                    </div>
                </div>
            )}

            {editOrder && (
                <div className="overlay-order-add">
                    <div className="overlay-content">
                        <h3>Редактировать заказ</h3>
                        <div className="overlay-items">
                            <div className="overlay-order-item">
                                <Select
                                    options={clientOptions}
                                    value={editSelectedClient}
                                    onChange={setEditSelectedClient}
                                    placeholder="Выберите клиента..."
                                    isSearchable
                                    noOptionsMessage={() => "Клиент не найден"}
                                    className="client-select"
                                />
                            </div>

                            {editOrderItems.map((item, index) => (
                                <div key={index} className="overlay-order-item">
                                    <select
                                        value={item.items_id}
                                        onChange={(e) => updateEditOrderItem(index, "items_id", e.target.value)}
                                        className="item-select"
                                    >
                                        <option value="">Выберите товар</option>
                                        {items.map((i) => (
                                            <option key={i.id} value={i.id}>{i.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateEditOrderItem(index, "quantity", e.target.value)}
                                        className="quantity-input"
                                    />
                                    <button
                                        onClick={() => removeEditOrderItem(index, item.id)}
                                        className="remove-item-btn"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}

                            <button onClick={addNewEditOrderItem} className="add-item-btn">
                                Добавить товар
                            </button>
                        </div>

                        <div className="overlay-buttons">
                            <button onClick={submitEditOrder} className="confirm-btn">Сохранить</button>
                            <button onClick={() => setEditOrder(null)} className="cancel-btn">Отмена</button>
                        </div>
                    </div>
                </div>
            )}

            {deleteOrder && (
                <div className="overlay-order-add">
                    <div className="overlay-content">
                        <h3>Вы уверены, что хотите удалить заказ?</h3>
                        <div className="overlay-buttons">
                            <button onClick={confirmDeleteOrder} className="confirm-btn">Да</button>
                            <button onClick={() => setDeleteOrder(null)} className="cancel-btn">Нет</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Orders;