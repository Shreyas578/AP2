# 🎯 Complete Testing Guide

## ✅ Good News About Merchant Address!

**You're using the SAME address for both user and merchant - This is PERFECT for testing!**

### What Happens:
```
Your Address: 0xe7b30321edC5311Ddf589da2a01cD381Ba6Ac42D
Merchant Address: 0xe7b30321edC5311Ddf589da2a01cD381Ba6Ac42D (same!)

When you buy a $5 product:
1. ✅ Contract transfers 5 USDC from you
2. ✅ Contract transfers 5 USDC to you
3. ✅ Net result: Your USDC stays the same!
4. ⚠️ You only pay gas fees in ETH (~$0.01)
```

**This is the BEST way to test without losing USDC!**

---

## 🛍️ New Product Catalog (38 Products!)

### 💰 Budget Items ($1-$5) - Perfect for Testing!
- Single Tea Bag - $1
- Honey Stick - $1.50
- Coffee Sample Pack - $2
- Sea Salt Sample - $2
- Chocolate Square - $2.50
- Mint Tin - $2.50
- Spice Packet - $3
- Chewing Gum Pack - $3
- Artisan Cookie - $3.50
- Organic Granola Bar - $4

### 🛒 Affordable Items ($5-$15)
- Tea Box (20 bags) - $6
- Gourmet Popcorn - $6.50
- Chocolate Bar - $7
- Artisan Crackers - $7.50
- Coffee Bag (250g) - $8
- Dried Fruit Mix - $8.50
- Mixed Nuts Pack - $9
- Fruit Jam Jar - $9.50
- Small Honey Jar - $10
- Protein Bar (6-pack) - $12

### 🌟 Mid-Range Items ($15-$30)
- Artisan Hot Sauce - $14
- Himalayan Sea Salt - $15
- Artisan Pasta Sauce - $16
- Organic Honey Jar - $18
- Maple Syrup (250ml) - $20
- Olive Oil (250ml) - $22
- Balsamic Vinegar (250ml) - $24
- Spice Set (5 pack) - $25

### 💎 Premium Items ($30+)
- Artisan Tea Collection - $35
- Pure Maple Syrup (500ml) - $40
- Ceremonial Matcha Powder - $42
- Craft Chocolate Bar - $45
- Aged Balsamic Vinegar (500ml) - $48
- Premium Coffee Beans (1kg) - $50
- Extra Virgin Olive Oil (750ml) - $55
- Specialty Spice Set - $60
- Madagascar Vanilla Extract - $65
- White Truffle Oil - $85

---

## 🚀 Step-by-Step Testing

### Step 1: Connect Wallet
1. Click "Connect Wallet" button
2. Approve in MetaMask
3. Make sure you're on Base Sepolia

### Step 2: Check Your Balances
You should see:
```
💵 USDC Balance: 20.00 USDC
ETH Balance: ~0.025 ETH
USDC Allowance: 1000.00 USDC
```

### Step 3: Start with a Cheap Product
**Recommended first test:**
1. Select "Single Tea Bag - $1 USDC"
2. Amount shows: 1
3. Merchant address: (your address - already filled)
4. Click "Run Success Flow"

### Step 4: Approve Transaction
1. MetaMask pops up
2. Shows: Sending 1 USDC
3. Gas fee: ~$0.01 in ETH
4. Click "Confirm"

### Step 5: Watch the Magic! ✨
```
🛒 Shopping Agent → Creating intent...
   ✅ Complete

🏪 Merchant Agent → Signing mandate...
   ✅ Complete

🔐 Credentials Provider → AP2 AUTHORIZATION
   ✅ User signing authorization...
   ✅ Complete

💸 Settlement Agent → Executing settlement...
   ✅ Settlement executed!
   TX: 0x1234...
   Block: 12345678
   ✅ Complete

🧾 Receipt Generator → Creating receipt...
   ✅ Receipt stored on-chain
   ✅ Complete

🎉 SUCCESS FLOW COMPLETED!
```

### Step 6: Check Your Balances Again
```
Before:
💵 USDC Balance: 20.00 USDC
ETH Balance: 0.025 ETH

After:
💵 USDC Balance: 20.00 USDC (same! because you sent to yourself)
ETH Balance: 0.024 ETH (only gas fee deducted)
```

---

## 🎮 Testing Scenarios

### Scenario 1: Multiple Small Purchases
Test the system with several cheap items:
1. Buy "Single Tea Bag" - $1
2. Buy "Honey Stick" - $1.50
3. Buy "Coffee Sample" - $2
4. Buy "Chocolate Square" - $2.50

