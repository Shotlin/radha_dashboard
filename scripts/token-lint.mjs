#!/usr/bin/env node
/**
 * token-lint — design-token guard for the RADHA dashboard.
 *
 * Enforces the Visual Bible "tokens only" rule (.kiro/steering/visual-assets.md §2, §12):
 * feature/component code must not hard-code raw color / spacing / radius / duration
 * literals. Styling must go through Tailwind token classes (className) or design-token
 * CSS variables (`var(--token)`); inline styles must reference tokens, never raw values.
 *
 * What it flags (in `features/**` and `components/**`, *.ts/*.tsx):
 *   - Hex color literals as a value:  '#EA580C', "#fff", `#1c1917`
 *   - rgb()/rgba()/hsl()/hsla() color function literals (real CSS calls)
 *   - Raw px / rem / em length literals inside inline `style={{ ... }}` objects
 *   - ms / s duration literals inside inline `style={{ ... }}` objects
 *
 * What it intentionally allows (the sanctioned token paths):
 *   - Tailwind utility/arbitrary classes in className strings (e.g. `text-[14px]`,
 *     `bg-[color:rgb(21_128_61_/_0.08)]`, `duration-[200ms]`) — the project's token layer
 *   - `var(--token)` CSS variable references
 *   - 0, transparent, currentColor, inherit, none, auto, 100%, calc(...) layout math
 *   - dynamic values (template expressions / identifiers) and unitless numbers
 *
 * Escape hatches:
 *   - File-level:        a line containing `token-lint-disable-file`
 *   - Next-line:         `// token-lint-disable-next-line <reason>`
 *   - ALLOWLIST below:   centralized token/chart-color sources that legitimately hold literals
 *
 * Usage:  node scripts/token-lint.mjs        (exits 1 if any violation is found)
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SCAN_DIRS = ['features', 'components'];

/**
 * Files that legitimately contain raw literals and are exempt by design.
 * Keep this list SMALL and documented — every entry needs a reason.
 */
const ALLOWLIST = new Map([
  [
    'components/ui/chart-card.tsx',
    'Centralized chart color token map (CHART_COLORS) + recharts inline styles; recharts consumes literal color strings.',
  ],
  [
    'features/analytics/components/funnel-chart.tsx',
    'Funnel chart palette: extra accent shades derived for recharts series (literal colors required by recharts).',
  ],
  [
    'features/analytics/components/traffic-line.tsx',
    'Recharts line chart: 1px hairline border on the inline tooltip/axis style (recharts inline styles require literal values).',
  ],
]);

// Allowed standalone values that are never violations.
const ALLOWED_VALUES = new Set(['0', 'transparent', 'currentColor', 'inherit', 'none', 'auto']);

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;
// Real CSS color functions: digits + commas/spaces/%/slash, NOT Tailwind underscore syntax.
const RGB_HSL_RE = /\b(?:rgb|rgba|hsl|hsla)\(\s*\d[\d.\s,%/]*\)/;
const LENGTH_RE = /\b\d+(?:\.\d+)?(?:px|rem|em)\b/g;
const DURATION_RE = /\b\d+(?:\.\d+)?m?s\b/g;

