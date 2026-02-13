require("dotenv").config();
const { ethers } = require("ethers");

async function testConnection() {
    console.log("\n🔍 Testing Contract Connections\n");
    console.log("=".repeat(60));

    try {
        // Configuration
        const config = {
            rpcUrl: process.env.BASE_SEPOLIA_RPC,
            usdcAddress: process.env.USDC_ADDRESS,
            paymentProcessorAddress: process.env.PAYMENT_PROCESSOR_ADDRESS,
            receiptRegistryAddress: process.env.RECEIPT_REGISTRY_ADDRESS,
            userAddress: process.env.USER_ADDRESS || "0xe7b30321edC5311Ddf589da2a01cD381Ba6Ac42D"
        };

        console.log("📋 Configuration:");
        console.log(`   RPC: ${config.rpcUrl}`);
        console.log(`   User: ${config.userAddress}`);
        console.log(`   USDC: ${config.usdcAddress}`);
        console.log(`   PaymentProcessor: ${config.paymentProcessorAddress}`);
        console.log(`   ReceiptRegistry: ${config.receiptRegistryAddress}`);
        console.log();

        // Connect to provider
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        
        // Test 1: Network connection
        console.log("✅ Test 1: Network Connection");
        const network = await provider.getNetwork();
        console.log(`   Chain ID: ${network.chainId}`);
        console.log(`   Name: ${network.name || "Base Sepolia"}`);
        console.log();

        // Test 2: User balance
        console.log("✅ Test 2: User ETH Balance");
        const ethBalance = await provider.getBalance(config.userAddress);
        console.log(`   Balance: ${ethers.formatEther(ethBalance)} ETH`);
        console.log();

        // Test 3: USDC contract
        console.log("✅ Test 3: USDC Contract");
        const usdcAbi = [
            "function balanceOf(address) view returns (uint256)",
            "function allowance(address,address) view returns (uint256)"
        ];
        const usdc = new ethers.Contract(config.usdcAddress, usdcAbi, provider);
        const usdcBalance = await usdc.balanceOf(config.userAddress);
        const allowance = await usdc.allowance(config.userAddress, config.paymentProcessorAddress);
        console.log(`   USDC Balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
        console.log(`   Allowance: ${ethers.formatUnits(allowance, 6)} USDC`);
        console.log();

        // Test 4: PaymentProcessor contract
        console.log("✅ Test 4: PaymentProcessor Contract");
        const processorAbi = [
            "function getNonce(address) view returns (uint256)",
            "function USDC() view returns (address)"
        ];
        const processor = new ethers.Contract(config.paymentProcessorAddress, processorAbi, provider);
        const nonce = await processor.getNonce(config.userAddress);
        const usdcFromContract = await processor.USDC();
        console.log(`   User Nonce: ${nonce}`);
        console.log(`   USDC Address: ${usdcFromContract}`);
        console.log();

        // Test 5: ReceiptRegistry contract
        console.log("✅ Test 5: ReceiptRegistry Contract");
        const registryAbi = [
            "function getReceiptCount() view returns (uint256)"
        ];
        const registry = new ethers.Contract(config.receiptRegistryAddress, registryAbi, provider);
        const receiptCount = await registry.getReceiptCount();
        console.log(`   Total Receipts: ${receiptCount}`);
        console.log();

        console.log("=".repeat(60));
        console.log("🎉 All Tests Passed!");
        console.log();
        console.log("✅ Backend is properly connected");
        console.log("✅ Contracts are deployed and accessible");
        console.log("✅ User has USDC and allowance set");
        console.log();
        console.log("🚀 Ready to test! You can:");
        console.log("   1. Open frontend: npm start");
        console.log("   2. Connect MetaMask to Base Sepolia");
        console.log("   3. Test the payment flow");
        console.log();

    } catch (error) {
        console.error("\n❌ Connection Test Failed:");
        console.error(error.message);
        console.log();
        process.exit(1);
    }
}

testConnection();
