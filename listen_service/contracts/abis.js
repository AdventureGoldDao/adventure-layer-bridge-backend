// import erc20Abi from "./abis/erc20.json";
// import ownableAbi from "./abis/ownable.json";
// const erc20Abi = require("./abis/erc20.json");
const depositAbi = require("./abis/deposit-al.json");
const L1_ABI = require("./abis/L1Bridge.json");

const abis = {
  // erc20: erc20Abi,
  deposit: depositAbi,
  // ownable: ownableAbi,
  l1: L1_ABI.abi,
};

// export default abis;
module.exports = abis;
