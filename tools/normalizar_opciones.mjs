import {readFile,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizedRow} from '../src/content/dashboard/crm-normalize.js';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const path=join(root,'src/data.json');
const snapshot=JSON.parse(await readFile(path,'utf8'));
snapshot.queries.incidencias.rows=snapshot.queries.incidencias.rows.map(normalizedRow);
snapshot.filters=[
 ['situacion','Situación','source'],['etapa','Etapa','source'],['tipo','Tipo','source'],['prioridad','Prioridad','source'],['modulo','Módulo','source'],['bloqueante','Bloqueante','source'],['alerta','Alerta del registro','source'],['plazoEstado','Plazo al corte','calculated'],
].map(([id,label,group])=>({id,label,group,field:id==='plazoEstado'?id:`${id}Categoria`,defaultValue:'all',queryIds:['incidencias']}));
snapshot.queries.incidencias.source.normalization={authority:'Categorías de validación y valores observados del Sheets',originalFieldsPreserved:true,rules:['Espacios, mayúsculas y tildes se concilian con el catálogo.','Responsables compartidos equivalentes se agrupan, conservando roles y condiciones.','Unificado en #11 se agrupa bajo Unificado; el original y la relación se conservan.','Prioridad sin dato conserva la opción — del registro.','Situación y etapa del origen se muestran separadas del plazo calculado.']};
await writeFile(path,JSON.stringify(snapshot,null,2)+'\n','utf8');
console.log(JSON.stringify({normalization:true,rows:snapshot.queries.incidencias.rows.length}));
