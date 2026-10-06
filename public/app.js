const cursorGlow = document.querySelector('.cursor-glow');
window.addEventListener('pointermove', (e) => {
  if (cursorGlow) {
    cursorGlow.style.left = `${e.clientX}px`;
    cursorGlow.style.top = `${e.clientY}px`;
  }
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i * 50, 250)}ms`;
  observer.observe(el);
});

const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.desktop-nav');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  nav?.classList.toggle('mobile-open', !open);
});

document.querySelectorAll('.desktop-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    menu?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('mobile-open');
  });
});

// Featured game slider: Pro League Soccer first, then Pro Kick Soccer.
const slides = [...document.querySelectorAll('.hero-slide')];
const dots = [...document.querySelectorAll('.hero-dot')];
let currentSlide = 0;
let sliderTimer;

function videoUrl(id) {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`;
}

function loadVideo(slide) {
  const iframe = slide.querySelector('iframe');
  if (!iframe || iframe.src) return;
  iframe.src = videoUrl(slide.dataset.video);
}

function unloadVideo(slide) {
  const iframe = slide.querySelector('iframe');
  if (iframe) iframe.removeAttribute('src');
}

function showSlide(index) {
  if (!slides.length) return;
  currentSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === currentSlide);
    if (i !== currentSlide) unloadVideo(slide);
  });

  dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
  loadVideo(slides[currentSlide]);

  clearTimeout(sliderTimer);
  sliderTimer = setTimeout(() => showSlide(currentSlide + 1), 10000);
}

dots.forEach((dot, index) => {
  dot.addEventListener('click', () => showSlide(index));
});

showSlide(0);

// Pause automatic switching while the pointer is over the controls.
const heroControls = document.querySelector('.hero-slide-controls');
heroControls?.addEventListener('mouseenter', () => clearTimeout(sliderTimer));
heroControls?.addEventListener('mouseleave', () => {
  clearTimeout(sliderTimer);
  sliderTimer = setTimeout(() => showSlide(currentSlide + 1), 10000);
});

// Games section picker: switch the logo, artwork and store links without leaving the page.
const gamePickerButtons = [...document.querySelectorAll('.game-picker-btn')];
const gameShowcaseCards = [...document.querySelectorAll('.game-showcase-card')];
const gameNumber = document.querySelector('.game-number');
const showcaseTitle = document.querySelector('.showcase h2');
const showcaseCopy = document.querySelector('.showcase-copy>p:not(.eyebrow)');
const showcaseTags = document.querySelector('.tag-row');

const showcaseData = {
  pls: {
    number: '01',
    title: 'TWO GAMES.<br /><em>ONE STUDIO.</em>',
    copy: 'Pro League Soccer puts you in control with deep football simulation, squad building and customization across Android and iOS.',
    tags: ['PRO LEAGUE SOCCER', 'ANDROID + IOS', 'FOOTBALL SIMULATION']
  },
  pks: {
    number: '02',
    title: 'FAST FOOTBALL.<br /><em>PURE ACTION.</em>',
    copy: 'Pro Kick Soccer is built for quick matches, sharp moments and accessible football action across Android and iOS.',
    tags: ['PRO KICK SOCCER', 'ANDROID + IOS', 'FAST MATCHES']
  }
};

function chooseGame(game) {
  const data = showcaseData[game];
  if (!data) return;
  gamePickerButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.gameChoice === game));
  gameShowcaseCards.forEach(card => {
    const selected = card.dataset.showcaseGame === game;
    card.classList.toggle('hidden', !selected);
    if (selected) { card.style.animation = 'none'; void card.offsetWidth; card.style.animation = ''; }
  });
  if (gameNumber) gameNumber.textContent = data.number;
}

gamePickerButtons.forEach(btn => btn.addEventListener('click', () => chooseGame(btn.dataset.gameChoice)));
chooseGame('pls');

// Contact form: reveal bug-specific fields and provide a safe local/demo submission flow.
const contactTopic = document.querySelector('#contactTopic');
const bugFields = document.querySelector('#bugFields');
const bugAttachment = document.querySelector('#bugAttachment');
const contactForm = document.querySelector('#contactForm');
const formStatus = document.querySelector('#formStatus');

function toggleBugFields() {
  const isBug = contactTopic?.value === 'bug-report';
  if (bugFields) bugFields.hidden = !isBug;
  if (!isBug && bugAttachment) bugAttachment.value = '';
}
contactTopic?.addEventListener('change', toggleBugFields);
toggleBugFields();

contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }

  if (bugAttachment?.files?.[0] && bugAttachment.files[0].size > 10 * 1024 * 1024) {
    if (formStatus) { formStatus.textContent = 'The screenshot must be 10 MB or smaller.'; formStatus.classList.add('error'); }
    return;
  }

  // The form UI is ready for a real mail provider. Keep the demo honest instead of pretending
  // an email was sent when no provider credentials have been configured.
  if (formStatus) {
    formStatus.classList.remove('error');
    formStatus.textContent = 'Form validated. Connect your preferred email/form provider to receive submissions.';
  }
});

