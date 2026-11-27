// Sentinel PR Governance FacePlane report rendering (Markdown / JSON).
// Rendering is pure: it never writes files or calls external services.

function cell(value) {
  return String(value === undefined || value === null || value === '' ? '-' : value)
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|');
}

function renderJsonReport(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function renderMarkdownReport(report) {
  const pr = report.pullRequest || {};
  const summary = report.summary || {};
  const lines = [
    '# PR Governance FacePlane Report',
    '',
    '> Read-only report. This FacePlane grants no merge, approval, deployment, or thread-resolution authority.'
  ];

  if (report.localOnly) {
    lines.push(
      '>',
      '> **LOCAL-ONLY GIT PREFLIGHT** — derived from the local Git checkout only. It is not GitHub pull request evidence and cannot be READY.'
    );
  }

  lines.push(
    '',
    `- Readiness: **${report.readiness}**`,
    `- Score: ${report.score}/100 (${summary.passed}/${summary.applicable} applicable controls passed; ${summary.notApplicable} not applicable)`,
    `- Blockers: ${summary.blockers}; Warnings: ${summary.warnings}`,
    `- Repository: ${report.repository || 'unreported'}`,
    `- Pull request: ${pr.number ? `#${pr.number}` : 'unreported'}${pr.title ? ` — ${pr.title}` : ''}`,
    `- Head: \`${pr.headSha || 'unreported'}\``,
    `- Base: \`${pr.baseSha || 'unreported'}\``,
    `- Evidence source: ${report.evidenceSource}`,
    `- Generated: ${report.generatedAt}`,
    '',
    '## Findings',
    ''
  );

  if (!report.findings.length) {
    lines.push('No missing governance evidence was found.');
  } else {
    lines.push('| Severity | Control | Code | Finding | Missing evidence |', '| --- | --- | --- | --- | --- |');
    for (const finding of report.findings) {
      lines.push(`| ${cell(finding.severity)} | ${cell(finding.control)} | ${cell(finding.code)} | ${cell(finding.message)} | ${cell(finding.missingEvidence)} |`);
    }
  }

  lines.push('', '## Controls', '', '| Control | Status | Detail |', '| --- | --- | --- |');
  for (const control of report.controls) {
    lines.push(`| ${cell(control.title)} (\`${control.id}\`) | ${cell(control.status.toUpperCase())} | ${cell(control.detail || control.findings.join(', '))} |`);
  }

  lines.push('', '## Authority boundary', '');
  for (const [key, value] of Object.entries(report.authority || {})) {
    lines.push(`- ${key}: ${value}`);
  }
  lines.push('', report.notice, '');

  return lines.join('\n');
}

function renderReport(report, format = 'markdown') {
  return format === 'json' ? renderJsonReport(report) : renderMarkdownReport(report);
}

module.exports = {
  renderJsonReport,
  renderMarkdownReport,
  renderReport
};
