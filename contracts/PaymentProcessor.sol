// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title PaymentProcessor
 * @notice AP2 + x402 Settlement Processor for authorized USDC payments
 * @dev Implements signature-based authorization with mandate verification
 */
contract PaymentProcessor {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Base Sepolia USDC - Hardcoded for security
    IERC20 public constant USDC = IERC20(0x036CbD53842c5426634e7929541eC2318f3dCF7e);
    
    // Settlement data structure
    struct Settlement {
        bytes32 intentId;
        address user;
        address merchant;
        uint256 amount;
        uint256 timestamp;
        bool exists;
    }
    
    // Nonce tracking for replay protection
    mapping(address => uint256) public nonces;
    
    // Executed intent tracking
    mapping(bytes32 => bool) public executedIntents;
    
    // Refunded intent tracking
    mapping(bytes32 => bool) public refundedIntents;
    
    // Settlement storage for refund lookups
    mapping(bytes32 => Settlement) public settlements;

    /**
     * @notice Emitted when a settlement is successfully executed
     * @param intentId Unique identifier for the payment intent
     * @param user Address of the user making the payment
     * @param merchant Address receiving the payment
     * @param amount Amount of USDC transferred (6 decimals)
     * @param mandateHash Hash of the merchant's mandate
     */
    event SettlementExecuted(
        bytes32 indexed intentId,
        address indexed user,
        address indexed merchant,
        uint256 amount,
        bytes32 mandateHash
    );

    /**
     * @notice Emitted when a settlement fails
     * @param intentId Intent that failed
     * @param reason Failure reason
     */
    event SettlementFailed(
        bytes32 indexed intentId,
        string reason
    );

    /**
     * @notice Emitted when a refund is successfully executed
     * @param intentId Original payment intent identifier
     * @param merchant Merchant initiating the refund
     * @param user User receiving the refund
     * @param amount Amount of USDC refunded (6 decimals)
     */
    event RefundExecuted(
        bytes32 indexed intentId,
        address indexed merchant,
        address indexed user,
        uint256 amount
    );

    /**
     * @notice Emitted when a user requests a refund
     * @param intentId Unique identifier for the payment intent
     * @param user Address of the user requesting the refund
     */
    event RefundRequested(
        bytes32 indexed intentId,
        address indexed user
    );

    /**
     * @notice Execute an authorized settlement
     * @param intentId Unique payment intent identifier
     * @param user User wallet address (payer)
     * @param merchant Merchant wallet address (payee)
     * @param amount Payment amount in USDC (6 decimals)
     * @param mandateHash Hash of the merchant's signed mandate
     * @param expiry Timestamp when authorization expires
     * @param userSignature User's AP2 authorization signature
     */
    function executeSettlement(
        bytes32 intentId,
        address user,
        address merchant,
        uint256 amount,
        bytes32 mandateHash,
        uint256 expiry,
        bytes memory userSignature
    ) external {
        // 1. Verify intent not already executed (replay protection)
        require(!executedIntents[intentId], "Intent already executed");
        
        // 2. Verify not expired
        require(block.timestamp <= expiry, "Authorization expired");
        
        // 3. Verify merchant address is not zero
        require(merchant != address(0), "Invalid merchant address");
        
        // 4. Verify amount is not zero
        require(amount > 0, "Amount must be greater than zero");

        // 5. Reconstruct the message that was signed (AP2 Authorization)
        bytes32 messageHash = keccak256(abi.encodePacked(
            intentId,
            user,
            merchant,
            amount,
            mandateHash,
            expiry,
            nonces[user]
        ));

        // 6. Verify signature matches user address
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(userSignature);
        
        require(recoveredSigner == user, "Invalid signature");

        // 7. Mark intent as executed and store settlement data
        executedIntents[intentId] = true;
        nonces[user]++;
        
        // Store settlement details for potential refunds
        settlements[intentId] = Settlement({
            intentId: intentId,
            user: user,
            merchant: merchant,
            amount: amount,
            timestamp: block.timestamp,
            exists: true
        });

        // 8. Execute USDC transfer (x402 Settlement)
        bool success = USDC.transferFrom(user, merchant, amount);
        require(success, "USDC transfer failed");

        // 9. Emit settlement event
        emit SettlementExecuted(intentId, user, merchant, amount, mandateHash);
    }

    /**
     * @notice Get the current nonce for a user
     * @param user User address
     * @return Current nonce value
     */
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    /**
     * @notice Check if an intent has been executed
     * @param intentId Intent identifier
     * @return True if executed, false otherwise
     */
    function isIntentExecuted(bytes32 intentId) external view returns (bool) {
        return executedIntents[intentId];
    }

    /**
     * @notice Get the message hash that needs to be signed by the user
     * @param intentId Intent identifier
     * @param user User address
     * @param merchant Merchant address
     * @param amount Payment amount
     * @param mandateHash Mandate hash
     * @param expiry Expiration timestamp
     * @param nonce User's current nonce
     * @return The hash that should be signed
     */
    function getMessageHash(
        bytes32 intentId,
        address user,
        address merchant,
        uint256 amount,
        bytes32 mandateHash,
        uint256 expiry,
        uint256 nonce
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            intentId,
            user,
            merchant,
            amount,
            mandateHash,
            expiry,
            nonce
        ));
    }

    /**
     * @notice Execute a refund from merchant to user
     * @param intentId Original payment intent identifier
     * @param merchantSignature Merchant's signature authorizing the refund
     */
    function refundSettlement(
        bytes32 intentId,
        bytes memory merchantSignature
    ) external {
        // 1. Verify settlement exists
        Settlement memory settlement = settlements[intentId];
        require(settlement.exists, "Settlement does not exist");
        
        // 2. Verify not already refunded
        require(!refundedIntents[intentId], "Already refunded");
        
        // 3. Verify settlement was executed
        require(executedIntents[intentId], "Settlement not executed");
        
        // 4. Reconstruct refund authorization message
        bytes32 messageHash = keccak256(abi.encodePacked(
            intentId,
            settlement.merchant,
            settlement.user,
            settlement.amount
        ));
        
        // 5. Verify merchant signature
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(merchantSignature);
        
        require(recoveredSigner == settlement.merchant, "Invalid merchant signature");
        
        // 6. Mark as refunded (before external call to prevent reentrancy)
        refundedIntents[intentId] = true;
        
        // 7. Execute USDC refund transfer (merchant -> user)
        bool success = USDC.transferFrom(settlement.merchant, settlement.user, settlement.amount);
        require(success, "USDC refund transfer failed");
        
        // 8. Emit refund event
        emit RefundExecuted(intentId, settlement.merchant, settlement.user, settlement.amount);
    }

    /**
     * @notice Get the refund message hash that needs to be signed by the merchant
     * @param intentId Intent identifier
     * @param merchant Merchant address
     * @param user User address
     * @param amount Refund amount
     * @return The hash that should be signed
     */
    function getRefundMessageHash(
        bytes32 intentId,
        address merchant,
        address user,
        uint256 amount
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            intentId,
            merchant,
            user,
            amount
        ));
    }

    /**
     * @notice Check if an intent has been refunded
     * @param intentId Intent identifier
     * @return True if refunded, false otherwise
     */
    function isIntentRefunded(bytes32 intentId) external view returns (bool) {
        return refundedIntents[intentId];
    }

    /**
     * @notice Get settlement details
     * @param intentId Intent identifier
     * @return Settlement struct with transaction details
     */
    function getSettlement(bytes32 intentId) external view returns (Settlement memory) {
        return settlements[intentId];
    }

    /**
     * @notice Request a refund for a specific payment
     * @param intentId Intent identifier
     */
    function requestRefund(bytes32 intentId) external {
        Settlement memory settlement = settlements[intentId];
        require(settlement.exists, "Settlement does not exist");
        require(settlement.user == msg.sender, "Only payer can request refund");
        require(!refundedIntents[intentId], "Already refunded");
        
        emit RefundRequested(intentId, msg.sender);
    }
}
