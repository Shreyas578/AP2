# AP2 + x402 Agent Payment Pattern

> **Reusable Payment Architecture on Base Sepolia**  
> Intent → Authorization → Settlement → Receipt

[![Base Sepolia](https://img.shields.io/badge/Network-Base%20Sepolia-blue)](https://sepolia.basescan.org)
[![USDC](https://img.shields.io/badge/Token-USDC-green)](https://www.circle.com/en/usdc)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-orange)](https://soliditylang.org/)

## 🎯 Overview

This project implements a **production-ready agent-based payment pattern** combining:
- **AP2**: Authorization Protocol with signature verification
- **x402**: Settlement execution on Base Sepolia
- **Clean Agent Separation**: 5 microservices for modularity
- **Audit Trail**: Immutable receipt registry

## 🏗 Architecture

```
User Prompt
    ↓
Shopping Agent (Intent)
    ↓
Merchant Agent (Mandate)
    ↓
Credentials Provider (AP2 Authorization) ← USER APPROVAL HERE
    ↓
Settlement Agent (x402 Settlement)
    ↓
Receipt Generator (Audit Trail)
```

### Agent Responsibilities

| Agent | Responsibility | Blockchain Interaction |
|-------|---------------|----------------------|
| **Shopping Agent** | Create payment intents | ❌ No |
| **Merchant Agent** | Sign cart mandates | ❌ No |
| **Credentials Provider** | **AP2 Authorization - User signature** | ✅ Read (nonce) |
| **Settlement Agent** | Execute USDC transfers | ✅ Write (settlement) |
| **Receipt Generator** | Store audit records | ✅ Write (receipt) |

## 🌐 Network Configuration

| Parameter | Value |
|-----------|-------|
| **Network** | Base Sepolia |
| **Chain ID** | `84532` |
| **RPC** | `https://sepolia.base.org` |
| **Explorer** | https://sepolia.basescan.org |
| **USDC Contract** | `0x036CbD53842c5426634e7929541ec2318f3dCF7e` |
| **Decimals** | 6 |

## 📦 Smart Contracts

### PaymentProcessor.sol
- ✅ Verifies AP2 signatures (ECDSA)
- ✅ Validates mandate hash, expiry, amount
- ✅ Prevents replay attacks (nonce tracking)
- ✅ Executes USDC `transferFrom`
- ✅ Emits `SettlementExecuted` event

### ReceiptRegistry.sol
- ✅ Stores payment receipts
- ✅ Provides public getters
- ✅ Enables dispute resolution
- ✅ Emits `ReceiptCreated` event

## 🚀 Quick Start

### Option 1: Interactive Frontend (Recommended)

```bash
# 1. Install dependencies
npm install

# 2. Start the frontend
npm start
```

This opens a beautiful web interface where you can:
- 🔐 Connect MetaMask wallet
- 🛒 Create payment intents
- ✅ Run success demos
- ⚠️ Test failure scenarios
- 🧾 View receipts
- 📊 Monitor real-time status

**See [frontend/README.md](frontend/README.md) for detailed frontend documentation.**

### Option 2: CLI Demo Scripts

```bash
# Install dependencies
npm install

# Get testnet assets
# - Base Sepolia ETH: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
# - Testnet USDC: https://faucet.circle.com/
```

### 2. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env and fill in:
# - PRIVATE_KEY (deployer wallet)
# - MERCHANT_PRIVATE_KEY
# - USER_PRIVATE_KEY
```

### 3. Deploy Contracts

```bash
npm run deploy
```

**Output:**
```
✅ PaymentProcessor deployed to: 0x...
✅ ReceiptRegistry deployed to: 0x...
```

**Important:** Copy these addresses to your `.env` file:
```
PAYMENT_PROCESSOR_ADDRESS=0x...
RECEIPT_REGISTRY_ADDRESS=0x...
```

### 4. Approve USDC

Before running demos, approve USDC spending:

```bash
# Use Hardhat console or Etherscan
# Approve PaymentProcessor to spend your USDC
usdc.approve(PAYMENT_PROCESSOR_ADDRESS, amount)
```

### 5. Run Demos

```bash
# Success flow
npm run demo:success

# Failure scenario (invalid signature)
npm run demo:failure
```

## 📋 Receipt Format

### Success Receipt
```json
{
  "intent_id": "0x123...",
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
  "mandate_hash": "0xMandate...",
  "authorized_signature": "0xSig...",
  "status": "SUCCESS",
  "timestamp": "2026-02-13T12:22:00Z"
}
```

### Failure Receipt
```json
{
  "intent_id": "0x456...",
  "chain": "Base Sepolia",
  "chain_id": 84532,
  "status": "FAILED",
  "failure_reason": "INVALID_SIGNATURE",
  "timestamp": "2026-02-13T12:25:00Z"
}
```

## 🔐 Authorization Enforcement

### Where Authorization Happens
**Credentials Provider Agent** (`credentials-provider.js`)
- User reviews intent details
- User signs authorization message
- Signature captured and validated

### How Enforcement Works
1. **Message Construction**: `keccak256(intentId, user, merchant, amount, mandateHash, expiry, nonce)`
2. **User Signs**: Creates ECDSA signature
3. **Contract Verifies**: `PaymentProcessor.executeSettlement()` recovers signer
4. **Validation**: Signer must match user address

### Why It Cannot Be Bypassed
- ✅ **Cryptographic Proof**: ECDSA signatures cannot be forged without private key
- ✅ **Nonce Tracking**: Prevents replay attacks
- ✅ **Mandate Binding**: Amount/merchant locked in signed hash
- ✅ **Expiry Validation**: Time-limited authorization
- ✅ **On-Chain Verification**: Smart contract enforces all rules

**Attack Scenarios Prevented:**
- ❌ Modified amount after signature → Contract rejects (hash mismatch)
- ❌ Expired authorization → Contract rejects (timestamp check)
- ❌ Replay attack → Contract rejects (nonce consumed)
- ❌ Invalid signature → Contract rejects (signature verification fails)

## 🧪 Testing

```bash
# Compile contracts
npm run compile

# Run Hardhat tests
npm test

# Local Hardhat node (optional)
npx hardhat node
```

## 📁 Project Structure

```
AP2/
├── contracts/
│   ├── PaymentProcessor.sol      # Settlement contract
│   └── ReceiptRegistry.sol       # Audit trail
├── agents/
│   ├── shopping-agent.js         # Intent creation
│   ├── merchant-agent.js         # Mandate signing
│   ├── credentials-provider.js   # AP2 authorization ⭐
│   ├── settlement-agent.js       # x402 settlement
│   └── receipt-generator.js      # Receipt generation
├── demo/
│   ├── demo-success.js           # Success flow
│   ├── demo-failure.js           # Failure scenario
│   └── receipts/                 # Generated receipts
├── scripts/
│   └── deploy.js                 # Deployment script
├── .env.example                  # Configuration template
└── hardhat.config.js             # Hardhat config
```

## 🏆 Why This Wins

✅ **Clean Separation**: Each agent has a single responsibility  
✅ **Reusable Pattern**: Works for any USDC payment scenario  
✅ **Security First**: Cryptographic authorization enforcement  
✅ **Audit Ready**: Immutable on-chain receipt trail  
✅ **Cloud Native**: Microservice-friendly architecture  
✅ **Production Ready**: Error handling, logging, validation  
✅ **Demonstrable**: Both success and failure scenarios shown

## 🔍 Verification

### On-Chain Verification
```bash
# Check deployed contracts
https://sepolia.basescan.org/address/PAYMENT_PROCESSOR_ADDRESS

# View settlement transaction
https://sepolia.basescan.org/tx/SETTLEMENT_TX_HASH
```

### Event Verification
- `SettlementExecuted`: Confirms payment processed
- `ReceiptCreated`: Confirms audit record stored

## 📝 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for the AP2 + x402 Hackathon**
