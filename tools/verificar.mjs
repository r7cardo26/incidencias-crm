import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const snapshot=JSON.parse((await readFile(join(root,'src/data.json'),'utf8')).replace(/^\uFEFF/,''));
const cases=snapshot.queries.incidencias.rows,ids=new Set(cases.map(r=>r.id));
assert.equal(ids.size,cases.length,'CasoID duplicado');
assert.equal(snapshot.buildStatus,'complete');
for(const r of cases){
 assert.equal(r.cumplida,r.situacion==='Cerrado',r.id+': situación y cumplimiento no concilian');
 if(r.plazoEstado==='Vencida')assert.ok(!r.cumplida&&r.plazo&&r.plazo<snapshot.crm.corte,r.id+': vencimiento inválido');
 if(r.plazoEstado==='Sin plazo')assert.ok(!r.cumplida&&!r.plazo,r.id+': sin plazo inválido');
 const confirmed=snapshot.queries.compromisos.rows.some(c=>c.caso===r.id&&c.reprogramacion);
 assert.equal(r.reprogramada,confirmed,r.id+': reprogramación sin confirmación');
}
for(const id of ['cronologia','compromisos','evidencias','pendientes'])for(const r of snapshot.queries[id].rows)if(r.caso)assert.ok(ids.has(r.caso),id+': caso inexistente');
const eventIds=new Set();
for(const r of snapshot.queries.cronologia.rows){assert.ok(!eventIds.has(r.id),'Hecho duplicado');eventIds.add(r.id);if(!r.fecha)assert.notEqual(r.tipoFecha,'Fecha documental');}
for(const p of snapshot.queries.evidencias.rows){
 const path=p.archivo.replace(/^\.\//,'');
 for(const base of [root,join(root,'docs')]){
  const bytes=await readFile(join(base,path));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),p.sha256,p.id+': fotografía modificada');
 }
}
const bytes=await readFile(join(root,'docs/index.html'));
const html=bytes.toString('utf8');
assert.ok(!html.includes('C:\\Users\\'),'Ruta del equipo publicada');
const encoded=JSON.stringify(snapshot);
assert.ok(!/https:\/\/docs\.google\.com\/spreadsheets\//.test(encoded),'Enlace privado de Sheets publicado');
assert.ok(!/[A-Za-z]:\\\\Users\\\\/.test(encoded),'Ruta absoluta en el snapshot');
const {aggregate}=await import('../src/content/dashboard/crm-data.js');
const stats=aggregate(cases);
assert.equal(stats.cumplidas+stats.abiertas,stats.total);
assert.equal(aggregate(cases.filter(r=>r.situacion==='Cerrado')).abiertas,0);
assert.equal(aggregate([]).total,0);
console.log(JSON.stringify({ok:true,corte:snapshot.crm.corte,...stats,hechos:eventIds.size,compromisos:snapshot.queries.compromisos.rows.length,fotos:snapshot.queries.evidencias.rows.length}));
