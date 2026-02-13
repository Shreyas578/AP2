#!/usr/bin/env node

/**
 * Quick Deploy Helper
 * Simplifies the deployment process for AP2 Payment System
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('\n🚀 AP2 Payment System - Quick Deploy Helper\n');
console.log('='.repeat(60));

// Check .env file
if (!fs.existsSync('.env')) {
    console.log('\n❌ .env file not found!');
    console.log('\n📝 Steps to fix:');
    console.log('   1. Copy .env.example to .env');
    console.log('   2. Fill in your private keys');
    console.log('   3. Run this script again');
    process.exit(1);
}

// Check private key
if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY === 'YOUR_DEPLOYER_PRIVATE_KEY_HERE') {
    console.log('\n❌ PRIVATE_KEY not set in .env');
    console.log('\n📝 Steps to fix:');
    console.log('   1. Get private key from MetaMask');
    console.log('   2. Add to .env file (without 0x prefix)');
    console.log('   3. Get Base Sepolia ETH from faucet');
    console.log('   4. Run this script again');
    process.exit(1);
}

console.log('\n✅ Configuration validated');
console.log('\n📦 Compiling contracts...');

try {
    execSync('npx hardhat compile', { stdio: 'inherit' });
    console.log('\n✅ Contracts compiled successfully');
} catch (error) {
    console.log('\n❌ Compilation failed');
    process.exit(1);
}

console.log('\n🚀 Deploying to Base Sepolia...');
console.log('⏳ This may take 30-60 seconds...\n');

try {
    execSync('npx hardhat run scripts/deploy.js --network baseSepolia', { stdio: 'inherit' });
    console.log('\n✅ Deployment complete!');
} catch (error) {
    console.log('\n❌ Deployment failed');
    console.log('\n💡 Common issues:');
    console.log('   - Insufficient ETH for gas fees');
    console.log('   - Wrong network configuration');
    console.log('   - RPC connection issues');
    process.exit(1);
}

// Read deployment info
const deploymentPath = path.join(__dirname, '..', 'deployments', 'base-sepolia.json');
if (fs.existsSync(deploymentPath)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

    console.log('\n' + '='.repeat(60));
    console.log('📋 DEPLOYMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`\n✅ PaymentProcessor: ${deployment.contracts.PaymentProcessor}`);
    console.log(`✅ ReceiptRegistry: ${deployment.contracts.ReceiptRegistry}`);
    console.log(`\n🌐 Network: ${deployment.network}`);
    console.log(`🔗 Chain ID: ${deployment.chainId}`);
    console.log(`💵 USDC: ${deployment.usdc.address}`);

    console.log('\n' + '='.repeat(60));
    console.log('📝 NEXT STEPS');
    console.log('='.repeat(60));
    console.log('\n1️⃣  Update .env with contract addresses:');
    console.log(`   PAYMENT_PROCESSOR_ADDRESS=${deployment.contracts.PaymentProcessor}`);
    console.log(`   RECEIPT_REGISTRY_ADDRESS=${deployment.contracts.ReceiptRegistry}`);

    console.log('\n2️⃣  Get testnet USDC:');
    console.log('   https://faucet.circle.com/');

    console.log('\n3️⃣  Start the frontend:');
    console.log('   npm start');

    console.log('\n4️⃣  In the frontend:');
    console.log('   - Connect MetaMask');
    console.log('   - Approve USDC');
    console.log('   - Run success demo');
    console.log('   - Run failure demo');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Ready to demo!');
    console.log('='.repeat(60) + '\n');
}
