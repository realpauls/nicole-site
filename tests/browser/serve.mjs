// Serves public/ like Cloudflare Pages: the "/*" headers from public/_headers, and 404.html for missing pages.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
import { PUBLIC, siteHeaders } from '../lib/site.mjs';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.txt': 'text/plain', '.xml': 'application/xml' };
const port = Number(process.argv[2] ?? 4173);

createServer(async (req, res) => {
  const headers = { ...siteHeaders(), 'cache-control': 'no-store' };
  delete headers['strict-transport-security']; // meaningless over plain http
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (path.endsWith('/')) path += 'index.html';
  try {
    if (path.includes('..') || path.includes('/_headers')) throw new Error('not served');
    const body = await readFile(join(PUBLIC, path));
    const type = TYPES[extname(path)] ?? 'application/octet-stream';
    // Byte ranges, like Cloudflare: Safari only plays video from servers that support them.
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
    if (range) {
      const start = range[1] ? Number(range[1]) : body.length - Number(range[2]);
      const end = range[1] && range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
      res.writeHead(206, { ...headers, 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${body.length}`, 'content-length': end - start + 1 });
      return res.end(body.subarray(start, end + 1));
    }
    res.writeHead(200, { ...headers, 'content-type': type, 'accept-ranges': 'bytes' });
    res.end(body);
  } catch {
    res.writeHead(404, { ...headers, 'content-type': TYPES['.html'] });
    res.end(await readFile(join(PUBLIC, '404.html')));
  }
}).listen(port, '127.0.0.1');
