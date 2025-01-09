// SPDX-License-Identifier: MIT
// deposit and withdraw money for l1 testnet:sepolia
pragma solidity ^0.8.0;


contract AdventureLayerSepoliaTransfer {
    address public owner;

    event Deposit(address indexed sender, uint256 amount);
    event Withdrawal(address indexed recipient, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {
        //require(recipient != address(0), "Invalid recipient address");
        //recipient.transfer(amount);
        payable(owner).transfer(msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(address payable recipient, uint256 amount) external {
        require(msg.sender == owner, "Only owner can withdraw");
        recipient.transfer(amount);
        emit Withdrawal(recipient, amount);
    }
    function getBalance(address account) public view returns(uint256) {
        return account.balance;
    }
}
