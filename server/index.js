const path = require('path');
const express = require('express');
const app = require('./app');

const DEFAULT_PORT = 3000;

// Serve static files from parent/public (local dev only)
app.use(express.static(path.join(__dirname, '..', 'public')));

// SPA: serve index.html for all other routes (local dev only)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`B & K Group server running at http://localhost:${port}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      throw err;
    }
  });
}

if (require.main === module) {
  const port = parseInt(process.env.PORT, 10) || DEFAULT_PORT;
  startServer(port);
}
