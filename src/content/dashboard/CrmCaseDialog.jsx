import React,{useEffect,useState} from 'react';
import {DataComponent,Dialog,Tabs,TabPanel} from '../../data-app-public.jsx';
import {dayLabel,stageTone,fieldLabel} from './crm-data.js';
import {cleanName,priorityLabel,resultLabel,resultTone,eventLabel,stageLabel,moduleLabel,typeLabel,deadlineLabel,relationLabel} from './crm-normalize.js';
import {CrmIcon} from './CrmControls.jsx';

const Tag=({children,tone='neutral'})=><span className={`crm-tag crm-tag--${tone}`}>{children}</span>;

export function CrmCaseDialog({cases,queries,selected,open,onClose,cutoff}){
 const [tab,setTab]=useState('resumen'),[photo,setPhoto]=useState(null);
 useEffect(()=>{setTab('resumen');setPhoto(null);},[selected]);
 const row=cases.find(item=>item.id===selected);
 const relatedRows=query=>(queries[query]?.rows||[]).filter(item=>item.caso===selected);
 const versions=relatedRows('compromisos').sort((a,b)=>(a.orden||0)-(b.orden||0));
 const history=relatedRows('cronologia').sort((a,b)=>(a.fechaOrden||'9999').localeCompare(b.fechaOrden||'9999'));
 const photos=relatedRows('evidencias').sort((a,b)=>(a.dispositivo==='PC'?0:1)-(b.dispositivo==='PC'?0:1));
 const relations=relatedRows('relaciones'),pending=relatedRows('pendientes');
 const groups=photos.reduce((out,item)=>{(out[item.comparacion]??=[]).push(item);return out;},{});
 const sections=[{id:'resumen',label:'Resumen'},{id:'historia',label:`Línea de tiempo · ${history.length}`},{id:'evidencias',label:`Fotos · ${photos.length}`}];
 return <>
  <Dialog open={!!row} onClose={onClose} title={row?`${row.id} · ${row.asunto}`:'Detalle de incidencia'} expanded className="crm-case-dialog" initialFocusSelector=".dialog-header">
   {row&&<div className="crm-page crm-modal-body">
    <div className="crm-modal-status" data-reviewed-rows><Tag tone={row.cumplida?'green':'blue'}>{row.situacion}</Tag><Tag tone={stageTone(row.etapa)}>{stageLabel(row.etapa)}</Tag>{!row.cumplida&&<Tag tone={resultTone(row)}>{deadlineLabel(row.plazoEstado)}</Tag>}{row.bloqueante&&<Tag tone="red">Bloqueante</Tag>}{row.reprogramada&&<Tag tone="purple">Reprogramación confirmada</Tag>}<span className="crm-modal-cutoff">Evaluación al {dayLabel(cutoff)}</span></div>
    <dl className="crm-modal-facts" data-reviewed-rows>{[['Responsable',cleanName(row.responsable)],['Plazo vigente',row.plazo?dayLabel(row.plazo):'Sin plazo documentado'],['Prioridad',priorityLabel(row.prioridad)],['Módulo',moduleLabel(row.modulo)],['Tipo',typeLabel(row.tipo)],['Alerta en Sheets',row.alertaFuente||'Sin alerta']].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <Tabs id="crm-case-sections" label="Contenido de la incidencia" items={sections} value={tab} onChange={setTab}/>
    <TabPanel tabsId="crm-case-sections" tabId="resumen" active={tab==='resumen'}>
     <DataComponent id="crm-ficha" title="Qué se necesita resolver" queryId="incidencias" kind="table" sourceRows={[row]} displayRows={[row]}>
      <div className="crm-modal-primary-action" data-reviewed-rows><h3>ACCIÓN SOLICITADA</h3><p>{row.accion||'Sin acción documentada.'}</p></div>
      <div className="crm-modal-columns" data-reviewed-rows><section className="crm-modal-section"><h3>Incidencia registrada</h3><p>{row.detalle||row.asunto}</p></section><section className="crm-modal-section"><h3>Comentario de soporte</h3><p>{row.soporte||'Sin comentario documentado.'}</p></section></div>
      <details className="crm-modal-disclosure"><summary>Valores originales del registro</summary><p className="crm-modal-note" data-reviewed-rows>Etapa: {row.etapa||'(vacío)'} · Prioridad: {row.prioridad||'(vacío)'} · Responsable: {row.responsable||'(vacío)'} · Tipo: {row.tipo||'(vacío)'} · Módulo: {row.modulo||'(vacío)'}</p></details>
      <p className="crm-modal-note" data-reviewed-rows>Ingreso: {dayLabel(row.ingreso)} · Solución informada: {dayLabel(row.solucion)}{row.cumplida&&!row.solucion?' · El registro está cerrado; no consta la fecha de solución.':''}{!row.cumplida&&row.solucion?' · La solución informada no implica que el registro esté cerrado.':''}</p>
     </DataComponent>
     <DataComponent id="crm-versiones" title="Compromisos del caso" queryId="compromisos" kind="table" sourceRows={versions} displayRows={versions}>
      <div className="crm-deadline-summary" data-reviewed-rows><div><span>Primer plazo documentado</span><strong>{dayLabel(row.plazoOriginal)}</strong></div><div><span>Plazo vigente</span><strong>{dayLabel(row.plazo)}</strong></div>{row.reprogramada&&<Tag tone="purple">Conserva el plazo original</Tag>}</div>
      {versions.length>0?<details className="crm-modal-disclosure"><summary>Ver {versions.length} {versions.length===1?'versión documentada':'versiones documentadas'}</summary><ol className="crm-versions" data-reviewed-rows>{versions.map(item=><li key={item.id}><span className="crm-version-number">{item.orden}</span><div><div className="crm-version-heading"><strong>{item.plazo?dayLabel(item.plazo):'Fecha pendiente de interpretación'}</strong><Tag tone={item.vigente?'blue':'neutral'}>{item.vigente===true?'Vigente':item.vigente===false?'Anterior':'Pendiente de interpretación'}</Tag></div><p>{item.texto||item.interpretacion}</p><small>{item.interpretacion}</small><small>Fecha del acuerdo: {dayLabel(item.acuerdo)}</small></div></li>)}</ol></details>:<p className="crm-modal-note">No hay versiones de compromiso documentadas.</p>}
      {row.reprogramada&&<p className="crm-modal-note">La reprogramación está confirmada. No constan fecha del acuerdo, motivo ni autor; se conserva el plazo anterior.</p>}
      {!row.plazo&&row.compromisoTexto&&<p className="crm-note" data-reviewed-rows>Compromiso por aclarar: {row.compromisoTexto}</p>}
     </DataComponent>
     {relations.length>0&&<div className="crm-modal-related"><DataComponent id="crm-relaciones" title="Casos relacionados" queryId="relaciones" kind="table" sourceRows={relations} displayRows={relations}><div data-reviewed-rows>{relations.map((item,index)=><button key={index} onClick={()=>open(item.relacionado)} disabled={!cases.some(candidate=>candidate.id===item.relacionado)} title={relationLabel(item.tipo)}>{item.relacionado||'Referencia sin caso identificado'} ↗</button>)}</div></DataComponent></div>}
     {pending.length>0&&<details className="crm-modal-disclosure"><summary>Datos pendientes de aclaración · {pending.length}</summary><DataComponent id="crm-aclaraciones" title="Aclaraciones documentadas" queryId="pendientes" kind="table" sourceRows={pending} displayRows={pending}><ul data-reviewed-rows>{pending.map(item=><li key={item.id}><strong>{fieldLabel(item.campo)}</strong> · {item.accion}</li>)}</ul></DataComponent></details>}
    </TabPanel>
    <TabPanel tabsId="crm-case-sections" tabId="historia" active={tab==='historia'}>
     <DataComponent id="crm-historia" title="Hechos documentados" queryId="cronologia" kind="table" sourceRows={history} displayRows={history}><p className="crm-context">Se distingue la fecha del hecho de su incorporación local. No existe un historial completo de los cambios de etapa anteriores.</p><ol className="crm-timeline" data-reviewed-rows>{history.map(event=><li key={event.id}><div className="crm-event-dot"><CrmIcon name={event.tipo==='Evidencia incorporada'?'image':event.tipo.toLowerCase().includes('reprogram')?'refresh':'message'}/></div><div className="crm-event-date"><strong>{dayLabel(event.fechaOrden)}</strong><span>{event.tipoFecha}</span></div><h3>{eventLabel(event.tipo)}</h3><p>{event.descripcion||'Sin descripción documentada.'}</p><small>{event.vinculo}</small>{photos.some(item=>item.id===event.referencia)&&<button className="crm-link" onClick={()=>setPhoto(photos.find(item=>item.id===event.referencia))}>Ver evidencia ↗</button>}</li>)}</ol>{!history.length&&<p className="crm-empty">No hay hechos documentados para este caso.</p>}</DataComponent>
    </TabPanel>
    <TabPanel tabsId="crm-case-sections" tabId="evidencias" active={tab==='evidencias'}>
     <div className="crm-modal-evidence"><DataComponent id="crm-evidencias" title="Fotografías del caso" queryId="evidencias" kind="table" sourceRows={photos} displayRows={photos}>
      {!photos.length&&<p className="crm-empty">No hay fotografías incorporadas. Esto no determina el cumplimiento del caso.</p>}
      {Object.entries(groups).map(([group,items])=><section className="crm-photo-group" key={group}><h3>{group.startsWith(`${row.id}_`)?`Comprobación ${group.slice(row.id.length+1)}`:group}</h3><div className={`crm-photo-pair ${items.length===1?'is-single':''}`} data-reviewed-rows>{items.map(item=><figure key={item.id}><button className="crm-photo-button" aria-label={`Ampliar ${item.id}, ${item.dispositivo}`} onClick={()=>setPhoto(item)}><img src={item.archivo} alt={`${item.caso}, ${item.dispositivo}: ${item.descripcion}`} loading="lazy"/><span><CrmIcon name="image"/>Ampliar</span></button><figcaption><Tag tone="blue">{item.dispositivo}</Tag><p>{item.descripcion}</p>{item.origenDescripcion==='nombre_archivo'&&<small>Descripción tomada del nombre del archivo.</small>}<small>Captura: {dayLabel(item.captura)}</small><small>Incorporación local: {dayLabel(item.registro)}</small></figcaption></figure>)}</div></section>)}
     </DataComponent></div>
    </TabPanel>
   </div>}
  </Dialog>
  <Dialog open={!!photo} onClose={()=>setPhoto(null)} title={photo?`${photo.caso} · Evidencia ${photo.dispositivo}`:'Evidencia'} expanded>{photo&&<div className="crm-lightbox"><img src={photo.archivo} alt={photo.descripcion}/><p>{photo.descripcion}</p><div><span>Captura: {dayLabel(photo.captura)}</span><a href={photo.archivo} target="_blank" rel="noreferrer">Abrir original completo ↗</a></div></div>}</Dialog>
 </>;
}
