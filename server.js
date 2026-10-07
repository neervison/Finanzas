// ============================================================
// MIS PAGOS — Servidor con usuarios
// - Cada persona se registra con nombre, correo y clave.
// - Cada usuario ve SOLO sus pagos y gastos (datos por usuario).
// - El administrador (creado con variables de entorno) puede ver
//   la lista de registrados (nombre y correo) y sus registros.
// - Datos en MongoDB Atlas (base "mispagos"); sin MONGODB_URI
//   usa data.json local para practicar.
//
// Variables de entorno:
//   MONGODB_URI   → cadena de conexión de tu Atlas.
//   ADMIN_NOMBRE  → nombre del administrador (ej: tu nombre).
//   ADMIN_CORREO  → correo del administrador (con ese entra).
//   ADMIN_CLAVE   → clave del administrador (mínimo 6 caracteres).
//   PORT          → puerto de Render (local: 3000).
// ============================================================
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ARCHIVO_LOCAL = path.join(__dirname, 'data.json');

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// CAPA DE DATOS — MongoDB Atlas o archivo local
// ============================================================
let Usuario = null, Estado = null, Sesion = null;
let dbLocal = null; // { usuarios: [], sesiones: [], estados: {} }

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, { dbName: 'mispagos' })
    .then(() => { console.log('✅ Conectado a MongoDB Atlas (base: mispagos)'); asegurarAdmin(); })
    .catch(err => console.error('❌ Error conectando a MongoDB:', err.message));
  Usuario = mongoose.model('Usuario', new mongoose.Schema({
    nombre: String,
    correo: { type: String, unique: true, lowercase: true },
    claveHash: String,
    rol: { type: String, default: 'usuario' },   // usuario | admin
    creado: { type: Date, default: Date.now }
  }));
  Estado = mongoose.model('Estado', new mongoose.Schema({
    clave: { type: String, unique: true },      // id del usuario dueño
    pagos: { type: Array, default: [] },
    gastos: { type: Array, default: [] },
    ingresos: { type: Array, default: [] },
    actualizado: { type: Date, default: Date.now }
  }));
  Sesion = mongoose.model('Sesion', new mongoose.Schema({
    token: { type: String, unique: true },
    usuarioId: String,
    creado: { type: Date, default: Date.now }
  }));
} else {
  console.log('⚠️ Sin MONGODB_URI: modo local, los datos van a data.json');
  cargarLocal();
  asegurarAdmin();
}

function enNube() { return !!(Usuario && mongoose.connection.readyState === 1); }

// ---------- Modo local (data.json) ----------
function cargarLocal() {
  try {
    const datos = JSON.parse(fs.readFileSync(ARCHIVO_LOCAL, 'utf8'));
    if (Array.isArray(datos.pagos) || Array.isArray(datos.gastos)) {
      // Formato antiguo (sin usuarios): todo queda como estado "principal"
      dbLocal = { usuarios: [], sesiones: [], estados: { principal: { pagos: datos.pagos || [], gastos: datos.gastos || [] } } };
    } else {
      dbLocal = { usuarios: datos.usuarios || [], sesiones: datos.sesiones || [], estados: datos.estados || {} };
    }
  } catch (e) {
    dbLocal = { usuarios: [], sesiones: [], estados: {} };
  }
}
function guardarLocal() { fs.writeFileSync(ARCHIVO_LOCAL, JSON.stringify(dbLocal, null, 2)); }

// ---------- Usuarios ----------
function publico(u) {
  return { id: String(u._id || u.id), nombre: u.nombre, correo: u.correo, rol: u.rol, creado: u.creado };
}
async function buscarPorCorreo(correo) {
  correo = String(correo || '').toLowerCase().trim();
  if (enNube()) return Usuario.findOne({ correo }).lean();
  return dbLocal.usuarios.find(u => u.correo === correo) || null;
}
async function buscarPorId(id) {
  if (enNube()) { try { return await Usuario.findById(id).lean(); } catch (e) { return null; } }
  return dbLocal.usuarios.find(u => u.id === id) || null;
}
async function crearUsuario({ nombre, correo, claveHash, rol }) {
  correo = String(correo).toLowerCase().trim();
  if (enNube()) {
    const u = await Usuario.create({ nombre, correo, claveHash, rol: rol || 'usuario' });
    return publico(u.toObject());
  }
  const u = { id: 'u' + Date.now() + Math.floor(Math.random() * 9999), nombre, correo, claveHash, rol: rol || 'usuario', creado: new Date().toISOString() };
  dbLocal.usuarios.push(u); guardarLocal();
  return publico(u);
}
async function listarUsuarios() {
  if (enNube()) return (await Usuario.find().sort({ creado: 1 }).lean()).map(publico);
  return dbLocal.usuarios.map(publico);
}
// El administrador nace de las variables de entorno (si están puestas)
async function asegurarAdmin() {
  const correo = process.env.ADMIN_CORREO, clave = process.env.ADMIN_CLAVE;
  if (!correo || !clave) return;
  try {
    const existe = await buscarPorCorreo(correo);
    if (!existe) {
      await crearUsuario({
        nombre: process.env.ADMIN_NOMBRE || 'Administrador',
        correo, claveHash: await bcrypt.hash(clave, 10), rol: 'admin'
      });
      console.log('👑 Administrador creado desde variables de entorno');
    }
  } catch (e) { console.error('Error creando admin:', e.message); }
}

