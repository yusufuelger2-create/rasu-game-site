// Optional Node proxy for SoFIFA.
// Run with: node server.js
// Then open http://localhost:8080
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const PORT = process.env.PORT || 8080;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp' };

function cleanText(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPlayerRecords(source) {
  const records = [];
  const seen = new Set();
  const decode = (value) => String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
  const countryKey = (value) => {
    const t = decode(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const map = { germany:['germany','deutschland','almanya'], england:['england','united kingdom','great britain','ingiltere'], france:['france','frankreich','fransa'], spain:['spain','espana','spanien','ispanya'], brazil:['brazil','brasil','brasilien','brezilya'], turkey:['turkey','turkiye','turkei','turkiye'] };
    for (const [k, vals] of Object.entries(map)) if (vals.some(v => t.includes(v.normalize('NFD').replace(/[\u0300-\u036f]/g,'')))) return k;
    return null;
  };
  const add = (name, country = null) => {
    const clean = decode(name).replace(/^\d+\s+/, '');
    if (!clean || clean.length < 3 || clean.length > 80) return;
    if (/^(name|age|overall|potential|squad|team|contract|value|wage)$/i.test(clean)) return;
    const key = clean.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if (seen.has(key)) return; seen.add(key); records.push({name:clean,countryKey:country || null});
  };

  // SoFIFA HTML player links.
  const htmlLink = /<a\b[^>]*href=["'][^"']*\/player\/[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = htmlLink.exec(source))) {
    const raw = m[1];
    const before = source.slice(Math.max(0, m.index - 2500), m.index);
    const after = source.slice(m.index, Math.min(source.length, m.index + 2500));
    const around = before + after;
    const cm = around.match(/(?:alt|title)=["']([^"']+)["']/i);
    add(raw, countryKey(cm ? cm[1] : ''));
  }

  // Readable/Markdown form.
  const md = /\[([^\]]+)\]\(https?:\/\/[^\s)]+\/player\/[^)]+\)/gi;
  while ((m = md.exec(source))) add(m[1]);

  // Plain text form from readable mirrors.
  const plain = /https?:\/\/[^\s)]+\/player\/[^\n]+\n([^\n]{3,80})/gi;
  while ((m = plain.exec(source))) add(m[1]);
  return records;
}

async function fetchText(target, url, headers = {}) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      ...headers
    },
    redirect: 'follow'
  });
  if (!response.ok) throw new Error(`${target} returned HTTP ${response.status}`);
  return response.text();
}

async function proxySofifa(target) {
  const parsed = new URL(target);
  if (parsed.hostname !== 'sofifa.com' || !/^\/team\/\d+\/[^/]+\/?$/.test(parsed.pathname)) {
    throw new Error('Only SoFIFA /team/{id}/{slug} URLs are allowed.');
  }
  const attempts = [
    () => fetchText('SoFIFA', target),
    () => fetchText('Jina', `https://r.jina.ai/${target}`, {'Accept':'text/plain,text/markdown;q=0.9,*/*;q=0.8'})
  ];
  const errors=[];
  for (const attempt of attempts) {
    try {
      const text = await attempt();
      const records = extractPlayerRecords(text);
      if (records.length) return {records, source:'sofifa'};
      errors.push('page returned but no SoFIFA player links were found');
    } catch (e) { errors.push(e.message); }
  }
  throw new Error(`Could not extract SoFIFA player names. ${errors.join(' | ')}`);
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    if (requestUrl.pathname === '/api/sofifa') {
      const target = requestUrl.searchParams.get('url');
      if (!target) { res.writeHead(400, {'Content-Type':'application/json'}); return res.end(JSON.stringify({error:'Missing url'})); }
      try {
        const result = await proxySofifa(target);
        res.writeHead(200, {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store'});
        return res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(502, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({error:error.message}));
      }
    }

    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === '/') pathname = '/index.html';
    const file = path.join(ROOT, pathname);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, {'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
  } catch (error) {
    res.writeHead(500); res.end('Server error');
  }
});
server.listen(PORT, () => console.log(`Rasu Games site: http://localhost:${PORT}`));
