const { ethers } = require("ethers");

/**
 * Merchant Agent - Mandate Creation Service
 * Responsibility: Create and sign cart mandates
 */
class MerchantAgent {
    constructor(merchantPrivateKey) {
        this.wallet = new ethers.Wallet(merchantPrivateKey);
        console.log("🏪 Merchant Agent initialized:", this.wallet.address);
    }

    /**
     * Create a signed cart mandate
     * @param {Object} intent - Payment intent from shopping agent
     * @returns {Object} Signed mandate
     */
    async createMandate(intent) {
        // Create mandate data
        const mandateData = {
            intent_id: intent.intent_id,
            merchant: this.wallet.address,
            amount: intent.amount,
            currency: intent.currency,
            expiry: intent.expiry
        };

        // Generate mandate hash
        const mandateHash = this.generateMandateHash(mandateData);

        // Sign the mandate
        const signature = await this.wallet.signMessage(ethers.getBytes(mandateHash));

        const mandate = {
            ...mandateData,
            mandate_hash: mandateHash,
            merchant_signature: signature,
            signed_at: new Date().toISOString()
        };

        console.log("\n🏪 Merchant Agent: Mandate created and signed");
        console.log("   Mandate Hash:", mandateHash);
        console.log("   Merchant:", this.wallet.address);

        return mandate;
    }

    /**
     * Generate mandate hash
     * @param {Object} mandateData - Mandate information
     * @returns {string} Mandate hash (bytes32)
     */
    generateMandateHash(mandateData) {
        const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
            ["bytes32", "address", "string", "string", "uint256"],
            [
                mandateData.intent_id,
                mandateData.merchant,
                mandateData.amount,
                mandateData.currency,
                mandateData.expiry
            ]
        );
        return ethers.keccak256(encoded);
    }

    /**
     * Get merchant address
     * @returns {string} Merchant wallet address
     */
    getAddress() {
        return this.wallet.address;
    }
}

module.exports = MerchantAgent;
