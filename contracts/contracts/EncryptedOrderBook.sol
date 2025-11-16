// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title EncryptedOrderBook
 * @notice Stores minimal encrypted order metadata for querying and cancellation.
 * @dev No plaintext amounts are stored. Only ciphertext pointers and metadata bytes.
 */
contract EncryptedOrderBook is Ownable, AccessControl, Pausable {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    enum OrderStatus {
        None,
        Submitted,
        Cancelled,
        Executed
    }

    struct Order {
        address submitter;
        address tokenIn;
        address tokenOut;
        bytes ciphertext; // opaque
        bytes metadata;   // opaque (e.g., client version, hints)
        uint64 submittedAt;
        uint64 updatedAt;
        OrderStatus status;
        uint256 nonce;
    }

    // orderId => order
    mapping(uint256 => Order) private orders;
    uint256 public nextOrderId;

    event OrderStored(uint256 indexed orderId, address indexed submitter, address indexed tokenIn, address tokenOut);
    event OrderStatusUpdated(uint256 indexed orderId, OrderStatus status);

    constructor(address admin) {
        _transferOwnership(admin);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function storeOrder(
        address submitter,
        address tokenIn,
        address tokenOut,
        bytes calldata ciphertext,
        bytes calldata metadata,
        uint256 nonce
    ) external whenNotPaused onlyRole(RELAYER_ROLE) returns (uint256 orderId) {
        require(submitter != address(0), "submitter");
        orderId = ++nextOrderId;
        orders[orderId] = Order({
            submitter: submitter,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            ciphertext: ciphertext,
            metadata: metadata,
            submittedAt: uint64(block.timestamp),
            updatedAt: uint64(block.timestamp),
            status: OrderStatus.Submitted,
            nonce: nonce
        });
        emit OrderStored(orderId, submitter, tokenIn, tokenOut);
        emit OrderStatusUpdated(orderId, OrderStatus.Submitted);
    }

    function markCancelled(uint256 orderId) external whenNotPaused onlyRole(RELAYER_ROLE) {
        Order storage o = orders[orderId];
        require(o.status == OrderStatus.Submitted, "not submitted");
        o.status = OrderStatus.Cancelled;
        o.updatedAt = uint64(block.timestamp);
        emit OrderStatusUpdated(orderId, OrderStatus.Cancelled);
    }

    function markExecuted(uint256 orderId) external whenNotPaused onlyRole(RELAYER_ROLE) {
        Order storage o = orders[orderId];
        require(o.status == OrderStatus.Submitted, "not submitted");
        o.status = OrderStatus.Executed;
        o.updatedAt = uint64(block.timestamp);
        emit OrderStatusUpdated(orderId, OrderStatus.Executed);
    }

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}

