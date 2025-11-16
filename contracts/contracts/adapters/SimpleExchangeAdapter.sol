// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IExchange} from "../interfaces/IExchange.sol";

/**
 * @title SimpleExchangeAdapter
 * @notice Minimal adapter example that transfers tokenIn to `to` 1:1 when tokenIn==tokenOut.
 * @dev This is a production-style adapter skeleton; integrate real DEX logic here.
 */
contract SimpleExchangeAdapter is IExchange {
    using SafeERC20 for IERC20;

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address to
    ) external override returns (uint256 amountOut) {
        require(tokenIn == tokenOut, "adapter: route not implemented");
        IERC20(tokenIn).transferFrom(msg.sender, to, amountIn);
        require(amountIn >= minAmountOut, "adapter: slippage");
        return amountIn;
    }
}

