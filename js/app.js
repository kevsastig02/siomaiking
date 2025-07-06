// DOM Elements
const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const currentUserSpan = document.getElementById('current-user');
const toggleDrawerBtn = document.getElementById('toggle-drawer');
const navDrawer = document.getElementById('nav-drawer');
const closeDrawerBtn = document.getElementById('close-drawer');
const mainContent = document.querySelector('.main-content');
const sectionLinks = document.querySelectorAll('[data-section]');
const sectionContents = document.querySelectorAll('.section-content');

// Modal Elements
const productModal = new bootstrap.Modal(document.getElementById('product-modal'));
const deliveryModal = new bootstrap.Modal(document.getElementById('delivery-modal'));
const deliveryProductModal = new bootstrap.Modal(document.getElementById('delivery-product-modal'));
const saleModal = new bootstrap.Modal(document.getElementById('sale-modal'));
const saleProductModal = new bootstrap.Modal(document.getElementById('sale-product-modal'));
const returnModal = new bootstrap.Modal(document.getElementById('return-modal'));

// Toast Notification
const toastNotification = new bootstrap.Toast(document.getElementById('toast-notification'));

// State variables
let currentUser = null;
let products = [];
let deliveries = [];
let sales = [];
let returns = [];
let deliveryProducts = [];
let saleProducts = [];

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initEventListeners();
});

// Initialize Firebase Authentication
function initAuth() {
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            currentUser = user;
            loginScreen.classList.add('d-none');
            appContainer.classList.remove('d-none');
            currentUserSpan.textContent = user.email;
            loadAllData();
        } else {
            // User is signed out
            currentUser = null;
            loginScreen.classList.remove('d-none');
            appContainer.classList.add('d-none');
        }
    });
}

// Initialize event listeners
function initEventListeners() {
    // Login form
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                showToast('Login successful', 'Welcome back!');
            })
            .catch(error => {
                showToast('Login failed', error.message, 'danger');
            });
    });
    
    // Logout button
    logoutBtn.addEventListener('click', () => {
        auth.signOut()
            .then(() => {
                showToast('Logged out', 'You have been successfully logged out');
            })
            .catch(error => {
                showToast('Logout error', error.message, 'danger');
            });
    });
    
    // Toggle drawer
    toggleDrawerBtn.addEventListener('click', toggleDrawer);
    closeDrawerBtn.addEventListener('click', toggleDrawer);
    
    // Section navigation
    sectionLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Inventory section
    document.getElementById('add-product-btn').addEventListener('click', () => {
        showProductModal();
    });
    
    document.getElementById('save-product-btn').addEventListener('click', saveProduct);
    
    // Deliveries section
    document.getElementById('add-delivery-btn').addEventListener('click', () => {
        showDeliveryModal();
    });
    
    document.getElementById('add-delivery-product-btn').addEventListener('click', () => {
        showDeliveryProductModal();
    });
    
    document.getElementById('save-delivery-product-btn').addEventListener('click', addProductToDelivery);
    document.getElementById('save-delivery-btn').addEventListener('click', saveDelivery);
    
    // Sales section
    document.getElementById('add-sale-btn').addEventListener('click', () => {
        showSaleModal();
    });
    
    document.getElementById('add-sale-product-btn').addEventListener('click', () => {
        showSaleProductModal();
    });
    
    document.getElementById('save-sale-product-btn').addEventListener('click', addProductToSale);
    document.getElementById('save-sale-btn').addEventListener('click', saveSale);
    
    // Returns section
    document.getElementById('add-return-btn').addEventListener('click', () => {
        showReturnModal();
    });
    
    document.getElementById('save-return-btn').addEventListener('click', saveReturn);
}

// Toggle navigation drawer
function toggleDrawer() {
    navDrawer.classList.toggle('open');
    mainContent.classList.toggle('expanded');
}

// Show specific section
function showSection(sectionId) {
    sectionContents.forEach(content => {
        content.classList.add('d-none');
    });
    
    document.getElementById(`${sectionId}-section`).classList.remove('d-none');
    
    // Update active nav link
    sectionLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        }
    });
}

// Load all data from Firestore
function loadAllData() {
    loadProducts();
    loadDeliveries();
    loadSales();
    loadReturns();
    updateDashboardStats();
}

// Product Management
function loadProducts() {
    db.collection('products').orderBy('name').onSnapshot(snapshot => {
        products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        renderProductsTable();
        updateDashboardStats();
    });
}

