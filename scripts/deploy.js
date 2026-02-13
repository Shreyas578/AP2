const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting deployment to Base Sepolia...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

    // Deploy PaymentProcessor
    console.log("📦 Deploying PaymentProcessor...");
    const PaymentProcessor = await hre.ethers.getContractFactory("PaymentProcessor");
    const paymentProcessor = await PaymentProcessor.deploy();
    await paymentProcessor.waitForDeployment();
    const processorAddress = await paymentProcessor.getAddress();
    console.log("✅ PaymentProcessor deployed to:", processorAddress);

    // Deploy ReceiptRegistry
    console.log("\n📦 Deploying ReceiptRegistry...");
    const ReceiptRegistry = await hre.ethers.getContractFactory("ReceiptRegistry");
    const receiptRegistry = await ReceiptRegistry.deploy();
    await receiptRegistry.waitForDeployment();
    const registryAddress = await receiptRegistry.getAddress();
    console.log("✅ ReceiptRegistry deployed to:", registryAddress);

    // Save deployment info
    const deploymentInfo = {
        network: "Base Sepolia",
        chainId: 84532,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            PaymentProcessor: processorAddress,
            ReceiptRegistry: registryAddress
        },
        usdc: {
            address: "0x036CbD53842c5426634e7929541ec2318f3dCF7e",
            decimals: 6
        }
    };

    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }

    const deploymentPath = path.join(deploymentsDir, "base-sepolia.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n📄 Deployment info saved to:", deploymentPath);

    // Print summary
    console.log("\n" + "=".repeat(70));
    console.log("🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("=".repeat(70));
    console.log("\n📋 Contract Addresses:");
    console.log("   PaymentProcessor:", processorAddress);
    console.log("   ReceiptRegistry:", registryAddress);
    console.log("\n🌐 Network Info:");
    console.log("   Network: Base Sepolia");
    console.log("   Chain ID: 84532");
    console.log("   USDC: 0x036CbD53842c5426634e7929541ec2318f3dCF7e");
    console.log("\n🔍 Verify on BaseScan:");
    console.log("   https://sepolia.basescan.org/address/" + processorAddress);
    console.log("   https://sepolia.basescan.org/address/" + registryAddress);
    console.log("\n⚙️  Next Steps:");
    console.log("   1. Update .env file with contract addresses:");
    console.log("      PAYMENT_PROCESSOR_ADDRESS=" + processorAddress);
    console.log("      RECEIPT_REGISTRY_ADDRESS=" + registryAddress);
    console.log("   2. Get testnet USDC from: https://faucet.circle.com/");
    console.log("   3. Run demo: npm run demo:success");
    console.log("=".repeat(70) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
