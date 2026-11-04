const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobileMenu');

if (menuButton && mobileMenu) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    mobileMenu.hidden = false;
    mobileMenu.classList.toggle('open', !open);
    if (open) mobileMenu.hidden = true;
  });
  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    mobileMenu.hidden = true;
  }));
}

const tool = document.querySelector('[data-clarity-tool]');
if (tool) {
  const questions = [...tool.querySelectorAll('[data-question]')];
  const scoreEl = tool.querySelector('[data-score]');
  const scoreRing = tool.querySelector('[data-score-ring]');
  const messageEl = tool.querySelector('[data-score-message]');

  const updateScore = () => {
    const answered = questions.filter(q => q.dataset.answer).length;
    const score = questions.filter(q => q.dataset.answer === 'yes').length;

    if (answered === 0) {
      scoreEl.textContent = '— / 5';
      scoreRing.style.setProperty('--score-angle', '0deg');
      messageEl.textContent = 'Answer the five questions to see where your project is already clear — and where it may need structure.';
      return;
    }

    if (answered < 5) {
      scoreEl.textContent = `${answered} / 5`;
      scoreRing.style.setProperty('--score-angle', `${answered * 72}deg`);
      messageEl.textContent = `${answered} of 5 answered. Complete all five before the clarity score is revealed.`;
      return;
    }

    scoreEl.textContent = `${score}/5`;
    scoreRing.style.setProperty('--score-angle', `${score * 72}deg`);

    if (score <= 1) {
      messageEl.textContent = 'Several important project expectations are still open. Making them visible now can improve the first professional conversation.';
    } else if (score <= 3) {
      messageEl.textContent = 'Some foundations are already clear. The remaining open points are exactly where structured preparation can reduce assumptions.';
    } else if (score === 4) {
      messageEl.textContent = 'Your project is already relatively clear. One unresolved area may still be worth making explicit before technical decisions begin.';
    } else {
      messageEl.textContent = 'You have a strong starting position. The kit can help turn that clarity into a structured shared reference with your local team.';
    }
  };

  questions.forEach(question => {
    question.querySelectorAll('button[data-value]').forEach(button => {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        question.dataset.answer = button.dataset.value;
        question.querySelectorAll('button[data-value]').forEach(btn => {
          btn.setAttribute('aria-pressed', String(btn === button));
        });
        updateScore();
      });
    });
  });
}

// Keep a single FAQ item open at a time on small screens for easier reading.
const faqItems = [...document.querySelectorAll('#faq details')];
faqItems.forEach(item => {
  item.addEventListener('toggle', () => {
    if (!item.open || window.innerWidth > 720) return;
    faqItems.forEach(other => { if (other !== item) other.open = false; });
  });
});

const purchaseButton = document.querySelector('#purchaseButton');
const dialog = document.querySelector('#checkoutDialog');
const CHECKOUT_URL = '';

if (purchaseButton) {
  purchaseButton.addEventListener('click', () => {
    if (CHECKOUT_URL) {
      window.location.href = CHECKOUT_URL;
      return;
    }
    if (dialog?.showModal) dialog.showModal();
  });
}

if (dialog) {
  dialog.querySelectorAll('.dialog-close, .dialog-close-secondary').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
    if (!inside) dialog.close();
  });
}

