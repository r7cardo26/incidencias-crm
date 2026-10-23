import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {category,categoryFields,categoryOrder,normalizedRow,deadlineLabel} from '../src/content/dashboard/crm-normalize.js';
import catalog from '../src/content/dashboard/crm-catalog.json' with {type:'json'};

// Equivalencias de escritura; las funciones no reclasifican el contenido del caso.
for(const [field,input,expected] of [
 ['responsable','  alex  ','Alex'],['responsable','Marketing / Alex','Alex / Marketing'],
 ['responsable','', 'Por asignar'],['responsable','—','Por asignar'],
 ['responsable','Ricardo / Freddy (definición) → Alex','Ricardo / Freddy (definición) → Alex'],
 ['responsable','Alex / Freddy-Ricardo (política)','Alex / Freddy-Ricardo (política)'],
 ['etapa','Unificado en #11','Unificado'],['etapa',null,'Sin etapa'],
 ['etapa','Unificado pendiente de aprobación','Unificado pendiente de aprobación'],
 ['prioridad',' critica ','Crítica'],['prioridad','—','—'],['bloqueante',true,'Sí'],
 ['bloqueante',false,'No'],['tipo','definicion interna','Definición interna'],
 ['modulo','Reglas y automatización','Reglas y automatización'],
 ['tipo','Categoría nueva','Categoría nueva'],
])assert.equal(category(field,input),expected,`${field}: ${input}`);
assert.deepEqual([...catalog.categories.prioridad].reverse().sort((a,b)=>categoryOrder('prioridad',a)-categoryOrder('prioridad',b)),['Crítica','Alta','Media','Baja','—']);
assert.equal(deadlineLabel('Vence al corte'),'Vence al corte');
assert.equal(deadlineLabel('Cumplida'),'No aplica · cerrado');

const snapshot=JSON.parse(await readFile(new URL('../src/data.json',import.meta.url),'utf8'));
const rows=snapshot.queries.incidencias.rows;
for(const row of rows){
 const original=structuredClone(row),result=normalizedRow(row);
 assert.deepEqual(row,original,'La normalización mutó los originales');
 assert.deepEqual(normalizedRow(result),result,'La normalización no es idempotente');
 for(const [field,value] of Object.entries(original))if(!field.endsWith('Categoria'))assert.deepEqual(result[field],value,`${row.id}: ${field} cambió`);
 for(const field of categoryFields)assert.equal(row[`${field}Categoria`],result[`${field}Categoria`],`${row.id}: categoría no aplicada`);
 for(const field of ['tipo','prioridad','bloqueante','situacion'])assert.ok(catalog.categories[field].includes(result[`${field}Categoria`]),`${row.id}: opción fuera del catálogo ${field}`);
 assert.ok([...catalog.categories.etapa,'Sin etapa'].includes(result.etapaCategoria),`${row.id}: etapa fuera del catálogo`);
}
const uncertain={etapa:'Por validar',responsable:'alex',situacion:'Abierto',cumplida:false,reprogramada:false,compromisoTexto:'19/10/2026 - 22/10/26',plazo:null,solucion:'2026-10-15'};
const preserved=normalizedRow(uncertain);
assert.equal(preserved.cumplida,false,'Normalizar no cierra un caso con solución informada');
assert.equal(preserved.reprogramada,false,'Normalizar no crea una reprogramación de un texto ambiguo');
assert.equal(preserved.plazo,null,'Normalizar no inventa una fecha');
console.log(JSON.stringify({ok:true,casos:rows.length,camposNormalizados:categoryFields,originalesConservados:true}));
