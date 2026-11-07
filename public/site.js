// Chapters: highlight the one on screen in the top bar, run the phone picker, let ← → jump chapters,
// and above 960px show the chapters as slides.
const chapters = [...document.querySelectorAll('.chapter')];
const bar = document.querySelector('.bar');
const picker = document.getElementById('picker');
const list = document.getElementById('chapter-list');
const scrim = document.getElementById('scrim');
const pad = (i) => String(i + 1).padStart(2, '0');
let current = -1;

function mark(i) {
  if (i === current) return;
  current = i;
  const id = `#${chapters[i].id}`;
  document.querySelectorAll('.names a, .chapter-list a').forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === id)));
  picker.querySelector('.n').textContent = pad(i);
  picker.querySelector('.pl').textContent = chapters[i].dataset.label;
  picker.querySelector('.fill').style.width = `${((i + 1) / chapters.length) * 100}%`;
}
function openList(open) {
  list.hidden = !open;
  scrim.hidden = !open;
  picker.setAttribute('aria-expanded', String(open));
}
picker.addEventListener('click', () => openList(list.hidden));
scrim.addEventListener('click', () => openList(false));
list.addEventListener('click', (e) => { if (e.target.closest('a')) openList(false); });

// The chapter on screen is the last one whose top has passed just under the bar.
function onScroll() {
  if (slides()) return;
  const line = bar.offsetHeight + 80;
  let i = 0;
  chapters.forEach((c, j) => { if (c.getBoundingClientRect().top <= line) i = j; });
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) i = chapters.length - 1;
  mark(i);
}
window.addEventListener('scroll', onScroll, { passive: true });

// Above 960px the chapters become slides: one fills the screen under the bar and the page itself doesn't scroll.
// Scrolling only moves within a long chapter; the names, Next, links and ← → change chapter.
const wide = window.matchMedia('(min-width: 961px)');
const root = document.documentElement;
const slides = () => root.classList.contains('slides');
const chapterOf = (el) => chapters.findIndex((c) => c.contains(el));
const canScroll = (c, dir) => (dir > 0 ? c.scrollTop + c.clientHeight < c.scrollHeight - 1 : c.scrollTop > 0);

function show(i) {
  i = Math.max(0, Math.min(chapters.length - 1, i));
  if (i !== current) chapters.forEach((c, j) => { c.classList.toggle('on', j === i); if (j === i) c.scrollTop = 0; });
  mark(i);
}
function setMode() {
  if (wide.matches === slides()) return;
  root.classList.toggle('slides', wide.matches);
  if (wide.matches) {
    const from = current;
    current = -1;
    show(from);
  } else {
    chapters.forEach((c) => c.classList.remove('on'));
    window.scrollTo({ top: chapters[current].offsetTop - bar.offsetHeight + 1, behavior: 'instant' });
  }
}
const target = location.hash && document.getElementById(location.hash.slice(1));
mark(target && chapterOf(target) >= 0 ? chapterOf(target) : 0);
setMode();
if (!slides()) onScroll();
wide.addEventListener('change', setMode);

// In slides, every in-page link swaps to the chapter that holds its target.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || !slides()) return;
  const i = chapterOf(document.getElementById(a.getAttribute('href').slice(1)));
  if (i < 0) return;
  e.preventDefault();
  show(i);
  history.replaceState(null, '', a.getAttribute('href'));
});

function go(i) {
  i = Math.max(0, Math.min(chapters.length - 1, i));
  if (slides()) show(i);
  else window.scrollTo({ top: chapters[i].offsetTop - bar.offsetHeight + 1 });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { openList(false); return; }
  if (e.target.closest('input, textarea, select, button')) return;
  const c = chapters[current];
  const step = { ArrowRight: 1, ArrowLeft: -1, PageDown: 1, PageUp: -1, ArrowDown: 1, ArrowUp: -1, ' ': 1 }[e.key];
  if (e.key === 'Home' || e.key === 'End') { if (slides()) { e.preventDefault(); go(e.key === 'Home' ? 0 : chapters.length - 1); } return; }
  if (!step) return;
  const leftRight = e.key === 'ArrowRight' || e.key === 'ArrowLeft';
  if (!slides() && !leftRight) return; // the page scrolls as normal
  e.preventDefault();
  // ← → change chapter. In slides, up/down keys and Space only scroll within a long chapter: like the wheel,
  // they never change chapter on their own (only picking a chapter should do that).
  if (leftRight) go(current + step);
  else if (canScroll(c, step)) c.scrollBy({ top: step * (e.key.startsWith('Arrow') ? 80 : c.clientHeight * 0.85), behavior: 'smooth' });
});

// The contact form starts collapsed; "Send a message" or any Contact link opens it.
const contact = document.getElementById('contact-panel');
const form = document.getElementById('contact-form');
const opener = contact.querySelector('.js-open-contact');
function openForm(focus) {
  form.hidden = false;
  contact.classList.add('open');
  opener.setAttribute('aria-expanded', 'true');
  if (focus) form.elements.name.focus({ preventScroll:true });
}
opener.addEventListener('click', () => openForm(true));
document.querySelectorAll('a[href="#contact"]').forEach((a) => a.addEventListener('click', () => openForm(false)));
if (location.hash === '#contact') openForm(false);

// Sends the form to Formspree without leaving the page.
const thanks = { 'contact-form': 'Thanks! Your message is on its way to Nicole.' };
const status = form.querySelector('.form-status');
const button = form.querySelector('button');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.className = 'form-status';
  if (form.action.includes('YOUR_FORM_ID')) {
    status.textContent = 'The contact form isn’t connected yet. Please reach Nicole on LinkedIn for now.';
    status.classList.add('err');
    return;
  }
  button.disabled = true;
  status.textContent = 'Sending…';
  try {
    const res = await fetch(form.action, { method:'POST', body:new FormData(form), headers:{ Accept:'application/json' } });
    if (!res.ok) throw new Error();
    form.reset();
    status.textContent = thanks[form.id];
    status.classList.add('ok');
  } catch {
    status.textContent = 'Something went wrong. Please try again, or reach Nicole on LinkedIn.';
    status.classList.add('err');
  } finally {
    button.disabled = false;
  }
});
