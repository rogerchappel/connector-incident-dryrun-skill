import { createPlan, formatPlan } from './index.js';

const USAGE = 'Usage: connector-incident-dryrun plan <brief.md|brief.json> [--format markdown|json] [--fail-on approval|issues]';
const OPTIONS = new Set(['format', 'fail-on']);

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    if (!OPTIONS.has(key)) throw new Error(`Unknown option: --${key}`);
    if (Object.hasOwn(args, key)) throw new Error(`Duplicate option: --${key}`);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) throw new Error(`Missing value for --${key}`);
    args[key] = next;
    i += 1;
  }
  return args;
}

export function run(argv = process.argv.slice(2), io = console) {
  if (argv.includes('--help')) {
    if (argv.length !== 1) {
      io.error('--help must be used by itself');
      return 1;
    }
    io.log(USAGE);
    return 0;
  }

  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    io.error(error.message);
    return 1;
  }

  const [command, file] = args._;
  if (!command) {
    io.log(USAGE);
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
  if (args._.length > 2) {
    io.error(`Unexpected argument: ${args._[2]}`);
    return 1;
  }
  if (args.format && !['markdown', 'json'].includes(args.format)) {
    io.error(`Invalid --format value: ${args.format} (expected markdown or json)`);
    return 1;
  }
  if (args['fail-on'] && !['approval', 'issues'].includes(args['fail-on'])) {
    io.error(`Invalid --fail-on value: ${args['fail-on']} (expected approval or issues)`);
    return 1;
  }

  let plan;
  try {
    plan = createPlan(file);
  } catch (error) {
    io.error(error.message);
    return 1;
  }
  io.log(formatPlan(plan, args.format || 'markdown'));
  if (args['fail-on'] === 'approval' && plan.summary.approvalRequired > 0) return 2;
  if (args['fail-on'] === 'issues' && plan.summary.withIssues > 0) return 2;
  return 0;
}
