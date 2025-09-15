// URL Shortener Microservice — FCC project (WaldoXP)
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// static + landing page
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', (req, res) => res.sendFile(process.cwd() + '/views/index.html'));

// body parsers for form + JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// optional sample endpoint
app.get('/api/hello', (req, res) => res.json({ greeting: 'hello API' }));

// --- In-memory store (satisfies FCC tests; persistence not required) ---
const originalToShort = new Map();
const shortToOriginal = new Map();
let nextId = 1;

// POST /api/shorturl  -> { original_url, short_url }
app.post('/api/shorturl', (req, res) => {
  const input = req.body?.url;

  // validate: must be a valid http(s) URL
  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    return res.json({ error: 'invalid url' });
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return res.json({ error: 'invalid url' });
  }

  // idempotent: return existing short if already stored
  if (originalToShort.has(input)) {
    return res.json({ original_url: input, short_url: originalToShort.get(input) });
  }

  const id = nextId++;
  originalToShort.set(input, id);
  shortToOriginal.set(id, input);

  res.json({ original_url: input, short_url: id });
});

// GET /api/shorturl/:id -> redirect
app.get('/api/shorturl/:id', (req, res) => {
  const id = Number(req.params.id);
  const target = shortToOriginal.get(id);
  if (!target) return res.status(404).json({ error: 'No short URL found for the given input' });
  return res.redirect(target);
});

app.listen(PORT, () => console.log(`URL Shortener listening on ${PORT}`));
