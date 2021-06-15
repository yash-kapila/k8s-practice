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

const server = app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));