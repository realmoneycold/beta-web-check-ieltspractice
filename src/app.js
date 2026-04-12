const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const apiRoutes = require('./routes');

dotenv.config();

const app = express();

// Configure multer for file uploads
app.use('/uploads', express.static('uploads'));

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api', apiRoutes);

// ─── Explicit HTML Page Routes (BEFORE static, to prevent static from taking over) ───
// Add specific route for teacher dashboard
app.use('/teacher-dashboard', express.static(path.join(__dirname, '..', 'teacher-dashboard')));

// Add specific route for student dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dashboard.html'));
});

// Primary login page — serve ROOT login.html (login/login.html is deprecated)
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'login.html'));
});


// Add specific route for signup page
app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'login', 'signup.html'));
});

// Add specific route for verify-email page
app.get('/verify-email.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'login', 'verify-email.html'));
});

// Add specific route for forgot-password page
app.get('/forgot-password.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'login', 'forgot-password.html'));
});

// Teacher dashboard route
app.get('/teacher/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'teacher-dashboard', 'teacher-dashboard.html'));
});

// SECURITY: Disable normal staff links - redirect to login or 404
app.get('/admin/dashboard', (req, res) => {
  res.redirect('/login.html');
});
app.get('/ceo/dashboard', (req, res) => {
  res.redirect('/login.html');
});

// HIDDEN STAFF LINKS - Secure access routes
app.get('/admin-77x', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'admin.html'));
});
app.get('/ceo-99', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'ceo.html'));
});
app.get('/teacher-x72', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'teacher-dashboard', 'teacher-dashboard.html'));
});

app.get('/', (req, res) => res.sendFile('index.html', { root: '.' }));

// Serve static frontend (HTML, CSS, JS, assets) from project root
app.use(express.static('.', { index: false }));

module.exports = app;

