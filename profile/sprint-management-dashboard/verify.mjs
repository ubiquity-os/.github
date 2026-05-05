#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(root, 'index.html');
const readmePath = path.join(root, 'README.md');
const index = fs.readFileSync(indexPath, 'utf8');
const readme = fs.readFileSync(readmePath, 'utf8');
const combined = `${index}\n${readme}`;

const requiredPhrases = [
  'Sign in with GitHub',
  'engineering managers',
  'GitHub organization',
  'GitHub issues',
  'vector embeddings',
  'sprint plan',
  'Team calendar',
  'Assignment rationale',
  '5 minutes per issue',
  'Manager salary equivalent',
  'Priority bootstrap',
  'Low',
  'Urgent',
  'High',
  'Asana',
  'Jira',
  'read-only',
  'no GitHub write-back'
];

const requiredSelectors = [
  'id="github-sign-in"',
  'id="org-input"',
  'id="backlog-slider"',
  'id="generate-plan"',
  'id="calendar"',
  'id="assignment-rows"',
  'id="triage-card"',
  'id="labeled-count"',
  'role="status"',
  'aria-live="polite"',
  'aria-label="Sprint calendar"',
  'aria-label="Task assignment rationale"'
];

const failures = [];
for (const phrase of requiredPhrases) {
  if (!combined.includes(phrase)) failures.push(`Missing required phrase: ${phrase}`);
}
for (const selector of requiredSelectors) {
  if (!index.includes(selector)) failures.push(`Missing required selector/attribute: ${selector}`);
}

const externalScript = /<script\b[^>]*\bsrc=/i.test(index);
const externalStyle = /<link\b[^>]*rel=["']stylesheet["']/i.test(index);
if (externalScript) failures.push('External script detected; MVP should stay dependency-free.');
if (externalStyle) failures.push('External stylesheet detected; MVP should stay dependency-free.');

const scriptMatch = index.match(/<script>([\s\S]*)<\/script>\s*<\/body>/i);
if (!scriptMatch) {
  failures.push('Inline script block not found.');
} else {
  try {
    // Parse only. Do not execute browser code under Node.
    new Function(scriptMatch[1]);
  } catch (error) {
    failures.push(`Inline JavaScript syntax error: ${error.message}`);
  }
}

const secretPatterns = [
  ['GitHub token', /gh[pousr]_[A-Za-z0-9_]{20,}/],
  ['OpenAI-style token', /sk-[A-Za-z0-9]{20,}/],
  ['Private key block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['JWT-looking value', /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/]
];
for (const [name, pattern] of secretPatterns) {
  if (pattern.test(combined)) failures.push(`Potential credential pattern detected: ${name}`);
}

const minCardCount = (index.match(/class="card/g) || []).length;
if (minCardCount < 10) failures.push(`Expected at least 10 dashboard cards, found ${minCardCount}.`);

const tableRows = (index.match(/<th>/g) || []).length;
if (tableRows < 6) failures.push('Assignment table headers are incomplete.');

if (failures.length) {
  console.error('Sprint dashboard verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Sprint dashboard verification passed.');
console.log(`- Required phrases: ${requiredPhrases.length}`);
console.log(`- Required selectors/ARIA checks: ${requiredSelectors.length}`);
console.log(`- Static dashboard cards: ${minCardCount}`);
console.log('- External scripts/styles: none');
console.log('- Credential-pattern scan: clean');
