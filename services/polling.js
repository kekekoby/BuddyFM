const db = require('../db/index.js');
const { getLatestTrack, scrobbleTracks, updateNowPlaying } = require('./lastfm.js');

async function poll() {
	const active_sessions = db.prepare("SELECT * FROM user_connections WHERE status = 'active'").all();

	for (const session of active_sessions) { // in case theres mutlipel??? restrict to only one session later
		try {
			const latest = await getLatestTrack(session.to_fetch_user);
			if (!latest) continue;

			const is_track_changed = latest.name !== session.curr_track || latest.artist !== session.curr_artist;
			if (!is_track_changed) continue;

			const receiving_user = db.prepare('SELECT session_key FROM users WHERE lastfm_username = ?').get(session.to_receive_user);
			if (!receiving_user) continue;

			// new now playing for fetched user, scrobble the last track saved in the db
			if (session.curr_track && session.curr_artist) {
				await scrobbleTracks(receiving_user.session_key, [{
					artist: session.curr_artist,
					track: session.curr_track,
					timestamp: session.curr_startsat
				}]);
			}

			await updateNowPlaying(receiving_user.session_key, { artist: latest.artist, track: latest.name });

			db.prepare(`
				UPDATE user_connections
				SET curr_artist = ?, curr_track = ?, curr_startsat = ?
				WHERE id = ?
			`).run(latest.artist, latest.name, Math.floor(Date.now() / 1000), session.id);
		} catch (error) { console.error(`Error: ${error}`); }
	}
}

async function startPoll() {
	setInterval(poll, 20000);
	console.log('poller started');
}

module.exports = { startPoll  };