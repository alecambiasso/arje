'use strict';
// ARJE · Entreno — interfaz. Depende de icons.js, data.js y logic.js.
(function () {
  const CLAVE = 'arje.v1';
  const VERSION_APP = '1.0.0';
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DIAS_NOMBRE = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const INICIALES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // ---------- Estado ----------
  function estadoInicial() {
    return { v: 1, inicio: '2026-09-14', sesiones: [], activa: null, records: {}, controles: [], habitos: {}, compras: {}, ajustes: { sedes: {} }, timer: null, puesto: {} };
  }
  function cargar() {
    try {
      const t = localStorage.getItem(CLAVE);
      if (t) return Object.assign(estadoInicial(), JSON.parse(t));
    } catch (e) { /* sin almacenamiento: arrancamos vacío */ }
    return estadoInicial();
  }
  let S = cargar();
  let guardarPendiente = null;
  function guardar() {
    clearTimeout(guardarPendiente);
    guardarPendiente = null;
    try { localStorage.setItem(CLAVE, JSON.stringify(S)); }
    catch (e) { toast('No pude guardar. Exportá un backup desde Ajustes.', 'neutro'); }
  }
  function guardarLuego() {
    clearTimeout(guardarPendiente);
    guardarPendiente = setTimeout(guardar, 400);
  }
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* opcional */ }

  // UI efímera (no se guarda)
  const UI = { clavesAbiertas: {}, movilidadAbierta: true, formControl: false, menu: null, pausa: null, tablaControl: false, borrar: false };

  const $app = document.getElementById('app');
  const $timer = document.getElementById('timer');
  const $tabs = document.getElementById('tabs');
  const $capa = document.getElementById('capa');

  // ---------- Utilidades ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function hoy() { return fechaISO(new Date()); }
  function fechaLarga(iso) {
    const [a, m, d] = iso.split('-').map(Number);
    return DIAS_NOMBRE[diaSemana(iso)] + ' ' + d + ' de ' + MESES[m - 1];
  }
  function fechaCorta(iso) { const p = iso.split('-'); return Number(p[2]) + '/' + Number(p[1]); }
  function mmss(seg) {
    seg = Math.max(0, Math.round(seg));
    return Math.floor(seg / 60) + ':' + String(seg % 60).padStart(2, '0');
  }
  function num(n, dec) {
    if (n == null || isNaN(n)) return '—';
    const f = Math.pow(10, dec == null ? 1 : dec);
    return String(Math.round(n * f) / f).replace('.', ',');
  }
  function ctx(fecha) {
    const real = semanaPrograma(S.inicio, fecha);
    const semana = Math.max(1, real);
    return { semana, bloque: bloqueDe(semana), sb: semanaEnBloque(semana), fase: faseDe(semana), antes: real === 0 };
  }
  function incDe(ejId) { return INCREMENTO[EJERCICIOS[ejId].tipo]; }
  function sedeDe(dia) { return (S.ajustes.sedes && S.ajustes.sedes[dia]) || DIAS[dia].sede; }
  function sesionActiva() { return S.activa ? S.sesiones.find(s => s.id === S.activa) || null : null; }
  function sesionHechaHoy(dia) {
    const f = hoy();
    return S.sesiones.find(s => s.fin && s.fecha === f && (!dia || s.dia === dia)) || null;
  }
  function habitosHoy() {
    const f = hoy();
    if (!S.habitos[f]) S.habitos[f] = { creatina: false, proteina: 0, pasos: false, agua: false, pausas: 0 };
    return S.habitos[f];
  }

  // ---------- Avisos, hojas y sonido ----------
  let toastT = null;
  function toast(msg, tipo, ico) {
    const viejo = document.querySelector('.toast');
    if (viejo) viejo.remove();
    const el = document.createElement('div');
    el.className = 'toast' + (tipo === 'neutro' ? ' neutro' : '');
    el.setAttribute('role', 'status');
    el.innerHTML = (ico ? icono(ico) : '') + '<span></span>';
    el.querySelector('span').textContent = msg;
    document.body.appendChild(el);
    clearTimeout(toastT);
    toastT = setTimeout(() => el.remove(), tipo === 'neutro' ? 2600 : 3200);
  }
  function abrirHoja(html, etiqueta) {
    $capa.innerHTML = '<div class="velo" data-a="cerrar-hoja"><div class="hoja" role="dialog" aria-modal="true" aria-label="' + esc(etiqueta || 'Detalle') + '" data-stop>' + html + '</div></div>';
    const b = $capa.querySelector('button, [tabindex]');
    if (b) b.focus();
  }
  function cerrarHoja() { $capa.innerHTML = ''; }
  function cabHoja(titulo) {
    return '<div class="hoja-cab"><h2>' + esc(titulo) + '</h2><button class="btn-icono" data-a="cerrar-hoja" aria-label="Cerrar">' + icono('x') + '</button></div>';
  }

  let audio = null;
  function desbloquearAudio() {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
    } catch (e) { audio = null; }
  }
  function pitido(veces) {
    try {
      if (!audio) return;
      for (let i = 0; i < (veces || 3); i++) {
        const o = audio.createOscillator(), g = audio.createGain();
        const t0 = audio.currentTime + i * 0.22;
        o.frequency.value = i === (veces || 3) - 1 ? 1175 : 880;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
        o.connect(g).connect(audio.destination);
        o.start(t0); o.stop(t0 + 0.18);
      }
    } catch (e) { /* sin sonido */ }
    try { if (navigator.vibrate) navigator.vibrate([180, 80, 180]); } catch (e) { /* iPhone no vibra desde la web */ }
  }

  let wake = null;
  async function pedirPantallaEncendida() {
    try { if ('wakeLock' in navigator && !wake && document.visibilityState === 'visible') { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch (e) { wake = null; }
  }
  function soltarPantalla() { try { if (wake) wake.release(); } catch (e) { /* nada */ } wake = null; }

  // ---------- Pestañas ----------
  const TABS = [
    { id: 'hoy', nombre: 'Hoy', ico: 'flame' },
    { id: 'semana', nombre: 'Semana', ico: 'calendar-days' },
    { id: 'progreso', nombre: 'Progreso', ico: 'trending-up' },
    { id: 'comida', nombre: 'Comida', ico: 'utensils' },
    { id: 'pausa', nombre: 'Pausa', ico: 'armchair' }
  ];
  function ruta() {
    const h = (location.hash || '#/hoy').slice(2).split('/');
    return { vista: h[0] || 'hoy', arg: h[1] || null };
  }
  function renderTabs(vista) {
    const activa = vista === 'entreno' || vista === 'ajustes' ? 'hoy' : vista;
    $tabs.innerHTML = TABS.map(t => '<a class="tab" href="#/' + t.id + '"' + (t.id === activa ? ' aria-current="page"' : '') + '>' + icono(t.ico) + '<span>' + t.nombre + '</span></a>').join('');
  }

  // ---------- Vista: Hoy ----------
  function encabezado(extra) {
    return '<header class="encabezado"><div class="marca"><img src="icons/marca.svg" alt=""><span>ARJE</span></div>' + (extra || '') + '</header>';
  }

  function tiraSemana(c) {
    const f = hoy();
    const dow = diaSemana(f) === 0 ? 7 : diaSemana(f);
    const lunes = sumarDias(f, 1 - dow);
    let html = '<div class="semana-dias" aria-label="Tu semana">';
    for (let i = 0; i < 7; i++) {
      const d = sumarDias(lunes, i);
      const k = diaParaWeekday(DIAS, diaSemana(d));
      const hecho = S.sesiones.some(s => s.fin && s.fecha === d);
      const cls = 'sd' + (k ? ' entreno' : '') + (hecho ? ' hecho' : '') + (d === f ? ' hoy' : '');
      const lab = DIAS_NOMBRE[diaSemana(d)] + (k ? ', día de ' + DIAS[k].titulo.toLowerCase() : ', descanso') + (hecho ? ', hecho' : '');
      html += '<div class="' + cls + '" aria-label="' + esc(lab) + '"><span>' + INICIALES[i] + '</span><i></i></div>';
    }
    return html + '</div>';
  }

  function tarjetaHabitos() {
    const h = habitosHoy();
    const b = (clave, ico, txt, activo, extra) => '<button class="habito" data-a="habito" data-k="' + clave + '" aria-pressed="' + activo + '">' + icono(ico) + (extra || '') + '<span>' + txt + '</span></button>';
    return '<section class="tarjeta"><div class="fila entre"><h3>Hábitos de hoy</h3><span class="etiqueta">' + fechaCorta(hoy()) + '</span></div>' +
      '<div class="habitos" style="margin-top:12px">' +
      b('creatina', 'flask-conical', 'Creatina', h.creatina) +
      b('proteina', 'beef', 'Proteína', h.proteina >= 4, '<span class="num">' + h.proteina + '/4</span>') +
      b('pasos', 'footprints', '8.000+ pasos', h.pasos) +
      b('agua', 'droplet', '2,5 L agua', h.agua) +
      '</div><p class="chico suave" style="margin-top:10px">Proteína: tocá una vez por cada porción de unos 40 g.</p></section>';
  }

  function vistaHoy() {
    const f = hoy();
    const c = ctx(f);
    const activa = sesionActiva();
    const diaHoy = diaParaWeekday(DIAS, diaSemana(f));
    const hecha = sesionHechaHoy();
    let hero = '';

    if (activa) {
      const d = DIAS[activa.dia];
      hero = '<section class="tarjeta hero"><span class="etiqueta">Entreno en curso</span><h1>' + esc(d.titulo) + '</h1>' +
        '<p class="suave" style="margin-top:8px">' + esc(d.nombre) + ' · ' + esc(SEDES[activa.sede].nombre) + ' · <span id="t-sesion-hoy">' + mmss((Date.now() - activa.inicio) / 1000) + '</span></p>' +
        '<a class="btn primario bloque" style="margin-top:20px" href="#/entreno">' + icono('play') + 'Seguir</a></section>';
    } else if (c.antes) {
      const faltan = diasEntre(f, S.inicio);
      const d = DIAS[diaParaWeekday(DIAS, diaSemana(S.inicio)) || 'lunes'];
      hero = '<section class="tarjeta hero"><span class="etiqueta">Arrancás el ' + esc(fechaLarga(S.inicio)) + '</span><h1>' + (faltan === 1 ? 'Mañana arranca' : 'Faltan ' + faltan + ' días') + '</h1>' +
        '<p class="suave" style="margin-top:8px">Primera sesión: ' + esc(d.titulo) + '. Ese día, antes de entrenar, cargás el primer control: peso, cintura y brazo. Llevá una cinta métrica.</p>' +
        '<div class="fila envolver" style="margin-top:20px"><a class="btn secundario crece" href="#/semana">Ver la rutina</a><button class="btn fantasma" data-a="empezar" data-dia="lunes">Probar una sesión</button></div></section>';
    } else if (hecha) {
      const prox = proximoDia(DIAS, f);
      hero = '<section class="tarjeta hero hecha"><span class="etiqueta">' + esc(fechaLarga(f)) + '</span><h1>Listo por hoy</h1>' +
        '<p class="suave" style="margin-top:8px">' + esc(DIAS[hecha.dia].titulo) + ' · ' + mmss((hecha.fin - hecha.inicio) / 1000) + ' · ' + contarSeries(hecha) + ' series.</p>' +
        (prox ? '<p class="chico" style="margin-top:12px">Próximo: <b>' + esc(DIAS[prox.dia].nombre) + ' · ' + esc(DIAS[prox.dia].titulo) + '</b></p>' : '') +
        '<button class="btn fantasma" style="margin-top:8px;padding:0" data-a="ver-sesion" data-id="' + hecha.id + '">Ver el detalle</button></section>';
    } else if (diaHoy) {
      hero = heroDia(diaHoy, c, 'Hoy');
    } else {
      const prox = proximoDia(DIAS, f);
      hero = '<section class="tarjeta hero"><span class="etiqueta">' + esc(fechaLarga(f)) + '</span><h1>Hoy descansás</h1>' +
        '<p class="suave" style="margin-top:8px">El músculo crece mientras recuperás. Sumá pasos y hacé tus pausas activas.</p>' +
        (prox ? '<p class="chico" style="margin-top:12px">' + (prox.enDias === 1 ? 'Mañana' : 'El ' + DIAS[prox.dia].nombre.toLowerCase()) + ': <b>' + esc(DIAS[prox.dia].titulo) + '</b> · ' + esc(SEDES[sedeDe(prox.dia)].nombre) + '</p>' : '') + '</section>';
    }

    const controlBanner = !c.antes && controlVencido(S.controles, f) ?
      '<a class="tarjeta fila" href="#/progreso" style="text-decoration:none;color:inherit;border-color:rgba(255,181,71,.45)"><span class="icono-caja ascua">' + icono('ruler') + '</span><span class="crece"><b>Toca control</b><br><span class="chico suave">Peso, cintura y brazo. Tarda 2 minutos.</span></span>' + icono('chevron-right') + '</a>' : '';

    const otros = !activa ? '<section class="tarjeta"><h3>¿Entrenás otro día?</h3><p class="chico suave" style="margin-top:4px">Si cambiaste el día, arrancá la sesión que te toque.</p><div class="chips" style="margin-top:12px">' +
      ORDEN_DIAS.map(k => '<button class="chip" data-a="empezar" data-dia="' + k + '">' + esc(DIAS[k].nombre) + '</button>').join('') + '</div></section>' : '';

    const fase = FASES[c.fase];
    const semanaCard = '<section class="tarjeta"><div class="fila entre"><h3>Semana ' + c.semana + '</h3><span class="chip fuego">' + esc(fase.nombre) + '</span></div>' +
      '<p class="chico suave" style="margin:4px 0 14px">Bloque ' + c.bloque + ' · semana ' + c.sb + ' de 4</p>' + tiraSemana(c) + '</section>';

    const pausa = '<a class="tarjeta fila" href="#/pausa" style="text-decoration:none;color:inherit"><span class="icono-caja">' + icono('armchair') + '</span><span class="crece"><b>Pausa activa</b><br><span class="chico suave">4 minutos para el cuello y la espalda · hoy: ' + habitosHoy().pausas + '</span></span>' + icono('chevron-right') + '</a>';

    return encabezado('<a class="btn-icono" href="#/ajustes" aria-label="Ajustes">' + icono('settings') + '</a>') +
      '<div class="pila">' + hero + controlBanner + semanaCard + tarjetaHabitos() + pausa + otros + '</div>' + bannerActualizacion();
  }

  function heroDia(dia, c, prefijo) {
    const d = DIAS[dia];
    const sede = sedeDe(dia);
    const nEj = d.slots.length;
    const man = new Date().getHours() < 12;
    return '<section class="tarjeta hero"><span class="etiqueta">' + esc(prefijo) + ' · ' + esc(d.nombre) + '</span><h1>' + esc(d.titulo) + '</h1>' +
      '<div class="chips" style="margin-top:14px"><span class="chip">' + icono('dumbbell', 's') + nEj + ' ejercicios</span><span class="chip">' + icono('clock', 's') + '75–90 min</span><span class="chip fuego">' + esc(FASES[c.fase].nombre) + '</span></div>' +
      '<div style="margin-top:16px"><span class="etiqueta">Sede</span><div class="segmentos" style="margin-top:6px">' +
      Object.keys(SEDES).map(k => '<button class="segmento" data-a="sede" data-dia="' + dia + '" data-sede="' + k + '" aria-pressed="' + (k === sede) + '">' + esc(SEDES[k].nombre) + '</button>').join('') + '</div></div>' +
      '<p class="chico suave" style="margin-top:12px">' + icono('zap', 's') + ' ' + (man ? 'Sesión de mañana: preentreno 30 minutos antes (media dosis las primeras veces).' : 'Sesión de tarde: sin preentreno con cafeína, así dormís bien.') + '</p>' +
      '<button class="btn primario bloque" style="margin-top:20px" data-a="empezar" data-dia="' + dia + '">' + icono('play') + 'Empezar</button></section>';
  }

  function contarSeries(s) {
    let n = 0;
    Object.keys(s.ejercicios).forEach(k => { n += s.ejercicios[k].series.filter(x => x.hecho).length; });
    return n;
  }

  // ---------- Sesión ----------
  function crearSesion(dia) {
    const f = hoy();
    const c = ctx(f);
    const d = DIAS[dia];
    const ejercicios = {};
    d.slots.forEach(slot => { ejercicios[slot.id] = armarSlot(slot, ejercicioDelSlot(slot, c.bloque), c.fase); });
    const circuitos = {};
    d.circuitos.forEach(ci => { circuitos[ci.id] = Array(ci.vueltas).fill(false); });
    const s = {
      id: 's' + Date.now().toString(36), fecha: f, dia, sede: sedeDe(dia), semana: c.semana, bloque: c.bloque, fase: c.fase,
      inicio: Date.now(), fin: null, ejercicios, circuitos, movilidad: Array(MOVILIDAD.length).fill(false), cardio: false
    };
    S.sesiones.push(s);
    S.activa = s.id;
    guardar();
    return s;
  }

  function armarSlot(slot, ejId, fase) {
    const n = seriesAjustadas(slot.series, fase);
    const prev = ultimasSeries(S.sesiones, ejId, S.activa);
    const sug = sugerencia(prev && prev.series, slot, incDe(ejId), fase);
    const w0 = sug.peso != null ? sug.peso : null;
    const series = [];
    for (let i = 0; i < n; i++) series.push({ w: w0, r: null, hecho: false });
    return { ej: ejId, series };
  }

  function metaSlot(slot, fase) {
    const n = seriesAjustadas(slot.series, fase);
    return n + ' × ' + slot.repMin + '–' + slot.repMax;
  }

  function vistaEntreno() {
    const s = sesionActiva();
    if (!s) { location.hash = '#/hoy'; return ''; }
    const d = DIAS[s.dia];
    let total = 0, hechas = 0;
    Object.keys(s.ejercicios).forEach(k => { total += s.ejercicios[k].series.length; hechas += s.ejercicios[k].series.filter(x => x.hecho).length; });
    const pct = total ? Math.round(hechas / total * 100) : 0;

    let html = '<div class="barra-sesion"><div class="fila entre"><div class="crece"><span class="etiqueta">' + esc(d.nombre) + ' · ' + esc(SEDES[s.sede].nombre) + ' · ' + esc(FASES[s.fase].nombre) + '</span>' +
      '<h2 style="margin-top:2px">' + esc(d.titulo) + '</h2></div><div class="num" style="font-size:26px;font-weight:700" id="t-sesion" aria-label="Tiempo de entrenamiento">' + mmss((Date.now() - s.inicio) / 1000) + '</div></div>' +
      '<div class="progreso" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="Series hechas"><i style="width:' + pct + '%"></i></div></div>';

    if (semanaPrograma(S.inicio, s.fecha) === 0) {
      html += '<div class="aviso">' + icono('info', 's') + '<span>Sesión de prueba: el programa arranca el ' + esc(fechaLarga(S.inicio)) + '. Cuando termines de mirar, descartala.</span></div>';
    }
    // Movilidad
    const movHechos = s.movilidad.filter(Boolean).length;
    html += '<section class="tarjeta"><button class="fila entre" style="width:100%;min-height:44px" data-a="toggle-movilidad" aria-expanded="' + UI.movilidadAbierta + '"><span class="fila"><span class="icono-caja">' + icono('person-standing') + '</span><span style="text-align:left"><b>Movilidad</b><br><span class="chico suave">10 minutos · ' + movHechos + '/' + MOVILIDAD.length + '</span></span></span>' + icono(UI.movilidadAbierta ? 'chevron-left' : 'chevron-right') + '</button>';
    if (UI.movilidadAbierta) {
      html += '<ul class="lista-check">' + MOVILIDAD.map((m, i) => '<li><button class="item-check" data-a="movilidad" data-i="' + i + '" aria-pressed="' + !!s.movilidad[i] + '"><span class="caja">' + icono('check', 's') + '</span><span class="txt">' + esc(m.nombre) + '</span><span class="dosis">' + esc(m.dosis) + '</span></button></li>').join('') + '</ul>';
    }
    html += '</section>';

    // Ejercicios, agrupando superseries
    let i = 0;
    while (i < d.slots.length) {
      const slot = d.slots[i];
      if (slot.superserie) {
        const grupo = [];
        while (i < d.slots.length && d.slots[i].superserie === slot.superserie) { grupo.push(d.slots[i]); i++; }
        html += '<div class="grupo-ss"><div class="superserie">' + icono('repeat-2', 's') + 'Superserie ' + slot.superserie + ' · una serie de cada uno y después descansás</div>' +
          grupo.map(g => tarjetaEjercicio(s, g)).join('') + '</div>';
      } else {
        html += tarjetaEjercicio(s, slot);
        i++;
      }
    }

    // Circuitos
    d.circuitos.forEach(ci => {
      const v = s.circuitos[ci.id] || [];
      html += '<section class="tarjeta' + (ci.fuego ? ' hero' : '') + '"><div class="fila entre"><h3>' + (ci.fuego ? icono('flame', 's') + ' ' : '') + esc(ci.nombre) + '</h3><span class="etiqueta">' + ci.vueltas + ' vueltas</span></div>' +
        ci.ejercicios.map(e => '<div class="circuito-fila"><span class="crece">' + esc(EJERCICIOS[e.ej].nombre) + '<br><span class="chico suave">' + esc(EJERCICIOS[e.ej].claves[0]) + '</span></span><span class="chico" style="text-align:right">' + esc(e.dosis) + '</span></div>').join('') +
        '<div class="vueltas">' + v.map((h, j) => '<button class="vuelta" data-a="vuelta" data-c="' + ci.id + '" data-i="' + j + '" aria-pressed="' + h + '" aria-label="Vuelta ' + (j + 1) + '">' + (h ? icono('check', 's') : 'Vuelta ' + (j + 1)) + '</button>').join('') + '</div></section>';
    });

    // Cardio
    html += '<section class="tarjeta"><button class="item-check" data-a="cardio" aria-pressed="' + !!s.cardio + '"><span class="caja">' + icono('check', 's') + '</span><span class="txt crece"><b>' + esc(d.cardio.nombre) + ' · ' + d.cardio.min + ' min</b><br><span class="chico suave">' + esc(d.cardio.detalle) + '</span></span>' + icono(d.cardio.nombre === 'Bici' ? 'bike' : 'heart-pulse') + '</button></section>';

    html += '<button class="btn primario bloque" data-a="terminar">' + icono('circle-check') + 'Terminar entrenamiento</button>' +
      '<button class="btn fantasma bloque" style="margin-top:8px" data-a="descartar">Descartar esta sesión</button>';
    return '<div class="pila">' + html + '</div>';
  }

  function tarjetaEjercicio(s, slot) {
    const reg = s.ejercicios[slot.id];
    const ej = EJERCICIOS[reg.ej];
    const inc = incDe(reg.ej);
    const corporal = inc === 0;
    const prev = ultimasSeries(S.sesiones, reg.ej, s.id);
    const sug = sugerencia(prev && prev.series, slot, inc, s.fase);
    const abierta = !!UI.clavesAbiertas[slot.id];
    const hechas = reg.series.filter(x => x.hecho).length;
    const completo = hechas === reg.series.length && hechas > 0;

    let h = '<section class="tarjeta ej' + (completo ? ' hecha' : '') + '" id="ej-' + slot.id + '">' +
      '<div class="ej-cab"><div class="crece">' + (slot.principal ? '<span class="chip fuego" style="min-height:24px;padding:2px 10px;font-size:12px;margin-bottom:6px">Principal</span>' : '') +
      '<h3>' + esc(ej.nombre) + '</h3>' +
      '<p class="ej-meta"><b>' + metaSlot(slot, s.fase) + '</b> · ' + (slot.descanso ? 'descanso ' + mmss(slot.descanso) : 'sin descanso') + ' · ' + FASES[s.fase].reserva + ' en reserva</p></div>' +
      '<button class="btn-icono" data-a="claves" data-slot="' + slot.id + '" aria-label="Técnica" aria-expanded="' + abierta + '">' + icono('info') + '</button>' +
      '<button class="btn-icono" data-a="reemplazo" data-slot="' + slot.id + '" aria-label="Cambiar ejercicio">' + icono('repeat-2') + '</button></div>';

    if (abierta) {
      h += '<ul class="claves">' + ej.claves.map(k => '<li>' + esc(k) + '</li>').join('') + '</ul>' +
        '<a class="btn fantasma" style="padding:0" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=' + encodeURIComponent(ej.nombre + ' técnica') + '">' + icono('external-link', 's') + 'Ver videos (necesita señal)</a>';
    }
    if (slot.nota) h += '<p class="chico" style="margin-top:10px;color:var(--color-texto-2)">' + icono('flame', 's') + ' ' + esc(slot.nota) + '</p>';

    const icoSug = { subir: 'trending-up', mantener: 'info', sumar: 'plus', nuevo: 'sparkles', descarga: 'snowflake' }[sug.tipo];
    h += '<div class="sugerencia ' + sug.tipo + '">' + icono(icoSug, 's') + '<span>' + esc(sug.texto) +
      (prev ? '<br><span class="suave">La vez pasada (' + fechaCorta(prev.fecha) + '): ' + prev.series.filter(x => x.hecho).map(x => (corporal ? '' : num(x.w) + '×') + x.r).join(' · ') + '</span>' : '') + '</span></div>';

    h += '<div class="series"><div class="series-cab"><span>#</span><span style="text-align:center">' + (corporal ? 'Extra kg' : 'Kg') + '</span><span style="text-align:center">Repes</span><span></span></div>';
    reg.series.forEach((x, i) => {
      h += '<div class="serie' + (x.hecho ? ' hecha' : '') + (x.record ? ' record' : '') + '">' +
        '<span class="serie-n">' + (x.record ? icono('trophy', 's') : (i + 1)) + '</span>' +
        '<input class="campo" inputmode="decimal" enterkeyhint="next" aria-label="Kilos serie ' + (i + 1) + '" data-slot="' + slot.id + '" data-i="' + i + '" data-k="w" value="' + (x.w != null ? num(x.w, 2) : '') + '" placeholder="' + (corporal ? '0' : 'kg') + '">' +
        '<input class="campo" inputmode="numeric" enterkeyhint="done" aria-label="Repeticiones serie ' + (i + 1) + '" data-slot="' + slot.id + '" data-i="' + i + '" data-k="r" value="' + (x.r != null ? x.r : '') + '" placeholder="' + slot.repMin + '–' + slot.repMax + '">' +
        '<button class="check" data-a="serie" data-slot="' + slot.id + '" data-i="' + i + '" aria-pressed="' + x.hecho + '" aria-label="' + (x.hecho ? 'Desmarcar' : 'Marcar hecha') + ' la serie ' + (i + 1) + '">' + icono('check') + '</button></div>';
    });
    h += '</div><div class="series-acciones"><button class="btn fantasma" data-a="menos-serie" data-slot="' + slot.id + '">' + icono('minus', 's') + 'Serie</button>' +
      '<button class="btn fantasma" data-a="mas-serie" data-slot="' + slot.id + '">' + icono('plus', 's') + 'Serie</button></div></section>';
    return h;
  }

  function slotDe(s, slotId) { return DIAS[s.dia].slots.find(x => x.id === slotId); }

  function marcarSerie(slotId, i) {
    const s = sesionActiva(); if (!s) return;
    const reg = s.ejercicios[slotId];
    const x = reg.series[i];
    const slot = slotDe(s, slotId);
    desbloquearAudio();
    if (x.hecho) { x.hecho = false; x.record = false; guardar(); render(); return; }
    const card = document.getElementById('ej-' + slotId);
    const inW = card && card.querySelector('input[data-i="' + i + '"][data-k="w"]');
    const inR = card && card.querySelector('input[data-i="' + i + '"][data-k="r"]');
    const corporal = incDe(reg.ej) === 0;
    const w = parsearNumero(inW ? inW.value : x.w);
    const r = parsearNumero(inR ? inR.value : x.r);
    if (r == null || r === 0) { toast('Anotá las repes que hiciste', 'neutro'); if (inR) inR.focus(); return; }
    if (!corporal && (w == null)) { toast('Anotá el peso', 'neutro'); if (inW) inW.focus(); return; }
    x.w = corporal ? (w || 0) : w; x.r = Math.round(r); x.hecho = true; x.ts = Date.now();
    // Arrastrar el peso a las series siguientes vacías
    for (let j = i + 1; j < reg.series.length; j++) if (!reg.series[j].hecho && reg.series[j].w == null) reg.series[j].w = x.w;
    // Récord: contra el récord previo y lo hecho antes en esta sesión
    const previo = S.records[reg.ej];
    let mejorSesion = 0;
    reg.series.forEach((y, j) => { if (j !== i && y.hecho) mejorSesion = Math.max(mejorSesion, e1rm(y.w, y.r)); });
    x.record = esRecord(previo, x.w, x.r) && e1rm(x.w, x.r) > mejorSesion;
    guardar();
    render();
    if (x.record) toast('Récord en ' + EJERCICIOS[reg.ej].nombre.split(' ').slice(0, 3).join(' '), null, 'trophy');
    // Descanso
    const d = DIAS[s.dia];
    const idx = d.slots.indexOf(slot);
    const sig = d.slots[idx + 1];
    if (slot.superserie && sig && sig.superserie === slot.superserie) {
      if (!x.record) toast('Ahora: ' + EJERCICIOS[s.ejercicios[sig.id].ej].nombre, 'neutro');
    } else if (slot.descanso) {
      iniciarTimer(slot.descanso);
    }
  }

  function terminarSesion() {
    const s = sesionActiva(); if (!s) return;
    s.fin = Date.now();
    const records = [];
    let vol = 0, series = 0;
    Object.keys(s.ejercicios).forEach(k => {
      const reg = s.ejercicios[k];
      reg.series.filter(x => x.hecho).forEach(x => {
        series++; vol += (x.w || 0) * x.r;
        const antes = S.records[reg.ej];
        S.records[reg.ej] = actualizarRecord(S.records[reg.ej], x.w, x.r, s.fecha);
        if (antes && S.records[reg.ej] !== antes && records.indexOf(reg.ej) < 0) records.push(reg.ej);
      });
    });
    S.activa = null; S.timer = null;
    guardar();
    soltarPantalla();
    renderTimer();
    irA('#/hoy', () => abrirHoja(cabHoja('Buen entrenamiento') +
      '<div class="stat-grid"><div class="stat"><span class="num">' + mmss((s.fin - s.inicio) / 1000) + '</span><span class="etiqueta">Duración</span></div>' +
      '<div class="stat"><span class="num">' + series + '</span><span class="etiqueta">Series</span></div>' +
      '<div class="stat"><span class="num">' + num(vol / 1000, 1) + '</span><span class="etiqueta">Toneladas</span></div></div>' +
      (records.length ? '<div style="margin-top:16px"><span class="etiqueta">Récords</span><div class="chips" style="margin-top:8px">' + records.map(r => '<span class="chip record">' + icono('trophy', 's') + esc(EJERCICIOS[r].nombre) + '</span>').join('') + '</div></div>' : '<p class="chico suave" style="margin-top:16px">Sin récords hoy. La constancia también suma.</p>') +
      '<button class="btn primario bloque" style="margin-top:24px" data-a="cerrar-hoja">Listo</button>', 'Resumen'));
  }
  function irA(hash, despues) {
    if (location.hash === hash) { render(); if (despues) despues(); return; }
    UI.despues = despues || null;
    location.hash = hash;
  }

  // ---------- Temporizador ----------
  function iniciarTimer(seg) {
    S.timer = { fin: Date.now() + seg * 1000, total: seg, avisado: false };
    guardarLuego();
    renderTimer();
  }
  function renderTimer() {
    const t = S.timer;
    const enEntreno = ruta().vista === 'entreno';
    if (!t || !enEntreno) { $timer.innerHTML = ''; $app.classList.remove('con-timer'); return; }
    $app.classList.add('con-timer');
    const resta = (t.fin - Date.now()) / 1000;
    const listo = resta <= 0;
    $timer.innerHTML = '<div class="timer' + (listo ? ' listo' : '') + '" role="timer" aria-live="off"><div class="timer-caja" style="--pct:' + Math.max(0, Math.min(100, (1 - resta / t.total) * 100)) + '%">' +
      '<div class="timer-t" id="timer-t">' + (listo ? 'Dale' : mmss(resta)) + '</div><div class="crece chico suave">' + (listo ? 'A la próxima serie' : 'Descanso') + '</div>' +
      '<button class="btn-icono" data-a="timer-mas" data-v="-15" aria-label="Quitar 15 segundos">' + icono('minus') + '</button>' +
      '<button class="btn-icono" data-a="timer-mas" data-v="15" aria-label="Sumar 15 segundos">' + icono('plus') + '</button>' +
      '<button class="btn-icono" data-a="timer-fin" aria-label="Cerrar descanso">' + icono('x') + '</button></div></div>';
  }
  function tick() {
    const s = sesionActiva();
    if (s) {
      const el = document.getElementById('t-sesion') || document.getElementById('t-sesion-hoy');
      if (el) el.textContent = mmss((Date.now() - s.inicio) / 1000);
    }
    const t = S.timer;
    if (t && ruta().vista === 'entreno') {
      const resta = (t.fin - Date.now()) / 1000;
      const el = document.getElementById('timer-t');
      const caja = $timer.querySelector('.timer-caja');
      if (resta <= 0 && !t.avisado) { t.avisado = true; pitido(3); guardarLuego(); renderTimer(); }
      else if (el && resta > 0) { el.textContent = mmss(resta); if (caja) caja.style.setProperty('--pct', Math.min(100, (1 - resta / t.total) * 100) + '%'); }
      if (resta < -20) { S.timer = null; renderTimer(); guardarLuego(); }
    }
    if (UI.pausa && UI.pausa.corriendo) tickPausa();
  }

  // ---------- Vista: Semana ----------
  function vistaSemana() {
    const c = ctx(hoy());
    const fase = FASES[c.fase];
    let html = '<h1>Semana ' + c.semana + '</h1><p class="suave" style="margin-top:4px">Bloque ' + c.bloque + ' · semana ' + c.sb + ' de 4' + (c.antes ? ' · arrancás el ' + fechaLarga(S.inicio) : '') + '</p>' +
      '<section class="tarjeta hero"><span class="chip fuego">' + esc(fase.nombre) + '</span><p style="margin-top:10px">' + esc(fase.detalle) + '</p></section>';
    ORDEN_DIAS.forEach(k => {
      const d = DIAS[k];
      html += '<section class="tarjeta"><span class="etiqueta">' + esc(d.nombre) + ' · ' + esc(SEDES[sedeDe(k)].nombre) + ' · ' + esc(d.hora) + '</span><h2 style="margin-top:4px">' + esc(d.titulo) + '</h2><div style="margin-top:8px">';
      d.slots.forEach(slot => {
        const ej = EJERCICIOS[ejercicioDelSlot(slot, c.bloque)];
        html += '<div class="circuito-fila"><span class="crece">' + (slot.principal ? icono('flame', 's') + ' ' : '') + esc(ej.nombre) + (slot.superserie ? ' <span class="chico" style="color:var(--color-primario)">SS ' + slot.superserie + '</span>' : '') + '</span><span class="num" style="font-size:18px;font-weight:600">' + metaSlot(slot, c.fase) + '</span></div>';
      });
      d.circuitos.forEach(ci => { html += '<div class="circuito-fila"><span class="crece">' + esc(ci.nombre) + '<br><span class="chico suave">' + ci.ejercicios.map(e => EJERCICIOS[e.ej].nombre).join(' + ') + '</span></span><span class="num" style="font-size:18px;font-weight:600">' + ci.vueltas + ' vueltas</span></div>'; });
      html += '<div class="circuito-fila"><span class="crece">' + esc(d.cardio.nombre) + '</span><span class="num" style="font-size:18px;font-weight:600">' + d.cardio.min + ' min</span></div></div>' +
        '<button class="btn secundario bloque" style="margin-top:12px" data-a="empezar" data-dia="' + k + '">Empezar ' + esc(d.nombre.toLowerCase()) + '</button></section>';
    });
    html += '<section class="tarjeta"><h3>Las reglas</h3><ul class="claves">' +
      '<li><b>Doble progresión:</b> cuando hacés el tope del rango en todas las series, la próxima vez subís el peso. La app te avisa.</li>' +
      '<li><b>Reserva:</b> cada serie termina dejando ' + esc(fase.reserva) + ' repes en el tanque.</li>' +
      '<li><b>Bloques de 4 semanas:</b> los principales (' + icono('flame', 's') + ') quedan fijos; los accesorios cambian en cada bloque.</li>' +
      '<li><b>Descarga:</b> cada 8 semanas, una semana liviana.</li>' +
      '<li><b>Superseries:</b> una serie de cada ejercicio y recién ahí descansás.</li></ul></section>';
    return '<div class="pila">' + html + '</div>';
  }

  // ---------- Vista: Progreso ----------
  const METRICAS = [
    { k: 'peso', nombre: 'Peso', unidad: 'kg', ayuda: 'En ayunas, después de ir al baño.' },
    { k: 'cintura', nombre: 'Cintura', unidad: 'cm', ayuda: 'A la altura del ombligo, relajado, sin apretar la cinta.' },
    { k: 'brazo', nombre: 'Brazo', unidad: 'cm', ayuda: 'Brazo derecho relajado, en la mitad entre hombro y codo.' }
  ];

  function vistaProgreso() {
    const f = hoy();
    const c = ctx(f);
    const estaSemana = c.antes ? 0 : sesionesDeLaSemana(S.sesiones, S.inicio, c.semana).length;
    const total = S.sesiones.filter(s => s.fin).length;
    let html = '<h1>Progreso</h1><div class="stat-grid">' +
      '<div class="stat"><span class="num">' + estaSemana + '<small class="suave" style="font-size:18px">/4</small></span><span class="etiqueta">Esta semana</span></div>' +
      '<div class="stat"><span class="num">' + (c.antes ? 0 : racha(S.sesiones, S.inicio, c.semana)) + '</span><span class="etiqueta">Semanas en racha</span></div>' +
      '<div class="stat"><span class="num">' + total + '</span><span class="etiqueta">Entrenamientos</span></div></div>';

    // Control
    const vencido = controlVencido(S.controles, f);
    const mostrarForm = vencido || UI.formControl;
    html += '<section class="tarjeta' + (vencido ? ' hero' : '') + '"><div class="fila entre"><h3>Control</h3><span class="etiqueta">' + (vencido ? 'Toca hoy' : 'Próximo: ' + fechaCorta(proximoControl(S.controles, S.inicio))) + '</span></div>';
    if (mostrarForm) {
      html += '<form data-f="control" style="margin-top:12px"><div class="form-grid">' +
        METRICAS.map(m => '<label class="campo-et"><span>' + m.nombre + ' (' + m.unidad + ')</span><input class="campo" name="' + m.k + '" inputmode="decimal" placeholder="—" required></label>').join('') +
        '</div><ul class="claves" style="margin-top:10px">' + METRICAS.map(m => '<li><b>' + m.nombre + ':</b> ' + esc(m.ayuda) + '</li>').join('') + '</ul>' +
        '<button class="btn primario bloque" style="margin-top:14px" type="submit">Guardar control</button></form>';
    } else {
      html += '<p class="chico suave" style="margin-top:6px">Cada dos semanas, el mismo día y a la misma hora.</p><button class="btn fantasma" style="padding:0" data-a="form-control">Cargar uno igual</button>';
    }
    html += '</section>';

    if (S.controles.length) {
      const orden = S.controles.slice().sort((a, b) => a.fecha < b.fecha ? -1 : 1);
      METRICAS.forEach(m => {
        const pts = orden.filter(x => x[m.k] != null).map(x => ({ fecha: x.fecha, v: x[m.k] }));
        if (!pts.length) return;
        const ult = pts[pts.length - 1].v, pri = pts[0].v, dif = ult - pri;
        html += '<section class="tarjeta metrica"><span class="etiqueta">' + m.nombre + '</span><div class="fila entre" style="margin-top:4px"><span class="valor">' + num(ult) + '<small>' + m.unidad + '</small></span>' +
          (pts.length > 1 ? '<span class="delta">' + (dif > 0 ? '+' : dif < 0 ? '−' : '') + num(Math.abs(dif)) + ' ' + m.unidad + ' desde el ' + fechaCorta(pts[0].fecha) + '</span>' : '<span class="delta suave">Primer registro</span>') + '</div>' +
          (pts.length > 1 ? grafico(pts, m.unidad, m.nombre) : '') + '</section>';
      });
      html += '<section class="tarjeta"><button class="fila entre" style="width:100%;min-height:44px" data-a="tabla-control" aria-expanded="' + UI.tablaControl + '"><h3>Todos los controles</h3>' + icono(UI.tablaControl ? 'chevron-left' : 'chevron-right') + '</button>' +
        (UI.tablaControl ? '<div style="overflow-x:auto"><table class="tabla"><thead><tr><th>Fecha</th><th class="n">Peso</th><th class="n">Cintura</th><th class="n">Brazo</th><th></th></tr></thead><tbody>' +
          orden.slice().reverse().map(x => '<tr><td>' + fechaCorta(x.fecha) + '</td><td class="n">' + num(x.peso) + '</td><td class="n">' + num(x.cintura) + '</td><td class="n">' + num(x.brazo) + '</td><td><button class="btn-icono" data-a="borrar-control" data-fecha="' + x.fecha + '" aria-label="Borrar control del ' + fechaCorta(x.fecha) + '">' + icono('x', 's') + '</button></td></tr>').join('') +
          '</tbody></table></div>' : '') + '</section>';
    }

    // Récords
    const conRecord = Object.keys(S.records).filter(k => EJERCICIOS[k]);
    const principales = ORDEN_DIAS.map(k => DIAS[k].slots[0].variantes[0]);
    const listaRec = principales.concat(conRecord.filter(k => principales.indexOf(k) < 0));
    html += '<section class="tarjeta"><h3>Récords</h3>' + (conRecord.length ? '' : '<p class="chico suave" style="margin-top:6px">Aparecen después de tu primer entrenamiento.</p>') +
      '<div style="margin-top:8px">' + listaRec.filter(k => S.records[k]).map(k => {
        const r = S.records[k];
        return '<div class="fila-lista"><span class="icono-caja ascua">' + icono('trophy', 's') + '</span><span class="crece">' + esc(EJERCICIOS[k].nombre) + '<br><span class="chico suave">' + fechaCorta(r.fecha) + (incDe(k) ? ' · máximo estimado ' + num(r.e1rm, 1) + ' kg' : '') + '</span></span><span class="meta-valor">' + (incDe(k) ? num(r.w) + '×' + r.r : r.r + ' rep') + '</span></div>';
      }).join('') + '</div></section>';

    // Historial
    const hist = S.sesiones.filter(s => s.fin).sort((a, b) => b.inicio - a.inicio).slice(0, 12);
    html += '<section class="tarjeta"><h3>Historial</h3>' + (hist.length ? '' : '<p class="chico suave" style="margin-top:6px">Todavía no hay entrenamientos terminados.</p>') + '<div style="margin-top:8px">' +
      hist.map(s => '<button class="fila-lista" style="width:100%;text-align:left" data-a="ver-sesion" data-id="' + s.id + '"><span class="icono-caja">' + icono('dumbbell', 's') + '</span><span class="crece">' + esc(DIAS[s.dia].titulo) + '<br><span class="chico suave">' + esc(fechaLarga(s.fecha)) + ' · ' + esc(SEDES[s.sede].nombre) + '</span></span><span class="chico suave">' + mmss((s.fin - s.inicio) / 1000) + '</span></button>').join('') + '</div></section>';
    return '<div class="pila">' + html + '</div>';
  }

  // Gráfico de línea de una sola serie (small multiple por métrica): 2px, puntos de 8px, cruz + tooltip.
  function grafico(pts, unidad, nombre) {
    const W = 320, H = 120, pl = 8, pr = 8, pt = 14, pb = 22;
    const vs = pts.map(p => p.v);
    let min = Math.min.apply(null, vs), max = Math.max.apply(null, vs);
    if (max - min < 1) { min -= 0.5; max += 0.5; }
    const pad = (max - min) * 0.15; min -= pad; max += pad;
    const x = i => pl + (pts.length === 1 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (pts.length - 1));
    const y = v => pt + (1 - (v - min) / (max - min)) * (H - pt - pb);
    const linea = pts.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1)).join(' ');
    const datos = esc(JSON.stringify(pts.map((p, i) => ({ x: x(i) / W, y: y(p.v) / H, v: num(p.v) + ' ' + unidad, f: fechaCorta(p.fecha) }))));
    return '<div class="grafico" data-puntos="' + datos + '" role="img" aria-label="' + esc(nombre + ': ' + pts.map(p => fechaCorta(p.fecha) + ' ' + num(p.v) + ' ' + unidad).join(', ')) + '">' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" style="height:auto">' +
      '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + (H - pb) + '" y2="' + (H - pb) + '" stroke="var(--color-borde)" stroke-width="1" vector-effect="non-scaling-stroke"/>' +
      '<line class="cruz" x1="0" x2="0" y1="' + pt + '" y2="' + (H - pb) + '" stroke="var(--color-borde-fuerte)" stroke-width="1" vector-effect="non-scaling-stroke" visibility="hidden"/>' +
      '<path d="' + linea + '" fill="none" stroke="var(--color-primario)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
      pts.map((p, i) => '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.v).toFixed(1) + '" r="4" fill="var(--color-primario)" stroke="var(--color-superficie)" stroke-width="2" vector-effect="non-scaling-stroke"/>').join('') +
      '<text x="' + pl + '" y="' + (H - 6) + '" fill="var(--color-texto-suave)" font-size="11" font-family="Barlow">' + fechaCorta(pts[0].fecha) + '</text>' +
      '<text x="' + (W - pr) + '" y="' + (H - 6) + '" fill="var(--color-texto-suave)" font-size="11" font-family="Barlow" text-anchor="end">' + fechaCorta(pts[pts.length - 1].fecha) + '</text>' +
      '</svg><div class="tip" hidden></div></div>';
  }
  function activarGraficos() {
    document.querySelectorAll('.grafico').forEach(g => {
      const pts = JSON.parse(g.getAttribute('data-puntos'));
      const tip = g.querySelector('.tip'), cruz = g.querySelector('.cruz'), svg = g.querySelector('svg');
      const mostrar = ev => {
        const r = svg.getBoundingClientRect();
        const fx = (ev.clientX - r.left) / r.width;
        let best = 0;
        pts.forEach((p, i) => { if (Math.abs(p.x - fx) < Math.abs(pts[best].x - fx)) best = i; });
        const p = pts[best];
        cruz.setAttribute('x1', p.x * 320); cruz.setAttribute('x2', p.x * 320); cruz.setAttribute('visibility', 'visible');
        tip.hidden = false; tip.textContent = '';
        const b = document.createElement('b'); b.textContent = p.v; tip.appendChild(b);
        tip.appendChild(document.createTextNode(p.f));
        tip.style.left = Math.min(Math.max(p.x * r.width, 40), r.width - 40) + 'px';
        tip.style.top = (p.y * r.height) + 'px';
      };
      const ocultar = () => { tip.hidden = true; cruz.setAttribute('visibility', 'hidden'); };
      g.addEventListener('pointerdown', mostrar);
      g.addEventListener('pointermove', mostrar);
      g.addEventListener('pointerleave', ocultar);
    });
  }

  function detalleSesion(id) {
    const s = S.sesiones.find(x => x.id === id); if (!s) return;
    const d = DIAS[s.dia];
    let h = cabHoja(d.titulo) + '<p class="suave">' + esc(fechaLarga(s.fecha)) + ' · ' + esc(SEDES[s.sede].nombre) + ' · ' + mmss(((s.fin || Date.now()) - s.inicio) / 1000) + '</p>';
    Object.keys(s.ejercicios).forEach(k => {
      const reg = s.ejercicios[k];
      const hechas = reg.series.filter(x => x.hecho);
      if (!hechas.length) return;
      h += '<div class="fila-lista"><span class="crece">' + esc(EJERCICIOS[reg.ej].nombre) + '</span><span class="chico" style="text-align:right">' + hechas.map(x => (incDe(reg.ej) ? num(x.w) + '×' : '') + x.r).join(' · ') + '</span></div>';
    });
    h += '<button class="btn fantasma bloque" style="margin-top:12px;color:var(--color-error)" data-a="borrar-sesion" data-id="' + s.id + '">Borrar este entrenamiento</button>';
    abrirHoja(h, 'Detalle del entrenamiento');
  }

  // ---------- Vista: Comida ----------
  function vistaComida() {
    const c = ctx(hoy());
    const menuK = UI.menu || menuDeLaSemana(c.semana);
    const menu = COMIDA.menus[menuK];
    const claveCompras = 's' + c.semana + menuK;
    const marcados = (S.compras[claveCompras] || {});
    let html = '<h1>Comida</h1><p class="suave" style="margin-top:4px">Pautas simples para la recomposición.</p>';
    html += '<section class="tarjeta"><h3>Tus metas</h3><div style="margin-top:4px">' + COMIDA.metas.map(m => '<div class="fila-lista"><span class="icono-caja">' + icono(m.icono) + '</span><span class="crece"><span class="meta-valor">' + esc(m.valor) + '</span> <span class="chico suave">' + esc(m.unidad) + '</span><br><span class="chico">' + esc(m.detalle) + '</span></span></div>').join('') + '</div></section>';
    html += '<section class="tarjeta"><h3>Un día tipo</h3>' + COMIDA.dia.map(d => '<div class="fila-lista" style="align-items:flex-start"><span class="etiqueta" style="width:88px;padding-top:3px;flex:none">' + esc(d.momento) + '</span><span class="crece chico">' + d.opciones.map(esc).join('<br><span class="suave">o </span>') + '</span></div>').join('') +
      '<div class="aviso" style="margin-top:12px">' + icono('dumbbell', 's') + '<span>' + COMIDA.entreno.map(esc).join('<br>') + '</span></div></section>';
    html += '<section class="tarjeta"><h3>Suplementos</h3>' + COMIDA.suplementos.map(s => '<div class="fila-lista" style="align-items:flex-start"><span class="icono-caja">' + icono(s.nombre.indexOf('Preentreno') === 0 ? 'zap' : s.nombre.indexOf('Creatina') === 0 ? 'flask-conical' : 'beef') + '</span><span class="crece"><b>' + esc(s.nombre) + '</b> · <span class="chico">' + esc(s.dosis) + '</span><br><span class="chico suave">' + esc(s.detalle) + '</span></span></div>').join('') + '</section>';
    html += '<section class="tarjeta"><div class="fila entre"><h3>Cocina del finde</h3>' + icono('chef-hat') + '</div>' +
      '<div class="segmentos" style="margin-top:12px">' + ['A', 'B'].map(k => '<button class="segmento" data-a="menu" data-m="' + k + '" aria-pressed="' + (k === menuK) + '">Menú ' + k + (k === menuDeLaSemana(c.semana) ? ' · esta semana' : '') + '</button>').join('') + '</div>' +
      '<h3 style="margin-top:16px">' + esc(menu.nombre) + '</h3><p class="chico suave" style="margin-top:4px">' + esc(menu.taperes) + '. ' + esc(COMIDA.porcion) + '</p>' +
      '<ol class="claves" style="margin-top:12px">' + menu.pasos.map(p => '<li>' + esc(p) + '</li>').join('') + '</ol>' +
      '<div class="aviso" style="margin-top:12px">' + icono('refrigerator', 's') + '<span>' + esc(COMIDA.conservacion) + '</span></div></section>';
    const grupos = Object.assign({}, menu.compras, COMIDA.basicos);
    html += '<section class="tarjeta"><div class="fila entre"><h3>Lista del súper</h3><button class="btn fantasma" data-a="limpiar-compras" data-k="' + claveCompras + '">Desmarcar</button></div>' +
      Object.keys(grupos).map(g => '<p class="etiqueta" style="margin-top:14px">' + esc(g) + '</p><ul class="lista-check" style="margin-top:4px">' + grupos[g].map(it => '<li><button class="item-check" data-a="compra" data-k="' + claveCompras + '" data-item="' + esc(it) + '" aria-pressed="' + !!marcados[it] + '"><span class="caja">' + icono('check', 's') + '</span><span class="txt">' + esc(it) + '</span></button></li>').join('') + '</ul>').join('') + '</section>';
    html += '<p class="chico suave">' + esc(COMIDA.aviso) + '</p>';
    return '<div class="pila">' + html + '</div>';
  }

  // ---------- Vista: Pausa activa ----------
  function vistaPausa() {
    const p = UI.pausa;
    let html = '<h1>Pausa activa</h1><p class="suave" style="margin-top:4px">4 minutos, dos o tres veces por día en la oficina. Hoy: ' + habitosHoy().pausas + '.</p>';
    if (p) {
      const paso = PAUSA_ACTIVA[p.i];
      const resta = Math.max(0, p.resta);
      const circ = 2 * Math.PI * 92;
      html += '<section class="tarjeta hero" style="text-align:center"><span class="etiqueta">Paso ' + (p.i + 1) + ' de ' + PAUSA_ACTIVA.length + '</span><h2 style="margin-top:6px">' + esc(paso.nombre) + '</h2>' +
        '<div class="pausa-reloj"><svg viewBox="0 0 200 200" width="200" height="200" aria-hidden="true"><circle cx="100" cy="100" r="92" fill="none" stroke="var(--color-superficie-2)" stroke-width="8"/><circle id="pausa-arco" cx="100" cy="100" r="92" fill="none" stroke="var(--color-primario)" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + (circ * (1 - resta / paso.seg)).toFixed(1) + '"/></svg><span class="num" id="pausa-t">' + Math.ceil(resta) + '</span></div>' +
        '<p>' + esc(paso.clave) + '</p><div class="fila" style="margin-top:20px;justify-content:center">' +
        '<button class="btn-icono" data-a="pausa-ant" aria-label="Paso anterior">' + icono('chevron-left') + '</button>' +
        '<button class="btn primario" style="min-width:140px" data-a="pausa-toggle">' + icono(p.corriendo ? 'pause' : 'play') + (p.corriendo ? 'Pausar' : 'Seguir') + '</button>' +
        '<button class="btn-icono" data-a="pausa-sig" aria-label="Paso siguiente">' + icono('skip-forward') + '</button></div>' +
        '<button class="btn fantasma" style="margin-top:8px" data-a="pausa-salir">Terminar acá</button></section>';
    } else {
      html += '<section class="tarjeta hero"><ul class="lista-check" style="margin-top:0">' + PAUSA_ACTIVA.map(x => '<li class="fila" style="min-height:44px;padding:6px 0"><span class="crece">' + esc(x.nombre) + '</span><span class="chico suave">' + x.seg + ' s</span></li>').join('') + '</ul>' +
        '<button class="btn primario bloque" style="margin-top:16px" data-a="pausa-empezar">' + icono('play') + 'Empezar pausa</button></section>';
    }
    html += '<section class="tarjeta"><div class="fila entre"><h3>Alarmas del iPhone</h3>' + icono('clock') + '</div><p class="chico suave" style="margin-top:4px">La app no puede mandarte notificaciones. Creá estas alarmas en Reloj → Alarmas → + → Repetir.</p>' +
      '<table class="tabla" style="margin-top:8px"><tbody>' + ALARMAS.map(a => '<tr><td class="num" style="font-size:20px;font-weight:700;width:64px">' + esc(a.hora) + '</td><td>' + esc(a.para) + '<br><span class="chico suave">' + esc(a.dias) + '</span></td></tr>').join('') + '</tbody></table></section>';
    html += '<section class="tarjeta"><h3>Tu puesto en la oficina</h3><ul class="lista-check">' + PUESTO.map((x, i) => '<li><button class="item-check" data-a="puesto" data-i="' + i + '" aria-pressed="' + !!S.puesto[i] + '"><span class="caja">' + icono('check', 's') + '</span><span class="txt">' + esc(x) + '</span></button></li>').join('') + '</ul></section>';
    return '<div class="pila">' + html + '</div>';
  }
  function tickPausa() {
    const p = UI.pausa;
    const ahora = Date.now();
    p.resta -= (ahora - p.ult) / 1000; p.ult = ahora;
    if (p.resta <= 0) {
      desbloquearAudio(); pitido(p.i === PAUSA_ACTIVA.length - 1 ? 3 : 1);
      if (p.i < PAUSA_ACTIVA.length - 1) { p.i++; p.resta = PAUSA_ACTIVA[p.i].seg; render(); }
      else { terminarPausa(true); }
      return;
    }
    const t = document.getElementById('pausa-t'), a = document.getElementById('pausa-arco');
    if (t) t.textContent = Math.ceil(p.resta);
    if (a) { const circ = 2 * Math.PI * 92; a.setAttribute('stroke-dashoffset', (circ * (1 - p.resta / PAUSA_ACTIVA[p.i].seg)).toFixed(1)); }
  }
  function terminarPausa(completa) {
    UI.pausa = null;
    if (completa) { habitosHoy().pausas++; guardar(); toast('Pausa hecha. Tu cuello lo agradece.', 'neutro'); }
    render();
  }

  // ---------- Vista: Ajustes ----------
  let nuevaVersion = null;
  function bannerActualizacion() {
    return nuevaVersion ? '<button class="tarjeta fila" style="width:100%;margin-top:16px;border-color:var(--color-primario);text-align:left" data-a="actualizar"><span class="icono-caja">' + icono('download') + '</span><span class="crece"><b>Hay una versión nueva de ARJE</b><br><span class="chico suave">Tocá para actualizar. Tus datos quedan.</span></span></button>' : '';
  }
  function vistaAjustes() {
    let html = '<div class="fila"><a class="btn-icono" href="#/hoy" aria-label="Volver">' + icono('chevron-left') + '</a><h1>Ajustes</h1></div>';
    html += '<section class="tarjeta"><h3>Programa</h3><form data-f="inicio" style="margin-top:12px"><label class="campo-et"><span>Fecha de inicio (semana 1)</span><input class="campo texto" type="date" name="inicio" value="' + esc(S.inicio) + '"></label><button class="btn secundario bloque" style="margin-top:12px" type="submit">Guardar fecha</button></form></section>';
    html += '<section class="tarjeta"><h3>Tus datos</h3><p class="chico suave" style="margin-top:4px">Todo se guarda en este iPhone. Exportá un backup cada tanto (por ejemplo, a tus Archivos o a tu mail).</p>' +
      '<div class="fila" style="margin-top:12px"><button class="btn secundario crece" data-a="exportar">' + icono('share', 's') + 'Exportar</button><label class="btn secundario crece" style="cursor:pointer">' + icono('download', 's') + 'Importar<input type="file" accept="application/json,.json" data-f="importar" hidden></label></div></section>';
    html += '<section class="tarjeta"><h3>Instalar en el iPhone</h3><ol class="claves"><li>Abrí la dirección en <b>Safari</b>.</li><li>Tocá el botón de compartir (el cuadrado con la flecha).</li><li>Elegí <b>Agregar a pantalla de inicio</b> y después <b>Agregar</b>.</li><li>Abrila siempre desde el ícono: funciona sin señal.</li></ol></section>';
    html += '<section class="tarjeta"><h3>Borrar todo</h3><p class="chico suave" style="margin-top:4px">Borra entrenamientos, controles y récords de este iPhone. No se puede deshacer.</p>' +
      (UI.borrar ? '<div class="fila" style="margin-top:12px"><button class="btn secundario crece" data-a="borrar-no">Cancelar</button><button class="btn crece" style="background:var(--color-error);color:var(--carbon-950)" data-a="borrar-si">Sí, borrar</button></div>' : '<button class="btn fantasma" style="padding:0;color:var(--color-error)" data-a="borrar-todo">Borrar todos los datos</button>') + '</section>';
    html += bannerActualizacion();
    html += '<p class="pie">ARJE ' + VERSION_APP + ' · del griego arjé: principio, origen.<br>Íconos Lucide (ISC) · Tipografía Barlow (OFL).</p>';
    return '<div class="pila">' + html + '</div>';
  }

  function exportar() {
    const texto = JSON.stringify(S, null, 1);
    const nombre = 'arje-backup-' + hoy() + '.json';
    try {
      const archivo = new File([texto], nombre, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        navigator.share({ files: [archivo], title: 'Backup de ARJE' }).catch(() => {});
        return;
      }
    } catch (e) { /* seguimos con la descarga */ }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
    a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  }
  function importar(archivo) {
    const lector = new FileReader();
    lector.onload = () => {
      try {
        const datos = JSON.parse(lector.result);
        if (!datos || datos.v !== 1 || !Array.isArray(datos.sesiones)) throw new Error('formato');
        S = Object.assign(estadoInicial(), datos);
        guardar(); toast('Backup importado', 'neutro'); render();
      } catch (e) { toast('Ese archivo no es un backup de ARJE', 'neutro'); }
    };
    lector.readAsText(archivo);
  }

  // ---------- Render ----------
  function render() {
    const r = ruta();
    const y = window.scrollY;
    let html = '';
    if (r.vista === 'entreno') html = vistaEntreno();
    else if (r.vista === 'semana') html = vistaSemana();
    else if (r.vista === 'progreso') html = vistaProgreso();
    else if (r.vista === 'comida') html = vistaComida();
    else if (r.vista === 'pausa') html = vistaPausa();
    else if (r.vista === 'ajustes') html = vistaAjustes();
    else html = vistaHoy();
    $app.innerHTML = html;
    renderTabs(r.vista);
    renderTimer();
    if (r.vista === 'progreso') activarGraficos();
    if (r.vista === 'entreno' && sesionActiva()) pedirPantallaEncendida();
    window.scrollTo(0, y);
  }

  // ---------- Eventos ----------
  document.addEventListener('click', ev => {
    const el = ev.target.closest('[data-a]');
    if (!el) return;
    if (el.getAttribute('data-a') === 'cerrar-hoja' && ev.target.closest('[data-stop]') && !ev.target.closest('button[data-a="cerrar-hoja"]')) return;
    const a = el.getAttribute('data-a');
    const s = sesionActiva();
    switch (a) {
      case 'cerrar-hoja': cerrarHoja(); break;
      case 'empezar': {
        desbloquearAudio();
        if (s) { location.hash = '#/entreno'; break; }
        crearSesion(el.getAttribute('data-dia'));
        UI.movilidadAbierta = true; UI.clavesAbiertas = {};
        location.hash = '#/entreno'; window.scrollTo(0, 0); render();
        break;
      }
      case 'sede': S.ajustes.sedes[el.getAttribute('data-dia')] = el.getAttribute('data-sede'); guardar(); render(); break;
      case 'habito': {
        const h = habitosHoy(), k = el.getAttribute('data-k');
        if (k === 'proteina') h.proteina = (h.proteina + 1) % 5; else h[k] = !h[k];
        guardar(); render(); break;
      }
      case 'toggle-movilidad': UI.movilidadAbierta = !UI.movilidadAbierta; render(); break;
      case 'movilidad': if (s) { const i = +el.getAttribute('data-i'); s.movilidad[i] = !s.movilidad[i]; if (s.movilidad.every(Boolean)) UI.movilidadAbierta = false; guardar(); render(); } break;
      case 'claves': { const k = el.getAttribute('data-slot'); UI.clavesAbiertas[k] = !UI.clavesAbiertas[k]; render(); break; }
      case 'reemplazo': abrirReemplazo(el.getAttribute('data-slot')); break;
      case 'elegir-reemplazo': elegirReemplazo(el.getAttribute('data-slot'), el.getAttribute('data-ej')); break;
      case 'serie': marcarSerie(el.getAttribute('data-slot'), +el.getAttribute('data-i')); break;
      case 'mas-serie': if (s) { const reg = s.ejercicios[el.getAttribute('data-slot')]; const u = reg.series[reg.series.length - 1]; reg.series.push({ w: u ? u.w : null, r: null, hecho: false }); guardar(); render(); } break;
      case 'menos-serie': if (s) { const reg = s.ejercicios[el.getAttribute('data-slot')]; if (reg.series.length > 1 && !reg.series[reg.series.length - 1].hecho) { reg.series.pop(); guardar(); render(); } else toast('No se puede quitar una serie hecha', 'neutro'); } break;
      case 'vuelta': if (s) { const c = s.circuitos[el.getAttribute('data-c')]; const i = +el.getAttribute('data-i'); c[i] = !c[i]; guardar(); render(); } break;
      case 'cardio': if (s) { s.cardio = !s.cardio; guardar(); render(); } break;
      case 'terminar': {
        if (!s) break;
        if (!contarSeries(s)) { toast('Marcá al menos una serie, o descartá la sesión', 'neutro'); break; }
        terminarSesion(); break;
      }
      case 'descartar':
        abrirHoja(cabHoja('¿Descartar la sesión?') + '<p class="suave">Se borra lo que anotaste hoy en esta sesión.</p><div class="fila" style="margin-top:20px"><button class="btn secundario crece" data-a="cerrar-hoja">Seguir entrenando</button><button class="btn crece" style="background:var(--color-error);color:var(--carbon-950)" data-a="descartar-si">Descartar</button></div>', 'Descartar sesión');
        break;
      case 'descartar-si':
        S.sesiones = S.sesiones.filter(x => x.id !== S.activa); S.activa = null; S.timer = null; guardar(); soltarPantalla(); cerrarHoja(); location.hash = '#/hoy'; render(); break;
      case 'timer-mas': if (S.timer) { S.timer.fin += (+el.getAttribute('data-v')) * 1000; S.timer.total = Math.max(15, S.timer.total + (+el.getAttribute('data-v'))); S.timer.avisado = false; guardarLuego(); renderTimer(); } break;
      case 'timer-fin': S.timer = null; guardarLuego(); renderTimer(); break;
      case 'ver-sesion': detalleSesion(el.getAttribute('data-id')); break;
      case 'borrar-sesion': S.sesiones = S.sesiones.filter(x => x.id !== el.getAttribute('data-id')); recalcularRecords(); guardar(); cerrarHoja(); render(); break;
      case 'form-control': UI.formControl = true; render(); break;
      case 'tabla-control': UI.tablaControl = !UI.tablaControl; render(); break;
      case 'borrar-control': S.controles = S.controles.filter(x => x.fecha !== el.getAttribute('data-fecha')); guardar(); render(); break;
      case 'menu': UI.menu = el.getAttribute('data-m'); render(); break;
      case 'compra': { const k = el.getAttribute('data-k'); const it = el.getAttribute('data-item'); S.compras[k] = S.compras[k] || {}; S.compras[k][it] = !S.compras[k][it]; guardar(); render(); break; }
      case 'limpiar-compras': S.compras[el.getAttribute('data-k')] = {}; guardar(); render(); break;
      case 'puesto': { const i = el.getAttribute('data-i'); S.puesto[i] = !S.puesto[i]; guardar(); render(); break; }
      case 'pausa-empezar': desbloquearAudio(); UI.pausa = { i: 0, resta: PAUSA_ACTIVA[0].seg, corriendo: true, ult: Date.now() }; render(); break;
      case 'pausa-toggle': if (UI.pausa) { UI.pausa.corriendo = !UI.pausa.corriendo; UI.pausa.ult = Date.now(); render(); } break;
      case 'pausa-sig': if (UI.pausa) { if (UI.pausa.i < PAUSA_ACTIVA.length - 1) { UI.pausa.i++; UI.pausa.resta = PAUSA_ACTIVA[UI.pausa.i].seg; UI.pausa.ult = Date.now(); render(); } else terminarPausa(true); } break;
      case 'pausa-ant': if (UI.pausa && UI.pausa.i > 0) { UI.pausa.i--; UI.pausa.resta = PAUSA_ACTIVA[UI.pausa.i].seg; UI.pausa.ult = Date.now(); render(); } break;
      case 'pausa-salir': terminarPausa(UI.pausa && UI.pausa.i >= PAUSA_ACTIVA.length - 2); break;
      case 'exportar': exportar(); break;
      case 'borrar-todo': UI.borrar = true; render(); break;
      case 'borrar-no': UI.borrar = false; render(); break;
      case 'borrar-si': S = estadoInicial(); UI.borrar = false; guardar(); toast('Datos borrados', 'neutro'); location.hash = '#/hoy'; render(); break;
      case 'actualizar': if (nuevaVersion) nuevaVersion.postMessage('actualizar'); break;
    }
  });

  document.addEventListener('input', ev => {
    const el = ev.target;
    if (!el.matches('.serie .campo')) return;
    const s = sesionActiva(); if (!s) return;
    const x = s.ejercicios[el.getAttribute('data-slot')].series[+el.getAttribute('data-i')];
    const v = parsearNumero(el.value);
    x[el.getAttribute('data-k')] = v;
    guardarLuego();
  });

  document.addEventListener('submit', ev => {
    const f = ev.target.getAttribute('data-f');
    if (!f) return;
    ev.preventDefault();
    const fd = new FormData(ev.target);
    if (f === 'control') {
      const c = { fecha: hoy() };
      let ok = true;
      METRICAS.forEach(m => { const v = parsearNumero(fd.get(m.k)); if (v == null || v === 0) ok = false; c[m.k] = v; });
      if (!ok) { toast('Completá los tres valores', 'neutro'); return; }
      S.controles = S.controles.filter(x => x.fecha !== c.fecha).concat([c]);
      UI.formControl = false; guardar(); toast('Control guardado', 'neutro'); render();
    } else if (f === 'inicio') {
      const v = String(fd.get('inicio') || '');
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { S.inicio = v; guardar(); toast('Fecha de inicio guardada', 'neutro'); render(); }
    }
  });

  document.addEventListener('change', ev => {
    if (ev.target.matches('input[data-f="importar"]') && ev.target.files[0]) importar(ev.target.files[0]);
  });

  function abrirReemplazo(slotId) {
    const s = sesionActiva(); if (!s) return;
    const slot = slotDe(s, slotId);
    const actual = s.ejercicios[slotId].ej;
    const opciones = [actual].concat(reemplazosDe(slot, actual));
    abrirHoja(cabHoja('Cambiar ejercicio') + '<p class="chico suave" style="margin-bottom:14px">Si la máquina está ocupada o la sede no la tiene. Trabaja lo mismo.</p>' +
      opciones.map(id => '<button class="opcion" data-a="elegir-reemplazo" data-slot="' + slotId + '" data-ej="' + id + '" aria-pressed="' + (id === actual) + '"><span class="crece"><b>' + esc(EJERCICIOS[id].nombre) + '</b><br><span class="chico suave">' + esc(EJERCICIOS[id].claves[0]) + '</span></span>' + (id === actual ? icono('check') : '') + '</button>').join(''), 'Cambiar ejercicio');
  }
  function elegirReemplazo(slotId, ejId) {
    const s = sesionActiva(); if (!s) return;
    const reg = s.ejercicios[slotId];
    if (reg.ej === ejId) { cerrarHoja(); return; }
    if (reg.series.some(x => x.hecho)) { toast('Ya marcaste series de este ejercicio', 'neutro'); return; }
    const nuevo = armarSlot(slotDe(s, slotId), ejId, s.fase);
    const w0 = nuevo.series[0] ? nuevo.series[0].w : null;
    nuevo.series = reg.series.map(() => ({ w: w0, r: null, hecho: false }));
    s.ejercicios[slotId] = nuevo;
    guardar(); cerrarHoja(); render();
  }
  function recalcularRecords() {
    S.records = {};
    S.sesiones.filter(x => x.fin).sort((a, b) => a.inicio - b.inicio).forEach(x => {
      Object.keys(x.ejercicios).forEach(k => {
        const reg = x.ejercicios[k];
        reg.series.filter(y => y.hecho).forEach(y => { S.records[reg.ej] = actualizarRecord(S.records[reg.ej], y.w, y.r, x.fecha); });
      });
    });
  }

  window.addEventListener('hashchange', () => {
    cerrarHoja(); window.scrollTo(0, 0); render();
    if (UI.despues) { const f = UI.despues; UI.despues = null; f(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (guardarPendiente) guardar();
      if (ruta().vista === 'entreno' && sesionActiva()) pedirPantallaEncendida();
      render();
    } else if (guardarPendiente) guardar();
  });
  window.addEventListener('pagehide', () => { if (guardarPendiente) guardar(); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && $capa.innerHTML) cerrarHoja(); });

  setInterval(tick, 250);
  render();

  // ---------- Service worker ----------
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').then(reg => {
      const avisar = w => { nuevaVersion = w; render(); };
      if (reg.waiting && navigator.serviceWorker.controller) avisar(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        if (!w) return;
        w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) avisar(w); });
      });
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
    }).catch(() => {});
    let recargando = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!recargando) { recargando = true; location.reload(); } });
  }
})();
