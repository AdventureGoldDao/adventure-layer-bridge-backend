// SPDX-License-Identifier: MIT
// deposit and withdraw money for l1 testnet:sepolia
pragma solidity ^0.8.0;


contract AdventureLayerTransfer {
    address public immutable owner;
    event FundsReceived(address indexed sender, uint256 amount);
    event FundsSend(address indexed sender, uint256 amount);
    constructor(){
        owner = msg.sender;
    }
    // //deposit
    // receive() external payable {
    //     //msg.sender.transfer(msg.value);
    //     emit FundsReceived(msg.sender, msg.value);
    // }
    //deposit: transfer money from sender to owner
    function deposit()  public payable {
        require(msg.sender.balance >= msg.value, "no enough balance");
        //owner.transfer(msg.value)

        emit FundsReceived(msg.sender, msg.value);
    }
    //withdraw
    function withraw(address payable  _to, uint256 amount) external   {
        require(msg.sender == owner, "not owner address");
        _to.transfer(amount);
        emit FundsSend(_to, amount);
    }

    //get balance
    function get_balance(address account) public view returns(uint256) {
        return account.balance;
    }
}
