class ShoppingCart {
    constructor() {
        this.items = this.loadCart();
        this.renderCart();
    }

    loadCart() {
        const cart = sessionStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    }

    saveCart() {
        sessionStorage.setItem('cart', JSON.stringify(this.items));
    }

    updateQuantity(uuid, newQuantity) {
        const item = this.items.find(i => i.uuid === uuid);
        if (item) {
            item.quantity = Math.max(1, newQuantity);
            this.saveCart();
            this.renderCart();
        }
    }

    removeItem(uuid) {
        try {
            this.items = this.items.filter(item => item.uuid !== uuid);
            this.saveCart();
            this.renderCart();
        } catch (error) {
            console.error('Error removing item:', error);
        }
    }

    clearCart() {
        if (confirm('¿Está seguro de que desea vaciar el carrito?')) {
            this.items = [];
            this.saveCart();
            this.renderCart();
        }
    }

    calculateTotal() {
        return this.items.reduce((total, item) => total + (item.pricePerUnit * item.quantity), 0);
    }

    addToCart(product, quantity = 1) {
        const existingItem = this.items.find(item => item.uuid === product.uuid);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                ...product,
                quantity: quantity
            });
        }
        this.saveCart();
        this.renderCart();
        this.showToast(`${product.title} agregado al carrito (Cantidad: ${quantity})`);
    }

    showToast(message) {
        const toast = `
            <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
                <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header">
                        <strong class="me-auto">Carrito</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">${message}</div>
                </div>
            </div>
        `;
        
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', toast);
        
        setTimeout(() => {
            const newToast = document.querySelector('.toast');
            if (newToast) {
                newToast.remove();
            }
        }, 3000);
    }

    updateCartIcon() {
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        const cartIcon = document.querySelector('.fa-shopping-cart');
        const badge = document.querySelector('.cart-badge');
        
        if (totalItems > 0) {
            if (!badge) {
                cartIcon.insertAdjacentHTML('afterend', 
                    `<span class="badge bg-danger cart-badge">${totalItems}</span>`);
            } else {
                badge.textContent = totalItems;
            }
        } else if (badge) {
            badge.remove();
        }
    }

    renderCart() {
        this.updateCartIcon();
        
        const cartContainer = document.getElementById('cart-items');
        const summaryContainer = document.getElementById('cart-summary');
        
        if (!cartContainer || !summaryContainer) return; // No estamos en la página del carrito
        
        if (this.items.length === 0) {
            cartContainer.innerHTML = `
                <div class="alert alert-info" role="alert">
                    El carrito está vacío
                </div>
            `;
            summaryContainer.innerHTML = '';
            document.getElementById('cart-total').textContent = '0.00';
            return;
        }

        // Resto del código de renderizado del carrito...
        // (El mismo que tenías en shopping_cart.html)
    }
}

function startEdit(uuid) {
    // ... tu código existente de startEdit
}

function confirmEdit(uuid) {
    // ... tu código existente de confirmEdit
}

function cancelEdit(uuid) {
    // ... tu código existente de cancelEdit
}

function resetEditUI(uuid) {
    // ... tu código existente de resetEditUI
}

function updateQuantityInEdit(uuid, change) {
    // ... tu código existente de updateQuantityInEdit
}

function checkout() {
    if (!cart.items.length) {
        alert('El carrito está vacío');
        return;
    }
    alert('Procesando pago...');
}

// Inicializar el carrito cuando se carga la página
const cart = new ShoppingCart();