# 🚀 AP2 Payment System - Quick Reference

## 📦 Project Structure
```
AP2/
├── contracts/           # Smart contracts
│   ├── PaymentProcessor.sol    (AP2 + x402 settlement)
│   └── ReceiptRegistry.sol     (Audit trail)
├── agents/              # 5 microservices
│   ├── shopping-agent.js       (Intent creation)
│   ├── merchant-agent.js       (Mandate signing)
│   ├── credentials-provider.js (AP2 authorization ⭐)
│   ├── settlement-agent.js     (x402 settlement)
│   └── receipt-generator.js    (Receipt storage)
├── demo/                # Demo scripts
│   ├── demo-success.js         (Success flow)
│   └── demo-failure.js         (Failure scenario)
└── scripts/             # Deployment & helpers
    ├── deploy.js               (Deploy contracts)
    └── approve-usdc.js         (Approve USDC)
```

## ⚡ Quick Commands

```bash
# 1. Install dependencies
npm install

# 2. Compile contracts
npm run compile

# 3. Deploy to Base Sepolia
npm run deploy
# ⚠️ Copy contract addresses to .env!

# 4. Approve USDC spending
npm run approve

# 5. Run success demo
npm run demo:success

# 6. Run failure demo
npm run demo:failure
```

## 🔧 Configuration (.env)

```bash
# Required before deployment:
PRIVATE_KEY=your_deployer_key
MERCHANT_PRIVATE_KEY=your_merchant_key
USER_PRIVATE_KEY=your_user_key

# Required after deployment:
PAYMENT_PROCESSOR_ADDRESS=0x...
RECEIPT_REGISTRY_ADDRESS=0x...
```

## 🌐 Network Info

| Property | Value |
|----------|-------|
| Network | Base Sepolia |
| Chain ID | 84532 |
| RPC | https://sepolia.base.org |
| USDC | 0x036CbD53842c5426634e7929541ec2318f3dCF7e |

## 🎯 Get Testnet Assets

1. **Base Sepolia ETH** (for gas):
   - https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

2. **Testnet USDC**:
   - https://faucet.circle.com/

## 🔐 Authorization Flow

```
Shopping Agent
    ↓ [Intent]
Merchant Agent
    ↓ [Signed Mandate]
Credentials Provider ← USER SIGNS HERE (AP2)
    ↓ [User Signature]
Settlement Agent
    ↓ [Execute Transfer]
PaymentProcessor Contract
    ↓ [Event]
Receipt Generator
    ↓ [Store]
ReceiptRegistry Contract
```

## 📋 Receipt Format

**Success:**
```json
{
  "intent_id": "0x...",
  "chain": "Base Sepolia",
  "chain_id": 84532,
  "user": "0x...",
  "merchant": "0x...",
  "authorized_amount": "50 USDC",
  "settlement_tx": "0x...",
  "status": "SUCCESS"
}
```

**Failure:**
```json
{
  "intent_id": "0x...",
  "status": "FAILED",
  "failure_reason": "INVALID_SIGNATURE",
  "chain_id": 84532
}
```

## 🛡️ Security Features

✅ ECDSA signature verification  
✅ Nonce-based replay protection  
✅ Mandate hash validation  
✅ Expiry timestamp checks  
✅ On-chain enforcement  
✅ Immutable audit trail  

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| "Insufficient funds" | Get testnet ETH from faucet |
| "Transfer failed" | Run `npm run approve` |
| "Contract addresses not set" | Update .env after deployment |
| "Invalid signature" | Verify private keys match addresses |

## 📚 Documentation

- **README.md** - Complete overview
- **DEPLOYMENT.md** - Step-by-step deployment
- **Quick-Reference.md** - This file

## 🔗 Useful Links

- BaseScan: https://sepolia.basescan.org
- Base Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- USDC Faucet: https://faucet.circle.com/

---

**Need help?** Check DEPLOYMENT.md for detailed instructions!
