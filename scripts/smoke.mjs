import { createPlan, formatPlan, parseJsonBrief } from '../src/index.js';

const markdown = createPlan('fixtures/slack-update.md');
if (markdown.summary.approvalRequired !== 2) throw new Error('expected two approval-required actions');
const json = createPlan('fixtures/issue-crm-pager.json');
if (json.actions.length !== 3) throw new Error('expected three JSON fixture actions');
const protectedMetadata = formatPlan({
  ...parseJsonBrief(JSON.stringify({ incident: 'Checkout\n## heading', severity: 'sev1\n- item', actions: [] })),
  summary: { total: 0, approvalRequired: 0, withIssues: 0 }
}, 'markdown');
if (!protectedMetadata.includes('Incident: Checkout \\#\\# heading')) throw new Error('expected escaped incident metadata');
if (!protectedMetadata.includes('Severity: sev1 \\- item')) throw new Error('expected escaped severity metadata');
console.log(formatPlan(markdown, 'markdown'));
