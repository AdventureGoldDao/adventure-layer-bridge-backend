# adventure-layer-bridge-backend

bridge backend,includes api server and listen service 
# Adventure Layer Bridge Backend 🌉

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

A robust backend system for cross-chain token bridging, featuring:

## 🚀 Key Features

- **Multi-Chain Support**: Seamlessly bridge tokens between L1, L2, and multiple shard chains
- **Real-time Event Monitoring**: Listens for deposit events across different chains
- **Dual Query Methods**: Supports both Graph Protocol and RPC queries for maximum reliability
- **Queue-based Processing**: Ensures reliable transaction handling with a queue system
- **Persistent Storage**: MySQL database integration for transaction tracking and state management
- **Automated Recovery**: Handles network interruptions and failed transactions gracefully

## 🏗️ Architecture

The system consists of two main components:

1. **API Server**: Handles external requests and provides system status
2. **Listen Service**: Monitors blockchain events and processes cross-chain transactions

## 💻 Technical Stack

- Node.js runtime environment
- Web3.js for blockchain interaction
- MySQL for data persistence
- The Graph Protocol for efficient event querying
- HTTP server for API endpoints

## 🔧 Configuration

Supports flexible configuration through environment variables for:
- Chain endpoints (RPC/WSS URLs)
- Contract addresses
- Database credentials
- Network parameters

## 🛡️ Security Features

- Transaction verification
- Duplicate transaction prevention
- Secure key management
- Error handling and logging

## 🔄 Supported Networks

- Layer 1 (Ethereum)
- Layer 2 
- Multiple shard chains

## 📊 Monitoring

- Real-time transaction tracking
- Block height synchronization
- Event verification
- System status endpoints

## ⚡ Performance

- Optimized for high throughput
- Efficient event processing
- Minimal latency in cross-chain operations
- Scalable architecture

For detailed setup instructions and API documentation, please refer to the project wiki.

