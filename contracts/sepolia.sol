// SPDX-License-Identifier: MIT
// deposit and withdraw money for l1 testnet:sepolia
pragma solidity ^0.8.0;


contract AdventureLayerTransfer {
    address public immutable owner;
    mapping(address => uint256) public balances;

    event FundsReceived(address indexed sender, uint256 amount);
    event FundsSend(address indexed sender, uint256 amount);

    constructor(){
        owner = msg.sender;
        balances[owner] = owner.balance;
    }
    //deposit: transfer money from sender to owner
    function deposit()  public payable {
        require(msg.sender.balance >= msg.value, "no enough balance");
        balances[msg.sender] = msg.sender.balance;
        balances[msg.sender] -= msg.value;
        balances[owner] += msg.value;

        emit FundsReceived(msg.sender, msg.value);
    }
    //withdraw：transfer money from owner to target adderss
    function withraw(address payable _to, uint256 amount)  public payable {
        require(msg.sender == owner, "not owner address");
        require(msg.sender.balance >= amount, "no enough balance");
       
        balances[_to] = _to.balance + amount;
        balances[owner] -= amount;
        emit FundsSend(_to, amount);

    }
    function getBalance(address account) public view returns(uint256) {
        return balances[account];
    }
}
