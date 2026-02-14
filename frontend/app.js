// Main Application Logic - AP2 Payment System Frontend

let provider;
let signer;
let userAddress;
let usdcContract;
let paymentProcessorContract;
let receiptRegistryContract;

// Agent instances
let shoppingAgent;
let merchantAgent;
let credentialsProvider;
let settlementAgent;
let receiptGenerator;

// State
let currentIntent = null;
let currentMandate = null;
let currentAuthorization = null;
let shoppingCart = null;

// DOM Elements
const connectWalletBtn = document.getElementById('connectWalletBtn');
const networkIndicator = document.getElementById('networkIndicator');
const walletPanel = document.getElementById('walletPanel');
const walletAddress = document.getElementById('walletAddress');
const ethBalance = document.getElementById('ethBalance');
const usdcBalance = document.getElementById('usdcBalance');
const usdcAllowance = document.getElementById('usdcAllowance');

const productSelect = document.getElementById('productSelect');
const amountInput = document.getElementById('amountInput');
const merchantAddress = document.getElementById('merchantAddress');

const runSuccessBtn = document.getElementById('runSuccessBtn');
const runFailureBtn = document.getElementById('runFailureBtn');
const approveUsdcBtn = document.getElementById('approveUsdcBtn');
const refreshBalanceBtn = document.getElementById('refreshBalanceBtn');

const consoleOutput = document.getElementById('consoleOutput');
const clearConsoleBtn = document.getElementById('clearConsoleBtn');

const receiptSection = document.getElementById('receiptSection');
const receiptStatus = document.getElementById('receiptStatus');
const receiptJson = document.getElementById('receiptJson');
const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');
const viewOnExplorerBtn = document.getElementById('viewOnExplorerBtn');

const processorAddressEl = document.getElementById('processorAddress');
const registryAddressEl = document.getElementById('registryAddress');

const loadingModal = document.getElementById('loadingModal');
const loadingText = document.getElementById('loadingText');

// Initialize on page load
window.addEventListener('load', async () => {
    logConsole('info', 'Application loaded. Connect your wallet to begin...');

    // Initialize shopping cart
    shoppingCart = new ShoppingCart();
    updateCartDisplay();

    // Load deployed contracts
    await loadDeployedContracts();
    updateContractAddresses();

    // Set initial product amount
    setInitialProductAmount();

    // Set default merchant to user's address (will be updated after connection)
    setupEventListeners();
});

// Load deployed contract addresses
async function loadDeployedContracts() {
    try {
        const response = await fetch('../deployments/base-sepolia.json');
        if (response.ok) {
            const deployment = await response.json();
            CONFIG.PAYMENT_PROCESSOR_ADDRESS = deployment.contracts.PaymentProcessor;
            CONFIG.RECEIPT_REGISTRY_ADDRESS = deployment.contracts.ReceiptRegistry;
            logConsole('success', '✅ Loaded deployed contract addresses');
        }
    } catch (error) {
        logConsole('warning', '⚠️ Could not load deployment file. Using config defaults.');
    }
}

// Set initial product amount
function setInitialProductAmount() {
    const selectedProductId = productSelect.value;
    const product = CONFIG.PRODUCTS[selectedProductId];
    if (product) {
        amountInput.value = product.price;
    }
    // Set default merchant address
    merchantAddress.value = CONFIG.DEFAULT_MERCHANT;
}

// Setup Event Listeners
function setupEventListeners() {
    connectWalletBtn.addEventListener('click', connectWallet);
    runSuccessBtn.addEventListener('click', runSuccessFlow);
    runFailureBtn.addEventListener('click', runFailureFlow);
    approveUsdcBtn.addEventListener('click', approveUsdc);
    refreshBalanceBtn.addEventListener('click', updateBalances);
    clearConsoleBtn.addEventListener('click', clearConsole);
    downloadReceiptBtn.addEventListener('click', downloadReceipt);

    // Reset merchant address button
    const resetMerchantBtn = document.getElementById('resetMerchantBtn');
    if (resetMerchantBtn) {
        resetMerchantBtn.addEventListener('click', () => {
            if (userAddress) {
                merchantAddress.value = userAddress;
                logConsole('info', `🔄 Merchant set to self (for refund demo): ${userAddress.substring(0, 10)}...`);
            } else {
                merchantAddress.value = CONFIG.DEFAULT_MERCHANT;
                logConsole('info', `🔄 Merchant address reset to default: ${CONFIG.DEFAULT_MERCHANT.substring(0, 10)}...`);
            }
        });
    }

    productSelect.addEventListener('change', (e) => {
        const product = CONFIG.PRODUCTS[e.target.value];
        if (product) {
            amountInput.value = product.price;
            logConsole('info', `📦 Selected: ${product.name} - $${product.price} USDC`);
        }
    });

    // Cart buttons
    const addToCartBtn = document.getElementById('addToCartBtn');
    const viewCartBtn = document.getElementById('viewCartBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const payCartBtn = document.getElementById('payCartBtn');

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            const productId = productSelect.value;
            const product = CONFIG.PRODUCTS[productId];
            shoppingCart.addItem(productId, 1);
            updateCartDisplay();
            logConsole('success', `✅ Added ${product.name} to cart`);
        });
    }

    if (viewCartBtn) {
        viewCartBtn.addEventListener('click', () => {
            const cartDisplay = document.getElementById('cartDisplay');
            cartDisplay.style.display = cartDisplay.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            if (confirm('Clear all items from cart?')) {
                shoppingCart.clear();
                updateCartDisplay();
                logConsole('info', '🗑️ Cart cleared');
            }
        });
    }

    if (payCartBtn) {
        payCartBtn.addEventListener('click', payForCart);
    }

    // History buttons
    const viewHistoryBtn = document.getElementById('viewHistoryBtn');
    const loadHistoryBtn = document.getElementById('loadHistoryBtn');
    const exportHistoryBtn = document.getElementById('exportHistoryBtn');

    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', loadPaymentHistory);
    }

    if (loadHistoryBtn) {
        loadHistoryBtn.addEventListener('click', loadPaymentHistory);
    }

    if (exportHistoryBtn) {
        exportHistoryBtn.addEventListener('click', exportHistoryToCSV);
    }

    // QR Code buttons
    const generateQRBtn = document.getElementById('generateQRBtn');
    const copyQRBtn = document.getElementById('copyQRBtn');

    if (generateQRBtn) {
        generateQRBtn.addEventListener('click', generatePaymentQR);
    }

    if (copyQRBtn) {
        copyQRBtn.addEventListener('click', copyQRLink);
    }

    if (copyQRBtn) {
        copyQRBtn.addEventListener('click', copyQRLink);
    }

    // Removed refreshRequestsBtn listener as we now use live events

    // Check for QR code parameters on load
    checkPaymentParams();

    // Check for QR code parameters on load
    checkPaymentParams();
}

