// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "encrypted-types/EncryptedTypes.sol";

/**
 * @title IAuction
 * @notice Interface for Encrypted Auction contract
 */
interface IAuction {
    struct Auction {
        uint256 id;
        address seller;
        string itemName;
        string itemDescription;
        string imageURI;
        euint32 encryptedReservePrice;
        bytes32 reserveHandle;
        bytes reserveProof;
        uint256 startTime;
        uint256 endTime;
        AuctionStatus status;
        address winner;
        uint256 winningBid;
    }

    struct Bid {
        address bidder;
        euint32 encryptedAmount;
        bytes32 ciphertextHandle;
        bytes inputProof;
        uint256 timestamp;
        bool revealed;
        bool refunded;
    }

    enum AuctionStatus {
        Active,
        Ended,
        Cancelled
    }

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        uint256 endTime
    );

    event BidSubmitted(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 bidId
    );

    event AuctionEnded(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 winningBid
    );

    event RefundProcessed(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    function createAuction(
        string memory itemName,
        string memory itemDescription,
        string memory imageURI,
        externalEuint32 reserveHandle,
        bytes calldata reserveInputProof,
        uint256 duration
    ) external returns (uint256);

    function submitBid(
        uint256 auctionId,
        externalEuint32 bidHandle,
        bytes calldata bidInputProof
    ) external payable returns (uint256);

    function revealBids(uint256 auctionId, uint256[] memory decryptedAmounts) external;

    function withdrawRefund(uint256 auctionId) external;

    function cancelAuction(uint256 auctionId) external;

    function getAuctionDetails(
        uint256 auctionId
    ) external view returns (Auction memory);

    function getMyBids(uint256 auctionId) external view returns (Bid[] memory);
}

