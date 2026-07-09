import fs from 'node:fs';
import path from 'node:path';

const TARGET_SIDE_EFFECT = {
  slack: 'external-message',
  github: 'external-comment',
  linear: 'external-ticket',
  jira: 'external-ticket',
  crm: 'customer-record',
  pager: 'paging-state',
  email: 'external-message',
  notes: 'local-note'
};

export function loadBrief(file) {
  const body = fs.readFileSync(file, 'utf8');
  if (path.extname(file).toLowerCase() === '.json') return parseJsonBrief(body, file);
  return parseMarkdownBrief(body, file);
}

export function parseJsonBrief(body, source = 'inline.json') {
  const parsed = JSON.parse(body);
  return {
    source,
    incident: parsed.incident || parsed.title || 'Untitled incident',
    severity: parsed.severity || 'unknown',
    actions: normalizeActions(parsed.actions || [])
  };
}

export function parseMarkdownBrief(body, source = 'inline.md') {
  const title = body.match(/^#\s+(.+)$/m)?.[1] || 'Untitled incident';
  const severity = body.match(/^Severity:\s*(.+)$/mi)?.[1]?.trim() || 'unknown';
  const actionLines = body.split('\n').filter((line) => /^-\s*\[[^\]]+\]/.test(line.trim()));
  const actions = actionLines.map((line) => {
    const match = line.match(/^-\s*\[([^\]]+)\]\s*(.+)$/);
    const target = match?.[1]?.trim() || 'notes';
    const rest = match?.[2] || '';
    return {
      target,
      action: readToken(rest, 'action') || inferAction(rest),
      message: readToken(rest, 'message') || rest.replace(/\s*(approval|rollback|action)=.*$/i, '').trim(),
      approval: readToken(rest, 'approval') || inferApproval(target),
      rollback: readToken(rest, 'rollback') || '',
      evidence: readToken(rest, 'evidence') || ''
    };
  });
  return { source, incident: title, severity, actions: normalizeActions(actions) };
}

function readToken(text, key) {
  const match = text.match(new RegExp(`${key}=([^;]+)`, 'i'));
  return match?.[1]?.trim();
}

function inferAction(text) {
  if (/comment/i.test(text)) return 'comment';
  if (/page|pager/i.test(text)) return 'page';
  if (/note/i.test(text)) return 'note';
  return 'post';
}

function inferApproval(target) {
  return target === 'notes' ? 'optional' : 'required';
}

export function normalizeActions(actions) {
  return actions.map((action, index) => {
    const target = String(action.target || 'notes').toLowerCase();
    const approval = action.approval || inferApproval(target);
    return {
      id: action.id || `action-${index + 1}`,
      target,
      action: action.action || 'post',
      message: action.message || '',
      approval,
      rollback: action.rollback || '',
      evidence: action.evidence || '',
      sideEffect: TARGET_SIDE_EFFECT[target] || 'external-write',
      issues: validateAction({ ...action, target, approval })
    };
  });
}

export function validateAction(action) {
  const issues = [];
  for (const field of ['target', 'action', 'message', 'approval', 'rollback']) {
    if (!action[field] || String(action[field]).trim() === '') issues.push(`missing ${field}`);
  }
  if (action.approval && !['required', 'optional', 'preapproved'].includes(action.approval)) issues.push(`invalid approval ${action.approval}`);
  return issues;
}

export function createPlan(file) {
  const brief = loadBrief(file);
  const summary = brief.actions.reduce((acc, action) => {
    acc.total += 1;
    if (action.approval === 'required') acc.approvalRequired += 1;
    if (action.issues.length) acc.withIssues += 1;
    return acc;
  }, { total: 0, approvalRequired: 0, withIssues: 0 });
  return { ...brief, summary };
}

export function formatPlan(plan, format = 'markdown') {
  if (format === 'json') return JSON.stringify(plan, null, 2);
  const rows = plan.actions.map((action) => `| ${action.id} | ${action.target} | ${action.action} | ${action.sideEffect} | ${action.approval} | ${action.rollback || 'missing'} | ${action.issues.join(', ') || 'ok'} |`);
  return [
    '# Connector Incident Dry-Run Plan',
    '',
    `Incident: ${plan.incident}`,
    `Severity: ${plan.severity}`,
    `Actions: ${plan.summary.total}`,
    `Approval required: ${plan.summary.approvalRequired}`,
    `Actions with issues: ${plan.summary.withIssues}`,
    '',
    '| ID | Target | Action | Side effect | Approval | Rollback | Issues |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows
  ].join('\n');
}
