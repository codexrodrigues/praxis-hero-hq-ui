// Browser proof of the real host/components with deterministic transport fixtures.
// No API request reaches a backend; no DB, auth or persistence proof is claimed.
const {chromium}=require(require.resolve('@playwright/test',{paths:[__dirname,require('node:path').resolve(__dirname,'../../../praxis-ui-angular/node_modules')]}));
const {mkdirSync,writeFileSync}=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const THEME=process.env.HERO_THEME||'brasa';
const THEME_NAME=THEME==='insignia'?'Insígnia':'Brasa';
const BASE='http://127.0.0.1:4302';
const OUT=path.resolve(__dirname,'../../docs/design/evidence/'+THEME+'-2026-11-01');
mkdirSync(OUT,{recursive:true});
const resource='/api/human-resources/funcionarios';
// Schema fixture follows the canonical CRUD lifecycle fixture shape and actual
// FuncionarioDTO field names. It is deliberately not a production schema snapshot.
const field=(title,type,order,extra={})=>({type,title,'x-ui':{label:title,controlType:type==='boolean'?'checkbox':'input',order,...extra}});
const schema={type:'object',required:['nomeCompleto','email'],properties:{
 id:{type:'integer',readOnly:true,'x-ui':{formHidden:true,tableHidden:true}},
 nomeCompleto:field('Nome Completo','string',10),email:{...field('E-mail','string',20,{tableHidden:true}),format:'email'},
 cargoNome:field('Cargo','string',30),departamentoNome:field('Departamento','string',40),
 ativo:field('Ativo','boolean',50),dataAdmissao:{...field('Data de admissão','string',60),format:'date'},
 avatarUrl:field('Avatar','string',70,{formHidden:true}),
}};
const names=['João Luís Rodrigues','Natasha Romanoff','Maria da Conceição Albuquerque','Steve Rogers','Wanda Maximoff','Sam Wilson','Bruce Banner','Shuri Udaku'];
const rows=names.map((nomeCompleto,i)=>({id:i+1,nomeCompleto,email:`pessoa${i+1}@exemplo.invalid`,cargoNome:i%2?'Especialista de campo':'Analista de operações',departamentoNome:i%2?'Inteligência e estratégia':'Operações táticas',ativo:i!==4,dataAdmissao:'2025-04-15',avatarUrl:null,_links:{self:{href:`${resource}/${i+1}`},update:{href:`${resource}/${i+1}`,method:'PUT'},capabilities:{href:`${resource}/${i+1}/capabilities`},surfaces:{href:`/schemas/surfaces?path=${resource}/${i+1}`}}}));
const report={kind:'real-host visual proof / mocked HTTP',base:BASE,checks:[],requests:[],pageErrors:[],measurements:[],captures:[],unexpectedWrites:[],mockConfigWrites:[]};
const pass=name=>report.checks.push(name);
const json=(r,body,status=200)=>r.fulfill({status,contentType:'application/json',headers:{ETag:'"brasa-visual-fixture"'},body:JSON.stringify(body)});
function operations(){return{create:{id:'create',scope:'COLLECTION',supported:true,availability:{allowed:true}},view:{id:'view',scope:'ITEM',supported:true,availability:{allowed:true}},edit:{id:'edit',scope:'ITEM',supported:true,availability:{allowed:true}}}}
async function fixtures(context, options={}){await context.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url()),p=u.pathname;
 if(!/^\/(api|schemas|auth)(\/|$)/.test(p))return route.continue();
 report.requests.push({method:req.method(),path:p,...(p.startsWith('/api/praxis/config')?{componentType:u.searchParams.get('componentType'),componentId:u.searchParams.get('componentId')}:{})});
 if(p.startsWith('/auth'))return json(route,{},401);
 if(p.startsWith('/api/praxis/config')){if((options.appearance||options.globalConfig)&&req.method()==='GET'){const id=u.searchParams.get('componentId')||'';return json(route,{payload:id==='praxis:global-config'?(options.globalConfig||{table:{appearance:options.appearance}}):null});}if(req.method()!=='GET'){report.mockConfigWrites.push({method:req.method(),path:p});return json(route,{payload:null});}return json(route,{},404);}
 if(req.method()!=='GET'&&!p.includes('/stats/')&&!p.endsWith('/filter')&&!p.endsWith('/options')){report.unexpectedWrites.push(p);return json(route,{message:'visual proof is read-only'},405);}
 if(p==='/schemas/filtered')return json(route,schema);
 if(p==='/schemas/surfaces')return json(route,{surfaces:[],resourceKey:'human-resources.funcionarios'});
 if(p==='/schemas/actions')return json(route,{actions:[]});
 if(p.startsWith('/api/praxis/config'))return json(route,{},404);
 if(p.includes('/capabilities'))return json(route,{resourceKey:'human-resources.funcionarios',resourcePath:resource,canonicalOperations:{create:true,view:true,edit:true},operations:operations(),surfaces:[],actions:[]});
 if(p.includes('/stats/')){
  let body={};try{body=req.postDataJSON()||{}}catch{}
  if(p.endsWith('/timeseries'))return json(route,{success:true,data:{field:'competencia',points:[0,1,2,3,4,5].map(i=>({start:`${i<3?2025:2026}-${String(10+i>12?i-2:10+i).padStart(2,'0')}-01`,values:{salarioLiquido:2500000+i*100000,totalDescontos:400000+i*20000,totalProventos:2900000+i*120000}}))}});
  const metric=Object.fromEntries((body.metrics||[body.metric||{alias:'total'}]).map(m=>[m.alias||m.field||'total',m.alias==='scoreGovernamental'?83:m.alias==='scorePublico'?88:10]));
  const keys=body.field==='ativo'?[true,false]:body.field==='equipe'?['Vingadores','Guardiões','Defensores']:body.field==='severidade'?['CRITICA','ALTA','MEDIA']:['EM_ANDAMENTO','PLANEJADA','CONCLUIDA'];
  return json(route,{success:true,data:{field:body.field||'ativo',buckets:keys.map((key,i)=>({key,label:String(key),value:i===0?53:48,values:{...metric,total:i===0?53:48}}))}});
 }
 if(p===resource+'/filter'||p===resource+'/all'||p===resource)return json(route,{success:true,data:{content:rows,totalElements:rows.length,totalPages:1,size:10,number:0},_links:{create:{href:resource,method:'POST'},capabilities:{href:resource+'/capabilities'}}});
 if(p.startsWith(resource+'/')&&/\d+$/.test(p))return json(route,{success:true,data:rows[Number(p.split('/').pop())-1]||rows[0]});
 if(p.endsWith('/filter'))return json(route,{success:true,data:{content:[],totalElements:0,totalPages:0,size:10,number:0}});
 return json(route,{});
});}
async function shot(page,name){await page.screenshot({path:path.join(OUT,name+'.png'),fullPage:false,animations:'disabled'});report.captures.push(name+'.png');}
module.exports={fixtures,report,rows,schema};
if(require.main===module)(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},ignoreHTTPSErrors:true});
  await fixtures(context);if(THEME==='brasa')await context.addInitScript(theme=>{if(!localStorage.getItem('praxis_hero_hq_theme'))localStorage.setItem('praxis_hero_hq_theme',theme);},THEME);const page=await context.newPage();page.on('pageerror',e=>report.pageErrors.push(e.message));
  await page.goto(BASE);await page.locator('app-dashboard-page').waitFor({timeout:30000});await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('html').getAttribute('data-theme'),THEME);pass('root route renders dashboard with '+THEME_NAME+'; Insígnia uses fresh default');
  await page.waitForTimeout(1500);
  await page.getByRole('button',{name:'Aparência: '+THEME_NAME,exact:true}).click();
  const fonts=await page.evaluate(()=>({body:getComputedStyle(document.body).fontFamily,title:getComputedStyle(document.querySelector('.hero-executive-banner .prx-rich-card-title,.hero-executive-banner .prx-rich-card__title,.hero-executive-banner .pdx-rich-card-title')).fontFamily,material:getComputedStyle(document.querySelector('.mat-mdc-menu-item-text')).fontFamily,loaded:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family),bg:getComputedStyle(document.body).backgroundColor}));
  assert(fonts.material.includes('Source Sans 3'));assert(fonts.body.includes('Source Sans 3'));assert(fonts.title.includes('Manrope'));assert(fonts.loaded.includes('Source Sans 3'));assert(fonts.loaded.includes('Manrope'));report.measurements.push({fonts});await shot(page,'desktop-appearance');await page.keyboard.press('Escape');await page.locator('.mat-mdc-menu-panel').waitFor({state:'hidden'});pass('local B fonts loaded in real runtime, headings and Material use the token bridge');
  assert.equal(await page.getByText('Não foi possível carregar os dados do gráfico',{exact:true}).count(),0);
  assert(await page.locator('praxis-chart canvas').count()>0);pass('real Charts renders Canvas from intercepted stats fixtures');
  await shot(page,'desktop-dashboard');
  await page.getByRole('button',{name:'Aparência: '+THEME_NAME,exact:true}).click();await page.getByRole('menuitemradio',{name:/Órbita/}).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark-tech');
  await page.getByRole('button',{name:'Aparência: Órbita',exact:true}).click();await page.getByRole('menuitemradio',{name: new RegExp(THEME_NAME)}).click();await page.reload();await page.locator('app-dashboard-page').waitFor();
  assert.equal(await page.locator('html').getAttribute('data-theme'),THEME);pass('appearance menu selects '+THEME_NAME+', preserves old theme, reload persists preference');
  await page.goto(BASE+'/rh/funcionarios');await page.locator('praxis-table').waitFor({timeout:30000});await page.locator('praxis-table').getByText('João Luís Rodrigues',{exact:true}).waitFor({timeout:20000});
  await page.waitForTimeout(500);await shot(page,'desktop-table');
  const table=await page.locator('praxis-table').evaluate(el=>({font:getComputedStyle(el).fontFamily,padding:getComputedStyle(el).getPropertyValue('--p-cell-padding-default').trim(),headerSize:getComputedStyle(el).getPropertyValue('--p-header-font-size-default').trim(),rowHeights:[...el.querySelectorAll('.mat-mdc-row')].map(row=>row.getBoundingClientRect().height)}));
  assert(table.font.includes('Source Sans 3'));assert.equal(table.padding,'8px 16px');assert.equal(table.headerSize,'13px');report.measurements.push({table});pass('real Table consumes host appearance defaults through canonical config and font tokens');

  const create=page.getByRole('button',{name:/Novo Colaborador/i}).first();await create.click();
  await page.locator('praxis-dynamic-form').waitFor({timeout:15000});await page.waitForTimeout(500);await shot(page,'desktop-form');pass('canonical CRUD modal materializes Dynamic Form with schema fixture');
  await page.keyboard.press('Escape');
  for(const width of [760,390]){
   await page.setViewportSize({width,height:844});await page.goto(BASE);await page.locator('app-dashboard-page').waitFor();await page.waitForTimeout(500);await shot(page,`dashboard-${width}`);
   const geometry=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,bodyFont:getComputedStyle(document.body).fontFamily}));report.measurements.push(geometry);
   assert(geometry.document<=geometry.width+1);pass(`${width}px dashboard has no document horizontal overflow`);
   await page.getByRole('button',{name:'Aparência: '+THEME_NAME,exact:true}).click();
   const menu=await page.locator('.mat-mdc-menu-panel').boundingBox();assert(menu.x>=0&&menu.x+menu.width<=width+1);
   await shot(page,`appearance-${width}`);await page.keyboard.press('Escape');
   await page.goto(BASE+'/rh/funcionarios');await page.locator('praxis-table').getByText('João Luís Rodrigues',{exact:true}).waitFor();await page.locator('praxis-table .mat-mdc-row').first().scrollIntoViewIfNeeded();await shot(page,`table-${width}`);
   const mobileCreate=page.getByRole('button',{name:/Novo Colaborador/i}).first();
   if(await mobileCreate.count()===0){
    await page.getByRole('button',{name:'Mais ações',exact:true}).first().click();
    await page.getByRole('menuitem',{name:/Novo Colaborador/i}).click();
   }else await mobileCreate.click();await page.locator('praxis-dynamic-form').waitFor();await page.waitForTimeout(300);await shot(page,`form-${width}`);
   const pane=await page.locator('.cdk-overlay-pane').filter({has:page.locator('praxis-dynamic-form')}).boundingBox();
   assert(pane.x>=-1&&pane.x+pane.width<=width+1&&pane.y>=-1&&pane.y+pane.height<=845);
   const fieldFont=await page.locator('praxis-dynamic-form input').first().evaluate(el=>getComputedStyle(el).fontFamily);assert(fieldFont.includes('Source Sans 3'));
   assert(await page.locator('praxis-dynamic-form input').first().isVisible());report.measurements.push({width,menu,pane,fieldFont});pass(`${width}px appearance overlay and canonical form are visible`);await page.keyboard.press('Escape');
  }
  await page.goto(BASE+'/workspace-corporativo');await page.locator('app-corporate-layout').waitFor();assert(await page.locator('[data-testid=corporate-navigation]').isVisible());pass('corporate route still uses its canonical layout after root precedence fix');
  // Sample the actual Material overlay and native host headings in every theme.
  const themes=[['classic','Essência'],['light-tech','Aurora'],['dark-tech','Órbita'],['brasa','Brasa'],['insignia','Insígnia']];
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(BASE+'/workspace-corporativo');await page.locator('.session-form').waitFor();
  for(const [id,name] of themes){
   await page.getByRole('button',{name:/^Aparência:/}).click();await page.getByRole('menuitemradio',{name:new RegExp('^'+name+' ·')}).click();
   await page.evaluate(()=>document.fonts.ready);
   await page.getByRole('button',{name:`Aparência: ${name}`,exact:true}).click();
   await page.locator('.mat-mdc-menu-panel').waitFor();
   const visual=await page.evaluate(()=>{
    const ctx=document.createElement('canvas').getContext('2d');
    function rgba(color){ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);}
    function surface(el){const chain=[];for(let e=el;e;e=e.parentElement)chain.unshift(e);let bg=[255,255,255];for(const e of chain){const c=rgba(getComputedStyle(e).backgroundColor);bg=bg.map((v,i)=>c[i]*c[3]+v*(1-c[3]));}return bg;}
    function luminosity(c){return c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);}
    function contrast(a,b){const x=luminosity(a),y=luminosity(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
    const label=document.querySelector('.mat-mdc-menu-item-text'),menu=document.querySelector('.mat-mdc-menu-panel');
    const body=getComputedStyle(document.body),title=getComputedStyle(document.querySelector('app-corporate-context-page h1'));
    const field=document.querySelector('.session-form mat-form-field'),outline=field.querySelector('.mdc-notched-outline__leading');
    const border=rgba(getComputedStyle(outline).borderTopColor),fieldBg=surface(field.querySelector('.mat-mdc-text-field-wrapper'));
    return{theme:document.documentElement.dataset.theme,bodyFont:body.fontFamily,titleFont:title.fontFamily,menuFont:getComputedStyle(label).fontFamily,menuContrast:contrast(rgba(getComputedStyle(label).color),surface(menu)),outlineContrast:contrast(border,fieldBg),outlineColor:border,fieldBackground:fieldBg};
   });
   const expected=['brasa','insignia'].includes(id)?'Source Sans 3':'Work Sans';assert(visual.bodyFont.includes(expected));assert(visual.menuFont.includes(expected));assert(visual.titleFont.includes(['brasa','insignia'].includes(id)?'Manrope':'Work Sans'));assert(visual.menuContrast>=4.5);
   report.measurements.push({themeRegression:visual});await shot(page,`theme-${id}-overlay`);
   await page.keyboard.press('Escape');await page.locator('.mat-mdc-menu-panel').waitFor({state:'hidden'});
   if(id==='brasa'){
    assert(visual.outlineContrast>=3);
    await page.locator('.session-form input').first().focus();await page.waitForTimeout(250);
    const focus=await page.locator('.session-form').evaluate(el=>({border:getComputedStyle(el.querySelector('.mdc-notched-outline__leading')).borderTopColor,focused:el.contains(document.activeElement)}));
    assert(focus.focused);assert.notEqual(focus.border,`rgb(${visual.outlineColor.slice(0,3).join(', ')})`);report.measurements.push({brasaFocus:focus});pass('Brasa field outline passes 3:1 on actual canvas and focus changes to primary');
   }
   pass(`${name}: actual host title/body/menu fonts and overlay text contrast preserved`);
  }
  // Independent persisted global-config fixture proves that theme defaults do not
  // mask authored appearance. This is runtime adoption, not Settings Panel UX proof.
  const authored={appearance:{density:'spacious',spacing:{cellPadding:'18px 24px',headerHeight:64},typography:{headerFontSize:'18px'}}};
  const authoredContext=await browser.newContext({viewport:{width:1440,height:1000},ignoreHTTPSErrors:true});
  await fixtures(authoredContext,authored);const authoredPage=await authoredContext.newPage();
  authoredPage.on('pageerror',e=>report.pageErrors.push(e.message));
  await authoredPage.goto(BASE+'/rh/funcionarios');
  await authoredPage.locator('praxis-table').getByText('João Luís Rodrigues',{exact:true}).waitFor();
  await authoredPage.waitForTimeout(300);
  let appearance=await authoredPage.locator('praxis-table').evaluate(el=>({padding:getComputedStyle(el).getPropertyValue('--p-cell-padding-default').trim(),header:getComputedStyle(el).getPropertyValue('--p-header-font-size-default').trim(),classes:el.className}));
  assert.equal(appearance.padding,'18px 24px');assert.equal(appearance.header,'18px');assert(appearance.classes.includes('density-spacious'));
  report.measurements.push({authored:appearance});await shot(authoredPage,'authored-table-appearance');
  authored.appearance.density='compact';await authoredPage.reload();
  await authoredPage.locator('praxis-table').getByText('João Luís Rodrigues',{exact:true}).waitFor();
  appearance=await authoredPage.locator('praxis-table').evaluate(el=>({padding:getComputedStyle(el).getPropertyValue('--p-cell-padding-default').trim(),header:getComputedStyle(el).getPropertyValue('--p-header-font-size-default').trim(),classes:el.className}));
  assert(appearance.classes.includes('density-compact'));assert.equal(appearance.padding,'18px 24px');
  report.measurements.push({authoredCompact:appearance});pass('persisted authored spacing/header override host defaults; spacious and compact densities materialize through GlobalConfig');
  await authoredContext.close();
  for(const url of ['/workspace-corporativo/paginas','/workspace-corporativo/grupos','/pages/visual-fixture-id']){
   await page.goto(BASE+url);await page.locator('app-corporate-layout app-corporate-pages').waitFor();
   assert(await page.locator('[data-testid=corporate-navigation]').isVisible());
  }
  await page.goto(BASE+'/laboratorio/paginas/visual-fixture-id');await page.locator('app-visitor-lab-page').waitFor();
  pass('corporate editor/group/published-reader and saved visitor routes retain their correct layouts');
  assert.equal(report.unexpectedWrites.length,0);assert.equal(report.pageErrors.length,0);pass('no business writes attempted, no page exceptions, all API/schema/auth requests intercepted; config writes simulated');
  report.browser=browser.version();writeFileSync(path.join(OUT,'browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks.length,captures:report.captures.length,errors:report.pageErrors}));
 }finally{await browser.close();}
})().catch(e=>{writeFileSync(path.join(OUT,'browser-report-partial.json'),JSON.stringify({...report,failure:String(e)},null,2));console.error(e);process.exitCode=1});
