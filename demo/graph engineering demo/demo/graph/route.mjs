import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const owners = ['api', 'frontend', 'test'];
const statuses = ['pass', 'fail', 'blocked', 'not_run'];
const escalate = reason => ({ action: 'escalate', owners: [], reason });

export function route(e) {
  if (!e || !Number.isInteger(e.cyclesUsed) || !Number.isInteger(e.cycleLimit) ||
      e.cyclesUsed < 0 || e.cycleLimit < 1 || e.cyclesUsed > e.cycleLimit ||
      ![e.tests, e.staticChecks, e.review].every(x => statuses.includes(x)) ||
      !Array.isArray(e.findings) || !e.findings.every(f => f &&
        [...owners, 'human'].includes(f.owner) && ['repairable', 'blocker'].includes(f.kind) &&
        ['id', 'requirement', 'evidence', 'nextAction'].every(k => typeof f[k] === 'string' && f[k].trim()))) {
    return escalate('Invalid or incomplete evidence record; clarify before editing.');
  }
  if ([e.tests, e.staticChecks, e.review].includes('blocked') ||
      e.findings.some(f => f.kind === 'blocker' || f.owner === 'human')) {
    return escalate('A prerequisite, human decision, or out-of-scope/uncertain finding blocks delivery.');
  }
  if (e.tests === 'not_run' || e.staticChecks === 'not_run') {
    return escalate('Required integrated check gate not run. Obtain evidence before routing.');
  }
  const failed = e.tests === 'fail' || e.staticChecks === 'fail' || e.review === 'fail';
  if (failed || e.findings.length) {
    if (e.cyclesUsed >= e.cycleLimit) return escalate('Shared edit-and-check cycle budget exhausted.');
    if (!e.findings.length) return escalate('Failure has no classified, actionable evidence.');
    return { action: 'repair', owners: owners.filter(o => e.findings.some(f => f.owner === o)),
      reason: 'Route only supported in-scope findings; reserve one shared repair cycle.' };
  }
  if (e.review === 'not_run') return { action: 'review', owners: [], reason: 'Both gates passed; independent review required.' };
  return { action: 'await_human_approval', owners: [], reason: 'Both gates and independent review passed. Stop editing.' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const input = process.argv[2];
    if (!input) throw new Error('Usage: node demo/graph/route.mjs <evidence.json>');
    console.log(JSON.stringify(route(JSON.parse(readFileSync(input, 'utf8'))), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
