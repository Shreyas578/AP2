// Agent Services - Frontend Implementation

class ShoppingAgentFrontend {
    constructor() {
        this.intentCounter = 0;
    }

    createIntent(productId, amount, merchant) {
        const product = CONFIG.PRODUCTS[productId];

        if (!product) {
            console.error('Product not found:', productId);
            console.log('Available products:', Object.keys(CONFIG.PRODUCTS));
            throw new Error(`Product "${productId}" not found in catalog`);
        }

        this.intentCounter++;

        // Generate unique intent ID
        const timestamp = Date.now();
        const data = `INT-${timestamp}-${product.sku}-${this.intentCounter}`;
        const intentId = ethers.utils.id(data);

        // Set expiry (1 hour from now)
        const expiry = Math.floor(Date.now() / 1000) + 3600;

        const intent = {
            intent_id: intentId,
            product_id: product.sku,
            product_name: product.name,
            amount: amount.toString(),
            currency: "USDC",
            merchant: merchant,
            expiry: expiry,
            created_at: new Date().toISOString()
        };

        return intent;
    }
}

class MerchantAgentFrontend {
    async createMandate(intent, merchantSigner, merchantAddress) {
        const mandateData = {
            intent_id: intent.intent_id,
            merchant: merchantAddress, // Use the provided merchant address, not signer address
            amount: intent.amount,
            currency: intent.currency,
            expiry: intent.expiry
        };

        // Generate mandate hash
        const encoded = ethers.utils.defaultAbiCoder.encode(
            ["bytes32", "address", "string", "string", "uint256"],
            [
                mandateData.intent_id,
                mandateData.merchant,
                mandateData.amount,
                mandateData.currency,
                mandateData.expiry
            ]
        );
        const mandateHash = ethers.utils.keccak256(encoded);

        // Sign the mandate (signer can be different from merchant address)
        const signature = await merchantSigner.signMessage(ethers.utils.arrayify(mandateHash));

        return {
            ...mandateData,
            mandate_hash: mandateHash,
            merchant_signature: signature,
            signed_at: new Date().toISOString()
        };
    }
}

class CredentialsProviderFrontend {
    async authorizePayment(intent, mandate, paymentProcessor, userSigner) {
        const userAddress = await userSigner.getAddress();

        // Get current nonce
        const nonce = await paymentProcessor.getNonce(userAddress);

        // Convert amount to smallest unit (6 decimals for USDC)
        const amountRaw = ethers.utils.parseUnits(intent.amount, CONFIG.USDC_DECIMALS);

        // Prepare message to sign - using solidityKeccak256 to match contract's abi.encodePacked
        const messageHash = ethers.utils.solidityKeccak256(
            ["bytes32", "address", "address", "uint256", "bytes32", "uint256", "uint256"],
            [
                intent.intent_id,
                userAddress,
                mandate.merchant,
                amountRaw,
                mandate.mandate_hash,
                intent.expiry,
                nonce
            ]
        );

        // User signs the authorization (AP2 signature)
        // signMessage automatically adds the Ethereum signed message prefix
        // which matches the contract's toEthSignedMessageHash()
        const signature = await userSigner.signMessage(ethers.utils.arrayify(messageHash));

        return {
            intent_id: intent.intent_id,
            user: userAddress,
            merchant: mandate.merchant,
            amount: intent.amount,
            amount_raw: amountRaw.toString(),
            mandate_hash: mandate.mandate_hash,
            expiry: intent.expiry,
            nonce: nonce.toString(),
            user_signature: signature,
            message_hash: messageHash,
            authorized_at: new Date().toISOString()
        };
    }
}

class SettlementAgentFrontend {
    constructor(paymentProcessor) {
        this.paymentProcessor = paymentProcessor;
    }

    async executeSettlement(authorization, userSigner) {
        try {
            const processorWithSigner = this.paymentProcessor.connect(userSigner);

            console.log('🔍 Settlement Debug Info:');
            console.log('  Intent ID:', authorization.intent_id);
            console.log('  User:', authorization.user);
            console.log('  Merchant:', authorization.merchant);
            console.log('  Amount (raw):', authorization.amount_raw);
            console.log('  Mandate Hash:', authorization.mandate_hash);
            console.log('  Expiry:', authorization.expiry);
            console.log('  Signature:', authorization.user_signature);

            const tx = await processorWithSigner.executeSettlement(
                authorization.intent_id,
                authorization.user,
                authorization.merchant,
                authorization.amount_raw,
                authorization.mandate_hash,
                authorization.expiry,
                authorization.user_signature
            );

            console.log('✅ Transaction sent:', tx.hash);
            console.log('⏳ Waiting for confirmation...');

            const receipt = await tx.wait();

            console.log('📋 Transaction Receipt:');
            console.log('  Status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');
            console.log('  Block:', receipt.blockNumber);
            console.log('  Gas Used:', receipt.gasUsed.toString());
            console.log('  Logs:', receipt.logs.length);

            // Check if transaction actually succeeded
            if (receipt.status !== 1) {
                throw new Error('Transaction failed on-chain');
            }

            // Parse settlement event
            const event = receipt.logs.find(log => {
                try {
                    const parsed = this.paymentProcessor.interface.parseLog(log);
                    return parsed.name === "SettlementExecuted";
                } catch {
                    return false;
                }
            });

            let eventData = null;
            if (event) {
                const parsed = this.paymentProcessor.interface.parseLog(event);
                console.log('🎉 SettlementExecuted Event Found:', parsed.args);
                eventData = {
                    intentId: parsed.args.intentId,
                    user: parsed.args.user,
                    merchant: parsed.args.merchant,
                    amount: parsed.args.amount.toString(),
                    mandateHash: parsed.args.mandateHash
                };
            } else {
                console.warn('⚠️ No SettlementExecuted event found in logs');
            }

            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                event: eventData,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Settlement Error:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                data: error.data,
                transaction: error.transaction
            });

