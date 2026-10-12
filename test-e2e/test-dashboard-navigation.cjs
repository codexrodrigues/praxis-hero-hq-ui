// Exercises the actual host handler, transpiled without bootstrapping Angular.
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('src/app/pages/dashboard/dashboard-page.component.ts', 'utf8');
const file = ts.createSourceFile('dashboard.ts', source, ts.ScriptTarget.Latest, true);
const component = file.statements.find(n => ts.isClassDeclaration(n) && n.name?.text === 'DashboardPageComponent');
const method = component.members.find(n => n.name?.getText(file) === 'handleWidgetEvent');
const code = ts.transpileModule(`class Host { ${method.getText(file)} }; Host`, {
  compilerOptions: {target: ts.ScriptTarget.ES2022},
}).outputText;
const Host = vm.runInNewContext(code);
const calls = [];
const host = new Host();
host.router = { navigateByUrl: path => calls.push(path) };
for (const output of ['rowClick', 'dataChange', 'action']) {
  host.handleWidgetEvent({output, payload:{path:'/unexpected', actionId:'dangerous', url:'/unexpected'}});
}
for (const payload of [null, '/invalid', {url:'https://example.com'}, {url:'//example.com'}, {path:42}]) {
  host.handleWidgetEvent({output:'navigate',payload});
}
assert.deepEqual(calls, []);
for (const payload of [{path:'/rh/funcionarios'}, {route:'/operacoes/missoes'}, {url:'/'}]) {
  host.handleWidgetEvent({output:'navigate',payload});
}
assert.deepEqual(calls, ['/rh/funcionarios','/operacoes/missoes','/']);
console.log('PASS: explicit internal navigation only; data/action events cannot dispatch navigation or actions');
