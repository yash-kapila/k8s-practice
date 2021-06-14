'use strict';

const express = require('express');

// Constants
const PORT = 8080;

// App
const app = express();

app.post('/api/log', (req, res) => {
  console.log('API LOGGING!!!');
  res.send('Successfully API logged!!!');
});

app.post('/log', (req, res) => {
  console.log('LOGGING!!!');
  res.send('Successfully logged!!!');
});

app.get('/', (req, res) => {
  res.send('Hello World');
});

const server = app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));