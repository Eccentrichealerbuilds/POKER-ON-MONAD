// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

/**
 * @title PokerEntropyDealerV2
 * @notice Commit-reveal VRF scheme for provably fair poker.
 *         - Backend commits saltHash BEFORE VRF request
 *         - Deck is NEVER stored on-chain until game ends
 *         - Players can verify fairness after game completion
 */

import "@pythnetwork/entropy-sdk-solidity/IEntropyV2.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";

contract PokerEntropyDealerV2 is IEntropyConsumer {
    IEntropyV2 public immutable entropy;

    struct GameSession {
        bytes32 saltHash;        // keccak256(salt) - committed before VRF
        bytes32 pythSeed;        // VRF result - stored after callback
        bytes32 revealedSalt;    // Revealed at game end
        address host;            // Game host
        uint64 sequenceNumber;   // Entropy sequence number
        bool vrfFulfilled;       // True after VRF callback
        bool gameEnded;          // True after salt reveal
        bool verified;           // True if verification passed
    }

    /// Game ID => GameSession
    mapping(bytes32 => GameSession) public games;
    
    /// Entropy sequence number => Game ID (for callback routing)
    mapping(uint64 => bytes32) public seqToGameId;

    event SaltCommitted(bytes32 indexed gameId, bytes32 saltHash, address host);
    event ShuffleRequested(bytes32 indexed gameId, uint64 sequenceNumber);
    event VRFFulfilled(bytes32 indexed gameId, bytes32 pythSeed);
    event GameVerified(bytes32 indexed gameId, bytes32 salt, bytes32 finalSeed, bool valid);

    constructor(address entropyContract) {
        entropy = IEntropyV2(entropyContract);
    }

    /**
     * @notice Step 1: Backend commits saltHash before requesting VRF
     * @param gameId Unique game identifier
     * @param saltHash keccak256(salt) where salt is known only to backend
     */
    function commitSalt(bytes32 gameId, bytes32 saltHash) external {
        require(games[gameId].saltHash == bytes32(0), "already committed");
        require(saltHash != bytes32(0), "invalid saltHash");
        
        games[gameId] = GameSession({
            saltHash: saltHash,
            pythSeed: bytes32(0),
            revealedSalt: bytes32(0),
            host: msg.sender,
            sequenceNumber: 0,
            vrfFulfilled: false,
            gameEnded: false,
            verified: false
        });
        
        emit SaltCommitted(gameId, saltHash, msg.sender);
    }

    /**
     * @notice Step 2: Request VRF shuffle (after salt is committed)
     * @param gameId Game identifier with committed salt
     */
    function requestShuffle(bytes32 gameId) external payable returns (uint64 seq) {
        GameSession storage game = games[gameId];
        require(game.saltHash != bytes32(0), "salt not committed");
        require(game.sequenceNumber == 0, "already requested");
        
        uint256 fee = entropy.getFeeV2();
        require(msg.value >= fee, "fee too low");
        
        seq = entropy.requestV2{value: fee}();
        game.sequenceNumber = seq;
        seqToGameId[seq] = gameId;
        
        emit ShuffleRequested(gameId, seq);
    }

    /**
     * @notice Entropy callback - stores pythSeed but NOT the deck
     */
    function entropyCallback(
        uint64 sequenceNumber,
        address /*provider*/,
        bytes32 randomNumber
    ) internal override {
        bytes32 gameId = seqToGameId[sequenceNumber];
        require(gameId != bytes32(0), "unknown sequence");
        
        GameSession storage game = games[gameId];
        game.pythSeed = randomNumber;
        game.vrfFulfilled = true;
        
        // NOTE: We do NOT compute or store the deck here!
        // Backend computes: finalSeed = keccak256(pythSeed + salt)
        // Backend derives deck from finalSeed and deals cards privately
        
        emit VRFFulfilled(gameId, randomNumber);
    }

    /**
     * @notice Step 3: Game end - backend reveals salt for verification
     * @param gameId Game identifier
     * @param salt The original salt (must hash to committed saltHash)
     * @param dealtCards Array of card indices that were dealt during game
     * @param cardPositions Array of positions in deck for each dealt card
     */
    function revealAndVerify(
        bytes32 gameId,
        bytes32 salt,
        uint8[] calldata dealtCards,
        uint8[] calldata cardPositions
    ) external returns (bool valid) {
        GameSession storage game = games[gameId];
        require(game.vrfFulfilled, "VRF not fulfilled");
        require(!game.gameEnded, "already ended");
        require(dealtCards.length == cardPositions.length, "length mismatch");
        
        // Verify salt matches commitment
        require(keccak256(abi.encodePacked(salt)) == game.saltHash, "salt mismatch");
        
        game.revealedSalt = salt;
        game.gameEnded = true;
        
        // Compute final seed and reconstruct deck
        bytes32 finalSeed = keccak256(abi.encodePacked(game.pythSeed, salt));
        bytes memory deck = _shuffle(finalSeed);
        
        // Verify all dealt cards match the deck
        valid = true;
        for (uint256 i = 0; i < dealtCards.length; i++) {
            uint8 pos = cardPositions[i];
            require(pos < 52, "invalid position");
            if (uint8(deck[pos]) != dealtCards[i]) {
                valid = false;
                break;
            }
        }
        
        game.verified = valid;
        emit GameVerified(gameId, salt, finalSeed, valid);
    }

    /**
     * @notice View function to compute final seed (for backend use after VRF)
     * @dev Backend calls this off-chain to get pythSeed, then computes finalSeed locally
     */
    function getGameState(bytes32 gameId) external view returns (
        bytes32 saltHash,
        bytes32 pythSeed,
        bool vrfFulfilled,
        bool gameEnded,
        bool verified
    ) {
        GameSession storage game = games[gameId];
        return (game.saltHash, game.pythSeed, game.vrfFulfilled, game.gameEnded, game.verified);
    }

    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }

    function getShuffleFee() external view returns (uint256) {
        return entropy.getFeeV2();
    }

    /**
     * @dev Fisher-Yates shuffle - same algorithm as V1
     */
    function _shuffle(bytes32 seed) internal pure returns (bytes memory packed) {
        uint8[52] memory deck;
        for (uint8 i = 0; i < 52; i++) deck[i] = i;

        uint256 s = uint256(seed);
        for (uint8 i = 51; i > 0; i--) {
            s = uint256(keccak256(abi.encodePacked(s, i)));
            uint8 j = uint8(s % (i + 1));
            uint8 temp = deck[i];
            deck[i] = deck[j];
            deck[j] = temp;
        }

        packed = new bytes(52);
        for (uint8 k = 0; k < 52; k++) {
            packed[k] = bytes1(deck[k]);
        }
    }

    receive() external payable {}
}
