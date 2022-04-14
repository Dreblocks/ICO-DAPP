import Head from 'next/head';
import Image from 'next/image';//might need to take it off
import styles from '../styles/Home.module.css';
import Web3Modal from "web3modal";
import React, { useEffect, useRef, useState} from "react";
import { BigNumber, utils, providers, Contract} from "ethers";
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS ,
} from "../constants";

export default function Home() {
  //create a big number 0
  const zero = BigNumber.from(0);
  // keeps track whenever the user wallet is connected or not 
  const [walletConnected, setWalletConnected] = useState(false);
  //loading set to true when we wait for the transaction to get mined
  const [loading, setLoading] = useState(false);
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  // the variable that the contract is going to return is going to be in form of a big number
  // tokensMinted is the total number of tokens that have been minted till now out of 10000(max total supply)
  const [tokensMinted, setTokensMinted] = useState(zero);
  // balanceOfCryptoDevTokens keeps track of number of Crypto Dev tokens owned by an address
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] =useState(zero);
  // this variable is the amount of token the user wants to mint
  const [tokenAmount, setTokenAmount] = useState(zero);
  // tokensToBeClaimed keeps track of the number of tokens that can be claimed
  // based on the Crypto Dev NFT's held by the user for which they havent claimed the tokens 
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  


// need signer to call transaction that change the state but not for the provider
  const getProviderOrSigner = async (needSigner = false) => {
    // current is going to connect to the current address the user is connected to
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Must connect to rinkeby network");
      throw new Error("incorrect network");
    }
