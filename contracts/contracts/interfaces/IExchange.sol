// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IExchange
 * @notice Minimal interface for a Uniswap-like DEX adapter. This is intentionally narrow
 *         to keep router code decoupled from specific DEX implementations.
 * @dev Production systems should use dedicated adapters per DEX and robust slippage controls.
 */
interface IExchange {
    /**
     * @notice Swap exact tokens for tokens, supporting fee-on-transfer tokens.
     * @dev The adapter should pull `amountIn` from the caller (router) and send `amountOut` to `to`.
     * @param tokenIn Input ERC20 token address
     * @param tokenOut Output ERC20 token address
     * @param amountIn Exact amount of tokenIn to swap
     * @param minAmountOut Minimum acceptable amount of tokenOut
     * @param to Recipient of tokenOut
     * @return amountOut The amount of tokenOut actually received
     */
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address to
    ) external returns (uint256 amountOut);
}

