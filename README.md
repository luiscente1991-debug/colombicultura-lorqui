# ClasiColombicultura en Netlify

Next.js conserva el portal y las páginas independientes de sociedades. Netlify Database guarda los contenidos y Netlify Blobs guarda escudos, fotografías y documentos. Los visitantes solo reciben contenidos publicados.

## Publicación

El proyecto existente de Netlify es `clasicolombicultura`, ID `ce8e1f13-d2f1-4f75-8f66-2d20c3248b6d`. `netlify.toml` configura `npm run build` y `.next`. Las migraciones PostgreSQL de `netlify/database/migrations` se aplican antes de publicar. Las migraciones ya aplicadas son inmutables.

La migración inicial conserva los identificadores, estado de publicación y archivos de la versión anterior. Los archivos se transfieren a Blobs al primer acceso, y se elimina su copia temporal de la base de datos. No hay credenciales en el repositorio ni datos de migración en los archivos públicos.

## Administración

La ruta `/admin` utiliza `@netlify/identity`. Debe estar activado Netlify Identity en el proyecto. El registro solo acepta el correo configurado en `SOCIETY_MANAGER_EMAIL`, y la administración exige que ese correo esté confirmado. `SOCIETY_MANAGER_USER_KEY` mantiene la propiedad de los datos migrados. Ambas variables se configuran como secretos en Netlify, incluyendo el alcance Functions; si el plan no permite elegir alcances, se pueden usar Builds, Functions y Runtime. No se exponen al cliente. No se reconocen cabeceras de autenticación del alojamiento anterior.

Comprobar que las variables aparecen guardadas en Project configuration > Environment variables y volver a desplegar para incorporarlas a las funciones. La confirmación de guardado del conector no basta: si el panel está vacío, el alta queda bloqueada. El dominio principal debe estar operativo con HTTPS porque Identity lo utiliza para sus eventos y enlaces. La validación debe aceptar el correo propietario y rechazar cualquier otro; esta comprobación no crea cuentas ni confirma correos.

`SOCIETY_MANAGER_USER_KEY` es el identificador del registro propietario conservado en la migración inicial; conocerlo no autoriza ninguna petición. Permanece oculto en la configuración de Netlify, con una excepción de escaneo limitada a ese identificador para evitar el falso positivo de la migración inmutable. El escaneo de los demás secretos sigue activo.

El propietario elige su contraseña desde el primer acceso y confirma el correo. Las opciones de recuperación y cierre de sesión están disponibles. Ningún enlace de gestión se muestra a visitantes sin permisos.

Con la cuenta propietaria activada, Netlify Identity queda en modo Invite only, manteniendo la confirmación de correo. El enlace de entrada es `/admin`, excluido de indexación. Los menús y pies de página públicos no incluyen enlaces de gestión. Una barra separada, renderizada solo para el propietario verificado, ofrece acceso al panel y un botón visible para cerrar sesión; el cierre elimina las cookies de acceso y renovación incluso si falla la petición a Identity.

La sesión del navegador la gestiona `@netlify/identity`. En peticiones de Next.js, el servidor lee `nf_jwt` mediante `cookies()` y lo verifica con el endpoint `/user` de Identity del proyecto; así no depende de que el adaptador rellene `Netlify.context.cookies`. Solo una respuesta válida con correo confirmado permite resolver al propietario. No se aceptan JWT simplemente decodificados, cabeceras de identidad suministradas por el visitante ni redirecciones a otro servidor.

El guardado y las subidas validan `Origin` contra la dirección HTTPS pública del proyecto y las direcciones de despliegue configuradas por Netlify (`URL`, `DEPLOY_URL`, `DEPLOY_PRIME_URL`). No comparan la dirección del navegador con la URL interna de Next.js ni confían en cabeceras Host reenviadas. Las solicitudes sin origen, de otros sitios o sin sesión de administrador se rechazan.

## Archivos y comprobaciones

Los archivos de más de 3 MB se envían en fragmentos de 1 MB para respetar los límites de las funciones de Netlify. Se conserva el máximo de 8 MB para documentos y de 5 MB para imágenes, y se comprueban tamaño, firma y propiedad antes de guardar.

Configurar `SOCIETY_STORAGE_SCOPE=production` exclusivamente en el contexto Production para usar Blobs persistentes entre publicaciones. Los demás contextos usan almacenes aislados por despliegue. La migración `004_persistent-existing-files` conserva los dos archivos existentes al activar esta configuración; solo añade copias temporales para registros de archivos que todavía existen.

`npm test` comprueba el lector Excel, podios, las migraciones en PostgreSQL aislado, las API, protección de borradores, eliminación y subidas de 8 MB. Las pruebas sustituyen exclusivamente los servicios externos dentro del paquete de pruebas; no existe acceso de prueba en la aplicación publicada. `npm run build` verifica la compilación de Next.js.

La versión anterior de ChatGPT Sites permanece en su último despliegue; esta rama contiene la adaptación para Netlify.

## Importar clasificaciones

Al seleccionar un Excel reconocido se lee y adjunta automáticamente; después basta con guardar la clasificación. Las plantillas vacías se conservan como pendientes de resultados, sin inventar participantes ni puntuaciones. «Ajustar hoja y columnas» permite cambiar el mapeo; esos ajustes deben aplicarse antes de guardar. Una importación fallida puede reintentarse o cancelarse, conservando la clasificación que ya estaba cargada.

El tipo de competición admite local, comarcal, intercomarcal, regional, nacional y otra competición. La localidad se guarda en el campo existente `location` y aparece en la lista y en la clasificación completa. El resumen de podios sigue limitado a concursos locales.

La prueba `verify-import-form.mjs` usa el formulario React real y una API simulada para comprobar la selección del Excel, el guardado sin confirmación adicional, la conservación de las 120 filas y la recuperación ante archivos o subidas fallidos.
