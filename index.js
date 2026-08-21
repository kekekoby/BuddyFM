require('./db');
require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const session = require('express-session');

const authRoutes = require('./routes/auth.js');
const scrobbleRoutes = require('./routes/scrobble.js');
const { startPoll } = require('./services/polling.js');

app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: { maxAge: 1000 * 60 * 60 * 24 * 7, secure: true, sameSite: 'lax' },
  })
);

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', authRoutes);
app.use('/', scrobbleRoutes);
startPoll();

app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
