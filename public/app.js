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

  const NAME_SESSION_KEY = 'rasu_generated_footballer_names_v3';
  const SURNAME_SESSION_KEY = 'rasu_generated_footballer_surnames_v2';
  let nameData = null;
  let generatedNames = [];

  const normalizeName = (value) => String(value || '')
    .toLocaleLowerCase('en-US')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const capitalize = (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

  function getSessionNames() {
    try { return JSON.parse(sessionStorage.getItem(NAME_SESSION_KEY) || '[]'); }
    catch { return []; }
  }

  function saveSessionNames(names) {
    try { sessionStorage.setItem(NAME_SESSION_KEY, JSON.stringify(names)); } catch {}
  }

  // Stored per country so a common surname in one country does not block it in another.
  function getSessionSurnames() {
    try {
      const value = JSON.parse(sessionStorage.getItem(SURNAME_SESSION_KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch { return {}; }
  }

  function saveSessionSurnames(value) {
    try { sessionStorage.setItem(SURNAME_SESSION_KEY, JSON.stringify(value)); } catch {}
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
    if (/(.)\1\1/i.test(value.toLowerCase())) return false;
    if (/[bcdfghjklmnpqrstvwxyz]{4}/i.test(value)) return false;
    if (/[aeiouy]{4}/i.test(value)) return false;
    return true;
  }

  function syntheticFirstName(country) {
    const used = new Set(country.firstNames.map(normalizeName));
    for (let i = 0; i < 120; i += 1) {
      const syllable = randomItem(country.syllables || []);
      const ending = randomItem(country.endings || []);
      const candidate = capitalize(`${syllable}${ending}`);
      const key = normalizeName(candidate);
      if (validSynthetic(candidate) && !used.has(key)) return candidate;
    }
    return randomItem(country.firstNames);
  }

  function realFirstName(country) {
    return randomItem(country.firstNames);
  }

  function pickUnusedSurname(country, blockedSurnames) {
    const pool = country.lastNames || [];
    if (!pool.length) return null;

    // First pass: completely unused surname.
    const available = pool.filter((surname) => !blockedSurnames.has(normalizeName(surname)));
    if (available.length) return randomItem(available);

    // This fallback is only reachable when the surname pool is exhausted.
    // With the current 80+ surnames/country and a max squad size of 20, it should
    // normally never happen during a session.
    return null;
  }

  function makePlayer(country, makeNew, blockedSurnames) {
    const first = makeNew ? syntheticFirstName(country) : realFirstName(country);
    const last = pickUnusedSurname(country, blockedSurnames);
    if (!last) return null;
    return { name: `${first} ${last}`, surname: last, type: makeNew ? 'NEW' : 'REAL' };
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
      listEl.innerHTML = '<div class="name-empty">Could not load names.json. Run the site through a local web server (for example: python -m http.server).</div>';
      return null;
    }
  }

  function render(names) {
    generatedNames = names;
    if (generatedCountEl) generatedCountEl.textContent = `${names.length} ${names.length === 1 ? 'NAME' : 'NAMES'}`;
    if (copyEl) copyEl.disabled = names.length === 0;
    if (!names.length) {
      listEl.innerHTML = '<div class="name-empty">No unique surnames are available with the current session settings. Try another country or turn off session repeat protection.</div>';
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

    const countryKey = countryEl.value;
    const country = data.countries[countryKey];
    if (!country) { generateEl.disabled = false; return; }

    const count = Math.max(1, Math.min(20, Number(countEl.value) || 1));
    const newRatio = Math.max(0, Math.min(100, Number(ratioEl.value) || 0));
    const avoidSessionRepeats = Boolean(avoidRepeatsEl?.checked);

    const sessionNames = new Set(avoidSessionRepeats ? getSessionNames() : []);
    const sessionSurnameMap = getSessionSurnames();
    const countrySessionSurnames = new Set(
      avoidSessionRepeats ? (sessionSurnameMap[countryKey] || []).map(normalizeName) : []
    );

    // Surname uniqueness is enforced even when session protection is OFF: no surname
    // repeats inside the current generated squad.
    const batchSurnames = new Set();
    const batchNames = new Set();
    const blockedSurnames = new Set(countrySessionSurnames);
    const result = [];

    for (let attempts = 0; attempts < count * 250 && result.length < count; attempts += 1) {
      const makeNew = Math.random() * 100 < newRatio;
      const player = makePlayer(country, makeNew, new Set([...blockedSurnames, ...batchSurnames]));
      if (!player) break;

      const nameKey = normalizeName(player.name);
      const surnameKey = normalizeName(player.surname);
      if (!nameKey || !surnameKey || batchNames.has(nameKey) || sessionNames.has(nameKey)) continue;
      if (batchSurnames.has(surnameKey) || countrySessionSurnames.has(surnameKey)) continue;

      batchNames.add(nameKey);
      batchSurnames.add(surnameKey);
      result.push(player);
    }

    if (avoidSessionRepeats) {
      saveSessionNames([...sessionNames, ...result.map((entry) => normalizeName(entry.name))]);
      const existing = new Set(sessionSurnameMap[countryKey] || []);
      result.forEach((entry) => existing.add(normalizeName(entry.surname)));
      sessionSurnameMap[countryKey] = [...existing];
      saveSessionSurnames(sessionSurnameMap);
    }

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

  // SoFIFA real-player alternative names
  const squadTeamNameEl = document.querySelector('#squadTeamName');
  const squadClubIdEl = document.querySelector('#squadClubId');
  const squadSourceUrlPreviewEl = document.querySelector('#squadSourceUrlPreview');
  const loadSquadEl = document.querySelector('#loadSquad');
  const squadStatusEl = document.querySelector('#squadStatus');
  const realPlayerListEl = document.querySelector('#realPlayerList');
  const alternativeCountryLabelEl = document.querySelector('#alternativeCountryLabel');
  const alternativeCountryEl = document.querySelector('#alternativeCountry');
  let realPlayers = [];
  const alternativeNames = new Map();
  const usedAlternativeNames = new Set();

  const countryAliases = {
    germany: ['germany','deutschland','almanya'],
    england: ['england','united kingdom','great britain','ingiltere'],
    france: ['france','frankreich','fransa'],
    spain: ['spain','espana','españa','spanien','ispanya'],
    brazil: ['brazil','brasil','brasilien','brezilya'],
    turkey: ['turkey','türkiye','turkiye','turkei','türkei','türkiye']
  };

  function countryKeyFromText(value) {
    const text = normalizeName(value);
    for (const [key, aliases] of Object.entries(countryAliases)) {
      if (aliases.some((alias) => text.includes(normalizeName(alias)))) return key;
    }
    return null;
  }

  const ENGLISH_FALLBACK_COUNTRY = 'england';

  function resolvePlayerCountryKey(player) {
    const candidate = player?.countryKey;
    if (candidate && nameData?.countries?.[candidate]) return candidate;
    // Any nationality that is not represented in names.json falls back to English.
    return nameData?.countries?.[ENGLISH_FALLBACK_COUNTRY] ? ENGLISH_FALLBACK_COUNTRY : Object.keys(nameData?.countries || {})[0];
  }

  function populateAlternativeCountries() {
    if (!alternativeCountryEl || !nameData?.countries) return;
    const current = alternativeCountryEl.value || countryEl.value || Object.keys(nameData.countries)[0];
    alternativeCountryEl.innerHTML = Object.entries(nameData.countries).map(([key, country]) =>
      `<option value="${escapeHtml(key)}">${escapeHtml(country.label || key)}</option>`
    ).join('');
    alternativeCountryEl.value = nameData.countries[current] ? current : Object.keys(nameData.countries)[0];
    updateAlternativeCountryLabel();
  }

  function updateAlternativeCountryLabel() {
    const key = alternativeCountryEl?.value || countryEl.value;
    const label = nameData?.countries?.[key]?.label || key || '—';
    if (alternativeCountryLabelEl) alternativeCountryLabelEl.textContent = label;
  }

  alternativeCountryEl?.addEventListener('change', updateAlternativeCountryLabel);
  countryEl.addEventListener('change', () => {
    if (alternativeCountryEl && !alternativeCountryEl.value) alternativeCountryEl.value = countryEl.value;
    updateAlternativeCountryLabel();
  });

  const fallbackSquad = [
    { name: 'Ederson', countryKey: 'brazil' },
    { name: 'Tarık Çetin', countryKey: 'turkey' },
    { name: 'Mert Günok', countryKey: 'turkey' },
    { name: 'Engin Can Biterge', countryKey: 'turkey' },
    { name: 'Jayden Oosterwolde', countryKey: 'england' },
    { name: 'Milan Škriniar', countryKey: 'germany' },
    { name: 'Yiğit Efe Demir', countryKey: 'turkey' },
    { name: 'Çağlar Söyüncü', countryKey: 'turkey' },
    { name: 'Kamil Efe Üregen', countryKey: 'turkey' },
    { name: 'Archie Brown', countryKey: 'england' },
    { name: 'Levent Mercan', countryKey: 'turkey' },
    { name: 'Mert Müldür', countryKey: 'turkey' },
    { name: 'Nélson Semedo', countryKey: 'spain' },
    { name: 'İsmail Yüksek', countryKey: 'turkey' },
    { name: 'Edson Álvarez', countryKey: 'spain' },
    { name: 'Fred', countryKey: 'brazil' },
    { name: 'Sofyan Amrabat', countryKey: 'france' },
    { name: 'Sebastian Szymański', countryKey: 'germany' },
    { name: 'İrfan Can Kahveci', countryKey: 'turkey' },
    { name: 'Dorgeles Nene', countryKey: 'france' },
    { name: 'Kerem Aktürkoğlu', countryKey: 'turkey' },
    { name: 'Youssef En-Nesyri', countryKey: 'spain' },
    { name: 'Cengiz Ünder', countryKey: 'turkey' },
    { name: 'Milan de Vries', countryKey: 'germany' }
  ];

  function extractPlayerRecords(source) {
    // The local proxy returns structured records when it can read the page.
    try {
      const parsed = JSON.parse(source);
      if (Array.isArray(parsed?.records)) {
        return parsed.records
          .map((entry) => ({ name: String(entry?.name || '').trim(), countryKey: entry?.countryKey || null }))
          .filter((entry) => entry.name.length >= 3);
      }
    } catch {}

    const records = [];
    const seen = new Set();

    function add(name, countryKey = null) {
      const clean = String(name || '').replace(/\s+/g, ' ').trim();
      const key = normalizeName(clean);
      if (clean.length < 3 || clean.length > 60 || seen.has(key)) return;
      seen.add(key);
      records.push({ name: clean, countryKey: countryKey || null });
    }

    // Best case: parse actual SoFIFA HTML. Player rows use links to /player/...
    // and nationality is exposed by the adjacent flag image alt/title.
    if (/<html|<table|<a\b/i.test(source)) {
      try {
        const doc = new DOMParser().parseFromString(source, 'text/html');
        doc.querySelectorAll('a[href*="/player/"]').forEach((link) => {
          const name = (link.textContent || '').replace(/\s+/g, ' ').trim();
          if (!name || /^\d+\s/.test(name)) return;
          const container = link.closest('tr') || link.parentElement?.parentElement || link.parentElement;
          const countryNode = container ? [...container.querySelectorAll('img, [title], [alt]')].find((node) => {
            const haystack = `${node.getAttribute('alt') || ''} ${node.getAttribute('title') || ''}`;
            return countryKeyFromText(haystack);
          }) : null;
          const countryKey = countryKeyFromText(countryNode ? `${countryNode.getAttribute('alt') || ''} ${countryNode.getAttribute('title') || ''}` : '');
          add(name.replace(/^\d+\s+/, ''), countryKey);
        });

        // The readable DOM may not expose /player/ URLs, but the table still
        // contains a Name column followed by a country flag.
        if (records.length < 3) {
          doc.querySelectorAll('tr').forEach((row) => {
            const links = [...row.querySelectorAll('a')];
            const playerLink = links.find((link) => /\/player\//i.test(link.getAttribute('href') || ''));
            if (!playerLink) return;
            const name = (playerLink.textContent || '').replace(/^\d+\s+/, '').replace(/\s+/g, ' ').trim();
            const countryNode = [...row.querySelectorAll('img, [title], [alt]')].find((node) => countryKeyFromText(`${node.getAttribute('alt') || ''} ${node.getAttribute('title') || ''}`));
            const countryKey = countryKeyFromText(countryNode ? `${countryNode.getAttribute('alt') || ''} ${countryNode.getAttribute('title') || ''}` : '');
            add(name, countryKey);
          });
        }
      } catch {}
    }

    // Readable/Markdown fallback from r.jina.ai.
    const markdownPlayerLinks = /\[([^\]]+)\]\(https?:\/\/[^\s)]+\/player\/[^)]+\)/giu;
    let match;
    while ((match = markdownPlayerLinks.exec(source))) add(match[1].replace(/^\d+\s+/, ''));

    // SoFIFA readable pages can expose player links as citation-style text.
    const plainPlayerLinks = /https?:\/\/[^\s)]+\/player\/[^\n]+\n([^\n]{3,80})/giu;
    while ((match = plainPlayerLinks.exec(source))) add(match[1].replace(/^\d+\s+/, ''));

    return records;
  }

  function slugifyTeamName(value) {
    return String(value || '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ı/g, 'i').replace(/İ/g, 'I')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function buildSquadUrl() {
    const teamName = squadTeamNameEl?.value?.trim() || '';
    const clubId = squadClubIdEl?.value?.trim() || '';
    if (!teamName) throw new Error('Please enter a team name.');
    if (!/^\d+$/.test(clubId)) throw new Error('SoFIFA team ID must contain numbers only.');
    const slug = slugifyTeamName(teamName);
    if (!slug) throw new Error('Could not create a valid team slug.');
    return `https://sofifa.com/team/${clubId}/${slug}`;
  }

  function updateSquadUrlPreview() {
    try {
      const url = buildSquadUrl();
      if (squadSourceUrlPreviewEl) squadSourceUrlPreviewEl.value = url;
    } catch {
      if (squadSourceUrlPreviewEl) squadSourceUrlPreviewEl.value = 'Enter a valid team name and club ID.';
    }
  }

  async function fetchSquadText(url) {
    if (!/^https:\/\/sofifa\.com\/team\/\d+\/[^/]+\/?$/i.test(url)) {
      throw new Error('Only SoFIFA /team/{id}/{slug} URLs are allowed.');
    }

    const encoded = encodeURIComponent(url);
    const urls = [
      `/api/sofifa?url=${encoded}`,
      `https://r.jina.ai/${url}`,
      `https://api.allorigins.win/raw?url=${encoded}`
    ];

    let lastError = null;
    for (const endpoint of urls) {
      try {
        const response = await fetch(endpoint, { headers: { 'Accept': 'text/plain,text/html;q=0.9,*/*;q=0.8' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        if (text.length > 500) return text;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('Could not read the SoFIFA squad page.');
  }

  function renderRealPlayers() {
    if (!realPlayerListEl) return;
    if (!realPlayers.length) {
      realPlayerListEl.innerHTML = '<div class="name-empty">No player names were found on this page.</div>';
      return;
    }

    realPlayerListEl.innerHTML = realPlayers.map((player, index) => {
      const key = normalizeName(player.name);
      const variation = alternativeNames.get(`${key}:variation`) || '—';
      const countryName = alternativeNames.get(`${key}:country`) || '—';
      const countryKey = resolvePlayerCountryKey(player);
      const isFallback = !player.countryKey || !nameData?.countries?.[player.countryKey];
      const countryLabel = isFallback ? 'ENGLISH FALLBACK' : (nameData?.countries?.[countryKey]?.label || 'COUNTRY');
      return `
        <div class="real-player-row" data-player-key="${escapeHtml(key)}">
          <span class="real-player-index">${String(index + 1).padStart(2, '0')}</span>
          <div class="real-player-main">
            <strong class="real-player-original" title="${escapeHtml(player.name)}">${escapeHtml(player.name)}</strong>
            <small class="real-player-country-badge">${escapeHtml(countryLabel)}</small>
          </div>
          <div class="real-player-result variation-result" title="${escapeHtml(variation)}"><span>VARIATION</span><strong>${escapeHtml(variation)}</strong></div>
          <button class="real-player-action" type="button" data-action="variation" data-player-index="${index}" aria-label="Create a letter variation of ${escapeHtml(player.name)}" title="Create name variation">↻</button>
          <div class="real-player-result country-result" title="${escapeHtml(countryName)}"><span>COUNTRY</span><strong>${escapeHtml(countryName)}</strong></div>
          <button class="real-player-action country-action" type="button" data-action="country" data-player-index="${index}" aria-label="Create another ${escapeHtml(countryLabel)} name for ${escapeHtml(player.name)}" title="Create same-country name; unknown countries use English">⚄</button>
        </div>`;
    }).join('');
  }

  function getFirstAndLast(name) {
    const parts = String(name).trim().split(/\s+/);
    if (parts.length < 2) return { first: parts[0] || '', last: '' };
    return { first: parts.slice(0, -1).join(' '), last: parts.at(-1) };
  }

  function createLetterVariations(first) {
    const source = String(first || '').trim();
    const compact = source.replace(/[^a-zA-ZÀ-ÿ]/g, '');
    if (compact.length < 3) return [];
    const out = new Set();
    const add = (value) => {
      const candidate = capitalize(value.toLowerCase());
      if (candidate.length >= 3 && candidate.length <= 15 && validSynthetic(candidate)) out.add(candidate);
    };

    // Prefix/suffix recombination, preserving the original letter order.
    for (let cut = 2; cut <= Math.min(5, compact.length - 1); cut += 1) {
      add(compact.slice(0, cut) + compact.slice(-Math.min(3, compact.length - cut)));
    }
    // Remove one character, swap adjacent letters, and rotate chunks.
    for (let i = 1; i < compact.length - 1; i += 1) {
      add(compact.slice(0, i) + compact.slice(i + 1));
      const chars = compact.split('');
      [chars[i - 1], chars[i]] = [chars[i], chars[i - 1]];
      add(chars.join(''));
    }
    const middle = Math.floor(compact.length / 2);
    add(compact.slice(middle) + compact.slice(0, middle));
    add(compact.slice(0, middle + 1) + compact.slice(middle + 1).split('').reverse().join(''));

    return [...out];
  }

  function generateNameVariation(player) {
    const { first, last } = getFirstAndLast(player.name);
    const candidates = createLetterVariations(first);
    if (!candidates.length) return null;
    const originalKey = normalizeName(player.name);
    for (let i = 0; i < 100; i += 1) {
      const candidateFirst = randomItem(candidates);
      const full = `${candidateFirst}${last ? ` ${last}` : ''}`.trim();
      const key = normalizeName(full);
      if (key !== originalKey && !usedAlternativeNames.has(key)) {
        usedAlternativeNames.add(key);
        return full;
      }
    }
    return null;
  }

  function generateCountryName(player) {
    const key = resolvePlayerCountryKey(player);
    const country = nameData?.countries?.[key];
    if (!country) return null;

    const blocked = new Set();
    realPlayers.forEach((entry) => {
      const existing = alternativeNames.get(`${normalizeName(entry.name)}:country`);
      if (existing) {
        const parts = existing.split(/\s+/);
        if (parts.length > 1) blocked.add(normalizeName(parts.at(-1)));
      }
    });

    for (let attempt = 0; attempt < 300; attempt += 1) {
      const first = randomItem(country.firstNames || []);
      const surname = pickUnusedSurname(country, blocked);
      if (!first || !surname) return null;
      const candidate = `${first} ${surname}`;
      const candidateKey = normalizeName(candidate);
      if (candidateKey === normalizeName(player.name)) continue;
      if (usedAlternativeNames.has(candidateKey)) continue;
      usedAlternativeNames.add(candidateKey);
      return candidate;
    }
    return null;
  }

  async function rollAlternative(index, action) {
    const player = realPlayers[index];
    if (!player) return;
    const button = realPlayerListEl?.querySelector(`[data-player-index="${index}"][data-action="${action}"]`);
    if (button) button.disabled = true;

    try {
      await loadNames();
      let alternative = action === 'variation'
        ? generateNameVariation(player)
        : generateCountryName(player);
      if (!alternative) throw new Error(action === 'variation' ? 'No letter variation is available for this name.' : 'No unused country name is available.');
      alternativeNames.set(`${normalizeName(player.name)}:${action}`, alternative);
      renderRealPlayers();
    } catch (error) {
      if (squadStatusEl) squadStatusEl.textContent = error.message || 'Could not generate the alternative name.';
    } finally {
      const nextButton = realPlayerListEl?.querySelector(`[data-player-index="${index}"][data-action="${action}"]`);
      if (nextButton) nextButton.disabled = false;
    }
  }

  realPlayerListEl?.addEventListener('click', (event) => {
    const button = event.target.closest('.real-player-action');
    if (!button) return;
    rollAlternative(Number(button.dataset.playerIndex), button.dataset.action);
  });

  async function loadSquad() {
    if (!loadSquadEl || !realPlayerListEl) return;
    loadSquadEl.disabled = true;
    loadSquadEl.innerHTML = 'LOADING...';
    if (squadStatusEl) squadStatusEl.textContent = 'Reading SoFIFA squad...';
    realPlayerListEl.innerHTML = '<div class="name-empty">Loading squad...</div>';
    alternativeNames.clear();
    usedAlternativeNames.clear();

    try {
      await loadNames();
      populateAlternativeCountries();
      const url = buildSquadUrl();
      updateSquadUrlPreview();
      const text = await fetchSquadText(url);
      let records = extractPlayerRecords(text);

      if (records.length < 1) throw new Error('No player names could be extracted from this SoFIFA page.');

      realPlayers = records;
      const known = realPlayers.filter((entry) => entry.countryKey && nameData?.countries?.[entry.countryKey]).length;
      const fallbackCount = records.length - known;
      const fallbackText = fallbackCount ? ` · ${fallbackCount} ENGLISH FALLBACK` : '';
      if (squadStatusEl) squadStatusEl.textContent = `${records.length} PLAYERS LOADED · ${known} COUNTRY MATCHES${fallbackText} · Use ↻ for letter variation or ⚄ for a same-country name.`;
      renderRealPlayers();
    } catch (error) {
      realPlayers = [];
      realPlayerListEl.innerHTML = `<div class="real-player-error">${escapeHtml(error.message || 'Could not load the squad.')}<br /><small>The generated URL uses /team/{id}/{slug}. If SoFIFA blocks direct access, the proxy/readable fallback will be tried automatically.</small></div>`;
      if (squadStatusEl) squadStatusEl.textContent = 'SQUAD LOAD FAILED';
    } finally {
      loadSquadEl.disabled = false;
      loadSquadEl.innerHTML = 'LOAD SQUAD <span>↗</span>';
    }
  }

  loadNames().then(() => populateAlternativeCountries());

  loadSquadEl?.addEventListener('click', loadSquad);
  [squadTeamNameEl, squadClubIdEl].forEach((input) => {
    input?.addEventListener('input', updateSquadUrlPreview);
    input?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') loadSquad();
    });
  });
  updateSquadUrlPreview();
})();
