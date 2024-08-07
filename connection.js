const express = require('express');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;

// app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'go_anak_saleh',
});


const myDb = db.connect((err) => {
        if (err) {
          console.error('Error connecting to MySQL:', err);
          return;
        }
        console.log('Connected to MySQL database');
      });
    

const myConnection = () => app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = {myConnection, myDb}