# 🏷️ Blockchain-Based Product Tracking System

## 📌 Overview
This project implements a **blockchain-powered product tracking system** using **NFTs (ERC-721)** to represent real-world products. Each product has a **unique digital identity stored on the blockchain**, ensuring **authenticity, transparency, and ownership tracking**.

✅ **Key Features**
- **Mint NFTs for products** with metadata stored on **IPFS (Pinata)**.
- **Generate & scan QR codes** to fetch product details from the blockchain.
- **Fetch ownership history** directly from the smart contract.
- **Transfer ownership** when a product is sold, updating blockchain records.
- **Decentralized & tamper-proof** solution for supply chain tracking.

---

## 📌 System Architecture
### 🏗️ **Tech Stack**
| Component          | Technology |
|-------------------|------------|
| **Blockchain**    | Sepolia (Etthereum) |
| **Smart Contract** | Solidity (ERC-721, OpenZeppelin) |
| **Storage**       | IPFS (Pinata) for metadata |
| **Backend**       | Node.js, Express, Web3.js |
| **Frontend**      | React, QR Code Scanner |
| **Wallet**        | MetaMask |
| **Local Testing** | Hardhat, Ganache |

---

## 📌 📥 Setup & Installation

### **1️⃣ Clone the Repository**
```bash
git clone https://github.com/Flgodd/HackLondon
cd blockchain-product-tracker
