export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.json({ 
    message: 'Auth endpoint working!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
}
