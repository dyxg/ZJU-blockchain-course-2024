// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyERC20 is ERC20 {
    address manager; 
    constructor () ERC20("zju01", "ZJU"){
        manager = msg.sender;
        _mint(msg.sender, 5 * 10**19);
    }

    modifier onlyManager() {
        require(msg.sender == manager, "Not the owner");
        _;
    }

    function mint(address receiver, uint256 amount) external onlyManager {
        _mint(receiver, amount);
    }

    function burn(address receiver, uint256 amount) external onlyManager {
        _burn(receiver, amount);
    }

    function getBalance() external view returns (uint256) {
        return balanceOf(msg.sender);
    }

}
