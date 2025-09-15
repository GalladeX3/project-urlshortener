// URL Shortener Microservice — FCC (fixed)
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: return 200 on preflight (FCC hint mentions legacy behavior)
app.use(cors({ optionsSuccessStatus: 200 }));

// parse both form and JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// static + landing page
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', (req, res) => res.sendFile(process.cwd() + '/views/index.html'));

// optional sample endpoint
app.get('/api/hello', (req, res) => res.json({ greeting: 'hello API' }));

// --- In-memory store (OK for FCC tests) ---
const originalToShort = new Map();
const shortToOriginal = new Map();
let nextId = 1;

function isValidHttpUrl(value) {
  try {
    const u = new URL(value);
    if (!/^https?:$/.test(u.protocol)) return false;   // http or https only
    if (!u.hostname || !u.hostname.includes('.')) return false; // looks like a domain
    return true;
  } catch {
    return false;
  }
}

// POST -> create/return short code
app.post('/api/shorturl', (req, res) => {
  const input = (req.body && req.body.url) ? String(req.body.url).trim() : '';

  if (!isValidHttpUrl(input)) {
    return res.json({ error: 'invalid url' });
  }

  if (originalToShort.has(input)) {
    return res.json({ original_url: input, short_url: originalToShort.get(input) });
  }

  const id = nextId++;
  originalToShort.set(input, id);
  shortToOriginal.set(id, input);

  res.json({ original_url: input, short_url: id });
});

// GET -> redirect to original
app.get('/api/shorturl/:id', (req, res) => {
  const id = Number(req.params.id);
  const target = shortToOriginal.get(id);

  if (!target) {
    // Some users prefer 404 JSON; FCC doesn't test this path, but it's nice to have:
    return res.status(404).json({ error: 'No short URL found for the given input' });
  }
  return res.redirect(target); // default 302 is fine for FCC
});

app.listen(PORT, () => console.log(`URL Shortener listening on ${PORT}`));