function renderProductsTable() {
    const tbody = document.querySelector('#inventory-table tbody');
    tbody.innerHTML = '';
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No products found</td></tr>';
        return;
    }
    
    products.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product.name}</td>
            <td>${product.packaging || '-'}</td>
            <td>₱${product.price?.toFixed(2) || '0.00'}</td>
            <td>${product.stock || 0}</td>
            <td>${product.masterBox || '-'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary edit-product" data-id="${product.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-product" data-id="${product.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Add event listeners to edit/delete buttons
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.getAttribute('data-id');
            editProduct(productId);
        });
    });
    
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.getAttribute('data-id');
            deleteProduct(productId);
        });
    });
}

function showProductModal(product = null) {
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');
    
    if (product) {
        title.textContent = 'Edit Product';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-packaging').value = product.packaging || '';
        document.getElementById('product-price').value = product.price || '';
        document.getElementById('product-stock').value = product.stock || '';
        document.getElementById('product-master-box').value = product.masterBox || '';
        document.getElementById('product-category').value = product.category || 'SIOMAI KING';
    } else {
        title.textContent = 'Add New Product';
        form.reset();
    }
    
    productModal.show();
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        showProductModal(product);
    }
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        db.collection('products').doc(productId).delete()
            .then(() => {
                showToast('Success', 'Product deleted successfully');
            })
            .catch(error => {
                showToast('Error', error.message, 'danger');
            });
    }
}

