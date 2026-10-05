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
