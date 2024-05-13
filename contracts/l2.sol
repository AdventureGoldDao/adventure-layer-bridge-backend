// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract L2Contract {
    address public owner;

    event Deposit(address indexed sender, uint256 amount, address indexed recipient);
    event Withdrawal(address indexed recipient, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function deposit(address payable recipient) external payable {
        require(recipient != address(0), "Invalid recipient address");
        recipient.transfer(msg.value);
        emit Deposit(msg.sender, msg.value, recipient);
    }

    function withdraw(address payable recipient, uint256 amount) external {
        require(msg.sender == owner, "Only owner can withdraw");
        recipient.transfer(amount);
        emit Withdrawal(recipient, amount);
    }
}
