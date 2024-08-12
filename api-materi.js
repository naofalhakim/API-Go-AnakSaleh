const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const mysql = require('mysql2');
const { URL, RESPONSE } = require('./utils/url');
const { generateResponse } = require('./utils/function');
const { JWT_SECRET, EMAIL_USER } = require('./utils/env');


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'go_anak_saleh',
});

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 587,
  auth: {
    user: 'naofalhakim@gmail.com',
    pass: 'Terate@1922'
  }
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

// Init Materi data to new user
router.post(URL.MATERI.initUserMateri, async (req, res) => {
  // const dummyData = {
  //   userId: 5,
  // }
  const { userId } = req.body;

  try {
    // Check if user exists
    db.query('SELECT * FROM subject', async (err, results) => {
      if (err) throw err;
      else {
        let dataSubmit = []
        results.map(item => {
          dataSubmit.push([
            userId,
            item.id,
            0,
            'START'
          ])
        })

        const sql = 'INSERT INTO users_learning_subject (id_user, id_subject, unit_finished, unit_status) VALUES ?';

        db.query(sql, [dataSubmit], async (err, results) => {
          if (err) {
            console.log(err, 'error')
            res.json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, err));
          } else {
            res.json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'suceed initing data subject for user: ' + userId));
          }
        })
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(RESPONSE.CODE.INTERNAL_SERVER_ERROR).send(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.INTERNAL_SERVER_ERROR, 'Server error:' + err.message));
  }
});

// Init Sub-Materi data to new user
router.post(URL.MATERI.initUserSubMateri, async (req, res) => {
  // const dummyData = {
  //   userId: 5,
  // }
  const { userId } = req.body;

  try {
    // Check if user exists
    db.query('SELECT * FROM sub_subject', async (err, results) => {
      if (err) throw err;
      else {
        let dataSubmit = []
        results.map((item, index) => {
          dataSubmit.push([
            userId,
            item.id,
            index === 0 ? 2 : 1, // first sub materi should use continue status to make the materi accesible, based one logic in app ( 1 = locked, 2 = continue learning, 3 = done learning)
          ])
        })

        const sql = 'INSERT INTO users_learning_sub_subject (id_user, id_sub_subject, status) VALUES ?';

        db.query(sql, [dataSubmit], async (err, results) => {
          if (err) {
            console.log(err, 'error')
            res.json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, err));
          } else {
            res.json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'suceed initing data sub materi for user: ' + userId));
          }
        })
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(RESPONSE.CODE.INTERNAL_SERVER_ERROR).send(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.INTERNAL_SERVER_ERROR, 'Server error:' + err.message));
  }
});


// Get Transaction of materi from materi route
router.get(URL.MATERI.getAllMateri, async (req, res) => {
  const { userId } = req.query;

  try {
    // Check if user exists
    db.query('SELECT * FROM users_learning_subject WHERE id_user = ?', [userId], async (err, results) => {
      if (err) throw err;
      if (results.length === 0) {
        return res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Subject list not provided, for user: ' + userId));
      }

      res.json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Data loaded', results));
    });
  } catch (err) {
    console.error(err.message);
    res.status(RESPONSE.CODE.INTERNAL_SERVER_ERROR).send(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.INTERNAL_SERVER_ERROR, 'Server error:' + err.message));
  }
});

// Get Transaction of sub materi from materi route
router.get(URL.MATERI.getAllSubMateri, async (req, res) => {
  const { userId } = req.query;

  try {
    // Check if user exists
    db.query('SELECT * FROM users_learning_sub_subject WHERE id_user = ?', [userId], async (err, results) => {
      if (err) throw err;
      if (results.length === 0) {
        return res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Sub Materi not provided, for user: ' + userId));
      }

      res.json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Data loaded', results));
    });
  } catch (err) {
    console.error(err.message);
    res.status(RESPONSE.CODE.INTERNAL_SERVER_ERROR).send(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.INTERNAL_SERVER_ERROR, 'Server error:' + err.message));
  }
});


module.exports = router