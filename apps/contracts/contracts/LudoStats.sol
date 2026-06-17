// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title  LudoStats — Permanent on-chain record of every game result.
/// @notice Pure event emission, zero state storage. Gas ≈ 30k per call.
///         mode: 0 = vs Computer, 1 = vs Player
contract LudoStats {
    event ResultRecorded(
        address indexed player,
        bool    indexed won,
        uint8           mode,
        uint32          durationSecs,
        uint256         stakeAmount,  // cUSD wei (18 decimals); 0 for free games
        uint256         timestamp     // block.timestamp
    );

    function recordResult(
        bool    won,
        uint8   mode,
        uint32  durationSecs,
        uint256 stakeAmount
    ) external {
        emit ResultRecorded(
            msg.sender,
            won,
            mode,
            durationSecs,
            stakeAmount,
            block.timestamp
        );
    }
}
