# Incidencias CRM

Web de consulta para revisar el cumplimiento de las incidencias del CRM: etapa actual, situación, compromisos, reprogramaciones, hechos documentados y fotografías.

La publicación se sirve con GitHub Pages desde `main`, carpeta `/docs`. Los lectores no necesitan iniciar sesión. El sitio es público. Los datos y las fotografías originales publicados fueron autorizados por el responsable del proyecto.

## Vistas

- **Resumen:** cumplimiento, abiertas, vencidas al corte, abiertas sin plazo, reprogramadas, distribución por etapa/módulo y registro de casos.
- **Etapas:** tablero de los estados actuales del registro. No supone una secuencia histórica de etapas.
- **Plazos:** calendario de compromisos vigentes y casos abiertos sin fecha interpretable.
- **Detalle y evidencias:** ficha, versiones del compromiso, línea de tiempo, relaciones, datos por aclarar y fotografías ampliables. Las fotos PC y Celular se agrupan solo si pertenecen a la misma comprobación.

## Reglas

- `SituacionFuente = Cerrado` cuenta como cumplida; las fotos o promesas no cambian esa situación.
- La etapa conserva `EstadoFuente`; no sustituye Abierto/Cerrado.
- Una incidencia abierta está vencida si su plazo interpretable es anterior al corte del registro, que se muestra en la cabecera.
- La reprogramación necesita confirmación documental. Se conservan las versiones original y vigente. Dos fechas ambiguas en un texto no crean una reprogramación.
- La fecha de solución informada no implica automáticamente cierre. La puntualidad de casos cerrados sin fecha permanece desconocida.
- La fecha de incorporación de una foto no prueba la fecha de captura. Se mantienen los bytes originales y se verifican por SHA256.
- La cronología distingue fecha del hecho y fecha de registro/detección. Las fechas desconocidas permanecen desconocidas. No se reconstruye un historial completo anterior a la toma de snapshots.

## Actualización a solicitud

No hay tareas programadas ni sincronización de WhatsApp desde esta web. El registro de origen se mantiene fuera del repositorio y se conserva intacto.

1. Ejecutar el flujo local `actualizar-incidencias-crm` cuando se solicite una nueva lectura del registro o incorporación de evidencias.
2. Exportar una copia revisada. El argumento `--source` apunta al proyecto local que contiene `historial/incidencias.sqlite3` y las imágenes originales. No se publican SQLite, Excel, configuración ni la URL privada de Google Sheets:

   ```text
   python tools/exportar_datos.py --source "RUTA_DEL_PROYECTO_LOCAL" --output src/data.json --assets evidencias
   ```

3. Construir con el runtime de Data instalado en Codex:

   ```text
   node tools/construir.mjs --data-plugin "RUTA_DEL_PLUGIN_DATA_INSTALADO"
   ```

   El constructor conserva el ID del dashboard, marca el trabajo completo, compila la aplicación y prepara `/docs`. La compilación no vuelve a leer Google Sheets. El script de exportación mantiene los filtros y el ID existentes.

4. Ejecutar `node tools/verificar.mjs`, revisar la web local y subir los archivos revisados a `main`. GitHub Pages publicará la carpeta `/docs`.

Para una construcción independiente del plugin se incluye el código React y el runtime copiado con su configuración y dependencias. `npm ci` seguido de `npm run build` construye `dist`; para actualizar la publicación hay que copiar el resultado y las evidencias a `/docs` después de la validación. El flujo habitual de este proyecto usa el constructor de Data indicado arriba.

## Estructura

- `src/content/dashboard/`: interfaz, estilos y cálculos de presentación.
- `src/data.json`: snapshot revisado y trazabilidad acotada para publicar.
- `evidencias/`: copias exactas de las fotografías incluidas en la web.
- `tools/`: exportación, construcción y comprobación.
- `docs/index.html`, `docs/snapshot.*.json`, `docs/evidencias/`: publicación estática verificada.

La fecha de generación del sitio y la última lectura del registro son distintas. Para conocer la vigencia de los datos, revisar siempre la cabecera de la web.

## Presentación normalizada y línea de tiempo

La presentación unifica `alex`/`Alex`, responsables vacíos (`Sin asignar`) y prioridades vacías (`Sin definir`). Cada incidencia tiene un resultado excluyente: Cumplida, Abierta · vencida, Abierta · en plazo o Abierta · sin plazo. Reprogramada es una condición adicional. Las etapas, textos, valores originales y fechas de lectura permanecen en el snapshot revisado.

La pestaña Línea de tiempo conserva el identificador `plazos` y sus filtros. La vista Por incidencia compara ingreso, plazo original, plazo vigente y solución informada en una escala común. El intervalo no representa trabajo continuo ni acredita un historial de etapas. La vista Hechos por fecha reúne los eventos documentados y separa los que no tienen fecha. Los compromisos no se usan como fecha del acuerdo. Cada caso o marcador abre el detalle con su evidencia.
