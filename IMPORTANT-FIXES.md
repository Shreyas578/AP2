# 🔧 Important Fixes Applied

## Issues Fixed

### 1. ✅ Merchant Address Not Updating

**Problem**: 
- You changed merchant address in `.env` to `0x0fA104023bf4d13a67fBA13FF91B2e8Fb04Cd920`
- Frontend was still using old address `0xe7b30321edC5311Ddf589da2a01cD381Ba6Ac42D`

**Why This Happened**:
- Frontend doesn't read `.env` file (that's only for backend Node.js scripts)
- Frontend uses `frontend/config.js` instead
- App.js was overwriting merchant address with user's address on wallet connect

**Fixed**:
1. ✅ Updated `frontend/config.js` with new merchant address
2. ✅ Changed app.js to use `CONFIG.DEFAULT_MERCHANT` instead of `userAddress`
3. ✅ Set merchant address on page load

**Now**: Merchant address will be `0x0fA104023bf4d13a67fBA13FF91B2e8Fb04Cd920` by default

---

### 2. ⚠️ USDC Allowance "Reducing" - EXPLAINED

**What You're Seeing**:
- USDC allowance appears to be reducing
- But no USDC transfer in history

**What's Actually Happening**:

This is **NORMAL** and here's why:

#### How ERC20 Allowances Work:

```
Initial State:
- Your USDC Balance: 20.00 USDC
- Allowance to Contract: 1000.00 USDC

After 1st Transaction (e.g., $5 purchase):
- Your USDC Balance: 15.00 USDC (decreased by 5)
- Allowance: 995.00 USDC (decreased by 5)

After 2nd Transaction (e.g., $3 purchase):
- Your USDC Balance: 12.00 USDC (decreased by 3)
- Allowance: 992.00 USDC (decreased by 3)
```

**This is CORRECT behavior!** The allowance decreases as it's used.

#### Why You Don't See USDC Transfers in History:

**If User = Merchant (Same Address)**:
- When you send to yourself, some wallets don't show it in history
- The USDC does transfer on-chain, but net result is 0
- Check BaseScan instead - you'll see the actual transfer

**If User ≠ Merchant (Different Addresses)**:
- You WILL see USDC leaving your wallet
- Merchant WILL receive the USDC
- This is the real payment scenario

---

### 3. ✅ How to Verify Transactions

Since you changed to a different merchant address, you'll now see REAL transfers!

**Before (Same Address)**:
```
User: 0xe7b30321edC5311Ddf589da2a01cD381Ba6Ac42D
Merchant: 0xe7b30321edC5311Ddf589da2a01cD381Ba6Ac42D (same)
Result: USDC goes from you → to you (net = 0)
```

**After (Different Address)**:
```
User: 0xe7b30321edC5311Ddf589da2a01cD381Ba6Ac42D
Merchant: 0x0fA104023bf4d13a67fBA13FF91B2e8Fb04Cd920 (different!)
Result: USDC actually leaves your wallet! 💸
```

---

## 🔍 How to Check Transactions on BaseScan

### Method 1: From Receipt
1. After transaction completes, click "View on BaseScan"
2. You'll see the full transaction details

### Method 2: Manual Check
1. Go to: https://sepolia.basescan.org
2. Search your address: `0xe7b30321edC5311Ddf589da2a01cD381Ba6Ac42D`
3. Click "Token Transfers" tab
4. You'll see all USDC transfers

### What You'll See:
```
From: 0xe7b30321edC5311Ddf589da2a01cD381Ba6Ac42D (you)
To: 0x0fA104023bf4d13a67fBA13FF91B2e8Fb04Cd920 (merchant)
Token: USDC
Amount: [whatever you paid]
```

---

## 📊 Understanding Your Balances

### USDC Balance
- This is your actual USDC tokens
- **WILL decrease** when you buy something
- **WILL NOT come back** if merchant is different address

### USDC Allowance
- This is permission for contract to spend
- **WILL decrease** as it's used
- Starts at 1000, goes down with each transaction
- When it reaches 0, you need to approve again

### Example Transaction Flow:

**Before Purchase**:
```
Your USDC Balance: 20.00 USDC
Allowance: 1000.00 USDC
Merchant Balance: 0.00 USDC
```

