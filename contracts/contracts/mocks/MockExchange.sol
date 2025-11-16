// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IExchange} from "../interfaces/IExchange.sol";

/**
 * @title MockExchange
 * @notice Simple mock adapter that sends tokenIn back as tokenOut 1:1 for testing.
 *         In real deployments, use per-DEX adapters that route to Uniswap/other AMMs.
 */
contract MockExchange is IExchange {
    using SafeERC20 for IERC20;

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address to
    ) external override returns (uint256 amountOut) {
        // For tests, treat tokenIn==tokenOut and simply send amountIn
        require(tokenIn == tokenOut, "mock expects same token");
        IERC20(tokenIn).transferFrom(msg.sender, to, amountIn);
        require(amountIn >= minAmountOut, "slippage");
        return amountIn;
    }
}

