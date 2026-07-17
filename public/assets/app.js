(() => {
  'use strict';

  const I18N = window.SIGMA_I18N;
  if (!I18N) throw new Error('SIGMA locale bundle is missing.');

  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const AXIS_KEYS = ['problem', 'solution', 'revenue', 'market', 'differentiation', 'feasibility', 'scalability'];
  const SIGNAL_CONCEPTS = [
    ['고객', '사용자', '환자', 'customer', 'customers', 'user', 'users', 'patient'],
    ['가격', '요금', 'price', 'pricing', 'subscription', '구독'],
    ['배포', '유통', '채널', 'distribution', 'channel', 'acquisition'],
    ['현재', '대안', 'current', 'today', 'workaround', 'alternative'],
    ['문제', '고통', '불편', 'problem', 'pain', 'friction'],
    ['수익', '매출', 'revenue', 'monetization', 'margin'],
    ['시장', 'market', 'segment', 'niche'],
    ['비용', 'cost', 'expense', 'budget'],
    ['경쟁', '대체재', 'competitor', 'competition', 'alternative'],
    ['규제', 'regulation', 'compliance', 'legal'],
    ['월', '연간', 'monthly', 'annual', 'per month'],
    ['영업', '파트너', '커뮤니티', 'sales', 'partner', 'community']
  ];
  const RISK_CONCEPTS = [
    ['어렵', '복잡', 'difficult', 'hard', 'complex'],
    ['문제', '위험', 'problem', 'risk'],
    ['저항', '반대', 'resistance', 'objection'],
    ['규제', 'regulation', 'compliance'],
    ['경쟁', 'competitor', 'competition'],
    ['비용', 'cost', 'expensive'],
    ['의존', 'dependency', 'dependence', 'reliance'],
    ['개인정보', 'privacy', 'personal data'],
    ['연동', 'integration', 'integrate'],
    ['무료', 'free', 'unpaid']
  ];
  const DISTRIBUTION_TERMS = /배포|유통|채널|커뮤니티|영업|파트너|distribution|channel|community|sales|partner|outbound/i;
  const HIDDEN_RESULT_PANELS = '#decisionPanel,#evidencePanel,#experimentPanel,#actionsPanel,#slopsCard,#jsonPanel';

  let lastData = null;
  let toastTimer = null;

  if (window.SigmaLocale) window.SigmaLocale.saveLocale(I18N.locale);

  function tick() {
    const now = new Date();
    $('#clock').textContent = new Intl.DateTimeFormat(I18N.dateLocale, {
      timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit'
    }).format(now) + ' KST';
  }

  function toast(message) {
    const element = $('#toast');
    clearTimeout(toastTimer);
    element.textContent = message;
    element.classList.add('show');
    toastTimer = setTimeout(() => element.classList.remove('show'), 1800);
  }

  function conceptCount(value, concepts) {
    const normalized = value.toLocaleLowerCase();
    return concepts.filter(words => words.some(word => normalized.includes(word))).length;
  }

  function updateStats() {
    const value = $('#idea').value;
    const words = (value.trim().match(/[\p{L}\p{N}_]+/gu) || []).length;
    const signals = conceptCount(value, SIGNAL_CONCEPTS);
    const risks = conceptCount(value, RISK_CONCEPTS);
    const readiness = signals >= 5 ? 'filed' : signals >= 3 ? 'usable' : 'draft';
    $('#charCount').textContent = I18N.stats.characters(value.length);
    $('#wordCount').textContent = words;
    $('#signalCount').textContent = signals;
    $('#riskCount').textContent = risks;
    $('#readiness').textContent = I18N.stats.readiness[readiness];
  }

  function loadExample(index) {
    $('#idea').value = I18N.examples[index];
    updateStats();
    $('#idea').focus();
    toast(I18N.toast.caseLoaded);
  }

  function clearEditor() {
    $('#idea').value = '';
    updateStats();
    $('#errMsg').style.display = 'none';
    $('#idea').focus();
  }

  function scoreMarkup(verdict = I18N.result.awaiting, summary = '') {
    return `<div class="score-ring"><svg viewBox="0 0 220 220" aria-hidden="true"><circle class="track" cx="110" cy="110" r="92"></circle><circle class="fill" id="ringFill" cx="110" cy="110" r="92" stroke-dasharray="578" stroke-dashoffset="578"></circle></svg><div class="score-number" id="scoreVal">—</div></div><div class="verdict" id="verdictBadge">${escapeHtml(verdict)}</div><p class="summary" id="verdictDesc">${escapeHtml(summary)}</p>`;
  }

  function showResultsSkeleton() {
    $('#results').classList.add('show');
    $('#scoreBlock').innerHTML = '<div class="skeleton-ring"></div><div class="skeleton-dark loading-pulse skeleton-verdict"></div><div class="skeleton-dark loading-pulse skeleton-summary"></div><div class="skeleton-dark loading-pulse skeleton-summary-short"></div>';
    let axes = '';
    for (let index = 0; index < 7; index++) {
      axes += `<article class="axis-card"><div class="axis-score skeleton-light loading-pulse">--</div><div class="axis-content"><div class="axis-top"><div><h4>${String(index + 1).padStart(2, '0')} — <span class="skeleton-light skeleton-axis-title"></span></h4></div></div><div class="rail"><span></span></div><p class="axis-body"><span class="skeleton-light skeleton-line"></span><span class="skeleton-light skeleton-line skeleton-line-short"></span></p></div></article>`;
    }
    $('#axes').innerHTML = axes;
    $('#resultTime').textContent = I18N.result.analyzing;
    $$(HIDDEN_RESULT_PANELS).forEach(panel => panel.classList.add('hidden'));
    $('#errMsg').style.display = 'none';
    $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showResultsError(message) {
    $('#results').classList.add('show');
    $('#scoreBlock').innerHTML = `<div class="result-error"><div aria-hidden="true">⚠</div><p>${escapeHtml(message)}</p><small>${escapeHtml(I18N.validation.connection)}</small></div>`;
    $('#axes').innerHTML = '';
    $('#resultTime').textContent = I18N.result.error;
    $$(HIDDEN_RESULT_PANELS).forEach(panel => panel.classList.add('hidden'));
  }

  function localizedApiError(data, status) {
    return I18N.validation.apiErrors[data.code] || data.message || I18N.validation.serverError(status);
  }

  async function runValidation() {
    const idea = $('#idea').value.trim();
    if (idea.length < 10) {
      showError(I18N.validation.tooShort);
      return;
    }

    showResultsSkeleton();
    const button = $('#btnEval');
    button.classList.add('loading');
    button.disabled = true;
    button.querySelector('span').textContent = I18N.result.loadingButton;

    try {
      const response = await fetch(`/api/evaluate?locale=${encodeURIComponent(I18N.locale)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, locale: I18N.locale })
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(localizedApiError(data, response.status));
      renderResults(data, idea);
      saveHistory(data, idea);
    } catch (error) {
      showError(error.message);
      showResultsError(error.message);
    } finally {
      button.classList.remove('loading');
      button.disabled = false;
      button.querySelector('span').textContent = I18N.result.runButton;
    }
  }

  function showError(message) {
    const element = $('#errMsg');
    element.textContent = message;
    element.style.display = 'block';
  }

  function renderResults(data, idea) {
    lastData = { ...data, idea, locale: I18N.locale, createdAt: new Date().toISOString() };
    $('#scoreBlock').innerHTML = scoreMarkup();

    const shareButton = $('#shareLinkBtn');
    shareButton.disabled = !data.reportId;
    shareButton.title = data.reportId ? I18N.result.shareAvailable : I18N.result.shareUnavailable;

    $('#results').classList.add('show');
    $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    const score = Number(data.overall_score || 0);
    const circumference = 2 * Math.PI * 92;
    $('#ringFill').setAttribute('stroke-dasharray', circumference);
    $('#ringFill').setAttribute('stroke-dashoffset', circumference * (1 - score / 100));
    animateNumber($('#scoreVal'), score);
    $('#lastScore').textContent = score;

    const [mode] = decisionFor(data);
    $('#verdictBadge').textContent = I18N.result.verdictLabels[mode] || I18N.result.awaiting;
    $('#verdictDesc').textContent = data.summary || '';
    $('#resultTime').textContent = new Intl.DateTimeFormat(I18N.dateLocale, {
      timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short'
    }).format(new Date());

    renderAxes(data.axes || []);
    renderDecision(data);
    renderEvidence(data, idea);
    renderExperiments(data);
    renderNextActions(data);
    renderSlops(data.slops || []);
    drawRadar(data.axes || []);
    $('#rawJson').textContent = JSON.stringify(lastData, null, 2);
    $('#jsonPanel').classList.remove('hidden');
  }

  function animateNumber(element, target) {
    const startedAt = performance.now();
    let done = false;
    function finish() {
      if (!done) {
        done = true;
        element.textContent = String(target);
      }
    }
    function frame(now) {
      const progress = Math.min((now - startedAt) / 1000, 1);
      element.textContent = Math.round(target * progress);
      if (progress < 1) requestAnimationFrame(frame);
      else finish();
    }
    requestAnimationFrame(frame);
    setTimeout(finish, 1250);
  }

  function axisScore(data, key) {
    const index = AXIS_KEYS.indexOf(key);
    const axis = (data.axes || []).find(item => item.key === key) || (data.axes || [])[index];
    return Number(axis && axis.score || 0);
  }

  function decisionFor(data) {
    const score = Number(data.overall_score || 0);
    const slops = (data.slops || []).length;
    const demand = axisScore(data, 'problem');
    const differentiation = axisScore(data, 'differentiation');
    let mode = 'test';
    if (score >= 72 && demand >= 65 && slops <= 1) mode = 'scale';
    else if (score < 45 || differentiation < 40) mode = 'kill';
    return [mode, I18N.decision.reasons[mode]];
  }

  function renderDecision(data) {
    const [mode, reason] = decisionFor(data);
    $('#decisionPanel').classList.remove('hidden');
    ['kill', 'test', 'scale'].forEach(value => $('#' + value + 'Tile').classList.toggle('active', value === mode));
    $('#decisionReason').textContent = `${reason} ${I18N.decision.qualifier}`;
  }

  function renderEvidence(data, idea) {
    $('#evidencePanel').classList.remove('hidden');
    const problem = axisScore(data, 'problem');
    const revenue = axisScore(data, 'revenue');
    const differentiation = axisScore(data, 'differentiation');
    const scalability = axisScore(data, 'scalability');
    const feasibility = axisScore(data, 'feasibility');
    const rows = [
      [I18N.evidence.rows[0], problem >= 70 ? 'observed' : 'inferred', problem],
      [I18N.evidence.rows[1], revenue >= 65 ? 'inferred' : 'guessed', revenue],
      [I18N.evidence.rows[2], differentiation >= 65 ? 'inferred' : 'guessed', differentiation],
      [I18N.evidence.rows[3], DISTRIBUTION_TERMS.test(idea) ? 'inferred' : 'guessed', scalability],
      [I18N.evidence.rows[4], feasibility >= 70 ? 'observed' : 'inferred', feasibility]
    ];
    let html = `<div class="evidence-row evidence-head">${I18N.evidence.headers.map(value => `<div>${escapeHtml(value)}</div>`).join('')}</div>`;
    html += rows.map(([copy, status, score]) => `<div class="evidence-row"><div>${escapeHtml(copy[0])}</div><div><span class="badge ${status}">${escapeHtml(I18N.evidence.statuses[status])}</span></div><div>${score}/100</div><div>${escapeHtml(copy[1])}</div></div>`).join('');
    $('#evidenceGrid').innerHTML = html;
  }

  function renderExperiments(data) {
    $('#experimentPanel').classList.remove('hidden');
    const weak = [...(data.axes || [])].sort((a, b) => (a.score || 0) - (b.score || 0)).slice(0, 2).map(axis => axis.name).join(', ');
    $('#experimentList').innerHTML = I18N.experiments(weak).map(item => `<div class="experiment-item"><b>${item[0]}</b><div><strong>${escapeHtml(item[1])}</strong><p>${escapeHtml(item[2])}</p></div></div>`).join('');
  }

  function renderNextActions(data) {
    $('#actionsPanel').classList.remove('hidden');
    const [mode] = decisionFor(data);
    const actions = I18N.nextActions[mode];
    $('#nextList').innerHTML = actions.map((action, index) => `<div class="next-item"><b>${index + 1}</b><div><strong>${escapeHtml(I18N.nextActions.day(index + 1))}</strong><p>${escapeHtml(action)}</p></div></div>`).join('');
  }

  function renderAxes(axes) {
    const box = $('#axes');
    box.innerHTML = '';
    axes.forEach((axis, index) => {
      const card = document.createElement('article');
      card.className = 'axis-card';
      card.innerHTML = `<div class="axis-score">${Number(axis.score || 0)}</div><div class="axis-content"><div class="axis-top"><div><h4>${String(index + 1).padStart(2, '0')} — ${escapeHtml(axis.name)}</h4><small>${escapeHtml(axis.question || '')}</small></div></div><div class="rail"><span></span></div><p class="axis-body">${escapeHtml(axis.analysis || '')}</p></div>`;
      box.appendChild(card);
      setTimeout(() => { card.querySelector('.rail span').style.width = `${Number(axis.score || 0)}%`; }, 120 + index * 80);
    });
  }

  function renderSlops(slops) {
    const panel = $('#slopsCard');
    const list = $('#slopsList');
    list.innerHTML = '';
    if (!slops.length) {
      panel.classList.add('hidden');
      return;
    }
    panel.classList.remove('hidden');
    slops.forEach(slop => {
      const row = document.createElement('div');
      row.className = 'slop-item';
      const severity = ['fatal', 'warn', 'minor'].includes(slop.severity) ? slop.severity : 'warn';
      row.innerHTML = `<div class="tag ${severity}">${escapeHtml(slop.type || I18N.slopFallback)}</div><div>${escapeHtml(slop.description || '')}</div>`;
      list.appendChild(row);
    });
  }

  function drawRadar(axes) {
    const canvas = $('#radar');
    const context = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 118;
    const count = axes.length;
    context.clearRect(0, 0, width, height);
    if (count < 3) return;

    context.strokeStyle = '#111318';
    context.lineWidth = 2;
    for (let level = 1; level <= 4; level++) {
      context.beginPath();
      for (let index = 0; index < count; index++) {
        const angle = -Math.PI / 2 + index * 2 * Math.PI / count;
        const levelRadius = radius * level / 4;
        const x = centerX + Math.cos(angle) * levelRadius;
        const y = centerY + Math.sin(angle) * levelRadius;
        index ? context.lineTo(x, y) : context.moveTo(x, y);
      }
      context.closePath();
      context.stroke();
    }
    for (let index = 0; index < count; index++) {
      const angle = -Math.PI / 2 + index * 2 * Math.PI / count;
      context.beginPath();
      context.moveTo(centerX, centerY);
      context.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      context.stroke();
    }
    context.beginPath();
    axes.forEach((axis, index) => {
      const angle = -Math.PI / 2 + index * 2 * Math.PI / count;
      const pointRadius = radius * Number(axis.score || 0) / 100;
      const x = centerX + Math.cos(angle) * pointRadius;
      const y = centerY + Math.sin(angle) * pointRadius;
      index ? context.lineTo(x, y) : context.moveTo(x, y);
    });
    context.closePath();
    context.fillStyle = '#c8a451';
    context.globalAlpha = 0.25;
    context.fill();
    context.globalAlpha = 1;
    context.strokeStyle = '#0b1220';
    context.lineWidth = 4;
    context.stroke();
    context.fillStyle = '#111318';
    context.font = '11px SF Mono, monospace';
    context.textAlign = 'center';
    axes.forEach((axis, index) => {
      const angle = -Math.PI / 2 + index * 2 * Math.PI / count;
      const x = centerX + Math.cos(angle) * (radius + 31);
      const y = centerY + Math.sin(angle) * (radius + 31);
      context.fillText(String(Number(axis.score || 0)), x, y);
    });
  }

  function readHistory() {
    try {
      const history = JSON.parse(localStorage.getItem('sigmaHistory') || '[]');
      if (!Array.isArray(history)) return [];
      const records = history.filter(item => item && typeof item === 'object');
      let migrated = records.length !== history.length;
      records.forEach(item => {
        if (!item.locale) {
          item.locale = 'ko';
          migrated = true;
        }
      });
      if (migrated) localStorage.setItem('sigmaHistory', JSON.stringify(records));
      return records;
    } catch {
      return [];
    }
  }

  function saveHistory(data, idea) {
    const all = readHistory();
    const [mode] = decisionFor(data);
    const record = { score: data.overall_score, summary: data.summary, idea, at: new Date().toISOString(), verdict: mode, locale: I18N.locale, version: 2 };
    const current = [record, ...all.filter(item => item.locale === I18N.locale)].slice(0, 8);
    const other = all.filter(item => item.locale !== I18N.locale).slice(0, 8);
    try {
      localStorage.setItem('sigmaHistory', JSON.stringify([...current, ...other]));
    } catch { /* Evaluation remains usable when browser storage is unavailable. */ }
    renderHistory();
  }

  function renderHistory() {
    const history = readHistory().filter(item => item.locale === I18N.locale).slice(0, 8);
    $('#runCount').textContent = history.length;
    if (history.length) $('#lastScore').textContent = history[0].score;
    const list = $('#historyList');
    list.innerHTML = history.length ? '' : `<div class="history-item"><span>—</span><span>${escapeHtml(I18N.history.empty)}</span><span></span></div>`;
    history.forEach(item => {
      const row = document.createElement('div');
      row.className = 'history-item';
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      const verdict = item.verdict || 'test';
      row.innerHTML = `<b class="history-score ${verdict}">${Number(item.score || 0)}</b><span>${escapeHtml((item.idea || '').slice(0, 80))}</span><time>${new Date(item.at).toLocaleTimeString(I18N.dateLocale, { hour: '2-digit', minute: '2-digit' })}</time>`;
      const restore = () => {
        $('#idea').value = item.idea || '';
        updateStats();
        toast(I18N.toast.archiveRestored);
      };
      row.addEventListener('click', restore);
      row.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          restore();
        }
      });
      list.appendChild(row);
    });
  }

  async function copyText(text, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
      toast(successMessage);
      return true;
    } catch {
      toast(I18N.toast.copyFailed);
      return false;
    }
  }

  async function copyReport() {
    if (!lastData) {
      toast(I18N.toast.noReport);
      return;
    }
    const [mode, reason] = decisionFor(lastData);
    const memo = I18N.memo;
    const axes = (lastData.axes || []).map(axis => `- ${axis.name}: ${axis.score}/100 — ${axis.analysis}`).join('\n');
    const slops = (lastData.slops || []).map(slop => `- ${slop.type} [${memo.severities[slop.severity] || slop.severity}]: ${slop.description}`).join('\n') || memo.none;
    const actions = memo.actions.map(action => `- ${action}`).join('\n');
    const text = `${memo.title}\n\n${memo.verdict}: ${memo.verdictModes[mode]}\n${memo.reason}: ${reason}\n${memo.score}: ${lastData.overall_score}/100\n${memo.summary}: ${lastData.summary}\n\n${memo.axes}:\n${axes}\n\n${memo.slops}:\n${slops}\n\n${memo.next}:\n${actions}`;
    await copyText(text, I18N.toast.reportCopied);
  }

  async function copyShareLink() {
    if (!lastData || !lastData.reportId) {
      toast(I18N.toast.noShareLink);
      return;
    }
    await copyText(`${location.origin}/api/evaluate?report=${lastData.reportId}&locale=${encodeURIComponent(I18N.locale)}`, I18N.toast.linkCopied);
  }

  function saveDraft(showConfirmation = true) {
    try {
      localStorage.setItem('sigmaDraft', $('#idea').value);
      if (showConfirmation) toast(I18N.toast.draftSaved);
    } catch {
      if (showConfirmation) toast(I18N.toast.copyFailed);
    }
  }

  function exportDraft() {
    const blob = new Blob([$('#idea').value], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = I18N.exportFilename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  }

  function commandDefinitions() {
    return [
      ['validate', runValidation], ['demo', () => loadExample(0)], ['clear', clearEditor], ['link', copyShareLink],
      ['copy', copyReport], ['raw', () => $('#jsonPanel').classList.toggle('hidden')], ['memo', copyReport], ['print', () => window.print()]
    ].map(([key, action]) => ({ key, name: I18N.commands[key][0], description: I18N.commands[key][1], action }));
  }

  function openCommand() {
    renderCommands('');
    $('#command').classList.add('show');
    $('#commandInput').value = '';
    setTimeout(() => $('#commandInput').focus(), 20);
  }

  function closeCommand() {
    $('#command').classList.remove('show');
    $('#cmdBtn').focus();
  }

  function renderCommands(query) {
    const normalized = query.toLocaleLowerCase(I18N.dateLocale);
    const rows = $('#commandRows');
    rows.innerHTML = '';
    commandDefinitions().filter(command => `${command.key} ${command.name} ${command.description}`.toLocaleLowerCase(I18N.dateLocale).includes(normalized)).forEach(command => {
      const row = document.createElement('div');
      row.className = 'command-row';
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      row.innerHTML = `<strong>${escapeHtml(command.name)}</strong><span>${escapeHtml(command.description)}</span>`;
      const run = () => { closeCommand(); command.action(); };
      row.addEventListener('click', run);
      row.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          run();
        }
      });
      rows.appendChild(row);
    });
  }

  $('#idea').addEventListener('input', updateStats);
  $('#btnEval').addEventListener('click', runValidation);
  $('#focusBtn').addEventListener('click', () => $('#idea').focus());
  $('#demoBtn').addEventListener('click', () => loadExample(0));
  $('#clearBtn').addEventListener('click', clearEditor);
  $('#saveDraftBtn').addEventListener('click', () => saveDraft(true));
  $('#exportDraftBtn').addEventListener('click', exportDraft);
  $('#copyReportBtn').addEventListener('click', copyReport);
  $('#shareLinkBtn').addEventListener('click', copyShareLink);
  $('#printBtn').addEventListener('click', () => window.print());
  $('#copyUrlBtn').addEventListener('click', () => copyText(location.href, I18N.toast.urlCopied));
  $('#cmdBtn').addEventListener('click', openCommand);
  $$('.sample').forEach(button => button.addEventListener('click', () => loadExample(Number(button.dataset.i))));
  $$('.locale-switch [data-locale]').forEach(link => link.addEventListener('click', () => saveDraft(false)));
  $('#commandInput').addEventListener('input', event => renderCommands(event.target.value));
  $('#command').addEventListener('click', event => { if (event.target.id === 'command') closeCommand(); });

  document.addEventListener('keydown', event => {
    if (event.key === '/' && document.activeElement !== $('#idea') && document.activeElement !== $('#commandInput')) {
      event.preventDefault();
      $('#idea').focus();
    }
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      runValidation();
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openCommand();
    }
    if (event.key === 'Escape') {
      if ($('#command').classList.contains('show')) closeCommand();
      else if (document.activeElement === $('#idea')) $('#idea').blur();
    }
  });

  try {
    const draft = localStorage.getItem('sigmaDraft');
    if (draft) {
      $('#idea').value = draft;
      toast(I18N.toast.draftRestored);
    }
  } catch { /* Private browsing can disable storage. */ }

  setInterval(tick, 1000);
  tick();
  updateStats();
  renderHistory();
})();