**You Buy $5 Item**:
```
Your USDC Balance: 15.00 USDC (↓ 5)
Allowance: 995.00 USDC (↓ 5)
Merchant Balance: 5.00 USDC (↑ 5)
```

**You Buy $3 Item**:
```
Your USDC Balance: 12.00 USDC (↓ 3)
Allowance: 992.00 USDC (↓ 3)
Merchant Balance: 8.00 USDC (↑ 3)
```

---

## ⚠️ Important Notes

### 1. Allowance Decreasing is NORMAL
- This is how ERC20 tokens work
- The allowance is consumed as you spend
- When allowance runs out, click "Approve USDC" again

### 2. Different Merchant = Real Payments
- Now that merchant is different address
- Your USDC will ACTUALLY leave your wallet
- Merchant will ACTUALLY receive it
- This is NOT a test anymore - it's real transfers!

### 3. Check Merchant Wallet
To verify merchant received payment:
1. Go to BaseScan
2. Search merchant address: `0x0fA104023bf4d13a67fBA13FF91B2e8Fb04Cd920`
3. Check USDC balance
4. You'll see the payments accumulating

---

## 🚀 Testing with New Merchant Address

### Step 1: Refresh the Page
Press Ctrl+R or F5

### Step 2: Check Merchant Address
Look at the "Merchant Address" field - should show:
```
0x0fA104023bf4d13a67fBA13FF91B2e8Fb04Cd920
```

### Step 3: Make a Small Test Purchase
1. Select "Single Tea Bag - $1 USDC"
2. Click "Run Success Flow"
3. Approve in MetaMask

### Step 4: Verify on BaseScan
1. Click "View on BaseScan" from receipt
2. Look for "Token Transfers" section
3. You'll see:
   - From: Your address
   - To: Merchant address (0x0fA104023bf4d13a67fBA13FF91B2e8Fb04Cd920)
   - Amount: 1 USDC

### Step 5: Check Balances
**Your Wallet**:
- USDC: 19.00 (was 20, now 19)
- Allowance: 999.00 (was 1000, now 999)

**Merchant Wallet**:
- USDC: 1.00 (was 0, now 1)

---

## 💡 Pro Tips

### If You Want to Test Without Losing USDC:
Change merchant address back to your own address:
```javascript
// In frontend/config.js
DEFAULT_MERCHANT: "0xe7b30321edC5311Ddf589da2a01cD381Ba6Ac42D"
```

### If You Want Real Payments:
Keep merchant as different address (current setup):
```javascript
// In frontend/config.js
DEFAULT_MERCHANT: "0x0fA104023bf4d13a67fBA13FF91B2e8Fb04Cd920"
```

### To Change Merchant Address:
1. Edit `frontend/config.js` (NOT .env)
2. Change `DEFAULT_MERCHANT` value
3. Refresh the page
4. New address will appear in merchant field

---

## 🔧 Quick Reference

### Files That Matter for Frontend:
- ✅ `frontend/config.js` - Configuration (merchant address here!)
- ✅ `frontend/app.js` - Application logic
- ✅ `frontend/agents.js` - Agent implementations
- ❌ `.env` - Only for backend scripts (NOT used by frontend)

### Files That Matter for Backend:
- ✅ `.env` - Configuration for Node.js scripts
- ✅ `agents/*.js` - Backend agent implementations
- ✅ `demo/*.js` - Demo scripts

---

## ✅ Summary

**Fixed**:
1. ✅ Merchant address now updates correctly
2. ✅ Frontend uses new merchant: `0x0fA104023bf4d13a67fBA13FF91B2e8Fb04Cd920`
3. ✅ Merchant address set on page load
4. ✅ Explained allowance behavior (it's normal!)

**What Changed**:
- `frontend/config.js`: Updated DEFAULT_MERCHANT
- `frontend/app.js`: Uses CONFIG.DEFAULT_MERCHANT instead of userAddress
- `frontend/app.js`: Sets merchant address on page load

**What to Expect**:
- Merchant address field shows new address
- USDC will actually transfer to merchant
- Allowance will decrease (this is normal!)
- You can verify transfers on BaseScan

---

**Next Step**: Refresh the page and check that merchant address shows `0x0fA104023bf4d13a67fBA13FF91B2e8Fb04Cd920`!
