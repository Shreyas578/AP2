// Configuration for AP2 Payment System Frontend

const CONFIG = {
    // Network Configuration
    CHAIN_ID: 84532, // Base Sepolia
    CHAIN_NAME: "Base Sepolia",
    RPC_URL: "https://sepolia.base.org",
    BLOCK_EXPLORER: "https://sepolia.basescan.org",

    // Token Configuration
    USDC_ADDRESS: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    USDC_DECIMALS: 6,

    // Contract addresses (Auto-loaded from deployment)
    PAYMENT_PROCESSOR_ADDRESS: "0xfe823E7f07d1Cc0f2c1DBC35921C15D2442e902E",
    RECEIPT_REGISTRY_ADDRESS: "0x6BF809F752A983504F61610dFb7c4ef5Df1b47e5",

    // Default merchant address (for demo)
    DEFAULT_MERCHANT: "0x0fA104023bf4d13a67fBA13FF91B2e8Fb04Cd920",

    // Product Catalog
    PRODUCTS: {
        // BUDGET ITEMS ($1-$5)
        "tea-bag": {
            name: "Single Tea Bag",
            price: 1,
            sku: "SKU-TEA-BAG-001",
            description: "Premium green tea bag"
        },
        "coffee-sample": {
            name: "Coffee Sample Pack",
            price: 2,
            sku: "SKU-COFFEE-SAMPLE-002",
            description: "3 coffee bean samples"
        },
        "honey-stick": {
            name: "Honey Stick",
            price: 1.5,
            sku: "SKU-HONEY-STICK-003",
            description: "Single serve honey stick"
        },
        "spice-packet": {
            name: "Spice Packet",
            price: 3,
            sku: "SKU-SPICE-PACKET-004",
            description: "Single spice packet"
        },
        "chocolate-square": {
            name: "Chocolate Square",
            price: 2.5,
            sku: "SKU-CHOC-SQUARE-005",
            description: "Single dark chocolate square"
        },
        "salt-sample": {
            name: "Sea Salt Sample",
            price: 2,
            sku: "SKU-SALT-SAMPLE-006",
            description: "Himalayan salt sample"
        },
        "cookie": {
            name: "Artisan Cookie",
            price: 3.5,
            sku: "SKU-COOKIE-007",
            description: "Handmade chocolate chip cookie"
        },
        "granola-bar": {
            name: "Organic Granola Bar",
            price: 4,
            sku: "SKU-GRANOLA-008",
            description: "Organic oat granola bar"
        },
        "mint-tin": {
            name: "Mint Tin",
            price: 2.5,
            sku: "SKU-MINT-009",
            description: "Peppermint breath mints"
        },
        "gum-pack": {
            name: "Chewing Gum Pack",
            price: 3,
            sku: "SKU-GUM-010",
            description: "Sugar-free gum pack"
        },

        // AFFORDABLE ITEMS ($5-$15)
        "coffee-bag": {
            name: "Coffee Bag (250g)",
            price: 8,
            sku: "SKU-COFFEE-BAG-011",
            description: "Medium roast coffee beans"
        },
        "tea-box": {
            name: "Tea Box (20 bags)",
            price: 6,
            sku: "SKU-TEA-BOX-012",
            description: "Assorted tea collection"
        },
        "honey-jar-small": {
            name: "Small Honey Jar",
            price: 10,
            sku: "SKU-HONEY-SMALL-013",
            description: "250ml pure honey"
        },
        "chocolate-bar": {
            name: "Chocolate Bar",
            price: 7,
            sku: "SKU-CHOC-BAR-014",
            description: "70% dark chocolate bar"
        },
        "nuts-pack": {
            name: "Mixed Nuts Pack",
            price: 9,
            sku: "SKU-NUTS-015",
            description: "Roasted mixed nuts"
        },
        "dried-fruit": {
            name: "Dried Fruit Mix",
            price: 8.5,
            sku: "SKU-DRIED-FRUIT-016",
            description: "Organic dried fruit mix"
        },
        "protein-bar": {
            name: "Protein Bar (6-pack)",
            price: 12,
            sku: "SKU-PROTEIN-017",
            description: "Plant-based protein bars"
        },
        "popcorn": {
            name: "Gourmet Popcorn",
            price: 6.5,
            sku: "SKU-POPCORN-018",
            description: "Caramel popcorn bag"
        },
        "crackers": {
            name: "Artisan Crackers",
            price: 7.5,
            sku: "SKU-CRACKERS-019",
            description: "Whole grain crackers"
        },
        "jam-jar": {
            name: "Fruit Jam Jar",
            price: 9.5,
            sku: "SKU-JAM-020",
            description: "Strawberry jam"
        },

        // MID-RANGE ITEMS ($15-$30)
        "organic-honey": {
            name: "Organic Honey Jar",
            price: 18,
            sku: "SKU-ORGANIC-HONEY-021",
            description: "500ml pure wildflower honey"
        },
        "sea-salt": {
            name: "Himalayan Sea Salt",
            price: 15,
            sku: "SKU-SEA-SALT-022",
            description: "Pink Himalayan salt grinder"
        },
        "olive-oil-small": {
            name: "Olive Oil (250ml)",
            price: 22,
            sku: "SKU-OLIVE-SMALL-023",
            description: "Extra virgin olive oil"
        },
        "maple-syrup-small": {
            name: "Maple Syrup (250ml)",
            price: 20,
            sku: "SKU-MAPLE-SMALL-024",
            description: "Grade A maple syrup"
        },
        "spice-set-small": {
            name: "Spice Set (5 pack)",
            price: 25,
            sku: "SKU-SPICE-SMALL-025",
            description: "Essential spice collection"
        },
        "pasta-sauce": {
            name: "Artisan Pasta Sauce",
            price: 16,
            sku: "SKU-PASTA-SAUCE-026",
            description: "Organic tomato sauce"
        },
        "balsamic-small": {
            name: "Balsamic Vinegar (250ml)",
            price: 24,
            sku: "SKU-BALSAMIC-SMALL-027",
            description: "Aged balsamic vinegar"
        },
        "hot-sauce": {
            name: "Artisan Hot Sauce",
            price: 14,
            sku: "SKU-HOT-SAUCE-028",
            description: "Handcrafted hot sauce"
        },

        // PREMIUM ITEMS ($30+)
        "artisan-tea": {
            name: "Artisan Tea Collection",
            price: 35,
            sku: "SKU-ARTISAN-TEA-029",
            description: "Hand-picked premium tea leaves"
        },
        "maple-syrup": {
            name: "Pure Maple Syrup (500ml)",
            price: 40,
            sku: "SKU-MAPLE-SYRUP-030",
            description: "Grade A maple syrup"
        },
        "matcha-powder": {
            name: "Ceremonial Matcha Powder",
            price: 42,
            sku: "SKU-MATCHA-031",
            description: "Japanese ceremonial grade"
        },
        "craft-chocolate": {
            name: "Craft Chocolate Bar",
            price: 45,
            sku: "SKU-CRAFT-CHOCOLATE-032",
            description: "70% dark chocolate"
        },
        "balsamic-vinegar": {
            name: "Aged Balsamic Vinegar (500ml)",
            price: 48,
            sku: "SKU-BALSAMIC-033",
            description: "18-year aged balsamic"
        },
        "premium-coffee": {
            name: "Premium Coffee Beans (1kg)",
            price: 50,
            sku: "SKU-PREMIUM-COFFEE-034",
            description: "Organic single-origin coffee"
        },
        "olive-oil": {
            name: "Extra Virgin Olive Oil (750ml)",
            price: 55,
            sku: "SKU-OLIVE-OIL-035",
            description: "Cold-pressed Italian olive oil"
        },
        "specialty-spices": {
            name: "Specialty Spice Set",
            price: 60,
            sku: "SKU-SPICE-SET-036",
            description: "Gourmet spice collection"
        },
        "vanilla-extract": {
            name: "Madagascar Vanilla Extract",
            price: 65,
            sku: "SKU-VANILLA-037",
            description: "Pure vanilla extract"
        },
        "truffle-oil": {
            name: "White Truffle Oil",
            price: 85,
            sku: "SKU-TRUFFLE-038",
            description: "Premium truffle-infused oil"
        },

        // EXTRA BUDGET ITEMS
        "energy-bar": {
            name: "Energy Bar",
            price: 2.75,
            sku: "SKU-ENERGY-039",
            description: "Oat and honey energy bar"
        },
        "fruit-snack": {
            name: "Fruit Snack Pack",
            price: 1.75,
            sku: "SKU-FRUIT-SNACK-040",
            description: "Dried fruit snack"
        },
        "trail-mix": {
            name: "Trail Mix Packet",
            price: 4.5,
            sku: "SKU-TRAIL-MIX-041",
            description: "Nuts and dried fruit mix"
        },
        "rice-cake": {
            name: "Rice Cake Pack",
            price: 3.25,
            sku: "SKU-RICE-CAKE-042",
            description: "Lightly salted rice cakes"
        },
        "beef-jerky": {
            name: "Beef Jerky",
            price: 5,
            sku: "SKU-BEEF-JERKY-043",
            description: "Teriyaki beef jerky"
        },

        // EXTRA AFFORDABLE ITEMS
        "pasta-pack": {
            name: "Artisan Pasta",
            price: 11,
            sku: "SKU-PASTA-044",
            description: "Handmade pasta 500g"
        },
        "rice-bag": {
            name: "Organic Rice (1kg)",
            price: 13,
            sku: "SKU-RICE-045",
            description: "Organic jasmine rice"
        },
        "quinoa": {
            name: "Quinoa Pack (500g)",
            price: 14.5,
            sku: "SKU-QUINOA-046",
            description: "Organic tri-color quinoa"
        },
        "oats": {
            name: "Steel Cut Oats",
            price: 9.75,
            sku: "SKU-OATS-047",
            description: "Organic steel cut oats"
        },
        "chia-seeds": {
            name: "Chia Seeds",
            price: 11.5,
            sku: "SKU-CHIA-048",
            description: "Organic chia seeds 250g"
        },

        // EXTRA MID-RANGE ITEMS
        "coconut-oil": {
            name: "Coconut Oil",
            price: 19,
            sku: "SKU-COCONUT-049",
            description: "Virgin coconut oil 500ml"
        },
        "almond-butter": {
            name: "Almond Butter",
            price: 17,
            sku: "SKU-ALMOND-050",
            description: "Organic almond butter"
        },
        "peanut-butter": {
            name: "Peanut Butter",
            price: 13.5,
            sku: "SKU-PEANUT-051",
            description: "Natural peanut butter"
        },
        "tahini": {
            name: "Tahini Paste",
            price: 16.5,
            sku: "SKU-TAHINI-052",
            description: "Sesame tahini paste"
        },
        "mustard": {
            name: "Dijon Mustard",
            price: 12.5,
            sku: "SKU-MUSTARD-053",
            description: "French Dijon mustard"
        },

        // EXTRA PREMIUM ITEMS
        "caviar": {
            name: "Caviar Tin",
            price: 95,
            sku: "SKU-CAVIAR-054",
            description: "Premium caviar 50g"
        },
        "saffron": {
            name: "Saffron Threads",
            price: 75,
            sku: "SKU-SAFFRON-055",
            description: "Premium saffron 5g"
        },
        "wagyu-jerky": {
            name: "Wagyu Beef Jerky",
            price: 68,
            sku: "SKU-WAGYU-056",
            description: "Premium wagyu jerky"
        },
        "champagne-vinegar": {
            name: "Champagne Vinegar",
            price: 38,
            sku: "SKU-CHAMPAGNE-057",
            description: "French champagne vinegar"
        },
        "truffle-salt": {
            name: "Black Truffle Salt",
            price: 52,
            sku: "SKU-TRUFFLE-SALT-058",
            description: "Black truffle sea salt"
        }
    },

    // Contract ABIs (minimal required functions)
    USDC_ABI: [
        "function balanceOf(address account) external view returns (uint256)",
        "function allowance(address owner, address spender) external view returns (uint256)",
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function decimals() external view returns (uint8)"
    ],

    PAYMENT_PROCESSOR_ABI: [
        "function executeSettlement(bytes32 intentId, address user, address merchant, uint256 amount, bytes32 mandateHash, uint256 expiry, bytes signature) external",
        "function getNonce(address user) external view returns (uint256)",
        "function isIntentExecuted(bytes32 intentId) external view returns (bool)",
        "function getMessageHash(bytes32 intentId, address user, address merchant, uint256 amount, bytes32 mandateHash, uint256 expiry, uint256 nonce) public pure returns (bytes32)",
        "function refundSettlement(bytes32 intentId, bytes merchantSignature) external",
        "function isIntentRefunded(bytes32 intentId) external view returns (bool)",
        "function requestRefund(bytes32 intentId) external",
        "event SettlementExecuted(bytes32 indexed intentId, address indexed user, address indexed merchant, uint256 amount, bytes32 mandateHash)",
        "event RefundExecuted(bytes32 indexed intentId, address indexed merchant, address indexed user, uint256 amount)",
        "event RefundRequested(bytes32 indexed intentId, address indexed user)"
    ],

    RECEIPT_REGISTRY_ABI: [
        "function createReceipt(bytes32 intentId, address user, address merchant, uint256 amount, bytes32 txHash, string status) external",
        "function getReceipt(bytes32 intentId) external view returns (tuple(bytes32 intentId, address user, address merchant, uint256 amount, bytes32 txHash, uint256 timestamp, string status, bool exists))",
        "function receiptExists(bytes32 intentId) external view returns (bool)",
        "event ReceiptCreated(bytes32 indexed intentId, address indexed user, address indexed merchant, uint256 amount, string status)"
    ]
};

// Load configuration from deployed contracts if available
async function loadDeployedContracts() {
    try {
        const response = await fetch('../deployments/base-sepolia.json');
        if (response.ok) {
            const deployment = await response.json();
            CONFIG.PAYMENT_PROCESSOR_ADDRESS = deployment.contracts.PaymentProcessor;
            CONFIG.RECEIPT_REGISTRY_ADDRESS = deployment.contracts.ReceiptRegistry;
            console.log('✅ Loaded deployed contract addresses');
            return true;
        }
    } catch (error) {
        console.log('ℹ️ No deployment file found. Contracts need to be deployed.');
    }
    return false;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
