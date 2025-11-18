// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import {IExchange} from "./interfaces/IExchange.sol";

/**
 * @title WhaleSafeRouter
 * @notice Privacy-first DEX router that accepts encrypted orders. Only public outcome is emitted.
 * @dev This contract stores minimal metadata and delegates storage to a separate order book if desired.
 *      It supports cancellation via EIP-712 signatures and uses roles for relayer execution.
 */
contract WhaleSafeRouter is Ownable, AccessControl, Pausable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;
    using MessageHashUtils for bytes32;

    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 private constant CANCEL_TYPEHASH =
        keccak256("CancelOrder(address submitter,uint256 orderId,uint256 nonce,uint256 deadline)");

    struct EncryptedOrder {
        address submitter;
        address tokenIn;
        address tokenOut;
        bytes ciphertext;
        bytes metadata;
        uint64 submittedAt;
        uint8 status; // 1=submitted,2=cancelled,3=executed
        uint256 nonce;
    }

    mapping(uint256 => EncryptedOrder) private orders;
    mapping(address => uint256) public nonces; // per-user nonce for replay protection
    uint256 public nextOrderId;

    IExchange public exchange;
    address public feeRecipient;
    uint16 public feeBps; // optional relayer fee on amountIn, capped by owner
    uint16 public constant MAX_FEE_BPS = 100; // 1%

    event EncryptedOrderSubmitted(uint256 indexed orderId, address indexed submitter, address indexed tokenIn, address tokenOut);
    event SwapExecuted(uint256 indexed orderId, address indexed tokenIn, address indexed tokenOut, uint256 publicAmountOut, uint256 publicPrice);
    event OrderCancelled(uint256 indexed orderId, address indexed submitter);
    event ExchangeUpdated(address indexed exchange);
    event FeeParamsUpdated(address indexed recipient, uint16 feeBps);

    constructor(address admin, IExchange _exchange)
        Ownable(admin)
        EIP712("WhaleSafeRouter", "1")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(RELAYER_ROLE, admin);
        exchange = _exchange;
        emit ExchangeUpdated(address(_exchange));
    }

    /**
     * @notice Submits an encrypted order. No plaintext amounts are stored.
     * @dev `metadata` may contain client hints; never store plaintext sensitive data.
     */
    function submitEncryptedOrder(
        address tokenIn,
        address tokenOut,
        bytes calldata ciphertext,
        bytes calldata metadata
    ) external whenNotPaused nonReentrant returns (uint256 orderId) {
        require(tokenIn != address(0) && tokenOut != address(0), "tokens");
        require(ciphertext.length > 0, "ciphertext");

        uint256 userNonce = ++nonces[msg.sender];
        orderId = ++nextOrderId;
        orders[orderId] = EncryptedOrder({
            submitter: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            ciphertext: ciphertext,
            metadata: metadata,
            submittedAt: uint64(block.timestamp),
            status: 1,
            nonce: userNonce
        });

        emit EncryptedOrderSubmitted(orderId, msg.sender, tokenIn, tokenOut);
    }

    /**
     * @notice Relayer executes an encrypted swap after off-chain FHE evaluation.
     * @dev `fheResultBlob` is opaque; only public outputs are emitted.
     *      The relayer must have already handled token approvals, etc.
     *
     * Security: Only RELAYER_ROLE can execute; order must be in submitted state.
     */
    function executeEncryptedSwap(
        uint256 orderId,
        bytes calldata fheResultBlob,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 publicAmountOut,
        uint256 publicPrice
    ) external whenNotPaused nonReentrant onlyRole(RELAYER_ROLE) {
        EncryptedOrder storage o = orders[orderId];
        require(o.status == 1, "bad status");
        require(o.submitter != address(0), "no order");
        // Silence unused variable in mock mode
        fheResultBlob;

        // Pull tokens from user to router (user must have approved router)
        if (feeBps > 0 && feeRecipient != address(0)) {
            uint256 fee = (amountIn * feeBps) / 10_000;
            uint256 amountAfterFee = amountIn - fee;
            IERC20(o.tokenIn).safeTransferFrom(o.submitter, feeRecipient, fee);
            IERC20(o.tokenIn).safeTransferFrom(o.submitter, address(this), amountAfterFee);
        } else {
            IERC20(o.tokenIn).safeTransferFrom(o.submitter, address(this), amountIn);
        }

        // Approve and execute on exchange adapter
        IERC20(o.tokenIn).forceApprove(address(exchange), amountIn);
        uint256 out = exchange.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            o.tokenIn, o.tokenOut, amountIn, minAmountOut, o.submitter
        );
        require(out >= minAmountOut, "slippage");

        o.status = 3;
        emit SwapExecuted(orderId, o.tokenIn, o.tokenOut, publicAmountOut, publicPrice);
    }

    /**
     * @notice EIP-712 signed cancellation by order submitter.
     * @dev Prevents execution if signature is valid and order is still submitted.
     */
    function cancelOrder(
        uint256 orderId,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external whenNotPaused {
        EncryptedOrder storage o = orders[orderId];
        require(o.status == 1, "not active");
        require(block.timestamp <= deadline, "expired");
        require(nonce == o.nonce, "nonce mismatch");

        bytes32 structHash = keccak256(abi.encode(
            CANCEL_TYPEHASH,
            o.submitter,
            orderId,
            nonce,
            deadline
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        require(signer == o.submitter, "unauthorized");

        o.status = 2;
        emit OrderCancelled(orderId, o.submitter);
    }

    function getOrder(uint256 orderId) external view returns (EncryptedOrder memory) {
        return orders[orderId];
    }

    // Admin controls
    function setExchange(IExchange _exchange) external onlyOwner {
        exchange = _exchange;
        emit ExchangeUpdated(address(_exchange));
    }

    function setFeeParams(address recipient, uint16 _feeBps) external onlyOwner {
        require(_feeBps <= MAX_FEE_BPS, "fee too high");
        feeRecipient = recipient;
        feeBps = _feeBps;
        emit FeeParamsUpdated(recipient, _feeBps);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}

