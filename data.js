'use strict';
// ARJE · Entreno — contenido del programa (bloque 1 aprobado el 11/9/2026).
// Los accesorios rotan por bloque: el bloque N usa variantes[(N-1) % largo].

const INCREMENTO = { barra: 2.5, smith: 2.5, mancuerna: 2, maquina: 5, polea: 2.5, prensa: 10, corporal: 0 };

const EJERCICIOS = {
  // Pecho
  'press-banca-barra': { nombre: 'Press de banca con barra', tipo: 'barra', claves: ['Omóplatos juntos y hacia abajo, pies firmes en el piso.', 'Bajá la barra a la línea de los pezones, codos a unos 45°.', 'Tocá el pecho sin rebotar y empujá.'] },
  'press-banca-smith': { nombre: 'Press de banca en Smith', tipo: 'smith', claves: ['Ubicá el banco para que la barra baje a la mitad del pecho.', 'Omóplatos juntos; la cola no se despega del banco.'] },
  'press-plano-mancuernas': { nombre: 'Press plano con mancuernas', tipo: 'mancuerna', claves: ['Bajá hasta sentir estiramiento en el pecho.', 'Mancuernas un poco en diagonal, codos a 45°.'] },
  'press-pecho-maquina': { nombre: 'Press de pecho en máquina', tipo: 'maquina', claves: ['Asiento con las manijas a la altura del medio del pecho.', 'Espalda pegada al respaldo; empujá sin trabar los codos.'] },
  'press-inclinado-mancuernas': { nombre: 'Press inclinado con mancuernas', tipo: 'mancuerna', claves: ['Banco a 30°, no más.', 'Bajá en 2 segundos; subí llevando los codos hacia adentro.'] },
  'press-inclinado-maquina': { nombre: 'Press inclinado en máquina', tipo: 'maquina', claves: ['Manijas a la altura de la parte alta del pecho.', 'Controlá la vuelta: no dejes que el peso caiga.'] },
  'press-inclinado-smith': { nombre: 'Press inclinado en Smith', tipo: 'smith', claves: ['Banco a 30°; la barra baja a la parte alta del pecho.', 'Omóplatos juntos, codos a 45°.', 'Primero la técnica, después el peso.'] },
  'press-inclinado-barra': { nombre: 'Press inclinado con barra', tipo: 'barra', claves: ['Banco a 30°; la barra baja debajo de la clavícula.', 'Pedí que alguien te asista en las series pesadas.'] },
  'cruce-poleas': { nombre: 'Cruce de poleas', tipo: 'polea', claves: ['Poleas a la altura de los hombros, un paso adelante.', 'Codos apenas flexionados y fijos: como abrazando un árbol.'] },
  'cruce-poleas-bajo-alto': { nombre: 'Cruce de poleas de abajo hacia arriba', tipo: 'polea', claves: ['Poleas abajo; subí las manos hasta la altura del mentón.', 'Carga la parte alta del pecho.'] },
  'aperturas-mancuernas': { nombre: 'Aperturas con mancuernas', tipo: 'mancuerna', claves: ['Codos apenas flexionados; bajá hasta sentir estiramiento.', 'No bajes más allá de la línea de los hombros.'] },
  'peck-deck': { nombre: 'Peck deck', tipo: 'maquina', claves: ['Manijas a la altura del pecho.', 'Juntá las manos apretando 1 segundo; volvé lento.'] },
  'fondos-asistidos': { nombre: 'Fondos asistidos en máquina', tipo: 'maquina', claves: ['Torso un poco inclinado hacia adelante para cargar pecho.', 'Bajá hasta que el hombro quede a la altura del codo, sin dolor.', 'Más peso en la máquina = más ayuda.'] },
  'flexiones': { nombre: 'Flexiones de brazos', tipo: 'corporal', claves: ['Cuerpo recto como una tabla.', 'Pecho casi al piso; cortá 1 repe antes del fallo.'] },

  // Hombro
  'press-hombro-mancuernas': { nombre: 'Press de hombro con mancuernas, sentado', tipo: 'mancuerna', claves: ['Respaldo casi vertical, espalda apoyada.', 'Bajá hasta la altura de las orejas; no arquees la lumbar.'] },
  'press-hombro-maquina': { nombre: 'Press de hombro en máquina', tipo: 'maquina', claves: ['Manijas a la altura de los hombros al empezar.', 'Espalda pegada; subí sin trabar los codos.'] },
  'press-arnold': { nombre: 'Press Arnold sentado', tipo: 'mancuerna', claves: ['Arrancá con las palmas hacia vos y girá mientras subís.', 'Liviano y controlado.'] },
  'laterales-mancuernas': { nombre: 'Elevaciones laterales con mancuernas', tipo: 'mancuerna', claves: ['Subí hasta la altura de los hombros, codos apenas flexionados.', 'Pensá en llevar las manos lejos, no arriba.', 'Sin balancear el torso.'] },
  'laterales-polea': { nombre: 'Elevaciones laterales en polea', tipo: 'polea', claves: ['Polea abajo, cable por delante del cuerpo.', 'Tensión constante; subí hasta el hombro.'] },
  'laterales-maquina': { nombre: 'Elevaciones laterales en máquina', tipo: 'maquina', claves: ['Codos contra las almohadillas.', 'Subí hasta el hombro y bajá lento.'] },
  'face-pull': { nombre: 'Face pull en polea', tipo: 'polea', claves: ['Polea a la altura de la frente, con soga.', 'Tirá hacia la cara separando las manos, codos altos.', 'Juntá omóplatos 1 segundo: es tu ejercicio de postura.'] },
  'pajaros-maquina': { nombre: 'Pájaros en máquina', tipo: 'maquina', claves: ['Pecho contra el respaldo, brazos casi rectos.', 'Abrí hacia atrás sin encoger los hombros.'] },
  'pajaros-mancuernas': { nombre: 'Pájaros con mancuernas en banco inclinado', tipo: 'mancuerna', claves: ['Pecho apoyado en el banco a 30–45°.', 'Abrí los brazos en cruz, liviano.'] },

  // Tríceps
  'triceps-polea-cabeza': { nombre: 'Tríceps en polea sobre la cabeza, con soga', tipo: 'polea', claves: ['De espaldas a la polea, codos apuntando adelante.', 'Estirá del todo y volvé hasta sentir el estiramiento.'] },
  'press-frances-mancuernas': { nombre: 'Press francés con mancuernas', tipo: 'mancuerna', claves: ['Acostado, codos fijos apuntando al techo.', 'Bajá las mancuernas al costado de la cabeza.'] },
  'extension-cabeza-mancuerna': { nombre: 'Extensión sobre la cabeza con mancuerna', tipo: 'mancuerna', claves: ['Sentado con respaldo, mancuerna con las dos manos.', 'Codos cerca de la cabeza.'] },
  'press-frances-ez': { nombre: 'Press francés con barra EZ', tipo: 'barra', claves: ['Codos fijos, apuntando un poco hacia atrás.', 'Bajá la barra hacia la frente o apenas detrás.'] },
  'press-cerrado-smith': { nombre: 'Press cerrado en Smith', tipo: 'smith', claves: ['Manos al ancho de los hombros.', 'Codos pegados al cuerpo al bajar.'] },
  'triceps-polea-barra': { nombre: 'Tríceps en polea con barra recta', tipo: 'polea', claves: ['Codos pegados a las costillas, quietos.', 'Estirá del todo y apretá 1 segundo.'] },
  'triceps-polea-soga': { nombre: 'Tríceps en polea con soga', tipo: 'polea', claves: ['Codos quietos al costado del cuerpo.', 'Abrí la soga abajo.'] },
  'triceps-unilateral': { nombre: 'Tríceps a un brazo en polea', tipo: 'polea', claves: ['Codo fijo al costado.', 'Estirá del todo, sin mover el hombro.'] },

  // Espalda
  'jalon-pecho': { nombre: 'Jalón al pecho', tipo: 'maquina', claves: ['Agarre un poco más ancho que los hombros.', 'Llevá la barra a la parte alta del pecho, pecho arriba.', 'Tirá con los codos, no con las manos.'] },
  'dominadas-asistidas': { nombre: 'Dominadas asistidas en máquina', tipo: 'maquina', claves: ['Más peso en la máquina = más ayuda.', 'Mentón por encima de la barra, bajá controlado.'] },
  'jalon-convergente': { nombre: 'Jalón en máquina convergente', tipo: 'maquina', claves: ['Pecho arriba, tirá los codos hacia las costillas.'] },
  'remo-pecho-apoyado': { nombre: 'Remo con pecho apoyado en máquina', tipo: 'maquina', claves: ['Pecho pegado al apoyo todo el tiempo: cuida la lumbar.', 'Llevá los codos atrás y juntá omóplatos.'] },
  'remo-mancuerna': { nombre: 'Remo con mancuerna a un brazo', tipo: 'mancuerna', claves: ['Mano y rodilla apoyadas en el banco, espalda plana.', 'Llevá la mancuerna hacia la cadera.'] },
  'remo-t-apoyado': { nombre: 'Remo en T con pecho apoyado', tipo: 'maquina', claves: ['Pecho contra el apoyo.', 'Codos atrás, pausa de 1 segundo arriba.'] },
  'remo-polea-neutro': { nombre: 'Remo en polea baja, agarre neutro', tipo: 'polea', claves: ['Espalda recta, sin balancearte.', 'Tirá hacia el ombligo y juntá omóplatos.'] },
  'remo-polea-ancho': { nombre: 'Remo en polea baja, agarre ancho', tipo: 'polea', claves: ['Tirá hacia la parte baja del pecho, codos abiertos.'] },
  'jalon-unilateral': { nombre: 'Jalón a un brazo en polea', tipo: 'polea', claves: ['Tirá el codo hacia el bolsillo.', 'Estirá arriba del todo.'] },
  'pullover-polea': { nombre: 'Pullover en polea con brazos rectos', tipo: 'polea', claves: ['Polea alta, brazos casi rectos.', 'Bajá la barra hasta los muslos usando la espalda.'] },
  'pullover-mancuerna': { nombre: 'Pullover con mancuerna', tipo: 'mancuerna', claves: ['Acostado, codos apenas flexionados.', 'Bajá detrás de la cabeza sin arquear la lumbar.'] },
  'pullover-soga': { nombre: 'Pullover en polea con soga', tipo: 'polea', claves: ['Inclinado adelante, brazos casi rectos.', 'Llevá la soga hasta la cadera.'] },

  // Bíceps
  'curl-ez': { nombre: 'Curl con barra EZ', tipo: 'barra', claves: ['Codos pegados al cuerpo, sin balancear.', 'Bajá lento: 2 segundos.'] },
  'curl-barra': { nombre: 'Curl con barra recta', tipo: 'barra', claves: ['Codos quietos.', 'Si molesta la muñeca, volvé a la EZ.'] },
  'curl-polea-barra': { nombre: 'Curl en polea baja con barra', tipo: 'polea', claves: ['Tensión constante; apretá arriba 1 segundo.'] },
  'curl-martillo': { nombre: 'Curl martillo con mancuernas', tipo: 'mancuerna', claves: ['Palmas mirándose, codos quietos.', 'Subí sin girar la muñeca.'] },
  'curl-martillo-soga': { nombre: 'Curl martillo en polea con soga', tipo: 'polea', claves: ['Codos pegados; subí la soga hasta el pecho.'] },
  'curl-martillo-cruzado': { nombre: 'Curl martillo cruzado', tipo: 'mancuerna', claves: ['Llevá la mancuerna hacia el hombro contrario.'] },
  'curl-inclinado': { nombre: 'Curl inclinado con mancuernas', tipo: 'mancuerna', claves: ['Banco a 45–60°, brazos colgando detrás del cuerpo.', 'Estira mucho el bíceps: arrancá liviano.'] },
  'curl-predicador': { nombre: 'Curl predicador en máquina', tipo: 'maquina', claves: ['Axilas contra el apoyo.', 'Estirá casi del todo abajo.'] },
  'curl-arana': { nombre: 'Curl araña con barra EZ', tipo: 'barra', claves: ['Pecho apoyado en un banco inclinado, brazos colgando.', 'Apretá arriba 1 segundo.'] },
  'curl-bayesian': { nombre: 'Curl en polea de espaldas', tipo: 'polea', claves: ['De espaldas a la polea baja, un paso adelante.', 'El brazo arranca detrás del cuerpo: estiramiento máximo.'] },
  'curl-polea-alta': { nombre: 'Curl en polea alta doble', tipo: 'polea', claves: ['Brazos en cruz; llevá las manos a las orejas.'] },
  'curl-concentrado': { nombre: 'Curl concentrado', tipo: 'mancuerna', claves: ['Codo apoyado en la cara interna del muslo.', 'Subí lento y apretá.'] },
  'curl-21': { nombre: '21s de bíceps con barra EZ', tipo: 'barra', claves: ['7 repes de abajo a la mitad, 7 de la mitad arriba y 7 completas, sin pausa.'] },

  // Pierna
  'prensa': { nombre: 'Prensa 45°', tipo: 'prensa', claves: ['Pies al ancho de hombros, en el medio de la plataforma.', 'Bajá hasta donde la cola no se despegue del respaldo.', 'No trabes las rodillas arriba.'] },
  'hack-squat': { nombre: 'Sentadilla hack en máquina', tipo: 'maquina', claves: ['Espalda pegada al respaldo.', 'Bajá hasta muslos paralelos si la lumbar lo permite.'] },
  'rumano-mancuernas': { nombre: 'Peso muerto rumano con mancuernas', tipo: 'mancuerna', claves: ['Rodillas apenas flexionadas; llevá la cadera hacia atrás.', 'Espalda neutra siempre; bajá hasta sentir los femorales, no más.', 'Por tu zona lumbar, la técnica manda sobre el peso.'] },
  'rumano-barra': { nombre: 'Peso muerto rumano con barra', tipo: 'barra', claves: ['La barra baja pegada a las piernas.', 'Espalda neutra; subí empujando la cadera adelante.'] },
  'rumano-smith': { nombre: 'Peso muerto rumano en Smith', tipo: 'smith', claves: ['Cadera atrás, espalda neutra.', 'La guía te ayuda a mantener la barra cerca.'] },
  'hip-thrust-maquina': { nombre: 'Hip thrust en máquina', tipo: 'maquina', claves: ['Mentón al pecho, empujá con los talones.', 'Arriba apretá glúteos 1 segundo sin arquear la lumbar.'] },
  'hip-thrust-barra': { nombre: 'Hip thrust con barra', tipo: 'barra', claves: ['Espalda alta apoyada en el banco, barra con protector.', 'Arriba: tronco paralelo al piso, glúteos apretados.'] },
  'puente-smith': { nombre: 'Puente de glúteo en Smith', tipo: 'smith', claves: ['Espalda en el piso, pies cerca de la cola.', 'Subí la cadera apretando glúteos.'] },
  'sillon-cuadriceps': { nombre: 'Sillón de cuádriceps', tipo: 'maquina', claves: ['Rodilla alineada con el eje de la máquina.', 'Arriba apretá 1 segundo; bajá lento.'] },
  'sillon-unilateral': { nombre: 'Sillón de cuádriceps a una pierna', tipo: 'maquina', claves: ['Misma técnica, una pierna por vez.', 'Empezá por la más débil.'] },
  'estocadas': { nombre: 'Estocadas caminando con mancuernas', tipo: 'mancuerna', claves: ['Paso largo, torso derecho.', 'La rodilla de atrás casi toca el piso.'] },
  'camilla-femoral': { nombre: 'Camilla femoral', tipo: 'maquina', claves: ['Cadera pegada a la camilla.', 'Subí rápido y bajá en 2–3 segundos.'] },
  'femoral-sentado': { nombre: 'Femoral sentado', tipo: 'maquina', claves: ['Traba bien los muslos.', 'Bajá lento.'] },
  'femoral-unilateral': { nombre: 'Femoral a una pierna', tipo: 'maquina', claves: ['Una pierna por vez, sin girar la cadera.'] },
  'gemelos-pie': { nombre: 'Gemelos en máquina de pie', tipo: 'maquina', claves: ['Bajá todo hasta estirar, pausa de 1 segundo.', 'Subí en punta de pie.'] },
  'gemelos-prensa': { nombre: 'Gemelos en prensa', tipo: 'prensa', claves: ['Solo la punta de los pies en la plataforma.', 'Recorrido completo, sin rebote.'] },
  'gemelos-sentado': { nombre: 'Gemelos sentado', tipo: 'maquina', claves: ['Pausa abajo, subí del todo.'] },

  // Core y espalda sana
  'hiperextensiones': { nombre: 'Hiperextensiones a 45°', tipo: 'corporal', claves: ['Cadera en el borde del apoyo.', 'Subí hasta alinear el cuerpo, no más: sin arquear arriba.'] },
  'dead-bug': { nombre: 'Dead bug', tipo: 'corporal', claves: ['Lumbar pegada al piso todo el tiempo.', 'Estirá brazo y pierna contrarios, lento.'] },
  'pallof': { nombre: 'Pallof press', tipo: 'polea', claves: ['De costado a la polea; empujá al frente.', 'No dejes que la polea te gire el torso.'] },
  'plancha-lateral': { nombre: 'Plancha lateral', tipo: 'corporal', claves: ['Codo debajo del hombro, cuerpo en línea.', 'Apretá glúteos; no dejes caer la cadera.'] },
  'remo-curvado': { nombre: 'Remo curvado con barra', tipo: 'barra', claves: ['Cadera atrás, espalda neutra, torso a unos 45°.', 'Llevá la barra al ombligo con los codos.', 'Si la lumbar se queja, pasate al remo con pecho apoyado.'] },
  'abduccion-cadera': { nombre: 'Abducción de cadera en máquina', tipo: 'maquina', claves: ['Sentado, abrí las piernas contra las almohadillas.', 'Pausa de 1 segundo afuera; volvé lento.'] },
  'elevacion-frontal': { nombre: 'Elevación frontal con mancuernas', tipo: 'mancuerna', claves: ['Subí hasta la altura de los ojos, brazos casi rectos.', 'Sin balancear la cadera.'] },
  'crunch-polea': { nombre: 'Crunch en polea', tipo: 'polea', claves: ['De rodillas, soga al costado de la cabeza.', 'Enrollá la columna llevando las costillas a la cadera.'] }
};

