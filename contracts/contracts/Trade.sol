// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./MyERC20.sol";
contract Trade is ERC20 {
    MyERC20 public token1;

    uint256 public reserve0;
    uint256 public reserve1;

    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1);

    constructor(address _token1) ERC20("SimpleSwap", "SS") {
        // eth
        token1 = MyERC20(_token1);  // myerc20
    }

    function min(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x < y ? x : y;
    }

    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function addLiquidity(uint256 amount1Desired) public payable returns(uint256 liquidity){
        uint256 amount0Desired = msg.value;
        token1.transferFrom(msg.sender, address(this), amount1Desired);
        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            liquidity = sqrt(amount0Desired * amount1Desired);
        } else {
            liquidity = min(amount0Desired * _totalSupply / reserve0, amount1Desired * _totalSupply /reserve1);
        }
        require(liquidity > 0, 'INSUFFICIENT_LIQUIDITY_MINTED');
        reserve0 += amount0Desired;
        reserve1 += amount1Desired;
        _mint(msg.sender, liquidity);
        emit Mint(msg.sender, amount0Desired, amount1Desired);
    }


    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256 amountOut) {
        require(amountIn > 0, 'INSUFFICIENT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'INSUFFICIENT_LIQUIDITY');
        amountOut = amountIn * reserveOut / (reserveIn + amountIn);
    }

    function eTHToErc20Amount(uint256 amountIn) public view returns (uint256 amountOut){
        amountOut = getAmountOut(amountIn, reserve0, reserve1);
    }

    function erc20ToETHAmount(uint256 amountIn) public view returns (uint256 amountOut){
        amountOut = getAmountOut(amountIn, reserve1, reserve0);
    }

    function ChangeETHtoErc20() external payable returns (uint256 amountOut){
        uint256 amountIn = msg.value;
        amountOut = eTHToErc20Amount(amountIn);
        token1.transfer(msg.sender, amountOut);
        reserve0 += amountIn;
        reserve1 -= amountOut;
    }

    function ChangeErc20toETH(uint256 amountIn) external returns (uint256 amountOut){
        amountOut = erc20ToETHAmount(amountIn);
        address payable to = payable(msg.sender);
        to.transfer(amountOut);
        require(token1.balanceOf(msg.sender) >= amountIn, 'INSUFFICIENT_BALANCE');
        token1.transferFrom(msg.sender, address(this), amountIn);
        reserve0 -= amountOut;
        reserve1 += amountIn;
    }
}