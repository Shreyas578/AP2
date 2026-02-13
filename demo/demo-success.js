require("dotenv").config();
const { ethers } = require("ethers");
const ShoppingAgent = require("../agents/shopping-agent");
const MerchantAgent = require("../agents/merchant-agent");
const CredentialsProviderAgent = require("../agents/credentials-provider");
const SettlementAgent = require("../agents/settlement-agent");
const ReceiptGenerator = require("../agents/receipt-generator");

// Load contract ABIs
const PaymentProcessorABI = require("../artifacts/contracts/PaymentProcessor.sol/PaymentProcessor.json").abi;
const ReceiptRegistryABI = require("../artifacts/contracts/ReceiptRegistry.sol/ReceiptRegistry.json").abi;

/**
 * SUCCESS FLOW DEMONSTRATION
 * Shows complete journey: Intent → Mandate → Authorization → Settlement → Receipt
 */
async function runSuccessDemo() {
    console.log("\n");
    console.log("🎯".repeat(35));
    console.log("AP2 + x402 PAYMENT SYSTEM - SUCCESS FLOW DEMO");
    console.log("🎯".repeat(35));
    console.log("\n");

    try {
        // Configuration
        const config = {
            rpcUrl: process.env.BASE_SEPOLIA_RPC,
            chainId: 84532,
            usdcAddress: process.env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541ec2318f3dCF7e",
            paymentProcessorAddress: process.env.PAYMENT_PROCESSOR_ADDRESS,
            receiptRegistryAddress: process.env.RECEIPT_REGISTRY_ADDRESS,
            merchantPrivateKey: process.env.MERCHANT_PRIVATE_KEY,
            userPrivateKey: process.env.USER_PRIVATE_KEY,
            demoAmount: process.env.DEMO_AMOUNT || "50"
        };

        // Validate configuration
        if (!config.paymentProcessorAddress || !config.receiptRegistryAddress) {
            throw new Error("Contract addresses not set. Run deployment first!");
        }

        // Setup provider
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        const userWallet = new ethers.Wallet(config.userPrivateKey, provider);
        const merchantWallet = new ethers.Wallet(config.merchantPrivateKey, provider);

        console.log("🌐 Network: Base Sepolia (Chain ID: 84532)");
        console.log("💵 USDC:", config.usdcAddress);
        console.log("👤 User:", userWallet.address);
        console.log("🏪 Merchant:", merchantWallet.address);
        console.log("\n");

        // ========================================================================
        // STEP 1: Shopping Agent - Create Intent
        // ========================================================================
        const shoppingAgent = new ShoppingAgent();
        const intent = shoppingAgent.createIntent({
            productId: "SKU-PREMIUM-COFFEE-123",
            amount: config.demoAmount,
            merchant: merchantWallet.address
        });

        // ========================================================================
        // STEP 2: Merchant Agent - Create Signed Mandate
        // ========================================================================
        const merchantAgent = new MerchantAgent(config.merchantPrivateKey);
        const mandate = await merchantAgent.createMandate(intent);

        // ========================================================================
        // STEP 3: Credentials Provider - AP2 Authorization
        // ========================================================================
        const paymentProcessor = new ethers.Contract(
            config.paymentProcessorAddress,
            PaymentProcessorABI,
            provider
        );

        const credentialsProvider = new CredentialsProviderAgent(
            config.userPrivateKey,
            provider,
            config.paymentProcessorAddress
        );

        const authorization = await credentialsProvider.authorizePayment(
            intent,
            mandate,
            paymentProcessor
        );

        // ========================================================================
        // STEP 4: Settlement Agent - Execute x402 Settlement
        // ========================================================================
        const settlementAgent = new SettlementAgent(
            provider,
            config.paymentProcessorAddress,
            PaymentProcessorABI
        );

        const settlementResult = await settlementAgent.executeSettlement(
            authorization,
            userWallet
        );

        if (!settlementResult.success) {
            throw new Error(`Settlement failed: ${settlementResult.reason}`);
        }

        // ========================================================================
        // STEP 5: Receipt Generator - Create and Store Receipt
        // ========================================================================
        const receiptGenerator = new ReceiptGenerator(
            provider,
            config.receiptRegistryAddress,
            ReceiptRegistryABI
        );

        const receipt = receiptGenerator.generateSuccessReceipt(
            authorization,
            settlementResult,
            config
        );

        // Store on-chain
        await receiptGenerator.storeOnChain(receipt, userWallet);

        // Display final receipt
        receiptGenerator.displayReceipt(receipt);

        console.log("✅ SUCCESS DEMO COMPLETED!\n");
        console.log("🔍 Verify on BaseScan:");
        console.log(`   https://sepolia.basescan.org/tx/${settlementResult.txHash}\n`);

    } catch (error) {
        console.error("\n❌ Demo failed:", error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the demo
runSuccessDemo()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