// Slots. principal: fijo entre bloques. variantes: rotan por bloque. extra: reemplazos adicionales.
// superserie: letra compartida — el descanso se hace después del último del grupo.
const DIAS = {
  lunes: {
    weekday: 1, nombre: 'Lunes', titulo: 'Pecho y tríceps', sede: 'madero', hora: '19:00',
    slots: [
      { id: 'L1', principal: true, series: 3, repMin: 10, repMax: 12, descanso: 150, variantes: ['press-banca-barra'], extra: ['press-banca-smith', 'press-plano-mancuernas', 'press-pecho-maquina'] },
      { id: 'L2', series: 3, repMin: 10, repMax: 12, descanso: 120, variantes: ['press-inclinado-mancuernas', 'press-inclinado-maquina', 'press-inclinado-barra'] },
      { id: 'L3', series: 3, repMin: 10, repMax: 12, descanso: 75, variantes: ['cruce-poleas', 'aperturas-mancuernas', 'cruce-poleas-bajo-alto'] },
      { id: 'L4', series: 3, repMin: 10, repMax: 12, descanso: 75, variantes: ['triceps-polea-soga', 'triceps-polea-barra', 'press-cerrado-smith'] },
      { id: 'L5', series: 3, repMin: 10, repMax: 12, descanso: 75, variantes: ['triceps-polea-cabeza', 'extension-cabeza-mancuerna', 'press-frances-ez'] },
      { id: 'L6', series: 3, repMin: 10, repMax: 12, descanso: 75, variantes: ['triceps-unilateral', 'press-frances-mancuernas', 'fondos-asistidos'] },
      { id: 'L7', series: 2, repMin: 15, repMax: 20, descanso: 60, nota: 'No está en la plantilla: lo sumo por tu cuello y tus hombros.', variantes: ['face-pull'], extra: ['pajaros-maquina'] }
    ],
    circuitos: [],
    cardio: { nombre: 'Cinta inclinada', min: 15, detalle: 'Inclinación 8–12 %, 5–5,5 km/h. Sin agarrarte de la cinta.' }
  },
  miercoles: {
    weekday: 3, nombre: 'Miércoles', titulo: 'Espalda y bíceps', sede: 'nunez', hora: '8:00',
    slots: [
      { id: 'M1', principal: true, series: 3, repMin: 10, repMax: 12, descanso: 150, nota: 'La plantilla pone remo curvado con barra. Por tu lumbar arrancá con el pecho apoyado; si te sentís bien, cambialo desde el botón de reemplazo.', variantes: ['remo-pecho-apoyado'], extra: ['remo-curvado', 'remo-t-apoyado', 'remo-mancuerna'] },
      { id: 'M2', series: 3, repMin: 10, repMax: 12, descanso: 90, variantes: ['remo-polea-neutro', 'remo-polea-ancho', 'jalon-unilateral'] },
      { id: 'M3', series: 3, repMin: 10, repMax: 12, descanso: 120, variantes: ['jalon-pecho', 'dominadas-asistidas', 'jalon-convergente'] },
      { id: 'M4', series: 3, repMin: 10, repMax: 12, descanso: 75, variantes: ['curl-predicador', 'curl-arana', 'curl-polea-barra'] },
      { id: 'M5', series: 3, repMin: 10, repMax: 12, descanso: 75, variantes: ['curl-inclinado', 'curl-martillo', 'curl-concentrado'] },
      { id: 'M6', series: 3, repMin: 10, repMax: 12, descanso: 75, variantes: ['curl-barra', 'curl-ez', 'curl-bayesian'] }
    ],
    circuitos: [
      { id: 'MC', nombre: 'Core de espalda sana', vueltas: 3, ejercicios: [
        { ej: 'hiperextensiones', dosis: '12–15' }, { ej: 'dead-bug', dosis: '8 por lado' }, { ej: 'pallof', dosis: '10 por lado' }
      ] }
    ],
    cardio: { nombre: 'Bici', min: 15, detalle: 'Ritmo cómodo: podés hablar pero no cantar.' }
  },
  jueves: {
    weekday: 4, nombre: 'Jueves', titulo: 'Pierna completa', sede: 'nunez', hora: '18:15',
    slots: [
      { id: 'J1', principal: true, series: 3, repMin: 10, repMax: 12, descanso: 150, variantes: ['hack-squat'], extra: ['prensa'] },
      { id: 'J2', series: 3, repMin: 10, repMax: 12, descanso: 75, variantes: ['sillon-cuadriceps', 'sillon-unilateral', 'estocadas'] },
      { id: 'J3', series: 3, repMin: 10, repMax: 12, descanso: 60, variantes: ['abduccion-cadera'] },
      { id: 'J4', series: 3, repMin: 10, repMax: 12, descanso: 75, variantes: ['camilla-femoral', 'femoral-sentado', 'femoral-unilateral'] },
      { id: 'J5', series: 3, repMin: 10, repMax: 12, descanso: 90, nota: 'Acá la plantilla pone flexión de cadera. Lo cambio por glúteo: con tu lumbar rinde mucho más.', variantes: ['hip-thrust-maquina', 'hip-thrust-barra', 'rumano-mancuernas'] },
      { id: 'J6', series: 3, repMin: 10, repMax: 12, descanso: 120, variantes: ['prensa'], extra: ['hack-squat', 'estocadas'] }
    ],
    circuitos: [
      { id: 'JC', nombre: 'Core', vueltas: 3, ejercicios: [
        { ej: 'plancha-lateral', dosis: '30–45 s por lado' }, { ej: 'crunch-polea', dosis: '12–15' }
      ] }
    ],
    cardio: { nombre: 'Cinta inclinada', min: 15, detalle: 'Si tenés resto, estirá a 20 minutos.' }
  },
  viernes: {
    weekday: 5, nombre: 'Viernes', titulo: 'Hombro, brazos y pecho', sede: 'nunez', hora: '8:00',
    slots: [
      { id: 'V1', principal: true, series: 3, repMin: 10, repMax: 12, descanso: 120, variantes: ['press-hombro-mancuernas'], extra: ['press-hombro-maquina', 'press-arnold'] },
      { id: 'V2', series: 3, repMin: 10, repMax: 12, descanso: 60, variantes: ['laterales-mancuernas', 'laterales-polea', 'laterales-maquina'] },
      { id: 'V3', series: 3, repMin: 10, repMax: 12, descanso: 60, variantes: ['pajaros-maquina', 'pajaros-mancuernas'], extra: ['elevacion-frontal'] },
      { id: 'V4', series: 3, repMin: 10, repMax: 12, descanso: 120, nota: 'Segundo día de pecho de la semana: es tu prioridad, no lo saltees.', variantes: ['press-inclinado-smith', 'press-inclinado-barra', 'press-pecho-maquina'] },
      { id: 'V5', series: 3, repMin: 10, repMax: 12, descanso: 60, nota: 'Última serie con drop set: al terminar, bajá el peso un 30 % y seguí hasta 1 antes del fallo.', variantes: ['peck-deck', 'cruce-poleas-bajo-alto', 'aperturas-mancuernas'] },
      { id: 'V6', series: 3, repMin: 10, repMax: 12, descanso: 0, superserie: 'A', variantes: ['curl-bayesian', 'curl-polea-alta', 'curl-martillo'] },
      { id: 'V7', series: 3, repMin: 10, repMax: 12, descanso: 75, superserie: 'A', variantes: ['triceps-polea-barra', 'triceps-polea-soga', 'triceps-unilateral'] }
    ],
    circuitos: [
      { id: 'VC', nombre: 'Cierre para reventar', vueltas: 2, fuego: true, ejercicios: [
        { ej: 'curl-21', dosis: '21 repes' }, { ej: 'flexiones', dosis: 'hasta 1 antes del fallo' }
      ] }
    ],
    cardio: { nombre: 'Bici', min: 10, detalle: 'Suave, para bajar pulsaciones.' }
  }
};

