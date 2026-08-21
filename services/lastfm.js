const crypto = require('crypto');

const API_KEY = process.env.LASTFM_API_KEY;
const SHARED_SECRET = process.env.LASTFM_SHARED_SECRET;
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

function signRequest(params) {
	const le_keys = Object.keys(params).sort();
	
	let api_sig = "";
	for (const key of le_keys) {
		api_sig += key;
		api_sig += params[key];
	}
	api_sig += SHARED_SECRET;

	api_sig = crypto.createHash('md5').update(api_sig).digest('hex')

	return api_sig;
}

async function getSession(token) {
	const params = { api_key: API_KEY, method: 'auth.getSession', token };
	const api_sig = signRequest(params);

	const web_params = { ...params, format: 'json', api_sig: api_sig };
	const queryString = new URLSearchParams(web_params).toString();
	const url = `${BASE_URL}?${queryString}`;

	try {
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`); }

		const data = await response.json();

		try {
			return { session_key: data.session.key, session_name: data.session.name };
		} catch (error) { console.error('No session'); return error; }
	} catch (error) { console.error(`Fetch error: ${error}`); return error; }
}

async function getRecentTracks(user, from, to, page) {
	const params = { api_key: API_KEY, user: user, from: from, to: to, page: page, limit: 200, format: 'json' };
	const queryString = new URLSearchParams(params).toString();
	const url = `${BASE_URL}?method=user.getrecenttracks&${queryString}`;

	try {
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`); }

		const data = await response.json();

		try {
			return { tracks: data.recenttracks.track, total_pages: parseInt(data.recenttracks['@attr'].totalPages, 10)};
		} catch (error) { console.error('No session'); return error; }
	} catch (error) { console.error(`Fetch error: ${error}`); return error; }
}

async function getAllRecentTracks(user, from, to) {
	let all_tracks = [];
	let page = 1;
	let total_pages = 1;

	while (page <= total_pages) {
		const result = await getRecentTracks(user, from, to, page);
		all_tracks = all_tracks.concat(result.tracks);
		total_pages = result.total_pages;
		page++;
	}

	return all_tracks;
}

async function getLatestTrack(user) {
	const params = { api_key: API_KEY, user: user, limit: 1, page: 1, format: 'json'};
	const queryString = new URLSearchParams(params).toString();
	const url = `${BASE_URL}?method=user.getrecenttracks&${queryString}`;

	const response = await fetch(url);
	if (!response.ok) throw new Error(`Error: ${response.status}`);
	const data = await response.json();

	const track = data.recenttracks.track[0];

	if (!track) return null;
	return { artist: track.artist['#text'], name: track.name, nowPlaying: !!(track['@attr'] && track['@attr'].nowplaying === 'true') };
}

// can only process up to 50 tracks
async function scrobbleTracks(session_key, tracks) {
	const params = { api_key: API_KEY, sk: session_key, method: 'track.scrobble' };
	let num_scrobbles = 0;

	tracks.forEach((track, i) => {
		params[`artist[${i}]`] = track.artist;
		params[`track[${i}]`] = track.track;
		params[`timestamp[${i}]`] = track.timestamp;
	});

	const api_sig = signRequest(params);
	const web_params = { ...params, format: 'json', api_sig: api_sig };

	try {
		const response = await fetch(BASE_URL, { method: 'POST', body: new URLSearchParams(web_params) });
		if (!response.ok) { throw new Error(`Error: ${response.status}`); }

		const data = await response.json();

		if (!data.scrobbles) {
			console.error(`Error: ${data.message}`);
			return data.message;
		}

		const raw = data.scrobbles.scrobble;
		const results = Array.isArray(raw) ? raw : [raw];

		results.forEach((result) => {
			const entry = { artist: result.artist['#text'],
							track: result.track['#text'],
							timestamp: parseInt(result.timestamp, 10) };
			num_scrobbles += 1;

		});

		return num_scrobbles;
	} catch (error) { console.error(`Error: ${error}`); return error; }
}

async function updateNowPlaying(session_key, track) {
	const params = { api_key: API_KEY, sk: session_key, method: 'track.updateNowPlaying', artist: track.artist, track: track.track };
	const api_sig = signRequest(params);
	const web_params = { ...params, format: 'json', api_sig: api_sig };

	try {
		const response = await fetch(BASE_URL, { method: 'POST', body: new URLSearchParams(web_params)});
		if (!response.ok) { throw new Error(`Error ${response.status}`); }

		const data = await response.json();
		return data.nowplaying;
	} catch (error) { console.error(`Error: ${error}`); return error; }
}

module.exports = {
	API_KEY,
	SHARED_SECRET,
	BASE_URL,
	signRequest,
	getSession,
	getAllRecentTracks,
	scrobbleTracks,
	getLatestTrack,
	updateNowPlaying,
};