//SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

//interface are a way to represent other things in the other contract and to save gas
interface ICryptoDevs {
  
    // this function takes the index and checks that the total balance of the owner
    // it also takes the address of the owner and the index, and return the token Id at that index
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId);
    
    // this function checks the number of tokens in the owner's account
    function balanceOf(address owner) external view returns (uint256 balance);

}
// we check the balance of the owner
//we check if the user has already minted tokens for a given token Id
// we check if the token id gicen has already being used for minting tokens
// we check if the address has any token