const { ethers } = require("ethers");

/**
 * Credentials Provider Agent - AP2 Authorization Layer
 * Responsibility: User authorization and signature capture
 * THIS IS WHERE USER APPROVAL HAPPENS - CRITICAL SECURITY CHECKPOINT
 */
class CredentialsProviderAgent {
    constructor(userPrivateKey, provider, paymentProcessorAddress) {
        this.wallet = new ethers.Wallet(userPrivateKey, provider);
        this.paymentProcessorAddress = paymentProcessorAddress;
        console.log("🔐 Credentials Provider: User wallet ready:", this.wallet.address);
    }

    /**
     * Present authorization request to user and capture signature
     * @param {Object} intent - Payment intent
     * @param {Object} mandate - Merchant's signed mandate
     * @param {Object} paymentProcessor - PaymentProcessor contract instance
     * @returns {Object} User authorization with signature
     */
    async authorizePayment(intent, mandate, paymentProcessor) {
        console.log("\n🔐 Credentials Provider: AP2 AUTHORIZATION CHECKPOINT");
        console.log("=".repeat(60));

        // Present to user (in real app, this would be a UI)
        console.log("📋 Authorization Request:");
        console.log(`   Merchant: ${mandate.merchant}`);
        console.log(`   Amount: ${intent.amount} ${intent.currency}`);
        console.log(`   Product: ${intent.product_id}`);
        console.log(`   Expires: ${new Date(intent.expiry * 1000).toISOString()}`);

        // Get current nonce from contract
        const nonce = await paymentProcessor.getNonce(this.wallet.address);

        // Prepare message to sign (matches contract's getMessageHash)
        const messageHash = ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(
                ["bytes32", "address", "address", "uint256", "bytes32", "uint256", "uint256"],
                [
                    intent.intent_id,
                    this.wallet.address,
                    mandate.merchant,
                    ethers.parseUnits(intent.amount, 6), // Convert to 6 decimals
                    mandate.mandate_hash,
                    intent.expiry,
                    nonce
                ]
            )
        );

        // User signs the authorization (AP2 signature)
        // Need to use ethSignedMessageHash format to match contract's toEthSignedMessageHash
        console.log("\n✍️  User signing authorization...");
        const messageHashBytes = ethers.getBytes(messageHash);
        const signature = await this.wallet.signMessage(messageHashBytes);

        const authorization = {
            intent_id: intent.intent_id,
            user: this.wallet.address,
            merchant: mandate.merchant,
            amount: intent.amount,
            amount_raw: ethers.parseUnits(intent.amount, 6).toString(),
            mandate_hash: mandate.mandate_hash,
            expiry: intent.expiry,
            nonce: nonce.toString(),
            user_signature: signature,
            message_hash: messageHash,
            authorized_at: new Date().toISOString()
        };

        console.log("✅ User Authorization Captured");
        console.log("   Signature:", signature.substring(0, 20) + "...");
        console.log("=".repeat(60));

        return authorization;
    }

    /**
     * Simulate user rejecting authorization (for failure demos)
     * @returns {Object} Rejection response
     */
    rejectAuthorization() {
        console.log("\n❌ Credentials Provider: User REJECTED authorization");
        return {
            authorized: false,
            reason: "User declined authorization",
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get user address
     * @returns {string} User wallet address
     */
    getAddress() {
        return this.wallet.address;
    }
}

module.exports = CredentialsProviderAgent;