const ORDEN_DIAS = ['lunes', 'miercoles', 'jueves', 'viernes'];

const SEDES = {
  nunez: { nombre: 'Núñez', detalle: 'Av. Libertador 8000 · a una cuadra de la ofi' },
  madero: { nombre: 'Madero', detalle: 'Alicia Moreau de Justo 1600 · en la facultad' }
};

const MOVILIDAD = [
  { nombre: 'Gato-camello', dosis: '10 lentas' },
  { nombre: 'Mentón adentro (retracción de cuello)', dosis: '10, pausa de 2 s' },
  { nombre: 'Libro abierto (rotación dorsal)', dosis: '8 por lado' },
  { nombre: '90/90 de cadera', dosis: '6 por lado' },
  { nombre: 'Estocada con rotación', dosis: '5 por lado' },
  { nombre: 'Separación de banda o retracción de omóplatos', dosis: '15' }
];

const PAUSA_ACTIVA = [
  { nombre: 'Mentón adentro', seg: 30, clave: 'Llevá el mentón hacia atrás como haciendo papada, sin bajar la cabeza. 10 veces, 2 segundos cada una.' },
  { nombre: 'Hombros atrás', seg: 25, clave: 'Círculos grandes con los hombros hacia atrás. 10 veces.' },
  { nombre: 'Juntar omóplatos', seg: 30, clave: 'Sentado derecho, juntá los omóplatos y sostené 2 segundos. 12 veces.' },
  { nombre: 'Pecho en el marco de la puerta', seg: 30, clave: 'Antebrazo apoyado en el marco a la altura del hombro, avanzá un paso hasta sentir el pecho.' },
  { nombre: 'Cuello de costado · derecha', seg: 20, clave: 'Oreja hacia el hombro, suave. La otra mano agarra el asiento.' },
  { nombre: 'Cuello de costado · izquierda', seg: 20, clave: 'Oreja hacia el hombro, suave. La otra mano agarra el asiento.' },
  { nombre: 'Extensión dorsal en la silla', seg: 25, clave: 'Manos detrás de la cabeza, arqueá la parte alta de la espalda sobre el respaldo. 8 veces.' },
  { nombre: 'Flexor de cadera · derecha', seg: 30, clave: 'De pie, un paso largo atrás, apretá el glúteo de la pierna de atrás y llevá la cadera adelante.' },
  { nombre: 'Flexor de cadera · izquierda', seg: 30, clave: 'Igual del otro lado. Respirá lento.' }
];

