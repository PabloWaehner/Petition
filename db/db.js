const spicedPg = require("spiced-pg");
const bcrypt = require("bcryptjs");
let db;

if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    db = spicedPg(
        "postgres:pablomartinwaehner:password@localhost:5432/petition"
    );
}

exports.getSigners = function() {
    return db.query("SELECT * FROM signatures;").then(results => {
        // console.log(results.rows);
        return results.rows;
    });
};

exports.insertUser = function(signature, signatureId) {
    const q = `INSERT INTO signatures (signature, user_id)
    VALUES($1, $2)
    RETURNING *`;

    const params = [signature, signatureId];
    return db
        .query(q, params) //q o query, es lo mismo, es propio estilo
        .then(results => {
            return results.rows[0];
        });
};

exports.getSignature = function(signatureId) {
    const q = `SELECT signature FROM signatures WHERE id = $1;`;
    const params = [signatureId];
    return db.query(q, params).then(results => {
        console.log("cual es el id?? ", results.rows[0]);
        return results.rows[0].signature;
    });
};
exports.getSignatureId = function(userID) {
    const q = `SELECT id FROM signatures WHERE user_id = $1;`;
    const params = [userID];
    return db.query(q, params).then(results => {
        console.log("cual es el user_id?? ", results.rows[0]);
        return results.rows[0] && results.rows[0].id;
    });
};

exports.getUsers = function() {
    return db.query("SELECT * FROM users;").then(results => {
        // console.log("getUsers: ", results.rows);
        return results.rows;
    });
};
exports.getInfo = function() {
    const q = `SELECT users.first_name AS firstName, users.last_name AS lastName, profiles.age AS age, profiles.city AS city, profiles.url AS homepage
        FROM users
        LEFT OUTER JOIN profiles
        ON users.id = profiles.user_id
        `;
    return db.query(q).then(results => {
        return results.rows;
    });
};
exports.getInfoWithCity = function(city) {
    const q = `SELECT users.first_name AS firstName, users.last_name AS lastName, profiles.age AS age, profiles.city AS city, profiles.url AS homepage
        FROM users
        LEFT OUTER JOIN profiles
        ON users.id = profiles.user_id
        WHERE city = $1`;
    const params = [city];
    return db.query(q, params).then(results => {
        console.log("information: ", results.rows);
        return results.rows;
    });
};

exports.signUp = function(firstName, lastName, email, password) {
    const q = `INSERT INTO users (first_name, last_name, email, hashed_password )
    VALUES($1, $2, $3, $4)
    RETURNING *`;

    const params = [firstName, lastName, email, password];
    return db.query(q, params).then(results => {
        return results.rows[0];
    });
};

exports.getProfile = function() {
    return db.query("SELECT * FROM profiles;").then(results => {
        // console.log(results.rows);
        return results.rows;
    });
};

exports.insertProfile = function(age, city, url, user_id) {
    const q = `INSERT INTO profiles (age, city, url, user_id)
    VALUES($1, $2, $3, $4)
    RETURNING *`;

    const params = [age, city, url, user_id];
    return db.query(q, params).then(results => {
        return results.rows[0];
    });
};
///////////////////////////////////////////////
exports.getInfoAndEmail = function(userId) {
    const q = `SELECT users.first_name AS firstName, users.last_name AS lastName, users.email, users.hashed_password, profiles.age AS age, profiles.city AS city, profiles.url AS homepage
        FROM users
        LEFT OUTER JOIN profiles
        ON users.id = profiles.user_id
        WHERE users.id = $1;
        `;
    const params = [userId];
    return db.query(q, params).then(results => {
        return results.rows[0];
    });
};
exports.updateProfile = function(age, city, homepage, user_id) {
    const q = `INSERT INTO profiles (age, city, url, user_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT(user_id)
    DO UPDATE SET age=$1, city=$2, url=$3
    RETURNING *`;
    const params = [age, city, homepage, user_id];
    return db.query(q, params).then(results => {
        return results.rows[0];
    });
};

exports.updateMoreStuff = function(user_id, firstname, lastname, email) {
    const q = `UPDATE users SET first_name=$2, last_name=$3, email=$4
    WHERE id=$1
    RETURNING *`;
    const params = [user_id, firstname, lastname, email];
    return db.query(q, params).then(results => {
        return results.rows[0];
    });
};
exports.updateProfileAndPassword = function(
    user_id,
    firstname,
    lastname,
    email,
    hashedpassword
) {
    const q = `
    UPDATE users SET first_name=$2, last_name=$3, email=$4, hashed_password=$5
        WHERE id=$1
        RETURNING *
    `;
    const params = [user_id, firstname, lastname, email, hashedpassword];
    return db.query(q, params).then(results => {
        // console.log(results.rows[0]);
        return results.rows[0];
    });
};
exports.deleteSignature = function(userId) {
    const q = `DELETE FROM signatures WHERE user_id = $1`;

    const params = [userId];

    return db.query(q, params).then(results => {
        return results.rows[0];
    });
};

exports.hashPassword = function(plainTextPassword) {
    return new Promise(function(resolve, reject) {
        bcrypt.genSalt(function(err, salt) {
            if (err) {
                return reject(err);
            }
            bcrypt.hash(plainTextPassword, salt, function(err, hash) {
                if (err) {
                    return reject(err);
                }
                resolve(hash);
            });
        });
    });
};

exports.checkPassword = function(
    textEnteredInLoginForm,
    hashedPasswordFromDatabase
) {
    return new Promise(function(resolve, reject) {
        bcrypt.compare(
            textEnteredInLoginForm,
            hashedPasswordFromDatabase,
            function(err, doesMatch) {
                if (err) {
                    reject(err);
                } else {
                    resolve(doesMatch);
                }
            }
        );
    });
};
