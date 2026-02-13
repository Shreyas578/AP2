require("dotenv").config();
const { ethers } = require("ethers");

/**
 * Helper script to approve USDC spending for PaymentProcessor
 */
async function approveUSDC() {
    console.log("\n🔓 USDC Approval Helper\n");

    try {
        const config = {
            rpcUrl: process.env.BASE_SEPOLIA_RPC,
            usdcAddress: process.env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541ec2318f3dCF7e",
            paymentProcessorAddress: process.env.PAYMENT_PROCESSOR_ADDRESS,
            userPrivateKey: process.env.USER_PRIVATE_KEY
        };

        if (!config.paymentProcessorAddress) {
            throw new Error("PAYMENT_PROCESSOR_ADDRESS not set in .env");
        }

        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        const wallet = new ethers.Wallet(config.userPrivateKey, provider);

        console.log("👤 User wallet:", wallet.address);
        console.log("💵 USDC contract:", config.usdcAddress);
        console.log("🔐 Approving for:", config.paymentProcessorAddress);

        // USDC contract interface
        const usdcAbi = [
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function allowance(address owner, address spender) external view returns (uint256)",
            "function balanceOf(address account) external view returns (uint256)"
        ];

        const usdc = new ethers.Contract(config.usdcAddress, usdcAbi, wallet);

        // Check current balance
        const balance = await usdc.balanceOf(wallet.address);
        console.log(`\n💰 Your USDC balance: ${ethers.formatUnits(balance, 6)} USDC`);

        if (balance === 0n) {
            console.log("\n⚠️  WARNING: You have 0 USDC!");
            console.log("   Get testnet USDC from: https://faucet.circle.com/");
            return;
        }

        // Check current allowance
        const currentAllowance = await usdc.allowance(wallet.address, config.paymentProcessorAddress);
        console.log(`📊 Current allowance: ${ethers.formatUnits(currentAllowance, 6)} USDC`);

        if (currentAllowance > 0n) {
            console.log("\n✅ Already approved! You can run demos now.");
            console.log("\n   To run demos:");
            console.log("   - npm run demo:success");
            console.log("   - npm run demo:failure\n");
            return;
        }

        // Approve large amount (1000 USDC)
        const approvalAmount = ethers.parseUnits("1000", 6);
        console.log(`\n🔄 Approving ${ethers.formatUnits(approvalAmount, 6)} USDC...`);

        const tx = await usdc.approve(config.paymentProcessorAddress, approvalAmount);
        console.log("📝 Transaction hash:", tx.hash);
        console.log("⏳ Waiting for confirmation...");

        const receipt = await tx.wait();
        console.log(`✅ Approved! (Block: ${receipt.blockNumber})`);

        // Verify
        const newAllowance = await usdc.allowance(wallet.address, config.paymentProcessorAddress);
        console.log(`📊 New allowance: ${ethers.formatUnits(newAllowance, 6)} USDC`);

        console.log("\n🎉 Success! You can now run the demos:");
        console.log("   - npm run demo:success");
        console.log("   - npm run demo:failure\n");

    } catch (error) {
        console.error("\n❌ Error:", error.message);

        if (error.message.includes("insufficient funds")) {
            console.log("\n💡 You need Base Sepolia ETH for gas fees.");
            console.log("   Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet\n");
        }

        process.exit(1);
    }
}

approveUSDC()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
