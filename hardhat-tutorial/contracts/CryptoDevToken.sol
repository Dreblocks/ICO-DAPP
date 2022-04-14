//SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable {
 // keep it a constant since we know that the value is not gonna change
    uint256 public constant tokenPrice  = 0.001 ether;
   
// max tokens supply for crypto devs tokens
    uint256 public constant maxTotalSupply = 10000 * 10**18;

// creation of an Crypto devs nft contract instance
// created a variable of type ICryptodevs
    ICryptoDevs CryptoDevsNFT;
     
// Each NFT would give the user 10 tokens
// It needs to be represented as 10 * (10 ** 18) as ERC20 tokens are represented by the smallest denomination possible for the token
// this is a representation of 1 in a form of a big number
    uint256 public constant tokensPerNFT = 10 * 10**18;

// keep track of which token id have a given address
// which token ids have already being claimed
// it makes sure that the user doesnt mint tokens again for the same nft
    mapping(uint256 => bool) public tokenIdsClaimed;

// we take the address of the cryptodev NFT contract(previously deployed) we need this address since we are going to need
//to call function from this contract
// we initialize the value that erc20 needs which is the name and the symbol
    constructor(address _cryptoDevsContract) ERC20("Crypto Dev Token", "CD") {
// we took the interface and we pass the address of the nft contract 
// this address let us know which nft contract we want to keep track of 
            CryptoDevsNFT = ICryptoDevs(_cryptoDevsContract);
    }

// this a for the general public who want mint tokens but dont have nfts
// amount is the number of token the user wants to  mint
//msg.value` should be equal or greater than the tokenPrice * amount
    function mint(uint256 amount) public payable {
// we want the amount that was send(requiredprice or ether value) to be equal to the tokenprice times the amount
        uint256 _requiredAmount = tokenPrice * amount;
        require(msg.value >= _requiredAmount, "Ether sent is not good");
             
// total tokens + amount <= 10000, otherwise revert the transaction
        uint256 amountWithDecimals = amount * 10**18;
        require(
            (totalSupply() + amountWithDecimals) <= maxTotalSupply,
            "Exceeds the max total supply availbale"
        );


        _mint(msg.sender, amountWithDecimals);

    }


// this function is going to used by our nft holders to claim a number of tokens 
//based on the number of nft held
// if a person has 1 nft then 10 token, 2 nft then 20 tokens
    
    function claim () public  {
// address that calls the function
        address sender = msg.sender;
// we check the balance of nfts that a given address have 
// so we can mint the number of tokens based on number of nfts and retrieve the balance
        uint256 balance = CryptoDevsNFT.balanceOf(sender);
        require(balance > 0, "You dont own any Crypto Dev NFT's");

// amount keeps track of number of unclaimed tokenIds
        uint256 amount = 0;

//at a given index of its token list
// we run a loop for each index in the array which is the maxium balance of nfts
// for each index we are looping and getting the token id
        for(uint256 i = 0; i < balance; i++) {
//// we run a loop  for 0 to the balance, and get the token id owned by the sender
            uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender, i);
// if tokenId hasnt been claimed, increase the amount 
// here we check if that token id has already been claimed
            if(!tokenIdsClaimed[tokenId]) {
                amount += 1;
                tokenIdsClaimed[tokenId] = true;

            }
        }
// after the for loop we check that amount is greater than 0
// if all the token ids have been claimed revert the transaction
        require(amount > 0, "You have already claimed all your tokens");
// if amount greater than zero we mint 
// amount is the number of nfts for which the tokens have not been  minted
// _mint function comes from the erc20 contract thta we inherited
//msg.sender is the user who called the claim function
// amount is the number of token ids for nfts for which token have not been claime and multiplied by 10
        _mint(msg.sender, amount * tokensPerNFT);

    }


//receiive ether when msg.data must be empty
    receive() external payable {}

//called when msg.data is not empty
    fallback() external payable {}

}