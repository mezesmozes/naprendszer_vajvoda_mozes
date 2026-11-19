require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


//adatbazis kapcsolat
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

//api-k

//-----------------

// 1. Összes bolygó lekérdezése (GET /api/bolygok)
app.get('/api/bolygok', async (req, res) => {
    try {
        // A bolygok tábla minden mezőjét lekérdezzük
        const [rows] = await db.query('SELECT * FROM bolygok');
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Adatbázis hiba történt.' });
    }
});

// 2. Új bolygó rögzítése (POST /api/ujbolygo)
app.post('/api/ujbolygo', async (req, res) => {
    const {
        bolygo_id,
        neve,
        tipus_id,
        tomeg,
        egyenlitori_sugar,
        holdak_szama,
        nap_tavolsag,
        fold_tavolsag,
        leiras
    } = req.body;

    // Kötelező mezők ellenőrzése (a minta alapján kiemelve a név ellenőrzése)
    if (!neve || neve.trim() === '') {
        return res.status(400).json({ error: 'A név megadása kötelező!' });
    }
    if (
        tipus_id === undefined ||
        tomeg === undefined ||
        egyenlitori_sugar === undefined ||
        holdak_szama === undefined ||
        nap_tavolsag === undefined ||
        !leiras
    ) {
        return res.status(400).json({ error: 'Minden kötelező mező megadása szükséges!' });
    }

    try {
        let query = '';
        let params = [];

        // Ha küldtek bolygo_id-t is (pl. tesztelésnél), azt is beszúrjuk, egyébként AUTO_INCREMENT
        if (bolygo_id !== undefined) {
            query = `INSERT INTO bolygok 
                (bolygo_id, neve, tipus_id, tomeg, egyenlitori_sugar, holdak_szama, nap_tavolsag, fold_tavolsag, leiras) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            params = [bolygo_id, neve, tipus_id, tomeg, egyenlitori_sugar, holdak_szama, nap_tavolsag, fold_tavolsag || 0, leiras];
        } else {
            query = `INSERT INTO bolygok 
                (neve, tipus_id, tomeg, egyenlitori_sugar, holdak_szama, nap_tavolsag, fold_tavolsag, leiras) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            params = [neve, tipus_id, tomeg, egyenlitori_sugar, holdak_szama, nap_tavolsag, fold_tavolsag || 0, leiras];
        }

        const [result] = await db.query(query, params);

        res.status(201).json({
            message: 'Sikeres beszúrás!',
            result: result
        });
    } catch (err) {
        res.status(500).json({ error: 'Adatbázis hiba történt.' });
    }
});

// 3. Bolygó törlése ID alapján (DELETE /api/torles/:id)
app.delete('/api/torles/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query('DELETE FROM bolygok WHERE bolygo_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Nincs ilyen bolygó az adatbázisban.' });
        }

        res.status(200).json({
            message: 'Sikeres törlés!',
            result: result
        });
    } catch (err) {
        res.status(500).json({ error: 'Adatbázis hiba történt.' });
    }
});

// 4. Bolygó típusok lekérdezése (GET /api/tipus)
app.get('/api/tipus', async (req, res) => {
    try {
        // A leírásban tipusok és bolygo_tipusok néven is szerepel a tábla, 
        // ha a naprendszer.sql-ben 'tipusok' a neve, írd át arra!
        const [rows] = await db.query('SELECT * FROM bolygo_tipusok');
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Adatbázis hiba történt.' });
    }
});

//szerver inditasa
app.listen(PORT, () => {
    console.log(`Szerver fut: http://localhost:${PORT}`);
});