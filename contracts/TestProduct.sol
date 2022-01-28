pragma solidity ^0.4.24;

contract TestProduct {

    string public name;
    
    function setName(string memory _name) public {
        name = _name;
        return;
    }
    
}