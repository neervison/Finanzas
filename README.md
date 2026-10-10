# Mis Pagos — App instalable con datos en la nube

App para llevar tus finanzas personales: recordatorio de pagos (tarjetas,
servicios y cuentas), gastos del mes e **ingresos** (la propina de cada día
y el sueldo), con balance mensual. Corre en un servidor (Node + Express),
guarda todo en **MongoDB Atlas** y se instala en el teléfono desde Chrome.

## Cuentas y roles (v5/v6)

- **Registro**: cualquier persona se crea su cuenta con nombre, correo y
  clave (mínimo 6 caracteres). Las claves van cifradas (bcrypt).
- **Ingreso**: cada usuario entra con su correo y ve **solo sus datos**
  (pagos, gastos e ingresos son por usuario).
- **Administrador**: en la pantalla de ingreso hay un **"Acceso
  administrador"**. El admin entra ahí y en el menú ☰ tiene la opción
  **Usuarios registrados**: ve nombre y correo de cada persona, cuántos
  pagos/gastos/ingresos tiene, y puede mirar sus registros. Si alguien
  olvida su clave, en el detalle de ese usuario el botón **🔑 Restablecer
  clave** permite ponerle una temporal (mínimo 6 caracteres); la clave
  anterior deja de servir y sus sesiones abiertas se cierran solas.
- El administrador **nace de las variables de entorno** (ver abajo): no hay
  clave por defecto. Tus datos antiguos (los de antes de tener usuarios)
  pasan solos a tu cuenta de administrador la primera vez que entras.

## Publicarla en Render (igual que PropinasApp)

1. Sube estos archivos al repo privado de GitHub (carpeta
   `subir-a-github-mispagos`): `server.js`, `package.json`,
   `package-lock.json`, `README.md` y la carpeta `public/`.
2. En **Render**: el Web Service ya creado se actualiza solo con cada
   subida (auto-deploy). Si es nuevo: Build `npm install`, Start `npm start`.
3. Variables de entorno en Render → Environment:
   - `MONGODB_URI` = tu cadena de MongoDB Atlas (base propia: **mispagos**).
   - `ADMIN_NOMBRE` = tu nombre (ej: el tuyo).
   - `ADMIN_CORREO` = el correo con el que entrarás como administrador.
   - `ADMIN_CLAVE` = la clave de administrador que tú elijas (mín. 6).
4. Guarda: Render redeploya y el admin queda creado.

Producción actual: https://finanzas-6gax.onrender.com

## Instalarla en el teléfono

Abre la dirección en Chrome → menú ⋮ → **Instalar app**. Queda el ícono
junto a tus apps. Los datos se guardan solos en el servidor (sin conexión
quedan en el teléfono y sincronizan cuando vuelve), pero ese estado
**no se muestra en pantalla**: ni ☁️ Nube ni 📱 Local, y tampoco la versión.

## Uso diario

- **Vista general**: cuánto falta por pagar (con anillo de progreso),
  gastos e ingresos del mes, **balance (ingresos − gastos)**, próximos
  vencimientos y últimos movimientos.
- **Pagos**: tarjetas/servicios/cuentas con día de pago; botón "Ya pagué".
- **Gastos**: anota gastos por categoría, con total del mes.
- **Ingresos**: anota la **propina de cada día** y el **sueldo**; la Vista
  general separa cuánto vino de propinas y cuánto de sueldo.
- El botón **+** se adapta a la vista en que estás.
- **Barra inferior flotante** con las esquinas redondeadas (el mismo diseño
  de PropinasApp): Inicio, Pagos, el **+** al centro elevado, Gastos y Menú.
  El menú lateral se abre desde esa barra; la barra superior ya no lleva ☰.
  Ingresos se entra desde el menú o tocando su tarjeta en la Vista general.
- **Orden y dinamismo (v28)**: Pagos se agrupa con títulos **Vencidos ·
  Por vencer · Pagados**; **buscador** en Pagos y en Gastos (filtra al
  escribir, sin tocar los totales del mes); **deslizar un pago a la
  derecha lo marca "Ya pagué"** (con vibración, igual que el botón);
  transición suave al cambiar de vista; y el **gráfico es tocable**:
  tocar un mes salta a los gastos e ingresos de ese mes.
