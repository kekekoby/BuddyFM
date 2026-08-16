const express = require('express');
const router = express.Router();

const { getAllRecentTracks, scrobbleTracks } = require('../services/lastfm.js');
const db = require('../db/index.js');

router.post('/transfer', async (req, res) => {
	if (!req.session.username) { return res.status(401).send('Not logged in'); }

	const { source_user, from, to } = req.body;
	const user = db.prepare('SELECT session_key FROM users WHERE lastfm_username = ?').get(req.session.username);

	const fetched_tracks = await getAllRecentTracks(source_user, from, to);
	const formatted_tracks = fetched_tracks
		.filter(track => !(track['@attr'] && track['@attr'].nowplaying === 'true'))
		.map( track => ({
			artist: track.artist['#text'],
			track: track.name,
			timestamp: parseInt(track.date.uts, 10),
	}));

	let result;
	for (let i = 0; i < formatted_tracks.length; i+= 50) {
		result = await scrobbleTracks(user.session_key, formatted_tracks.slice(i, i+50));
	}

	res.json(result);
});

module.exports = router;