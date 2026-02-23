// Vercel serverless function: forwards all /api/* requests to the Express app
const app = require('../server/app');
module.exports = app;