// if the needsigner is necessary to do a state change
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return  web3Provider;
  };


  const connectWallet = async () => {
    try {
      // this will provide us the signer or provider in case if needed
      // this will call the func getproviderorsigner above us
      // Get the provider from web3Modal, which in our case is MetaMask
      await getProviderOrSigner();
      // set walletconnected to true since after the user is connected it should set to true
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };


// we call the nft contract because we need to determine 
// how many tokens the user can claim based on the number of nfts 
//checks the balance of tokens that can be claimed by the user
  const getTokensToBeClaimed = async () => {
     try {
       const provider = await getProviderOrSigner();
       const nftContract = new Contract(
         NFT_CONTRACT_ADDRESS,
         NFT_CONTRACT_ABI,
         provider
       );


       const tokenContract = new Contract(
         TOKEN_CONTRACT_ADDRESS,
         TOKEN_CONTRACT_ABI,
         provider
       );
       // we get the balance of the nfts because only based on them
       // we know how many tokens we have to give 
       // We will get the signer now to extract the address of the currently connected MetaMask account
       const signer = await getProviderOrSigner(true);
      // Get the address associated to the signer which is connected to  MetaMask
       const address = await signer.getAdrress();
      // call the balanceOf from the NFT contract to get the number of NFT's held by the user
       const balance = await nftContract.balanceOf(address);

// we have to run a loop for the number of nfts the address has
// we loop thru the balance
       if(balance === zero) {
         setTokensToBeClaimed(zero);
       } else {
// amount keeps track of the number of unclaimed tokens
         var amount = 0;
// for each balance, we pass the address of the owner and the index of the array
// return to us a tokenid at that given index
//tokenownerbyindex takes the address and index
// we also check if the tokens have been claimed for this token id
// if they havent been claimed you increase the amount otherwise you dont 
         for(var i = 0; i < balance; i++) {
           const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
           const claimed = await tokenContract.tokenIdsClaimed(tokenId);
           if(!claimed) {
             amount++;
//For all the NFT's, check if the tokens have already been claimed
// Only increase the amount if the tokens have not been claimed
// for a an NFT(for a given tokenId)
           }
         }
          //tokensToBeClaimed has been initialized to a Big Number, thus we would convert amount
        // to a big number and then set its value
         setTokensToBeClaimed(BigNumber.from(amount));
       }
     } catch (err) {
       console.error(err);
       setTokensToBeClaimed(zero);
     }
  };

// this function checks the balance of CDT held by an address
  const getBalanceOfCryptoDevTokens = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
//only a signer is associated with an address
     const signer = await getProviderOrSigner(true);
 // Get the address associated to the signer which is connected to  MetaMask
     const address = await signer.getAddress();
 // call the balanceOf from the token contract to get the number of tokens held by the user
      const balance = await tokenContract.balanceOf(address);
 // balance is already a big number, so we dont need to convert it before setting it
      setBalanceOfCryptoDevTokens(balance);
    } catch (err) {
      console.error(err);
      setBalanceOfCryptoDevTokens(zero);
    }
  };


  // Retrieves how many tokens have been minted till now
  //out of the total supply
   
  const getTotalTokensMinted = async () => {
    try {
      const provider = await getProviderOrSigner();

      const tokenContract = new Contract (
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      // Get all the tokens that have been minted
      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);
    } catch (err) {
      console.error(err);
    }
  };





  // this function is to mint crypto dev token to a given address
  const mintCryptoDevToken = async(amount) => {
    try {
      const signer = await getProviderOrSigner(true);

      const tokenContract = new Contract (
        TOKEN_CONTRACT_ADDRESS, 
        TOKEN_CONTRACT_ABI, 
        signer
        );
//we specify the value we have to send along with the amount
//JS is recognizing amount as number and not as a big number
        const value = 0.001*amount;
// this is the transaction we specify the amount of tokens we want to mint 
        const txn = await tokenContract.mint(amount, {
// we convert to a string since we want the big number and not the number
// parseEther takes the value into a string and convert it to a big number 
          value: utils.parseEther(value.toString()),
        });
// while we wait for the transaction we set the loading to true
        setLoading(true);
        await txn.wait;
        setLoading(false);
        window.alert("You have minted Crypto Dev Token");
// this get the total balance that the user have
        await getBalanceOfCryptoDevTokens();
// this is the total balance of the tokens minted in the world
        await getTotalTokensMinted();
        await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
    }

  };

  const claimCryptoDevTokens = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract (
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const txn = await tokenContract.claim();
      setLoading(true);
      await txn.wait();
      setLoading(false);
      window.alert("Your tokens have been claimed!");
      await getBalanceOfCryptoDevTokens();
// this is the total balance of the tokens minted in the world
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.log(err);
    }
  };

  const renderButton = () => {
    if(loading) {
      return (
      <div>
        <button className={styles.button}>Loading... </button>
      </div>
      );
    }

    if(tokensToBeClaimed > 0) {
      return(
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens 
             </button>
        </div>
      );
    }

    // we write a function for the user to be able to mint
    //we take the input of the user to know how many tokens they want to mint 
    //on change function get called anytime something change the value in the input field
    // e is whenever there is a changed event or whenever the user is changing value inside the input field
    //e target that value returns the value that the user has entered in the input field
    return (
    <div style={{display: "flex-col" }}> 
      <div>
        <input type="number" placeholder="Amount of Tokens" 
        onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))} />
        <button className={styles.button} 
        disabled={!(tokenAmount > 0)}
        onClick={() => mintCryptoDevToken(tokenAmount)}>
          Mint Tokens
        </button>
      </div>
      </div>
      );
  };

 
  //created a reference to web3modal so we can call functions on the web3 modal, 
  // this reference will remain as long as the user has opened the website
  // we connect our wallet using web3modal(library used to connect with metamask)
  useEffect(() => {
    if(!walletConnected) {
       // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disabledInjectedProvider: false,
      });
  // create a func to make the user connect to the wallet
  // only called when the wallet is not actually connected 
      connectWallet();
        getBalanceOfCryptoDevTokens();
// this is the total balance of the tokens minted in the world
        getTotalTokensMinted();
        getTokensToBeClaimed();
    }
  }, [walletConnected]);
  
return (
  <div> 
     <Head>
      <title> Crypto Devs ICO </title>
      <meta name="description" content="ICO-dApp" />
      <link rel="icon" href="./favicon.ico" />
    </Head>
    <div className={styles.main}>
      <div>
        <h1 className={styles.title}>
          Welcome to Crypto Devs ICO 🤖
        </h1>
        <div className={styles.description}>
          You can claim or mint Crypto Dev tokens on this DAPP 🪙
        </div>
        {walletConnected ? (
          <div>
            <div className={styles.description}>
              You have minted {utils.formatEther(balanceOfCryptoDevTokens)} 
              Crypto Dev Tokens 🪙
              </div>
            <div className={styles.description}>
              Overall {utils.formatEther(tokensMinted)}/10000 tokens have been minted
            </div>
              {renderButton()}
          </div>
        ) : (
          <button onClick={connectWallet} className={styles.button}>
            Connect your Wallet
          </button>
        )}
      </div>
         <div>
          <img className={styles.image} src="./1.svg" />
        </div>
    </div>

    <footer className={styles.footer}>
              Made with &#10084; by Crypto Devs
    </footer>
   </div>
  );
}