**Result**: USDC stays at 20, only ETH decreases for gas

---

### Scenario 2: Mid-Range Purchase
1. Select "Maple Syrup (250ml) - $20 USDC"
2. This uses your FULL balance
3. After: USDC = 20 (sent to yourself)
4. You can keep testing!

---

### Scenario 3: Test Different Products
Try products from each category:
- Budget: "Mint Tin" - $2.50
- Affordable: "Coffee Bag" - $8
- Mid-Range: "Organic Honey" - $18
- Premium: "Artisan Tea" - $35

---

### Scenario 4: Failure Mode Test
1. Click "Run Failure Demo" button
2. System simulates signature tampering
3. Contract rejects the transaction
4. Shows security enforcement works!

---

## 📊 What to Observe

### Console Output
Watch for these messages:
```
✅ Connected to 0xe7b303...c42D
🛒 Shopping Agent: Intent created
🏪 Merchant Agent: Mandate signed
🔐 AP2 AUTHORIZATION CHECKPOINT
✍️ User signing authorization...
✅ User authorized payment
💸 Executing settlement on Base Sepolia...
✅ Settlement executed!
   TX: 0xabc123...
   Block: 37611234
🧾 Receipt generated and stored on-chain
🎉 SUCCESS FLOW COMPLETED!
```

### Receipt Display
You'll see a JSON receipt with:
```json
{
  "intent_id": "0xabc...",
  "user": "0xe7b30321edC5311Ddf589da2a01cD381Ba6Ac42D",
  "merchant": "0xe7b30321edC5311Ddf589da2a01cD381Ba6Ac42D",
  "authorized_amount": "1.0 USDC",
  "settlement_tx": "0x123...",
  "block_number": 37611234,
  "status": "SUCCESS",
  "timestamp": "2026-02-13T..."
}
```

---

## 🔍 Verify on BaseScan

After each transaction:
1. Click "View on BaseScan" button
2. Or go to: https://sepolia.basescan.org
3. Search your transaction hash
4. You'll see:
   - ✅ USDC transfer: You → You
   - ✅ Contract: PaymentProcessor
   - ✅ Event: SettlementExecuted
   - ✅ Status: Success

---

## 💡 Pro Tips

1. **Start Small**: Test with $1-$5 items first
2. **Same Address = Safe**: You're sending to yourself, so no USDC loss
3. **Gas Fees Only**: You only pay ~$0.01 ETH per transaction
4. **Unlimited Testing**: Since USDC comes back, test as much as you want!
5. **Try All Categories**: Test budget, affordable, mid-range, and premium items

---

## ⚠️ Important Notes

### Your Current Balances:
- **USDC**: 20.00 (can test any product up to $20)
- **ETH**: 0.025 (enough for ~25 transactions)
- **Allowance**: 1000 (plenty for any test)

### What Gets Deducted:
- ❌ USDC: Nothing (you send to yourself)
- ✅ ETH: Only gas fees (~$0.01 per transaction)

### When to Stop:
- When ETH runs low (below 0.005)
- Get more ETH from Base Sepolia faucet if needed

---

## 🎯 Recommended Test Sequence

### Test 1: Cheapest Item
- Product: "Single Tea Bag" - $1
- Purpose: Verify basic flow works
- Expected: Success, minimal gas

### Test 2: Multiple Small Items
- Products: Tea Bag, Honey Stick, Coffee Sample
- Purpose: Test multiple transactions
- Expected: All succeed

### Test 3: Mid-Range Item
- Product: "Organic Honey Jar" - $18
- Purpose: Test larger amount
- Expected: Success

### Test 4: Maximum Balance
- Product: "Maple Syrup (250ml)" - $20
- Purpose: Test full balance usage
- Expected: Success

### Test 5: Failure Mode
- Click: "Run Failure Demo"
- Purpose: Verify security
- Expected: Transaction rejected

---

## ✅ Success Checklist

After testing, you should have:
- [ ] Connected wallet successfully
- [ ] Saw USDC balance (20.00)
- [ ] Bought at least 1 cheap item ($1-$5)
- [ ] Bought at least 1 mid-range item ($15-$30)
- [ ] Saw all 5 agent steps complete
- [ ] Received a receipt
- [ ] Verified transaction on BaseScan
- [ ] Tested failure mode
- [ ] USDC balance still at 20.00
- [ ] Only ETH decreased (gas fees)

---

## 🎉 You're Ready!

**Start with**: "Single Tea Bag - $1 USDC"

This is the safest, cheapest way to test the entire AP2 payment flow!

Remember: You're sending to yourself, so your USDC stays safe! 🔒
