// URL Shortener Microservice — FCC project
// Implements:
//  - POST /api/shorturl  { url } -> { original_url, short_url }
//  - GET  /api/shorturl/:id       -> 302 redirect to original_url

const express = require('express');
const cors = require('cors');
const dns = require('dns');

const app = express();
app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.urlencoded({ extended: false })); // handle form-encoded bodies
app.use(express.json()); // handle JSON bodies
app.use(express.static('public'));
app.get('/', (req, res) => res.sendFile(__dirname + '/views/index.html'));

// In-memory store: id -> url  (and reverse to avoid duplicates)
let nextId = 1;
const idToUrl = new Map();
const urlToId = new Map();

function isHttpOrHttps(u) {
  return u.protocol === 'http:' || u.protocol === 'https:';
}

// POST /api/shorturl
app.post('/api/shorturl', (req, res) => {
  const input = req.body.url;

  // Basic syntax validation
  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    return res.json({ error: 'invalid url' });
  }

  if (!isHttpOrHttps(parsed)) {
    return res.json({ error: 'invalid url' });
  }

  // DNS lookup on hostname (as FCC hint suggests)
  dns.lookup(parsed.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Deduplicate: reuse an existing id for the same URL
    if (urlToId.has(parsed.href)) {
      const existingId = urlToId.get(parsed.href);
      return res.json({ original_url: parsed.href, short_url: existingId });
    }

    const id = nextId++;
    idToUrl.set(id, parsed.href);
    urlToId.set(parsed.href, id);

    res.json({ original_url: parsed.href, short_url: id });
  });
});

// GET /api/shorturl/:id
app.get('/api/shorturl/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  const url = idToUrl.get(id);
  if (!url) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  return res.redirect(url);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`URL Shortener running on ${PORT}`));
