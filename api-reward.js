const express = require('express');
const router = express.Router();

const mysql = require('mysql2');
const { URL, RESPONSE } = require('./utils/url');
const { generateResponse } = require('./utils/function');


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'go_anak_saleh',
  multipleStatements: true 
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

// Get List of reward
router.get(URL.REWARD.getAllReward, async (req, res) => {
  const { userId } = req.query;

  try {
    // Check if user exists
    db.query(`SELECT * FROM reward WHERE id_user = ?`, [userId], async (err, results) => {
      if (err) throw err;
      if (results.length === 0) {
        return res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Rewards not provided, for user: ' + userId));
      }

      res.json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Data loaded', results));
    });
  } catch (err) {
    console.error(err.message);
    res.status(RESPONSE.CODE.INTERNAL_SERVER_ERROR).send(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.INTERNAL_SERVER_ERROR, 'Server error:' + err.message));
  }
});


module.exports = router