// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

/**
 * @title PokerEntropyDealer
 * @notice Uses Pyth Entropy V2 to generate verifiable randomness for shuffling a 52-card deck.
 *         Anyone can request a shuffle by paying the fee. The shuffle algorithm is deterministic and
 *         derived solely from the returned random number, making results verifiable on-chain.
 */

import "@pythnetwork/entropy-sdk-solidity/IEntropyV2.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";

contract PokerEntropyDealer is IEntropyConsumer {
    IEntropyV2 public immutable entropy;

    /// Mapping from Entropy sequence number to packed 52-byte deck.
    mapping(uint64 => bytes) public packedDeckBySeq;

    /// Emitted when shuffle request is sent.
    event ShuffleRequested(uint64 sequenceNumber);
    /// Emitted once the deck is revealed.
    event Shuffled(uint64 sequenceNumber, bytes packedDeck);

    /**
     * @param entropyContract Address of the Entropy core contract on this chain.
     */
    constructor(address entropyContract) {
        entropy = IEntropyV2(entropyContract);
    }

    /**
     * @notice Request a new shuffled deck. Anyone can call by paying the fee.
     * @return seq The Entropy sequence number of this request.
     */
    function requestShuffle() external payable returns (uint64 seq) {
        uint256 fee = entropy.getFeeV2();
        require(msg.value >= fee, "fee too low");
        seq = entropy.requestV2{value: fee}();
        emit ShuffleRequested(seq);
    }

    /**
     * Entropy callback – generates the deck deterministically from `randomNumber`.
     * MUST NOT revert.
     */
    function entropyCallback(
        uint64 sequenceNumber,
        address /*provider*/,
        bytes32 randomNumber
    ) internal override {
        bytes memory deck = _shuffle(randomNumber);
        packedDeckBySeq[sequenceNumber] = deck;
        emit Shuffled(sequenceNumber, deck);
    }

    /**
     * @return Address of the Entropy core contract (required by IEntropyConsumer)
     */
    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }

    /**
     * @notice Helper to fetch current shuffle fee.
     */
    function getShuffleFee() external view returns (uint256) {
        return entropy.getFeeV2();
    }

    // =============================================================
    //                         INTERNAL
    // =============================================================

    /**
     * @dev Deterministically shuffle a 52-card deck using Fisher-Yates with keccak256.
     *      The deck is packed into 52 bytes where each byte is an index 0-51.
     */
    function _shuffle(bytes32 seed) internal pure returns (bytes memory packed) {
        uint8[52] memory deck;
        // initialise
        for (uint8 i = 0; i < 52; i++) deck[i] = i;

        uint256 s = uint256(seed);
        for (uint8 i = 51; i > 0; i--) {
            // derive new pseudo-random number from (seed, i)
            s = uint256(keccak256(abi.encodePacked(s, i)));
            uint8 j = uint8(s % (i + 1));
            // swap deck[i] and deck[j]
            uint8 temp = deck[i];
            deck[i] = deck[j];
            deck[j] = temp;
        }

        // pack into bytes
        packed = new bytes(52);
        for (uint8 k = 0; k < 52; k++) {
            packed[k] = bytes1(deck[k]);
        }
    }

    /// Accept ETH (dealer can pre-fund contract for future fees if desired)
    receive() external payable {}
}
