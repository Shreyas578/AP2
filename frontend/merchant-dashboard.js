// Merchant Dashboard - AP2 Payment System

let provider;
let signer;
let merchantAddress;
let usdcContract;
let receiptRegistryContract;

// State
let selectedTransaction = null;
let merchantPayments = [];

// DOM Elements
const connectWalletBtn = document.getElementById('connectWalletBtn');
const networkIndicator = document.getElementById('networkIndicator');
const walletPanel = document.getElementById('walletPanel');
const walletAddress = document.getElementById('walletAddress');
const ethBalance = document.getElementById('ethBalance');
const usdcBalance = document.getElementById('usdcBalance');
const totalReceived = document.getElementById('totalReceived');

const loadPaymentsBtn = document.getElementById('loadPaymentsBtn');
const refreshBalanceBtn = document.getElementById('refreshBalanceBtn');
const paymentsSection = document.getElementById('paymentsSection');
const paymentsTableBody = document.getElementById('paymentsTableBody');

const refundSection = document.getElementById('refundSection');
const refundTransactionInfo = document.getElementById('refundTransactionInfo');
const refundAmount = document.getElementById('refundAmount');
const refundReason = document.getElementById('refundReason');
const processRefundBtn = document.getElementById('processRefundBtn');
const cancelRefundBtn = document.getElementById('cancelRefundBtn');

const consoleOutput = document.getElementById('consoleOutput');
const clearConsoleBtn = document.getElementById('clearConsoleBtn');
const loadingModal = document.getElementById('loadingModal');
const loadingText = document.getElementById('loadingText');

