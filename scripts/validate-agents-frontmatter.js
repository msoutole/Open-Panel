#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const AGENTS_DIR = path.join(ROOT, '.github', 'agents');

function error(msg) {
  console.error(`✖ ${msg}`);
}
function info(msg) {
  console.log(`✔ ${msg}`);
}

function parseFrontMatter(content) {
  const fm = content.match(/^---\s*\n([\s\S]*?)\n---/m);
  if (!fm) return null;
  return fm[1];
}

function parseTools(yaml) {
  const m = yaml.match(/tools:\s*\[([\s\S]*?)\]/m);
  if (!m) return null;
  const raw = m[1];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^['"]|['"]$/g, ''));
}

function parseName(yaml) {
  const m = yaml.match(/^name:\s*(['"]?)([^\n'"\r]+)\1/m);
  return m ? m[2].trim() : null;
}

function parseDescription(yaml) {
  const m = yaml.match(/^description:\s*(['"]?)([\s\S]*?)\1?(?:\n|$)/m);
  if (!m) return null;
  let desc = m[2].trim();
  // If description had newline inside without quotes, we try to grab the single-line fallback
  if (desc.includes('\n')) {
    desc = desc.split('\n')[0];
  }
  return desc;
}

function validateAgentFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const name = path.basename(filePath);
  const results = { file: filePath, ok: true, errors: [], warnings: [] };
  const yaml = parseFrontMatter(content);
  if (!yaml) {
    results.ok = false;
    results.errors.push('Missing/invalid front matter (--- ... ---)');
    return results;
  }

  const agentName = parseName(yaml);
  if (!agentName) {
    results.ok = false;
    results.errors.push('Missing "name" field in front matter');
  } else {
    // Validate name pattern openpanel-<role> (without -agent suffix)
    const nameRe = /^openpanel-[a-z0-9-]+$/;
    if (!nameRe.test(agentName)) {
      results.errors.push(`Invalid "name" field: '${agentName}'. Expected pattern: openpanel-<role>`);
      results.ok = false;
    }
    // Ensure it doesn't end with -agent
    if (agentName.endsWith('-agent')) {
      results.errors.push(`Invalid "name" field: '${agentName}' should not end with '-agent' suffix`);
      results.ok = false;
    }
  }

  const desc = parseDescription(yaml);
  if (!desc) {
    results.warnings.push('Missing or empty "description" field');
  }

  const tools = parseTools(yaml);
  if (!tools) {
    results.ok = false;
    results.errors.push('Missing "tools" array in front matter');
  } else {
    // Basic required tools
    const requiredTools = ['edit', 'runNotebooks', 'search', 'runSubagent'];
    requiredTools.forEach((t) => {
      if (!tools.includes(t)) {
        results.warnings.push(`Recommended tool '${t}' not found in tools`);
      }
    });
  }

  return results;
}

function main() {
  if (!fs.existsSync(AGENTS_DIR)) {
    console.error(`Agents directory not found: ${AGENTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'));
  const summary = { total: files.length, passed: 0, failed: 0, warnings: 0 };
  const results = [];
  for (const f of files) {
    const filePath = path.join(AGENTS_DIR, f);
    const res = validateAgentFile(filePath);
    results.push(res);
    if (res.ok) {
      summary.passed += 1;
      if (res.warnings.length) summary.warnings += 1;
    } else {
      summary.failed += 1;
    }
  }

  for (const r of results) {
    if (!r.ok) {
      error(`File: ${path.relative(ROOT, r.file)}`);
      r.errors.forEach((e) => error(`  - ${e}`));
    } else if (r.warnings.length) {
      info(`File: ${path.relative(ROOT, r.file)}`);
      r.warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
    } else {
      info(`File: ${path.relative(ROOT, r.file)} OK`);
    }
  }

  console.log('\nSummary:');
  console.log(`  total: ${summary.total}`);
  console.log(`  passed: ${summary.passed}`);
  console.log(`  failed: ${summary.failed}`);
  console.log(`  with warnings: ${summary.warnings}`);

  if (summary.failed > 0) process.exit(1);
  process.exit(0);
}

main();
