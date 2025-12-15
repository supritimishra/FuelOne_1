// Simple requester for /api/tanker-sales
require('dotenv').config();
const fetch = global.fetch || require('node-fetch');

(async function(){
  try {
    const res = await fetch('http://127.0.0.1:5000/api/tanker-sales');
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Non-JSON response:\n', text);
    }
  } catch (err) {
    console.error('Request failed:', err.message || err);
    process.exitCode = 1;
  }
})();
