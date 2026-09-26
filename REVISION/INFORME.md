# Optimización de imágenes de ClasiColombicultura

Estado: publicados y verificados en https://clasicolombicultura.es/ el 24 de septiembre de 2026, tras la aprobación del propietario.

Despliegue de producción: `6ab4d8aea6e4ef6b14984bf6`, publicado a las 08:03:42 UTC. Contexto `production`, rama `main`, base de datos `production`, sin migraciones. Bloqueo de publicaciones automáticas conservado.

Vista previa: https://imagenes-20260924--clasicolombicultura.netlify.app/

Despliegue de prueba: `6ab4d49a4324da00f5f54aa4`. Código funcional probado: `e07af70`; la revisión posterior solo añade evidencias y aclara un comentario sobre la caché.

## Base verificada

- Fuente descargada desde el despliegue publicado de Netlify `6ab3f45f1d1ae75ea3ab7ead`.
- Site ID: `ce8e1f13-d2f1-4f75-8f66-2d20c3248b6d`.
- `public/portal.js` coincide con el archivo servido en producción: SHA-256 `2a9a383e19e56b5338e1f021a2220c62376c51e3eb8a76051204dc4b84950a33`.
- La copia de GitHub encontrada no estaba actualizada. No se ha sustituido producción por ella ni se ha modificado la conexión Git de Netlify.

## Cambios

- Las imágenes publicadas actuales y futuras tienen variantes WebP con `srcset` y tamaños según pantalla y uso: noticia, resumen, galería y escudo.
- Calidad 85 para miniaturas/tarjetas y 90 para lectura de noticias y galería ampliada; no se recorta el archivo original.
- Nueva ruta anónima `/api/public-images/[id]`, destinada exclusivamente a fotografías publicadas o escudos de sociedades publicadas. No admite borradores aunque el solicitante sea el administrador.
- Las respuestas públicas de origen y la caché del navegador tienen 300 segundos con revalidación. Image CDN mantiene además su propia caché de las variantes WebP. Los errores, borradores y adjuntos no son cacheables por la nueva ruta de origen.
- La ruta original `/api/media/[id]`, las subidas, las migraciones y las imágenes originales se conservan sin cambios.
- El carrusel solicita las tarjetas visibles y una adicional cuando se aproxima a la pantalla. También inicia la carga del destino al usar flechas o teclado.
- Si el optimizador falla, la imagen vuelve una sola vez al original, para evitar bucles.
- CSS, estructura visible, textos, orden de noticias y navegación conservados.

## Mediciones reales de Netlify Image CDN

Fecha: 24 de septiembre de 2026. Las mediciones iniciales sobre imágenes públicas de producción se han repetido en la vista previa, utilizando la nueva ruta `/api/public-images/[id]` y Netlify Image CDN. Los tamaños coinciden exactamente. Los originales de producción no se han modificado.

KB y MB decimales. Móvil: anchura solicitada 800 px, WebP calidad 85. Detalle: 1200 px, WebP calidad 90 (Netlify conserva la anchura original cuando es menor).

| Imagen | Original | Móvil | Reducción móvil | Detalle | Reducción detalle |
|---|---:|---:|---:|---:|---:|
| Campeonato Copa Región de Murcia. | 1.91 MB | 70.3 KB | 96.3 % | 158.0 KB | 91.7 % |
| Campeonato Regional de Murcia Los Periquitos 2026 | 1.85 MB | 68.4 KB | 96.3 % | 157.5 KB | 91.5 % |
| Palomos clasificados para el campeonato Nacional por la Región de Murcia. | 1.87 MB | 118.9 KB | 93.6 % | 233.9 KB | 87.5 % |

Total de las tres fotos: 5.62 MB → 257.6 KB. Reducción de peso: 95.4 %.

Esta reducción corresponde a bytes de imagen, no a un porcentaje garantizado de reducción del tiempo de carga. La primera transformación y la respuesta inicial del servidor también afectan a la espera.

