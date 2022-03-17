const { Blockchain, Transaction } = require("./blockchain");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

const myKey = ec.keyFromPrivate(
  "2c5be4ddd8d3fb027ae8cabcf59992514566ef7975d295090de81298b5bf554d"
);
const myWalletAddress = myKey.getPublic("hex");

let tbpatjCoin = new Blockchain();

const tx1 = new Transaction(myWalletAddress, "public key goes here", 10);
tx1.signTransaction(myKey);
tbpatjCoin.addTransaction(tx1);

console.log("\n starting miner");
tbpatjCoin.minePendingTransactions(myWalletAddress);

console.log(
  "\nBalance of tbpatj is",
  tbpatjCoin.getBalanceOfAddress(myWalletAddress)
);

console.log("is chain valid?", tbpatjCoin.isChainValid());

// console.log(JSON.stringify(tbpatjCoin.chain));
