const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
const serverId = process.env.SERVER_ID || 'local';

app.get('/', (req, res) => {
  res.json({ server: `backend-${serverId}` });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: `backend-${serverId}` });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend ${serverId} running on port ${port}`);
});