            return {
                success: false,
                error: error.message,
                reason: this.parseErrorReason(error),
                timestamp: new Date().toISOString()
            };
        }
    }

    parseErrorReason(error) {
        const message = error.message.toLowerCase();

        if (message.includes("expired")) return "AUTHORIZATION_EXPIRED";
        if (message.includes("signature")) return "INVALID_SIGNATURE";
        if (message.includes("already executed")) return "REPLAY_ATTACK_PREVENTED";
        if (message.includes("transfer failed") || message.includes("insufficient")) return "INSUFFICIENT_ALLOWANCE_OR_BALANCE";
        if (message.includes("reverted")) return "TRANSACTION_REVERTED";
        return "SETTLEMENT_FAILED";
    }
}

class ReceiptGeneratorFrontend {
    generateSuccessReceipt(authorization, settlementResult) {
        return {
            intent_id: authorization.intent_id,
            chain: CONFIG.CHAIN_NAME,
            chain_id: CONFIG.CHAIN_ID,
            usdc_contract: CONFIG.USDC_ADDRESS,
            user: authorization.user,
            merchant: authorization.merchant,
            authorized_amount: `${ethers.utils.formatUnits(authorization.amount_raw, CONFIG.USDC_DECIMALS)} USDC`,
            amount_raw: authorization.amount_raw,
            settlement_tx: settlementResult.txHash,
            block_number: settlementResult.blockNumber,
            processor_contract: CONFIG.PAYMENT_PROCESSOR_ADDRESS,
            receipt_contract: CONFIG.RECEIPT_REGISTRY_ADDRESS,
            mandate_hash: authorization.mandate_hash,
            authorized_signature: authorization.user_signature,
            status: "SUCCESS",
            timestamp: new Date().toISOString()
        };
    }

    generateFailureReceipt(authorization, failureReason, error = null) {
        return {
            intent_id: authorization.intent_id || "UNKNOWN",
            chain: CONFIG.CHAIN_NAME,
            chain_id: CONFIG.CHAIN_ID,
            status: "FAILED",
            failure_reason: failureReason,
            user: authorization.user || null,
            merchant: authorization.merchant || null,
            attempted_amount: authorization.amount || null,
            error_message: error ? error.message : null,
            timestamp: new Date().toISOString()
        };
    }

    async storeOnChain(receipt, receiptRegistry, signer) {
        if (receipt.status !== "SUCCESS") {
            console.log("Failure receipts not stored on-chain");
            return null;
        }

        try {
            const registryWithSigner = receiptRegistry.connect(signer);
            const tx = await registryWithSigner.createReceipt(
                receipt.intent_id,
                receipt.user,
                receipt.merchant,
                receipt.amount_raw,
                receipt.settlement_tx,
                receipt.status
            );
            const txReceipt = await tx.wait();
            return txReceipt;
        } catch (error) {
            console.error("Failed to store receipt on-chain:", error);
            return null;
        }
    }
}

class RefundAgentFrontend {
    constructor(paymentProcessor) {
        this.paymentProcessor = paymentProcessor;
    }

    async createRefundAuthorization(intentId, merchantSigner, amount, userAddress) {
        // Merchant authorizing refund
        const merchantAddress = await merchantSigner.getAddress();
        const amountRaw = ethers.utils.parseUnits(amount.toString(), CONFIG.USDC_DECIMALS);

        // Generate refund message hash matching contract
        // keccak256(abi.encodePacked(intentId, merchant, user, amount))
        const messageHash = ethers.utils.solidityKeccak256(
            ["bytes32", "address", "address", "uint256"],
            [
                intentId,
                merchantAddress,
                userAddress,
                amountRaw
            ]
        );

        // Sign the authorization
        const signature = await merchantSigner.signMessage(ethers.utils.arrayify(messageHash));

        return {
            intentId: intentId,
            merchant: merchantAddress,
            user: userAddress,
            amount: amount,
            amountRaw: amountRaw,
            signature: signature,
            messageHash: messageHash,
            timestamp: new Date().toISOString()
        };
    }

    async executeRefund(intentId, merchantSignature, signer) {
        try {
            const processorWithSigner = this.paymentProcessor.connect(signer);

            console.log('↩️ Executing Refund...');
            console.log('  Intent ID:', intentId);

            const tx = await processorWithSigner.refundSettlement(
                intentId,
                merchantSignature
            );

            console.log('✅ Refund transaction sent:', tx.hash);
            const receipt = await tx.wait();

            if (receipt.status !== 1) {
                throw new Error('Refund transaction failed on-chain');
            }

            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };

        } catch (error) {
            console.error('❌ Refund Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export agents
if (typeof window !== 'undefined') {
    window.ShoppingAgent = ShoppingAgentFrontend;
    window.MerchantAgent = MerchantAgentFrontend;
    window.CredentialsProvider = CredentialsProviderFrontend;
    window.SettlementAgent = SettlementAgentFrontend;
    window.ReceiptGenerator = ReceiptGeneratorFrontend;
    window.RefundAgentFrontend = RefundAgentFrontend;
}
