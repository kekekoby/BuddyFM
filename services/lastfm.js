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

	const web_params = { ...params, format: "json", api_sig: api_sig };
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
	const params = { api_key: API_KEY, user: user, from: from, to: to, format: 'json' };
	const queryString = new URLSearchParams(params).toString();
	const url = `${BASE_URL}?method=user.getrecenttracks&${queryString}`;

	try {
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`); }

		const data = await response.json();

		try {
			return { tracks: data.recenttracks.track, total_pages: parseInt(data.recenttracks['@attr'].totalPages, 10);
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
}

module.exports = {
	API_KEY,
	SHARED_SECRET,
	BASE_URL,
	signRequest,
	getSession,
};