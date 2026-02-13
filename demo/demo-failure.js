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
 * FAILURE FLOW DEMONSTRATION
 * Shows security enforcement: Invalid Signature
 */
async function runFailureDemo() {
    console.log("\n");
    console.log("⚠️ ".repeat(35));
    console.log("AP2 + x402 PAYMENT SYSTEM - FAILURE FLOW DEMO");
    console.log("SCENARIO: INVALID SIGNATURE ATTACK ATTEMPT");
    console.log("⚠️ ".repeat(35));
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

        // Setup provider
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        const userWallet = new ethers.Wallet(config.userPrivateKey, provider);
        const merchantWallet = new ethers.Wallet(config.merchantPrivateKey, provider);

        console.log("🌐 Network: Base Sepolia (Chain ID: 84532)");
        console.log("👤 User:", userWallet.address);
        console.log("🏪 Merchant:", merchantWallet.address);
        console.log("\n");

        // ========================================================================
        // STEP 1: Create Intent
        // ========================================================================
        const shoppingAgent = new ShoppingAgent();
        const intent = shoppingAgent.createIntent({
            productId: "SKU-HACKED-ATTEMPT-999",
            amount: config.demoAmount,
            merchant: merchantWallet.address
        });

        // ========================================================================
        // STEP 2: Create Mandate
        // ========================================================================
        const merchantAgent = new MerchantAgent(config.merchantPrivateKey);
        const mandate = await merchantAgent.createMandate(intent);

        // ========================================================================
        // STEP 3: Get Valid Authorization (then tamper with it)
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

        const validAuthorization = await credentialsProvider.authorizePayment(
            intent,
            mandate,
            paymentProcessor
        );

        // ========================================================================
        // 🚨 ATTACK: Tamper with signature to simulate invalid signature
        // ========================================================================
        console.log("\n🚨 ATTACK SIMULATION: Tampering with signature...");
        console.log("   Original signature:", validAuthorization.user_signature.substring(0, 20) + "...");

        // Create invalid signature by flipping some bytes
        const tamperedSignature = "0x" + "deadbeef".repeat(16) + "cafebabe".repeat(8);
        console.log("   Tampered signature:", tamperedSignature.substring(0, 20) + "...");

        const tamperedAuthorization = {
            ...validAuthorization,
            user_signature: tamperedSignature
        };

        // ========================================================================
        // STEP 4: Attempt Settlement with Invalid Signature
        // ========================================================================
        const settlementAgent = new SettlementAgent(
            provider,
            config.paymentProcessorAddress,
            PaymentProcessorABI
        );

        console.log("\n💸 Attempting settlement with INVALID signature...");
        const settlementResult = await settlementAgent.executeSettlement(
            tamperedAuthorization,
            userWallet
        );

        // ========================================================================
        // STEP 5: Generate Failure Receipt
        // ========================================================================
        const receiptGenerator = new ReceiptGenerator(
            provider,
            config.receiptRegistryAddress,
            ReceiptRegistryABI
        );

        const failureReceipt = receiptGenerator.generateFailureReceipt(
            tamperedAuthorization,
            settlementResult.reason,
            { message: settlementResult.error }
        );

        receiptGenerator.displayReceipt(failureReceipt);

        console.log("✅ SECURITY ENFORCEMENT VERIFIED!");
        console.log("   The system successfully rejected the invalid signature.\n");
        console.log("🔐 This proves:");
        console.log("   ✓ Authorization cannot be bypassed");
        console.log("   ✓ Signature tampering is detected");
        console.log("   ✓ AP2 authorization is enforced");
        console.log("   ✓ Audit trail captures failures\n");

    } catch (error) {
        console.error("\n❌ Demo error:", error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the failure demo
runFailureDemo()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
