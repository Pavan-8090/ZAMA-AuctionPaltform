// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IFHEVM
 * @notice Interface for FHEVM operations
 */
interface IFHEVM {
    // FHE types
    type euint32 is bytes32;
    type euint64 is bytes32;
    
    // Re-encryption functions would be called via precompiles
    // This interface represents the expected FHE operations
}