// Footballer Name Generator
(() => {
  const countryEl = document.querySelector('#nameCountry');
  const countEl = document.querySelector('#nameCount');
  const countValueEl = document.querySelector('#nameCountValue');
  const ratioEl = document.querySelector('#newNameRatio');
  const ratioValueEl = document.querySelector('#newNameRatioValue');
  const avoidRepeatsEl = document.querySelector('#avoidSessionRepeats');
  const generateEl = document.querySelector('#generateNames');
  const copyEl = document.querySelector('#copyNames');
  const listEl = document.querySelector('#nameList');
  const generatedCountEl = document.querySelector('#generatedCount');

  if (!countryEl || !countEl || !ratioEl || !generateEl || !listEl) return;

  const SESSION_KEY = 'rasu_generated_footballer_names_v2';
  let nameData = null;
  let generatedNames = [];

  const normalizeName = (value) => value.toLocaleLowerCase('en-US').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const capitalize = (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

  function getSessionNames() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]'); }
    catch { return []; }
  }
  function saveSessionNames(names) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(names)); } catch {}
  }

  function updateControls() {
    if (countValueEl) countValueEl.textContent = countEl.value;
    if (ratioValueEl) ratioValueEl.textContent = `${ratioEl.value}%`;
  }
  countEl.addEventListener('input', updateControls);
  ratioEl.addEventListener('input', updateControls);
  updateControls();

  function validSynthetic(value) {
    if (!value || value.length < 4 || value.length > 15) return false;
    if (/[^a-zA-ZÀ-ÿ]/.test(value)) return false;
    if (/(.)\1\1/.test(value.toLowerCase())) return false;
    if (/[bcdfghjklmnpqrstvwxyz]{4}/i.test(value)) return false;
    if (/[aeiouy]{4}/i.test(value)) return false;
    return true;
  }

  function syntheticFirstName(country) {
    const used = new Set(country.firstNames.map(normalizeName));
    for (let i = 0; i < 80; i += 1) {
      const syllable = randomItem(country.syllables);
      const ending = randomItem(country.endings);
      const candidate = capitalize(`${syllable}${ending}`);
      const key = normalizeName(candidate);
      if (validSynthetic(candidate) && !used.has(key)) return candidate;
    }
    return randomItem(country.firstNames);
  }

  function realFirstName(country) {
    return randomItem(country.firstNames);
  }

  function makePlayer(country, makeNew) {
    const first = makeNew ? syntheticFirstName(country) : realFirstName(country);
    const last = randomItem(country.lastNames);
    return { name: `${first} ${last}`, type: makeNew ? 'NEW' : 'REAL' };
  }

  async function loadNames() {
    if (nameData) return nameData;
    try {
      const response = await fetch('./names.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`names.json returned ${response.status}`);
      nameData = await response.json();
      if (!nameData?.countries) throw new Error('Invalid names.json structure');
      return nameData;
    } catch (error) {
      console.error('Footballer Name Generator: names.json could not be loaded.', error);
      if (listEl) listEl.innerHTML = '<div class="name-empty">Could not load names.json. Run the site through a local web server (for example: python -m http.server).</div>';
      return null;
    }
  }

  function render(names) {
    generatedNames = names;
    if (generatedCountEl) generatedCountEl.textContent = `${names.length} ${names.length === 1 ? 'NAME' : 'NAMES'}`;
    if (copyEl) copyEl.disabled = names.length === 0;
    if (!names.length) {
      listEl.innerHTML = '<div class="name-empty">No unique names are available with the current session settings.</div>';
      return;
    }
    listEl.innerHTML = names.map((entry, index) => `
      <div class="generated-name" style="animation-delay:${Math.min(index * 25, 250)}ms">
        <span class="generated-name-number">${String(index + 1).padStart(2, '0')}</span>
        <span class="generated-name-text">${escapeHtml(entry.name)}</span>
        <span class="name-type">${entry.type}</span>
      </div>`).join('');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
  }

  async function generate() {
    generateEl.disabled = true;
    const data = await loadNames();
    if (!data) { generateEl.disabled = false; return; }

    const country = data.countries[countryEl.value];
    const count = Math.max(1, Math.min(20, Number(countEl.value) || 1));
    const newRatio = Math.max(0, Math.min(100, Number(ratioEl.value) || 0));
    const avoidSessionRepeats = Boolean(avoidRepeatsEl?.checked);
    const sessionNames = new Set(avoidSessionRepeats ? getSessionNames() : []);
    const batchNames = new Set();
    const result = [];

    // Try substantially more candidates than requested, then stop safely.
    for (let attempts = 0; attempts < count * 150 && result.length < count; attempts += 1) {
      const makeNew = Math.random() * 100 < newRatio;
      const player = makePlayer(country, makeNew);
      const key = normalizeName(player.name);
      if (!key || batchNames.has(key) || sessionNames.has(key)) continue;
      batchNames.add(key);
      result.push(player);
    }

    if (avoidSessionRepeats) saveSessionNames([...sessionNames, ...result.map((entry) => normalizeName(entry.name))]);
    render(result);
    generateEl.disabled = false;
  }

  async function copyAll() {
    if (!generatedNames.length) return;
    const text = generatedNames.map((entry) => entry.name).join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    const original = copyEl.innerHTML;
    copyEl.innerHTML = 'COPIED ✓';
    setTimeout(() => { copyEl.innerHTML = original; }, 1400);
  }

  generateEl.addEventListener('click', generate);
  copyEl?.addEventListener('click', copyAll);
})();
