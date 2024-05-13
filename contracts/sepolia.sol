// SPDX-License-Identifier: MIT
// deposit and withdraw money for l1 testnet:sepolia
pragma solidity ^0.8.0;


contract AdventureLayerTransfer {
    address public owner;
    //mapping(address => uint256) public balances;

    event FundsReceived(address indexed sender, uint256 amount);
    event FundsSend(address indexed sender, uint256 amount);

    constructor(){
        owner = msg.sender;

    }
    //deposit: transfer money from sender to owner
    function deposit(uint256 amount)  public payable {
        require(msg.sender.balance >= amount, "no enough balance");
        
        payable(owner).transfer(msg.value);
        emit FundsReceived(msg.sender, amount);
    }
    //withdraw：transfer money from owner to target adderss
    function withraw(address payable _to, uint256 amount)  public payable {
        require(msg.sender == owner, "not owner address");
        require(msg.sender.balance >= amount, "no enough balance");
       
        _to.transfer(amount);
        emit FundsSend(_to, amount);

    }
    function getBalance(address account) public view returns(uint256) {
        return account.balance;
    }
}
