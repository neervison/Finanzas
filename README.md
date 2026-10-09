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
junto a tus apps. Arriba a la derecha verás **☁️ Nube** cuando guarda en el
servidor, o **📱 Local** sin conexión (sincroniza cuando vuelve).

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
- **Toques v7**: saludo personal según la hora ("Buenas tardes, [nombre]"),
  gráfico de barras ingresos vs gastos de los últimos 6 meses, animación
  de check al marcar un pago como pagado, botón 🌙 de **modo oscuro** en
  la barra superior (la preferencia queda guardada en el teléfono) y
  footer con el desarrollador y la versión.

## Probarla en el PC (sin nube)

```
npm install
ADMIN_CORREO=admin@test.cl ADMIN_CLAVE=admin123 npm start
```

Sin `MONGODB_URI` guarda en un `data.json` local (usuarios incluidos),
ideal para practicar. Abre http://localhost:3000.
