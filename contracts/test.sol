// SPDX-License-Identifier: MIT
// deposit and withdraw money for l1 testnet:sepolia
pragma solidity ^0.8.0;


contract AdventureLayerTransfer {
    address public immutable owner;
    event FundsReceived(address indexed sender, uint256 amount);
    constructor(){
        owner = msg.sender;
    }
    //deposit
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
    //withdraw
    function withraw(address payable  _to, uint256 amount) external   {
        require(msg.sender == owner, "not owner address")
        //TODO
        _to.transfer(amount)
    }
}
