const SHA256 = require("crypto-js/sha256");
const { appendFileSync } = require("fs");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

class Transaction {
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
  }

  calculateHash() {
    return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
  }

  signTransaction(signingKey) {
    if (signingKey.getPublic("hex") !== this.fromAddress) {
      throw new Error("you cannot sign transactions for other wallets");
    }

    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, "base64");
    this.signature = sig.toDER("hex");
  }

  isValid() {
    if (this.fromAddress === null) return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error("no signature in this transaction");
    }

    const publicKey = ec.keyFromPublic(this.fromAddress, "hex");
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}

class Block {
  constructor(timestamp, transactions, previousHash = "") {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  //calculate the hash by dumping everything from the block into itq
  calculateHash() {
    return SHA256(
      this.previousHash +
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.nonce
    ).toString();
  }

  hasValidTransaction() {
    for (const trans of this.transactions) {
      if (!trans.isValid()) {
        console.log("wasn't valid here line 61");
        return false;
      }
    }
    return true;
  }

  mineBlock(difficulty) {
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")
    ) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log("Block mined: " + this.hash);
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGensisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  createGensisBlock() {
    return new Block("01/01/2017", "Gensis Block", "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress) {
    const rewardTx = new Transaction(
      null,
      miningRewardAddress,
      this.miningReward
    );
    this.pendingTransactions.push(rewardTx);

    let block = new Block(
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );
    block.mineBlock(this.difficulty);

    console.log("Block successfully mined");
    this.chain.push(block);

    //reward the user who mined the transaction
    this.pendingTransactions = [];
  }

  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error("Transaction must includ from and to address");
    }

    if (!transaction.isValid()) {
      throw new Error("Cannot add invalid transaction to chain");
    }

    this.pendingTransactions.push(transaction);
  }

  getBalanceOfAddress(address) {
    let balance = 0;

    //iterate through our chain and our transactions
    for (const block of this.chain) {
      for (const trans of block.transactions) {
        //if the users address is a from address then we can remove if its a to then we can add
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        } else if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    return balance;
  }

  /** old method to add a block to our chain
  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
  }
  */

  isChainValid() {
    //iteratet through our chain and test to see if the hashes line up
    for (let i = 1; i < this.chain.length; i++) {
      const curBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (!curBlock.hasValidTransaction()) {
        return false;
      }

      if (curBlock.hash !== curBlock.calculateHash()) {
        return false;
      }
      if (curBlock.previousHash !== previousBlock.hash) {
        console.log(curBlock);
        console.log("nooo");
        return false;
      }
    }
    return true;
  }
}

module.exports.Blockchain = Blockchain;

module.exports.Transaction = Transaction;
