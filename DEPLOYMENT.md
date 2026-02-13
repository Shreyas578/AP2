# 🚀 Deployment & Usage Guide

## Prerequisites Checklist

Before deployment, ensure you have:

- [ ] Node.js v18+ installed
- [ ] Git installed
- [ ] A MetaMask (or similar) wallet
- [ ] Base Sepolia testnet ETH for gas
- [ ] Base Sepolia testnet USDC

## Step 1: Get Testnet Assets

### Get Base Sepolia ETH

1. Visit the **Coinbase Base Sepolia Faucet**:
   - URL: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   - Connect your wallet
   - Request testnet ETH (you'll need ~0.01 ETH for deployment + demos)

### Get Testnet USDC

1. Visit the **Circle USDC Faucet**:
   - URL: https://faucet.circle.com/
   - Select "Base Sepolia" network
   - Enter your wallet address
   - Request testnet USDC (get ~100 USDC for testing)

## Step 2: Project Setup

```bash
# Clone or navigate to project
cd d:/Projects/AP2

# Dependencies are already installed
# If needed: npm install

# Create .env from template
cp .env.example .env
```

## Step 3: Configure Environment Variables

Edit `.env` file with your values:

```bash
# Network (already set)
BASE_SEPOLIA_RPC=https://sepolia.base.org
CHAIN_ID=84532
USDC_ADDRESS=0x036CbD53842c5426634e7929541ec2318f3dCF7e

# ⚠️ FILL THESE IN:
PRIVATE_KEY=your_deployer_private_key_here
MERCHANT_PRIVATE_KEY=your_merchant_private_key_here
USER_PRIVATE_KEY=your_user_private_key_here

# These will be filled after deployment:
PAYMENT_PROCESSOR_ADDRESS=
RECEIPT_REGISTRY_ADDRESS=
```

### How to Get Private Keys

**From MetaMask:**
1. Click account icon → Account Details
2. Click "Show private key"
3. Enter password
4. Copy private key (without 0x prefix)

**⚠️ SECURITY WARNING:**
- Use **test wallets only**
- Never commit `.env` to git
- Never share private keys

## Step 4: Compile Contracts

```bash
npm run compile
```

**Expected Output:**
```
Compiled 2 Solidity files successfully
```

## Step 5: Deploy Contracts

```bash
npm run deploy
```

**Expected Output:**
```
🚀 Starting deployment to Base Sepolia...

📝 Deploying contracts with account: 0xYourAddress
💰 Account balance: 0.01 ETH

📦 Deploying PaymentProcessor...
✅ PaymentProcessor deployed to: 0xProcessorAddress

📦 Deploying ReceiptRegistry...
✅ ReceiptRegistry deployed to: 0xRegistryAddress

🎉 DEPLOYMENT SUCCESSFUL!

📋 Contract Addresses:
   PaymentProcessor: 0xProcessorAddress
   ReceiptRegistry: 0xRegistryAddress
```

**ACTION REQUIRED:** Copy the contract addresses and update your `.env`:

```bash
PAYMENT_PROCESSOR_ADDRESS=0xProcessorAddress
RECEIPT_REGISTRY_ADDRESS=0xRegistryAddress
```

## Step 6: Approve USDC Spending

Before running demos, you must approve the PaymentProcessor to spend your USDC.

### Option A: Using Hardhat Console

```bash
npx hardhat console --network baseSepolia
```

```javascript
const usdc = await ethers.getContractAt(
  "IERC20",
  "0x036CbD53842c5426634e7929541ec2318f3dCF7e"
);

const processorAddress = "YOUR_PAYMENT_PROCESSOR_ADDRESS";
const amount = ethers.parseUnits("1000", 6); // Approve 1000 USDC

const tx = await usdc.approve(processorAddress, amount);
await tx.wait();
console.log("✅ USDC approved!");
```

### Option B: Using BaseScan

1. Go to: https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541ec2318f3dCF7e#writeContract
2. Connect your wallet (user wallet)
3. Find `approve` function
4. Enter:
   - `spender`: Your `PAYMENT_PROCESSOR_ADDRESS`
   - `amount`: `1000000000` (1000 USDC with 6 decimals)
5. Click "Write" and confirm transaction

## Step 7: Run Success Demo

```bash
npm run demo:success
```

**Expected Flow:**

```
🎯🎯🎯 AP2 + x402 PAYMENT SYSTEM - SUCCESS FLOW DEMO 🎯🎯🎯

🌐 Network: Base Sepolia (Chain ID: 84532)
👤 User: 0xUser...
🏪 Merchant: 0xMerchant...

🛒 Shopping Agent: Intent created
{
  "intent_id": "0x...",
  "product_id": "SKU-PREMIUM-COFFEE-123",
  "amount": "50",
  "currency": "USDC",
  "merchant": "0xMerchant...",
  "expiry": 1739456821
}

🏪 Merchant Agent: Mandate created and signed
   Mandate Hash: 0x...
   Merchant: 0xMerchant...

🔐 Credentials Provider: AP2 AUTHORIZATION CHECKPOINT
════════════════════════════════════════════════════════════
📋 Authorization Request:
   Merchant: 0xMerchant...
   Amount: 50 USDC
   Product: SKU-PREMIUM-COFFEE-123
   
✍️  User signing authorization...
✅ User Authorization Captured
════════════════════════════════════════════════════════════

💸 Settlement Agent: EXECUTING x402 SETTLEMENT
════════════════════════════════════════════════════════════
📝 Verifying authorization before settlement...
🔄 Submitting settlement transaction...
   TX Hash: 0xTxHash...
   Waiting for confirmation...
✅ Settlement Executed Successfully!
   Block: 12345
   Event: SettlementExecuted emitted
════════════════════════════════════════════════════════════

🧾 Receipt Generator: SUCCESS receipt created
   📄 Saved to: demo/receipts/success_1739456789.json

📝 Storing receipt on-chain...
   TX Hash: 0x...
✅ Receipt stored on-chain at block: 12346

══════════════════════════════════════════════════════════════════════
📋 PAYMENT RECEIPT
══════════════════════════════════════════════════════════════════════
{
  "intent_id": "0x...",
  "chain": "Base Sepolia",
  "chain_id": 84532,
  "usdc_contract": "0x036CbD53842c5426634e7929541ec2318f3dCF7e",
  "user": "0xUser...",
  "merchant": "0xMerchant...",
  "authorized_amount": "50 USDC",
  "amount_raw": "50000000",
  "settlement_tx": "0xTxHash...",
  "processor_contract": "0xProcessor...",
  "receipt_contract": "0xRegistry...",
  "mandate_hash": "0x...",
  "authorized_signature": "0x...",
  "status": "SUCCESS",
  "timestamp": "2026-02-13T12:22:00Z"
}
══════════════════════════════════════════════════════════════════════

✅ SUCCESS DEMO COMPLETED!

🔍 Verify on BaseScan:
   https://sepolia.basescan.org/tx/0xTxHash...
```

## Step 8: Run Failure Demo

```bash
npm run demo:failure
```

**Expected Flow:**

```
⚠️ ⚠️ ⚠️  AP2 + x402 PAYMENT SYSTEM - FAILURE FLOW DEMO ⚠️ ⚠️ ⚠️ 
SCENARIO: INVALID SIGNATURE ATTACK ATTEMPT

[Intent created]
[Mandate signed]
[Authorization obtained]

🚨 ATTACK SIMULATION: Tampering with signature...
   Original signature: 0x1234567890abcdef...
   Tampered signature: 0xdeadbeefdeadbeef...

💸 Attempting settlement with INVALID signature...
❌ Settlement Failed!
   Error: Invalid signature

🧾 Receipt Generator: FAILURE receipt created
   Reason: INVALID_SIGNATURE

══════════════════════════════════════════════════════════════════════
📋 PAYMENT RECEIPT
══════════════════════════════════════════════════════════════════════
{
  "intent_id": "0x...",
  "chain": "Base Sepolia",
  "chain_id": 84532,
  "status": "FAILED",
  "failure_reason": "INVALID_SIGNATURE",
  "timestamp": "2026-02-13T12:25:00Z"
}
══════════════════════════════════════════════════════════════════════

✅ SECURITY ENFORCEMENT VERIFIED!
   The system successfully rejected the invalid signature.

🔐 This proves:
   ✓ Authorization cannot be bypassed
   ✓ Signature tampering is detected
   ✓ AP2 authorization is enforced
   ✓ Audit trail captures failures
```

## Step 9: Verify on BaseScan

Visit the transaction URLs from the demo output to verify:

1. **Settlement Transaction:**
   - Go to: `https://sepolia.basescan.org/tx/YOUR_TX_HASH`
   - Verify USDC transfer from user to merchant
   - Check `SettlementExecuted` event in logs

2. **Contract Verification:**
   - PaymentProcessor: `https://sepolia.basescan.org/address/YOUR_PROCESSOR_ADDRESS`
   - ReceiptRegistry: `https://sepolia.basescan.org/address/YOUR_REGISTRY_ADDRESS`

## Troubleshooting

### "Insufficient funds for gas"
- Get more Base Sepolia ETH from the faucet

### "Transfer failed" or "Insufficient allowance"
- Make sure you approved USDC spending (Step 6)
- Check your USDC balance with: `usdc.balanceOf(yourAddress)`

### "Contract addresses not set"
- Update `.env` with deployed contract addresses from Step 5

### "Invalid signature"
- This is expected in the failure demo
- In success demo, this means configuration issue - verify private keys match addresses

## Next Steps

### Customize for Your Use Case

1. **Modify Intent Structure** (`shopping-agent.js`):
   - Add custom fields for your products/services
   - Adjust expiry times

2. **Extend Mandate Logic** (`merchant-agent.js`):
   - Add business-specific validation
   - Include additional metadata

3. **Enhance Authorization UI** (`credentials-provider.js`):
   - Build web UI for user approval
   - Add transaction previews

4. **Integrate Settlement** (`settlement-agent.js`):
   - Connect to your backend
   - Add webhook notifications

5. **Customize Receipts** (`receipt-generator.js`):
   - Add additional fields
   - Generate PDF receipts
   - Send email confirmations

## Production Deployment

To deploy to mainnet (Base):

1. Update `hardhat.config.js`:
   ```javascript
   base: {
     url: "https://mainnet.base.org",
     chainId: 8453,
     accounts: [process.env.PRIVATE_KEY]
   }
   ```

2. Update USDC address for Base mainnet:
   ```
   USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
   ```

3. Deploy:
   ```bash
   npx hardhat run scripts/deploy.js --network base
   ```

## Support

For issues or questions:
- Check [README.md](README.md) for architecture details
- Review contract code in `contracts/`
- Check agent logic in `agents/`

---

**🎉 Congratulations! Your AP2 + x402 payment system is ready!**