- **Cerrar la app cierra la sesión (v27)**: la sesión ahora vive en
  sessionStorage — al cerrar la app por completo, al volver a abrir pide
  correo y clave de nuevo (a pedido del dueño). Si solo se minimiza, la
  sesión sigue. Los datos (pagos, gastos, ingresos y la lista de compra)
  NO se borran: quedan guardados como siempre.
- **Suma siempre visible en Modo Compra (v26)**: la suma grande quedaba
  arriba y se perdía de vista al agregar productos; ahora hay una **barra
  fija** sobre la barra inferior con "Llevas en esta compra $…" y botón
  Finalizar, visible todo el rato (también con el teclado abierto, gracias
  a `interactive-widget=resizes-content` en el viewport).
- **Íconos de pagos visibles en oscuro (v25)**: los símbolos de las filas
  de pagos/gastos heredaban el color del texto (casi blanco en oscuro) y se
  perdían sobre su fondo pastel; ahora cada ícono usa el color propio del
  pago (`color:var(--color)`), visible en ambos temas. (La v24 quitó el
  subtítulo "Vista general" de la barra superior.)
- **Sol visible y letras legibles (v23)**: el botón de tema heredaba color
  negro y en modo oscuro el sol se pintaba negro sobre negro (invisible);
  ahora usa el color del texto del tema. Tipografía con mejor contraste
  (`--suave` más marcado en ambos temas), textos secundarios un poco más
  grandes y renderizado suavizado (antialiased).
- **Modo compra (v22)**: desde Gastos o desde el botón **+** ("Compra en
  el mercado"). Anotas producto, precio y cantidad mientras compras y la
  app lleva la **suma en vivo** ("Llevas en esta compra $…"), con la lista
  guardada en el teléfono por si cierras la app. Al terminar, **Finalizar**
  guarda el total como un gasto de Supermercado en Gastos del mes (con
  "Compra en el mercado (N productos)") y la lista se vacía. Las tarjetas
  de la Vista general y los íconos de las listas se agrandaron un poco.
- **Íconos profesionales (v21)**: toda la app usa íconos SVG de trazo
  (sprite `#i-*` al inicio del body, helper JS `IC('i-...')`, clase `.ic`):
  barra inferior, menú lateral, tarjetas, listas, categorías y formularios.
  Ya no quedan emojis como íconos; las opciones de los selectores van con
  texto solo. Los ✓ de "Ya pagué/Pagado" se mantienen como glifo.
- **Logo oficial (v16)**: gráfico de barras pastel que suben con flecha
  dorada ("Finanzas que suben"). Es el ícono de instalación
  (`icon-192.png` / `icon-512.png`) y aparece en la barra superior, el menú
  lateral, la pantalla de ingreso y los pies de página (antes era un 💳).
  El fondo de la app es sereno, sin manchas; el panel general entra en
  cascada, los montos de las tarjetas cuentan al abrir, un brillo cruza el
  resumen, el anillo de progreso se llena con movimiento y la pestaña activa
  de la barra inferior se marca con una píldora.
- **Toques v7**: saludo personal según la hora ("Buenas tardes, [nombre]"),
  gráfico de barras ingresos vs gastos de los últimos 6 meses, animación
  de check al marcar un pago como pagado, botón 🌙 de **modo oscuro** en
  la barra superior (la preferencia queda guardada en el teléfono) y
  footer con el desarrollador. La versión **no se muestra en pantalla**
  (sin chip en la barra ni en los pies, a pedido de Neervison); internamente
  el service worker sigue versionando la caché (`mispagos-v17`).

## Probarla en el PC (sin nube)

```
npm install
ADMIN_CORREO=admin@test.cl ADMIN_CLAVE=admin123 npm start
```

Sin `MONGODB_URI` guarda en un `data.json` local (usuarios incluidos),
ideal para practicar. Abre http://localhost:3000.
