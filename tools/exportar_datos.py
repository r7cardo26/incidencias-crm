"""Exporta una copia revisada para la web sin modificar las fuentes."""
import argparse
import csv
import datetime as dt
import hashlib
import json
import re
import shutil
import sqlite3
from collections import Counter
from pathlib import Path

PARSER = argparse.ArgumentParser()
PARSER.add_argument('--source', required=True, type=Path)
PARSER.add_argument('--output', required=True, type=Path)
PARSER.add_argument('--assets', required=True, type=Path)
ARGS = PARSER.parse_args()
previous_snapshot = json.loads(ARGS.output.read_text(encoding='utf-8-sig')) if ARGS.output.exists() else {}
ROOT = ARGS.source.resolve()
DB_PATH = ROOT / 'historial/incidencias.sqlite3'
with sqlite3.connect(DB_PATH.as_uri() + '?mode=ro', uri=True) as db:
    data = {n: json.loads(v) for n, v in db.execute('SELECT name,payload FROM datasets')}
    meta = {n: json.loads(v) for n, v in db.execute('SELECT name,value FROM meta')}

def text(value):
    if value is None:
        return None
    value = str(value).strip()
    value = re.sub(r'[A-Za-z]:[\\/][^\n|]+', '[ruta local omitida]', value)
    return value or None

def date(value):
    return str(value)[:10] if value else None

def lima(value):
    if not value:
        return None
    parsed = dt.datetime.fromisoformat(str(value).replace('Z', '+00:00'))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.timezone.utc)
    return parsed.astimezone(dt.timezone(dt.timedelta(hours=-5))).isoformat()

read_at = lima(meta['source_read_at'])
cutoff = read_at[:10]
details = {r['CasoID']: r for r in data['Detalle']}
commitments = []
for r in data['Compromisos']:
    commitments.append(dict(id=r['CompromisoVersionID'], caso=r['CasoID'], orden=r['OrdenConocido'],
        acuerdo=date(r['FechaAcuerdo']), plazo=date(r['FechaPrometida']), vigente=r['EsVigente'],
        reprogramacion=r['ReprogramacionConfirmada'] is True, interpretacion=text(r['Interpretacion']),
        texto=text(r['TextoOriginal']), evento=r['EventoID']))

cases = []
for r in data['Incidencias']:
    if not r.get('PresenteEnUltimaLectura'):
        continue
    d = details.get(r['CasoID'], {})
    deadline = date(r['FechaCompromisoVigente'])
    fulfilled = r['SituacionFuente'] == 'Cerrado'
    versions = sorted([c for c in commitments if c['caso'] == r['CasoID']], key=lambda c: c['orden'] or 0)
    rescheduled = any(c['reprogramacion'] for c in versions)
    original = next((c['plazo'] for c in versions if c['plazo']), deadline)
    timing = 'Cumplida' if fulfilled else 'Sin plazo' if not deadline else 'Vencida' if deadline < cutoff else 'Vence al corte' if deadline == cutoff else 'En plazo'
    cases.append(dict(id=r['CasoID'], numero=r['NumeroOrigen'], tipo=text(r['Tipo']), asunto=text(r['Asunto']),
        modulo=text(r['ModuloFuente']) or 'Por clasificar', prioridad=text(r['PrioridadFuente']) or 'Sin prioridad',
        responsable=text(r['ResponsableFuente']) or 'Sin responsable', etapa=text(r['EstadoFuente']) or 'Sin etapa',
        situacion=r['SituacionFuente'], cumplida=fulfilled, bloqueante=r['BloqueanteFuente'] == 'Sí',
        ingreso=date(r['FechaIngreso']), plazo=deadline, plazoOriginal=original, solucion=date(r['FechaSolucionInformada']),
        plazoEstado=timing, reprogramada=rescheduled, detalle=text(d.get('DetalleFuente')),
        accion=text(d.get('AccionSolicitada')), soporte=text(d.get('ComentarioSoporte')),
        compromisoTexto=text(d.get('CompromisoTextoOriginal')), interpretacion=text(r['InterpretacionCompromiso']),
        seguimiento=text(d.get('SeguimientoRepositorio')), evaluacion=text(d.get('EvaluacionDocumental'))))

context = {}
context_path = ROOT / 'fotos_whatsapp/registro_evidencias_whatsapp.csv'
if context_path.exists():
    with context_path.open(encoding='utf-8-sig', newline='') as f:
        context = {r['SHA256']: r for r in csv.DictReader(f)}

