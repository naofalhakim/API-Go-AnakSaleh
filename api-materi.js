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
            item.id_subject,
            item.id,
            item.id === 1 || item.id === 5 ? 2 : 1, // first sub materi should use continue status to make the materi accesible, based one logic in app ( 1 = locked, 2 = continue learning, 3 = done learning)
            //id 1 and id 5, is the first sub materi for each complete materi
          ])
        })

        const sql = 'INSERT INTO users_learning_sub_subject (id_user, id_subject, id_sub_subject, status) VALUES ?';

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

// Update Sub-Materi and Materi status after user open the article content
router.put(URL.MATERI.updateMateriStatus, async (req, res) => {
  const { user_id, id_subject, id_sub_subject, status } = req.body;

  try {
    //update status for sub materi, after user open the materi on app
    const update_sub_subject_status = `UPDATE users_learning_sub_subject SET status=${status} WHERE id_sub_subject=${id_sub_subject} and id_user=${user_id}`;
    db.query(update_sub_subject_status, async (err, results) => {
      if (err) throw err;
      else {
        //select data sub materi based on materi id, get unit_total from count of table result
        db.query(`SELECT * FROM users_learning_sub_subject where id_user=${user_id} and id_subject=${id_subject}`, async (err, results) => {
          if (err) throw err;
          else {
            // console.log(results, 'result')
            let unit_total = results.length
            let unitFinished = 0

            results.map(item => {
              if (item.status === 3) { // 3 is finished, 2 continue, 1 locked
                unitFinished = unitFinished + 1
              }
            })

            let statusSubject = unit_total === unitFinished ? 'DONE' : unitFinished === 0 ? 'START' : 'CONTINUE'; //DONE', 'CONTINUE', 'START'

            // console.log(unit_total,'unit_total')
            // console.log(unitFinished,'unitFinished')
            // console.log(statusSubject,'statusSubject')

            const update_subject_status = `UPDATE users_learning_subject SET unit_status='${statusSubject}', unit_finished=${unitFinished} WHERE id_user=${user_id} and id_subject=${id_subject}`;
            db.query(update_subject_status, async (err, results) => {
              if (err) {
                console.log(err, 'error')
                res.json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, err));
              } else {
                res.json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'suceed update data materi for user: ' + user_id));
              }
            })
          }
        });
      }
    })
  } catch (err) {
    console.error(err.message);
    res.status(RESPONSE.CODE.INTERNAL_SERVER_ERROR).send(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.INTERNAL_SERVER_ERROR, 'Server error:' + err.message));
  }
});

// Update Sub-Materi and Materi status to done, and update the unit finished count 
router.put(URL.MATERI.finishSubMateri, async (req, res) => {
  const { user_id, id_subject, id_sub_subject } = req.body;
  let status_done = 3
  let status_ongoing = 2
  try {
    //check is sub subject already done? if yes, no need to execute all of below queries
    db.query(`SELECT * FROM users_learning_sub_subject where id_user=${user_id} and id_sub_subject=${id_sub_subject}`, async (err, results) => {
      let isSubSubjectDone = results[0].status === 3 //3 is status of done
      if (err) {
        res.json(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.BAD_REQUEST, err));
      } else if (isSubSubjectDone) {
        res.json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Subject ' + id_sub_subject + 'already done'));
      } else {
        //update status for sub materi, after user open the materi on app
        const update_sub_subject_status = `UPDATE users_learning_sub_subject SET status=${status_done} WHERE id_sub_subject=${id_sub_subject} and id_user=${user_id};UPDATE users_learning_sub_subject SET status=${status_ongoing} WHERE id_sub_subject=${id_sub_subject + 1} and id_user=${user_id};`;
        db.query(update_sub_subject_status, async (err, results) => {
          if (err) throw err;
          else {
            //select data sub materi based on materi id, get unit_total from count of table result
            db.query(`SELECT * FROM users_learning_sub_subject where id_user=${user_id} and id_subject=${id_subject}`, async (err, results) => {
              if (err) throw err;
              else {
                // console.log(results, 'result')
                let unit_total = results.length
                let unitFinished = 0

                results.map(item => {
                  if (item.status === 3) { // 3 is finished, 2 continue, 1 locked
                    unitFinished = unitFinished + 1
                  }
                })

                let statusSubject = unit_total === unitFinished ? 'DONE' : unitFinished === 0 ? 'START' : 'CONTINUE'; //DONE', 'CONTINUE', 'START'

                // console.log(unit_total,'unit_total')
                // console.log(unitFinished,'unitFinished')
                // console.log(statusSubject,'statusSubject')

                const update_subject_status = `UPDATE users_learning_subject SET unit_status='${statusSubject}', unit_finished=${unitFinished} WHERE id_user=${user_id} and id_subject=${id_subject}`;
                db.query(update_subject_status, async (err, results) => {
                  if (err) {
                    console.log(err, 'error')
                    res.json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, err));
                  } else {
                    res.json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'suceed update data materi for user: ' + user_id));
                  }
                })
              }
            });
          }
        })
      }
    })
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
    db.query(`SELECT users_learning_subject.id_user, users_learning_subject.id_subject, users_learning_subject.unit_finished, users_learning_subject.unit_status, subject.title, subject.description, subject.unit_total, subject.thumbnail 
      FROM users_learning_subject INNER JOIN subject ON users_learning_subject.id_subject = subject.id and users_learning_subject.id_user = ?`, [userId], async (err, results) => {
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
  const { userId, idSubject } = req.query;

  try {
    // Check if user exists
    db.query(`SELECT mdl.id_subject, mdl.id_sub_subject, mdl.status, s_mdl.title, s_mdl.materi 
      FROM users_learning_sub_subject as mdl INNER JOIN sub_subject as s_mdl ON mdl.id_sub_subject = s_mdl.id and mdl.id_user = ? and mdl.id_subject = ? `, [userId, idSubject], async (err, results) => {
      if (err) throw err;
      if (results.length === 0) {
        return res.status(RESPONSE.CODE.SUCCEED).json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Sub Materi id:' + idSubject + ' not provided, for user: ' + userId));
      }

      //markup id sub subject
      // if(results[0].id_subject > 1){
      //   let markupResult = []
      //   results.map((item, index)=>{
      //     markupResult.push({
      //       ...item, id_sub_subject: index + 1
      //     })
      //   })
      //   res.json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Data loaded', markupResult));
      // }else{
      res.json(generateResponse(RESPONSE.SUCCESS, RESPONSE.CODE.SUCCEED, 'Data loaded', results));
      // }

    });
  } catch (err) {
    console.error(err.message);
    res.status(RESPONSE.CODE.INTERNAL_SERVER_ERROR).send(generateResponse(RESPONSE.ERROR, RESPONSE.CODE.INTERNAL_SERVER_ERROR, 'Server error:' + err.message));
  }
});


module.exports = router