-- Create a new database named 'agld' with UTF-8 character set and collation
CREATE DATABASE IF NOT EXISTS agld   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE agld;
-- Create a table 'last_ids' in the 'agld' database to store the last processed IDs
CREATE TABLE IF NOT EXISTS last_ids (
    name VARCHAR(255) NOT NULL,  -- Name of the process or transaction type
    last_id BIGINT NOT NULL,     -- Last processed ID for the given name
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Creation timestamp
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP-- Update timestamp
    PRIMARY KEY (name)           -- Primary key on 'name' to ensure uniqueness
);

-- Create a table 'transactions' to store transaction details
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each transaction
    name VARCHAR(255) NOT NULL,         -- Name associated with the transaction
    address VARCHAR(255) NOT NULL,      -- Address involved in the transaction
    amount DECIMAL(38, 0) NOT NULL,     -- Amount of the transaction
    block_number BIGINT NOT NULL,       -- Block number in which the transaction is included
    transaction_hash VARCHAR(255) NOT NULL,  -- Unique hash of the transaction
    block_timestamp DATETIME NOT NULL,  -- Timestamp of the block containing the transaction
    timestamp DATETIME NOT NULL,        -- Timestamp of the transaction itself
    status ENUM('INIT', 'SUCCESS', 'FAIL') NOT NULL DEFAULT 'INIT', -- Status of the transaction
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Creation timestamp
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Update timestamp
    UNIQUE (name, address, block_number, transaction_hash) -- Ensure uniqueness for combination of name, address, and block number
);

-- Create a table 'retry_transactions' to store retry transaction details
CREATE TABLE IF NOT EXISTS retry_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each retry transaction
    name VARCHAR(255) NOT NULL,         -- Name associated with the retry transaction   
    address VARCHAR(255) NOT NULL,      -- Address involved in the retry transaction
    block_number BIGINT NOT NULL,       -- Block number in which the retry transaction is included
    transaction_hash VARCHAR(255) NOT NULL,  -- Unique hash of the retry transaction
    retry_timestamp DATETIME NOT NULL,  -- Timestamp of the retry transaction
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Creation timestamp
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP-- Update timestamp
);


CREATE TABLE IF NOT EXISTS distributed_locks (
    lock_name VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lock_name),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB; 



-- Create a table 'transaction_flow' to store detailed transaction flow information
CREATE TABLE IF NOT EXISTS transaction_flow (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each flow record
    transaction_id INT NOT NULL,        -- Reference to the parent transaction
    name VARCHAR(255) NOT NULL,         -- Route name (e.g. 'L1->L2', 'L2->L1', etc.)
    from_address VARCHAR(255) NOT NULL, -- Sender address
    to_address VARCHAR(255) NOT NULL,   -- Recipient address
    amount DECIMAL(38, 0) NOT NULL,     -- Transaction amount
    gas_price VARCHAR(255),             -- Gas price used
    gas_limit BIGINT,                   -- Gas limit used
    transaction_hash VARCHAR(255),      -- Transaction hash
    status ENUM('INIT', 'SUCCESS', 'FAIL') NOT NULL DEFAULT 'INIT', -- Status of the transaction
    error_message TEXT,                 -- Error message if any
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Creation timestamp
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Update timestamp
); 

-- Insert initial data into 'last_ids' table
insert into last_ids (name, last_id) values ('L1->L2', 0);
insert into last_ids (name, last_id) values ('L2->L1', 0);
insert into last_ids (name, last_id) values ('shard1->L2', 0);
insert into last_ids (name, last_id) values ('L2->shard1', 0); 


-- Add created_at and updated_at columns to transactions table
-- ALTER TABLE transactions
-- ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
-- ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update timestamp'; 
