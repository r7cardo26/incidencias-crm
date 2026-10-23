import React,{useState} from 'react';
import {DataComponent} from '../../data-app-public.jsx';
import {dayLabel,caseOrder} from './crm-data.js';
import {cleanName,resultLabel,resultTone,eventLabel,stageLabel} from './crm-normalize.js';
import './crm-timeline.css';

const day=value=>/^\d{4}-\d{2}-\d{2}/.test(value||'')?value.slice(0,10):null;
const stamp=value=>Date.parse(`${value}T00:00:00Z`);
const milestones=row=>[
 {key:'ingreso',date:day(row.ingreso),label:'Ingreso',shape:'circle'},
 {key:'original',date:day(row.plazoOriginal),label:'Plazo original',shape:'diamond'},
 {key:'vigente',date:day(row.plazo),label:'Plazo vigente',shape:'square'},
 {key:'solucion',date:day(row.solucion),label:'Solución informada',shape:'check'},
].filter(item=>item.date);

export function CrmTimeline({rows,queries,cutoff,open}){
 const [mode,setMode]=useState('casos'),[kind,setKind]=useState('all'),[expanded,setExpanded]=useState(false);
 const ids=new Set(rows.map(row=>row.id));
 const facts=(queries.cronologia?.rows||[]).filter(event=>ids.has(event.caso));
 const types=[...new Set(facts.map(event=>eventLabel(event.tipo)))].sort();
 const filtered=facts.filter(event=>kind==='all'||eventLabel(event.tipo)===kind);
 const dated=filtered.filter(event=>day(event.fechaOrden)).sort((a,b)=>a.fechaOrden.localeCompare(b.fechaOrden)||a.caso.localeCompare(b.caso));
 const undated=filtered.filter(event=>!day(event.fechaOrden));
 const groups=dated.reduce((out,event)=>{const key=day(event.fechaOrden);(out[key]??=[]).push(event);return out;},{});
 const dates=[cutoff,...rows.flatMap(row=>milestones(row).map(item=>item.date))].filter(Boolean).sort();
 const first=dates[0],last=dates[dates.length-1],range=Math.max(6*86400000,stamp(last)-stamp(first));
 const position=date=>4+92*(stamp(date)-stamp(first))/range;
 const ticks=Array.from({length:7},(_,index)=>new Date(stamp(first)+range*index/6).toISOString().slice(0,10));
 const ordered=[...rows].sort(caseOrder);
 const shown=expanded?ordered:ordered.slice(0,16);
 const Event=({event})=>{const row=rows.find(item=>item.id===event.caso);return <li className="crm-history-event"><div><button className="crm-link" onClick={()=>open(event.caso)}>{event.caso} · {row?.asunto}</button><span className={`crm-tag crm-tag--${resultTone(row)}`}>{resultLabel(row)} · estado al corte</span></div><h3>{eventLabel(event.tipo)}</h3><p>{event.descripcion||'Sin descripción documentada.'}</p><small>{event.tipoFecha} · {event.vinculo}</small></li>;};
 if(!rows.length)return <DataComponent id="crm-linea-general" title="Línea de tiempo" queryId="incidencias" kind="table" variant="card" sourceRows={rows} displayRows={rows}><p className="crm-empty">No hay incidencias en esta selección. Limpia la búsqueda o cambia los filtros para ver la línea de tiempo.</p></DataComponent>;
 return <>
  <div className="crm-time-toolbar"><div className="crm-time-switch" role="group" aria-label="Vista de línea de tiempo"><button aria-pressed={mode==='casos'} onClick={()=>setMode('casos')}>Por incidencia</button><button aria-pressed={mode==='hechos'} onClick={()=>setMode('hechos')}>Hechos por fecha</button></div>{mode==='hechos'&&<label>Tipo de hecho<select aria-label="Tipo de hecho" value={kind} onChange={event=>setKind(event.target.value)}><option value="all">Todos los hechos</option>{types.map(type=><option key={type}>{type}</option>)}</select></label>}</div>
  {mode==='casos'?<DataComponent id="crm-linea-general" title="Ingreso, compromisos y solución por incidencia" queryId="incidencias" kind="table" variant="card" sourceRows={rows} displayRows={rows}>
   <p className="crm-context">Compara las fechas documentadas de cada caso. El tramo representa el intervalo entre fechas conocidas, sin implicar trabajo continuo. La solución informada y el cierre son datos distintos; el estado se evalúa al {dayLabel(cutoff)}.</p>
   <div className="crm-milestone-legend">{[{shape:'circle',label:'Ingreso'},{shape:'diamond',label:'Plazo original'},{shape:'square',label:'Plazo vigente'},{shape:'check',label:'Solución informada'}].map(item=><span key={item.shape}><i className={`crm-milestone crm-milestone--${item.shape}`}/>{item.label}</span>)}<span><i className="crm-cutoff-legend"/>Corte del registro</span></div>
   <p className="crm-time-hint">Desplaza horizontalmente para recorrer las fechas. Selecciona un caso para ver sus hechos y evidencias.</p>
   <div className="crm-time-scroll" tabIndex={0} role="region" aria-label="Línea de tiempo por incidencia, desplazable horizontalmente"><div className="crm-time-matrix" data-reviewed-rows>
    <div className="crm-time-axis"><strong>Incidencia y resultado</strong><div>{ticks.map((date,index)=><span key={index} style={{left:`${position(date)}%`}}>{dayLabel(date)}</span>)}</div></div>
    {shown.map(row=>{const marks=milestones(row),sorted=marks.map(item=>item.date).sort();return <div className="crm-time-row" key={row.id}><button className="crm-time-case" onClick={()=>open(row.id)}><strong>{row.id} · {row.asunto}</strong><span className={`crm-result-text crm-result-text--${resultTone(row)}`}>{resultLabel(row)}</span><small>{stageLabel(row.etapa)} · {cleanName(row.responsable)}{row.reprogramada?' · Reprogramada':''}</small></button><div className="crm-time-track" aria-label={`Fechas de ${row.id}`}><span className="crm-time-cut" style={{left:`${position(cutoff)}%`}}/><span className="crm-time-span" style={{left:`${position(sorted[0]||cutoff)}%`,width:`${marks.length?position(sorted[sorted.length-1])-position(sorted[0]):0}%`}}/>{!marks.length&&<span className="crm-time-no-date">Sin fechas documentadas</span>}{[...new Set(marks.map(item=>item.date))].map(date=>{const same=marks.filter(item=>item.date===date),label=`${row.id} · ${same.map(item=>item.label).join(' y ')}: ${dayLabel(date)}`;return <button key={date} className="crm-time-point" style={{left:`${position(date)}%`,top:'24px'}} onClick={()=>open(row.id)} title={label} aria-label={`${label}. Abrir detalle`}>{same.map(item=><i key={item.key} className={`crm-milestone crm-milestone--${item.shape}`}/>)}</button>;})}</div></div>;})}
   </div></div>
   {ordered.length>16&&<button className="crm-lane-more" onClick={()=>setExpanded(value=>!value)} aria-expanded={expanded}>{expanded?'Mostrar 16 incidencias':`Ver las ${ordered.length} incidencias`}</button>}
   {!rows.length&&<p className="crm-empty">No hay incidencias en esta selección.</p>}
   <details className="crm-normalization"><summary>Criterios de normalización</summary><p>La situación conserva las categorías Abierto y Cerrado del Sheets; Cerrado cuenta como cumplida. Etapa, tipo y prioridad siguen su catálogo. El plazo calculado distingue vencido, vence al corte, en plazo y sin plazo. La reprogramación es una condición adicional. Las variantes de «Alex» se unifican y los responsables vacíos se agrupan en «Por asignar». Los valores y textos originales permanecen consultables en cada ficha.</p></details>
  </DataComponent>:<DataComponent id="crm-hechos-general" title={`Historia del registro · ${filtered.length} hechos`} queryId="cronologia" kind="table" variant="card" sourceRows={filtered} displayRows={filtered}>
   <p className="crm-context">Hechos ordenados por fecha documental o de incorporación local, según la etiqueta de cada evento. Los hechos sin fecha aparecen al final. La fecha de un compromiso es un vencimiento, no la fecha del acuerdo.</p>
   <div className="crm-daily-history" data-reviewed-rows>{Object.entries(groups).map(([date,events])=><section key={date}><div className="crm-history-date"><time dateTime={date}>{dayLabel(date)}</time><span>{events.length} {events.length===1?'hecho':'hechos'}</span></div><ol>{events.map(event=><Event key={event.id} event={event}/>)}</ol></section>)}{undated.length>0&&<section><div className="crm-history-date"><strong>Sin fecha documentada</strong><span>{undated.length} {undated.length===1?'hecho':'hechos'}</span></div><ol>{undated.map(event=><Event key={event.id} event={event}/>)}</ol></section>}{!filtered.length&&<p className="crm-empty">No hay hechos documentados en esta selección.</p>}</div>
  </DataComponent>}
 </>;
}
