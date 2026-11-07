// Single source of truth for the facts, URLs, settings and budgets the tests check.
// When something on the site changes on purpose, change it here too (see CLAUDE.md).

// GitHub Pages review copy for now (Paul, 2026-11-06). Becomes Nicole's own domain on Cloudflare.
export const SITE = 'https://realpauls.github.io/nicole-site';

// Flip to true on launch day: the tests then require noindex to be gone, canonical/og:url to be set and no draft placeholders.
export const LAUNCHED = false;

// No Formspree form yet: the page posts to YOUR_FORM_ID, and site.js says the form isn't connected instead of sending.
// Once Paul creates the form, put its id here and in index.html, set connected: true, and bring back the template site's send tests.
export const FORMSPREE_ID = 'YOUR_FORM_ID';
export const FORM = {
  id: 'contact-form',
  opener: '.js-open-contact',
  action: `https://formspree.io/f/${FORMSPREE_ID}`,
  connected: false,
  required: ['name', 'email', 'message'],
  optional: ['company'],
  honeypot: '_gotcha',
  subject: "New message from Nicole's website",
  thanks: 'Thanks! Your message is on its way to Nicole.',
  notConnected: 'The contact form isn’t connected yet. Please reach Nicole on LinkedIn for now.',
};

export const LINKEDIN = 'https://www.linkedin.com/in/nicole-foley-/';

// Every file allowed in public/ (the whole published website). Anything else fails the build.
export const PUBLIC_FILES = [
  '404.html',
  '_headers',
  'images/nicole-headshot.jpg',
  'images/nicole-ny-ad-week.jpg',
  'images/share-card-b.jpg',
  'images/wicked-green-cars.jpg',
  'index.html',
  'robots.txt',
  'site.js',
  'sitemap.xml',
];

// Hosts the page may link to or load from.
export const ALLOWED_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'formspree.io',
  'www.linkedin.com',
  'realpauls.github.io',
];

// Content-Security-Policy directives that must keep exactly these sources (same as the template site, including
// Cloudflare Web Analytics; drop those two if analytics stays off).
export const CSP = {
  'default-src': ["'self'"],
  'script-src': ["'self'", 'https://static.cloudflareinsights.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ['https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https://formspree.io', 'https://cloudflareinsights.com'],
  'form-action': ['https://formspree.io'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
};

// Size budgets in bytes.
export const BUDGET = {
  html: 60_000,
  js: 10_000,
  image: 350_000,
};

export const SHARE_CARD = { file: 'images/share-card-b.jpg', width: 1200, height: 630 };

// Facts that must appear on the page. Source so far: her LinkedIn (screenshot via Paul, 2026-11-06). Her résumé will win where they differ.
export const CONTENT = [
  'Nicole Foley',
  'Senior Account Executive',
  'Lime Media',
  'experiential marketing',
  'Greater Philadelphia',
  'University of Delaware',
  // her LinkedIn experience (screenshots via Paul, 2026-11-07)
  'Carvertise',
  'Digitas Health',
  '$0.7M+ in social media and print campaigns for GSK',
  '16 million impressions and 58K landing page views',
  'first TikTok campaign: a 24% response rate, 8% above industry benchmarks',
  'The Media Dinner Club',
  'Monday Girl',
  '40 bright green Wicked cars',
];

// The Experience timeline, newest first, with dates exactly as on her LinkedIn (2026-11-07). Pango Financial is dated
// from her clients' 2020 reviews. The Wicked green cars (July 2025) were at Carvertise, not Lime Media.
export const EXPERIENCE = [
  ['SEP 2026 — PRESENT', 'Senior Account Executive · Lime Media · Remote'],
  ['DEC 2025 — PRESENT', 'Account Executive · Seen Media Group · New York'], // ⏳ LinkedIn still says Present; ask Nicole
  ['JUN 2025 — PRESENT', 'Philadelphia Lead · The Media Dinner Club · Freelance'],
  ['JAN 2025 — DEC 2025', 'Agency Programs Manager · Carvertise'],
  ['MAR 2022 — JAN 2025', 'Account Executive · Digitas Health · Philadelphia'],
  ['OCT 2021 — APR 2022', 'Digital Account Executive · Creative Solutions International'],
  ['2020', 'Account Executive · Pango Financial'],
  ['2018 — 2020', 'Social media, content & sales · Tribe Kelley, Dallas Shaw, Uncommon James · Nashville'],
  ['2016 — 2017', 'Early career · Victoria’s Secret PINK, Ross Stores, United Nations Project Xite, FashInvest'],
  ['EDUCATION', 'University of Delaware'],
];

// "Kind words": three short quotes from her Pango Financial clients' 2020 reviews (her LinkedIn, via Paul 2026-11-07).
// Reviewers are private people, so the site never names them: every quote is credited the same way.
export const QUOTES = {
  credit: 'Pango Financial client, 2020',
  quotes: [
    '“I always felt that I had an advocate at Pango.”',
    '“She even called me within 24 hours to update me on the progress of my loan application.”',
    '“She was kind, attentive and very patient with me. Give her a raise ASAP!!”',
  ],
};

// "What she brings", in order, all plain (no highlighted pills), from her LinkedIn roles (2026-11-07).
export const SKILLS = ['Experiential marketing', 'Mobile out-of-home', 'Pop-ups & brand activations', 'Agency partnerships',
  'Account management', 'Social media strategy', 'Healthcare marketing', 'Paid social & search',
  'Content & photography', 'Influencer campaigns', 'Cross-functional teams', 'Legal & regulatory review'];

// Nicole is not job hunting (Paul, 2026-11-06: she just started at Lime Media), so nothing may suggest she's looking.
// Her phone and personal email never go on the site; contact is the form and LinkedIn.
export const FORBIDDEN = [
  /open to (work|new)/i,
  /new opportunit/i,
  /job (hunt|search)/i,
  /looking for (a )?(new )?(job|role|position)/i,
  /next role/i,
  /available for hire/i,
  /mailto:/i,
  /tel:/i,
];

// Nothing copied from the template site may be left behind: its old colors, and (as sha256 prefixes, so this public repo
// doesn't name them) the template site's owner's names, employer, domain and form id.
export const LEFTOVERS = [/#7c3aed/i, /purple/i, /NYPD/];
export const LEFTOVER_WORD_HASHES = ['81ccc0de58dd19cf', 'b8b22aedc372aa89', 'ee58f33c8d93429f', 'e44bb89c8125ff4b', '66f86b1f3c61159b'];

// The intro is option B "Marquee", Nicole's pick from four designs (via Paul, 2026-11-07): her name as the headline,
// the brand line with a lime highlight, three photos fanned with her headshot on top, and a ticker of highlights.
export const INTRO = {
  name: 'Nicole Foley',
  tagline: 'Making brands impossible to miss, in the real world.',
  highlight: 'impossible to miss',
  photos: ['images/wicked-green-cars.jpg', 'images/nicole-ny-ad-week.jpg', 'images/nicole-headshot.jpg'], // back to front
  ticker: ['Wicked green cars', 'Times Square', 'NY Ad Week', 'Philadelphia Ad Club', 'Monday Girl', 'Lime Media', 'Experiential marketing'],
};

// The 5 chapters, in page order (the template site's layout, Paul 2026-11-06). Both the desktop names and the phone picker list them all.
export const CHAPTERS = [
  { id: 'intro', label: 'Intro' }, { id: 'about', label: 'About' }, { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' }, { id: 'contact', label: 'Contact' },
];
