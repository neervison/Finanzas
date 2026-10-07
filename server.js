// ============================================================
// MIS PAGOS — Servidor
// Guarda los pagos y gastos en MongoDB Atlas (como PropinasApp)
// para que los datos vivan en la nube y no solo en el teléfono.
// Si no hay MONGODB_URI (ej: probando en el PC), usa un archivo
// local data.json — la app funciona igual, pero sin nube.
//
// Variables de entorno:
//   MONGODB_URI  → la misma cadena de conexión de tu Atlas
//                  (la base de datos "mispagos" se usa aparte,
//                  no se mezcla con PropinasApp).
//   PORT         → puerto que asigna Render (local: 3000).
// ============================================================
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ARCHIVO_LOCAL = path.join(__dirname, 'data.json');

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Conexión a MongoDB Atlas (si hay clave) ----------
let Estado = null; // modelo de Mongoose (un solo documento con todo)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, { dbName: 'mispagos' })
    .then(() => console.log('✅ Conectado a MongoDB Atlas (base: mispagos)'))
    .catch(err => console.error('❌ Error conectando a MongoDB:', err.message));
  const esquema = new mongoose.Schema({
    clave: { type: String, unique: true },          // siempre "principal"
    pagos: { type: Array, default: [] },
    gastos: { type: Array, default: [] },
    actualizado: { type: Date, default: Date.now }
  });
  Estado = mongoose.model('Estado', esquema);
} else {
  console.log('⚠️ Sin MONGODB_URI: modo local, los datos van a data.json');
}

// ---------- Lectura/escritura unificada (nube o archivo) ----------
async function leerDatos() {
  if (Estado && mongoose.connection.readyState === 1) {
    const doc = await Estado.findOne({ clave: 'principal' }).lean();
    return { pagos: doc?.pagos || [], gastos: doc?.gastos || [] };
  }
  try {
    const datos = JSON.parse(fs.readFileSync(ARCHIVO_LOCAL, 'utf8'));
    return { pagos: datos.pagos || [], gastos: datos.gastos || [] };
  } catch (e) {
    return { pagos: [], gastos: [] };
  }
}

async function guardarDatos(pagos, gastos) {
  if (Estado && mongoose.connection.readyState === 1) {
    await Estado.findOneAndUpdate(
      { clave: 'principal' },
      { pagos, gastos, actualizado: new Date() },
      { upsert: true }
    );
    return 'nube';
  }
  fs.writeFileSync(ARCHIVO_LOCAL, JSON.stringify({ pagos, gastos }, null, 2));
  return 'local';
}

// ---------- API ----------
// Estado del servidor (para diagnóstico)
app.get('/api/salud', (req, res) => {
  const nube = !!(Estado && mongoose.connection.readyState === 1);
  res.json({ ok: true, modo: nube ? 'nube' : 'local' });
});

// Traer todos los datos
app.get('/api/datos', async (req, res) => {
  try { res.json(await leerDatos()); }
  catch (e) { res.status(500).json({ error: 'No se pudieron leer los datos' }); }
});

// Guardar todos los datos (la app manda su estado completo)
app.put('/api/datos', async (req, res) => {
  const { pagos, gastos } = req.body || {};
  if (!Array.isArray(pagos) || !Array.isArray(gastos)) {
    return res.status(400).json({ error: 'Formato inválido: se esperan pagos y gastos' });
  }
  try {
    const modo = await guardarDatos(pagos, gastos);
    res.json({ ok: true, modo });
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron guardar los datos' });
  }
});

app.listen(PORT, () => console.log(`🚀 Mis Pagos corriendo en puerto ${PORT}`));