ARGS.assets.mkdir(parents=True, exist_ok=True)
photos = []
asset_manifest = []
for r in data['Evidencias']:
    original = (ROOT / r['Archivo']).resolve()
    if not original.is_relative_to(ROOT):
        raise ValueError('La evidencia sale del directorio de fuente')
    content = original.read_bytes()
    digest = hashlib.sha256(content).hexdigest()
    if digest != r['SHA256']:
        raise ValueError('Hash de evidencia distinto al catalogo: ' + r['EvidenciaID'])
    ctx = context.get(digest, {})
    if ctx.get('CasoID') and ctx['CasoID'] != r['CasoID']:
        raise ValueError('Caso de contexto inconsistente')
    ext = '.png' if content.startswith(b'\x89PNG') else '.jpg'
    asset_name = r['EvidenciaID'] + ext
    shutil.copyfile(original, ARGS.assets / asset_name)
    assert hashlib.sha256((ARGS.assets / asset_name).read_bytes()).hexdigest() == digest
    description = text(ctx.get('DescripcionOriginal')) or text(r['TituloFuente'])
    photo = dict(id=r['EvidenciaID'], caso=r['CasoID'], comparacion=r.get('ComparacionID') or 'Sin comprobación identificada',
        dispositivo='Celular' if str(r.get('Dispositivo')).upper() in ('CEL', 'CELULAR') else 'PC' if str(r.get('Dispositivo')).upper() == 'PC' else 'Sin identificar',
        captura=date(r.get('FechaCaptura')), registro=lima(r.get('FechaRegistroUTC')), descripcion=description,
        observacion=text(ctx.get('DescripcionObservada')), origenDescripcion=text(ctx.get('OrigenDescripcion')),
        archivo='./evidencias/' + asset_name, sha256=digest, bytes=len(content))
    photos.append(photo)
    asset_manifest.append(dict(id=photo['id'], caso=photo['caso'], archivo=asset_name, sha256=digest, bytes=len(content)))

events = {r['EventoID']: r for r in data['Eventos']}
changes_with_event = {(r['CasoID'], r['EventoID']) for r in data['HistorialCambios'] if r.get('EventoID')}
timeline = []
def add(item_id, case, occurred, registered, kind, description, link, ref=None, zone=None):
    occurrence = str(occurred) if occurred else None
    if occurrence and zone and zone.lower() == 'no declarada':
        occurrence = re.sub(r'(?:Z|\+00:00)$', '', occurrence)
    registration = lima(registered)
    timeline.append(dict(id=item_id, caso=case, fecha=occurrence, registro=registration,
        fechaOrden=occurrence or registration, tipoFecha='Fecha documental' if occurrence else 'Registro local / detección' if registration else 'Sin fecha documentada',
        tipo=kind, descripcion=text(description), vinculo=text(link), referencia=text(ref), zonaHoraria=zone))

for link in data['EventoCaso']:
    if (link['CasoID'], link['EventoID']) in changes_with_event:
        continue
    event = events[link['EventoID']]
    add('EV|' + link['CasoID'] + '|' + event['EventoID'], link['CasoID'], event['FechaHoraReporte'], event.get('FechaDeteccionUTC'),
        event['Tipo'], event['Sintesis'], link['GradoVinculo'], event['EventoID'], text(event.get('ZonaHoraria')) or 'No declarada')
for r in cases:
    if r['ingreso']:
        add('ING|' + r['id'], r['id'], r['ingreso'], None, 'Ingreso al registro',
            'Fecha consignada en el registro operativo.', 'Registro operativo')
    if r['solucion']:
        add('SOL|' + r['id'], r['id'], r['solucion'], None, 'Solución informada',
            'Fecha de solución informada. La incidencia continúa abierta.' if not r['cumplida'] else 'Fecha de solución informada; el registro está cerrado.',
            'Registro operativo')
for r in data['HistorialCambios']:
    add('CAM|' + r['CambioID'], r['CasoID'], r['FechaEvento'], r['FechaDeteccionUTC'], 'Cambio de ' + r['Campo'],
        'Antes: ' + str(r['ValorAnterior'] or 'Sin dato') + ' | Ahora: ' + str(r['ValorNuevo'] or 'Sin dato'), 'Cambio observado')
for p in photos:
    if p['registro']:
        add('FOTO|' + p['id'], p['caso'], None, next(r['FechaRegistroUTC'] for r in data['Evidencias'] if r['EvidenciaID'] == p['id']),
            'Evidencia incorporada', p['descripcion'] + (' · Fecha de incorporación local; la fecha de captura consta por separado.' if p['captura'] else ' · Fecha de incorporación local; fecha de captura no documentada.'), 'Registro local', p['id'])
timeline.sort(key=lambda r: (r['caso'], r['fechaOrden'] or '9999', r['id']))

