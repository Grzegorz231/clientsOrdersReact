import "./styleCatalog.css";
import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/items";
const CATEGORIES_URL = "http://localhost:8000/categories";

function Catalog() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [overlayType, setOverlayType] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [newProduct, setNewProduct] = useState({
        name: "",
        price: "",
        photo: "",
        description: "",
        categories_id: ""
    });
    const [newCategoryName, setNewCategoryName] = useState("");

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [selectedCategories, searchTerm]);

    const fetchProducts = () => {
        axios.get(API_URL)
            .then(response => setProducts(response.data))
            .catch(error => console.error("Ошибка загрузки товаров:", error));
    };

    const fetchCategories = () => {
        axios.get(CATEGORIES_URL)
            .then(response => setCategories(response.data))
            .catch(error => console.error("Ошибка загрузки категорий:", error));
    };

    const filteredProducts = products.filter(product =>
        (selectedCategories.size === 0 || selectedCategories.has(product.categories_id)) &&
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCategoryChange = (categoryId) => {
        setSelectedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const handleAddCategory = () => {
        setNewCategoryName("");
        setOverlayType("add_category");
    };

    const handleSaveCategory = () => {
        if (!newCategoryName.trim()) {
            alert("Пожалуйста, введите название категории");
            return;
        }

        axios.post(CATEGORIES_URL, { name: newCategoryName })
            .then(() => {
                fetchCategories();
                closeOverlay();
            })
            .catch(error => console.error("Ошибка добавления категории:", error));
    };

    const handleEditCategory = (category) => {
        setSelectedCategory(category);
        setNewCategoryName(category.name);
        setOverlayType("edit_category");
    };

    const handleUpdateCategory = () => {
        if (!newCategoryName.trim()) {
            alert("Пожалуйста, введите название категории");
            return;
        }

        axios.put(`${CATEGORIES_URL}/${selectedCategory.id}`, { name: newCategoryName })
            .then(() => {
                fetchCategories();
                closeOverlay();
            })
            .catch(error => console.error("Ошибка обновления категории:", error));
    };

    const handleDeleteCategory = (category) => {
        setSelectedCategory(category);
        setOverlayType("delete_category");
    };

    const handleDeleteCategoryConfirm = () => {
        axios.delete(`${CATEGORIES_URL}/${selectedCategory.id}`)
            .then(() => {
                fetchCategories();
                closeOverlay();
            })
            .catch(error => console.error("Ошибка удаления категории:", error));
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setOverlayType("edit");
    };

    const handleDelete = (product) => {
        setSelectedProduct(product);
        setOverlayType("delete");
    };

    const closeOverlay = () => {
        setOverlayType(null);
        setSelectedProduct(null);
        setSelectedCategory(null);
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedProduct((prev) => ({ ...prev, photo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        const requiredFields = ['name', 'price', 'description'];
        const emptyFields = requiredFields.filter(field => !selectedProduct[field]);
        
        if (emptyFields.length > 0) {
            const fieldNames = {
                name: 'название',
                price: 'цена',
                description: 'описание'
            };
            
            alert(`Пожалуйста, заполните обязательные поля: ${emptyFields.map(f => fieldNames[f]).join(', ')}`);
            return;
        }
    
        if (isNaN(selectedProduct.price) || Number(selectedProduct.price) <= 0) {
            alert('Цена должна быть положительным числом');
            return;
        }
    
        if (selectedProduct.price.toString().replace('.', '').length > 7) {
            alert('Цена не должна превышать 7 цифр');
            return;
        }
    
        const formData = new FormData();
        formData.append("name", selectedProduct.name);
        formData.append("price", selectedProduct.price);
        formData.append("description", selectedProduct.description);
    
        let fileResponse = null;
        if (selectedProduct.photo && typeof selectedProduct.photo === "string" && selectedProduct.photo.startsWith("data:")) {
            const file = await fetch(selectedProduct.photo)
                .then((res) => res.blob())
                .then((blob) => new File([blob], "image.png", { type: "image/png" }));
            formData.append("file", file);
    
            fileResponse = await axios.post("http://localhost:8000/upload/", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
        }
    
        const updatedProduct = {
            ...selectedProduct,
            photo: fileResponse ? `http://localhost:8000/images/${fileResponse.data.file_name}` : selectedProduct.photo,
        };
    
        try {
            await axios.put(`${API_URL}/${selectedProduct.id}`, updatedProduct);
            setProducts(products.map(p => p.id === selectedProduct.id ? updatedProduct : p));
            closeOverlay();
        } catch (error) {
            console.error("Ошибка сохранения:", error);
            alert('Произошла ошибка при сохранении товара');
        }
    };

    const handleDeleteConfirm = () => {
        axios.delete(`${API_URL}/${selectedProduct.id}`)
            .then(() => {
                setProducts(products.filter(p => p.id !== selectedProduct.id));
                closeOverlay();
            })
            .catch(error => console.error("Ошибка удаления:", error));
    };

    const handleAddProduct = () => {
        setNewProduct({ name: "", price: "", photo: "", description: "", categories_id: "" });
        setOverlayType("add");
    };

    const handleSaveNewProduct = async () => {
        const requiredFields = ['name', 'price', 'description', 'categories_id'];
        const emptyFields = requiredFields.filter(field => !newProduct[field]);
        
        if (emptyFields.length > 0) {
            const fieldNames = {
                name: 'название',
                price: 'цена',
                description: 'описание',
                categories_id: 'категория'
            };
            
            alert(`Пожалуйста, заполните обязательные поля: ${emptyFields.map(f => fieldNames[f]).join(', ')}`);
            return;
        }

        if (isNaN(newProduct.price) || Number(newProduct.price) <= 0) {
            alert('Цена должна быть положительным числом');
            return;
        }

        if (newProduct.price.toString().replace('.', '').length > 7) {
            alert('Цена не должна превышать 7 цифр');
            return;
        }
        
        const formData = new FormData();
        formData.append("name", newProduct.name);
        formData.append("price", newProduct.price);
        formData.append("description", newProduct.description);
        formData.append("categories_id", newProduct.categories_id);
    
        if (newProduct.photo) {
            const file = await fetch(newProduct.photo)
                .then((res) => res.blob())
                .then((blob) => new File([blob], "image.png", { type: "image/png" }));
            formData.append("file", file);
        }
    
        try {
            let fileResponse = null;
            if (newProduct.photo) {
                fileResponse = await axios.post("http://localhost:8000/upload/", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
            }
    
            const imageUrl = fileResponse ? `http://localhost:8000/images/${fileResponse.data.file_name}` : null;
    
            const productData = {
                name: newProduct.name,
                price: newProduct.price,
                description: newProduct.description,
                categories_id: newProduct.categories_id,
                photo: imageUrl,
            };
    
            await axios.post(API_URL, productData);
            fetchProducts();
            closeOverlay();
        } catch (error) {
            console.error("Ошибка добавления товара:", error);
            alert('Произошла ошибка при сохранении товара');
        }
    };

    return (
        <div className="catalog-container">
            <h1 className="catalog-title">Каталог <span className="highlight">магазина</span></h1>
            <div className="catalog-header">
                <button className="add-product" onClick={handleAddProduct}>
                    Добавить новый товар
                </button>
                <input
                    type="text"
                    placeholder="Поиск товара..."
                    className="search-bar"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className={`catalog-content ${overlayType ? "blurred" : ""}`}>
                <aside className="filters">
                    <div className="filters-header">
                        <h3>Фильтры</h3>
                        <button className="add-category-btn" onClick={handleAddCategory}>
                            Добавить категорию
                        </button>
                    </div>
                    {categories.map(category => (
                        <div key={category.id} className="category-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.has(category.id)}
                                    onChange={() => handleCategoryChange(category.id)}
                                />
                                {category.name}
                            </label>
                            <div className="category-actions">
                                <button 
                                    className="edit-category-btn"
                                    onClick={() => handleEditCategory(category)}
                                >
                                    ✏️
                                </button>
                                <button 
                                    className="delete-category-btn"
                                    onClick={() => handleDeleteCategory(category)}
                                >
                                    🗑
                                </button>
                            </div>
                        </div>
                    ))}
                </aside>

                <main className="products">
                    {filteredProducts.map(product => (
                        <div className="product-card" key={product.id}>
                            <img src={product.photo} alt={product.name} className="product-image" />
                            <p className="product-name">{product.name}</p>
                            <p className="product-price">{product.price} ₽</p>
                            <p className="product-description">{product.description}</p>
                            <div className="product-actions">
                                <button className="edit-btn" onClick={() => handleEdit(product)}>Редактировать</button>
                                <button className="delete-btn" onClick={() => handleDelete(product)}>Удалить</button>
                            </div>
                        </div>
                    ))}
                </main>
            </div>

            {/* Оверлей для добавления категории */}
            {overlayType === "add_category" && (
                <div className="overlay">
                    <div className="overlay-content">
                        <h3>Добавление категории</h3>
                        <input
                            type="text"
                            placeholder="Введите название категории"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="edit-input"
                            required
                        />
                        <div className="overlay-buttons">
                            <button className="save-btn" onClick={handleSaveCategory}>Сохранить</button>
                            <button className="cancel-btn" onClick={closeOverlay}>Отмена</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Оверлей для редактирования категории */}
            {overlayType === "edit_category" && selectedCategory && (
                <div className="overlay">
                    <div className="overlay-content">
                        <h3>Редактирование категории</h3>
                        <input
                            type="text"
                            placeholder="Введите название категории"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="edit-input"
                            required
                        />
                        <div className="overlay-buttons">
                            <button className="save-btn" onClick={handleUpdateCategory}>Сохранить</button>
                            <button className="cancel-btn" onClick={closeOverlay}>Отмена</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Оверлей для удаления категории */}
            {overlayType === "delete_category" && selectedCategory && (
                <div className="overlay">
                    <div className="overlay-content">
                        <p>Вы уверены, что хотите удалить категорию <strong>{selectedCategory.name}</strong>?</p>
                        <div className="overlay-buttons">
                            <button className="confirm-btn" onClick={handleDeleteCategoryConfirm}>Удалить</button>
                            <button className="cancel-btn" onClick={closeOverlay}>Отмена</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Оверлей для добавления товара */}
            {overlayType === "add" && (
                <div className="overlay">
                    <div className="overlay-content">
                        <h3>Добавление товара</h3>
                        <input
                            type="text"
                            placeholder="Название"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            className="edit-input"
                            required
                        />
                        <input
                            type="number"
                            placeholder="Цена"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                            className="edit-input"
                            min="0.01"
                            step="0.01"
                            required
                        />
                        <textarea
                            placeholder="Описание"
                            value={newProduct.description}
                            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                            className="edit-input"
                            required
                        />
                        <select
                            value={newProduct.categories_id}
                            onChange={(e) => setNewProduct({ ...newProduct, categories_id: Number(e.target.value) })}
                            className="edit-input"
                            required
                        >
                            <option value="">Выберите категорию</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="file"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setNewProduct({ ...newProduct, photo: reader.result });
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                            className="edit-input"
                        />
                        <div className="overlay-buttons">
                            <button className="save-btn" onClick={handleSaveNewProduct}>Сохранить</button>
                            <button className="cancel-btn" onClick={closeOverlay}>Отмена</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Оверлей для редактирования товара */}
            {overlayType === "edit" && selectedProduct && (
                <div className="overlay">
                    <div className="overlay-content">
                        <h3>Редактирование товара</h3>
                        <input
                            type="text"
                            placeholder="Название"
                            value={selectedProduct.name}
                            onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
                            className="edit-input"
                            required
                        />
                        <input
                            type="number"
                            placeholder="Цена"
                            value={selectedProduct.price}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value.replace('.', '').length <= 7) {
                                    setSelectedProduct({ ...selectedProduct, price: value });
                                }
                            }}
                            className="edit-input"
                            min="0.01"
                            step="0.01"
                            required
                        />
                        <textarea
                            placeholder="Описание"
                            value={selectedProduct.description}
                            onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
                            className="edit-input"
                            required
                        />
                        <input
                            type="file"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setSelectedProduct({ ...selectedProduct, photo: reader.result });
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                            className="edit-input"
                        />
                        {selectedProduct.photo && (
                            <img
                                src={selectedProduct.photo}
                                alt="Предварительный просмотр"
                                style={{ maxWidth: "100px", marginTop: "10px" }}
                            />
                        )}
                        <div className="overlay-buttons">
                            <button className="save-btn" onClick={handleSave}>Сохранить</button>
                            <button className="cancel-btn" onClick={closeOverlay}>Отмена</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Оверлей для удаления товара */}
            {overlayType === "delete" && selectedProduct && (
                <div className="overlay">
                    <div className="overlay-content">
                        <p>Вы уверены, что хотите удалить <strong>{selectedProduct.name}</strong>?</p>
                        <div className="overlay-buttons">
                            <button className="confirm-btn" onClick={handleDeleteConfirm}>Удалить</button>
                            <button className="cancel-btn" onClick={closeOverlay}>Отмена</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Catalog;