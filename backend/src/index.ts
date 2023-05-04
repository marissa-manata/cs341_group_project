/*
index.ts
Entry point of the backend
*/

import path from 'path';
import app, { server } from './app';

// Import route handlers
import './routes/donation';
import './routes/search';
import './routes/user';
import './routes/event';
import './routes/program';

// Serve bundled frontend
app.all('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

// Listen on port 1234
server.listen(1234, () => {
  console.log('Server listening');
});
