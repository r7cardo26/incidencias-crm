# Incidencias CRM

Web de consulta para revisar el cumplimiento de las incidencias del CRM: etapa actual, situación, compromisos, reprogramaciones, hechos documentados y fotografías.

La publicación se sirve con GitHub Pages desde `main`, carpeta `/docs`. Los lectores no necesitan iniciar sesión. El sitio es público. Los datos y las fotografías originales publicados fueron autorizados por el responsable del proyecto.

## Vistas

- **Seguimiento:** portada compacta clara con azul y lima. Filtros a la izquierda; abiertos por defecto y accesos separados a Cerrados y Todos. Las condiciones de plazo vencido, bloqueo, falta de plazo y reprogramación se consultan con controles propios. La tabla muestra etapa, prioridad, responsable, plazo y fotos. El orden inicial es bloqueo, prioridad del Sheets y fecha de compromiso, con plazos vencidos primero dentro de cada prioridad.
- **Etapas:** tablero de los estados actuales del registro. No supone una secuencia histórica de etapas.
- **Línea de tiempo:** comparación de fechas por caso e historia documental por fecha. El orden inicial prioriza los pendientes.
- **Buscar caso:** búsqueda del registro completo, incluidos los cerrados.

Al abrir un caso aparece una ventana emergente con Resumen, Línea de tiempo y Fotos. Cerrar la ventana conserva búsqueda, filtros, vista rápida, página y posición de la lista. Las fotos PC y Celular se agrupan solo si pertenecen a la misma comprobación. El diseño prioriza el uso en computadora.

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

   El constructor aplica las equivalencias del catálogo de categorías, conserva el ID del dashboard, marca el trabajo completo, compila la aplicación y prepara `/docs`. La compilación no vuelve a leer Google Sheets. Al actualizar, contrastar las validaciones y nuevas opciones del registro con `src/content/dashboard/crm-catalog.json`; incorporar categorías nuevas sin reclasificarlas por interpretación.

4. Ejecutar `node tools/verificar.mjs` y `node tools/verificar_normalizacion.mjs`, revisar filtros, fichas, línea de tiempo y fotos en la web local y subir los archivos revisados a `main`. Verificar después la publicación de GitHub Pages y sus evidencias.

Para una construcción independiente del plugin se incluye el código React y el runtime copiado con su configuración y dependencias. `npm ci` seguido de `npm run build` construye `dist`; para actualizar la publicación hay que copiar el resultado y las evidencias a `/docs` después de la validación. El flujo habitual de este proyecto usa el constructor de Data indicado arriba.

## Estructura

- `src/content/dashboard/`: interfaz, estilos y cálculos de presentación.
- `src/data.json`: snapshot revisado y trazabilidad acotada para publicar.
- `evidencias/`: copias exactas de las fotografías incluidas en la web.
- `tools/`: exportación, construcción y comprobación.
- `docs/index.html`, `docs/snapshot.*.json`, `docs/evidencias/`: publicación estática verificada.

La fecha de generación del sitio y la última lectura del registro son distintas. Para conocer la vigencia de los datos, revisar siempre la cabecera de la web.

## Presentación normalizada y línea de tiempo

La autoridad es el catálogo de validación y los valores del Sheets. Tipo, etapa, prioridad, módulo, situación, bloqueo y responsable tienen campos de presentación separados de los originales. Se concilian espacios, mayúsculas y tildes; `alex` pasa a `Alex` y los responsables compartidos equivalentes se agrupan sin perder roles ni condiciones. Los responsables vacíos se agrupan bajo la categoría existente `Por asignar`. `Unificado en #11` se presenta como `Unificado`, manteniendo la referencia original. La prioridad `—` conserva su significado de falta de prioridad. Los textos descriptivos no se reinterpretan.

La situación sigue siendo Abierto/Cerrado; Cerrado cuenta como cumplida. El plazo calculado distingue vencido, vence al corte, en plazo y sin plazo. Este cálculo es distinto de la alerta del Sheets, que puede excluir casos por validar, postergados o con solución informada. Los filtros presentan ambas variables por separado. Reprogramada es una condición adicional. Los originales y fechas de lectura permanecen en el snapshot y en la ficha del caso.

La pestaña Línea de tiempo conserva el identificador `plazos` y sus filtros. La vista Por incidencia compara ingreso, plazo original, plazo vigente y solución informada en una escala común. El intervalo no representa trabajo continuo ni acredita un historial de etapas. La vista Hechos por fecha reúne los eventos documentados y separa los que no tienen fecha. Los compromisos no se usan como fecha del acuerdo. Cada caso o marcador abre el detalle con su evidencia.