## Verificaciones superadas

- `npm run build`: compilación de Next.js y TypeScript.
- `npx tsc --noEmit`: comprobación final de tipos.
- `npm test`: suite existente de importación Excel, clasificaciones, sociedades, formularios, privacidad, noticias y navegación del carrusel.
- `npm run test:navigation`: botón volver atrás, historial, selección y posición de desplazamiento.
- `npm run test:images`: nueva subida → borrador → publicación → retirada; respuesta de caché, originales exactos, aislamiento de borradores/adjuntos/sociedades privadas, variantes responsive, precarga, teclado y recuperación ante error.
- Comparación del marcado de noticias original y modificado: idéntico al excluir atributos de entrega de imágenes. CSS original intacto.
- Inspección de las tres copias WebP móviles: nombres y rótulos legibles.
- Compilación con el adaptador de Netlify y despliegue de las funciones Next.js: correctos.
- Base de datos de prueba `imagenes-20260924`, aislada, con las seis migraciones existentes ya aplicadas y ninguna pendiente. No se han ejecutado migraciones de producción.
- Nueve imágenes públicas copiadas al almacén exclusivo del despliegue de prueba. No se ha utilizado el almacén de producción para escribir archivos.
- Tres noticias comprobadas desde la nueva ruta: HTTP 200, bytes de los originales idénticos por SHA-256, WebP real, tamaños responsive y reducción de peso confirmada.
- Ruta de origen: segunda petición con `Cache-Status: "Netlify Edge"; hit; ttl=300`.
- Variante WebP: segunda petición y las seis posteriores con `Cache-Status: "Netlify Edge"; hit`. Se usó una conexión persistente para comprobar el mismo nodo de caché.
- Imagen inexistente: HTTP 404 y `private, no-store`.
- Navegador real: las tres tarjetas cargan desde `/.netlify/images` conservando `srcset`; la noticia ampliada carga con calidad 90. Captura incluida en `vista-previa.jpg`.
- Durante las pruebas se conservó la producción anterior `6ab3f45f1d1ae75ea3ab7ead`. Después de la aprobación se activó `6ab4d8aea6e4ef6b14984bf6`, manteniendo el bloqueo de publicaciones automáticas y la conexión Git existente.
- Comprobación posterior en el dominio público: el JavaScript servido coincide con el código probado; las 3 sociedades y 23 entradas coinciden exactamente con la lectura anterior a la publicación; originales idénticos por SHA-256; variantes WebP de móvil y detalle con los mismos tamaños medidos; segunda y tercera petición de imagen con cache hit. Evidencias en `publicacion.json` y captura real en `publicada.jpg`.

## Alcance de la caché

El TTL de 300 segundos del origen no limita la caché interna de imágenes transformadas de Netlify: en la variante WebP se observó un TTL de 31.536.000 segundos. Las nuevas subidas reciben otro UUID y, por tanto, otra URL. Una foto que nunca se haya publicado no se expone por la nueva ruta. Si se retira una foto anteriormente pública y se necesita invalidar también sus copias WebP ya almacenadas, hay que purgar la caché de Netlify; esta mejora no automatiza esa purga. Documentación: https://docs.netlify.com/build/image-cdn/overview/

## Publicación completada

El propietario autorizó la publicación con «vale publicalo». Se subieron los mismos archivos y funciones comprobados en la vista previa, usando el almacenamiento original y la base de datos de producción. Se publicó manualmente la versión preparada, sin desbloquear las publicaciones automáticas. `netlify-preview.json` conserva las pruebas previas y `publicacion.json` registra la comprobación posterior en el dominio público.

La copia de fuente incluye migraciones históricas privadas del proyecto. Mantenerla privada; desplegar mediante la compilación Next.js, nunca publicar el ZIP de fuente como archivos estáticos. No aplicar migraciones ni copiar credenciales de producción para verificar esta mejora.
