DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    signature TEXT NOT NULL,
    time_of_petition TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);