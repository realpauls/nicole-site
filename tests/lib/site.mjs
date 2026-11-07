// Helpers for reading the published site in public/. Node built-ins only (no dependencies).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PUBLIC = fileURLToPath(new URL('../../public/', import.meta.url));

export const read = (file) => readFileSync(join(PUBLIC, file), 'utf8');
export const size = (file) => statSync(join(PUBLIC, file)).size;

// Every file under public/, as forward-slash paths. Walks the filesystem, so it works without git.
export function publicFiles(dir = PUBLIC) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? publicFiles(full) : [relative(PUBLIC, full).split(sep).join('/')];
  }).sort();
}

// The page's markup without comments, <style> and <script> bodies, so placeholders and CSS aren't mistaken for markup.
export function markup(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi, '$1$2');
}

// Visible text only.
export const text = (html) => markup(html).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

// All tags with a given name, each as { tag, attrs }.
export function tags(html, name) {
  const re = new RegExp(`<${name}\\b([^>]*)>`, 'gi');
  return [...markup(html).matchAll(re)].map((m) => ({ tag: m[0], attrs: attrs(m[1]) }));
}

export function attrs(source) {
  const out = {};
  for (const m of source.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return out;
}

// The "/*" block of public/_headers as { header: value }.
export function siteHeaders() {
  const out = {};
  let active = false;
  for (const line of read('_headers').split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!line.startsWith(' ')) { active = line.trim() === '/*'; continue; }
    if (active) {
      const i = line.indexOf(':');
      out[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
    }
  }
  return out;
}

export function csp() {
  const out = {};
  for (const part of siteHeaders()['content-security-policy'].split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (name) out[name] = sources;
  }
  return out;
}

// Width and height of a baseline or progressive JPEG, read from its SOF marker.
export function jpegSize(file) {
  const b = readFileSync(join(PUBLIC, file));
  let i = 2;
  while (i < b.length) {
    const marker = b[i + 1];
    const len = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  throw new Error(`${file}: no JPEG size marker`);
}
