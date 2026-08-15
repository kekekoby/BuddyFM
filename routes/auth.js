const express = require('express');
const router = express.Router();

const { getSession, API_KEY } = require('../services/lastfm.js');
const db = require('../db/index.js');

router.get('/login', (req, res) => {
	const url = `https://www.last.fm/api/auth/?api_key=${API_KEY}&cb=${encodeURIComponent(process.env.LASTFM_CALLBACK_URL)}`;
	res.redirect(url);
})

router.get('/callback', async (req, res) => {
	const token = req.query.token;
	try {
		const session_info = await getSession(token);
		db.prepare('INSERT OR REPLACE INTO users (lastfm_username, session_key) VALUES (?, ?)')
			.run(session_info.session_name, session_info.session_key);
		req.session.username = session_info.session_name;
	} catch (error) { console.error(`Error: ${error}`); return error; }
	res.redirect(`/`);
})

module.exports = router;