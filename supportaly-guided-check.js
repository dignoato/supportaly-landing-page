/* Supportaly: guided preparation, scoped to the homepage exercise. */
(function () {
  'use strict';
  const labels = { yes: 'Yes, clearly', partly: 'Partly', no: 'Not yet' };
  const workbook = { name: '02 Client Workbook', href: 'product-02-client-workbook.html', image: 'assets/workbook-page.webp', alt: 'Example page from the Client Workbook', explanation: 'The Client Workbook gives your property information, daily routines, priorities and limits a shared structure for professional review.' };
  const topics = [
    { name: 'Changes', question: 'Can you explain what you want to change and what you want those changes to achieve?', document: workbook,
      advice: {
        yes: 'For each proposed change, write the outcome you want. “Remove a wall” describes a solution; “make family meals less cramped” explains the need.',
        partly: 'Choose one room. Complete: “Today…”, “I would like…”, and “because…”.',
        no: 'Start with one thing that makes everyday life difficult. Describe it before choosing a building solution.'
      } },
    { name: 'Boundaries', question: 'Can you describe your budget boundaries, important dates and priorities?', document: workbook,
      advice: {
        yes: 'Mark which limits are fixed, which are preferences and which still need professional advice. Your budget boundary is not a cost estimate.',
        partly: 'Separate what you have decided from what remains uncertain: available funds, desired dates and priorities.',
        no: 'List what you can currently commit to and what remains unknown. Leave uncertain amounts and dates open.'
      } },
    { name: 'Daily life', question: 'Can you explain how the home needs to support the people using it?', document: workbook,
      advice: {
        yes: 'Test your ideas against an ordinary weekday. Where might routines, privacy, storage or accessibility create conflicting needs?',
        partly: 'Walk through a typical morning and evening. Note where the home supports your routines and where it gets in the way.',
        no: 'Describe one ordinary day in the future home: who uses it, what they do and what needs to work comfortably.'
      } },
    { name: 'Decisions', question: 'Is it clear who makes decisions, even if that is just you, and how choices will be recorded?',
      document: { name: '04 Decision Card · EN/IT', href: 'product-04-decision-card.html', image: 'https://static.wixstatic.com/media/53e940_66dbd92942cc4ee492e5be9743b3eb3f~mv2.png', alt: 'Inside preview of the bilingual Decision Card', explanation: 'The Decision Card provides English and Italian fields for recording proposals, confirmations, open points and who acts next.' },
      advice: {
        yes: 'Choose one upcoming decision. Record who decides, whose input is needed and where the confirmation will be kept.',
        partly: 'Identify what is missing: the decision maker, other people’s input or a way to record the choice.',
        no: 'List who needs a say. If you decide alone, write that down too, then choose where decisions will be recorded.'
      } },
    { name: 'Unknowns', question: 'Can you separate what you know from assumptions and questions needing professional advice?',
      document: { name: '03 Architect Handover', href: 'product-03-architect-handover.html', image: 'assets/handover-page.webp', alt: 'Example page from the Architect Handover', explanation: 'The Architect Handover brings your preparation into professional review, helping organise open questions, responsibilities and next steps.' },
      advice: {
        yes: 'Revisit one statement you feel confident about. Is it documented, your preference or something a professional still needs to check?',
        partly: 'Make three short lists: “I know”, “I assume”, and “I need to ask”.',
        no: 'Start with one question you cannot answer yourself. You can bring it to the first meeting without proposing a solution.'
      } }
  ];
  function buildSnapshot(answers) {
    if (!Array.isArray(answers) || answers.length !== 5 || answers.some(a => !Object.hasOwn(labels, a))) return null;
    const rows = topics.map((t, i) => ({ index: i, name: t.name, answer: answers[i], label: labels[answers[i]], action: t.advice[answers[i]], document: t.document }));
    const clear = rows.filter(r => r.answer === 'yes');
    const open = rows.filter(r => r.answer !== 'yes');
    let introduction;
    if (answers.every(a => a === 'no')) introduction = 'You have identified five areas to explore. Start with one everyday difficulty the renovation should address.';
    else if (answers.every(a => a === 'partly')) introduction = 'You have a starting point in every area. Choose one topic and separate what is decided from what remains open.';
    else if (!open.length) introduction = 'You report clarity across all five areas. Your next step is to put it into a shared brief and identify what still requires professional verification.';
    else if (open.length === 1) introduction = 'You have one area to develop: ' + open[0].name.toLowerCase() + '. Try the action below before your next professional conversation.';
    else introduction = 'Your open areas are ' + open.map(r => r.name.toLowerCase()).join(', ') + '. Choose the one that matters most to you now.';
    return { rows, clear, open, introduction };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { topics, labels, buildSnapshot };
  if (typeof document === 'undefined') return;
  const root = document.querySelector('[data-guided-clarity]');
  if (!root) return;
  const $ = selector => root.querySelector(selector);
  const key = 'supportaly-guided-preparation-v1';
  let answers = Array(5).fill(''), current = 0, selected = null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(key));
    if (saved && Array.isArray(saved.answers) && saved.answers.length === 5 && saved.answers.every(a => a === '' || Object.hasOwn(labels, a))) {
      answers = saved.answers;
      current = Number.isInteger(saved.current) ? Math.max(0, Math.min(5, saved.current)) : 0;
      const firstMissing = answers.indexOf('');
      if (firstMissing !== -1 && current > firstMissing) current = firstMissing;
      selected = Number.isInteger(saved.selected) && saved.selected >= 0 && saved.selected < 5 ? saved.selected : null;
    }
  } catch (_) { /* Storage is optional; exercise works without it. */ }
  function save() { try { sessionStorage.setItem(key, JSON.stringify({ answers, current, selected })); } catch (_) {} }
  function el(tag, text, className) { const e = document.createElement(tag); if (text) e.textContent = text; if (className) e.className = className; return e; }
  function focusPanel(panel) { panel.focus({ preventScroll: true }); const r = panel.getBoundingClientRect(); if (r.top < 72 || r.top > window.innerHeight * .6) panel.scrollIntoView({ block: 'start', behavior: 'instant' }); }
  function progress() {
    $('[data-gc-progress]').textContent = current === 5 ? 'YOUR PREPARATION SNAPSHOT' : 'QUESTION ' + String(current + 1).padStart(2, '0') + ' / 05';
    $('[data-gc-bars]').replaceChildren(...answers.map((a, i) => { const bar = el('span'); if (a) bar.classList.add('gc-complete'); if (i === current) bar.classList.add('gc-current'); return bar; }));
  }
  function animatePanel(panel) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !panel.animate) return;
    panel.getAnimations().forEach(a => a.cancel());
    panel.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}], {duration:420,easing:'cubic-bezier(.22,1,.36,1)'});
  }
  function feedback() {
    const value = answers[current];
    const panel = $('[data-gc-feedback]');
    panel.hidden = !value;
    $('[data-gc-advice]').textContent = value ? topics[current].advice[value] : '';
    root.querySelectorAll('[data-gc-answer]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.gcAnswer === value)));
    $('[data-gc-next]').disabled = !value;
  }
  function renderQuestion(moveFocus) {
    $('[data-gc-question-panel]').hidden = false;
    $('[data-gc-results]').hidden = true;
    $('[data-gc-topic]').textContent = topics[current].name;
    $('[data-gc-question]').textContent = topics[current].question;
    $('[data-gc-back]').disabled = current === 0;
    $('[data-gc-next]').textContent = current === 4 ? 'See my next steps →' : 'Continue →';
    $('[data-gc-copy-status]').textContent = '';
    $('[data-gc-manual-copy]').hidden = true;
    feedback(); progress(); save();
    if (moveFocus) { animatePanel($('[data-gc-question]')); focusPanel($('[data-gc-question]')); }
  }
  function clearCopyStatus() { $('[data-gc-copy-status]').textContent = ''; $('[data-gc-manual-copy]').hidden = true; }
  function renderTask(model) {
    const row = model.rows[selected];
    root.querySelectorAll('[data-gc-select]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.gcSelect) === selected)));
    $('[data-gc-task-title]').textContent = row.name + ': your next step';
    $('[data-gc-task]').textContent = row.action;
    $('[data-gc-template-name]').textContent = row.document.name;
    $('[data-gc-template-copy]').textContent = row.document.explanation;
    const img = $('[data-gc-template-image]'); img.src = row.document.image; img.alt = row.document.alt;
    const link = $('[data-gc-template-link]'); link.href = row.document.href; link.textContent = 'View ' + row.document.name.replace(/^\d\d /, '') + ' →';
  }
  function renderResults(moveFocus) {
    const model = buildSnapshot(answers); if (!model) { current = answers.indexOf(''); renderQuestion(moveFocus); return; }
    $('[data-gc-question-panel]').hidden = true;
    $('[data-gc-results]').hidden = false;
    $('[data-gc-introduction]').textContent = model.introduction;
    $('[data-gc-clear]').textContent = model.clear.length ? model.clear.map(r => r.name).join(' · ') + '. You marked these areas “Yes, clearly”.' : 'You have not marked an area “Yes, clearly” yet. Choose one topic below and take a small first step.';
    $('[data-gc-open-title]').textContent = model.open.length ? 'What remains open' : 'Keep your preparation useful';
    $('[data-gc-open]').replaceChildren(...(model.open.length ? model.open : model.rows).map(row => {
      const item = el('details'); const summary = el('summary', row.name + ' · ' + row.label);
      item.append(summary, el('p', row.action)); return item;
    }));
    const available = model.open.length ? model.open : model.rows;
    if (!available.some(r => r.index === selected)) selected = available[0].index;
    $('[data-gc-selectors]').replaceChildren(...available.map(row => {
      const button = el('button', row.name); button.type = 'button'; button.dataset.gcSelect = row.index;
      button.addEventListener('click', () => { selected = row.index; clearCopyStatus(); renderTask(model); save(); }); return button;
    }));
    renderTask(model); progress(); save();
    if (moveFocus) focusPanel($('[data-gc-results-title]'));
  }
  root.querySelectorAll('[data-gc-answer]').forEach(b => b.addEventListener('click', () => { answers[current] = b.dataset.gcAnswer; feedback(); progress(); animatePanel($('[data-gc-feedback]')); save(); }));
  $('[data-gc-back]').addEventListener('click', () => { if (current > 0) { current--; renderQuestion(true); } });
  $('[data-gc-next]').addEventListener('click', () => { if (!answers[current]) return; current++; if (current === 5) renderResults(true); else renderQuestion(true); });
  $('[data-gc-review]').addEventListener('click', () => { current = 0; clearCopyStatus(); renderQuestion(true); });
  function copyText(model) {
    const lines = ['MY SUPPORTALY PREPARATION NOTES', '', 'Based on my own answers; this is not a professional assessment.', '', 'MY CHOSEN FIRST STEP', model.rows[selected].name + ': ' + model.rows[selected].action, '', 'MY FIVE AREAS'];
    model.rows.forEach(r => lines.push(r.name + ' — ' + r.label, r.action, ''));
    lines.push('Technical checks, feasibility and approval requirements need professional review.'); return lines.join('\n');
  }
  $('[data-gc-copy]').addEventListener('click', async () => {
    const model = buildSnapshot(answers); if (!model) return;
    const text = copyText(model);
    try { if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(text); $('[data-gc-copy-status]').textContent = 'Your next steps have been copied.'; }
    catch (_) { const field = $('[data-gc-manual-copy]'); field.value = text; field.hidden = false; field.focus(); field.select(); $('[data-gc-copy-status]').textContent = 'Automatic copying is unavailable. Your notes are selected below; copy them using your device’s copy command.'; }
  });
  if (current === 5) renderResults(false); else renderQuestion(false);
})();