/* SUPPORTALY_MOTION_V4_START */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');

  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 16);
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if (reduceMotion) return;

  const revealSelectors = [
    '.problem .section-heading',
    '.ambiguity-grid',
    '.pattern-copy',
    '.clarity-tool',
    '.simple-way .section-heading',
    '.three-steps',
    '.inside > .section-heading',
    '.kit-carousel',
    '.preview-section .section-heading',
    '.page-previews',
    '.how .section-heading',
    '.four-steps',
    '.comparison-intro',
    '.comparison-table',
    '.qualification .section-heading',
    '.qualification-grid',
    '.supportaly-note',
    '.offer-card',
    '.faq-heading',
    '.faq-grid',
    '.final-copy',
    '.professional-copy',
    '.professional-photo'
  ];

  const revealTargets = revealSelectors
    .flatMap(selector => Array.from(document.querySelectorAll(selector)))
    .filter((node, index, list) => list.indexOf(node) === index);

  revealTargets.forEach((node, index) => {
    node.classList.add('motion-reveal');
    node.dataset.motionDelay = String(index % 4 === 0 ? 0 : Math.min(index % 4, 3));
  });

  const mediaTargets = [
    document.querySelector('.hero-media'),
    document.querySelector('.wide-photo'),
    document.querySelector('.pattern-image'),
    document.querySelector('.clarity-photo'),
    document.querySelector('.qualification-photo'),
    document.querySelector('.final-cta'),
    document.querySelector('.professional-photo')
  ].filter(Boolean);
  mediaTargets.forEach(node => node.classList.add('motion-media'));

  const markVisible = node => node.classList.add('is-visible');

  if (!('IntersectionObserver' in window)) {
    revealTargets.forEach(markVisible);
    mediaTargets.forEach(markVisible);
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      markVisible(entry.target);
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px'
  });

  revealTargets.forEach(node => observer.observe(node));
  mediaTargets.forEach(node => observer.observe(node));

  const initiallyVisible = [...revealTargets, ...mediaTargets].filter(node => {
    const rect = node.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.9 && rect.bottom > 0;
  });
  initiallyVisible.forEach(markVisible);

  requestAnimationFrame(() => document.body.classList.add('motion-ready'));

  const scoreRing = document.querySelector('[data-score-ring]');
  const clarityButtons = document.querySelectorAll('[data-question] button[data-value]');
  if (scoreRing && clarityButtons.length) {
    clarityButtons.forEach(button => {
      button.addEventListener('click', () => {
        scoreRing.classList.remove('score-updated');
        void scoreRing.offsetWidth;
        scoreRing.classList.add('score-updated');
      });
    });
  }
})();
/* SUPPORTALY_MOTION_V4_END */

/* SUPPORTALY_USER_EDITS_20261017_START */
(() => {
  const previewFigures = [...document.querySelectorAll('.page-previews figure')];
  if (!previewFigures.length) return;

  let zoomDialog = document.querySelector('#imageZoomDialog');
  if (!zoomDialog) {
    zoomDialog = document.createElement('dialog');
    zoomDialog.id = 'imageZoomDialog';
    zoomDialog.className = 'image-zoom-dialog';
    zoomDialog.setAttribute('aria-label', 'Expanded template preview');
    zoomDialog.innerHTML = '<button class="image-zoom-close" type="button" aria-label="Close image">×</button><img alt="" />';
    document.body.appendChild(zoomDialog);
  }

  const zoomImage = zoomDialog.querySelector('img');
  const closeButton = zoomDialog.querySelector('.image-zoom-close');

  const openZoom = (image) => {
    if (!image || !zoomImage) return;
    zoomImage.src = image.currentSrc || image.src;
    zoomImage.alt = image.alt || 'Template preview';
    if (typeof zoomDialog.showModal === 'function') zoomDialog.showModal();
  };

  previewFigures.forEach((figure) => {
    const image = figure.querySelector('img');
    if (!image || figure.querySelector('.zoom-button')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'zoom-button';
    button.setAttribute('aria-label', `Zoom ${image.alt || 'template preview'}`);
    button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="M15.5 15.5L21 21"></path><path d="M10.5 7.5v6M7.5 10.5h6"></path></svg>';
    figure.appendChild(button);

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      openZoom(image);
    });
    image.addEventListener('click', () => openZoom(image));
  });

  closeButton?.addEventListener('click', () => zoomDialog.close());
  zoomDialog.addEventListener('click', (event) => {
    if (event.target === zoomDialog) zoomDialog.close();
  });
})();
/* SUPPORTALY_USER_EDITS_20261017_END */
