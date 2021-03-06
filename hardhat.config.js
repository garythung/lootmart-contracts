require("dotenv").config();
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.3",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10,
      },
    },
  },
  paths: {
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.ALCHEMY_MAINNET_URL,
        blockNumber: 13246654,
      },
      chainId: 1337,
    },
    rinkeby: {
      url: process.env.ALCHEMY_RINKEBY_URL,
      accounts: [`0x${process.env.RINKEBY_PRIVATE_KEY}`],
    },
    mainnet: {
      url: process.env.ALCHEMY_MAINNET_URL,
      accounts: [`0x${process.env.MAINNET_PRIVATE_KEY}`],
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
