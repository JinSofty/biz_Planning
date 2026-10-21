const fs=require('fs');const assert=require('assert');
const file=fs.readFileSync(require('path').join(__dirname,'../06_validation/POC-001-library-placement/ArcMap-Place-WebServer.md'),'utf8');
const code=file.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/, '');
const lib=JSON.stringify({libraryItems:[{id:'L-5apBcsCZmLyXEcM2c_h',elements:[
{id:'a',type:'rectangle',x:0,y:0,width:100,height:80,seed:42,roughness:0,groupIds:['g'],strokeWidth:2},
{id:'b',type:'line',x:0,y:20,width:100,height:0,points:[[0,0],[100,0]],seed:43,roughness:0,groupIds:['g']},
{id:'c',type:'text',text:'Web',x:10,y:30,width:80,height:30,fontSize:20,seed:44,roughness:0,groupIds:['g']}
]}]});
const original=JSON.parse(lib).libraryItems[0].elements;
const box=es=>{const xs=[],ys=[];for(const e of es){if(e.points){for(const [x,y] of e.points){xs.push(e.x+x);ys.push(e.y+y)}}else{xs.push(e.x,e.x+e.width);ys.push(e.y,e.y+e.height)}}return {topX:Math.min(...xs),topY:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)}};
async function run(mode){let n=0,added=false,msg='';const zone={id:'zone',type:'rectangle',x:100,y:100,width:600,height:400,angle:0};if(mode==='small'){zone.width=60;zone.height=60;}
const scene=[zone];if(mode==='duplicate')scene.push({customData:{arcmapPoc:{serverName:'web_007'}}});if(mode==='collision')scene.push({id:'other',x:360,y:180,width:60,height:70});
if(['peer','manual','other','crowded'].includes(mode)){
 const peers=original.map(e=>({...JSON.parse(JSON.stringify(e)),id:'peer-'+e.id,x:120+e.x*0.5,y:180+e.y*0.5,width:e.width*0.5,height:e.height*0.5,points:e.points?.map(p=>p.map(v=>v*0.5)),groupIds:['peer-group'],customData:['manual','other'].includes(mode)?{}:{arcmapPoc:{serverName:'web_006',libraryItemId:'L-5apBcsCZmLyXEcM2c_h',zoneElementId:'zone'}}}));
 if(mode==='other') {peers.find(e=>e.type==='text').text='Server';peers.find(e=>e.type==='text').width=90;}
 scene.push(...peers);
 if(mode==='crowded'){zone.width=110;zone.height=180;}
}
if(mode==='full')scene.push({id:'cover',x:100,y:100,width:600,height:400});
const before=JSON.stringify(scene);
const ea={targetView:{app:{vault:{adapter:{read:async()=>lib}}}},verifyMinimumPluginVersion:()=>true,getViewSelectedElements:()=>mode==='none'?[]:[zone],getViewElements:()=>scene,obsidian:{Notice:class{constructor(m){msg=m}}},style:{},elementsDict:{},reset(){this.elementsDict={}},generateElementId:()=>`new${++n}`,getBoundingBox:box,addText(x,y,text){const id=this.generateElementId();this.elementsDict[id]={id,type:'text',x,y,text,width:110,height:45,groupIds:[]};return id},getElement(id){return this.elementsDict[id]},addToGroup(ids){for(const id of ids)this.elementsDict[id].groupIds.push('outer')},addElementsToView:async()=>{added=true;return true},selectElementsInView:()=>{}};
await new (Object.getPrototypeOf(async function(){}).constructor)('ea',code)(ea);
assert.equal(JSON.stringify(scene),before,'existing scene mutated');
if(['ok','small','collision','peer','manual','other','crowded'].includes(mode)){assert(added,msg);const es=Object.values(ea.elementsDict);assert.equal(es.length,original.length+1);const b=box(es);assert(b.topX>=zone.x&&b.topY>=zone.y&&b.topX+b.width<=zone.x+zone.width&&b.topY+b.height<=zone.y+zone.height);for(let i=0;i<original.length;i++){const e=es.find(e=>e.seed===original[i].seed);assert(e);assert.equal(e.roughness,original[i].roughness);assert(!original.some(o=>o.id===e.id));for(const g of e.groupIds)assert(!original[i].groupIds.includes(g));}if(['peer','manual','other'].includes(mode))assert.equal(es.find(e=>e.seed===42).width,50,'peer size');
const factor=es.find(e=>e.seed===42).width/100;
for(const src of original){const dst=es.find(e=>e.seed===src.seed);assert(Math.abs(dst.width-src.width*factor)<1e-8);assert(Math.abs(dst.height-src.height*factor)<1e-8);if(src.points)src.points.forEach((pt,i)=>pt.forEach((v,j)=>assert(Math.abs(dst.points[i][j]-v*factor)<1e-8)));if(src.fontSize)assert(Math.abs(dst.fontSize-src.fontSize*factor)<1e-8);}
if(mode==='small')assert(es.find(e=>e.seed===42).width<100);
assert.equal(JSON.stringify(JSON.parse(lib).libraryItems[0].elements),JSON.stringify(original));}else assert(!added,mode);
console.log(mode+': PASS '+msg);
}
(async()=>{for(const m of ['ok','small','peer','manual','other','crowded','collision','full','duplicate','none'])await run(m)})().catch(e=>{console.error(e);process.exit(1)});