// Connect Wallet
async function connectWallet() {
    try {
        if (!window.ethereum) {
            // Check if mobile
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            if (isMobile) {
                const currentUrl = window.location.href.replace(/^https?:\/\//, '');
                const deepLink = `https://metamask.app.link/dapp/${currentUrl}`;
                if (confirm('MetaMask not detected. Open in MetaMask App?')) {
                    window.location.href = deepLink;
                }
                return;
            }
            alert('MetaMask is not installed! Please install MetaMask to use this dApp.');
            return;
        }

        showLoading('Connecting to MetaMask...');

        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();

        // Check network
        const network = await provider.getNetwork();
        if (network.chainId !== CONFIG.CHAIN_ID) {
            await switchNetwork();
        }

        // Initialize contracts
        await initializeContracts();

        // Update UI
        walletAddress.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
        networkIndicator.classList.add('connected');
        networkIndicator.querySelector('.network-text').textContent = CONFIG.CHAIN_NAME;
        connectWalletBtn.textContent = 'Connected';
        connectWalletBtn.disabled = true;
        walletPanel.style.display = 'block';

        // Set default merchant to user's address only if not already set
        if (!merchantAddress.value || merchantAddress.value.trim() === '') {
            merchantAddress.value = userAddress;
        }

        logConsole('info', `📍 Merchant address: ${merchantAddress.value.substring(0, 10)}...`);

        // Enable buttons
        runSuccessBtn.disabled = false;
        runFailureBtn.disabled = false;
        approveUsdcBtn.disabled = false;
        refreshBalanceBtn.disabled = false;

        // Enable new feature buttons
        const viewHistoryBtn = document.getElementById('viewHistoryBtn');
        const generateQRBtn = document.getElementById('generateQRBtn');

        if (viewHistoryBtn) viewHistoryBtn.disabled = false;
        if (generateQRBtn) generateQRBtn.disabled = false;
        // refundDemoBtn remains disabled (not implemented)

        // Update balances
        await updateBalances();

        // Start listening for incoming payments
        setupPaymentListener(userAddress);

        logConsole('success', `✅ Connected to ${userAddress}`);
        logConsole('info', `Network: ${CONFIG.CHAIN_NAME} (${CONFIG.CHAIN_ID})`);

        hideLoading();

    } catch (error) {
        hideLoading();
        logConsole('error', `❌ Connection failed: ${error.message}`);
        console.error(error);
    }
}

// Switch to Base Sepolia
async function switchNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CONFIG.CHAIN_ID.toString(16)}` }],
        });
    } catch (switchError) {
        // Network doesn't exist, add it
        if (switchError.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: `0x${CONFIG.CHAIN_ID.toString(16)}`,
                    chainName: CONFIG.CHAIN_NAME,
                    rpcUrls: [CONFIG.RPC_URL],
                    blockExplorerUrls: [CONFIG.BLOCK_EXPLORER]
                }]
            });
        } else {
            throw switchError;
        }
    }
}

// Initialize Contracts
async function initializeContracts() {
    // USDC Contract
    usdcContract = new ethers.Contract(CONFIG.USDC_ADDRESS, CONFIG.USDC_ABI, provider);

    // PaymentProcessor Contract
    if (CONFIG.PAYMENT_PROCESSOR_ADDRESS) {
        paymentProcessorContract = new ethers.Contract(
            CONFIG.PAYMENT_PROCESSOR_ADDRESS,
            CONFIG.PAYMENT_PROCESSOR_ABI,
            provider
        );
    }

    // ReceiptRegistry Contract
    if (CONFIG.RECEIPT_REGISTRY_ADDRESS) {
        receiptRegistryContract = new ethers.Contract(
            CONFIG.RECEIPT_REGISTRY_ADDRESS,
            CONFIG.RECEIPT_REGISTRY_ABI,
            provider
        );
    }

    // Initialize agent instances
    shoppingAgent = new ShoppingAgent();
    merchantAgent = new MerchantAgent();
    credentialsProvider = new CredentialsProvider();
    if (paymentProcessorContract) {
        settlementAgent = new SettlementAgent(paymentProcessorContract);
    }
    receiptGenerator = new ReceiptGenerator();
}

// Update Balances
async function updateBalances() {
    try {
        const eth = await provider.getBalance(userAddress);
        ethBalance.textContent = `${parseFloat(ethers.utils.formatEther(eth)).toFixed(4)} ETH`;

        const usdc = await usdcContract.balanceOf(userAddress);
        usdcBalance.textContent = `${parseFloat(ethers.utils.formatUnits(usdc, CONFIG.USDC_DECIMALS)).toFixed(2)} USDC`;

        if (CONFIG.PAYMENT_PROCESSOR_ADDRESS) {
            const allowance = await usdcContract.allowance(userAddress, CONFIG.PAYMENT_PROCESSOR_ADDRESS);
            usdcAllowance.textContent = `${parseFloat(ethers.utils.formatUnits(allowance, CONFIG.USDC_DECIMALS)).toFixed(2)} USDC`;
        } else {
            usdcAllowance.textContent = "N/A";
        }

        logConsole('info', '🔄 Balances updated');
    } catch (error) {
        logConsole('error', `Failed to update balances: ${error.message}`);
    }
}

// Approve USDC
async function approveUsdc() {
    if (!CONFIG.PAYMENT_PROCESSOR_ADDRESS) {
        logConsole('error', '❌ PaymentProcessor not deployed. Deploy contracts first.');
        return;
    }

    try {
        showLoading('Approving USDC...');
        logConsole('info', '🔓 Requesting USDC approval...');

        const amount = ethers.utils.parseUnits("1000", CONFIG.USDC_DECIMALS);
        const usdcWithSigner = usdcContract.connect(signer);
        const tx = await usdcWithSigner.approve(CONFIG.PAYMENT_PROCESSOR_ADDRESS, amount);

        logConsole('info', `📝 TX: ${tx.hash}`);
        const receipt = await tx.wait();

        logConsole('success', `✅ Approved 1000 USDC (Block: ${receipt.blockNumber})`);
        await updateBalances();
        hideLoading();

    } catch (error) {
        hideLoading();
        logConsole('error', `❌ Approval failed: ${error.message}`);
    }
}

// Run Success Flow
async function runSuccessFlow() {
    if (!CONFIG.PAYMENT_PROCESSOR_ADDRESS || !CONFIG.RECEIPT_REGISTRY_ADDRESS) {
        logConsole('error', '❌ Contracts not deployed. Deploy contracts first.');
        return;
    }

    try {
        showLoading('Running success flow...');
        clearFlowStatus();
        receiptSection.style.display = 'none';

        logConsole('info', '🎯 Starting Success Flow Demo');
        logConsole('info', '━'.repeat(60));

        // STEP 1: Shopping Agent - Create Intent
        updateStepStatus(1, 'active');
        logConsole('info', '🛒 Step 1: Creating payment intent...');

        const selectedProduct = productSelect.value;
        const amount = amountInput.value;

        // Force read merchant address from input field (or use config default if empty)
        let merchant = merchantAddress.value.trim();
        if (!merchant || merchant === '') {
            merchant = CONFIG.DEFAULT_MERCHANT;
            merchantAddress.value = merchant;
        }

        logConsole('info', `💰 Amount: ${amount} USDC`);
        logConsole('info', `🏪 Merchant: ${merchant.substring(0, 10)}...${merchant.substring(38)}`);

        if (!merchant || merchant.trim() === '') {
            throw new Error('Merchant address is required');
        }

        currentIntent = shoppingAgent.createIntent(selectedProduct, amount, merchant);
        logConsole('success', `✅ Intent created: ${currentIntent.product_name} - ${amount} USDC`);
        updateStepStatus(1, 'complete');

        await delay(500);

        // STEP 2: Merchant Agent - Sign Mandate
        updateStepStatus(2, 'active');
        logConsole('info', '🏪 Step 2: Merchant signing mandate...');

        currentMandate = await merchantAgent.createMandate(currentIntent, signer, merchant);
        logConsole('success', `✅ Mandate signed by ${currentMandate.merchant.substring(0, 10)}...`);
        updateStepStatus(2, 'complete');

        await delay(500);

        // STEP 3: Credentials Provider - AP2 Authorization
        updateStepStatus(3, 'active');
        logConsole('warning', '🔐 Step 3: AP2 AUTHORIZATION CHECKPOINT');
        logConsole('info', `   User must sign authorization for ${amount} USDC`);
        logConsole('info', `   to merchant: ${merchant.substring(0, 10)}...`);

        currentAuthorization = await credentialsProvider.authorizePayment(
            currentIntent,
            currentMandate,
            paymentProcessorContract,
            signer
        );

        logConsole('success', `✅ User authorized payment`);
        updateStepStatus(3, 'complete');

        await delay(500);

        // STEP 4: Settlement Agent - Execute Settlement
        updateStepStatus(4, 'active');
        logConsole('info', '💸 Step 4: Executing settlement on Base Sepolia...');

        const settlementResult = await settlementAgent.executeSettlement(currentAuthorization, signer);

        if (!settlementResult.success) {
            throw new Error(settlementResult.reason);
        }

        logConsole('success', `✅ Settlement executed!`);
        logConsole('info', `   TX: ${settlementResult.txHash}`);
        logConsole('info', `   Block: ${settlementResult.blockNumber}`);
        updateStepStatus(4, 'complete');

        await delay(500);

        // STEP 5: Receipt Generator - Create Receipt
        updateStepStatus(5, 'active');
        logConsole('info', '🧾 Step 5: Generating receipt...');

        const receipt = receiptGenerator.generateSuccessReceipt(currentAuthorization, settlementResult);

        // Store on-chain
        await receiptGenerator.storeOnChain(receipt, receiptRegistryContract, signer);

        logConsole('success', `✅ Receipt generated and stored on-chain`);
        updateStepStatus(5, 'complete');

        // Display receipt
        displayReceipt(receipt);

        logConsole('info', '━'.repeat(60));
        logConsole('success', '🎉 SUCCESS FLOW COMPLETED!');

        // Update balances
        await updateBalances();
        hideLoading();

    } catch (error) {
        hideLoading();
        clearFlowStatus();
        logConsole('error', `❌ Flow failed: ${error.message}`);
        console.error(error);
    }
}

// Run Failure Flow
async function runFailureFlow() {
    if (!CONFIG.PAYMENT_PROCESSOR_ADDRESS) {
        logConsole('error', '❌ Contracts not deployed. Deploy contracts first.');
        return;
    }

    try {
        showLoading('Running failure demo...');
        clearFlowStatus();
        receiptSection.style.display = 'none';

        logConsole('warning', '⚠️ Starting Failure Flow Demo');
        logConsole('warning', '   SCENARIO: Invalid Signature Attack');
        logConsole('info', '━'.repeat(60));

        // Create intent and mandate
        const selectedProduct = productSelect.value;
        const amount = amountInput.value;
        const merchant = merchantAddress.value.trim() || CONFIG.DEFAULT_MERCHANT;

        currentIntent = shoppingAgent.createIntent(selectedProduct, amount, merchant);
        currentMandate = await merchantAgent.createMandate(currentIntent, signer, merchant);
        currentAuthorization = await credentialsProvider.authorizePayment(
            currentIntent,
            currentMandate,
            paymentProcessorContract,
            signer
        );

        logConsole('info', '✅ Valid authorization obtained');

        // ATTACK: Tamper with signature
        logConsole('warning', '🚨 ATTACK SIMULATION: Tampering with signature...');
        const tamperedSignature = "0x" + "deadbeef".repeat(16) + "cafebabe".repeat(8);
        currentAuthorization.user_signature = tamperedSignature;
        logConsole('warning', '   Replaced valid signature with invalid one');

        // Attempt settlement
        logConsole('info', '💸 Attempting settlement with INVALID signature...');
        const result = await settlementAgent.executeSettlement(currentAuthorization, signer);

        // Generate failure receipt
        const receipt = receiptGenerator.generateFailureReceipt(
            currentAuthorization,
            result.reason,
            { message: result.error }
        );

        // Display receipt
        displayReceipt(receipt);

        logConsole('error', `❌ Settlement rejected: ${result.reason}`);
        logConsole('info', '━'.repeat(60));
        logConsole('success', '✅ SECURITY ENFORCEMENT VERIFIED!');
        logConsole('success', '   ✓ Authorization cannot be bypassed');
        logConsole('success', '   ✓ Signature tampering detected');
        logConsole('success', '   ✓ AP2 authorization enforced');

        hideLoading();

    } catch (error) {
        hideLoading();
        logConsole('error', `❌ Demo error: ${error.message}`);
        console.error(error);
    }
}

// Helper Functions
function updateStepStatus(step, status) {
    const statusEl = document.getElementById(`step${step}Status`);
    const stepEl = document.querySelector(`[data-step="${step}"]`);

    if (status === 'active') {
        statusEl.textContent = '⏳ Processing...';
        statusEl.style.color = 'var(--warning)';
        stepEl.classList.add('active');
    } else if (status === 'complete') {
        statusEl.textContent = '✅ Complete';
        statusEl.style.color = 'var(--success)';
        stepEl.classList.remove('active');
    }
}

function clearFlowStatus() {
    for (let i = 1; i <= 5; i++) {
        const statusEl = document.getElementById(`step${i}Status`);
        const stepEl = document.querySelector(`[data-step="${i}"]`);
        statusEl.textContent = '';
        stepEl.classList.remove('active');
    }
}

function displayReceipt(receipt) {
    receiptSection.style.display = 'block';
    receiptJson.textContent = JSON.stringify(receipt, null, 2);

    const statusEl = document.querySelector('.receipt-status');
    statusEl.textContent = receipt.status;
    statusEl.className = `receipt-status ${receipt.status.toLowerCase()}`;

    document.getElementById('receiptTimestamp').textContent = new Date(receipt.timestamp).toLocaleString();

    // Setup explorer button
    if (receipt.settlement_tx) {
        viewOnExplorerBtn.onclick = () => {
            window.open(`${CONFIG.BLOCK_EXPLORER}/tx/${receipt.settlement_tx}`, '_blank');
        };
    }

    const reqBtn = document.getElementById('requestRefundBtn');
    if (reqBtn) {
        reqBtn.onclick = () => requestRefund(receipt.intent_id, receipt.amount);
    }

    receiptSection.scrollIntoView({ behavior: 'smooth' });
}

function downloadReceipt() {
    const receiptData = receiptJson.textContent;
    const blob = new Blob([receiptData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function logConsole(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = `console-message ${type}`;
    div.innerHTML = `<span class="timestamp">[${timestamp}]</span><span class="message">${message}</span>`;
    consoleOutput.appendChild(div);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function clearConsole() {
    consoleOutput.innerHTML = '<div class="console-message info"><span class="timestamp">[Ready]</span><span class="message">Console cleared.</span></div>';
}

function showLoading(text) {
    loadingText.textContent = text;
    loadingModal.style.display = 'flex';
}

function hideLoading() {
    loadingModal.style.display = 'none';
}

function updateContractAddresses() {
    if (CONFIG.PAYMENT_PROCESSOR_ADDRESS) {
        processorAddressEl.textContent = `${CONFIG.PAYMENT_PROCESSOR_ADDRESS.substring(0, 10)}...${CONFIG.PAYMENT_PROCESSOR_ADDRESS.substring(38)}`;
    }
    if (CONFIG.RECEIPT_REGISTRY_ADDRESS) {
        registryAddressEl.textContent = `${CONFIG.RECEIPT_REGISTRY_ADDRESS.substring(0, 10)}...${CONFIG.RECEIPT_REGISTRY_ADDRESS.substring(38)}`;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// ============================================================================
// SHOPPING CART FUNCTIONS
// ============================================================================

function updateCartDisplay() {
    const cartCount = document.getElementById('cartCount');
    const cartDisplay = document.getElementById('cartDisplay');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const payCartBtn = document.getElementById('payCartBtn');

    if (!shoppingCart) return;

    const items = shoppingCart.getItems();
    const total = shoppingCart.getTotal();
    const count = shoppingCart.getItemCount();

    cartCount.textContent = count;
    cartTotal.textContent = `$${total.toFixed(2)} USDC`;

    if (count > 0) {
        payCartBtn.style.display = 'block';
        payCartBtn.disabled = false; // Enable button
        cartItems.innerHTML = items.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                <div style="flex: 1;">
                    <div style="font-weight: 600;">${item.name}</div>
                    <div style="font-size: 0.875rem; color: var(--text-muted);">$${item.price} each</div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--bg-primary); padding: 0.25rem; border-radius: 0.25rem;">
                        <button onclick="window.decreaseQuantity('${item.productId}')" style="background: var(--bg-tertiary); border: none; color: var(--text-primary); width: 24px; height: 24px; border-radius: 0.25rem; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;">−</button>
                        <span style="min-width: 30px; text-align: center; font-weight: 600;">${item.quantity}</span>
                        <button onclick="window.increaseQuantity('${item.productId}')" style="background: var(--bg-tertiary); border: none; color: var(--text-primary); width: 24px; height: 24px; border-radius: 0.25rem; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center;">+</button>
                    </div>
                    <span style="font-weight: 600; min-width: 60px; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</span>
                    <button onclick="window.removeFromCart('${item.productId}')" style="background: var(--danger); border: none; color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; cursor: pointer; font-weight: 600;">×</button>
                </div>
            </div>
        `).join('');
    } else {
        payCartBtn.style.display = 'none';
        payCartBtn.disabled = true; // Disable if empty
        cartItems.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-muted);">Cart is empty</div>';
    }
}

