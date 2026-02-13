const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

/**
 * Receipt Generator - Audit Trail Service
 * Responsibility: Generate and store structured receipts
 */
class ReceiptGenerator {
    constructor(provider, receiptRegistryAddress, receiptRegistryAbi) {
        this.provider = provider;
        this.receiptRegistryAddress = receiptRegistryAddress;
        this.receiptRegistryAbi = receiptRegistryAbi;

        // Ensure receipts directory exists
        this.receiptsDir = path.join(__dirname, "..", "demo", "receipts");
        if (!fs.existsSync(this.receiptsDir)) {
            fs.mkdirSync(this.receiptsDir, { recursive: true });
        }

        console.log("🧾 Receipt Generator initialized");
    }

    /**
     * Generate success receipt
     * @param {Object} authorization - User authorization
     * @param {Object} settlementResult - Settlement transaction result
     * @param {Object} config - Network and contract configuration
     * @returns {Object} Structured receipt
     */
    generateSuccessReceipt(authorization, settlementResult, config) {
        const receipt = {
            intent_id: authorization.intent_id,
            chain: "Base Sepolia",
            chain_id: 84532,
            usdc_contract: config.usdcAddress,
            user: authorization.user,
            merchant: authorization.merchant,
            authorized_amount: `${ethers.formatUnits(authorization.amount_raw, 6)} USDC`,
            amount_raw: authorization.amount_raw,
            settlement_tx: settlementResult.txHash,
            block_number: settlementResult.blockNumber,
            processor_contract: config.paymentProcessorAddress,
            receipt_contract: config.receiptRegistryAddress,
            mandate_hash: authorization.mandate_hash,
            authorized_signature: authorization.user_signature,
            status: "SUCCESS",
            timestamp: new Date().toISOString()
        };

        console.log("\n🧾 Receipt Generator: SUCCESS receipt created");
        this.saveReceipt(receipt);

        return receipt;
    }

    /**
     * Generate failure receipt
     * @param {Object} authorization - User authorization (may be partial)
     * @param {string} failureReason - Reason for failure
     * @param {Object} error - Error details
     * @returns {Object} Failure receipt
     */
    generateFailureReceipt(authorization, failureReason, error = null) {
        const receipt = {
            intent_id: authorization.intent_id || "UNKNOWN",
            chain: "Base Sepolia",
            chain_id: 84532,
            status: "FAILED",
            failure_reason: failureReason,
            user: authorization.user || null,
            merchant: authorization.merchant || null,
            attempted_amount: authorization.amount || null,
            error_message: error ? error.message : null,
            timestamp: new Date().toISOString()
        };

        console.log("\n🧾 Receipt Generator: FAILURE receipt created");
        console.log(`   Reason: ${failureReason}`);
        this.saveReceipt(receipt);

        return receipt;
    }

    /**
     * Store receipt on-chain (ReceiptRegistry contract)
     * @param {Object} receipt - Receipt data
     * @param {Object} wallet - Wallet to submit transaction
     */
    async storeOnChain(receipt, wallet) {
        if (receipt.status !== "SUCCESS") {
            console.log("   ⚠️  Failure receipts not stored on-chain");
            return;
        }

        try {
            console.log("\n📝 Storing receipt on-chain...");

            const receiptRegistry = new ethers.Contract(
                this.receiptRegistryAddress,
                this.receiptRegistryAbi,
                wallet
            );

            const tx = await receiptRegistry.createReceipt(
                receipt.intent_id,
                receipt.user,
                receipt.merchant,
                receipt.amount_raw,
                receipt.settlement_tx,
                receipt.status
            );

            console.log("   TX Hash:", tx.hash);
            const txReceipt = await tx.wait();
            console.log("✅ Receipt stored on-chain at block:", txReceipt.blockNumber);

        } catch (error) {
            console.log("   ⚠️  Failed to store receipt on-chain:", error.message);
        }
    }

    /**
     * Save receipt to file system
     * @param {Object} receipt - Receipt data
     */
    saveReceipt(receipt) {
        const filename = `${receipt.status.toLowerCase()}_${Date.now()}.json`;
        const filepath = path.join(this.receiptsDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(receipt, null, 2));
        console.log(`   📄 Saved to: ${filepath}`);
    }

    /**
     * Display receipt
     * @param {Object} receipt - Receipt data
     */
    displayReceipt(receipt) {
        console.log("\n" + "=".repeat(70));
        console.log("📋 PAYMENT RECEIPT");
        console.log("=".repeat(70));
        console.log(JSON.stringify(receipt, null, 2));
        console.log("=".repeat(70) + "\n");
    }
}

module.exports = ReceiptGenerator;