// ---------- Sesiones (token opaco guardado en la base) ----------
async function crearSesion(usuarioId) {
  const token = crypto.randomBytes(24).toString('hex');
  if (enNube()) await Sesion.create({ token, usuarioId });
  else { dbLocal.sesiones.push({ token, usuarioId }); guardarLocal(); }
  return token;
}
async function buscarSesion(token) {
  if (!token) return null;
  if (enNube()) return Sesion.findOne({ token }).lean();
  return dbLocal.sesiones.find(s => s.token === token) || null;
}
async function borrarSesion(token) {
  if (enNube()) await Sesion.deleteOne({ token });
  else { dbLocal.sesiones = dbLocal.sesiones.filter(s => s.token !== token); guardarLocal(); }
}

// ---------- Estados (pagos/gastos de cada usuario) ----------
// Devuelve null si el usuario aún no tiene estado guardado.
async function leerEstado(clave) {
  if (enNube()) {
    const doc = await Estado.findOne({ clave }).lean();
    return doc ? { pagos: doc.pagos || [], gastos: doc.gastos || [], ingresos: doc.ingresos || [] } : null;
  }
  const est = dbLocal.estados[clave];
  return est ? { pagos: est.pagos || [], gastos: est.gastos || [], ingresos: est.ingresos || [] } : null;
}
async function guardarEstado(clave, pagos, gastos, ingresos) {
  if (enNube()) {
    await Estado.findOneAndUpdate({ clave }, { pagos, gastos, ingresos: ingresos || [], actualizado: new Date() }, { upsert: true });
  } else {
    dbLocal.estados[clave] = { pagos, gastos, ingresos: ingresos || [] }; guardarLocal();
  }
}

// ============================================================
// AUTENTICACIÓN
// ============================================================
async function auth(req, res, next) {
  const token = String(req.headers.authorization || '').replace('Bearer ', '');
  const ses = await buscarSesion(token);
  if (!ses) return res.status(401).json({ error: 'No has iniciado sesión' });
  const u = await buscarPorId(ses.usuarioId);
  if (!u) return res.status(401).json({ error: 'La sesión ya no es válida' });
  req.usuario = publico(u);
  req.token = token;
  next();
}
function soloAdmin(req, res, next) {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo el administrador puede ver esto' });
  next();
}

const correoValido = (c) => /.+@.+\..+/.test(String(c || '').trim());

// Al entrar un admin por primera vez, hereda los datos antiguos
// guardados como "principal" (lo que había antes de tener usuarios).
async function migrarPrincipalSiAdmin(usuario) {
  if (usuario.rol !== 'admin') return;
  const propio = await leerEstado(usuario.id);
  if (propio !== null) return;
  const viejo = await leerEstado('principal');
  if (viejo && (viejo.pagos.length || viejo.gastos.length || viejo.ingresos.length)) {
    await guardarEstado(usuario.id, viejo.pagos, viejo.gastos, viejo.ingresos);
    console.log('📦 Datos antiguos (principal) migrados al administrador');
  }
}

// ============================================================
// RUTAS
// ============================================================
app.get('/api/salud', (req, res) => res.json({ ok: true, modo: enNube() ? 'nube' : 'local' }));

