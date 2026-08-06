const state = {
  principalId: 'user@example.com',
  apiBaseUrl: '',
  session: {
    accessToken: '',
    expiresAt: '',
    connected: false,
    remoteConfigured: false,
    remoteReachable: false
  },
  risk: null,
  receipts: { data: [], total: 0 },
  receiptStats: null,
  delegations: { data: [], total: 0 },
  cadence: {
    mode: 'daily',
    weeklyDay: 'sunday',
    monthlyDay: '1'
  },
  closeout: {
    gbpAttached: false,
    gbpReference: '',
    mobTemplateRequired: true,
    mobLastRunAt: null,
    mobLastRunStatus: 'not_run'
  },
  mobRuns: [],
  mobPanel: {
    status: 'all',
    windowDays: '7',
    summary: {
      total: 0,
      completed: 0,
      failed: 0,
      successRate: 0,
      lastRunAt: null
    },
    timeseries: []
  }
};

const el = {
  principalId: document.getElementById('principalId'),
  refreshButton: document.getElementById('refreshButton'),
  sessionStrip: document.getElementById('sessionStrip'),
  sessionStatus: document.getElementById('sessionStatus'),
  signOutButton: document.getElementById('signOutButton'),
  signinShell: document.getElementById('signinShell'),
  connectStatus: document.getElementById('connectStatus'),
  signinForm: document.getElementById('signinForm'),
  apiBaseUrl: document.getElementById('apiBaseUrl'),
  signinEmail: document.getElementById('signinEmail'),
  signinPassword: document.getElementById('signinPassword'),
  signinButton: document.getElementById('signinButton'),
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
  toast: document.getElementById('toast'),
  cadenceMode: document.getElementById('cadenceMode'),
  weeklyDay: document.getElementById('weeklyDay'),
  monthlyDay: document.getElementById('monthlyDay'),
  gbpAttached: document.getElementById('gbpAttached'),
  gbpReference: document.getElementById('gbpReference'),
  mobTemplateRequired: document.getElementById('mobTemplateRequired'),
  mobRunStatus: document.getElementById('mobRunStatus'),
  runMobTemplate: document.getElementById('runMobTemplate'),
  saveCloseout: document.getElementById('saveCloseout'),
  mobRunHistory: document.getElementById('mobRunHistory'),
  mobFilterStatus: document.getElementById('mobFilterStatus'),
  mobWindowDays: document.getElementById('mobWindowDays'),
  mobSummaryTotal: document.getElementById('mobSummaryTotal'),
  mobSummarySuccessRate: document.getElementById('mobSummarySuccessRate'),
  mobSummaryCompleted: document.getElementById('mobSummaryCompleted'),
  mobSummaryFailed: document.getElementById('mobSummaryFailed'),
  mobSummaryLastRun: document.getElementById('mobSummaryLastRun'),
  mobTrendLine: document.getElementById('mobTrendLine'),
  mobRows: document.getElementById('mobRows'),
  mobExportFormat: document.getElementById('mobExportFormat'),
  mobExportButton: document.getElementById('mobExportButton'),
  mobExportBundleButton: document.getElementById('mobExportBundleButton')
};

const SESSION_STORAGE_KEY = 'executiveDeskSentinelSession';
const API_BASE_STORAGE_KEY = 'executiveDeskApiBaseUrl';

function normalizeApiBase(value) {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    return `${url.origin}`;
  } catch {
    return '';
  }
}

function resolveApiPath(path) {
  if (!state.apiBaseUrl) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${state.apiBaseUrl}${normalizedPath}`;
}

function loadApiBaseUrl() {
  const paramValue = new URLSearchParams(window.location.search).get('apiBase');
  const storedValue = window.localStorage.getItem(API_BASE_STORAGE_KEY);
  const selected = normalizeApiBase(paramValue) || normalizeApiBase(storedValue) || window.location.origin;

  state.apiBaseUrl = selected;
  if (el.apiBaseUrl) {
    el.apiBaseUrl.value = selected;
  }

  window.localStorage.setItem(API_BASE_STORAGE_KEY, selected);
}

function persistApiBaseUrl() {
  const selected = normalizeApiBase(el.apiBaseUrl?.value) || window.location.origin;
  state.apiBaseUrl = selected;
  if (el.apiBaseUrl) {
    el.apiBaseUrl.value = selected;
  }
  window.localStorage.setItem(API_BASE_STORAGE_KEY, selected);
}

function headers() {
  const base = {
    'X-Principal-Id': state.principalId
  };

  if (state.session.accessToken) {
    base.Authorization = `Bearer ${state.session.accessToken}`;
  }

  return base;
}

async function api(path, options = {}) {
  const response = await fetch(resolveApiPath(path), {
    method: options.method || 'GET',
    headers: {
      ...headers(),
      ...(options.body ? { 'Content-Type': 'application/json' } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.details || payload.error || `HTTP ${response.status}`);
  }
  return payload;
}

async function apiDownload(path) {
  const response = await fetch(resolveApiPath(path), {
    headers: headers(),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.details || payload.error || `HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('content-disposition') || '';
  const nameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  const filename = nameMatch?.[1] || 'mob-runs-export';
  return { blob, filename };
}

