const cron = require('node-cron');
const mysql = require('mysql2');

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
    console.log('Cron Connected to MySQL database');
  });
};

myConnection();

// Schedule the task to run daily at 2am
cron.schedule('0 0 1 * * *', () => {
    console.log('Database updated successfully');
    // Perform database updates here
    db.query('UPDATE reward SET reward.status = 2 WHERE reward.date < UNIX_TIMESTAMP(NOW()) * 1000', (err, results) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Database updated successfully');
      }
    });
  });
  
  // Close the database connection when the script exits
  process.on('exit', () => {
    db.end();
  });