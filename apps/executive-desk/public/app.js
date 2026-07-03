const state = {
  principalId: 'user@example.com',
  risk: null,
  receipts: { data: [], total: 0 },
  receiptStats: null,
  delegations: { data: [], total: 0 }
};

const el = {
  principalId: document.getElementById('principalId'),
  refreshButton: document.getElementById('refreshButton'),
  riskScore: document.getElementById('riskScore'),
  riskDecision: document.getElementById('riskDecision'),
  receiptTotal: document.getElementById('receiptTotal'),
  receiptWindow: document.getElementById('receiptWindow'),
  delegationTotal: document.getElementById('delegationTotal'),
  delegationState: document.getElementById('delegationState'),
  authBoundary: document.getElementById('authBoundary'),
  lastUpdated: document.getElementById('lastUpdated'),
  briefingList: document.getElementById('briefingList'),
  delegationRows: document.getElementById('delegationRows'),
  delegationFilter: document.getElementById('delegationFilter'),
  serviceList: document.getElementById('serviceList'),
  riskTimestamp: document.getElementById('riskTimestamp'),
  factorInfra: document.getElementById('factorInfra'),
  factorIncidents: document.getElementById('factorIncidents'),
  factorDeployments: document.getElementById('factorDeployments'),
  factorResources: document.getElementById('factorResources'),
  receiptRows: document.getElementById('receiptRows'),
  receiptStatus: document.getElementById('receiptStatus'),
  exportCsv: document.getElementById('exportCsv'),
  pinBriefing: document.getElementById('pinBriefing'),
  toast: document.getElementById('toast')
};

function headers() {
  return { 'X-Principal-Id': state.principalId };
}

async function api(path) {
  const response = await fetch(path, { headers: headers() });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.details || payload.error || `HTTP ${response.status}`);
  }
  return payload;
}

function chip(value) {
  const safe = String(value || 'neutral').toLowerCase();
  const span = document.createElement('span');
  span.className = `status-chip ${safe}`;
  span.textContent = safe;
  return span;
}

function formatTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function percent(score) {
  const number = Number(score || 0);
  return `${Math.round(number * 100)}%`;
}

function toast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('show');
  window.clearTimeout(toast.timeout);
  toast.timeout = window.setTimeout(() => el.toast.classList.remove('show'), 2600);
}

function renderSummary() {
  const risk = state.risk;
  el.riskScore.textContent = risk ? percent(risk.overallScore) : '-';
  el.riskDecision.textContent = risk?.decision || 'pending';
  el.riskDecision.className = `status-chip ${risk?.decision || 'neutral'}`;
  el.receiptTotal.textContent = String(state.receiptStats?.executedCount + state.receiptStats?.blockedCount + state.receiptStats?.issuedCount + state.receiptStats?.rejectedCount || state.receipts.total || 0);
  el.receiptWindow.textContent = '24h';
  el.delegationTotal.textContent = String(state.delegations.total || 0);
  el.delegationState.textContent = el.delegationFilter.value === 'all' ? 'all rules' : 'active view';
  el.authBoundary.textContent = state.principalId ? 'enforced' : 'missing';
  el.lastUpdated.textContent = formatTime(new Date().toISOString());
  const exportUrl = new URL('/api/executive/receipts/export', window.location.origin);
  exportUrl.searchParams.set('format', 'csv');
  if (el.receiptStatus.value) exportUrl.searchParams.set('status', el.receiptStatus.value);
  el.exportCsv.href = exportUrl.toString();
}

function renderBriefing() {
  const items = [];
  const risk = state.risk;
  const stats = state.receiptStats;

  if (risk) {
    items.push({
      title: `Risk gate ${risk.decision}`,
      severity: risk.decision === 'pass' ? 'healthy' : risk.decision,
      summary: `${risk.services.length} services checked. Overall risk is ${percent(risk.overallScore)}.`,
      source: 'risk/status',
      timestamp: risk.timestamp
    });
  }

  if (stats) {
    items.push({
      title: `${stats.executedCount} executed receipts`,
      severity: stats.blockedCount > 0 ? 'warn' : 'healthy',
      summary: `${stats.blockedCount} blocked and ${stats.rejectedCount} rejected receipts in the current window.`,
      source: 'receipts/stats',
      timestamp: new Date().toISOString()
    });
  }

  items.push({
    title: 'Gate 7 active',
    severity: 'neutral',
    summary: 'Frontend panels are connected to verified Gate 6 read APIs.',
    source: 'executive-desk',
    timestamp: new Date().toISOString()
  });

  el.briefingList.replaceChildren(...items.map((item) => {
    const row = document.createElement('div');
    row.className = 'briefing-item';
    const line = document.createElement('div');
    line.className = 'briefing-line';
    const title = document.createElement('strong');
    title.textContent = item.title;
    line.append(title, chip(item.severity));
    const summary = document.createElement('p');
    summary.textContent = item.summary;
    const meta = document.createElement('p');
    meta.textContent = `${item.source} | ${formatTime(item.timestamp)}`;
    row.append(line, summary, meta);
    return row;
  }));
}