function updateAuthShell() {
  const signedIn = state.session.connected;
  document.body.classList.toggle('signed-in', signedIn);
  document.body.classList.toggle('signed-out', !signedIn);
  el.sessionStrip.hidden = !signedIn;

  if (signedIn) {
    const exp = state.session.expiresAt ? ` until ${formatTime(state.session.expiresAt)}` : '';
    el.sessionStatus.textContent = `Signed in as ${state.principalId}${exp}`;
  }
}

function persistSession() {
  if (!state.session.connected) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
    principalId: state.principalId,
    accessToken: state.session.accessToken,
    expiresAt: state.session.expiresAt
  }));
}

function restoreSession() {
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return false;
  }

  try {
    const parsed = JSON.parse(raw);
    const expiresAt = parsed.expiresAt || '';
    const expired = expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;

    if (!parsed.principalId || !parsed.accessToken || expired) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return false;
    }

    state.principalId = parsed.principalId;
    state.session.accessToken = parsed.accessToken;
    state.session.expiresAt = expiresAt;
    state.session.connected = true;
    el.principalId.value = state.principalId;
    return true;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return false;
  }
}

function setConnectStatus(message, tone = 'warn') {
  el.connectStatus.textContent = message;
  el.connectStatus.className = `signin-status ${tone}`;
}

async function loadConnectionStatus() {
  try {
    const response = await fetch(resolveApiPath('/api/executive/connect/status'));
    const payload = await response.json();
    const data = payload.data || {};

    state.session.remoteConfigured = !!data.configured;
    state.session.remoteReachable = !!data.reachable;

    if (!data.configured) {
      setConnectStatus(`Sentinel AI is not configured on ${state.apiBaseUrl}. Set SENTINEL_AI_BASE_URL on the API server and restart it.`, 'error');
      return;
    }

    if (!data.reachable) {
      setConnectStatus('Sentinel AI is configured but unreachable. Start local Sentinel AI or verify auth/network.', 'warn');
      return;
    }

    setConnectStatus(`Sentinel AI is reachable via ${state.apiBaseUrl}. Sign in to connect this app.`, 'ok');
  } catch {
    setConnectStatus(`Unable to verify Sentinel AI at ${state.apiBaseUrl}. Check API URL, CORS, and network.`, 'error');
  }
}

async function signIn(event) {
  event.preventDefault();
  persistApiBaseUrl();
  const email = el.signinEmail.value.trim();
  const password = el.signinPassword.value;

  if (!email || !password) {
    setConnectStatus('Email and password are required.', 'error');
    return;
  }

  el.signinButton.disabled = true;
  setConnectStatus('Signing in through Sentinel AI...', 'warn');

  try {
    const response = await fetch(resolveApiPath('/api/executive/connect/signin'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.details || payload.error || 'Sign-in failed');
    }

    const session = payload.data?.session || {};
    state.principalId = session.principalId || email;
    state.session.accessToken = session.accessToken || state.principalId;
    state.session.expiresAt = session.expiresAt || '';
    state.session.connected = true;
    el.principalId.value = state.principalId;
    persistSession();
    updateAuthShell();
    setConnectStatus('Sign-in successful. Syncing dashboard...', 'ok');
    await refresh();
  } catch (error) {
    state.session.connected = false;
    persistSession();
    updateAuthShell();
    setConnectStatus(error.message || 'Sign-in failed.', 'error');
  } finally {
    el.signinButton.disabled = false;
  }
}

