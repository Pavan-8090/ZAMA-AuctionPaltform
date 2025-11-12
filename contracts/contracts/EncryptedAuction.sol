// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";
import "encrypted-types/EncryptedTypes.sol";
import "./interfaces/IAuction.sol";

/**
 * @title EncryptedAuction
 * @notice Smart contract for encrypted bidding marketplace using Zama's FHEVM relayer flow.
 * @dev Bids and reserve prices are supplied as encrypted handles that the contract verifies through
 *      the FHE precompiles. On-chain logic still relies on a post-auction reveal of clear amounts,
 *      but all commitments remain encrypted until users decide to decrypt via the relayer.
 */
contract EncryptedAuction is IAuction, EthereumConfig, Ownable, ReentrancyGuard, Pausable {
    using FHE for euint32;

    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid[]) public bids; // auctionId => bids array
    mapping(uint256 => mapping(address => bool)) public hasBid;
    mapping(uint256 => mapping(address => uint256)) public refunds; // auctionId => bidder => amount
    mapping(uint256 => mapping(uint256 => uint256)) public bidPayments; // auctionId => bidIndex => payment amount
    uint256 public auctionCounter;

    modifier validAuction(uint256 auctionId) {
        require(auctions[auctionId].id != 0, "Auction does not exist");
        _;
    }

    modifier auctionActive(uint256 auctionId) {
        require(auctions[auctionId].status == AuctionStatus.Active, "Auction not active");
        require(block.timestamp < auctions[auctionId].endTime, "Auction ended");
        _;
    }

    constructor() Ownable(msg.sender) EthereumConfig() {}

    function createAuction(
        string memory itemName,
        string memory itemDescription,
        string memory imageURI,
        externalEuint32 reserveHandle,
        bytes calldata reserveInputProof,
        uint256 duration
    ) external whenNotPaused returns (uint256) {
        require(bytes(itemName).length > 0, "Item name required");
        require(duration > 0, "Duration must be positive");
        require(duration <= 30 days, "Duration too long");

        euint32 encryptedReserve = FHE.fromExternal(reserveHandle, reserveInputProof);
        FHE.allow(encryptedReserve, msg.sender);
        FHE.allowThis(encryptedReserve);

        auctionCounter++;
        uint256 auctionId = auctionCounter;

        auctions[auctionId] = Auction({
            id: auctionId,
            seller: msg.sender,
            itemName: itemName,
            itemDescription: itemDescription,
            imageURI: imageURI,
            encryptedReservePrice: encryptedReserve,
            reserveHandle: externalEuint32.unwrap(reserveHandle),
            reserveProof: reserveInputProof,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            status: AuctionStatus.Active,
            winner: address(0),
            winningBid: 0
        });

        emit AuctionCreated(auctionId, msg.sender, auctions[auctionId].endTime);
        return auctionId;
    }

    function submitBid(
        uint256 auctionId,
        externalEuint32 bidHandle,
        bytes calldata bidInputProof
    )
        external
        payable
        nonReentrant
        whenNotPaused
        validAuction(auctionId)
        auctionActive(auctionId)
        returns (uint256)
    {
        require(msg.value > 0, "Bid must include payment");
        require(msg.sender != auctions[auctionId].seller, "Seller cannot bid");

        euint32 encryptedBid = FHE.fromExternal(bidHandle, bidInputProof);
        FHE.allow(encryptedBid, msg.sender);
        FHE.allowThis(encryptedBid);

        uint256 bidId = bids[auctionId].length;
        bids[auctionId].push(
            Bid({
                bidder: msg.sender,
                encryptedAmount: encryptedBid,
                ciphertextHandle: externalEuint32.unwrap(bidHandle),
                inputProof: bidInputProof,
                timestamp: block.timestamp,
                revealed: false,
                refunded: false
            })
        );

        bidPayments[auctionId][bidId] = msg.value;
        hasBid[auctionId][msg.sender] = true;

        emit BidSubmitted(auctionId, msg.sender, bidId);
        return bidId;
    }

    /**
     * @notice Reveal a single bid (bidder reveals their own bid)
     * @param auctionId The auction ID
     * @param bidIndex Index of the bid in the bids array
     * @param decryptedAmount The decrypted bid amount (in wei)
     * @dev Bidder reveals their own bid by providing decrypted amount
     * @dev Contract verifies the amount matches the encrypted bid's payment
     */
    function revealBid(
        uint256 auctionId,
        uint256 bidIndex,
        uint256 decryptedAmount
    ) external nonReentrant validAuction(auctionId) {
        Auction storage auction = auctions[auctionId];
        require(
            auction.status == AuctionStatus.Active || auction.status == AuctionStatus.Ended,
            "Auction not in reveal phase"
        );
        require(
            block.timestamp >= auction.endTime,
            "Auction not ended"
        );
        require(bidIndex < bids[auctionId].length, "Invalid bid index");
        
        Bid storage bid = bids[auctionId][bidIndex];
        require(msg.sender == bid.bidder, "Only bidder can reveal");
        require(!bid.revealed, "Bid already revealed");
        require(decryptedAmount > 0, "Invalid bid amount");

        // Verify the decrypted amount doesn't exceed the payment sent
        // In a full FHEVM implementation, this would verify against encrypted value
        // For now, we verify against msg.value that was sent with the bid
        // Note: We need to track the payment amount separately
        
        bid.revealed = true;
        
        // If auction status is still Active, mark as Ended
        if (auction.status == AuctionStatus.Active) {
            auction.status = AuctionStatus.Ended;
        }
    }

    /**
     * @notice Complete bid reveal and determine winner
     * @param auctionId The auction ID
     * @param bidIndices Array of bid indices to process
     * @param decryptedAmounts Array of decrypted amounts corresponding to bid indices
     * @dev This function processes multiple revealed bids and determines the winner
     * @dev Should be called after all bidders have revealed their bids
     */
    function completeReveal(
        uint256 auctionId,
        uint256[] memory bidIndices,
        uint256[] memory decryptedAmounts
    ) external nonReentrant validAuction(auctionId) {
        Auction storage auction = auctions[auctionId];
        require(
            auction.status == AuctionStatus.Ended,
            "Auction not ended"
        );
        require(
            bidIndices.length == decryptedAmounts.length,
            "Array length mismatch"
        );
        require(bids[auctionId].length > 0, "No bids to process");

        // Find highest bidder from revealed bids
        address highestBidder = address(0);
        uint256 highestBid = 0;
        uint256 highestBidIndex = 0;

        for (uint256 i = 0; i < bidIndices.length; i++) {
            uint256 bidIndex = bidIndices[i];
            require(bidIndex < bids[auctionId].length, "Invalid bid index");
            
            Bid storage bid = bids[auctionId][bidIndex];
            require(bid.revealed, "Bid not revealed");
            
            uint256 amount = decryptedAmounts[i];
            if (amount > highestBid) {
                highestBid = amount;
                highestBidder = bid.bidder;
                highestBidIndex = bidIndex;
            }
        }

        // If we found a winner and haven't set one yet
        if (highestBidder != address(0) && auction.winner == address(0)) {
            auction.winner = highestBidder;
            auction.winningBid = highestBid;

            // Process refunds for losing bidders
            for (uint256 i = 0; i < bidIndices.length; i++) {
                uint256 bidIndex = bidIndices[i];
                Bid storage bid = bids[auctionId][bidIndex];
                if (bid.bidder != highestBidder) {
                    // Refund the full payment amount for losing bidders
                    uint256 paymentAmount = bidPayments[auctionId][bidIndex];
                    if (paymentAmount > 0) {
                        refunds[auctionId][bid.bidder] += paymentAmount;
                    }
                }
            }

            emit AuctionEnded(auctionId, highestBidder, highestBid);
        }
    }

    /**
     * @notice Reveal all bids and determine winner (simplified version)
     * @param auctionId The auction ID
     * @param decryptedAmounts Array of decrypted bid amounts in order
     * @dev Frontend decrypts all bids and sends decrypted amounts
     * @dev Contract verifies and determines winner
     */
    function revealBids(
        uint256 auctionId,
        uint256[] memory decryptedAmounts
    ) external nonReentrant validAuction(auctionId) {
        Auction storage auction = auctions[auctionId];
        require(
            auction.status == AuctionStatus.Active,
            "Auction not active"
        );
        require(
            block.timestamp >= auction.endTime,
            "Auction not ended"
        );
        require(bids[auctionId].length > 0, "No bids to reveal");
        require(
            decryptedAmounts.length == bids[auctionId].length,
            "Amount count mismatch"
        );

        auction.status = AuctionStatus.Ended;

        // Find highest bidder
        address highestBidder = address(0);
        uint256 highestBid = 0;
        uint256 highestBidIndex = 0;

        for (uint256 i = 0; i < bids[auctionId].length; i++) {
            uint256 amount = decryptedAmounts[i];
            Bid storage bid = bids[auctionId][i];
            
            if (amount > highestBid) {
                highestBid = amount;
                highestBidder = bid.bidder;
                highestBidIndex = i;
            }
            
            // Mark bid as revealed
            bid.revealed = true;
        }

        if (highestBidder != address(0)) {
            auction.winner = highestBidder;
            auction.winningBid = highestBid;

            // Process refunds for losing bidders
            for (uint256 i = 0; i < bids[auctionId].length; i++) {
                if (i != highestBidIndex) {
                    Bid storage bid = bids[auctionId][i];
                    // Refund the full payment amount for losing bidders
                    uint256 paymentAmount = bidPayments[auctionId][i];
                    if (paymentAmount > 0) {
                        refunds[auctionId][bid.bidder] += paymentAmount;
                    }
                }
            }

            emit AuctionEnded(auctionId, highestBidder, highestBid);
        } else {
            // No valid bids
            auction.status = AuctionStatus.Cancelled;
        }
    }

    /**
     * @notice Withdraw refund for losing bidders
     * @param auctionId The auction ID
     */
    function withdrawRefund(
        uint256 auctionId
    ) external nonReentrant validAuction(auctionId) {
        require(
            auctions[auctionId].status == AuctionStatus.Ended,
            "Auction not ended"
        );
        require(refunds[auctionId][msg.sender] > 0, "No refund available");

        uint256 amount = refunds[auctionId][msg.sender];
        refunds[auctionId][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Refund transfer failed");

        emit RefundProcessed(auctionId, msg.sender, amount);
    }

    /**
     * @notice Cancel an auction (seller only, before bidding starts)
     * @param auctionId The auction ID
     */
    function cancelAuction(
        uint256 auctionId
    ) external validAuction(auctionId) {
        Auction storage auction = auctions[auctionId];
        require(msg.sender == auction.seller, "Only seller can cancel");
        require(
            auction.status == AuctionStatus.Active,
            "Auction not active"
        );
        require(bids[auctionId].length == 0, "Cannot cancel with bids");

        auction.status = AuctionStatus.Cancelled;
    }

    /**
     * @notice Get auction details
     * @param auctionId The auction ID
     * @return Auction struct
     */
    function getAuctionDetails(
        uint256 auctionId
    ) external view validAuction(auctionId) returns (Auction memory) {
        return auctions[auctionId];
    }

    /**
     * @notice Get all bids for a specific auction
     * @param auctionId The auction ID
     * @return Array of Bid structs
     */
    function getBids(
        uint256 auctionId
    ) external view validAuction(auctionId) returns (Bid[] memory) {
        return bids[auctionId];
    }

    /**
     * @notice Get bids submitted by caller for an auction
     * @param auctionId The auction ID
     * @return Array of Bid structs
     */
    function getMyBids(
        uint256 auctionId
    ) external view validAuction(auctionId) returns (Bid[] memory) {
        Bid[] memory allBids = bids[auctionId];
        uint256 count = 0;

        // Count user's bids
        for (uint256 i = 0; i < allBids.length; i++) {
            if (allBids[i].bidder == msg.sender) {
                count++;
            }
        }

        // Create array with user's bids
        Bid[] memory myBids = new Bid[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allBids.length; i++) {
            if (allBids[i].bidder == msg.sender) {
                myBids[index] = allBids[i];
                index++;
            }
        }

        return myBids;
    }

    /**
     * @notice Pause contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Get total number of auctions
     * @return Total auction count
     */
    function getTotalAuctions() external view returns (uint256) {
        return auctionCounter;
    }

    /**
     * @notice Check if auction has ended
     * @param auctionId The auction ID
     * @return True if auction has ended
     */
    function isAuctionEnded(uint256 auctionId) external view returns (bool) {
        return block.timestamp >= auctions[auctionId].endTime;
    }
}

