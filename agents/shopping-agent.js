const { ethers } = require("ethers");

/**
 * Shopping Agent - Intent Creation Service
 * Responsibility: Create payment intents from user shopping behavior
 * NO blockchain interaction - pure business logic
 */
class ShoppingAgent {
    constructor() {
        this.intentCounter = 0;
    }

    /**
     * Create a payment intent from shopping cart
     * @param {Object} cartData - Shopping cart information
     * @returns {Object} Payment intent
     */
    createIntent(cartData) {
        const { productId, amount, merchant, currency = "USDC" } = cartData;

        // Generate unique intent ID
        const intentId = this.generateIntentId(productId);

        // Set expiry (1 hour from now)
        const expiry = Math.floor(Date.now() / 1000) + 3600;

        const intent = {
            intent_id: intentId,
            product_id: productId,
            amount: amount,
            currency: currency,
            merchant: merchant,
            expiry: expiry,
            created_at: new Date().toISOString()
        };

        console.log("🛒 Shopping Agent: Intent created");
        console.log(JSON.stringify(intent, null, 2));

        return intent;
    }

    /**
     * Generate unique intent ID
     * @param {string} productId - Product identifier
     * @returns {string} Intent ID bytes32
     */
    generateIntentId(productId) {
        this.intentCounter++;
        const data = `INT-${Date.now()}-${productId}-${this.intentCounter}`;
        return ethers.id(data); // keccak256 hash as bytes32
    }
}

module.exports = ShoppingAgent;
