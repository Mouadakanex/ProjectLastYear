const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const Database = require("better-sqlite3");


const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));
const db = new Database ("Movite.db");


db.prepare(
    `
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        image TEXT,
        description TEXT
    )
    `

).run();

db.prepare(
    `
    CREATE TABLE IF NOT EXISTS users (

        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    `
).run();

app.post("/api/products", (req, res) => {

    const {name, price, image, description } = req.body;

    if (!name || !price || !image || !description){
        return res.status(400).json({
            message: "Fill first"
        });
    }

    const result = db.prepare(
         `
         INSERT INTO products 
         (name, price, image, description)
         VALUES (?, ?, ?, ?)
         `
    ).run(
        name, 
        price,
        image,
        description
    );

    res.status(201).json({
        message: "succes",
        products_id: result.lastInsertRowid
    });

});
app.get("/api/products", (req, res) => {

    const products = db.prepare(
        `
        SELECT
        products.id,
            products.name,
            products.price,
            products.image,
            products.description
            FROM products
            ORDER BY products.id DESC
        `
    ).all();

    res.json(products);

});

require("./agent")(app, db);


app.post("/api/register", async (req, res) => {

    const {
        username,
        email,
        password
    } = req.body;


    // Check fields
    if (!username || !email || !password) {

        return res.status(400).json({
            message: "Fill first"
        });

    }


    // Check username
    const existsuser = db.prepare(`
        SELECT id
        FROM users
        WHERE username = ?
    `).get(username);


    if (existsuser) {

        return res.status(409).json({
            message: "This username already exists"
        });

    }


    // Check email
    const existsemail = db.prepare(`
        SELECT id
        FROM users
        WHERE email = ?
    `).get(email);


    if (existsemail) {

        return res.status(409).json({
            message: "This email already exists"
        });

    }


    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);


    // Insert user
    const result = db.prepare(`
        INSERT INTO users
        (username, email, password)
        VALUES (?, ?, ?)
    `).run(
        username,
        email,
        hashedPassword
    );


    res.status(201).json({
        message: "Success",
        user_id: result.lastInsertRowid
    });

});

app.post("/api/login", async (req, res) => {

    const {email, password} = req.body

    if(!email || !password){
        return res.status(400).json({
            message: "fill first"
        });
    }

    const user = db.prepare(`
    SELECT * FROM users
    WHERE email = ?
    `).get(email);

    if (!user){
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    const passwordmatch = await bcrypt.compare(password, user.password);

    if (!passwordmatch){
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    res.json({
        message: "Login succes",

        user : {
            id : user.id,
            email : user.email,
            username : user.username
        }
    });
});

app.listen(3000, () => {

    console.log(
        "Server running on http://localhost:3000"
    );

});


