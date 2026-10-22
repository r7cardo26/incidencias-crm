// Display-only vocabulary. The reviewed snapshot keeps every original value.
export const cleanName=value=>{
 const text=String(value??'').trim().replace(/\s+/g,' ');
 if(!text||['—','-','Sin responsable'].includes(text))return 'Sin asignar';
 return text.replace(/\balex\b/gi,'Alex');
};
export const situationLabel=value=>value==='Cerrado'?'Cumplida':value==='Abierto'?'Abierta':value;
export const priorityLabel=value=>!value||['—','-'].includes(value)?'Sin definir':value;
export const resultLabel=row=>row.cumplida?'Cumplida':row.plazoEstado==='Vencida'?'Abierta · vencida':row.plazoEstado==='Sin plazo'?'Abierta · sin plazo':'Abierta · en plazo';
export const resultTone=row=>row.cumplida?'green':row.plazoEstado==='Vencida'?'red':row.plazoEstado==='Sin plazo'?'amber':'blue';
export const eventLabel=value=>({Reprogramacion:'Reprogramación','Reprogramacion confirmada':'Reprogramación confirmada'})[value]||value;