function signOut() {
  state.session.connected = false;
  state.session.accessToken = '';
  state.session.expiresAt = '';
  persistSession();
  updateAuthShell();
  setConnectStatus('Signed out. Sign in again to reconnect to SentinelOS.', 'warn');
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

function titleCase(value) {
  const text = String(value || '');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function cadenceSummary() {
  if (state.cadence.mode === 'weekly') {
    return `weekly (${titleCase(state.cadence.weeklyDay)})`;
  }
  if (state.cadence.mode === 'monthly') {
    return `monthly (day ${state.cadence.monthlyDay})`;
  }
  return 'daily (every day)';
}

function renderCadenceControls() {
  const weekly = state.cadence.mode === 'weekly';
  const monthly = state.cadence.mode === 'monthly';
  el.weeklyDay.hidden = !weekly;
  el.monthlyDay.hidden = !monthly;
}

function renderCloseoutControls() {
  el.cadenceMode.value = state.cadence.mode;
  el.weeklyDay.value = state.cadence.weeklyDay;
  el.monthlyDay.value = state.cadence.monthlyDay;
  el.gbpAttached.checked = !!state.closeout.gbpAttached;
  el.gbpReference.value = state.closeout.gbpReference || '';
  el.mobTemplateRequired.checked = !!state.closeout.mobTemplateRequired;
  renderCadenceControls();
}

function renderMobHistory() {
  const rows = state.mobRuns;
  if (!rows.length) {
    el.mobRunHistory.textContent = 'MOB template history: no runs recorded yet.';
    return;
  }

  el.mobRunHistory.replaceChildren(...rows.slice(0, 5).map((run) => {
    const row = document.createElement('div');
    row.className = 'mob-history-row';
    const left = document.createElement('span');
    left.textContent = `${formatTime(run.timestamp)} | ${run.executor}`;
    const right = document.createElement('span');
    right.append(chip(run.status));
    row.append(left, right);
    return row;
  }));
}

function renderMobPanel() {
  const summary = state.mobPanel.summary;
  el.mobSummaryTotal.textContent = String(summary.total || 0);
  el.mobSummarySuccessRate.textContent = `${Math.round((summary.successRate || 0) * 100)}%`;
  el.mobSummaryCompleted.textContent = String(summary.completed || 0);
  el.mobSummaryFailed.textContent = String(summary.failed || 0);
  el.mobSummaryLastRun.textContent = formatTime(summary.lastRunAt);

  const trend = state.mobPanel.timeseries || [];
  if (!trend.length) {
    el.mobTrendLine.textContent = `No MOB trend data in last ${state.mobPanel.windowDays} days.`;
  } else {
    const rendered = trend
      .slice(-7)
      .map((p) => `${p.date.slice(5)} C:${p.completed} F:${p.failed}`)
      .join(' | ');
    el.mobTrendLine.textContent = `Recent trend (${state.mobPanel.windowDays}d): ${rendered}`;
  }

  const rows = state.mobRuns;
  if (!rows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.className = 'empty';
    td.textContent = 'No MOB runs for selected filters.';
    tr.append(td);
    el.mobRows.replaceChildren(tr);
    return;
  }

  el.mobRows.replaceChildren(...rows.map((run) => {
    const tr = document.createElement('tr');
    const values = [formatTime(run.timestamp), run.executor, run.status, run.notes || '-'];
    values.forEach((value, idx) => {
      const td = document.createElement('td');
      if (idx === 1) td.className = 'mono';
      if (idx === 2) {
        td.append(chip(value));
      } else {
        td.textContent = value;
      }
      tr.append(td);
    });
    return tr;
  }));
}

async function loadMobPanelData() {
  const params = new URLSearchParams();
  params.set('limit', '50');
  params.set('windowDays', state.mobPanel.windowDays);
  if (state.mobPanel.status !== 'all') {
    params.set('status', state.mobPanel.status);
  }

  const mobRuns = await api(`/api/executive/closeout/mob-runs?${params.toString()}`);
  state.mobRuns = mobRuns.data || [];
  state.mobPanel.summary = mobRuns.summary || {
    total: 0,
    completed: 0,
    failed: 0,
    successRate: 0,
    lastRunAt: null
  };
  state.mobPanel.timeseries = mobRuns.timeseries || [];
}

async function exportMobRuns() {
  const params = new URLSearchParams();
  params.set('format', el.mobExportFormat.value || 'csv');
  params.set('limit', '500');
  params.set('windowDays', state.mobPanel.windowDays);
  if (state.mobPanel.status !== 'all') {
    params.set('status', state.mobPanel.status);
  }

  const { blob, filename } = await apiDownload(`/api/executive/closeout/mob-runs/export?${params.toString()}`);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

async function exportCloseoutBundle() {
  const params = new URLSearchParams();
  params.set('limit', '500');
  params.set('windowDays', state.mobPanel.windowDays);
  if (state.mobPanel.status !== 'all') {
    params.set('status', state.mobPanel.status);
  }

  const { blob, filename } = await apiDownload(`/api/executive/closeout/export-bundle?${params.toString()}`);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
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
  el.receiptWindow.textContent = cadenceSummary();
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

  if (state.cadence.mode === 'weekly') {
    items.push({
      title: `Weekly closeout set for ${titleCase(state.cadence.weeklyDay)}`,
      severity: state.cadence.weeklyDay === 'sunday' ? 'healthy' : 'warn',
      summary: `Weekly governance closeout cadence is configured for ${titleCase(state.cadence.weeklyDay)}.`,
      source: 'cadence/weekly',
      timestamp: new Date().toISOString()
    });
  } else if (state.cadence.mode === 'monthly') {
    items.push({
      title: `Monthly closeout set for day ${state.cadence.monthlyDay}`,
      severity: 'neutral',
      summary: `Monthly executive closeout is configured for calendar day ${state.cadence.monthlyDay}.`,
      source: 'cadence/monthly',
      timestamp: new Date().toISOString()
    });
  } else {
    items.push({
      title: 'Daily cadence active',
      severity: 'healthy',
      summary: 'Daily closeout briefing is active for every day.',
      source: 'cadence/daily',
      timestamp: new Date().toISOString()
    });
  }

  items.push({
    title: 'GBP intake required',
    severity: state.closeout.gbpAttached ? 'healthy' : 'warn',
    summary: state.closeout.gbpAttached
      ? `Government Blueprint (GBP) attached${state.closeout.gbpReference ? ` as ${state.closeout.gbpReference}` : ''}.`
      : 'Government Blueprint (GBP) artifact should be attached to the closeout package for this cycle.',
    source: 'governance/gbp',
    timestamp: new Date().toISOString()
  });

  items.push({
    title: 'Run executive template against MOB',
    severity: state.closeout.mobLastRunStatus === 'completed' ? 'healthy' : state.closeout.mobLastRunStatus === 'failed' ? 'block' : 'neutral',
    summary: state.closeout.mobLastRunAt
      ? `Latest MOB template run ${state.closeout.mobLastRunStatus} at ${formatTime(state.closeout.mobLastRunAt)}.`
      : 'Review MOB inputs and execute the executive template pass before final closeout sign-off.',
    source: 'governance/mob',
    timestamp: state.closeout.mobLastRunAt || new Date().toISOString()
  });

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

async function saveCloseoutState() {
  const payload = {
    cadence: {
      mode: state.cadence.mode,
      weeklyDay: state.cadence.weeklyDay,
      monthlyDay: state.cadence.monthlyDay
    },
    gbpAttached: el.gbpAttached.checked,
    gbpReference: el.gbpReference.value.trim(),
    mobTemplateRequired: el.mobTemplateRequired.checked
  };

  const result = await api('/api/executive/closeout/state', {
    method: 'PUT',
    body: payload
  });

  const closeout = result.data;
  state.cadence = closeout.cadence;
  state.closeout = {
    gbpAttached: closeout.gbpAttached,
    gbpReference: closeout.gbpReference,
    mobTemplateRequired: closeout.mobTemplateRequired,
    mobLastRunAt: closeout.mobLastRunAt || null,
    mobLastRunStatus: closeout.mobLastRunStatus || 'not_run'
  };

  renderCloseoutControls();
  renderSummary();
  renderBriefing();
}

async function runMobTemplate() {
  const result = await api('/api/executive/closeout/mob-runs', {
    method: 'POST',
    body: {
      status: el.mobRunStatus.value
    }
  });

  const run = result.data;
  state.closeout.mobLastRunAt = run.timestamp;
  state.closeout.mobLastRunStatus = run.status;
  await loadMobPanelData();
  renderMobHistory();
  renderMobPanel();
  renderBriefing();
}

async function refresh() {
  if (!state.session.connected) {
    toast('Sign in to SentinelOS first.');
    return;
  }

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

    const [risk, stats, receipts, delegations, closeout] = await Promise.all([
      api('/api/executive/risk/status'),
      api('/api/executive/receipts/stats?window=24h'),
      api(receiptUrl.pathname + receiptUrl.search),
      api(delegationUrl.pathname + delegationUrl.search),
      api('/api/executive/closeout/state')
    ]);

    state.risk = risk;
    state.receiptStats = stats;
    state.receipts = receipts;
    state.delegations = delegations;
    state.cadence = closeout.data.cadence;
    state.closeout = {
      gbpAttached: closeout.data.gbpAttached,
      gbpReference: closeout.data.gbpReference,
      mobTemplateRequired: closeout.data.mobTemplateRequired,
      mobLastRunAt: closeout.data.mobLastRunAt || null,
      mobLastRunStatus: closeout.data.mobLastRunStatus || 'not_run'
    };

    await loadMobPanelData();

    renderCloseoutControls();
    renderMobHistory();
    renderMobPanel();
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
el.signinForm.addEventListener('submit', signIn);
el.apiBaseUrl.addEventListener('change', () => {
  persistApiBaseUrl();
  loadConnectionStatus();
});
el.signOutButton.addEventListener('click', signOut);
el.principalId.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') refresh();
});
el.delegationFilter.addEventListener('change', refresh);
el.receiptStatus.addEventListener('change', refresh);
el.pinBriefing.addEventListener('click', () => toast('Briefing pinned for this session.'));
el.cadenceMode.addEventListener('change', () => {
  state.cadence.mode = el.cadenceMode.value;
  renderCadenceControls();
  renderSummary();
  renderBriefing();
  saveCloseoutState().catch((error) => toast(error.message || 'Closeout save failed.'));
});
el.weeklyDay.addEventListener('change', () => {
  state.cadence.weeklyDay = el.weeklyDay.value;
  renderSummary();
  renderBriefing();
  saveCloseoutState().catch((error) => toast(error.message || 'Closeout save failed.'));
});
el.monthlyDay.addEventListener('change', () => {
  state.cadence.monthlyDay = el.monthlyDay.value;
  renderSummary();
  renderBriefing();
  saveCloseoutState().catch((error) => toast(error.message || 'Closeout save failed.'));
});
el.saveCloseout.addEventListener('click', () => {
  saveCloseoutState()
    .then(() => toast('Closeout state saved.'))
    .catch((error) => toast(error.message || 'Closeout save failed.'));
});
el.runMobTemplate.addEventListener('click', () => {
  runMobTemplate()
    .then(() => {
      toast('MOB template run recorded.');
      return saveCloseoutState();
    })
    .catch((error) => toast(error.message || 'MOB run failed.'));
});
el.gbpAttached.addEventListener('change', () => {
  saveCloseoutState().catch((error) => toast(error.message || 'Closeout save failed.'));
});
el.gbpReference.addEventListener('change', () => {
  saveCloseoutState().catch((error) => toast(error.message || 'Closeout save failed.'));
});
el.mobTemplateRequired.addEventListener('change', () => {
  saveCloseoutState().catch((error) => toast(error.message || 'Closeout save failed.'));
});
el.mobFilterStatus.addEventListener('change', () => {
  state.mobPanel.status = el.mobFilterStatus.value;
  loadMobPanelData()
    .then(() => renderMobPanel())
    .catch((error) => toast(error.message || 'MOB panel sync failed.'));
});
el.mobWindowDays.addEventListener('change', () => {
  state.mobPanel.windowDays = el.mobWindowDays.value;
  loadMobPanelData()
    .then(() => renderMobPanel())
    .catch((error) => toast(error.message || 'MOB panel sync failed.'));
});
el.mobExportButton.addEventListener('click', () => {
  exportMobRuns()
    .then(() => toast('MOB export downloaded.'))
    .catch((error) => toast(error.message || 'MOB export failed.'));
});
el.mobExportBundleButton.addEventListener('click', () => {
  exportCloseoutBundle()
    .then(() => toast('Closeout bundle downloaded.'))
    .catch((error) => toast(error.message || 'Closeout bundle export failed.'));
});

renderCloseoutControls();
renderMobHistory();
renderMobPanel();
loadApiBaseUrl();
updateAuthShell();
loadConnectionStatus();

if (restoreSession()) {
  updateAuthShell();
  refresh();
}
