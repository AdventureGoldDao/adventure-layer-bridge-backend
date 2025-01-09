CREATE DATABASE agld CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE agld.last_ids (
    name VARCHAR(255) NOT NULL,
    last_id BIGINT NOT NULL,
    PRIMARY KEY (name)
);

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    amount DECIMAL(38, 0) NOT NULL,
    block_number BIGINT NOT NULL,
    transaction_hash VARCHAR(255) NOT NULL,
    block_timestamp DATETIME NOT NULL,
    timestamp DATETIME NOT NULL,
    UNIQUE (name, address, block_number)
);

insert into agld.last_ids (name, last_id) values ('L1->L2', 6914317);
insert into agld.last_ids (name, last_id) values ('L2->L1', 515700);
insert into agld.last_ids (name, last_id) values ('shard1->L2', 30228);
insert into agld.last_ids (name, last_id) values ('L2->shard1', 536111); 