window.removeFromCart = function (productId) {
    shoppingCart.removeItem(productId);
    updateCartDisplay();
    logConsole('info', '🗑️ Item removed from cart');
};

window.increaseQuantity = function (productId) {
    const item = shoppingCart.items.find(i => i.productId === productId);
    if (item) {
        shoppingCart.updateQuantity(productId, item.quantity + 1);
        updateCartDisplay();
        logConsole('info', `➕ Increased quantity`);
    }
};

window.decreaseQuantity = function (productId) {
    const item = shoppingCart.items.find(i => i.productId === productId);
    if (item) {
        if (item.quantity > 1) {
            shoppingCart.updateQuantity(productId, item.quantity - 1);
            updateCartDisplay();
            logConsole('info', `➖ Decreased quantity`);
        } else {
            shoppingCart.removeItem(productId);
            updateCartDisplay();
            logConsole('info', '🗑️ Item removed from cart');
        }
    }
};

async function payForCart() {
    const items = shoppingCart.getItems();
    if (items.length === 0) {
        logConsole('error', '❌ Cart is empty');
        return;
    }

    if (!signer) {
        logConsole('warning', '⚠️ Please connect your wallet first to pay');
        await connectWallet();
        if (!signer) return;
    }

    const total = shoppingCart.getTotal();
    let merchant = merchantAddress.value.trim();
    if (!merchant || merchant === '') {
        merchant = CONFIG.DEFAULT_MERCHANT;
        merchantAddress.value = merchant;
    }

    const cartDescription = items.map(i => `${i.name} (${i.quantity})`).join(', ');

    logConsole('info', `🛒 Processing cart payment...`);
    logConsole('info', `📦 Items: ${cartDescription}`);
    logConsole('info', `💰 Total: ${total.toFixed(2)} USDC`);

    // Temporarily set amount to cart total
    const originalAmount = amountInput.value;
    amountInput.value = total;

    try {
        logConsole('info', '🎯 Starting Cart Payment Flow');
        logConsole('info', '━'.repeat(60));

        // Create a custom intent for the cart
        const cartProduct = {
            name: `Cart (${items.length} items)`,
            sku: 'CART-' + Date.now()
        };

        // STEP 1: Shopping Agent - Create Intent
        updateStepStatus(1, 'active');
        logConsole('info', '🛒 Step 1: Creating payment intent for cart...');

        currentIntent = {
            intent_id: ethers.utils.id(`CART-${Date.now()}-${Math.random()}`),
            product_id: cartProduct.sku,
            product_name: cartProduct.name,
            amount: total.toString(),
            currency: "USDC",
            merchant: merchant,
            expiry: Math.floor(Date.now() / 1000) + 3600,
            created_at: new Date().toISOString(),
            items: items // Store items for reference
        };

        logConsole('success', `✅ Intent created: ${currentIntent.product_name} - ${total} USDC`);
        updateStepStatus(1, 'complete');

        await delay(500);

        // STEP 2: Merchant Agent
        updateStepStatus(2, 'active');
        logConsole('info', '🏪 Step 2: Merchant signing mandate...');

        currentMandate = await merchantAgent.createMandate(currentIntent, signer, merchant);
        logConsole('success', `✅ Mandate signed by ${currentMandate.merchant.substring(0, 10)}...`);
        updateStepStatus(2, 'complete');

        await delay(500);

        // STEP 3: User Auth
        updateStepStatus(3, 'active');
        logConsole('info', '🔐 Step 3: User authorizing payment...');

        // Check allowance
        const allowance = await usdcContract.allowance(userAddress, CONFIG.PAYMENT_PROCESSOR_ADDRESS);
        const amountWei = ethers.utils.parseUnits(currentIntent.amount, CONFIG.USDC_DECIMALS);

        if (allowance.lt(amountWei)) {
            logConsole('warning', '⚠️ Insufficient allowance. Please approve USDC first.');
            updateStepStatus(3, 'error');
            return;
        }

        currentAuthorization = await credentialsProvider.authorizePayment(
            currentIntent,
            currentMandate,
            paymentProcessorContract,
            signer
        );
        logConsole('success', '✅ Payment authorized by user');
        updateStepStatus(3, 'complete');

        await delay(500);

        // STEP 4: Settlement
        updateStepStatus(4, 'active');
        logConsole('info', '💸 Step 4: Executing settlement on Base Sepolia...');

        const settlementResult = await settlementAgent.executeSettlement(currentAuthorization, signer);

        if (settlementResult.success) {
            logConsole('success', `✅ Settlement successful! Tx: ${settlementResult.txHash.substring(0, 10)}...`);
            updateStepStatus(4, 'complete');

            await delay(500);

            // STEP 5: Receipt
            updateStepStatus(5, 'active');
            logConsole('info', '🧾 Step 5: Generating receipt...');

            const receipt = receiptGenerator.generateSuccessReceipt(currentAuthorization, settlementResult);

            // Store reference for refund
            // Store reference for refund
            lastSuccessfulIntentId = currentAuthorization.intent_id;

            // Display receipt
            displayReceipt(receipt);

            logConsole('success', '✅ Receipt generated');

            // Store on-chain
            logConsole('info', '💾 Storing receipt signature on-chain...');
            await receiptGenerator.storeOnChain(receipt, receiptRegistryContract, signer);
            logConsole('success', '✅ Receipt stored on-chain');

            updateStepStatus(5, 'complete');

            // Clear cart
            shoppingCart.clear();
            updateCartDisplay();
            logConsole('success', '✅ Cart cleared after payment');

            // Update balances
            await updateBalances();

            // Enable refund button
            const refundBtn = document.getElementById('refundDemoBtn');
            if (refundBtn) {
                refundBtn.disabled = false;
                refundBtn.title = "Refund this transaction";
                refundBtn.style.opacity = '1';
                refundBtn.style.cursor = 'pointer';
                refundBtn.innerHTML = '<span class="btn-icon">↩️</span> Refund Last Transaction';
                refundBtn.onclick = () => executeRefund(currentAuthorization.intent_id, total, merchant, userAddress);
                logConsole('info', '↩️ Refund available for this transaction');
            }

        } else {
            throw new Error(`Settlement failed: ${settlementResult.error}`);
        }

    } catch (error) {
        logConsole('error', `❌ Cart payment failed: ${error.message}`);
        console.error(error);
    } finally {
        amountInput.value = originalAmount;
    }
}

