// Minimal Express server to serve the site
// Usage:
//   npm install
//   npm run dev   (development, with nodemon)
//   npm start     (production)
// Environment:
//   PORT - optional port number (default 3050)

const express = require('express');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3050;

// Security hardening via helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // keep disabled since we’re serving simple static assets and want to avoid CSP friction
  })
);

// Hide X-Powered-By
app.disable('x-powered-by');

// Optional additional headers (tweak as needed)
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  next();
});

// Serve static files from the project's public folder.
// Your logo path: public/Static/logo.png => available as /Static/logo.png
app.use(express.static(path.join(__dirname, 'public')));

// Fallback for unknown paths — serve index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Site running: http://localhost:${PORT} (PORT=${PORT})`);
});