// Initialize on page load
window.addEventListener('load', async () => {
    logConsole('info', 'Merchant Dashboard loaded. Connect your wallet to begin...');
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    connectWalletBtn.addEventListener('click', connectWallet);
    loadPaymentsBtn.addEventListener('click', loadMerchantPayments);
    refreshBalanceBtn.addEventListener('click', updateBalances);
    processRefundBtn.addEventListener('click', processRefund);
    cancelRefundBtn.addEventListener('click', cancelRefund);
    clearConsoleBtn.addEventListener('click', clearConsole);
}

// Connect Wallet
async function connectWallet() {
    try {
        if (!window.ethereum) {
            alert('MetaMask is not installed! Please install MetaMask to use this dashboard.');
            return;
        }

        showLoading('Connecting to MetaMask...');

        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        merchantAddress = await signer.getAddress();

        // Check network
        const network = await provider.getNetwork();
        if (network.chainId !== CONFIG.CHAIN_ID) {
            await switchNetwork();
        }

        // Initialize contracts
        await initializeContracts();

        // Update UI
        walletAddress.textContent = `${merchantAddress.substring(0, 6)}...${merchantAddress.substring(38)}`;
        networkIndicator.classList.add('connected');
        networkIndicator.querySelector('.network-text').textContent = CONFIG.CHAIN_NAME;
        connectWalletBtn.textContent = 'Connected';
        connectWalletBtn.disabled = true;
        walletPanel.style.display = 'block';

        // Enable buttons
        loadPaymentsBtn.disabled = false;
        refreshBalanceBtn.disabled = false;

        // Update balances
        await updateBalances();

        logConsole('success', `✅ Connected as merchant: ${merchantAddress}`);
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
        window.paymentProcessorContract = new ethers.Contract(
            CONFIG.PAYMENT_PROCESSOR_ADDRESS,
            CONFIG.PAYMENT_PROCESSOR_ABI,
            provider
        );
    }

    // ReceiptRegistry Contract (if needed)
    if (CONFIG.RECEIPT_REGISTRY_ADDRESS) {
        receiptRegistryContract = new ethers.Contract(
            CONFIG.RECEIPT_REGISTRY_ADDRESS,
            CONFIG.RECEIPT_REGISTRY_ABI,
            provider
        );
    }
}

// Update Balances
async function updateBalances() {
    try {
        const eth = await provider.getBalance(merchantAddress);
        ethBalance.textContent = `${parseFloat(ethers.utils.formatEther(eth)).toFixed(4)} ETH`;

        const usdc = await usdcContract.balanceOf(merchantAddress);
        usdcBalance.textContent = `${parseFloat(ethers.utils.formatUnits(usdc, CONFIG.USDC_DECIMALS)).toFixed(2)} USDC`;

        logConsole('info', '🔄 Balances updated');
    } catch (error) {
        logConsole('error', `Failed to update balances: ${error.message}`);
    }
}

// Load Merchant Payments
async function loadMerchantPayments() {
    if (!provider || !merchantAddress) {
        logConsole('error', '❌ Please connect wallet first');
        return;
    }
    
    try {
        showLoading('Loading your payments...');
        logConsole('info', '💰 Loading payments received by this merchant...');
        
        // Initialize PaymentProcessor contract if not already done
        if (!window.paymentProcessorContract) {
            window.paymentProcessorContract = new ethers.Contract(
                CONFIG.PAYMENT_PROCESSOR_ADDRESS,
                CONFIG.PAYMENT_PROCESSOR_ABI,
                provider
            );
        }
        
        // Get SettlementExecuted events where this address is the merchant
        const filter = window.paymentProcessorContract.filters.SettlementExecuted(null, null, merchantAddress);
        logConsole('info', 'Scanning blockchain for payments to this merchant...');
        
        const events = await window.paymentProcessorContract.queryFilter(filter);
        logConsole('info', `Found ${events.length} settlement events`);
        
        merchantPayments = [];
        let totalAmount = 0;
        
        for (const event of events) {
            const { intentId, user, merchant, amount, mandateHash } = event.args;
            const block = await provider.getBlock(event.blockNumber);
            
            // Check if this payment was refunded
            const isRefunded = await window.paymentProcessorContract.isIntentRefunded(intentId);
            
            const amountFormatted = parseFloat(ethers.utils.formatUnits(amount, 6));
            totalAmount += amountFormatted;
            
            merchantPayments.push({
                intentId: intentId,
                user: user,
                merchant: merchant,
                amount: amountFormatted,
                amountRaw: amount,
                txHash: event.transactionHash,
                timestamp: block.timestamp,
                status: isRefunded ? 'REFUNDED' : 'SUCCESS',
                blockNumber: event.blockNumber,
                isRefunded: isRefunded
            });
        }
        
        // Sort by timestamp (newest first)
        merchantPayments.sort((a, b) => b.timestamp - a.timestamp);
        
        // Update total received
        totalReceived.textContent = `${totalAmount.toFixed(2)} USDC`;
        
        // Display payments
        displayMerchantPayments();
        
        logConsole('success', `✅ Found ${merchantPayments.length} payments totaling ${totalAmount.toFixed(2)} USDC`);
        hideLoading();
        
    } catch (error) {
        hideLoading();
        logConsole('error', `❌ Failed to load payments: ${error.message}`);
        console.error(error);
    }
}

// Display Merchant Payments
function displayMerchantPayments() {
    const paymentsSection = document.getElementById('paymentsSection');
    const paymentsTableBody = document.getElementById('paymentsTableBody');
    
    if (merchantPayments.length === 0) {
        paymentsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">No payments received yet</td></tr>';
        paymentsSection.style.display = 'block';
        return;
    }
    
    const rows = merchantPayments.map((payment, index) => {
        const date = new Date(payment.timestamp * 1000).toLocaleString();
        const customerShort = `${payment.user.substring(0, 6)}...${payment.user.substring(38)}`;
        const txLink = `${CONFIG.BLOCK_EXPLORER}/tx/${payment.txHash}`;
        
        return `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 0.75rem;">${date}</td>
                <td style="padding: 0.75rem; font-family: monospace;">${customerShort}</td>
                <td style="padding: 0.75rem; font-weight: 600;">$${payment.amount.toFixed(2)} USDC</td>
                <td style="padding: 0.75rem;">
                    <span style="color: var(--success);">✅ ${payment.isRefunded ? 'REFUNDED' : 'SUCCESS'}</span>
                </td>
                <td style="padding: 0.75rem;">
                    ${payment.isRefunded ? 
                        '<button class="btn btn-sm btn-secondary" disabled style="opacity: 0.5;">Already Refunded</button>' :
                        `<button class="btn btn-sm btn-warning" onclick="window.initiateRefund(${index})" style="margin-right: 0.5rem;">↩️ Refund</button>`
                    }
                    <a href="${txLink}" target="_blank" class="btn btn-sm btn-secondary">
                        🔍 View TX
                    </a>
                </td>
            </tr>
        `;
    }).join('');
    
    paymentsTableBody.innerHTML = rows;
    paymentsSection.style.display = 'block';
    paymentsSection.scrollIntoView({ behavior: 'smooth' });
}

// Initiate Refund
window.initiateRefund = function(paymentIndex) {
    const payment = merchantPayments[paymentIndex];
    selectedTransaction = payment;
    
    // Show refund form
    refundTransactionInfo.innerHTML = `
        <div><strong>Transaction:</strong> ${payment.txHash.substring(0, 20)}...</div>
        <div><strong>Customer:</strong> ${payment.user}</div>
        <div><strong>Original Amount:</strong> $${payment.amount.toFixed(2)} USDC</div>
        <div><strong>Date:</strong> ${new Date(payment.timestamp * 1000).toLocaleString()}</div>
    `;
    
    refundAmount.value = payment.amount.toFixed(2);
    refundAmount.max = payment.amount.toFixed(2);
    processRefundBtn.disabled = false;
    
    refundSection.style.display = 'block';
    refundSection.scrollIntoView({ behavior: 'smooth' });
    
    logConsole('info', `💰 Refund initiated for $${payment.amount.toFixed(2)} USDC`);
};

// Process Refund
async function processRefund() {
    if (!selectedTransaction) {
        logConsole('error', '❌ No transaction selected');
        return;
    }
    
    const amount = parseFloat(refundAmount.value);
    const reason = refundReason.value;
    
    if (amount <= 0 || amount > selectedTransaction.amount) {
        logConsole('error', '❌ Invalid refund amount');
        return;
    }
    
    try {
        showLoading('Processing refund...');
        logConsole('warning', '↩️ PROCESSING REFUND');
        logConsole('info', '━'.repeat(60));
        logConsole('info', `Customer: ${selectedTransaction.user.substring(0, 10)}...`);
        logConsole('info', `Amount: $${amount.toFixed(2)} USDC`);
        logConsole('info', `Reason: ${reason}`);
        
        // Step 1: Check merchant has sufficient USDC
        const merchantBalance = await usdcContract.balanceOf(merchantAddress);
        const merchantBalanceFormatted = parseFloat(ethers.utils.formatUnits(merchantBalance, 6));
        
        if (merchantBalanceFormatted < amount) {
            throw new Error(`Insufficient USDC balance. Need ${amount}, have ${merchantBalanceFormatted.toFixed(2)}`);
        }
        
        logConsole('info', '✅ Merchant has sufficient balance');
        
        // Step 2: Check/Approve USDC allowance for PaymentProcessor
        logConsole('info', '🔍 Checking USDC allowance...');
        const allowance = await usdcContract.allowance(merchantAddress, CONFIG.PAYMENT_PROCESSOR_ADDRESS);
        const refundAmountRaw = ethers.utils.parseUnits(amount.toString(), 6);
        
        if (allowance.lt(refundAmountRaw)) {
            logConsole('info', '🔓 Approving USDC for refund...');
            const usdcWithSigner = usdcContract.connect(signer);
            const approveTx = await usdcWithSigner.approve(CONFIG.PAYMENT_PROCESSOR_ADDRESS, ethers.constants.MaxUint256);
            await approveTx.wait();
            logConsole('success', '✅ USDC approved for refund');
        }
        
        // Step 3: Create merchant signature for refund authorization
        logConsole('info', '✍️ Creating refund authorization...');
        
        // Get the refund message hash from contract
        const refundMessageHash = await window.paymentProcessorContract.getRefundMessageHash(
            selectedTransaction.intentId,
            merchantAddress,
            selectedTransaction.user,
            refundAmountRaw
        );
        
        // Sign the refund authorization
        const merchantSignature = await signer.signMessage(ethers.utils.arrayify(refundMessageHash));
        logConsole('success', '✅ Refund authorized by merchant');
        
        // Step 4: Execute refund through PaymentProcessor contract
        logConsole('info', '💸 Executing refund through smart contract...');
        
        const paymentProcessorWithSigner = window.paymentProcessorContract.connect(signer);
        const refundTx = await paymentProcessorWithSigner.refundSettlement(
            selectedTransaction.intentId,
            merchantSignature
        );
        
        logConsole('info', `📝 Refund TX: ${refundTx.hash}`);
        
        const receipt = await refundTx.wait();
        logConsole('success', `✅ Refund completed! (Block: ${receipt.blockNumber})`);
        
        // Step 3: Create refund receipt (simulate - in real app would call contract)
        logConsole('info', '🧾 Creating refund receipt...');
        
        const refundReceipt = {
            type: 'REFUND',
            original_tx: selectedTransaction.txHash,
            refund_tx: refundTx.hash,
            customer: selectedTransaction.user,
            merchant: merchantAddress,
            amount: amount,
            reason: reason,
            timestamp: new Date().toISOString(),
            status: 'COMPLETED'
        };
        
        logConsole('success', '✅ Refund receipt created');
        
        // Step 4: Update UI
        await updateBalances();
        await loadMerchantPayments(); // Refresh payments list
        
        logConsole('info', '━'.repeat(60));
        logConsole('success', '🎉 REFUND COMPLETED SUCCESSFULLY!');
        logConsole('info', `   ✓ ${amount.toFixed(2)} USDC returned to customer`);
        logConsole('info', `   ✓ Transaction: ${refundTx.hash}`);
        logConsole('info', `   ✓ Refund processed through smart contract`);
        logConsole('info', `   ✓ RefundExecuted event emitted`);
        
        // Hide refund form
        cancelRefund();
        
        hideLoading();
        
        alert(`Refund completed successfully!\n\nAmount: ${amount.toFixed(2)} USDC\nTransaction: ${refundTx.hash}\n\nThe customer has been refunded through the smart contract.`);
        
    } catch (error) {
        hideLoading();
        logConsole('error', `❌ Refund failed: ${error.message}`);
        alert(`Refund failed: ${error.message}`);
    }
}

// Cancel Refund
function cancelRefund() {
    selectedTransaction = null;
    refundSection.style.display = 'none';
    processRefundBtn.disabled = true;
    refundAmount.value = '';
    refundTransactionInfo.innerHTML = 'Select a transaction to refund';
    logConsole('info', '❌ Refund cancelled');
}

// Utility Functions
function showLoading(text) {
    loadingText.textContent = text;
    loadingModal.style.display = 'flex';
}

function hideLoading() {
    loadingModal.style.display = 'none';
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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}