/** Recursively collect *.ts / *.tsx files under a directory. */
function collect(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.next' || name === 'dist') continue;
      collect(full, out);
    } else if (/\.(ts|tsx)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

/** Remove calc(...) spans (including nested parens) so layout math is not flagged. */
function stripCalc(line) {
  let out = '';
  let i = 0;
  while (i < line.length) {
    const idx = line.indexOf('calc(', i);
    if (idx === -1) {
      out += line.slice(i);
      break;
    }
    out += line.slice(i, idx) + 'calc()';
    let depth = 1;
    let j = idx + 5; // past "calc("
    while (j < line.length && depth > 0) {
      if (line[j] === '(') depth++;
      else if (line[j] === ')') depth--;
      j++;
    }
    i = j;
  }
  return out;
}

/** Remove Tailwind arbitrary-value brackets (e.g. `text-[14px]`, `bg-[color:rgb(..)]`)
 *  so utility classes are never confused with inline-style values. Tailwind arbitrary
 *  values always sit inside `[...]`; CSS inline-style values never do. */
function stripTailwindArbitrary(line) {
  return line.replace(/\[[^\]]*\]/g, '[]');
}
function hasBareHexStringLiteral(line) {
  const re = /(['"`])\s*#[0-9a-fA-F]{3,8}\s*\1/g;
  return re.test(line);
}

function lintFile(absPath) {
  const rel = relative(ROOT, absPath).split(sep).join('/');
  if (ALLOWLIST.has(rel)) return [];

  const text = readFileSync(absPath, 'utf8');
  if (text.includes('token-lint-disable-file')) return [];

  const lines = text.split(/\r?\n/);
  const violations = [];

  let styleDepth = 0; // brace depth while inside an inline style object
  let disableNext = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const lineNo = i + 1;

    if (disableNext) {
      disableNext = false;
    } else if (/token-lint-disable-next-line/.test(raw)) {
      disableNext = true;
      continue;
    }

    // Skip pure comment lines for value detection (but still track style braces below).
    const trimmed = raw.trim();
    const isComment = trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');

    // Detect entering an inline style object on this line.
    const opensStyle = /(?:\b\w*[Ss]tyle)=\{\{/.test(raw);
    const wasInStyle = styleDepth > 0 || opensStyle;

    // --- Color literals (flagged anywhere they are used as a value) ---
    if (!isComment) {
      if (hasBareHexStringLiteral(raw)) {
        violations.push({ lineNo, raw: trimmed, kind: 'hard-coded hex color literal' });
      } else if (wasInStyle && HEX_RE.test(stripTailwindArbitrary(raw))) {
        violations.push({ lineNo, raw: trimmed, kind: 'hard-coded hex color in inline style' });
      }
      if (RGB_HSL_RE.test(raw)) {
        violations.push({ lineNo, raw: trimmed, kind: 'hard-coded rgb()/hsl() color literal' });
      }

      // --- Length & duration literals: only inside inline style objects ---
      if (wasInStyle) {
        const scrubbed = stripCalc(stripTailwindArbitrary(raw));
        for (const m of scrubbed.matchAll(LENGTH_RE)) {
          if (!ALLOWED_VALUES.has(m[0])) {
            violations.push({ lineNo, raw: trimmed, kind: `raw length literal "${m[0]}" in inline style` });
          }
        }
        for (const m of scrubbed.matchAll(DURATION_RE)) {
          if (m[0] !== '0s' && m[0] !== '0ms') {
            violations.push({ lineNo, raw: trimmed, kind: `raw duration literal "${m[0]}" in inline style` });
          }
        }
      }
    }

    // --- Track inline style object brace depth across lines ---
    if (opensStyle) {
      const after = raw.slice(raw.indexOf('={{') + 1);
      styleDepth += (after.match(/\{/g) || []).length - (after.match(/\}/g) || []).length;
      if (styleDepth < 0) styleDepth = 0;
    } else if (styleDepth > 0) {
      styleDepth += (raw.match(/\{/g) || []).length - (raw.match(/\}/g) || []).length;
      if (styleDepth < 0) styleDepth = 0;
    }
  }

  return violations.map((v) => ({ ...v, rel }));
}

function main() {
  const files = [];
  for (const d of SCAN_DIRS) collect(join(ROOT, d), files);

  const all = [];
  for (const f of files) all.push(...lintFile(f));

  const scanned = files.length;
  if (all.length === 0) {
    console.log(`token-lint: OK — scanned ${scanned} files in ${SCAN_DIRS.join(', ')}, 0 violations.`);
    if (ALLOWLIST.size > 0) {
      console.log(`token-lint: ${ALLOWLIST.size} allowlisted file(s) skipped (centralized token sources).`);
    }
    process.exit(0);
  }

  console.error(`token-lint: FAILED — ${all.length} violation(s) across ${scanned} scanned files:\n`);
  const byFile = new Map();
  for (const v of all) {
    if (!byFile.has(v.rel)) byFile.set(v.rel, []);
    byFile.get(v.rel).push(v);
  }
  for (const [rel, vs] of byFile) {
    console.error(`  ${rel}`);
    for (const v of vs) {
      console.error(`    ${v.lineNo}: ${v.kind}`);
      console.error(`        ${v.raw.slice(0, 120)}`);
    }
    console.error('');
  }
  console.error('Fix: use Tailwind token classes or var(--token) references instead of raw literals.');
  console.error('Escape hatch: `// token-lint-disable-next-line <reason>` for a justified exception.');
  process.exit(1);
}

main();
