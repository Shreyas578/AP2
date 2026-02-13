# AP2 Payment System - Frontend

Beautiful, interactive web interface for demonstrating the AP2 + x402 payment pattern.

## Features

✅ **MetaMask Integration** - Connect wallet with one click  
✅ **Visual Agent Flow** - See each step in the payment process  
✅ **Interactive Demos** - Run success and failure scenarios  
✅ **Real-time Console** - Watch the payment flow in action  
✅ **Receipt Viewer** - Beautiful JSON receipt display  
✅ **Responsive Design** - Works on desktop and mobile  
✅ **Dark Theme** - Modern, professional aesthetics  

## Quick Start

### Option 1: Using a Simple HTTP Server

```bash
# Using Python (if installed)
cd frontend
python -m http.server 8000

# Using Node.js http-server (recommended)
npx http-server frontend -p 8000 -o

# Or using PHP
php -S localhost:8000 -t frontend
```

Then open: `http://localhost:8000`

### Option 2: Using VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

## Setup Steps

### 1. Deploy Contracts First

Before using the frontend, deploy the smart contracts:

```bash
# From project root
npm run deploy
```

The deployment will create `deployments/base-sepolia.json` which the frontend automatically loads.

### 2. Get Testnet Assets

- **Base Sepolia ETH**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **Testnet USDC**: https://faucet.circle.com/

### 3. Connect Wallet

1. Click "Connect Wallet" button
2. Approve MetaMask connection
3. Confirm network switch to Base Sepolia

### 4. Approve USDC

Click "Approve USDC" button to allow the PaymentProcessor to spend your USDC.

### 5. Run Demos

- **Success Flow**: Click "Run Success Flow" to see complete payment
- **Failure Demo**: Click "Run Failure Demo" to see security enforcement

## File Structure

```
frontend/
├── index.html       # Main HTML structure
├── styles.css       # Dark theme styles with gradients
├── config.js        # Network & contract configuration
├── agents.js        # Frontend agent implementations
└── app.js           # Main application logic
```

## Configuration

The frontend automatically loads contract addresses from `../deployments/base-sepolia.json`.

You can also manually update `config.js`:

```javascript
CONFIG.PAYMENT_PROCESSOR_ADDRESS = "0x...";
CONFIG.RECEIPT_REGISTRY_ADDRESS = "0x...";
CONFIG.DEFAULT_MERCHANT = "0x...";
```

## Features Explained

### Agent Flow Visualization

Visual representation of the 5-agent architecture:
1. 🛒 **Shopping Agent** - Creates intent
2. 🏪 **Merchant Agent** - Signs mandate
3. 🔐 **Credentials Provider** - AP2 authorization ⭐
4. 💸 **Settlement Agent** - Executes transfer
5. 🧾 **Receipt Generator** - Creates audit record

### Success Flow Demo

1. Select product and amount
2. Enter merchant address
3. Click "Run Success Flow"
4. Approve MetaMask signatures
5. View receipt with transaction details

### Failure Flow Demo

Demonstrates security enforcement:
- Creates valid authorization
- Tampers with signature
- Attempts settlement
- Shows rejection with clear reason
- Proves AP2 cannot be bypassed

### Receipt Viewer

- Beautiful JSON formatting
- Download button for audit trail
- Direct link to BaseScan
- Shows success/failure status

## Troubleshooting

### "MetaMask not installed"
Install MetaMask browser extension: https://metamask.io/

### "Wrong network"
The app will prompt you to switch to Base Sepolia automatically.

### "Contracts not deployed"
Run `npm run deploy` from the project root first.

### "Approval failed"
Make sure you have Base Sepolia ETH for gas fees.

### "Transfer failed"
- Check USDC balance
- Verify USDC is approved
- Ensure sufficient ETH for gas

## Development

To modify the frontend:

1. **Styles**: Edit `styles.css` for UI changes
2. **Logic**: Edit `app.js` for behavior changes
3. **Agents**: Edit `agents.js` to modify agent logic
4. **Config**: Edit `config.js` for network/contract settings

## Browser Compatibility

- ✅ Chrome/Brave (recommended)
- ✅ Firefox
- ✅ Edge
- ✅ Safari (with MetaMask extension)

## Security Notes

- Private keys never leave MetaMask
- All signatures use standard EIP-712
- No backend server required
- Fully client-side application

---

**Ready to demo? Start the server and connect your wallet!** 🚀