const PUESTO = [
  'Borde de arriba del monitor a la altura de los ojos, a un brazo de distancia.',
  'Si usás la notebook, levantala y usá teclado y mouse aparte.',
  'Codos a 90°, hombros sueltos, antebrazos apoyados.',
  'Pies apoyados en el piso y cola al fondo de la silla.',
  'Un almohadón o toalla enrollada en la zona lumbar si la silla no tiene apoyo.',
  'Celular a la altura de los ojos, no con la cabeza gacha.'
];

const ALARMAS = [
  { hora: '11:30', dias: 'Lunes', para: 'Pausa activa' },
  { hora: '13:30', dias: 'Lunes, martes, miércoles y viernes', para: 'Pausa activa' },
  { hora: '15:30', dias: 'Martes a viernes', para: 'Pausa activa' },
  { hora: '21:30', dias: 'Domingo, martes y jueves', para: 'Preparar el bolso para el día siguiente' }
];

const COMIDA = {
  metas: [
    { icono: 'flame', valor: '2.400–2.500', unidad: 'kcal por día', detalle: 'Un poco menos de lo que gastás: bajás grasa sin frenar el músculo.' },
    { icono: 'beef', valor: '170', unidad: 'g de proteína', detalle: '4 porciones de unos 40 g, o 3 porciones y un batido.' },
    { icono: 'footprints', valor: '8.000–10.000', unidad: 'pasos', detalle: 'Lo que más ayuda con la panza fuera del gimnasio.' },
    { icono: 'droplet', valor: '2,5–3', unidad: 'litros de agua', detalle: 'Más en los días de gimnasio.' },
    { icono: 'moon', valor: '7+', unidad: 'horas de sueño', detalle: 'El músculo se construye durmiendo.' }
  ],
  dia: [
    { momento: 'Desayuno', opciones: ['3 huevos revueltos + tostada integral + yogur alto en proteína', 'Batido: 1 scoop de proteína + leche + banana + 3 cucharadas de avena'] },
    { momento: 'Almuerzo (táper)', opciones: ['Proteína del finde (unos 200 g cocida) + 1 taza de arroz, papa o fideos + verduras libres'] },
    { momento: 'Merienda', opciones: ['Yogur alto en proteína + fruta', 'Tostadas con queso untable y jamón cocido', 'Batido si no llegás a la meta'] },
    { momento: 'Cena', opciones: ['Martes y miércoles (volvés 21 h): táper listo', 'Resto: proteína + verduras + poca harina (milanesa al horno con ensalada, omelette de 4 huevos, carne o pollo a la plancha)'] }
  ],
  entreno: [
    'Mañana (8 h): banana y café o preentreno 30 minutos antes; después del gimnasio, desayuno fuerte o batido.',
    'Tarde o noche: merienda 1–2 horas antes y cena después.'
  ],
  suplementos: [
    { nombre: 'Creatina monohidrato', dosis: '3–5 g todos los días', detalle: 'Cualquier hora, también los días que no entrenás. Lo que importa es no cortar.' },
    { nombre: 'Proteína en polvo', dosis: '1 scoop (unos 25 g)', detalle: 'Comodín cuando no llegás a la meta con comida. No reemplaza comidas.' },
    { nombre: 'Preentreno', dosis: 'Media dosis las primeras veces', detalle: 'Solo en sesiones de mañana. De tarde o noche, uno sin estimulantes o nada: la cafeína te arruina el sueño.' }
  ],
  aviso: 'Pautas generales, no una dieta médica. Si tomás medicación o algo te cae mal, consultalo con un profesional.',
  conservacion: 'La heladera los aguanta 3–4 días. Los táperes de jueves y viernes van al freezer; pasalos a la heladera la noche anterior.',
  porcion: 'Cada táper: unos 200 g de proteína cocida, 1 taza de carbohidrato y verduras sin límite. Aproximadamente 45 g de proteína y 650 kcal.',
  menus: {
    A: {
      nombre: 'Menú A · Pollo al horno y boloñesa',
      taperes: '4 táperes de pollo con arroz + 3 de boloñesa con papas',
      pasos: [
        'Horno a 200 °C. Papas en cubos con aceite, sal y pimentón: 40 minutos.',
        'Pollo en cubos con limón, ajo y pimentón, en otra bandeja: 25 minutos.',
        'Mientras tanto, arroz en olla.',
        'Picada en sartén con cebolla y morrón; sumá el tomate triturado y cociná 20 minutos.',
        'Zapallitos y brócoli al horno o salteados los últimos 15 minutos.',
        'Armá los táperes y dejá que se enfríen destapados antes de cerrarlos.'
      ],
      compras: {
        'Carnicería y pollería': ['1,4 kg de pechuga de pollo', '1 kg de carne picada magra (nalga)'],
        'Verdulería': ['1,5 kg de papa', '2 zapallitos', '2 morrones', '2 cebollas', '1 brócoli', '2 limones', '1 cabeza de ajo'],
        'Almacén': ['500 g de arroz', '1 lata de tomate triturado', 'Pimentón y comino', 'Aceite de oliva']
      }
    },
    B: {
      nombre: 'Menú B · Salteado de carne y pollo con batata',
      taperes: '4 táperes de salteado de carne con fideos + 3 de pollo con batata',
      pasos: [
        'Horno a 200 °C. Batata y calabaza en cubos con aceite y sal: 35 minutos.',
        'Muslos de pollo con pimentón, ajo y limón en otra bandeja: 30 minutos.',
        'Hervís los fideos y los cortás con un chorrito de aceite.',
        'Carne en tiras a sartén bien caliente, en tandas; después cebolla, morrón y brócoli; al final salsa de soja.',
        'Mezclá los fideos con el salteado.',
        'Armá los táperes y dejá que se enfríen destapados antes de cerrarlos.'
      ],
      compras: {
        'Carnicería y pollería': ['1,2 kg de nalga o peceto', '1,2 kg de muslo de pollo deshuesado'],
        'Verdulería': ['1 kg de batata', '1 calabaza chica', '2 cebollas', '2 morrones', '1 brócoli', '1 limón', '1 cabeza de ajo'],
        'Almacén': ['500 g de fideos (mejor integrales)', 'Salsa de soja', 'Pimentón', 'Aceite de oliva']
      }
    }
  },
  basicos: {
    'Para toda la semana': ['30 huevos', '6 yogures altos en proteína', 'Pan integral', 'Avena', 'Leche', 'Bananas y fruta de estación', 'Queso untable y jamón cocido', 'Verdura para ensalada']
  }
};
