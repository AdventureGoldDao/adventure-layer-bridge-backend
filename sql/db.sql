-- Create a new database named 'agld' with UTF-8 character set and collation
CREATE DATABASE IF NOT EXISTS agld   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE agld;
-- Create a table 'last_ids' in the 'agld' database to store the last processed IDs
CREATE TABLE IF NOT EXISTS last_ids (
    name VARCHAR(255) NOT NULL,  -- Name of the process or transaction type
    last_id BIGINT NOT NULL,     -- Last processed ID for the given name
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
    UNIQUE (name, address, block_number) -- Ensure uniqueness for combination of name, address, and block number
);

-- Insert initial data into 'last_ids' table
insert into last_ids (name, last_id) values ('L1->L2', 0);
insert into last_ids (name, last_id) values ('L2->L1', 0);
insert into last_ids (name, last_id) values ('shard1->L2', 0);
insert into last_ids (name, last_id) values ('L2->shard1', 0); 
