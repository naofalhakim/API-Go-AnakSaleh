const express = require('express');
const users = require('./get-user');
const materi = require('./api-materi');
const reward = require('./api-reward');

const app = express();
const PORT = process.env.PORT || 3000;

// app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.use(express.json());
app.use('/users', users);
app.use('/materi', materi);
app.use('/reward', reward);