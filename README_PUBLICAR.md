# Web Sociedad de Colombicultura Virgen del Rosario de Lorquí

Esta versión está preparada para publicar con **Netlify + GitHub + Decap CMS**.

## Qué podrás editar desde el móvil
- Noticias: fecha, categoría, título, texto, imagen y enlace.
- Calendario: fecha, tipo, título, hora, lugar y descripción.
- Clasificaciones: noviembre, diciembre, enero, febrero, marzo, abril y mayo; Top 10 y PDF/imagen de clasificación completa.
- Podios: se calculan automáticamente con los tres primeros del Top 10.
- Galería: subir, ordenar y eliminar fotografías.

## Publicación y panel /admin
1. Sube todo este proyecto a un repositorio de GitHub.
2. En Netlify crea un sitio importando ese repositorio. No necesita comando de compilación; el directorio de publicación es la raíz (`.`).
3. En Netlify activa **Identity**. Configura el registro como **Invite only**.
4. Activa **Git Gateway** para el sitio.
5. Invítate como usuario desde Identity.
6. Abre `https://TU-SITIO.netlify.app/admin/` desde móvil u ordenador.
7. Inicia sesión, edita una sección y pulsa Publicar. Los cambios se guardan en GitHub y Netlify vuelve a publicar la web automáticamente.

## Seguridad
No pongas contraseñas ni tokens dentro de los archivos. El acceso al panel se gestiona mediante Netlify Identity y Git Gateway. Mantén el registro en “Invite only”.
