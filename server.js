require('./db');
require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const session = require('express-session');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 1 week cookie
  })
);

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