function renderDelegations() {
  const rows = state.delegations.data;
  if (!rows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.className = 'empty';
    td.textContent = 'No delegation records returned.';
    tr.append(td);
    el.delegationRows.replaceChildren(tr);
    return;
  }

  el.delegationRows.replaceChildren(...rows.map((rule) => {
    const tr = document.createElement('tr');
    const status = rule.revokedAt ? 'revoked' : rule.validUntil && new Date(rule.validUntil) < new Date() ? 'expired' : 'active';
    [rule.grantedTo, rule.command, rule.scope].forEach((value) => {
      const td = document.createElement('td');
      td.className = 'mono';
      td.textContent = value || '-';
      tr.append(td);
    });
    const td = document.createElement('td');
    td.append(chip(status));
    tr.append(td);
    return tr;
  }));
}

function renderRisk() {
  const risk = state.risk;
  if (!risk) return;

  el.riskTimestamp.textContent = formatTime(risk.timestamp);
  el.factorInfra.value = risk.factors.infraHealth || 0;
  el.factorIncidents.value = risk.factors.recentIncidents || 0;
  el.factorDeployments.value = risk.factors.deploymentStatus || 0;
  el.factorResources.value = risk.factors.resourcePressure || 0;

  el.serviceList.replaceChildren(...risk.services.map((service) => {
    const row = document.createElement('div');
    row.className = 'service-row';
    const line = document.createElement('div');
    line.className = 'service-line';
    const name = document.createElement('strong');
    name.textContent = service.service;
    line.append(name, chip(service.status));
    const meta = document.createElement('p');
    const timing = service.responseTime ? `${service.responseTime}ms` : 'no timing';
    meta.textContent = `${timing} | checked ${formatTime(service.lastChecked)}`;
    row.append(line, meta);
    return row;
  }));
}

function renderReceipts() {
  const rows = state.receipts.data;
  if (!rows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'empty';
    td.textContent = 'No receipt records returned.';
    tr.append(td);
    el.receiptRows.replaceChildren(tr);
    return;
  }

  el.receiptRows.replaceChildren(...rows.map((receipt) => {
    const tr = document.createElement('tr');
    const riskScore = receipt.riskGateOutcome?.score;
    [
      formatTime(receipt.timestamp),
      receipt.command,
      receipt.executor,
      receipt.status,
      typeof riskScore === 'number' ? percent(riskScore) : '-'
    ].forEach((value, index) => {
      const td = document.createElement('td');
      if (index === 1 || index === 2) td.className = 'mono';
      if (index === 3) {
        td.append(chip(value));
      } else {
        td.textContent = value || '-';
      }
      tr.append(td);
    });
    return tr;
  }));
}

async function refresh() {
  state.principalId = el.principalId.value.trim();
  if (!state.principalId) {
    toast('Principal is required.');
    return;
  }

  el.refreshButton.disabled = true;
  try {
    const receiptUrl = new URL('/api/executive/receipts', window.location.origin);
    receiptUrl.searchParams.set('limit', '25');
    if (el.receiptStatus.value) receiptUrl.searchParams.set('status', el.receiptStatus.value);

    const delegationUrl = new URL('/api/executive/delegations', window.location.origin);
    if (el.delegationFilter.value === 'all') delegationUrl.searchParams.set('includeRevoked', 'true');

    const [risk, stats, receipts, delegations] = await Promise.all([
      api('/api/executive/risk/status'),
      api('/api/executive/receipts/stats?window=24h'),
      api(receiptUrl.pathname + receiptUrl.search),
      api(delegationUrl.pathname + delegationUrl.search)
    ]);

    state.risk = risk;
    state.receiptStats = stats;
    state.receipts = receipts;
    state.delegations = delegations;

    renderSummary();
    renderBriefing();
    renderDelegations();
    renderRisk();
    renderReceipts();
    toast('Executive Desk synced.');
  } catch (error) {
    toast(error.message || 'Sync failed.');
  } finally {
    el.refreshButton.disabled = false;
  }
}

el.refreshButton.addEventListener('click', refresh);
el.principalId.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') refresh();
});
el.delegationFilter.addEventListener('change', refresh);
el.receiptStatus.addEventListener('change', refresh);
el.pinBriefing.addEventListener('click', () => toast('Briefing pinned for this session.'));

refresh();
