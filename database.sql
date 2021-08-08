-- create database
-- CREATE DATABASE babyfoot_manager;

-- \c into babyfoot_manager database

-- create users table
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    socket_id VARCHAR(20),
    username VARCHAR(20),
    deleted BOOLEAN
);

-- create games table
CREATE TABLE games(
    id SERIAL PRIMARY KEY,
    finished BOOLEAN,
    deleted BOOLEAN,
    game VARCHAR(255)
);