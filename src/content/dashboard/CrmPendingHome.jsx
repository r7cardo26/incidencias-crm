import React,{useState} from 'react';
import {DataComponent,DataTable} from '../../data-app-public.jsx';
import {dayLabel,caseOrder,stageTone} from './crm-data.js';
import {cleanName,priorityLabel,resultTone,stageLabel,moduleLabel,typeLabel,deadlineLabel} from './crm-normalize.js';
import {CrmIcon} from './CrmControls.jsx';
const VIEWS=[['abiertas','Abiertos',row=>!row.cumplida],['cumplidas','Cerrados',row=>row.cumplida],['todas','Todos',()=>true]];
const QUEUES=[['todas','Todos',()=>true],['vencidas','Plazo vencido',row=>!row.cumplida&&row.plazoEstado==='Vencida'],['bloqueantes','Bloqueantes',row=>!row.cumplida&&row.bloqueante],['sin-plazo','Sin plazo',row=>!row.cumplida&&!row.plazo],['reprogramadas','Reprogramados',row=>row.reprogramada]];
export function CrmPendingHome({rows,queries,cutoff,readAt,open,controls}){
 const [scope,setScope]=useState('abiertas'),[queue,setQueue]=useState('todas');
 const setView=value=>{setScope(value);setQueue('todas');};
 const opened=rows.filter(row=>!row.cumplida),closed=rows.filter(row=>row.cumplida);
 const base=rows.filter(VIEWS.find(item=>item[0]===scope)[2]);
 const visible=base.filter(QUEUES.find(item=>item[0]===queue)[2]).sort(caseOrder);
 const photoCount=id=>(queries.evidencias?.rows||[]).filter(row=>row.caso===id).length;
 const tableRows=visible.map(row=>({...row,fotosDisponibles:photoCount(row.id)}));
 const columns=[
  {field:'asunto',label:'Incidencia',renderCell:(value,row)=><div className="crm-queue-subject"><span>{row.id}<small>{typeLabel(row.tipo)}</small></span><strong>{value}</strong><small>{moduleLabel(row.modulo)}</small></div>},
  {field:'etapaCategoria',label:'Etapa',renderCell:(value,row)=><span title={`Valor original: ${row.etapa||'(vacío)'}`} className={`crm-tag crm-tag--${stageTone(value)}`}>{stageLabel(value)}</span>},
  {field:'prioridadCategoria',label:'Prioridad',renderCell:(value,row)=><div className="crm-console-priority"><strong className={value==='Crítica'?'crm-result-text--red':''}>{priorityLabel(value)}</strong>{row.bloqueante&&<small className="crm-blocking"><CrmIcon name="alert"/>Bloqueante</small>}</div>},
  {field:'responsableCategoria',label:'Responsable',renderCell:(value,row)=><span className="crm-queue-owner" title={`Valor original: ${row.responsable||'(vacío)'}`}>{cleanName(value)}</span>},
  {field:'plazo',label:'Plazo al corte',renderCell:(value,row)=><div className="crm-queue-date"><strong>{value?dayLabel(value):'Sin fecha'}</strong><small className={`crm-result-text--${resultTone(row)}`}>{deadlineLabel(row.plazoEstado)}</small>{row.reprogramada&&<small>Reprogramado</small>}</div>},
  {field:'fotosDisponibles',label:'Fotos',renderCell:value=><span className="crm-console-photo-count"><CrmIcon name="image"/>{value}</span>},
 ];
 const expired=opened.filter(row=>row.plazoEstado==='Vencida').length,undated=opened.filter(row=>!row.plazo).length,percentage=rows.length?Math.round(closed.length/rows.length*100):0;
 return <div className="crm-console">
  <div className="crm-console-heading"><div><span className="crm-eyebrow">CONTROL DEL CRM</span><h1>Incidencias y seguimiento</h1><p>Las categorías del registro, con los compromisos y evidencias a un clic.</p></div><div className="crm-console-freshness"><span><i/>Lectura verificada</span><strong>{dayLabel(cutoff)} · {readAt?.slice(11,16)}, Lima</strong><small>{rows.length} registros en la selección</small></div></div>
  <div className="crm-console-metrics">{[
   ['crm-abiertas','Abiertos',opened.length,'blue',()=>setView('abiertas'),`${closed.length} cerrados en la selección`],
   ['crm-vencidas','Plazos vencidos',expired,'white',()=>{setScope('abiertas');setQueue('vencidas');},'Cálculo al corte del registro'],
   ['crm-sin-plazo','Abiertos sin plazo',undated,'white',()=>{setScope('abiertas');setQueue('sin-plazo');},'Compromiso pendiente de definir'],
   ['crm-cumplimiento','Cumplimiento',`${percentage}%`,'lime',()=>setView('cumplidas'),`${closed.length} de ${rows.length} · Cerrado = cumplida`],
  ].map(([id,title,value,tone,action,note])=><div key={id} className={`crm-console-metric crm-console-metric--${tone}`}><DataComponent id={id} title={title} queryId="incidencias" kind="metrics" variant="card" sourceRows={rows} displayRows={rows}><button onClick={action} aria-label={`Ver ${title.toLowerCase()}`}><strong>{value}</strong><span>{note}</span><CrmIcon name="arrow"/></button></DataComponent></div>)}</div>
  <div className="crm-console-layout"><aside>{controls}</aside><div className="crm-console-main">
   <div className="crm-console-view-heading"><div><h2>Registro de incidencias</h2><p>Orden: bloqueante, prioridad del Sheets y plazo.</p></div><div className="crm-console-source-tabs" role="group" aria-label="Situación del registro">{VIEWS.map(([id,label,filter])=><button key={id} aria-pressed={scope===id} onClick={()=>setView(id)}>{label}<span>{rows.filter(filter).length}</span></button>)}</div></div>
   <div className="crm-console-followup"><span>Seguimiento</span><div role="group" aria-label="Filtros de seguimiento calculado">{QUEUES.map(([id,label,filter])=><button key={id} aria-pressed={queue===id} onClick={()=>setQueue(id)}>{label}<span>{base.filter(filter).length}</span></button>)}</div></div>
   <div className="crm-queue-table"><DataComponent id="crm-registro" title={`${VIEWS.find(item=>item[0]===scope)[1]} · ${visible.length} incidencias`} queryId="incidencias" kind="table" variant="card" sourceRows={visible} displayRows={tableRows}><DataTable key={`${scope}:${queue}:${visible.map(row=>row.id).join(',')}`} rows={tableRows} columns={columns} searchable={false} rowKey="id" onRowSelect={row=>open(row.id)} rowActionLabel={row=>`Abrir ${row.id}: ${row.asunto}`} caption="Abre una incidencia para revisar su ficha, línea de tiempo y fotos"/>{!visible.length&&<p className="crm-empty">No hay casos en esta selección. Prueba otra situación o limpia los filtros.</p>}</DataComponent></div>
   <details className="crm-normalization"><summary>Qué se normalizó y qué conserva el Sheets</summary><p>Tipo, etapa, prioridad y bloqueo respetan las categorías del registro. Se unifican espacios, variantes de escritura y responsables compartidos equivalentes. «Unificado en #11» se agrupa como «Unificado», conservando la referencia original. «—» sigue siendo la prioridad sin dato. Las variantes vacías de responsable se agrupan en «Por asignar», que ya existe en el registro.</p><p>El plazo calculado no es la alerta del Sheets: esta puede excluir casos por validar o con solución informada. Los filtros muestran ambos por separado. Ninguna normalización cambia el archivo original.</p></details>
  </div></div>
 </div>;
}
