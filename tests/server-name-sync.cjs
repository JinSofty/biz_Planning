const fs=require('fs'),path=require('path'),assert=require('assert');
const dir=path.join(__dirname,'../06_validation/POC-001-library-placement');
const extract=s=>s.split('// ARCMAP_NAME_SYNC_BEGIN\n')[1].split('// ARCMAP_NAME_SYNC_END')[0];
const source=extract(fs.readFileSync(path.join(dir,'ArcMap-Sync-ServerNames.md'),'utf8'));
assert.equal(source,extract(fs.readFileSync(path.join(dir,'ArcMap-Place-WebServer.md'),'utf8')));
const install=new Function(source+';return installArcMapNameSync;')();
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(){
 let scene=[],editing=null,listeners=new Set(),cleanups=[],updates=0,dirty=0;const notices=[];
 const api={getSceneElements:()=>scene,getAppState:()=>({editingTextElement:editing}),onChange(fn){listeners.add(fn);return()=>listeners.delete(fn)}};
 const view={excalidrawAPI:api,register:fn=>cleanups.push(fn),setDirty(){dirty++},updateScene(update){assert.equal(update.captureUpdate,'NEVER');updates++;scene=update.elements;for(const fn of listeners)fn(scene,{});}};
 return {view,notices,get scene(){return scene},set scene(es){scene=es},get updates(){return updates},get dirty(){return dirty},get listenerCount(){return listeners.size},edit(v){editing=v},emit(){for(const fn of listeners)fn(scene,{})},close(){cleanups.forEach(fn=>fn())}};
}
function server(prefix,name='web_007'){
 const meta={arcmapPoc:{serverName:name,zoneElementId:'zone',status:'draft'}};
 return [{id:prefix+'-body',type:'rectangle',width:50,height:80,groupIds:[prefix],version:1,customData:{...clone(meta),other:'keep',arcmapPoc:{...meta.arcmapPoc,libraryItemId:'web'}}},
 {id:prefix+'-label',type:'text',text:name+'\n10.0.0.250',originalText:name+'\n10.0.0.250',groupIds:[prefix],version:1,customData:clone(meta)}];
}
const rename=(f,prefix,name)=>{const label=f.scene.find(e=>e.id===prefix+'-label');label.text=label.originalText=name+'\n10.0.0.250';};
const wait=()=>new Promise(r=>setTimeout(r,110));
(async()=>{
 const f=fixture();f.scene=server('a');const c=install(f.view,m=>f.notices.push(m));
 assert(f.scene.every(e=>e.customData.arcmapPoc.serverId==='a-label'));assert.equal(f.updates,1);
 assert.equal(install(f.view,()=>{}),c);assert.equal(f.listenerCount,1);assert.equal(f.updates,1);
 const ids=f.scene.map(e=>e.id);rename(f,'a','web_006');f.edit({id:'a-label'});f.emit();await wait();assert(f.scene.every(e=>e.customData.arcmapPoc.serverName==='web_007'));
 f.edit(null);f.emit();await wait();assert(f.scene.every(e=>e.customData.arcmapPoc.serverName==='web_006'));assert.deepEqual(f.scene.map(e=>e.id),ids);assert.equal(f.scene[0].customData.other,'keep');assert.equal(f.scene[0].width,50);
 assert(!f.scene.some(e=>e.customData.arcmapPoc.serverName==='web_007'),'007 must be available again');
 f.scene.push(...server('b','web_006'));f.emit();await wait();assert(f.scene.every(e=>e.customData.arcmapPoc.nameConflict));assert.equal(f.notices.length,1);
 c.flush();assert.equal(f.notices.length,1);rename(f,'b','web_005');c.flush();assert(f.scene.every(e=>!e.customData.arcmapPoc.nameConflict));
 rename(f,'a','web_007');c.flush();assert(f.scene.filter(e=>e.groupIds.includes('a')).every(e=>e.customData.arcmapPoc.serverName==='web_007'),'undo-like rename must restore metadata');
 rename(f,'a','');c.flush();assert(f.scene.filter(e=>e.groupIds.includes('a')).every(e=>e.customData.arcmapPoc.invalidName));
 f.scene=f.scene.map(e=>e.groupIds.includes('b')?{...e,isDeleted:true}:e);c.flush();assert(!f.scene.filter(e=>!e.isDeleted).some(e=>e.customData.arcmapPoc.nameConflict));
 const before=f.updates;c.flush();assert.equal(f.updates,before,'must not loop');assert(f.dirty>0);
 f.emit();f.close();await wait();assert.equal(f.listenerCount,0);assert.equal(f.updates,before,'close cancels queued callback');
 const other=fixture();other.scene=server('x','web_001');install(other.view,()=>{});assert(other.scene.every(e=>e.customData.arcmapPoc.serverName==='web_001'));other.close();
 for(const file of ['ArcMap-Sync-ServerNames.md','ArcMap-Place-WebServer.md'])new (Object.getPrototypeOf(async function(){}).constructor)('ea','utils',fs.readFileSync(path.join(dir,file),'utf8').replace(/^---\s*\n[\s\S]*?\n---\s*\n/,''));
 console.log('PASS: migration, automatic rename, edit completion, duplicate conflict/recovery, blank name, deletion, undo-like rename, stable IDs/geometry, no loops, single subscription, close cleanup, view isolation, script compilation');
})().catch(e=>{console.error(e);process.exitCode=1});
