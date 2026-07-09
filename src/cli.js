import { createPlan, formatPlan } from './index.js';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) args[key] = true;
    else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

export function run(argv = process.argv.slice(2), io = console) {
  const args = parseArgs(argv);
  const [command, file] = args._;
  if (!command || args.help) {
    io.log('Usage: connector-incident-dryrun plan <brief.md|brief.json> [--format markdown|json] [--fail-on approval]');
    return 0;
  }
  if (command !== 'plan') {
    io.error(`Unknown command: ${command}`);
    return 1;
  }
  if (!file) {
    io.error('Missing incident brief path');
    return 1;
  }
  const plan = createPlan(file);
  io.log(formatPlan(plan, args.format || 'markdown'));
  if (args['fail-on'] === 'approval' && plan.summary.approvalRequired > 0) return 2;
  if (args['fail-on'] === 'issues' && plan.summary.withIssues > 0) return 2;
  return 0;
}
