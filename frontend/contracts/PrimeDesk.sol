// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PrimeDesk
 * @notice Decentralized social-fi platform on LitVM (Litecoin EVM)
 * @dev Handles creator subscriptions, post tips, and earnings withdrawals
 */
contract PrimeDesk {

    // ─── STRUCTS ────────────────────────────────────────────────────────────

    struct Creator {
        address payoutAddress;   // where earnings go
        uint256 monthlyPrice;    // subscription price in wei
        uint256 totalEarned;     // lifetime earnings
        bool isActive;           // creator is registered
        CreatorTier tier;        // BASIC / PRO / ELITE
    }

    struct Subscription {
        uint256 expiresAt;       // unix timestamp
        bool active;
    }

    enum CreatorTier { NONE, BASIC, PRO, ELITE }

    // ─── STATE ──────────────────────────────────────────────────────────────

    address public owner;
    uint256 public platformFee = 0;          // 0% — pure P2P
    uint256 public constant BASIC_TIER_FEE  = 0.2 ether;  // in LTC wei
    uint256 public constant PRO_TIER_FEE    = 0.5 ether;
    uint256 public constant ELITE_TIER_FEE  = 1.0 ether;
    uint256 public constant SUBSCRIPTION_DURATION = 30 days;

    // username hash -> Creator
    mapping(bytes32 => Creator) public creators;

    // subscriber -> creator username hash -> Subscription
    mapping(address => mapping(bytes32 => Subscription)) public subscriptions;

    // post ID hash -> total tips received
    mapping(bytes32 => uint256) public postTips;

    // creator username hash -> pending withdrawable balance
    mapping(bytes32 => uint256) public pendingWithdrawals;

    // ─── EVENTS ─────────────────────────────────────────────────────────────

    event CreatorRegistered(
        address indexed creator,
        bytes32 indexed usernameHash,
        CreatorTier tier,
        uint256 monthlyPrice
    );

    event Subscribed(
        address indexed subscriber,
        bytes32 indexed creatorHash,
        uint256 amount,
        uint256 expiresAt
    );

    event TipSent(
        address indexed tipper,
        bytes32 indexed postIdHash,
        bytes32 indexed creatorHash,
        uint256 amount
    );

    event Withdrawn(
        bytes32 indexed creatorHash,
        address indexed payoutAddress,
        uint256 amount
    );

    event CreatorPriceUpdated(
        bytes32 indexed creatorHash,
        uint256 newPrice
    );

    // ─── MODIFIERS ──────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier creatorExists(bytes32 usernameHash) {
        require(creators[usernameHash].isActive, "Creator not registered");
        _;
    }

    // ─── CONSTRUCTOR ────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── CREATOR REGISTRATION ───────────────────────────────────────────────

    /**
     * @notice Register as a creator by paying the tier fee
     * @param usernameHash keccak256 of the creator's username
     * @param tier BASIC=1, PRO=2, ELITE=3
     * @param monthlyPrice subscription price in wei subscribers will pay
     * @param payoutAddress address to receive earnings
     */
    function registerCreator(
        bytes32 usernameHash,
        CreatorTier tier,
        uint256 monthlyPrice,
        address payoutAddress
    ) external payable {
        require(!creators[usernameHash].isActive, "Already registered");
        require(tier != CreatorTier.NONE, "Invalid tier");
        require(payoutAddress != address(0), "Invalid payout address");
        require(monthlyPrice > 0, "Price must be > 0");

        uint256 requiredFee = _tierFee(tier);
        require(msg.value >= requiredFee, "Insufficient tier fee");

        creators[usernameHash] = Creator({
            payoutAddress: payoutAddress,
            monthlyPrice: monthlyPrice,
            totalEarned: 0,
            isActive: true,
            tier: tier
        });

        // Tier fee goes to platform owner
        if (msg.value > 0) {
            payable(owner).transfer(msg.value);
        }

        emit CreatorRegistered(msg.sender, usernameHash, tier, monthlyPrice);
    }

    /**
     * @notice Update subscription price
     */
    function updatePrice(bytes32 usernameHash, uint256 newPrice)
        external
        creatorExists(usernameHash)
    {
        require(
            creators[usernameHash].payoutAddress == msg.sender,
            "Not creator"
        );
        require(newPrice > 0, "Price must be > 0");
        creators[usernameHash].monthlyPrice = newPrice;
        emit CreatorPriceUpdated(usernameHash, newPrice);
    }

    // ─── SUBSCRIPTIONS ──────────────────────────────────────────────────────

    /**
     * @notice Subscribe to a creator for 30 days
     * @param creatorHash keccak256 of the creator's username
     */
    function subscribe(bytes32 creatorHash)
        external
        payable
        creatorExists(creatorHash)
    {
        Creator storage creator = creators[creatorHash];
        require(msg.value >= creator.monthlyPrice, "Insufficient payment");

        // Extend existing subscription or start new one
        uint256 currentExpiry = subscriptions[msg.sender][creatorHash].expiresAt;
        uint256 newExpiry = (currentExpiry > block.timestamp ? currentExpiry : block.timestamp)
            + SUBSCRIPTION_DURATION;

        subscriptions[msg.sender][creatorHash] = Subscription({
            expiresAt: newExpiry,
            active: true
        });

        // Add to creator's withdrawable balance (0% platform fee)
        pendingWithdrawals[creatorHash] += msg.value;
        creator.totalEarned += msg.value;

        // Refund overpayment
        uint256 overpayment = msg.value - creator.monthlyPrice;
        if (overpayment > 0) {
            payable(msg.sender).transfer(overpayment);
        }

        emit Subscribed(msg.sender, creatorHash, creator.monthlyPrice, newExpiry);
    }

    /**
     * @notice Check if an address is subscribed to a creator
     */
    function isSubscribed(address subscriber, bytes32 creatorHash)
        external
        view
        returns (bool, uint256 expiresAt)
    {
        Subscription memory sub = subscriptions[subscriber][creatorHash];
        bool active = sub.active && sub.expiresAt > block.timestamp;
        return (active, sub.expiresAt);
    }

    // ─── TIPS ───────────────────────────────────────────────────────────────

    /**
     * @notice Tip a post — funds go directly to creator's withdrawal balance
     * @param postIdHash keccak256 of the post ID
     * @param creatorHash keccak256 of the creator's username
     */
    function tip(bytes32 postIdHash, bytes32 creatorHash)
        external
        payable
        creatorExists(creatorHash)
    {
        require(msg.value > 0, "Tip must be > 0");

        postTips[postIdHash] += msg.value;
        pendingWithdrawals[creatorHash] += msg.value;
        creators[creatorHash].totalEarned += msg.value;

        emit TipSent(msg.sender, postIdHash, creatorHash, msg.value);
    }

    // ─── WITHDRAWALS ────────────────────────────────────────────────────────

    /**
     * @notice Withdraw all pending earnings to payout address
     * @param usernameHash keccak256 of the creator's username
     */
    function withdraw(bytes32 usernameHash)
        external
        creatorExists(usernameHash)
    {
        Creator storage creator = creators[usernameHash];
        require(
            creator.payoutAddress == msg.sender,
            "Only creator payout address can withdraw"
        );

        uint256 amount = pendingWithdrawals[usernameHash];
        require(amount > 0, "Nothing to withdraw");

        // Effects before interactions (reentrancy protection)
        pendingWithdrawals[usernameHash] = 0;

        payable(creator.payoutAddress).transfer(amount);

        emit Withdrawn(usernameHash, creator.payoutAddress, amount);
    }

    /**
     * @notice Update payout address
     */
    function updatePayoutAddress(bytes32 usernameHash, address newAddress)
        external
        creatorExists(usernameHash)
    {
        require(
            creators[usernameHash].payoutAddress == msg.sender,
            "Not creator"
        );
        require(newAddress != address(0), "Invalid address");
        creators[usernameHash].payoutAddress = newAddress;
    }

    // ─── VIEWS ──────────────────────────────────────────────────────────────

    function getCreator(bytes32 usernameHash)
        external
        view
        returns (
            address payoutAddress,
            uint256 monthlyPrice,
            uint256 totalEarned,
            bool isActive,
            CreatorTier tier,
            uint256 pendingBalance
        )
    {
        Creator memory c = creators[usernameHash];
        return (
            c.payoutAddress,
            c.monthlyPrice,
            c.totalEarned,
            c.isActive,
            c.tier,
            pendingWithdrawals[usernameHash]
        );
    }

    function getPostTips(bytes32 postIdHash)
        external
        view
        returns (uint256)
    {
        return postTips[postIdHash];
    }

    // ─── INTERNAL ───────────────────────────────────────────────────────────

    function _tierFee(CreatorTier tier) internal pure returns (uint256) {
        if (tier == CreatorTier.BASIC) return BASIC_TIER_FEE;
        if (tier == CreatorTier.PRO)   return PRO_TIER_FEE;
        if (tier == CreatorTier.ELITE) return ELITE_TIER_FEE;
        return 0;
    }

    // ─── OWNER ──────────────────────────────────────────────────────────────

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    receive() external payable {}
}
