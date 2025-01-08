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

const initMateriToUser = async (userId) => {

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
          // console.log(results, 'results')
          if (err) {
            // console.log(err, 'err')
            return false
          } else {
            return true
          }
        })
      }
    });
  } catch (err) {
    // console.log(err, 'err')
    return false
  }
}

const initSubSubject = async (userId) => {

  try {
    // Check if user exists
    db.query('SELECT * FROM sub_subject', async (err, results) => {
      if (err) throw err;
      else {
        let dataSubmit = []
        results.map((item, index) => {
          dataSubmit.push([
            userId,
            item.id_subject,
            item.id,
            item.id === 1 || item.id === 5 ? 2 : 1, // first sub materi should use continue status to make the materi accesible, based one logic in app ( 1 = locked, 2 = continue learning, 3 = done learning)
            //id 1 and id 5, is the first sub materi for each complete materi
          ])
        })

        const sql = 'INSERT INTO users_learning_sub_subject (id_user, id_subject, id_sub_subject, status) VALUES ?';

        db.query(sql, [dataSubmit], async (err, results) => {
          // console.log(results, 'results')
          if (err) {
            // console.log(err, 'err')
            return false
          } else {
            return true
          }
        })
      }
    });
  } catch (err) {
    console.log(err, 'err')
    return false
  }
}

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
          db.query('INSERT INTO users (email, password, name, gender, age, phone, point) VALUES (?, ?, ?, ?, ?, ?, ?)', [email, hashedPassword, name, gender, age, phone, 0], async (err, results) => {
            if (err) throw err;
            else {
              await initMateriToUser(results.insertId);
              await initSubSubject(results.insertId);
              res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'User registered successfully'));
            }
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
router.post(URL.AUTH.login, async (req, res) => {
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
        return res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Invalid email or password'));
      }

      const user = results[0];

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Invalid email or password'));
      }

      // Create and return JWT
      const token = jwt.sign({password: user.password}, JWT_SECRET);

      delete user.password;
      res.json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Logged in successfuly', { ...user, token }));
    });
  } catch (err) {
    console.error(err.message);
    res.status(RESPONSE.CODE.INTERNAL_SERVER_ERROR).send(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.INTERNAL_SERVER_ERROR, 'Server error:' + err.message));
  }
});

// Get user info
router.post(URL.AUTH.userInfo, async (req, res) => {
  const { email } = req.body;
  const token = req.header('Authorization');

  console.log(token, 'token');

  if (!token) {
    return res.status(RESPONSE.CODE.UNAUTHORIZED).send({ message: 'Unauthorized' });
  }

  const tokenDecoded = jwt.verify(token, JWT_SECRET);

  try {
    // Check if user exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) throw err;
      if (results.length === 0) {
        return res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Invalid email or password'));
      }

      const user = results[0];
      // console.log(user.password, 'user.password');
      // console.log(tokenDecoded, 'tokenDecoded');

      if(user.password === tokenDecoded.password){
        res.json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Logged in successfuly', { ...user, token }));
      }else{
        return res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Invalid email or password'));
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(RESPONSE.CODE.INTERNAL_SERVER_ERROR).send(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.INTERNAL_SERVER_ERROR, 'Server error:' + err.message));
  }
});

// Request password reset
router.post(URL.AUTH.requestReset, (req, res) => {
  // const dummyData = {
  //   email:'hakimnaofal@gmail.com',
  //   phone:'naofal@123',
  // }
  const { email, phone } = req.body;

  db.query('SELECT * FROM users WHERE email = ? AND phone = ?', [email, phone], (err, results) => {
    if (err) throw err;
    if (results.length === 0) {
      return res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'No user with that email', { isUserExist: RESPONSE.ERROR }));
    }

    // const token = crypto.randomBytes(6).toString('hex');
    // const expiration = new Date(Date.now() + 3600000); // 1 hour

    // db.query('INSERT INTO password_resets (email, token, expiration) VALUES (?, ?, ?)', [email, token, expiration], (err, results) => {
    //   if (err) throw err;

    //   const mailOptions = {
    //     from: EMAIL_USER,
    //     to: email,
    //     subject: 'Password Reset',
    //     text: `You requested a password reset. Please use the following token to reset your password: ${token}`
    //   };

    //   transporter.sendMail(mailOptions, (err, info) => {
    //     if (err) {
    //       console.error(err);
    //       return res.status(RESPONSE.CODE.INTERNAL_SERVER_ERROR).json(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.INTERNAL_SERVER_ERROR, 'Error sending email',));
    //     }
    //     res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Password reset email sent' ));
    //   });
    // });
    res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Password reset email sent', { isUserExist: RESPONSE.SUCCESS }));
  });
});

// Reset password
router.post(URL.AUTH.resetPassword, async (req, res) => {
  const { email, phone, newPassword } = req.body;

  db.query('SELECT * FROM users WHERE email = ? AND phone = ?', [email, phone], async (err, results) => {
    if (err) throw err;
    if (results.length === 0) {
      return res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'No user with that email'));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err, results) => {
      if (err) throw err;

      db.query('DELETE FROM password_resets WHERE email = ?', [email], (err, results) => {
        if (err) throw err;
        // res.status(200).json({ message: 'Password reset successfully' });
        res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Password reset successfully'));
      });
    });
  });
});

// Route to update user profile based on email
router.put('/update-profile', (req, res) => {
  const { email, name, gender, age, phone } = req.body;

  if (!email) {
    return res.status(RESPONSE.CODE.BAD_REQUEST).json(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.BAD_REQUEST, 'Email is required'));
  }

  let updateFields = [];
  if (name) updateFields.push(`name = ${db.escape(name)}`);
  if (gender) updateFields.push(`gender = ${db.escape(gender)}`);
  if (age) updateFields.push(`age = ${db.escape(age)}`);
  if (phone) updateFields.push(`phone = ${db.escape(phone)}`);
  const updateString = updateFields.join(', ');

  if (updateString.length === 0) {
    return res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'No fields to update'));
  }

  const query = `UPDATE users SET ${updateString} WHERE email = ${db.escape(email)}`;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(RESPONSE.CODE.INTERNAL_SERVER_ERROR).json(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.INTERNAL_SERVER_ERROR, 'Server error'));
    }
    if (results.affectedRows === 0) {
      return res.status(RESPONSE.CODE.URL_NOT_FOUND).json(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.URL_NOT_FOUND, 'User not found'))
    }
    return res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'User updated sucessfully'))
  });
});


// Route to update user profile based on email
router.put('/update-password', async (req, res) => {
  const { email, new_password } = req.body;

  if (!email) {
    return res.status(RESPONSE.CODE.BAD_REQUEST).json(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.BAD_REQUEST, 'Email is required'));
  }

  let updateFields = [];
  if (new_password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    updateFields.push(`password = ${db.escape(hashedPassword)}`)
  };
  const updateString = updateFields.join(', ');

  if (updateString.length === 0) {
    return res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'No fields to update'));
  }

  const query = `UPDATE users SET ${updateString} WHERE email = ${db.escape(email)}`;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(RESPONSE.CODE.INTERNAL_SERVER_ERROR).json(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.INTERNAL_SERVER_ERROR, 'Server error'));
    }
    if (results.affectedRows === 0) {
      return res.status(RESPONSE.CODE.URL_NOT_FOUND).json(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.URL_NOT_FOUND, 'User not found'))
    }
    return res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Password update sucessfully'))
  });
});

module.exports = router