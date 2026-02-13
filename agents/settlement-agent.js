const { ethers } = require("ethers");

/**
 * Settlement Agent - x402 Settlement Executor
 * Responsibility: Execute authorized USDC settlements on-chain
 */
class SettlementAgent {
    constructor(provider, paymentProcessorAddress, paymentProcessorAbi) {
        this.provider = provider;
        this.paymentProcessorAddress = paymentProcessorAddress;
        this.paymentProcessorAbi = paymentProcessorAbi;
        console.log("💸 Settlement Agent initialized");
        console.log("   Processor:", paymentProcessorAddress);
    }

    /**
     * Execute settlement on Base Sepolia
     * @param {Object} authorization - User authorization with signature
     * @param {Object} userWallet - User wallet for transaction submission
     * @returns {Object} Settlement result with transaction details
     */
    async executeSettlement(authorization, userWallet) {
        console.log("\n💸 Settlement Agent: EXECUTING x402 SETTLEMENT");
        console.log("=".repeat(60));

        try {
            // Connect to PaymentProcessor contract
            const paymentProcessor = new ethers.Contract(
                this.paymentProcessorAddress,
                this.paymentProcessorAbi,
                userWallet
            );

            console.log("📝 Verifying authorization before settlement...");
            console.log(`   Intent ID: ${authorization.intent_id}`);
            console.log(`   User: ${authorization.user}`);
            console.log(`   Merchant: ${authorization.merchant}`);
            console.log(`   Amount: ${ethers.formatUnits(authorization.amount_raw, 6)} USDC`);

            // Execute settlement transaction
            console.log("\n🔄 Submitting settlement transaction...");
            const tx = await paymentProcessor.executeSettlement(
                authorization.intent_id,
                authorization.user,
                authorization.merchant,
                authorization.amount_raw,
                authorization.mandate_hash,
                authorization.expiry,
                authorization.user_signature
            );

            console.log("   TX Hash:", tx.hash);
            console.log("   Waiting for confirmation...");

            const receipt = await tx.wait();

            console.log("✅ Settlement Executed Successfully!");
            console.log(`   Block: ${receipt.blockNumber}`);
            console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);

            // Parse settlement event
            const event = receipt.logs.find(log => {
                try {
                    const parsed = paymentProcessor.interface.parseLog(log);
                    return parsed.name === "SettlementExecuted";
                } catch {
                    return false;
                }
            });

            let eventData = null;
            if (event) {
                const parsed = paymentProcessor.interface.parseLog(event);
                eventData = {
                    intentId: parsed.args.intentId,
                    user: parsed.args.user,
                    merchant: parsed.args.merchant,
                    amount: parsed.args.amount.toString(),
                    mandateHash: parsed.args.mandateHash
                };
                console.log("   Event: SettlementExecuted emitted");
            }

            console.log("=".repeat(60));

            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                event: eventData,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.log("❌ Settlement Failed!");
            console.log("   Error:", error.message);
            console.log("=".repeat(60));

            return {
                success: false,
                error: error.message,
                reason: this.parseErrorReason(error),
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Parse error reason from contract revert
     * @param {Error} error - Error object
     * @returns {string} Human-readable error reason
     */
    parseErrorReason(error) {
        const message = error.message.toLowerCase();

        if (message.includes("expired")) {
            return "AUTHORIZATION_EXPIRED";
        } else if (message.includes("signature")) {
            return "INVALID_SIGNATURE";
        } else if (message.includes("already executed")) {
            return "REPLAY_ATTACK_PREVENTED";
        } else if (message.includes("transfer failed") || message.includes("insufficient")) {
            return "INSUFFICIENT_ALLOWANCE_OR_BALANCE";
        } else {
            return "SETTLEMENT_FAILED";
        }
    }

    /**
     * Verify settlement prerequisites
     * @param {string} userAddress - User address
     * @param {string} amount - Amount in smallest unit
     * @returns {Object} Verification result
     */
    async verifyPrerequisites(userAddress, amount) {
        // This would check USDC balance and allowance
        // Simplified for demo purposes
        return {
            hasBalance: true,
            hasAllowance: true,
            ready: true
        };
    }
}

module.exports = SettlementAgent;
