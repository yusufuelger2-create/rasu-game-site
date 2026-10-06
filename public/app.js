const cursorGlow = document.querySelector('.cursor-glow');

window.addEventListener('pointermove', (e) => {
  if (cursorGlow) {
    cursorGlow.style.left = `${e.clientX}px`;
    cursorGlow.style.top = `${e.clientY}px`;
  }
});


// ============================================================
// REVEAL ANIMATIONS
// ============================================================

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12
});

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i * 50, 250)}ms`;
  observer.observe(el);
});


// ============================================================
// MOBILE MENU
// ============================================================

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


// ============================================================
// HERO GAME SLIDER
// ============================================================

const slides = [...document.querySelectorAll('.hero-slide')];
const dots = [...document.querySelectorAll('.hero-dot')];

let currentSlide = 0;
let sliderTimer;


function videoUrl(id) {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`;
}


function loadVideo(slide) {
  const iframe = slide.querySelector('iframe');

  if (!iframe || iframe.src) {
    return;
  }

  iframe.src = videoUrl(slide.dataset.video);
}


function unloadVideo(slide) {
  const iframe = slide.querySelector('iframe');

  if (iframe) {
    iframe.removeAttribute('src');
  }
}


function showSlide(index) {
  if (!slides.length) {
    return;
  }

  currentSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === currentSlide);

    if (i !== currentSlide) {
      unloadVideo(slide);
    }
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });

  loadVideo(slides[currentSlide]);

  clearTimeout(sliderTimer);

  sliderTimer = setTimeout(() => {
    showSlide(currentSlide + 1);
  }, 10000);
}


dots.forEach((dot, index) => {
  dot.addEventListener('click', () => {
    showSlide(index);
  });
});

showSlide(0);


// Pause automatic switching while pointer is over controls.

const heroControls = document.querySelector('.hero-slide-controls');

heroControls?.addEventListener('mouseenter', () => {
  clearTimeout(sliderTimer);
});

heroControls?.addEventListener('mouseleave', () => {
  clearTimeout(sliderTimer);

  sliderTimer = setTimeout(() => {
    showSlide(currentSlide + 1);
  }, 10000);
});


// ============================================================
// GAME PICKER
// ============================================================

const gamePickerButtons = [
  ...document.querySelectorAll('.game-picker-btn')
];

const gameShowcaseCards = [
  ...document.querySelectorAll('.game-showcase-card')
];

const gameNumber = document.querySelector('.game-number');

const showcaseTitle = document.querySelector('.showcase h2');

const showcaseCopy = document.querySelector(
  '.showcase-copy>p:not(.eyebrow)'
);

const showcaseTags = document.querySelector('.tag-row');


const showcaseData = {

  pls: {
    number: '01',

    title: 'TWO GAMES.<br /><em>ONE STUDIO.</em>',

    copy:
      'Pro League Soccer puts you in control with deep football simulation, squad building and customization across Android and iOS.',

    tags: [
      'PRO LEAGUE SOCCER',
      'ANDROID + IOS',
      'FOOTBALL SIMULATION'
    ]
  },

  pks: {
    number: '02',

    title: 'FAST FOOTBALL.<br /><em>PURE ACTION.</em>',

    copy:
      'Pro Kick Soccer is built for quick matches, sharp moments and accessible football action across Android and iOS.',

    tags: [
      'PRO KICK SOCCER',
      'ANDROID + IOS',
      'FAST MATCHES'
    ]
  }

};


function chooseGame(game) {

  const data = showcaseData[game];

  if (!data) {
    return;
  }

  gamePickerButtons.forEach((btn) => {
    btn.classList.toggle(
      'active',
      btn.dataset.gameChoice === game
    );
  });


  gameShowcaseCards.forEach((card) => {

    const selected =
      card.dataset.showcaseGame === game;

    card.classList.toggle(
      'hidden',
      !selected
    );

    if (selected) {

      card.style.animation = 'none';

      void card.offsetWidth;

      card.style.animation = '';

    }

  });


  if (gameNumber) {
    gameNumber.textContent = data.number;
  }

}


gamePickerButtons.forEach((btn) => {

  btn.addEventListener('click', () => {

    chooseGame(
      btn.dataset.gameChoice
    );

  });

});


