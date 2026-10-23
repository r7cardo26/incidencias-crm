import React, {useState} from 'react';
import {cleanName,optionLabel,categoryOrder} from './crm-normalize.js';

const PATHS = {
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2"/></>,
  check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  alert: <><path d="m10.3 4-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 7a7 7 0 0 1 11.6-2L20 8M4 16l2.3 3A7 7 0 0 0 18 17"/></>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></>,
  arrow: <><path d="M5 12h14m-5-5 5 5-5 5"/></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
  message: <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3Z"/>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
};

export function CrmIcon({name, className=''}) {
  return <svg className={`crm-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{PATHS[name]||PATHS.folder}</svg>;
}

export function CrmFilters({definitions, cases, values, onChange, search, setSearch, owner, setOwner,sidebar=false}) {
  const [expanded,setExpanded]=useState(false);
  const activeCount=definitions.filter(d=>values[d.id]&&values[d.id]!=='all').length+(owner!=='all'?1:0);
  const reset=()=>{definitions.forEach(d=>onChange(d.id,'all'));setOwner('all');setSearch('');};
  const renderField=d=><label key={d.id} className="crm-option-field"><span>{d.label}</span><select aria-label={d.label} title={!values[d.id]||values[d.id]==='all'?'Todos':optionLabel(d.id,values[d.id])} value={values[d.id]||'all'} onChange={e=>onChange(d.id,e.target.value)}><option value="all">Todos</option>{[...new Set(cases.map(row=>row[d.field]).filter(value=>value!==null&&value!==undefined))].sort((a,b)=>categoryOrder(d.id,a)-categoryOrder(d.id,b)||String(a).localeCompare(String(b),'es')).map(value=><option key={value} value={value}>{optionLabel(d.id,value)}</option>)}</select></label>;
  return <div className={`crm-filter-panel ${sidebar?'crm-filter-sidebar':''}`} aria-label="Filtros del registro">
    {sidebar&&<div className="crm-filter-sidebar-heading"><CrmIcon name="filter"/><strong>Filtrar registro</strong><span>{activeCount}</span></div>}
    <div className="crm-filter-primary">
      <label className="crm-search-field"><CrmIcon name="search"/><span className="crm-sr-only">Buscar caso o incidencia</span><input type="search" aria-label="Buscar caso o incidencia" placeholder="Buscar incidencia…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
      <label className="crm-responsible-field"><span>Responsable</span><select aria-label="Filtrar responsable" value={owner} onChange={e=>setOwner(e.target.value)}><option value="all">Todos los responsables</option>{[...new Set(cases.map(r=>cleanName(r.responsable)))].sort().map(v=><option key={v} value={v}>{v}</option>)}</select></label>
      {!sidebar&&<button className={`crm-filter-toggle ${expanded?'is-active':''}`} aria-expanded={expanded} aria-controls="crm-filter-options" onClick={()=>setExpanded(v=>!v)}><CrmIcon name="filter"/><span>Filtros</span>{activeCount>0&&<span className="crm-filter-count">{activeCount}</span>}<span className="crm-chevron" aria-hidden="true">{expanded?'−':'+'}</span></button>}
      {(activeCount>0||search)&&<button className="crm-clear-filter" onClick={reset}><CrmIcon name="close"/><span>Limpiar</span></button>}
    </div>
    {(expanded||sidebar)&&<div className="crm-filter-options crm-categorized-options" id="crm-filter-options"><section><h3>Categorías del Sheets</h3><div>{definitions.filter(d=>d.group!=='calculated').map(renderField)}</div></section><section><h3>Seguimiento calculado</h3><div>{definitions.filter(d=>d.group==='calculated').map(renderField)}</div><p>El plazo se calcula al corte. No sustituye la alerta ni la etapa del Sheets.</p></section></div>}
  </div>;
}
