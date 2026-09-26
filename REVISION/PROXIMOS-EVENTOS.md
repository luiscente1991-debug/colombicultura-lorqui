# Próximos eventos — 24 de septiembre de 2026

Estado: PUBLICADO el 24 de septiembre de 2026 a las 18:48 UTC, tras la autorización expresa del propietario («publicalo»). Comprobado en https://clasicolombicultura.es. Despliegue: 6ab56fa90e9309ef7883babf; estado ready, locked=true.

Base: ZIP adjuntado por el propietario, clasicolombicultura-imagenes-optimizadas(1).zip. Su informe registra la publicación de imágenes optimizadas del despliegue 6ab4d8aea6e4ef6b14984bf6. Proyecto Netlify: ce8e1f13-d2f1-4f75-8f66-2d20c3248b6d.

## Cambio solicitado

El panel junto al calendario ahora se titula «Próximos eventos» y muestra los eventos de la sociedad desde hoy inclusive, ordenados por fecha y hora. La selección de un día o el cambio de mes no limita esta lista. Los eventos futuros ya publicados aparecen automáticamente, y también los nuevos al cargar la página después de guardarlos. Se mantienen las fechas marcadas del calendario y los datos de cada evento. Se retira el botón «Ver todo el mes», que ya no corresponde al funcionamiento del panel. Si no hay próximos eventos, aparece «No hay próximos eventos publicados».

El filtrado de publicación se mantiene en el servidor: los visitantes reciben únicamente entradas publicadas; el administrador conserva su vista de borradores. Los eventos pasados permanecen guardados y marcados en su calendario, pero no forman parte de «Próximos eventos».

Único archivo original modificado: app/sociedad/[slug]/view.tsx. El resto del ZIP se conserva byte por byte, incluidas las mejoras de imágenes, la navegación, los estilos, las clasificaciones y las migraciones.

## Comprobaciones completadas

- Compilación de producción Next.js y comprobación TypeScript: correctas.
- Comprobaciones existentes de sociedades y clasificaciones: correctas.
- Comprobaciones existentes de optimización de imágenes y navegación: correctas.
- Interacción del componente real en DOM: evento real publicado de octubre visible mientras el calendario muestra septiembre; selección de día, cambio de mes y botón Hoy no filtran el panel.
- Eventos añadidos visibles, orden cronológico con desempate por hora, inclusión de hoy, exclusión de días pasados y mensaje vacío: correctos.
- Las pruebas utilizan servicios aislados y datos públicos de solo lectura; no modifican la base de datos de producción.

No se completó la revisión visual en un navegador real: el entorno no dispone de Chromium y su descarga falló. El CSS permanece idéntico al original. La compilación, las pruebas de interacción en DOM y las comprobaciones HTTP del dominio publicado sí se completaron correctamente.


## Publicación y comprobación en el dominio

- URL: https://clasicolombicultura.es/sociedad/sociedad-nuestra-senora-de-los-angeles#calendario
- La sociedad y el evento existente cargan correctamente (HTTP 200).
- El JavaScript del calendario servido en el dominio coincide byte por byte con la compilación comprobada.
- Imagen pública verificada: HTTP 200, formato WebP.
- Los datos públicos antes y después de publicar coinciden byte por byte: 4 sociedades y 25 entradas.
- Se conserva la base de datos production y el almacenamiento de imágenes de producción; no se ejecutan migraciones.
- El nuevo despliegue queda publicado y bloqueado. El anterior 6ab4d8aea6e4ef6b14984bf6 se conserva para recuperación.

El intento anterior de vista previa se canceló tras atascarse. La publicación posterior se completó mediante el cliente oficial de Netlify, enviando los archivos estáticos generados por el adaptador Next.js y las funciones verificadas.
