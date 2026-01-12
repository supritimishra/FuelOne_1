import "dotenv/config";
import express from "express";

const app = express();
const PORT = 5000;

app.get('/test', (req, res) => {
  res.json({ ok: true, message: 'Server is working!' });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Simple test server running on http://0.0.0.0:${PORT}`);
  console.log('Test it: curl http://localhost:5000/test');
});

