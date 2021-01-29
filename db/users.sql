DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(500) NOT NULL,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CREATE VIEW information AS
-- SELECT users.first_name AS firstName, users.last_name AS lastName, profiles.age AS age, profiles.city AS city, profiles.url AS homepage
-- FROM users
-- LEFT OUTER JOIN profiles
--     ON users.id = profiles.user_id