chooseGame('pls');


// ============================================================
// CONTACT FORM
// ============================================================

const contactTopic =
  document.querySelector('#contactTopic');

const bugFields =
  document.querySelector('#bugFields');

const bugAttachment =
  document.querySelector('#bugAttachment');

const contactForm =
  document.querySelector('#contactForm');

const formStatus =
  document.querySelector('#formStatus');


function toggleBugFields() {

  const isBug =
    contactTopic?.value === 'bug-report';

  if (bugFields) {
    bugFields.hidden = !isBug;
  }

  if (!isBug && bugAttachment) {
    bugAttachment.value = '';
  }

}


contactTopic?.addEventListener(
  'change',
  toggleBugFields
);

toggleBugFields();


contactForm?.addEventListener(
  'submit',
  async (event) => {

    event.preventDefault();


    if (!contactForm.checkValidity()) {

      contactForm.reportValidity();

      return;
    }


    if (
      bugAttachment?.files?.[0] &&
      bugAttachment.files[0].size >
        10 * 1024 * 1024
    ) {

      if (formStatus) {

        formStatus.textContent =
          'The screenshot must be 10 MB or smaller.';

        formStatus.classList.add('error');

      }

      return;
    }


    if (formStatus) {

      formStatus.classList.remove('error');

      formStatus.textContent =
        'Form validated. Connect your preferred email/form provider to receive submissions.';

    }

  }
);


// ============================================================
// FOOTBALLER NAME GENERATOR
// ============================================================
//
// Names are loaded from:
//
// /names.json
//
// JSON structure:
//
// {
//   "countries": {
//     "germany": {
//       "label": "Germany",
//       "flag": "🇩🇪",
//       "firstNames": [],
//       "lastNames": []
//     }
//   }
// }
//
// Maximum generated names: 20
// ============================================================


const nameCountry =
  document.querySelector('#nameCountry');

const nameCount =
  document.querySelector('#nameCount');

const generateNamesButton =
  document.querySelector('#generateNames');

const copyNamesButton =
  document.querySelector('#copyNames');

const generatedCount =
  document.querySelector('#generatedCount');

const nameList =
  document.querySelector('#nameList');


let footballerNameData = null;

let generatedNames = [];


// ============================================================
// LOAD NAMES.JSON
// ============================================================

async function loadFootballerNames() {

  if (!generateNamesButton) {
    return;
  }

  try {

    const response =
      await fetch('/names.json', {
        cache: 'no-store'
      });


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    if (
      !data ||
      !data.countries ||
      typeof data.countries !== 'object'
    ) {

      throw new Error(
        'Invalid names.json structure'
      );

    }


    footballerNameData = data;


    generateNamesButton.disabled = false;


    if (nameList) {

      nameList.innerHTML =
        '<div class="name-empty">Choose a country and generate your players.</div>';

    }

  } catch (error) {

    console.error(
      'Could not load names.json:',
      error
    );


    if (nameList) {

      nameList.innerHTML =
        '<div class="name-empty error">Name data could not be loaded. Please check names.json.</div>';

    }


    generateNamesButton.disabled = true;

  }

}


// ============================================================
// RANDOM ITEM
// ============================================================

function randomItem(items) {

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return items[
    Math.floor(
      Math.random() * items.length
    )
  ];

}


// ============================================================
// CREATE PLAYER NAME
// ============================================================

function createPlayerName(
  countryData,
  usedNames
) {

  if (
    !countryData ||
    !Array.isArray(countryData.firstNames) ||
    !Array.isArray(countryData.lastNames)
  ) {

    return null;

  }


  if (
    countryData.firstNames.length === 0 ||
    countryData.lastNames.length === 0
  ) {

    return null;

  }


  const maxAttempts = 100;


  for (
    let attempt = 0;
    attempt < maxAttempts;
    attempt++
  ) {

    const firstName =
      randomItem(countryData.firstNames);

    const lastName =
      randomItem(countryData.lastNames);


    if (!firstName || !lastName) {
      continue;
    }


    const fullName =
      `${firstName} ${lastName}`;


    if (!usedNames.has(fullName)) {

      return fullName;

    }

  }


  return null;

}


// ============================================================
// RENDER GENERATED NAMES
// ============================================================