relations = [dict(caso=r['CasoID'], relacionado=r['CasoRelacionadoID'], tipo=text(r['TipoRelacion'])) for r in data['Relaciones'] if r.get('EsVigente')]
pending = [dict(id=r['PendienteID'], caso=r['CasoID'], campo=text(r['Campo']), tipo=text(r['Tipo']), accion=text(r['AccionRequerida']))
           for r in data['Pendientes'] if r['Estado'] == 'Pendiente']
generated = dt.datetime.now(dt.timezone.utc).isoformat()
db_hash = hashlib.sha256(DB_PATH.read_bytes()).hexdigest()
source = dict(label='Consolidado de incidencias CRM', provider='Consolidado local de Google Sheets y documentación',
    files=['Base_Incidencias_CRM_2026-10-21.xlsx', 'incidencias.sqlite3', 'registro_evidencias_whatsapp.csv'],
    executedAt=meta['source_read_at'], timezone='America/Lima', period={'from':min(r['ingreso'] for r in cases if r['ingreso']), 'to':cutoff},
    evidenceFlow=[dict(title='Registro operativo', detail='Última lectura del registro: ' + read_at + '. No se ha vuelto a consultar Google Sheets al construir esta web.'),
        dict(title='Consolidación', detail='Una fila por CasoID; etapas y situación conservadas literalmente. Unión de detalles por CasoID; fotografías por SHA256 y CasoID.'),
        dict(title='Copia web', detail='Exportación reproducible con tools/exportar_datos.py. Hash SHA256 del consolidado: ' + db_hash)],
    caveats=['Los cambios de etapa anteriores al seguimiento no forman un historial completo.',
        'Una fecha prometida es un plazo, no la fecha del acuerdo ni la del cierre.',
        'Cerrada significa cumplida por decisión del responsable del proyecto. Sin fecha de solución no se puede evaluar puntualidad.',
        'La incorporación de una fotografía no demuestra su fecha de captura.'])
queries = {}
for name, rows, grain in [('incidencias', cases, 'Una fila por incidencia'), ('cronologia', timeline, 'Un hecho documental o registro local por incidencia'),
        ('compromisos', commitments, 'Una versión conocida de compromiso'), ('evidencias', photos, 'Una fotografía original'),
        ('relaciones', relations, 'Una referencia entre incidencias'), ('pendientes', pending, 'Un dato pendiente de aclarar')]:
    s = dict(source)
    s['grain'] = grain
    if name == 'incidencias':
        s['metricDefinitions'] = [
            dict(label='Cumplidas', definition='Incidencias cuya SituacionFuente es Cerrado.', formula='count(cumplida === true)'),
            dict(label='Vencidas al corte', definition='Incidencias abiertas con plazo interpretable anterior a ' + cutoff + '.'),
            dict(label='Sin plazo', definition='Incidencias abiertas sin fecha de compromiso interpretable.'),
            dict(label='Reprogramadas', definition='Incidencias con al menos una versión marcada ReprogramacionConfirmada. No basta encontrar dos fechas en el texto.')]
    queries[name] = dict(rows=rows, source=s)
snapshot = dict(id=previous_snapshot.get('id','incidencias-crm-seguimiento-20261022'), surface='dashboard', title='Incidencias CRM', status='reviewed',
    buildStatus='updating' if previous_snapshot else 'creating', generatedAt=generated, readOnly=True,
    filters=previous_snapshot.get('filters',[]), queries=queries,
    crm=dict(corte=cutoff, lectura=read_at, exportacion=generated, actualizacion='A solicitud', fotosOriginales=True,
        historiaCompleta=False, cambiosObservados=len(data['HistorialCambios']), eventosSinVinculo=len(events)-len({r['EventoID'] for r in data['EventoCaso']})))
ARGS.output.parent.mkdir(parents=True, exist_ok=True)
ARGS.output.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding='utf-8')
stats = dict(casos=len(cases), abiertas=sum(not r['cumplida'] for r in cases), cumplidas=sum(r['cumplida'] for r in cases),
    vencidas=sum(r['plazoEstado']=='Vencida' for r in cases), sinPlazo=sum(r['plazoEstado']=='Sin plazo' for r in cases),
    reprogramadas=sum(r['reprogramada'] for r in cases), cronologia=len(timeline), compromisos=len(commitments), fotos=len(photos),
    etapas=dict(Counter(r['etapa'] for r in cases)), activosHash=db_hash, assets=asset_manifest)
(ARGS.output.parent / 'validacion_exportacion.json').write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({k:v for k,v in stats.items() if k not in ('assets','activosHash')}, ensure_ascii=False))