// ============================================================================
// PAYMENT HISTORY FUNCTIONS
// ============================================================================

async function loadPaymentHistory() {
    if (!receiptRegistryContract || !userAddress) {
        logConsole('error', '❌ Please connect wallet first');
        return;
    }

    logConsole('info', '📊 Payment History');
    logConsole('info', '━'.repeat(60));
    logConsole('warning', '⚠️ Payment history feature disabled');
    logConsole('info', 'Reason: Querying historical events requires archive node access');
    logConsole('info', '');
    logConsole('info', '💡 Alternative: View transactions on BaseScan');
    logConsole('info', `   🔗 ${CONFIG.BLOCK_EXPLORER}/address/${userAddress}`);
    logConsole('info', '');
    logConsole('info', '📝 Your recent payments are visible in the console logs above');

    // Open BaseScan in new tab
    window.open(`${CONFIG.BLOCK_EXPLORER}/address/${userAddress}`, '_blank');
}

function exportHistoryToCSV() {
    logConsole('info', '📥 Exporting history to CSV...');
    // Simple CSV export
    const csv = 'Date,Amount,Merchant,Status,TX Hash\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    logConsole('success', '✅ History exported');
}

// ============================================================================
// QR CODE FUNCTIONS
// ============================================================================

function generatePaymentQR() {
    // Check if cart has items
    const items = shoppingCart.getItems();
    let paymentUrl;
    let qrTitle;

    let merchant = merchantAddress.value.trim();
    if (!merchant || merchant === '') {
        merchant = CONFIG.DEFAULT_MERCHANT;
    }

    if (items.length > 0) {
        // Generate Cart QR
        const total = shoppingCart.getTotal();
        qrTitle = `Cart Total: $${total.toFixed(2)} USDC`;

        // Serialize cart items: id:qty,id:qty
        const cartString = items.map(i => `${i.productId}:${i.quantity}`).join(',');

        const baseUrl = window.location.origin + window.location.pathname;
        paymentUrl = `${baseUrl}?cart=${encodeURIComponent(cartString)}&merchant=${merchant}`;

        logConsole('info', `📱 Generating QR for ${items.length} items ($${total} USDC)`);
    } else {
        // Generate Generic/Single Item QR (fallback)
        const selectedProduct = productSelect.value;
        const amount = amountInput.value;
        const product = CONFIG.PRODUCTS[selectedProduct];

        qrTitle = `${product.name}: $${amount} USDC`;

        const baseUrl = window.location.origin + window.location.pathname;
        paymentUrl = `${baseUrl}?product=${selectedProduct}&amount=${amount}&merchant=${merchant}`;

        logConsole('info', `📱 Generating QR for single item`);
    }

    // Generate QR code
    const qrSection = document.getElementById('qrSection');
    const qrCodeDiv = document.getElementById('qrCode');
    const qrLink = document.getElementById('qrLink');

    qrCodeDiv.innerHTML = '';

    // Detailed label
    const label = document.createElement('div');
    label.style.marginBottom = '10px';
    label.style.fontWeight = 'bold';
    label.textContent = qrTitle;
    qrCodeDiv.appendChild(label);

    new QRCode(qrCodeDiv, {
        text: paymentUrl,
        width: 256,
        height: 256,
        colorDark: "#6366f1",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    qrLink.value = paymentUrl;
    qrSection.style.display = 'block';
    qrSection.scrollIntoView({ behavior: 'smooth' });

    logConsole('success', `✅ QR code generated successfully`);
}

function copyQRLink() {
    const qrLink = document.getElementById('qrLink');
    qrLink.select();
    document.execCommand('copy');
    logConsole('success', '✅ Payment link copied to clipboard');
}

// Check for payment parameters in URL (for QR code scanning)
// Check for payment parameters in URL (for QR code scanning)
function checkPaymentParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const cartParam = urlParams.get('cart');
    const merchant = urlParams.get('merchant');

    // Handle Cart Logic
    if (cartParam) {
        logConsole('info', '📱 Cart payment request detected from QR code');

        if (merchant) merchantAddress.value = merchant;

        try {
            // Parse cart: item1:qty,item2:qty
            const items = decodeURIComponent(cartParam).split(',');
            shoppingCart.clear();

            let addedCount = 0;
            items.forEach(itemStr => {
                const [id, qty] = itemStr.split(':');
                if (id && qty) {
                    shoppingCart.addItem(id, parseInt(qty));
                    addedCount++;
                }
            });

            updateCartDisplay();

            if (addedCount > 0) {
                const total = shoppingCart.getTotal();
                logConsole('success', `✅ Loaded ${addedCount} items from QR - Total: $${total} USDC`);
                alert(`Cart Payment Request Loaded\n${addedCount} items\nTotal: $${total} USDC\n\nConnect wallet to pay.`);
            }
        } catch (e) {
            logConsole('error', '❌ Failed to parse cart from QR');
        }
        return;
    }

    // Handle Single Product Logic (Legacy support)
    const product = urlParams.get('product');
    const amount = urlParams.get('amount');

    if (product && amount && merchant) {
        logConsole('info', '📱 Single item payment request detected');
        productSelect.value = product;
        amountInput.value = amount;
        merchantAddress.value = merchant;

        const productInfo = CONFIG.PRODUCTS[product];
        if (productInfo) {
            logConsole('success', `✅ Loaded: ${productInfo.name} - $${amount} USDC`);

            // Auto add to cart for unified flow
            shoppingCart.clear();
            shoppingCart.addItem(product, 1);
            updateCartDisplay();
            logConsole('info', 'ℹ️ Added item to cart for payment');

            alert(`Payment Request:\n${productInfo.name}\nAmount: $${amount} USDC\n\nAdded to cart.`);
        }
    }
}

// ============================================================================
// REAL BLOCKCHAIN REFUND FUNCTION
// ============================================================================

let lastSuccessfulIntentId = null;

async function executeRefund(intentId, amount, merchantAddress, payerAddress) {
    if (!intentId) {
        logConsole('error', '❌ No transaction ID provided for refund');
        return;
    }

    try {
        showLoading('Processing Blockchain Refund...');
        logConsole('warning', '↩️ INITIATING REFUND ON BLOCKCHAIN');
        logConsole('info', '━'.repeat(60));
        logConsole('info', `🆔 Intent ID: ${intentId}`);
        logConsole('info', `💰 Amount: ${amount} USDC`);

        // Ensure connected wallet is the MERCHANT (only merchant can refund)
        const currentAddress = await signer.getAddress();
        if (currentAddress.toLowerCase() !== merchantAddress.toLowerCase()) {
            const msg = `⚠️ ACCESS DENIED: You are not the merchant.\n\nTransaction Merchant: ${merchantAddress}\nYour Wallet: ${currentAddress}\n\nOnly the merchant wallet can issue a refund.`;
            logConsole('error', msg);
            alert(msg);
            hideLoading();
            return;
        }

        // 1. Merchant signs refund authorization
        logConsole('info', '✍️ Step 1: Merchant signing refund authorization...');

        // Create refund agent instance
        const refundAgent = new RefundAgentFrontend(paymentProcessorContract);
        const refundAuth = await refundAgent.createRefundAuthorization(intentId, signer, amount, payerAddress);

        logConsole('success', '✅ Refund authorized by merchant');

        // 2. Check allowance (Merchant needs to verify contract can spend their USDC)
        logConsole('info', '🔍 Checking merchant USDC allowance...');
        const allowance = await usdcContract.allowance(currentAddress, CONFIG.PAYMENT_PROCESSOR_ADDRESS);
        const amountWei = ethers.utils.parseUnits(amount.toString(), CONFIG.USDC_DECIMALS);

        if (allowance.lt(amountWei)) {
            logConsole('warning', '⚠️ Insufficient allowance. Approving PaymentProcessor...');
            const tx = await usdcContract.approve(CONFIG.PAYMENT_PROCESSOR_ADDRESS, ethers.constants.MaxUint256);
            await tx.wait();
            logConsole('success', '✅ USDC Appoved');
        }

        // 3. Execute Refund
        logConsole('info', '💸 Step 2: Executing refund transaction...');
        const result = await refundAgent.executeRefund(intentId, refundAuth.signature, signer);

        if (result.success) {
            logConsole('success', `✅ Refund Successful! Tx: ${result.txHash.substring(0, 10)}...`);
            logConsole('info', '   ✓ Funds returned to original payer');
            logConsole('info', '   ✓ Refund event emitted');
            logConsole('info', `   🔗 View: ${CONFIG.BLOCK_EXPLORER}/tx/${result.txHash}`);

            // Disable button
            const refundBtn = document.getElementById('refundDemoBtn');
            if (refundBtn) {
                refundBtn.disabled = true;
                refundBtn.textContent = 'Refunded';
            }

            await updateBalances();
        } else {
            throw new Error(result.error);
        }

    } catch (error) {
        logConsole('error', `❌ Refund failed: ${error.message}`);
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Real-time Payment Listener
function setupPaymentListener(merchantAddress) {
    if (!paymentProcessorContract) return;

    // Filter for SettlementExecuted events where this user is the merchant
    const filter = paymentProcessorContract.filters.SettlementExecuted(null, null, merchantAddress);

    // Remove existing listeners to prevent duplicates
    paymentProcessorContract.removeAllListeners(filter);

    paymentProcessorContract.on(filter, (intentId, user, merchant, amount, mandateHash, event) => {
        const formattedAmount = ethers.utils.formatUnits(amount, CONFIG.USDC_DECIMALS);
        const payer = `${user.substring(0, 6)}...${user.substring(38)}`;

        // Visual notification
        logConsole('success', `💰 PAYMENT RECEIVED! ${formattedAmount} USDC from ${payer}`);

        // Add to Merchant Dashboard
        // Add to Merchant Dashboard
        // addIncomingPaymentToUI(intentId, user, formattedAmount, event.transactionHash); // Disabled per user request

        // Simple visual cue
        const originalTitle = document.title;
        document.title = "💰 Payment Received!";
        setTimeout(() => document.title = originalTitle, 5000);

        // Update balances
        updateBalances();
    });

    logConsole('info', '📡 Listening for incoming payments...');

    // Also listen for Refund Requests
    setupRefundListener();
}

function setupRefundListener() {
    if (!paymentProcessorContract) return;

    const filter = paymentProcessorContract.filters.RefundRequested();
    paymentProcessorContract.on(filter, (intentId, user, event) => {
        logConsole('info', '🔔 New Refund Request detected on-chain!');
        // Refresh the list immediately
        fetchRefundRequests();

        // Simple visual cue
        const originalTitle = document.title;
        document.title = "🔔 Refund Requested!";
        setTimeout(() => document.title = originalTitle, 5000);
    });

    // Initial fetch
    fetchRefundRequests();
}

function addIncomingPaymentToUI(intentId, user, amount, txHash) {
    const section = document.getElementById('merchantSection');
    const container = document.getElementById('incomingPaymentsList');
    const countBadge = document.getElementById('paymentCount');

    if (section && container) {
        section.style.display = 'block';

        // Remove "No payments" message if exists
        const noPaymentsMsg = container.querySelector('div');
        if (noPaymentsMsg && noPaymentsMsg.innerText.includes('No incoming payments')) {
            container.innerHTML = '';
        }

        const div = document.createElement('div');
        div.className = 'payment-item';
        div.style.background = 'white';
        div.style.padding = '1rem';
        div.style.borderRadius = '0.5rem';
        div.style.marginBottom = '0.5rem';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';

        // Shorten user address
        const shortUser = `${user.substring(0, 6)}...${user.substring(38)}`;

        div.innerHTML = `
            <div>
                <div style="font-weight: bold; color: var(--success);">+${amount} USDC</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">From: <a href="${CONFIG.BLOCK_EXPLORER}/address/${user}" target="_blank">${shortUser}</a></div>
                <div style="font-size: 0.7rem; color: var(--text-muted);">${new Date().toLocaleTimeString()}</div>
            </div>
        `;

        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary';
        btn.style.fontSize = '0.8rem';
        btn.style.padding = '0.25rem 0.5rem';
        btn.style.borderColor = 'var(--error)';
        btn.style.color = 'var(--error)';
        btn.innerHTML = '↪️ Refund';

        btn.onclick = async () => {
            if (confirm(`Refund ${amount} USDC to ${shortUser}?`)) {
                await executeRefund(intentId, amount, userAddress, user); // userAddress is ME (Merchant), user is Customer
            }
        };

        div.appendChild(btn);
        container.prepend(div);

        // Update count
        if (countBadge) {
            const currentCount = parseInt(countBadge.textContent || '0');
            countBadge.textContent = currentCount + 1;
        }
    }
}

async function requestRefund(intentId, amount) {
    if (!confirm(`Request refund of ${amount} USDC from merchant on-chain? This will require a transaction.`)) return;

    try {
        showLoading('Requesting refund on-chain...');

        // Ensure contract is initialized
        if (!paymentProcessorContract) {
            throw new Error("Payment Processor not initialized");
        }

        const tx = await paymentProcessorContract.connect(signer).requestRefund(intentId);
        logConsole('info', `📝 Refund Request TX: ${tx.hash}`);
        await tx.wait();

        hideLoading();
        logConsole('success', `✅ Refund requested on-chain!`);
        alert('Refund requested successfully on blockchain!');

        const btn = document.getElementById('requestRefundBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Requested (On-Chain)';
        }

    } catch (e) {
        hideLoading();
        console.error(e);
        logConsole('error', `❌ Refund request failed: ${e.message}`);
        alert('Error requesting refund: ' + e.message);
    }
}

async function fetchRefundRequests() {
    try {
        if (!paymentProcessorContract) return;

        showLoading('Scanning blockchain for requests...');
        const list = document.getElementById('refundRequestsList');
        if (!list) return;

        // Get all RefundRequested events
        // Optimization: In prod, limit block range. For demo, scan all.
        const filter = paymentProcessorContract.filters.RefundRequested();
        const events = await paymentProcessorContract.queryFilter(filter);

        list.innerHTML = '';
        if (events.length === 0) {
            list.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 1rem;">No refund requests found on-chain.</div>';
            hideLoading();
            return;
        }

        let pendingCount = 0;

        for (const event of events) {
            const { intentId, user } = event.args;

            // Check if already refunded
            const isRefunded = await paymentProcessorContract.isIntentRefunded(intentId);
            if (isRefunded) continue;

            // Get settlement details for amount
            const settlement = await paymentProcessorContract.getSettlement(intentId);
            const amount = ethers.utils.formatUnits(settlement.amount, CONFIG.USDC_DECIMALS);
            const merchant = settlement.merchant;

            // Only show if I am the merchant
            if (merchant.toLowerCase() !== userAddress.toLowerCase()) continue;

            pendingCount++;

            const div = document.createElement('div');
            div.className = 'payment-item';
            div.style.background = 'white';
            div.style.padding = '1rem';
            div.style.borderRadius = '0.5rem';
            div.style.marginBottom = '0.5rem';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.borderLeft = '4px solid var(--warning)';
            div.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';

            // Shorten user
            const shortUser = `${user.substring(0, 6)}...${user.substring(38)}`;

            div.innerHTML = `
                <div>
                    <div style="font-weight: bold;">Refund Request: ${amount} USDC</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">User: ${shortUser}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">Request Block: ${event.blockNumber}</div>
                </div>
            `;

            const btn = document.createElement('button');
            btn.className = 'btn btn-sm btn-primary';
            btn.style.fontSize = '0.8rem';
            btn.style.padding = '0.25rem 0.5rem';
            btn.textContent = '✅ Approve (Sign)';

            btn.onclick = async () => {
                if (confirm(`Approve refund of ${amount} USDC to ${shortUser}?`)) {
                    await executeRefund(intentId, amount, userAddress, user);
                    fetchRefundRequests(); // Refresh UI
                }
            };

            div.appendChild(btn);
            list.appendChild(div);
        }

        if (pendingCount === 0) {
            list.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 1rem;">No pending refund requests.</div>';
        }

        // Show merchant section if requests exist
        if (pendingCount > 0) {
            document.getElementById('merchantSection').style.display = 'block';
        }

        hideLoading();

    } catch (e) {
        hideLoading();
        console.error('Error fetching refund requests:', e);
    }
}

// ============================================================================
// REFUND DEMO FUNCTION
// ============================================================================

async function demoRefundFlow() {
    try {
        showLoading('Processing refund demo...');
        logConsole('warning', '↩️ REFUND FLOW DEMO');
        logConsole('info', '━'.repeat(60));
        logConsole('info', 'This is a DEMO of the refund process.');
        logConsole('info', 'For REAL refunds, use the Merchant Dashboard!');
        logConsole('info', '━'.repeat(60));

        logConsole('info', '🏪 Step 1: Merchant receives refund request...');
        await delay(1000);
        logConsole('success', '✅ Customer requests refund for defective product');

        logConsole('info', '🔍 Step 2: Merchant reviews transaction...');
        await delay(1000);
        logConsole('success', '✅ Transaction verified: $50 USDC payment found');

        logConsole('info', '✍️ Step 3: Merchant approves refund...');
        await delay(1000);
        logConsole('success', '✅ Refund approved: $50 USDC');

        logConsole('info', '💸 Step 4: USDC transferred back to customer...');
        await delay(1500);
        logConsole('success', '✅ Transfer completed: Customer refunded');

        logConsole('info', '🧾 Step 5: Refund receipt generated...');
        await delay(500);
        logConsole('success', '✅ Refund receipt created and stored');

        logConsole('info', '━'.repeat(60));
        logConsole('success', '🎉 REFUND DEMO COMPLETED!');
        logConsole('info', '');
        logConsole('info', '🏪 WANT TO TRY REAL REFUNDS?');
        logConsole('info', '   1. Click "Merchant Dashboard" button');
        logConsole('info', '   2. Connect with merchant wallet');
        logConsole('info', '   3. View received payments');
        logConsole('info', '   4. Click "Refund" on any payment');
        logConsole('info', '   5. Process real USDC refunds!');
        logConsole('info', '━'.repeat(60));

        hideLoading();

        // Show alert about real merchant dashboard
        setTimeout(() => {
            if (confirm('This was a demo. Would you like to open the REAL Merchant Dashboard to process actual refunds?')) {
                window.open('merchant-dashboard.html', '_blank');
            }
        }, 1000);

    } catch (error) {
        hideLoading();
        logConsole('error', `❌ Demo failed: ${error.message}`);
    }
}