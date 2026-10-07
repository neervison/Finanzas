# Mis Pagos — App instalable con datos en la nube

La misma app Mis Pagos, pero como PropinasApp: corre en un servidor
(Node + Express) y guarda todo en **MongoDB Atlas**. Se instala en el
teléfono desde el navegador y los datos ya no dependen del teléfono.

## Archivos

- `server.js` — servidor + API (`/api/datos`): lee y guarda pagos y gastos.
- `public/` — la app (página, manifiesto PWA, service worker e íconos).
- `package.json` — dependencias (express, mongoose).

## Cómo publicarla (igual que PropinasApp)

1. Crea un repositorio **privado** en GitHub (ej: `mis-pagos`) y sube estos
   archivos (la carpeta `subir-a-github-mispagos` trae todo listo).
2. En **Render**: New → Web Service → conecta el repositorio.
   - Build command: `npm install`
   - Start command: `npm start`
3. En Render → Environment, agrega la variable:
   - `MONGODB_URI` = la misma cadena de conexión de tu MongoDB Atlas.
   La app usa su propia base llamada **mispagos**: no se mezcla con
   PropinasApp.
4. Espera el deploy y abre la dirección que te dé Render
   (ej: `https://mis-pagos.onrender.com`).

## Instalarla en el teléfono

1. Abre la dirección en **Chrome**.
2. Menú ⋮ → **"Agregar a la pantalla de inicio"** (o el aviso "Instalar app").
3. Queda el ícono 💳 junto a tus apps y se abre a pantalla completa.

Arriba a la derecha la app muestra **☁️ Nube** cuando está guardando en el
servidor, o **📱 Local** si no hay conexión (sigue funcionando y sincroniza
después; si la nube está vacía y el teléfono tiene datos, nunca los borra:
los sube).

## Pasar tus datos de la versión anterior

1. En la app anterior (el archivo suelto): menú ☰ → **Respaldar datos** y
   guarda el archivo `mispagos-respaldo.json`.
2. En la app nueva ya instalada: menú ☰ → **Restaurar respaldo** y elige ese
   archivo. Se suben solos a la nube.

## Probarla en el PC (sin nube)

```
npm install
npm start
```

Abre http://localhost:3000 — sin `MONGODB_URI` guarda en un `data.json`
local, ideal para practicar sin tocar la nube.

## APK (opcional)

Cuando esté publicada, se puede envolver en un APK de Android igual que
PropinasPro: pídela y se genera con la dirección de Render.
