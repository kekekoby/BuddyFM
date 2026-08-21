const express = require('express');
const router = express.Router();

const { getAllRecentTracks, scrobbleTracks } = require('../services/lastfm.js');
const db = require('../db/index.js');

router.post('/transfer', async (req, res) => {
	if (!req.session.username) { return res.status(401).json({ error: 'Not logged in' }); }

	const { source_user, from, to } = req.body;

	const HRS24 = 24 * 60 * 60;
	if (to - from > HRS24) { return res.status(400).json({ error: "Date range cannot go over 24 hours" }); }
	if (from > to) { return res.status(400).json({ error: "To cannot be earlier than from" }); }

	const user = db.prepare('SELECT session_key FROM users WHERE lastfm_username = ?').get(req.session.username);
	if (!user) { return res.status(401).json({ error: 'User not found, please log in again' }); }

	const fetched_tracks = await getAllRecentTracks(source_user, from, to);
	const formatted_tracks = fetched_tracks
		.filter(track => !(track['@attr'] && track['@attr'].nowplaying === 'true'))
		.map( track => ({
			artist: track.artist['#text'],
			track: track.name,
			timestamp: parseInt(track.date.uts, 10),
	}));

	let result = 0;
	for (let i = 0; i < formatted_tracks.length; i+= 50) {
		result += await scrobbleTracks(user.session_key, formatted_tracks.slice(i, i+50));
	}

	res.json({ message: `Scrobbled ${result} tracks!`});
});

router.post('/sync/start', async (req, res) => {
	if (!req.session.username) { return res.status(401).json({ error: 'Not logged in' }); }

	const { source_user } = req.body;
	const user = db.prepare('SELECT session_key FROM users WHERE lastfm_username = ?').get(req.session.username);

	db.prepare("UPDATE user_connections SET status = 'stopped' WHERE to_receive_user = ? AND status = 'active'")
		.run(req.session.username);

	db.prepare('INSERT INTO user_connections (to_fetch_user, to_receive_user, status) VALUES (?, ?, ?)')
		.run(source_user, req.session.username, 'active');

	res.json({ message: `Listening along with ${source_user}!` });
})

router.post('/sync/stop', async (req, res) => {
	if (!req.session.username) { return res.status(401).json({ error: 'Not logged in' }); }

    const source_user = db.prepare("SELECT to_fetch_user FROM user_connections WHERE to_receive_user = ? AND status = 'active'").get(req.session.username);

	db.prepare("UPDATE user_connections SET status = 'stopped' WHERE to_receive_user = ? AND status = 'active'")
    	.run(req.session.username);

    res.json({ message: `Stopped listening along with ${source_user.to_fetch_user}!` });
})

module.exports = router;