// Registro de un usuario nuevo
app.post('/api/registro', async (req, res) => {
  const { nombre, correo, clave } = req.body || {};
  if (!String(nombre || '').trim()) return res.status(400).json({ error: 'Falta tu nombre' });
  if (!correoValido(correo)) return res.status(400).json({ error: 'El correo no es válido' });
  if (String(clave || '').length < 6) return res.status(400).json({ error: 'La clave debe tener al menos 6 caracteres' });
  try {
    if (await buscarPorCorreo(correo)) return res.status(409).json({ error: 'Ese correo ya está registrado' });
    const u = await crearUsuario({ nombre: String(nombre).trim(), correo, claveHash: await bcrypt.hash(String(clave), 10), rol: 'usuario' });
    const token = await crearSesion(u.id);
    res.status(201).json({ token, usuario: u });
  } catch (e) { res.status(500).json({ error: 'No se pudo crear la cuenta' }); }
});

// Ingreso (usuarios y administrador usan la misma ruta)
app.post('/api/login', async (req, res) => {
  const { correo, clave } = req.body || {};
  try {
    const u = await buscarPorCorreo(correo);
    if (!u || !(await bcrypt.compare(String(clave || ''), u.claveHash))) {
      return res.status(401).json({ error: 'Correo o clave incorrectos' });
    }
    const pub = publico(u);
    await migrarPrincipalSiAdmin(pub);
    const token = await crearSesion(pub.id);
    res.json({ token, usuario: pub });
  } catch (e) { res.status(500).json({ error: 'No se pudo ingresar' }); }
});

// Salir
app.post('/api/logout', auth, async (req, res) => {
  await borrarSesion(req.token);
  res.json({ ok: true });
});

// Datos del usuario en sesión
app.get('/api/datos', auth, async (req, res) => {
  const est = await leerEstado(req.usuario.id);
  res.json({ pagos: est?.pagos || [], gastos: est?.gastos || [], ingresos: est?.ingresos || [], modo: enNube() ? 'nube' : 'local' });
});
app.put('/api/datos', auth, async (req, res) => {
  const { pagos, gastos, ingresos } = req.body || {};
  if (!Array.isArray(pagos) || !Array.isArray(gastos)) {
    return res.status(400).json({ error: 'Formato inválido: se esperan pagos y gastos' });
  }
  await guardarEstado(req.usuario.id, pagos, gastos, Array.isArray(ingresos) ? ingresos : []);
  res.json({ ok: true, modo: enNube() ? 'nube' : 'local' });
});

// Administrador: lista de registrados (nombre y correo) con conteos
app.get('/api/admin/usuarios', auth, soloAdmin, async (req, res) => {
  const usuarios = await listarUsuarios();
  const salida = [];
  for (const u of usuarios) {
    const est = await leerEstado(u.id);
    salida.push({ ...u, numPagos: est?.pagos.length || 0, numGastos: est?.gastos.length || 0, numIngresos: est?.ingresos.length || 0 });
  }
  res.json(salida);
});
// ---------- Claves: restablecer la de un usuario (solo admin) ----------
// Actualiza el hash de la clave y cierra todas las sesiones de ese
// usuario, para que la clave antigua deje de servir al instante.
async function restablecerClave(id, claveHash) {
  if (enNube()) { await Usuario.findByIdAndUpdate(id, { claveHash }); }
  else {
    const u = dbLocal.usuarios.find(x => x.id === id);
    if (u) u.claveHash = claveHash;
  }
  if (enNube()) await Sesion.deleteMany({ usuarioId: id });
  else dbLocal.sesiones = dbLocal.sesiones.filter(s => s.usuarioId !== id);
  if (!enNube()) guardarLocal();
}

// Administrador: poner una clave nueva a un usuario que la olvidó.
// El admin la elige (mínimo 6 caracteres) y se la pasa a la persona.
app.post('/api/admin/usuarios/:id/restablecer-clave', auth, soloAdmin, async (req, res) => {
  const { clave } = req.body || {};
  if (String(clave || '').length < 6) return res.status(400).json({ error: 'La clave debe tener al menos 6 caracteres' });
  try {
    const u = await buscarPorId(req.params.id);
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    await restablecerClave(String(u._id || u.id), await bcrypt.hash(String(clave), 10));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'No se pudo restablecer la clave' }); }
});

// Administrador: ver los registros (pagos y gastos) de un usuario
app.get('/api/admin/usuarios/:id/datos', auth, soloAdmin, async (req, res) => {
  const u = await buscarPorId(req.params.id);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
  const est = await leerEstado(String(u._id || u.id));
  res.json({ usuario: publico(u), pagos: est?.pagos || [], gastos: est?.gastos || [], ingresos: est?.ingresos || [] });
});

app.listen(PORT, () => console.log(`🚀 Mis Pagos corriendo en puerto ${PORT}`));
