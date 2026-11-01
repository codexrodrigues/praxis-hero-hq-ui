#!/usr/bin/env node
// Adapt Angular click syntax for the upstream syntactic auditor in a disposable copy.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';
import { parseTemplate } from '@angular/compiler';

const ignored = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.nuxt']);
function fail(message) { throw new Error(message); }
function argsOf(args) {
  let root, auditor, output;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--auditor' || arg === '--output') {
      if (!args[i + 1] || args[i + 1].startsWith('--')) fail(`Missing value for ${arg}`);
      if (arg === '--auditor') auditor = args[++i]; else output = args[++i];
    } else if (arg.startsWith('-') || root) fail(`Unexpected argument: ${arg}`);
    else root = arg;
  }
  if (!root || !auditor) fail('Usage: audit-angular-ui.mjs --auditor PATH [--output PATH] PROJECT_ROOT');
  return { root: fs.realpathSync(root), auditor: fs.realpathSync(auditor), output };
}
function inside(root, candidate) {
  const rel = path.relative(root, candidate);
  return rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}
function allFiles(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) fail(`Symlink cannot be safely audited: ${p}`);
    if (entry.isDirectory()) result.push(...allFiles(p));
    else if (entry.isFile()) result.push(p);
  }
  return result;
}
function normalizeTemplate(template, file, base, insertions, hasMatMenuModule) {
  const parsed = parseTemplate(template, file);
  if (parsed.errors?.length) fail(`Angular template parse error in ${file}: ${parsed.errors.map(e => String(e)).join('; ')}`);
  const visitList = nodes => {
    // Only admit sibling refs: this conservative scope avoids binding a trigger
    // to a menu hidden inside a different Angular embedded view.
    const menuRefs = new Set(nodes.filter(node => node.name === 'mat-menu')
      .flatMap(node => (node.references || []).filter(ref => !ref.value || ref.value === 'matMenu').map(ref => ref.name)));
    for (const node of nodes) visit(node, menuRefs);
  };
  const visit = (node, menuRefs) => {
    if (node.name === 'button') {
      const clicks = (node.outputs || []).filter(e => e.name === 'click' && !e.target);
      for (const event of clicks) {
        if (!event.handler?.source?.trim()) fail(`Empty click handler in ${file}:${event.sourceSpan.start.line + 1}`);
      }
      const triggers = (node.inputs || []).filter(input => input.name === 'matMenuTriggerFor');
      const validTrigger = hasMatMenuModule && triggers.some(input => {
        const expression = input.value?.ast;
        return expression?.constructor?.name === 'PropertyRead' &&
          expression.receiver?.constructor?.name === 'ImplicitReceiver' && menuRefs.has(expression.name);
      });
      if (clicks.length || validTrigger) {
        const start = node.startSourceSpan.start.offset;
        const text = template.slice(start, node.startSourceSpan.end.offset);
        const tag = /^<\s*button\b/i.exec(text);
        if (!tag) fail(`Cannot map button in ${file}`);
        insertions.add(base + start + tag[0].length);
      }
    }
    for (const key of ['children', 'branches', 'cases']) if (node[key]?.length) visitList(node[key]);
  };
  visitList(parsed.nodes);
}
function adapt(root) {
  const files = allFiles(root);
  const insertions = new Map();
  const templates = new Map();
  const shadowFiles = new Map();
  let shadowIndex = 0;
  const add = (file, template, base, hasMatMenuModule) => {
    if (!insertions.has(file)) insertions.set(file, new Set());
    normalizeTemplate(template, path.relative(root, file), base, insertions.get(file), hasMatMenuModule);
  };
  for (const file of files.filter(f => f.endsWith('.ts'))) {
    const source = fs.readFileSync(file, 'utf8');
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    if (ast.parseDiagnostics.length) fail(`TypeScript parse error in ${path.relative(root, file)}`);
    const menuImports = new Set();
    const componentImports = new Set(['Component']);
    const coreNamespaces = new Set();
    const typeOnlyComponents = new Set();
    for (const statement of ast.statements) {
      if (ts.isImportDeclaration(statement) && statement.moduleSpecifier.text === '@angular/core') {
        const clause = statement.importClause;
        const bindings = clause?.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) for (const item of bindings.elements) {
          if ((item.propertyName?.text || item.name.text) === 'Component') {
            if (clause.isTypeOnly || item.isTypeOnly) typeOnlyComponents.add(item.name.text);
            else componentImports.add(item.name.text);
          }
        }
        if (bindings && ts.isNamespaceImport(bindings)) {
          if (clause.isTypeOnly) typeOnlyComponents.add(`${bindings.name.text}.Component`);
          else coreNamespaces.add(bindings.name.text);
        }
      }
      if (ts.isImportDeclaration(statement) && statement.moduleSpecifier.text === '@angular/material/menu') {
        const bindings = statement.importClause?.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) for (const item of bindings.elements) {
          if (!statement.importClause.isTypeOnly && !item.isTypeOnly && (item.propertyName?.text || item.name.text) === 'MatMenuModule') menuImports.add(item.name.text);
        }
      }
    }
    const walk = node => {
      if (ts.isClassDeclaration(node) && ts.canHaveDecorators(node)) {
        for (const decorator of ts.getDecorators(node) || []) {
          const call = decorator.expression;
          if (!ts.isCallExpression(call)) continue;
          const callee = call.expression;
          if (typeOnlyComponents.has(callee.getText(ast))) fail(`Type-only Component decorator in ${file}`);
          const isComponent = ts.isIdentifier(callee) && componentImports.has(callee.text) ||
            ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) &&
              coreNamespaces.has(callee.expression.text) && callee.name.text === 'Component';
          if (!isComponent) continue;
          if (call.arguments.length !== 1 || !ts.isObjectLiteralExpression(call.arguments[0])) fail(`Unclassifiable Component metadata in ${file}`);
          const metadata = call.arguments[0];
          const importsProperty = metadata.properties.find(prop => ts.isPropertyAssignment(prop) && prop.name.getText(ast) === 'imports');
          const hasMatMenuModule = !!importsProperty && ts.isArrayLiteralExpression(importsProperty.initializer) &&
            importsProperty.initializer.elements.some(element => ts.isIdentifier(element) && menuImports.has(element.text));
          for (const prop of metadata.properties) {
            if (!ts.isPropertyAssignment(prop) || !prop.name || !['template', 'templateUrl'].includes(prop.name.getText(ast).replace(/^['"]|['"]$/g, ''))) continue;
            const name = prop.name.getText(ast).replace(/^['"]|['"]$/g, '');
            const literal = prop.initializer;
            if (!ts.isStringLiteral(literal) && !ts.isNoSubstitutionTemplateLiteral(literal)) fail(`Dynamic ${name} cannot be classified in ${file}`);
            const raw = source.slice(literal.getStart(ast) + 1, literal.end - 1);
            if (raw !== literal.text) fail(`Escaped ${name} cannot be mapped safely in ${file}`);
            if (name === 'template') {
              // The upstream scanner skips TypeScript string literals entirely. A
              // line-padded shadow ensures all inline markup is audited, too.
              const shadow = path.join(path.dirname(file), `.__angular_audit_template_${shadowIndex++}.html`);
              if (fs.existsSync(shadow)) fail(`Reserved shadow path already exists: ${shadow}`);
              const padding = '\n'.repeat((source.slice(0, literal.getStart(ast) + 1).match(/\n/g) || []).length);
              const content = padding + raw;
              fs.writeFileSync(shadow, content);
              shadowFiles.set(path.relative(root, shadow), path.relative(root, file));
              add(shadow, content, 0, hasMatMenuModule);
            }
            else {
              const target = path.resolve(path.dirname(file), raw);
              if (!inside(root, target) || !fs.existsSync(target) || !fs.statSync(target).isFile()) fail(`Unsafe or missing templateUrl ${raw} in ${file}`);
              templates.set(target, (templates.get(target) ?? true) && hasMatMenuModule);
            }
          }
        }
      }
      ts.forEachChild(node, walk);
    };
    walk(ast);
  }
  for (const [file, hasMatMenuModule] of templates) add(file, fs.readFileSync(file, 'utf8'), 0, hasMatMenuModule);
  let count = 0;
  for (const [file, offsets] of insertions) {
    let text = fs.readFileSync(file, 'utf8');
    for (const offset of [...offsets].sort((a, b) => b - a)) { text = `${text.slice(0, offset)} onclick${text.slice(offset)}`; count++; }
    fs.writeFileSync(file, text);
  }
  return { count, shadowFiles };
}
let temp;
try {
  const { root, auditor, output } = argsOf(process.argv.slice(2));
  const configPath = path.join(root, 'premium-ui.json');
  if (fs.existsSync(configPath)) {
    let config;
    try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch { config = {}; } // upstream reports malformed config
    const paths = [...(Array.isArray(config?.sourceRoots) ? config.sourceRoots.filter(x => typeof x === 'string') : []), ...(typeof config?.canonicalMap === 'string' ? [config.canonicalMap] : [])];
    for (const p of paths) if (!inside(root, path.resolve(root, p))) fail(`Configured path outside project: ${p}`);
  }
  temp = fs.mkdtempSync(path.join(os.tmpdir(), 'angular-ui-audit-'));
  const copy = path.join(temp, 'project');
  fs.cpSync(root, copy, { recursive: true, dereference: false, filter: p => !ignored.has(path.basename(p)) });
  const { count, shadowFiles } = adapt(copy);
  const run = spawnSync('python3', [auditor, copy, '--mode', 'strict', '--no-write'], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  if (run.error || run.status === null) fail(`Auditor execution failed: ${run.error || run.signal}`);
  let result;
  try { result = JSON.parse(run.stdout); } catch { fail(`Invalid auditor JSON: ${run.stderr || run.stdout}`); }
  result.projectRoot = root;
  // Finding paths are relative upstream; map absolute paths when the upstream reports one.
  for (const finding of result.findings || []) {
    if (shadowFiles.has(finding.file)) finding.file = shadowFiles.get(finding.file);
    else if (path.isAbsolute(finding.file) && inside(copy, finding.file)) finding.file = path.join(root, path.relative(copy, finding.file));
  }
  result.angularAdapter = { kind: 'syntactic-only', normalizedAngularBindings: count, note: 'Angular parser validates template syntax only; runtime behavior is not verified.' };
  const rendered = `${JSON.stringify(result, null, 2)}\n`;
  if (output) fs.writeFileSync(output, rendered);
  process.stdout.write(rendered);
  process.exitCode = run.status;
} catch (error) {
  console.error(`Angular audit adapter: ${error.message}`);
  process.exitCode = 2;
} finally {
  if (temp) fs.rmSync(temp, { recursive: true, force: true });
}
