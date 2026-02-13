// Shopping Cart Implementation

class ShoppingCart {
    constructor() {
        this.items = [];
        this.loadFromStorage();
    }

    addItem(productId, quantity = 1) {
        const product = CONFIG.PRODUCTS[productId];
        if (!product) {
            console.error('Product not found:', productId);
            return false;
        }

        const existingItem = this.items.find(item => item.productId === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                productId,
                name: product.name,
                price: product.price,
                sku: product.sku,
                quantity
            });
        }

        this.saveToStorage();
        return true;
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.productId !== productId);
        this.saveToStorage();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(i => i.productId === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveToStorage();
            }
        }
    }

    getItems() {
        return this.items;
    }

    getItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    getTotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    clear() {
        this.items = [];
        this.saveToStorage();
    }

    saveToStorage() {
        try {
            localStorage.setItem('ap2_shopping_cart', JSON.stringify(this.items));
        } catch (error) {
            console.error('Failed to save cart:', error);
        }
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('ap2_shopping_cart');
            if (stored) {
                this.items = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load cart:', error);
            this.items = [];
        }
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.ShoppingCart = ShoppingCart;
}
