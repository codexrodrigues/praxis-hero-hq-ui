import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import vm from 'node:vm';
const source = await readFile(new URL('../../src/app/core/theme.model.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.ES2022}}).outputText;
const {resolveTheme, workspaceThemes} = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
assert.deepEqual(workspaceThemes.map(t => t.name), ['Essência','Aurora','Órbita']);
const html = await readFile(new URL('../../src/index.html', import.meta.url), 'utf8');
const bootstrap = html.match(/<script>(.*?)<\/script>/s)[1];
for (const value of [undefined, null, '', 'invalid', 'light', 'dark', 'classic', 'light-tech', 'dark-tech']) {
  const root = {dataset: {},classList: {toggle(key, on) { this[key] = on; },add(key){ this[key] = true; }}};
  vm.runInNewContext(bootstrap, {localStorage: {getItem: () => value},document:{documentElement:root}});
  assert.equal(root.dataset.theme, resolveTheme(value));
  assert.equal(root.classList.dark, resolveTheme(value)==='dark-tech');
}
const root={dataset:{},classList:{add(key){this[key]=true;}}};
vm.runInNewContext(bootstrap,{localStorage:{getItem(){throw Error('blocked')}},document:{documentElement:root}});
assert.equal(root.dataset.theme,'dark-tech');
assert.equal(root.classList.dark,true);
assert.match(html,/family=Material\+Symbols\+Outlined/);
assert.match(html,/family=Work\+Sans/);
console.log('Three-theme catalog, 9 preference/bootstrap cases, blocked storage and font links passed.');
const palettes = await readFile(new URL('../../src/styles/workspace-themes.scss', import.meta.url),'utf8');
function luminance(value) {
  const [L,C,H] = value.match(/oklch\(([^)]+)\)/)[1].trim().split(/\s+/).map(Number);
  const a=C*Math.cos(H*Math.PI/180), b=C*Math.sin(H*Math.PI/180);
  const l=(L+0.3963377774*a+0.2158037573*b)**3;
  const m=(L-0.1055613458*a-0.0638541728*b)**3;
  const s=(L-0.0894841775*a-1.291485548*b)**3;
  const clamp=x=>Math.max(0,Math.min(1,x));
  return 0.2126*clamp(4.0767416621*l-3.3077115913*m+0.2309699292*s)
    +0.7152*clamp(-1.2684380046*l+2.6097574011*m-0.3413193965*s)
    +0.0722*clamp(-0.0041960863*l-0.7034186147*m+1.707614701*s);
}
for (const theme of workspaceThemes) {
  const body=palettes.match(new RegExp(':root\\[data-theme="'+theme.id+'"\\]\\s*\\{([^}]+)\\}'))[1];
  const tokens=Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(m=>[m[1],m[2]]));
  for (const [text,surface] of [['foreground','background'],['muted-foreground','card'],['primary-foreground','primary'],['destructive-foreground','destructive']]) {
    const a=luminance(tokens[text]),b=luminance(tokens[surface]);
    const ratio=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
    assert.ok(ratio>=4.5,`${theme.name}: ${text}/${surface} ${ratio.toFixed(2)}`);
    console.log(`${theme.name}: ${text}/${surface} ${ratio.toFixed(2)}:1`);
  }
}

// Optional source-of-truth comparison, without making the host depend on a sibling checkout.
const refIndex=process.argv.indexOf('--reference');
if (refIndex!==-1) {
  const {default:postcss}=await import('postcss');
  const {resolve}=await import('node:path');
  const ref=process.argv[refIndex+1];
  const entry=await readFile(resolve(ref,'src/styles.css'),'utf8');
  const files=[...entry.matchAll(/@import\s+['"](\.\/styles\/[^'"]+)['"]/g)].map(m=>resolve(ref,'src',m[1]));
  files.push(resolve(ref,'src/themes.css'));
  const declarations=Object.fromEntries(workspaceThemes.map(t=>[t.id,{}]));
  for (const file of files) {
    const css=postcss.parse(await readFile(file,'utf8'));
    css.walkRules(rule=>{
      if(rule.parent.type!=='root')return;
      for(const theme of workspaceThemes) {
        const matching=rule.selectors.some(s=>s===':root'||(s==='.dark'&&theme.id==='dark-tech')||s===`:root[data-theme="${theme.id}"]`);
        if(matching)rule.nodes.filter(n=>n.type==='decl'&&n.prop.startsWith('--')).forEach(n=>declarations[theme.id][n.prop]=n.value);
      }
    });
  }
  const host=postcss.parse(palettes);
  const norm=s=>s.replace(/\s+/g,'');
  let count=0;
  const differences=[];
  host.walkRules(rule=>{
    const theme=workspaceThemes.find(t=>rule.selector===`:root[data-theme="${t.id}"]`);
    if(!theme)return;
    for(const n of rule.nodes.filter(n=>n.type==='decl'&&n.prop.startsWith('--'))) {
      if(norm(n.value)!==norm(declarations[theme.id][n.prop]??'')) differences.push(`${theme.name}: ${n.prop}: ${n.value} -> ${declarations[theme.id][n.prop]}`);
      count++;
    }
  });
  assert.deepEqual(differences,[],differences.join('\n'));
  console.log(`${count} palette declarations match the Workflow Designer's ordered root/theme source.`);
}
