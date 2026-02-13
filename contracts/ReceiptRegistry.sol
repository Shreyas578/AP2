// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ReceiptRegistry
 * @notice Audit trail registry for payment receipts
 * @dev Stores immutable payment records for compliance and dispute resolution
 */
contract ReceiptRegistry {
    
    /**
     * @notice Structure representing a payment receipt
     */
    struct Receipt {
        bytes32 intentId;
        address user;
        address merchant;
        uint256 amount;
        bytes32 txHash;
        uint256 timestamp;
        string status;
        bool exists;
    }

    // Mapping from intentId to receipt
    mapping(bytes32 => Receipt) public receipts;
    
    // Array of all intent IDs for enumeration
    bytes32[] public intentIds;

    /**
     * @notice Emitted when a new receipt is created
     * @param intentId Unique payment intent identifier
     * @param user User wallet address
     * @param merchant Merchant wallet address
     * @param amount Payment amount
     * @param status Payment status (SUCCESS or FAILED)
     */
    event ReceiptCreated(
        bytes32 indexed intentId,
        address indexed user,
        address indexed merchant,
        uint256 amount,
        string status
    );

    /**
     * @notice Create a new receipt record
     * @param intentId Unique payment intent identifier
     * @param user User wallet address
     * @param merchant Merchant wallet address
     * @param amount Payment amount in USDC (6 decimals)
     * @param txHash Transaction hash of the settlement
     * @param status Status string (SUCCESS or FAILED)
     */
    function createReceipt(
        bytes32 intentId,
        address user,
        address merchant,
        uint256 amount,
        bytes32 txHash,
        string memory status
    ) external {
        require(!receipts[intentId].exists, "Receipt already exists");
        require(user != address(0), "Invalid user address");
        require(merchant != address(0), "Invalid merchant address");

        receipts[intentId] = Receipt({
            intentId: intentId,
            user: user,
            merchant: merchant,
            amount: amount,
            txHash: txHash,
            timestamp: block.timestamp,
            status: status,
            exists: true
        });

        intentIds.push(intentId);

        emit ReceiptCreated(intentId, user, merchant, amount, status);
    }

    /**
     * @notice Get receipt details by intent ID
     * @param intentId Intent identifier
     * @return Receipt structure with all details
     */
    function getReceipt(bytes32 intentId) external view returns (Receipt memory) {
        require(receipts[intentId].exists, "Receipt does not exist");
        return receipts[intentId];
    }

    /**
     * @notice Check if a receipt exists
     * @param intentId Intent identifier
     * @return True if receipt exists, false otherwise
     */
    function receiptExists(bytes32 intentId) external view returns (bool) {
        return receipts[intentId].exists;
    }

    /**
     * @notice Get total number of receipts
     * @return Total receipt count
     */
    function getReceiptCount() external view returns (uint256) {
        return intentIds.length;
    }

    /**
     * @notice Get intent ID by index
     * @param index Array index
     * @return Intent ID at that index
     */
    function getIntentIdByIndex(uint256 index) external view returns (bytes32) {
        require(index < intentIds.length, "Index out of bounds");
        return intentIds[index];
    }

    /**
     * @notice Get all receipts for a specific user
     * @param user User address
     * @return Array of receipts for the user
     */
    function getUserReceipts(address user) external view returns (Receipt[] memory) {
        uint256 count = 0;
        
        // Count user receipts
        for (uint256 i = 0; i < intentIds.length; i++) {
            if (receipts[intentIds[i]].user == user) {
                count++;
            }
        }
        
        // Build result array
        Receipt[] memory userReceipts = new Receipt[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < intentIds.length; i++) {
            if (receipts[intentIds[i]].user == user) {
                userReceipts[index] = receipts[intentIds[i]];
                index++;
            }
        }
        
        return userReceipts;
    }

    /**
     * @notice Get all receipts for a specific merchant
     * @param merchant Merchant address
     * @return Array of receipts for the merchant
     */
    function getMerchantReceipts(address merchant) external view returns (Receipt[] memory) {
        uint256 count = 0;
        
        // Count merchant receipts
        for (uint256 i = 0; i < intentIds.length; i++) {
            if (receipts[intentIds[i]].merchant == merchant) {
                count++;
            }
        }
        
        // Build result array
        Receipt[] memory merchantReceipts = new Receipt[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < intentIds.length; i++) {
            if (receipts[intentIds[i]].merchant == merchant) {
                merchantReceipts[index] = receipts[intentIds[i]];
                index++;
            }
        }
        
        return merchantReceipts;
    }
}
