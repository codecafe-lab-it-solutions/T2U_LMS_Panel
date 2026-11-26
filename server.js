// Hostinger Express entry: serves the Vite build (dist/) with SPA fallback.
// The API (server/) is a separate Postgres-backed app; point the build at it via VITE_API_URL.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const app = express();
app.use('/assets', express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '1y' }));
app.use(express.static(dist, { index: false }));
app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-cache').sendFile(path.join(dist, 'index.html'));
});
app.listen(process.env.PORT || 3000, () => console.log('T2U frontend up'));
