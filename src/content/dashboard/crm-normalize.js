import catalog from './crm-catalog.json' with {type:'json'};
// Categories from Sheets govern the vocabulary. Original fields remain intact.
export const tidy=value=>String(value??'').normalize('NFKC').replace(/[\u200b-\u200d\ufeff]/g,'').trim().replace(/\s+/g,' ');
const key=value=>tidy(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
const missing=value=>['','—','-','n/a','null'].includes(key(value));
const people=value=>key(value).split(/\s*\/\s*/).sort().join('/');
const lookup=(field,value)=>catalog.categories[field]?.find(item=>key(item)===key(value));
export function category(field,value){
 const text=tidy(value);
 if(field==='responsable'){
  if(missing(text)||['sin responsable','sin asignar','por asignar'].includes(key(text)))return 'Por asignar';
  const named=text.replace(/\balex\b/gi,'Alex');
  if(!/[()→]/.test(named)&&named.includes('/')){
   const equivalent=catalog.categories.responsable.filter(item=>!/[()→]/.test(item)&&people(item)===people(named));
   return equivalent.map(item=>tidy(item).replace(/\balex\b/gi,'Alex')).sort((a,b)=>a.localeCompare(b,'es'))[0]||named;
  }
  return lookup(field,named)||named;
 }
 if(field==='etapa'&&/^unificado(?:\s+en\s+#?\d+)?$/i.test(text))return 'Unificado';
 if(field==='etapa'&&(missing(text)||key(text)==='sin etapa'))return 'Sin etapa';
 if(field==='prioridad'&&(missing(text)||['sin prioridad','sin definir'].includes(key(text))))return '—';
 if(field==='modulo'&&(missing(text)||key(text)==='por clasificar'))return 'Por clasificar';
 if(field==='bloqueante')return value===true||['si','true'].includes(key(text))?'Sí':value===false||['no','false'].includes(key(text))?'No':text||'Sin dato';
 if(field==='alerta')return missing(text)?'Sin alerta':text;
 if(field==='tipo'&&missing(text))return 'Sin tipo';
 return lookup(field,text)||text||'Sin dato';
}
export const cleanName=value=>category('responsable',value);
export const situationLabel=value=>category('situacion',value);
export const priorityLabel=value=>category('prioridad',value)==='—'?'— (sin prioridad)':category('prioridad',value);
export const stageLabel=value=>category('etapa',value);
export const moduleLabel=value=>category('modulo',value);
export const typeLabel=value=>category('tipo',value);
export const deadlineLabel=value=>({'Cumplida':'No aplica · cerrado','Vencida':'Vencido','Sin plazo':'Sin plazo','Vence al corte':'Vence al corte','En plazo':'En plazo'})[value]||tidy(value)||'Sin dato';
export const resultLabel=row=>row.cumplida?'Cerrado · cumplida':`Abierto · ${deadlineLabel(row.plazoEstado).toLocaleLowerCase('es')}`;
export const resultTone=row=>row.cumplida?'green':row.plazoEstado==='Vencida'?'red':['Sin plazo','Vence al corte'].includes(row.plazoEstado)?'amber':'blue';
export const optionLabel=(field,value)=>field==='prioridad'?priorityLabel(value):field==='plazoEstado'?deadlineLabel(value):category(field,value);
export const categoryOrder=(field,value)=>{const list=catalog.categories[field]||[];const position=list.indexOf(category(field,value));return position<0?999:position;};
export const categoryFields=['tipo','modulo','prioridad','responsable','etapa','situacion','bloqueante','alerta'];
export const normalizedRow=row=>({...row,...Object.fromEntries(categoryFields.map(field=>[`${field}Categoria`,category(field,field==='alerta'?row.alertaFuente:row[field])]))});
export const eventLabel=value=>{
 const fields={Responsable:'responsable',Estado:'etapa',FechaCompromiso:'compromiso',ComentarioSoporte:'comentario de soporte',Prioridad:'prioridad',Situacion:'situación',Detalle:'detalle'};
 if(value==='Cambio de AltaObservada')return 'Alta de incidencia detectada';
 if(value?.startsWith('Cambio de '))return 'Cambio de '+(fields[value.slice(10)]||value.slice(10));
 return ({Reprogramacion:'Reprogramación','Reprogramacion confirmada':'Reprogramación confirmada'})[value]||tidy(value);
};
export const relationLabel=value=>tidy(value).replace(/segun/gi,'según');
