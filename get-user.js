const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const mysql = require('mysql2');
const { URL, RESPONSE } = require('./utils/url');
const { generateResponse } = require('./utils/function');
const { JWT_SECRET } = require('./utils/env');


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'go_anak_saleh',
});

const myConnection = () => {
  db.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      return;
    }
    console.log('Connected to MySQL database');
  });
};

myConnection();

router.get(URL.AUTH.getAllUser, (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      res.json(err);
      throw err
    } else {
      res.json(results);
    }
  });
});

// Get a user by ID
router.get('/user-id/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
    if (err) throw err;
    res.json(results[0]);
  });
});

router.get('/user-email', (req, res) => {
  const { email } = req.params;
  db.query('SELECT email FROM users', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});


// Register route
router.post(URL.AUTH.register, (req, res) => {
  // const dummyData = {
  //   email:'hakimnaofal@gmail.com',
  //   password:'naofal@123',
  //   name: 'naofal',
  //   gender: 0, // 0: laki-laki, 1: perempuan
  //   age: 11,
  //   phone: '082214119478'
  // }
  // console.log('req.body-register',req);

  const { email, password, name, gender, age, phone } = req.body;

  try {
    // Check if email already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        return res.status(RESPONSE.CODE.BAD_REQUEST).json(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.BAD_REQUEST, 'User already exists'));
      } else {
        // Check if phone already used
        db.query('SELECT * FROM users WHERE phone = ?', [phone], async (err, results) => {
          if (err) throw err;
          if (results.length > 0) {
            return res.status(RESPONSE.CODE.BAD_REQUEST).json(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.BAD_REQUEST, 'Phone already used'));
          }

          // Hash the password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          // Create new user
          db.query('INSERT INTO users (email, password, name, gender, age, phone) VALUES (?, ?, ?, ?, ?, ?)', [email, hashedPassword, name, gender, age, phone], (err, results) => {
            if (err) throw err;
            res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'User registered successfully'));
          });

        }
        );
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(RESPONSE.CODE.INTERNAL_SERVER_ERROR).send(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.INTERNAL_SERVER_ERROR, 'Server error'));
  }
});


// Login route
router.post('/login', async (req, res) => {
  // const dummyData = {
  //   email:'hakimnaofal@gmail.com',
  //   password:'naofal@123',
  // }
  const { email, password } = req.body;

  try {
    // Check if user exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) throw err;
      if (results.length === 0) {
        return res.status(RESPONSE.CODE.BAD_REQUEST).json(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.BAD_REQUEST, 'Invalid email or password'));
      }

      const user = results[0];

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(RESPONSE.CODE.BAD_REQUEST).json(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.BAD_REQUEST, 'Invalid email or password'));
      }

      // Create and return JWT
      const payload = { userId: user.email };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1y' });

      res.json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Logged in successfuly', { name: user.name, email: user.email, phone: user.phone, gender: user.gender, token }));
    });
  } catch (err) {
    console.error(err.message);
    res.status(RESPONSE.CODE.INTERNAL_SERVER_ERROR).send(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.INTERNAL_SERVER_ERROR, 'Server error'));
  }
});


module.exports = router