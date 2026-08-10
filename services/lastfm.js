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