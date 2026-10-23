import React,{useState} from 'react';
import {DataComponent,DataTable} from '../../data-app-public.jsx';
import {dayLabel,caseOrder} from './crm-data.js';
import {cleanName,priorityLabel,resultLabel,resultTone} from './crm-normalize.js';
import {CrmIcon} from './CrmControls.jsx';

const isOpen=row=>!row.cumplida;
const SCOPES=[
 ['abiertas','Pendientes',isOpen],
 ['vencidas','Vencidas',row=>isOpen(row)&&row.plazoEstado==='Vencida'],
 ['bloqueantes','Bloqueantes',row=>isOpen(row)&&row.bloqueante],
 ['sin-plazo','Sin plazo',row=>isOpen(row)&&!row.plazo],
 ['validar','Por validar',row=>isOpen(row)&&row.etapa==='Por validar'],
 ['reprogramadas','Reprogramadas',row=>isOpen(row)&&row.reprogramada],
 ['cumplidas','Cumplidas',row=>row.cumplida],
 ['todas','Todas',()=>true],
];

export function CrmPendingHome({rows,queries,cutoff,open,controls}){
 const [scope,setScope]=useState('abiertas');
 const count=key=>rows.filter(SCOPES.find(item=>item[0]===key)[2]).length;
 const selected=SCOPES.find(item=>item[0]===scope);
 const visible=rows.filter(selected[2]).sort(caseOrder);
 const completed=count('cumplidas'),percentage=rows.length?Math.round(completed/rows.length*100):0;
 const photoCount=id=>(queries.evidencias?.rows||[]).filter(row=>row.caso===id).length;
 const columns=[
  {field:'asunto',label:'Incidencia',renderCell:(value,row)=><div className="crm-queue-subject"><span>{row.id}<small>{row.modulo}</small></span><strong>{value}</strong></div>},
  {field:'etapa',label:'Estado y etapa',renderCell:(value,row)=><div className="crm-queue-state"><span className={`crm-tag crm-tag--${resultTone(row)}`}>{resultLabel(row)}</span><span>{value}</span></div>},
  {field:'responsable',label:'Responsable',renderCell:value=><span className="crm-queue-owner">{cleanName(value)}</span>},
  {field:'plazo',label:'Compromiso',renderCell:(value,row)=><div className="crm-queue-date"><strong>{value?dayLabel(value):'Sin plazo'}</strong>{!row.cumplida&&value&&value<cutoff&&<small className="crm-result-text--red">{Math.round((Date.parse(cutoff)-Date.parse(value))/86400000)} {Math.round((Date.parse(cutoff)-Date.parse(value))/86400000)===1?'día':'días'} al corte</small>}{row.reprogramada&&<small className="crm-result-text--blue">Reprogramado</small>}</div>},
  {field:'prioridad',label:'Prioridad y evidencia',renderCell:(value,row)=><div className="crm-queue-signals"><span className={row.bloqueante?'crm-blocking':''}>{row.bloqueante&&<CrmIcon name="alert"/>}{row.bloqueante?'Bloqueante':priorityLabel(value)}</span><span className="crm-queue-photos"><CrmIcon name="image"/>{photoCount(row.id)} {photoCount(row.id)===1?'foto':'fotos'}</span></div>},
 ];
 return <>
  <div className="crm-workspace-heading"><div><span className="crm-eyebrow">SEGUIMIENTO DEL CRM</span><h1>Lo que necesita atención.</h1><p>Revisa los pendientes y abre un caso para ver qué falta, su historia y sus evidencias.</p></div><span className="crm-workspace-stamp"><CrmIcon name="calendar"/>Corte · {dayLabel(cutoff)}</span></div>
  <div className="crm-overview-grid">
   <div className="crm-overview-blue"><DataComponent id="crm-abiertas" title="Pendientes abiertos" queryId="incidencias" kind="metrics" variant="card" sourceRows={rows} displayRows={rows}><button className="crm-overview-action" onClick={()=>setScope('abiertas')} aria-label="Mostrar pendientes abiertos"><span className="crm-overview-value">{count('abiertas')}<span className="crm-round-arrow"><CrmIcon name="arrow"/></span></span><span className="crm-overview-caption">incidencias por resolver</span><span className="crm-overview-foot"><i/>{count('bloqueantes')} bloqueantes · {count('validar')} por validar</span></button></DataComponent></div>
   <div className="crm-overview-lime"><DataComponent id="crm-vencidas" title="Vencidas al corte" queryId="incidencias" kind="metrics" variant="card" sourceRows={rows} displayRows={rows}><button className="crm-overview-action" onClick={()=>setScope('vencidas')} aria-label="Mostrar pendientes vencidos"><span className="crm-overview-value">{count('vencidas')}<span className="crm-round-arrow"><CrmIcon name="arrow"/></span></span><span className="crm-overview-caption">requieren revisar el compromiso</span><span className="crm-overview-foot"><CrmIcon name="clock"/>Evaluadas al {dayLabel(cutoff)}</span></button></DataComponent></div>
   <DataComponent id="crm-cumplimiento" title="Cumplimiento del registro" queryId="incidencias" kind="metrics" variant="card" sourceRows={rows} displayRows={rows}><button className="crm-overview-action crm-overview-completed" onClick={()=>setScope('cumplidas')} aria-label="Mostrar incidencias cumplidas"><span className="crm-overview-value">{percentage}<small>%</small><span className="crm-progress-caption">{completed} de {rows.length}<small>cumplidas</small></span></span><span className="crm-overview-meter" role="meter" aria-label="Porcentaje de incidencias cumplidas" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${percentage}%`}}/></span><span className="crm-overview-foot">Cerrado en el registro = Cumplida<CrmIcon name="arrow"/></span></button></DataComponent>
  </div>
  <div className="crm-queue-heading"><div><h2>Tu mesa de seguimiento</h2><p>Bloqueantes primero; después, vencimiento y prioridad documentada.</p></div><span>{visible.length} {visible.length===1?'incidencia':'incidencias'} en esta vista</span></div>
  {controls}
  <div className="crm-queue-scopes" role="group" aria-label="Vistas rápidas de incidencias">{SCOPES.map(([key,label])=><button key={key} aria-pressed={scope===key} onClick={()=>setScope(key)}>{label}<span>{count(key)}</span></button>)}</div>
  <div className="crm-queue-table"><DataComponent id="crm-registro" title={scope==='abiertas'?'Pendientes por atender':selected[1]} queryId="incidencias" kind="table" variant="card" sourceRows={visible} displayRows={visible}><DataTable key={`${scope}:${visible.map(row=>row.id).join(',')}`} rows={visible} columns={columns} searchable={false} rowKey="id" onRowSelect={row=>open(row.id)} rowActionLabel={row=>`Abrir ${row.id}: ${row.asunto}`} caption="Selecciona una fila para abrir el detalle sin perder esta lista"/>{!visible.length&&<p className="crm-empty">No hay incidencias en esta selección. Cambia la vista o limpia los filtros.</p>}</DataComponent></div>
  <p className="crm-workspace-note"><CrmIcon name="folder"/>Las vistas rápidas se superponen: un caso puede estar vencido y ser bloqueante. Las cifras responden a los filtros de búsqueda y responsable.</p>
 </>;
}
