import { createPlan, formatPlan } from '../src/index.js';

const markdown = createPlan('fixtures/slack-update.md');
if (markdown.summary.approvalRequired !== 2) throw new Error('expected two approval-required actions');
const json = createPlan('fixtures/issue-crm-pager.json');
if (json.actions.length !== 3) throw new Error('expected three JSON fixture actions');
console.log(formatPlan(markdown, 'markdown'));
