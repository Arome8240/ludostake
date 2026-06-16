// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title LudoStakes
 * @notice Escrow contract for Ludo Stakes on Celo. Players stake cUSD, the
 *         authorised game server declares the winner, and 8% goes to treasury.
 *
 * Game flow
 * ---------
 *   1. Player 1 calls createGame(gameId, stakeAmount)   — locks their stake.
 *   2. Player 2 (or house wallet for vs-AI) calls joinGame(gameId)  — matches stake.
 *   3. Game is played off-chain (Colyseus server).
 *   4. Game server calls declareWinner(gameId, winnerAddress)  — distributes pot.
 *
 * Cancellation
 * ------------
 *   Player 1 or the game server can call cancelGame() while the game is still in
 *   Created state (before anyone joins) to get a full refund.
 */
contract LudoStakes is ReentrancyGuard {
    // ── State variables ────────────────────────────────────────────────────────

    address public owner;
    address public gameServer;
    address public treasury;
    address public immutable cUSD;

    /// @dev 8% protocol fee expressed in basis points (100 bps = 1%)
    uint256 public constant FEE_BPS = 800;
    uint256 private constant BPS_DENOM = 10_000;

    enum GameState {
        None,
        Created,
        Active,
        Completed,
        Cancelled
    }

    struct Game {
        address player1;
        address player2;
        uint256 stakeAmount; // per-player stake in cUSD wei
        GameState state;
    }

    mapping(bytes32 => Game) public games;

    // ── Events ─────────────────────────────────────────────────────────────────

    event GameCreated(bytes32 indexed gameId, address indexed player1, uint256 stakeAmount);
    event GameJoined(bytes32 indexed gameId, address indexed player2);
    event GameCompleted(bytes32 indexed gameId, address indexed winner, uint256 reward);
    event GameCancelled(bytes32 indexed gameId, address indexed refundedTo);
    event GameServerUpdated(address indexed newServer);
    event TreasuryUpdated(address indexed newTreasury);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ── Custom errors ──────────────────────────────────────────────────────────

    error GameAlreadyExists();
    error GameNotJoinable();
    error GameNotActive();
    error InvalidStakeAmount();
    error CannotJoinOwnGame();
    error InvalidWinner();
    error NotAuthorized();
    error ZeroAddress();
    error TransferFailed();

    // ── Modifiers ──────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    modifier onlyGameServer() {
        if (msg.sender != gameServer) revert NotAuthorized();
        _;
    }

    // ── Constructor ────────────────────────────────────────────────────────────

    /**
     * @param _gameServer  Address authorised to declare winners and cancel games.
     * @param _treasury    Address that receives the 8% protocol fee.
     * @param _cUSD        cUSD ERC-20 token address (differs per network).
     */
    constructor(address _gameServer, address _treasury, address _cUSD) {
        if (_gameServer == address(0) || _treasury == address(0) || _cUSD == address(0)) {
            revert ZeroAddress();
        }
        owner = msg.sender;
        gameServer = _gameServer;
        treasury = _treasury;
        cUSD = _cUSD;
    }

    // ── Core game functions ────────────────────────────────────────────────────

    /**
     * @notice Player 1 creates a game and locks their stake.
     *         Caller must have approved this contract for at least `stakeAmount` cUSD.
     * @param gameId      Unique identifier for the game (generated client-side).
     * @param stakeAmount Amount of cUSD (in wei) each player will stake.
     */
    function createGame(bytes32 gameId, uint256 stakeAmount) external nonReentrant {
        if (games[gameId].state != GameState.None) revert GameAlreadyExists();
        if (stakeAmount == 0) revert InvalidStakeAmount();

        games[gameId] = Game({
            player1: msg.sender,
            player2: address(0),
            stakeAmount: stakeAmount,
            state: GameState.Created
        });

        if (!IERC20(cUSD).transferFrom(msg.sender, address(this), stakeAmount)) {
            revert TransferFailed();
        }

        emit GameCreated(gameId, msg.sender, stakeAmount);
    }

    /**
     * @notice Player 2 joins an existing game and matches the stake.
     *         Caller must have approved this contract for the game's stakeAmount.
     * @param gameId  The game to join.
     */
    function joinGame(bytes32 gameId) external nonReentrant {
        Game storage game = games[gameId];
        if (game.state != GameState.Created) revert GameNotJoinable();
        if (game.player1 == msg.sender) revert CannotJoinOwnGame();

        game.player2 = msg.sender;
        game.state = GameState.Active;

        if (!IERC20(cUSD).transferFrom(msg.sender, address(this), game.stakeAmount)) {
            revert TransferFailed();
        }

        emit GameJoined(gameId, msg.sender);
    }

    /**
     * @notice Called by the game server after the match ends. Distributes the pot:
     *         92% → winner, 8% → treasury.
     * @param gameId  The completed game.
     * @param winner  Must be player1 or player2.
     */
    function declareWinner(bytes32 gameId, address winner) external onlyGameServer nonReentrant {
        Game storage game = games[gameId];
        if (game.state != GameState.Active) revert GameNotActive();
        if (winner != game.player1 && winner != game.player2) revert InvalidWinner();

        uint256 pot = game.stakeAmount * 2;
        uint256 fee = (pot * FEE_BPS) / BPS_DENOM;
        uint256 reward = pot - fee;

        game.state = GameState.Completed;

        if (!IERC20(cUSD).transfer(winner, reward)) revert TransferFailed();
        if (!IERC20(cUSD).transfer(treasury, fee)) revert TransferFailed();

        emit GameCompleted(gameId, winner, reward);
    }

    /**
     * @notice Cancels a Created (not yet joined) game and refunds player 1.
     *         Can be called by player 1 or the game server.
     * @param gameId  The game to cancel.
     */
    function cancelGame(bytes32 gameId) external nonReentrant {
        Game storage game = games[gameId];
        if (game.state != GameState.Created) revert GameNotJoinable();
        if (msg.sender != game.player1 && msg.sender != gameServer) revert NotAuthorized();

        address refundTo = game.player1;
        uint256 refundAmount = game.stakeAmount;

        game.state = GameState.Cancelled;

        if (!IERC20(cUSD).transfer(refundTo, refundAmount)) revert TransferFailed();

        emit GameCancelled(gameId, refundTo);
    }

    // ── View ───────────────────────────────────────────────────────────────────

    function getGame(bytes32 gameId) external view returns (Game memory) {
        return games[gameId];
    }

    /// @notice Net reward a winner receives given a per-player stake (after 8% fee).
    function netReward(uint256 stakeAmount) external pure returns (uint256) {
        uint256 pot = stakeAmount * 2;
        uint256 fee = (pot * FEE_BPS) / BPS_DENOM;
        return pot - fee;
    }

    // ── Admin ──────────────────────────────────────────────────────────────────

    function setGameServer(address _gameServer) external onlyOwner {
        if (_gameServer == address(0)) revert ZeroAddress();
        gameServer = _gameServer;
        emit GameServerUpdated(_gameServer);
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