function renderGeneratedNames() {

  if (!nameList || !generatedCount) {
    return;
  }


  const count =
    generatedNames.length;


  generatedCount.textContent =
    `${count} ${count === 1 ? 'PLAYER' : 'PLAYERS'}`;


  if (count === 0) {

    nameList.innerHTML =
      '<div class="name-empty">No names generated.</div>';

  } else {

    nameList.innerHTML =
      generatedNames
        .map((name, index) => {

          const number =
            String(index + 1).padStart(2, '0');


          return `
            <div class="generated-name">
              <span>${number}</span>
              <strong>${escapeHtml(name)}</strong>
            </div>
          `;

        })
        .join('');

  }


  if (copyNamesButton) {

    copyNamesButton.disabled =
      generatedNames.length === 0;

  }

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}


// ============================================================
// GENERATE FOOTBALLER NAMES
// ============================================================

function generateFootballerNames() {

  if (
    !footballerNameData ||
    !nameCountry ||
    !nameCount
  ) {

    return;

  }


  const countryKey =
    nameCountry.value;


  const country =
    footballerNameData.countries?.[countryKey];


  if (!country) {

    return;

  }


  let requestedCount =
    Number(nameCount.value);


  if (!Number.isFinite(requestedCount)) {
    requestedCount = 1;
  }


  requestedCount =
    Math.floor(requestedCount);


  requestedCount =
    Math.min(
      20,
      Math.max(
        1,
        requestedCount
      )
    );


  const firstNames =
    Array.isArray(country.firstNames)
      ? country.firstNames
      : [];


  const lastNames =
    Array.isArray(country.lastNames)
      ? country.lastNames
      : [];


  const availableCombinations =
    firstNames.length *
    lastNames.length;


  const targetCount =
    Math.min(
      requestedCount,
      availableCombinations
    );


  const usedNames =
    new Set();


  generatedNames = [];


  while (
    generatedNames.length <
    targetCount
  ) {

    const playerName =
      createPlayerName(
        country,
        usedNames
      );


    if (!playerName) {
      break;
    }


    usedNames.add(playerName);

    generatedNames.push(
      playerName
    );

  }


  renderGeneratedNames();

}


// ============================================================
// COPY ALL NAMES
// ============================================================

async function copyGeneratedNames() {

  if (!generatedNames.length) {
    return;
  }


  const text =
    generatedNames.join('\n');


  try {

    await navigator.clipboard.writeText(
      text
    );


    showCopySuccess();

  } catch (error) {

    // Fallback for browsers where
    // navigator.clipboard is unavailable.

    const textarea =
      document.createElement('textarea');


    textarea.value = text;


    textarea.style.position = 'fixed';

    textarea.style.left = '-9999px';

    textarea.style.top = '0';

    textarea.style.opacity = '0';


    document.body.appendChild(
      textarea
    );


    textarea.focus();

    textarea.select();


    try {

      document.execCommand('copy');

      showCopySuccess();

    } catch (fallbackError) {

      console.error(
        'Could not copy names:',
        fallbackError
      );

    }


    textarea.remove();

  }

}


// ============================================================
// COPY BUTTON SUCCESS STATE
// ============================================================

function showCopySuccess() {

  if (!copyNamesButton) {
    return;
  }


  const originalHTML =
    'COPY ALL NAMES <span>⧉</span>';


  copyNamesButton.textContent =
    'COPIED ✓';


  setTimeout(() => {

    copyNamesButton.innerHTML =
      originalHTML;

  }, 1400);

}


// ============================================================
// GENERATOR EVENTS
// ============================================================

generateNamesButton?.addEventListener(
  'click',
  generateFootballerNames
);


copyNamesButton?.addEventListener(
  'click',
  copyGeneratedNames
);


// Keep number between 1 and 20.

nameCount?.addEventListener(
  'input',
  () => {

    let value =
      Number(nameCount.value);


    if (!Number.isFinite(value)) {
      value = 1;
    }


    value =
      Math.floor(value);


    if (value < 1) {
      value = 1;
    }


    if (value > 20) {
      value = 20;
    }


    nameCount.value = value;

  }
);


// ============================================================
// START NAME DATA LOADING
// ============================================================

if (nameCountry && nameCount) {

  loadFootballerNames();

}