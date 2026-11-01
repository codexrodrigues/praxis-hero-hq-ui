// UI-only fixtures derived from host projections; not production schemas or DB proof.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const base=require('./verify-brasa-browser.cjs');
const root=path.resolve(__dirname,'../..');
function load(file){
 const exports={};const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(source,{exports,require:id=>load(path.resolve(path.dirname(file),id+'.ts')),console},{filename:file});return exports;
}
const groups=load(path.join(root,'src/app/core/page-definitions.ts')).HERO_PAGE_GROUPS;
async function catalog(){const result=[];for(const g of groups)for(const item of g.items)if(item.page.kind==='resource')result.push({...item,metadata:await item.page.loadMetadata()});return result;}
const numberFields=new Set(['id','ano','mes','valor','valorTotal','total','quantidade','funcionarioId','missaoId','responsavelId','departamentoId','danosCivis','feridos','mortos','nivel','media','totalPendente','totalIndenizado','totalProventos','totalDescontos','salarioLiquido','scorePublico','scoreGovernamental','nivelRisco','prioridade','qtdHerois','progresso']);
const enums={severidade:['CRITICA','ALTA','MEDIA','BAIXA'],status:['EM_ANDAMENTO','PLANEJADA','CONCLUIDA'],tipo:['FERIAS','AFASTAMENTO'],classe:['OMEGA','ALFA','BETA']};
function fixture(item){
 if(item.page.resource==='human-resources/funcionarios')return{schema:base.schema,rows:base.rows};
 const m=item.metadata;const fields=new Set(['id',...(m.table?.columnProjection?.include||[]),...(m.filterBar?.inlineFields||[]).filter(f=>!f.endsWith('Between'))]);
 // Only fields already named by the host projection enter this limited fixture.
 const properties={};const row={};let order=0;
 for(const name of fields){const title=m.table?.columns?.[name]?.header||name;const type=numberFields.has(name)?'number':name==='ativo'?'boolean':'string';
  properties[name]={type,title,'x-ui':{label:title,order:order++,controlType:type==='boolean'?'checkbox':enums[name]?'select':'input',...(name==='id'?{formHidden:true,tableHidden:false}:{}),...(enums[name]?{options:enums[name].map(value=>({value,label:value}))}:{} )},...(enums[name]?{enum:enums[name]}:{})};
  row[name]=type==='number'?(name==='id'?1:7):type==='boolean'?true:enums[name]?enums[name][0]:`Ensaio ${title}`;
 }
 row.id=1;row._links={self:{href:'/api/'+item.page.resource+'/1'},update:{href:'/api/'+item.page.resource+'/1',method:'PUT'},capabilities:{href:'/api/'+item.page.resource+'/1/capabilities'}};
 return{schema:{type:'object',properties},rows:[row]};
}
async function install(context,report,options={}){
 const items=await catalog(), data=new Map(items.map(i=>[i.page.resource,fixture(i)]));await base.fixtures(context,options);
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url()),p=u.pathname;
  if(!/^\/(api|schemas|auth)(\/|$)/.test(p))return route.fallback();
  report.requests.push({method:req.method(),url:p+u.search});
  if(p==='/schemas/filtered'){
   const target=u.searchParams.get('path')||'';const entry=[...data].find(([key])=>target.includes('/'+key));if(!entry){(report.unmappedSchemas||=[]).push(target);return route.fallback();}
   const schema=structuredClone(entry[1].schema);
   if(target.endsWith('/filter')&&u.searchParams.get('schemaType')==='request'){
    delete schema.required;
    // Partial, manually transcribed filter fields from Quickstart's DTO annotations:
    // operations/dto/filter/IncidenteFilterDTO and hr/dto/filter/FeriasAfastamentoFilterDTO.
    if(entry[0]==='operations/incidentes')for(const [name,label] of [['feridosBetween','Faixa de feridos'],['mortosBetween','Faixa de óbitos']])schema.properties[name]={type:'array',items:{type:'integer'},'x-ui':{label,controlType:'rangeSlider',mode:'range',order:110,min:0,max:100}};
    if(entry[0]==='human-resources/ferias-afastamentos')schema.properties.dataInicioBetween={type:'array',items:{type:'string',format:'date'},'x-ui':{label:'Período Inicial',controlType:'dateRange',order:30}};
   }
   return route.fulfill({json:schema});
  }
  const match=[...data].find(([key])=>p==='/api/'+key||p.startsWith('/api/'+key+'/'));
  if(match&&!p.includes('/stats/')&&!p.endsWith('/capabilities')){
   const[key,value]=match,collection='/api/'+key;
   if(p.endsWith('/filter')||p===collection||p.endsWith('/all')){
    if(req.method()!=='GET'&&!p.endsWith('/filter')){report.businessWrites.push({method:req.method(),path:p});return route.fulfill({status:422,json:{message:'Ensaio de validação: operação não gravada.'}});}
    let body={};try{body=req.postDataJSON()||{}}catch{}
    const selected=body.filter||body;let rows=value.rows;
    if(key==='human-resources/funcionarios')rows=rows.filter(r=>(!selected.nomeCompleto||r.nomeCompleto.toLocaleLowerCase('pt-BR').includes(String(selected.nomeCompleto).toLocaleLowerCase('pt-BR')))&&(selected.ativo===undefined||r.ativo===selected.ativo));
    return route.fulfill({json:{success:true,data:{content:rows,totalElements:rows.length,totalPages:rows.length?1:0,size:10,number:0},_links:{create:{href:collection,method:'POST'},capabilities:{href:collection+'/capabilities'}}}});
   }
   if(/\/\d+$/.test(p)&&req.method()==='GET')return route.fulfill({json:{success:true,data:value.rows[0]}});
  }
  if(match&&p.endsWith('/capabilities'))return route.fulfill({json:{resourceKey:match[0].replaceAll('/','.'),resourcePath:'/api/'+match[0],canonicalOperations:{create:true,view:true,edit:true},operations:{create:{id:'create',scope:'COLLECTION',supported:true,availability:{allowed:true}},view:{id:'view',scope:'ITEM',supported:true,availability:{allowed:true}},edit:{id:'edit',scope:'ITEM',supported:true,availability:{allowed:true}}},surfaces:[],actions:[]}});
  if(p==='/schemas/surfaces')return route.fulfill({json:{surfaces:[]}});
  if(p==='/schemas/actions')return route.fulfill({json:{actions:[]}});
  if(!p.startsWith('/api/praxis/config')&&req.method()!=='GET'&&!p.includes('/stats/')&&!p.endsWith('/filter')&&!p.endsWith('/options')){report.businessWrites.push({method:req.method(),path:p});return route.fulfill({status:405,json:{message:'Ensaio sem gravação de negócio'}});}
  return route.fallback();
 });return items;
}
module.exports={install,catalog};
