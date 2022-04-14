const {ethers} = require("hardhat");
require("dotenv").config({path: ".env"});
const { CRYPTO_DEVS_NFT_CONTRACT_ADDRESS } = require("../constants");


async function main() {

    const cryptoDevsTokenContract = await ethers.getContractFactory("CryptoDevToken");

    const deployCryptoDevsTokenContract = await cryptoDevsTokenContract.deploy(
        CRYPTO_DEVS_NFT_CONTRACT_ADDRESS
        );

    console.log(
        "CryptoDev Token Contract Address:",
        deployCryptoDevsTokenContract.address
    );

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });