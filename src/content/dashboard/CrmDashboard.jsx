import React,{useState} from 'react';
import {DataComponent,DataTable,useDataApp,useDashboardTabs} from '../../data-app-public.jsx';
import {STAGES,dayLabel,caseOrder,stageTone} from './crm-data.js';
import {CrmTimeline} from './CrmTimeline.jsx';
import {CrmPendingHome} from './CrmPendingHome.jsx';
import {CrmCaseDialog} from './CrmCaseDialog.jsx';
import {cleanName,priorityLabel,resultLabel,resultTone} from './crm-normalize.js';
import {CrmIcon,CrmFilters} from './CrmControls.jsx';
import './crm.css';
import './crm-polish.css';
import './crm-workspace.css';
const FILTERS=['situacion','etapa','modulo','prioridad','plazoEstado'];
const TABS=[
 {id:'resumen',label:'Pendientes',previousLabels:['Resumen'],filterIds:FILTERS,focusFields:['caso']},
 {id:'etapas',label:'Etapas',filterIds:FILTERS.filter(value=>value!=='etapa'),focusFields:['caso']},
 {id:'plazos',label:'Línea de tiempo',previousLabels:['Plazos'],filterIds:FILTERS,focusFields:['caso']},
 {id:'detalle',label:'Todas las incidencias',previousLabels:['Detalle y evidencias'],filterIds:[],focusFields:['caso']},
];
const Tag=({children,tone='neutral'})=><span className={`crm-tag crm-tag--${tone}`}>{children}</span>;
function CaseCard({row:r,open}){return <button className="crm-case" onClick={()=>open(r.id)} aria-label={`Ver ${r.id}: ${r.asunto}`}><span className="crm-case-top"><strong>{r.id}</strong><Tag tone={resultTone(r)}>{resultLabel(r)}</Tag></span><span className="crm-subject">{r.asunto}</span><span className="crm-meta">{r.modulo} · {cleanName(r.responsable)}</span><span className="crm-case-bottom"><span><CrmIcon name="calendar"/>{r.plazo?`Plazo: ${dayLabel(r.plazo)}`:'Sin plazo documentado'}</span>{r.reprogramada&&<Tag tone="purple">Reprogramada</Tag>}{r.bloqueante&&<Tag tone="red">Bloqueante</Tag>}</span></button>;}
function CasesTable({rows,open}){const columns=[{field:'id',label:'Caso'},{field:'asunto',label:'Incidencia'},{field:'etapa',label:'Etapa'},{field:'situacion',label:'Resultado',renderCell:(v,r)=><Tag tone={resultTone(r)}>{resultLabel(r)}</Tag>},{field:'plazo',label:'Plazo vigente',renderCell:dayLabel},{field:'responsable',label:'Responsable',renderCell:cleanName},{field:'prioridad',label:'Prioridad',renderCell:priorityLabel}];return <div className="crm-records"><DataComponent id="crm-registro" title="Registro de incidencias" queryId="incidencias" kind="table" variant="card" displayRows={rows} sourceRows={rows}><DataTable rows={rows} columns={columns} rowKey="id" onRowSelect={r=>open(r.id)} rowActionLabel={r=>`Abrir ${r.id}`} caption="Selecciona una incidencia para revisar su historia"/></DataComponent></div>;}
function Stages({rows,open}) {
 const [expanded,setExpanded]=useState({});
 return <DataComponent id="crm-tablero" title="Etapa actual de cada incidencia" queryId="incidencias" kind="table" sourceRows={rows} displayRows={rows}>
  <p className="crm-context">Cada columna conserva el estado actual del registro. Abre un caso para revisar su historia y sus evidencias.</p>
  <div className="crm-board" data-reviewed-rows>{STAGES.map(stage=>{
   const items=rows.filter(r=>r.etapa===stage).sort(caseOrder),isExpanded=!!expanded[stage];
   return <section key={stage} className={`crm-lane crm-lane--${stageTone(stage)}`}>
    <div className="crm-lane-title"><h2>{stage}</h2><span aria-label={`${items.length} casos`}>{items.length}</span></div>
    <div className="crm-lane-body">{items.slice(0,isExpanded?items.length:4).map(r=><CaseCard key={r.id} row={r} open={open}/>)}
     {!items.length&&<p className="crm-empty">Sin casos en esta selección.</p>}
     {items.length>4&&<button className="crm-lane-more" aria-expanded={isExpanded} onClick={()=>setExpanded(v=>({...v,[stage]:!v[stage]}))}>{isExpanded?'Mostrar menos':`Ver los ${items.length} casos`}<CrmIcon name="arrow"/></button>}
    </div>
   </section>;
  })}</div>
 </DataComponent>;
}

export function DashboardContent(){
 const {activeTabId}=useDashboardTabs(TABS);
 const {snapshot,queries,filters,setFilter,reviewedRows,viewFocus,setDashboardFocus}=useDataApp();
 const [search,setSearch]=useState(''),[owner,setOwner]=useState('all');
 const all=queries.incidencias?.rows||[],active=activeTabId||'resumen';
 const rows=reviewedRows('incidencias').filter(row=>(owner==='all'||cleanName(row.responsable)===owner)&&(!search||`${row.id} ${row.asunto} ${row.detalle||''}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))));
 const open=id=>{if(id)setDashboardFocus({caso:id});};
 const controls=<CrmFilters definitions={(snapshot.filters||[]).filter(filter=>active!=='etapas'||filter.id!=='etapa')} cases={all} values={filters} onChange={setFilter} search={search} setSearch={setSearch} owner={owner} setOwner={setOwner}/>;
 return <article className="crm-page">
  {active==='resumen'?<CrmPendingHome rows={rows} queries={queries} cutoff={snapshot.crm.corte} open={open} controls={controls}/>:<>
   <div className="crm-cutoff crm-cutoff--compact"><div><span className="crm-source-icon"><CrmIcon name="calendar"/></span><div className="crm-source-label"><span>Corte del registro</span><strong>{dayLabel(snapshot.crm.corte)}</strong><small>Última lectura · {snapshot.crm.lectura.slice(11,16)}, Lima</small></div></div><Tag><CrmIcon name="clock"/>Solo consulta · actualización a solicitud</Tag></div>
   {active!=='detalle'&&controls}
   {active!=='detalle'&&<p className="crm-results" aria-live="polite">{rows.length} de {all.length} incidencias</p>}
   {active==='etapas'&&<Stages rows={rows} open={open}/>}
   {active==='plazos'&&<CrmTimeline rows={rows} queries={queries} open={open} cutoff={snapshot.crm.corte}/>}
   {active==='detalle'&&<><div className="crm-lookup-heading"><h1>El registro completo.</h1><p>Consulta las incidencias abiertas y cumplidas. Selecciona una fila para revisar el caso en una ventana.</p></div><label className="crm-case-picker">Ir a una incidencia<select aria-label="Seleccionar incidencia" value={viewFocus?.caso||''} onChange={event=>open(event.target.value)}><option value="">Selecciona un caso</option>{all.map(row=><option key={row.id} value={row.id}>{row.id} · {row.asunto}</option>)}</select></label><CasesTable rows={[...all].sort(caseOrder)} open={open}/></>}
  </>}
  <footer className="crm-footer"><span>Última lectura del registro: {dayLabel(snapshot.crm.lectura)} · {snapshot.crm.lectura.slice(11,16)}, Lima.</span><span>Solo consulta · los datos se actualizan a solicitud.</span></footer>
  <CrmCaseDialog cases={all} queries={queries} selected={viewFocus?.caso} open={open} cutoff={snapshot.crm.corte} onClose={()=>setDashboardFocus({})}/>
 </article>;
}
