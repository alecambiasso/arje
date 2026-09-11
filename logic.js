'use strict';
// Lógica pura de ARJE · Entreno (sin DOM). Se testea con node: tests/logic.test.js

function fechaISO(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function diasEntre(desdeISO, hastaISO) {
  const [a1, m1, d1] = desdeISO.split('-').map(Number);
  const [a2, m2, d2] = hastaISO.split('-').map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000);
}

function sumarDias(fechaIso, n) {
  const [a, m, d] = fechaIso.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + n));
  return f.getUTCFullYear() + '-' + String(f.getUTCMonth() + 1).padStart(2, '0') + '-' + String(f.getUTCDate()).padStart(2, '0');
}

function diaSemana(fechaIso) {
  const [a, m, d] = fechaIso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

// Semana 1 = la semana que arranca en la fecha de inicio. Antes de empezar devuelve 0.
function semanaPrograma(inicioISO, hoyISO) {
  const dias = diasEntre(inicioISO, hoyISO);
  if (dias < 0) return 0;
  return Math.floor(dias / 7) + 1;
}

function bloqueDe(semana) {
  return semana < 1 ? 1 : Math.ceil(semana / 4);
}

function semanaEnBloque(semana) {
  return semana < 1 ? 1 : ((semana - 1) % 4) + 1;
}

// Semanas 1–2: adaptación. Cada 8 semanas: descarga. El resto: normal.
function faseDe(semana) {
  if (semana <= 2) return 'adaptacion';
  if (semana % 8 === 0) return 'descarga';
  return 'normal';
}

const FASES = {
  adaptacion: { nombre: 'Adaptación', reserva: '3', detalle: 'Una serie menos por ejercicio y 3 repes en reserva. Aprendé los pesos y la técnica.' },
  descarga: { nombre: 'Descarga', reserva: '3–4', detalle: 'Mitad de las series y 10 % menos de peso. Recuperás para volver más fuerte.' },
  normal: { nombre: 'A full', reserva: '1–2', detalle: 'Todas las series, dejando 1–2 repes en reserva.' }
};

function seriesAjustadas(series, fase) {
  if (fase === 'adaptacion') return Math.max(2, series - 1);
  if (fase === 'descarga') return Math.max(1, Math.ceil(series / 2));
  return series;
}

function ejercicioDelSlot(slot, bloque) {
  const v = slot.variantes;
  return v[(Math.max(1, bloque) - 1) % v.length];
}

function reemplazosDe(slot, actualId) {
  const todos = slot.variantes.concat(slot.extra || []);
  return todos.filter((id, i) => id !== actualId && todos.indexOf(id) === i);
}

function diaParaWeekday(dias, weekday) {
  return Object.keys(dias).find(k => dias[k].weekday === weekday) || null;
}

// Próximo día de entrenamiento después de hoy (sin contar hoy).
function proximoDia(dias, hoyISO) {
  for (let i = 1; i <= 7; i++) {
    const f = sumarDias(hoyISO, i);
    const k = diaParaWeekday(dias, diaSemana(f));
    if (k) return { dia: k, fecha: f, enDias: i };
  }
  return null;
}

function redondearA(valor, paso) {
  if (!paso) return valor;
  return Math.round(valor / paso) * paso;
}

function e1rm(peso, reps) {
  if (!reps) return 0;
  if (!peso) return reps; // ejercicios con peso corporal: comparamos repes
  return peso * (1 + reps / 30);
}

// Doble progresión sobre la última vez que se hizo el ejercicio.
// seriesPrevias: [{w, r, hecho}] ; slot: {repMin, repMax} ; inc: kg por salto.
function sugerencia(seriesPrevias, slot, inc, fase) {
  const hechas = (seriesPrevias || []).filter(s => s.hecho && s.r > 0);
  if (!hechas.length) {
    return { tipo: 'nuevo', peso: null, texto: 'Primera vez: elegí un peso con el que llegues a ' + slot.repMax + ' dejando 3 en reserva.' };
  }
  const pesoTop = Math.max.apply(null, hechas.map(s => s.w || 0));
  const alTop = hechas.filter(s => (s.w || 0) === pesoTop);
  if (fase === 'descarga') {
    const p = inc ? redondearA(pesoTop * 0.9, inc) : pesoTop;
    return { tipo: 'descarga', peso: p, texto: 'Semana de descarga: ' + formatoPeso(p, inc) + ', sin buscar el fallo.' };
  }
  if (!inc) {
    const mejor = Math.max.apply(null, hechas.map(s => s.r));
    return { tipo: 'sumar', peso: pesoTop || null, texto: 'La vez pasada llegaste a ' + mejor + '. Buscá una más.' };
  }
  if (alTop.every(s => s.r >= slot.repMax) && alTop.length >= Math.min(2, hechas.length)) {
    const p = pesoTop + inc;
    return { tipo: 'subir', peso: p, texto: 'Subí a ' + formatoPeso(p, inc) + '.' };
  }
  if (alTop.some(s => s.r < slot.repMin)) {
    return { tipo: 'mantener', peso: pesoTop, texto: 'Mantené ' + formatoPeso(pesoTop, inc) + ' hasta llegar a ' + slot.repMin + ' en todas.' };
  }
  return { tipo: 'sumar', peso: pesoTop, texto: 'Mismo peso: sumá una repe por serie.' };
}

function formatoPeso(p, inc) {
  if (p == null) return '';
  if (inc === 0 && !p) return 'peso corporal';
  const t = (Math.round(p * 100) / 100).toString().replace('.', ',');
  return t + ' kg';
}

function parsearNumero(texto) {
  if (texto == null) return null;
  const t = String(texto).trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return isFinite(n) && n >= 0 ? n : null;
}

// ¿La serie supera el mejor e1RM previo? El primer registro no cuenta como récord.
function esRecord(recordPrevio, peso, reps) {
  if (!recordPrevio) return false;
  return e1rm(peso, reps) > recordPrevio.e1rm + 1e-9;
}

function actualizarRecord(recordPrevio, peso, reps, fecha) {
  const v = e1rm(peso, reps);
  if (!recordPrevio || v > recordPrevio.e1rm) return { e1rm: v, w: peso, r: reps, fecha };
  return recordPrevio;
}

function volumen(series) {
  return (series || []).filter(s => s.hecho).reduce((t, s) => t + (s.w || 0) * (s.r || 0), 0);
}

function controlVencido(controles, hoyISO) {
  if (!controles || !controles.length) return true;
  const ultimo = controles.map(c => c.fecha).sort().pop();
  return diasEntre(ultimo, hoyISO) >= 14;
}

function proximoControl(controles, inicioISO) {
  if (!controles || !controles.length) return inicioISO;
  const ultimo = controles.map(c => c.fecha).sort().pop();
  return sumarDias(ultimo, 14);
}

function preentrenoPermitido(hora) {
  const h = Number(String(hora).split(':')[0]);
  return h < 12;
}

// Última vez que se hizo un ejercicio (antes de la sesión actual).
function ultimasSeries(sesiones, ejId, excluirId) {
  const ordenadas = (sesiones || []).filter(s => s.id !== excluirId && s.fin).sort((a, b) => b.inicio - a.inicio);
  for (const s of ordenadas) {
    for (const slotId of Object.keys(s.ejercicios || {})) {
      const e = s.ejercicios[slotId];
      if (e.ej === ejId && e.series.some(x => x.hecho)) return { fecha: s.fecha, series: e.series };
    }
  }
  return null;
}

function sesionesDeLaSemana(sesiones, inicioISO, semana) {
  return (sesiones || []).filter(s => s.fin && semanaPrograma(inicioISO, s.fecha) === semana);
}

// Semanas seguidas (hasta la anterior a la actual) con al menos 3 sesiones.
function racha(sesiones, inicioISO, semanaActual) {
  let n = 0;
  for (let w = semanaActual - 1; w >= 1; w--) {
    if (sesionesDeLaSemana(sesiones, inicioISO, w).length >= 3) n++; else break;
  }
  if (sesionesDeLaSemana(sesiones, inicioISO, semanaActual).length >= 3) n++;
  return n;
}

function menuDeLaSemana(semana) {
  return semana % 2 === 0 ? 'B' : 'A';
}

if (typeof module !== 'undefined') {
  module.exports = {
    fechaISO, diasEntre, sumarDias, diaSemana, semanaPrograma, bloqueDe, semanaEnBloque, faseDe, FASES,
    seriesAjustadas, ejercicioDelSlot, reemplazosDe, diaParaWeekday, proximoDia, redondearA, e1rm,
    sugerencia, formatoPeso, parsearNumero, esRecord, actualizarRecord, volumen, controlVencido,
    proximoControl, preentrenoPermitido, ultimasSeries, sesionesDeLaSemana, racha, menuDeLaSemana
  };
}