function saveProduct() {
    const form = document.getElementById('product-form');
    const productId = document.getElementById('product-id').value;
    const productData = {
        name: document.getElementById('product-name').value,
        packaging: document.getElementById('product-packaging').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        masterBox: document.getElementById('product-master-box').value ? 
                  parseInt(document.getElementById('product-master-box').value) : null,
        category: document.getElementById('product-category').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (!productData.name || isNaN(productData.price) || isNaN(productData.stock)) {
        showToast('Error', 'Please fill all required fields', 'danger');
        return;
    }
    
    if (productId) {
        // Update existing product
        db.collection('products').doc(productId).update(productData)
            .then(() => {
                showToast('Success', 'Product updated successfully');
                productModal.hide();
            })
            .catch(error => {
                showToast('Error', error.message, 'danger');
            });
    } else {
        // Add new product
        productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('products').add(productData)
            .then(() => {
                showToast('Success', 'Product added successfully');
                form.reset();
                productModal.hide();
            })
            .catch(error => {
                showToast('Error', error.message, 'danger');
            });
    }
}

// Delivery Management
function loadDeliveries() {
    db.collection('deliveries').orderBy('date', 'desc').onSnapshot(snapshot => {
        deliveries = [];
        snapshot.forEach(doc => {
            deliveries.push({ id: doc.id, ...doc.data() });
        });
        renderDeliveriesTable();
        updateDashboardStats();
    });
}

function renderDeliveriesTable() {
    const tbody = document.querySelector('#deliveries-table tbody');
    tbody.innerHTML = '';
    
    if (deliveries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No deliveries found</td></tr>';
        return;
    }
    
    deliveries.forEach(delivery => {
        const date = delivery.date?.toDate();
        const formattedDate = date ? formatDate(date) : '-';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formattedDate}</td>
            <td>${delivery.id.substring(0, 8)}</td>
            <td>${delivery.products?.length || 0} items</td>
            <td>${delivery.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0}</td>
            <td><span class="badge ${getStatusBadgeClass(delivery.status)}">${delivery.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-info view-delivery" data-id="${delivery.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-delivery" data-id="${delivery.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Add event listeners to view/delete buttons
    document.querySelectorAll('.view-delivery').forEach(btn => {
        btn.addEventListener('click', () => {
            const deliveryId = btn.getAttribute('data-id');
            viewDelivery(deliveryId);
        });
    });
    
    document.querySelectorAll('.delete-delivery').forEach(btn => {
        btn.addEventListener('click', () => {
            const deliveryId = btn.getAttribute('data-id');
            deleteDelivery(deliveryId);
        });
    });
}

function showDeliveryModal(delivery = null) {
    const form = document.getElementById('delivery-form');
    const productsTable = document.getElementById('delivery-products-table');
    const tbody = productsTable.querySelector('tbody');
    
    if (delivery) {
        // For viewing/editing existing delivery
        document.getElementById('delivery-date').value = formatDateForInput(delivery.date?.toDate());
        document.getElementById('delivery-status').value = delivery.status || 'Pending';
        document.getElementById('delivery-notes').value = delivery.notes || '';
        
        deliveryProducts = delivery.products || [];
    } else {
        // For new delivery
        form.reset();
        document.getElementById('delivery-date').value = formatDateForInput(new Date());
        deliveryProducts = [];
    }
    
    renderDeliveryProductsTable();
    deliveryModal.show();
}

function renderDeliveryProductsTable() {
    const tbody = document.querySelector('#delivery-products-table tbody');
    tbody.innerHTML = '';
    
    if (deliveryProducts.length === 0) {
        tbody.innerHTML = '<tr id="no-products-row"><td colspan="3" class="text-center">No products added</td></tr>';
        return;
    }
    
    deliveryProducts.forEach((product, index) => {
        const productData = products.find(p => p.id === product.productId);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${productData?.name || 'Unknown Product'}</td>
            <td>${product.quantity}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger remove-delivery-product" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-delivery-product').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'));
            deliveryProducts.splice(index, 1);
            renderDeliveryProductsTable();
        });
    });
}

function showDeliveryProductModal() {
    const select = document.getElementById('delivery-product-select');
    select.innerHTML = '<option value="">Select a product</option>';
    
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        select.appendChild(option);
    });
    
    document.getElementById('delivery-product-qty').value = '';
    deliveryProductModal.show();
}

function addProductToDelivery() {
    const productId = document.getElementById('delivery-product-select').value;
    const quantity = parseInt(document.getElementById('delivery-product-qty').value);
    
    if (!productId || isNaN(quantity) || quantity <= 0) {
        showToast('Error', 'Please select a product and enter a valid quantity', 'danger');
        return;
    }
    
    // Check if product already exists in the delivery
    const existingIndex = deliveryProducts.findIndex(p => p.productId === productId);
    
    if (existingIndex >= 0) {
        // Update existing product quantity
        deliveryProducts[existingIndex].quantity += quantity;
    } else {
        // Add new product
        deliveryProducts.push({
            productId,
            quantity
        });
    }
    
    renderDeliveryProductsTable();
    deliveryProductModal.hide();
}

function saveDelivery() {
    const date = new Date(document.getElementById('delivery-date').value);
    const status = document.getElementById('delivery-status').value;
    const notes = document.getElementById('delivery-notes').value;
    
    if (deliveryProducts.length === 0) {
        showToast('Error', 'Please add at least one product to the delivery', 'danger');
        return;
    }
    
    const deliveryData = {
        date: firebase.firestore.Timestamp.fromDate(date),
        status,
        notes,
        products: deliveryProducts,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // For simplicity, we're always adding new deliveries
    // In a real app, you might want to implement editing existing deliveries
    deliveryData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    
    db.collection('deliveries').add(deliveryData)
        .then(() => {
            showToast('Success', 'Delivery saved successfully');
            
            // Update product stocks
            const batch = db.batch();
            
            deliveryProducts.forEach(item => {
                const productRef = db.collection('products').doc(item.productId);
                batch.update(productRef, {
                    stock: firebase.firestore.FieldValue.increment(item.quantity),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            
            return batch.commit();
        })
        .then(() => {
            deliveryModal.hide();
        })
        .catch(error => {
            showToast('Error', error.message, 'danger');
        });
}

function viewDelivery(deliveryId) {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (delivery) {
        showDeliveryModal(delivery);
    }
}

function deleteDelivery(deliveryId) {
    if (confirm('Are you sure you want to delete this delivery?')) {
        db.collection('deliveries').doc(deliveryId).delete()
            .then(() => {
                showToast('Success', 'Delivery deleted successfully');
            })
            .catch(error => {
                showToast('Error', error.message, 'danger');
            });
    }
}

// Sales Management
function loadSales() {
    db.collection('sales').orderBy('date', 'desc').onSnapshot(snapshot => {
        sales = [];
        snapshot.forEach(doc => {
            sales.push({ id: doc.id, ...doc.data() });
        });
        renderSalesTable();
        updateDashboardStats();
    });
}

function renderSalesTable() {
    const tbody = document.querySelector('#sales-table tbody');
    tbody.innerHTML = '';
    
    if (sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No sales found</td></tr>';
        return;
    }
    
    sales.forEach(sale => {
        const date = sale.date?.toDate();
        const formattedDate = date ? formatDate(date) : '-';
        const totalAmount = sale.products?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formattedDate}</td>
            <td>${sale.id.substring(0, 8)}</td>
            <td>${sale.products?.length || 0} items</td>
            <td>₱${totalAmount.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-outline-info view-sale" data-id="${sale.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-sale" data-id="${sale.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Add event listeners to view/delete buttons
    document.querySelectorAll('.view-sale').forEach(btn => {
        btn.addEventListener('click', () => {
            const saleId = btn.getAttribute('data-id');
            viewSale(saleId);
        });
    });
    
    document.querySelectorAll('.delete-sale').forEach(btn => {
        btn.addEventListener('click', () => {
            const saleId = btn.getAttribute('data-id');
            deleteSale(saleId);
        });
    });
}

function showSaleModal(sale = null) {
    const form = document.getElementById('sale-form');
    const productsTable = document.getElementById('sale-products-table');
    const tbody = productsTable.querySelector('tbody');
    
    if (sale) {
        // For viewing/editing existing sale
        document.getElementById('sale-date').value = formatDateForInput(sale.date?.toDate());
        document.getElementById('sale-customer').value = sale.customer || '';
        
        saleProducts = sale.products || [];
    } else {
        // For new sale
        form.reset();
        document.getElementById('sale-date').value = formatDateForInput(new Date());
        saleProducts = [];
    }
    
    renderSaleProductsTable();
    saleModal.show();
}

function renderSaleProductsTable() {
    const tbody = document.querySelector('#sale-products-table tbody');
    tbody.innerHTML = '';
    
    if (saleProducts.length === 0) {
        tbody.innerHTML = '<tr id="no-sale-products-row"><td colspan="5" class="text-center">No products added</td></tr>';
        document.getElementById('sale-total-amount').textContent = '₱0.00';
        return;
    }
    
    let totalAmount = 0;
    
    saleProducts.forEach((product, index) => {
        const productData = products.find(p => p.id === product.productId);
        const productTotal = product.quantity * product.unitPrice;
        totalAmount += productTotal;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${productData?.name || 'Unknown Product'}</td>
            <td>${product.quantity}</td>
            <td>₱${product.unitPrice.toFixed(2)}</td>
            <td>₱${productTotal.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger remove-sale-product" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('sale-total-amount').textContent = `₱${totalAmount.toFixed(2)}`;
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-sale-product').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'));
            saleProducts.splice(index, 1);
            renderSaleProductsTable();
        });
    });
}

function showSaleProductModal() {
    const select = document.getElementById('sale-product-select');
    select.innerHTML = '<option value="">Select a product</option>';
    
    products.forEach(product => {
        if (product.stock > 0) { // Only show products with available stock
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (Stock: ${product.stock})`;
            option.setAttribute('data-price', product.price);
            select.appendChild(option);
        }
    });
    
    document.getElementById('sale-product-qty').value = '';
    document.getElementById('sale-product-price').value = '';
    saleProductModal.show();
    
    // Auto-fill price when product is selected
    select.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.value) {
            const price = parseFloat(selectedOption.getAttribute('data-price'));
            document.getElementById('sale-product-price').value = price.toFixed(2);
        }
    });
}

function addProductToSale() {
    const productId = document.getElementById('sale-product-select').value;
    const quantity = parseInt(document.getElementById('sale-product-qty').value);
    const unitPrice = parseFloat(document.getElementById('sale-product-price').value);
    
    if (!productId || isNaN(quantity) || quantity <= 0 || isNaN(unitPrice) || unitPrice <= 0) {
        showToast('Error', 'Please fill all fields with valid values', 'danger');
        return;
    }
    
    // Check if product has enough stock
    const product = products.find(p => p.id === productId);
    if (!product || product.stock < quantity) {
        showToast('Error', 'Not enough stock for this product', 'danger');
        return;
    }
    
    // Check if product already exists in the sale
    const existingIndex = saleProducts.findIndex(p => p.productId === productId);
    
    if (existingIndex >= 0) {
        // Update existing product
        saleProducts[existingIndex].quantity += quantity;
        saleProducts[existingIndex].total = saleProducts[existingIndex].quantity * saleProducts[existingIndex].unitPrice;
    } else {
        // Add new product
        saleProducts.push({
            productId,
            quantity,
            unitPrice,
            total: quantity * unitPrice
        });
    }
    
    renderSaleProductsTable();
    saleProductModal.hide();
}

function saveSale() {
    const date = new Date(document.getElementById('sale-date').value);
    const customer = document.getElementById('sale-customer').value;
    
    if (saleProducts.length === 0) {
        showToast('Error', 'Please add at least one product to the sale', 'danger');
        return;
    }
    
    const saleData = {
        date: firebase.firestore.Timestamp.fromDate(date),
        customer: customer || null,
        products: saleProducts,
        totalAmount: saleProducts.reduce((sum, p) => sum + p.total, 0),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // For simplicity, we're always adding new sales
    // In a real app, you might want to implement editing existing sales
    saleData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    
    // First, check if all products have enough stock
    const stockChecks = saleProducts.map(item => {
        return db.collection('products').doc(item.productId).get()
            .then(doc => {
                const currentStock = doc.data().stock;
                if (currentStock < item.quantity) {
                    throw new Error(`Not enough stock for ${doc.data().name}`);
                }
            });
    });
    
    Promise.all(stockChecks)
        .then(() => {
            // All products have enough stock, proceed with sale
            return db.collection('sales').add(saleData);
        })
        .then(() => {
            // Update product stocks
            const batch = db.batch();
            
            saleProducts.forEach(item => {
                const productRef = db.collection('products').doc(item.productId);
                batch.update(productRef, {
                    stock: firebase.firestore.FieldValue.increment(-item.quantity),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            
            return batch.commit();
        })
        .then(() => {
            showToast('Success', 'Sale recorded successfully');
            saleModal.hide();
        })
        .catch(error => {
            showToast('Error', error.message, 'danger');
        });
}

function viewSale(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
        showSaleModal(sale);
    }
}

function deleteSale(saleId) {
    if (confirm('Are you sure you want to delete this sale?')) {
        db.collection('sales').doc(saleId).delete()
            .then(() => {
                showToast('Success', 'Sale deleted successfully');
            })
            .catch(error => {
                showToast('Error', error.message, 'danger');
            });
    }
}

// Returns Management
function loadReturns() {
    db.collection('returns').orderBy('date', 'desc').onSnapshot(snapshot => {
        returns = [];
        snapshot.forEach(doc => {
            returns.push({ id: doc.id, ...doc.data() });
        });
        renderReturnsTable();
        updateDashboardStats();
    });
}

function renderReturnsTable() {
    const tbody = document.querySelector('#returns-table tbody');
    tbody.innerHTML = '';
    
    if (returns.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No returns found</td></tr>';
        return;
    }
    
    returns.forEach(ret => {
        const date = ret.date?.toDate();
        const formattedDate = date ? formatDate(date) : '-';
        const product = products.find(p => p.id === ret.productId);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formattedDate}</td>
            <td>${ret.id.substring(0, 8)}</td>
            <td>${product?.name || 'Unknown Product'}</td>
            <td>${ret.quantity}</td>
            <td>${ret.reason}</td>
            <td><span class="badge ${getStatusBadgeClass(ret.status)}">${ret.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-info view-return" data-id="${ret.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-return" data-id="${ret.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Add event listeners to view/delete buttons
    document.querySelectorAll('.view-return').forEach(btn => {
        btn.addEventListener('click', () => {
            const returnId = btn.getAttribute('data-id');
            viewReturn(returnId);
        });
    });
    
    document.querySelectorAll('.delete-return').forEach(btn => {
        btn.addEventListener('click', () => {
            const returnId = btn.getAttribute('data-id');
            deleteReturn(returnId);
        });
    });
}

function showReturnModal(ret = null) {
    const form = document.getElementById('return-form');
    const productSelect = document.getElementById('return-product');
    
    // Populate product select
    productSelect.innerHTML = '<option value="">Select a product</option>';
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        productSelect.appendChild(option);
    });
    
    if (ret) {
        // For viewing/editing existing return
        document.getElementById('return-date').value = formatDateForInput(ret.date?.toDate());
        document.getElementById('return-status').value = ret.status || 'Pending';
        document.getElementById('return-product').value = ret.productId;
        document.getElementById('return-qty').value = ret.quantity;
        document.getElementById('return-reason').value = ret.reason;
        document.getElementById('return-notes').value = ret.notes || '';
    } else {
        // For new return
        form.reset();
        document.getElementById('return-date').value = formatDateForInput(new Date());
    }
    
    returnModal.show();
}

function saveReturn() {
    const date = new Date(document.getElementById('return-date').value);
    const status = document.getElementById('return-status').value;
    const productId = document.getElementById('return-product').value;
    const quantity = parseInt(document.getElementById('return-qty').value);
    const reason = document.getElementById('return-reason').value;
    const notes = document.getElementById('return-notes').value;
    
    if (!productId || isNaN(quantity) || quantity <= 0 || !reason) {
        showToast('Error', 'Please fill all required fields with valid values', 'danger');
        return;
    }
    
    const returnData = {
        date: firebase.firestore.Timestamp.fromDate(date),
        status,
        productId,
        quantity,
        reason,
        notes: notes || null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // For simplicity, we're always adding new returns
    // In a real app, you might want to implement editing existing returns
    returnData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    
    db.collection('returns').add(returnData)
        .then(() => {
            showToast('Success', 'Return recorded successfully');
            
            // If return is processed, update product stock
            if (status === 'Processed') {
                return db.collection('products').doc(productId).update({
                    stock: firebase.firestore.FieldValue.increment(quantity),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        })
        .then(() => {
            returnModal.hide();
        })
        .catch(error => {
            showToast('Error', error.message, 'danger');
        });
}

function viewReturn(returnId) {
    const ret = returns.find(r => r.id === returnId);
    if (ret) {
        showReturnModal(ret);
    }
}

function deleteReturn(returnId) {
    if (confirm('Are you sure you want to delete this return?')) {
        db.collection('returns').doc(returnId).delete()
            .then(() => {
                showToast('Success', 'Return deleted successfully');
            })
            .catch(error => {
                showToast('Error', error.message, 'danger');
            });
    }
}

// Dashboard Functions
function updateDashboardStats() {
    // Total products
    document.getElementById('total-products').textContent = products.length;
    
    // Today's deliveries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysDeliveries = deliveries.filter(d => {
        const deliveryDate = d.date?.toDate();
        return deliveryDate && deliveryDate >= today;
    });
    
    document.getElementById('today-deliveries').textContent = todaysDeliveries.length;
    
    // Today's sales
    const todaysSales = sales.filter(s => {
        const saleDate = s.date?.toDate();
        return saleDate && saleDate >= today;
    });
    
    const todaysSalesTotal = todaysSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    document.getElementById('today-sales').textContent = `₱${todaysSalesTotal.toFixed(2)}`;
    
    // Today's returns
    const todaysReturns = returns.filter(r => {
        const returnDate = r.date?.toDate();
        return returnDate && returnDate >= today;
    });
    
    document.getElementById('today-returns').textContent = todaysReturns.length;
    
    // Recent deliveries (last 5)
    const recentDeliveries = deliveries.slice(0, 5);
    const recentDeliveriesTbody = document.getElementById('recent-deliveries');
    recentDeliveriesTbody.innerHTML = '';
    
    recentDeliveries.forEach(delivery => {
        const date = delivery.date?.toDate();
        const formattedDate = date ? formatDate(date) : '-';
        const firstProduct = delivery.products?.[0];
        const product = firstProduct ? products.find(p => p.id === firstProduct.productId) : null;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formattedDate}</td>
            <td>${product?.name || 'Multiple items'}</td>
            <td>${firstProduct?.quantity || delivery.products?.length || 0}</td>
            <td><span class="badge ${getStatusBadgeClass(delivery.status)}">${delivery.status}</span></td>
        `;
        recentDeliveriesTbody.appendChild(tr);
    });
    
    // Low stock items (stock < 10)
    const lowStockItems = products.filter(p => p.stock < 10).slice(0, 5);
    const lowStockItemsTbody = document.getElementById('low-stock-items');
    lowStockItemsTbody.innerHTML = '';
    
    lowStockItems.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product.name}</td>
            <td>${product.stock}</td>
            <td><span class="badge bg-danger">Low</span></td>
        `;
        lowStockItemsTbody.appendChild(tr);
    });
}

// Helper Functions
function formatDate(date) {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateForInput(date) {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Delivered':
        case 'Processed':
            return 'bg-success';
        case 'Pending':
            return 'bg-warning text-dark';
        case 'Cancelled':
        case 'Rejected':
            return 'bg-danger';
        case 'In Transit':
            return 'bg-info';
        default:
            return 'bg-secondary';
    }
}

function showToast(title, message, type = 'success') {
    const toast = document.getElementById('toast-notification');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    
    // Set toast style based on type
    toast.className = `toast ${type}`;
    
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    toastNotification.show();
}

// Initialize the dashboard as the default view
function initDefaultView() {
    showSection('dashboard');
}