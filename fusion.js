/* ═══════════════════════════════════════════════════════════════
   FUSIÓN A TRES BANDAS

   Junta los cambios de dos dispositivos comparando tres versiones:
     base    cómo estaba la última vez que los dos coincidieron
     local   cómo está aquí ahora
     remoto  cómo está en Drive ahora

   La regla es siempre la misma: si solo uno de los dos cambió algo,
   gana ese. Si cambiaron los dos y no coinciden, es un conflicto, y
   entonces gana el dispositivo que guardó más tarde, pero queda
   anotado para poder enseñarlo.

   Gracias a tener la base no hacen falta marcas de borrado: si algo
   estaba en la base y ya no está aquí, es que lo borré yo, y no se
   vuelve a traer de Drive.
   ═══════════════════════════════════════════════════════════════ */
const Fusion = (() => {

  const esObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const igual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

  /* La clave que identifica un elemento dentro de una lista. Casi todo
     lleva id; las cifras anuales se identifican por su periodo. */
  function claveDe(o) {
    if (!esObj(o)) return null;
    if (o.id !== undefined && o.id !== '') return 'id:' + o.id;
    if (o.periodo !== undefined && o.periodo !== '') return 'per:' + o.periodo;
    return null;
  }

  /* ¿Esta lista es una colección de registros identificables, o un valor
     suelto que se reemplaza entero (como una lista de textos)? */
  function esColeccion(arr) {
    if (!Array.isArray(arr) || !arr.length) return false;
    const claves = arr.map(claveDe);
    if (claves.some(k => k === null)) return false;
    return new Set(claves).size === claves.length;
  }

  /* Listas que solo crecen: nunca se edita un elemento ya creado, así que
     la unión por id es segura y no hay conflictos posibles dentro de ellas.
     Las operaciones están aquí a propósito: una operación duplicada o
     fusionada campo a campo descuadraría el FIFO y el informe fiscal. */
  const SIN_AVISO = new Set(['cotizacion', 'serie', 'fx', 'precios']);
  const SOLO_AÑADIR = new Set([
    'operaciones', 'noticias', 'revisiones', 'informes', 'estudios',
    'serie', 'historial', 'datos', 'intereses'
  ]);

  function fusionarLista(base, local, remoto, nombre, ctx) {
    const b = Array.isArray(base) ? base : [];
    const l = Array.isArray(local) ? local : [];
    const r = Array.isArray(remoto) ? remoto : [];

    if (!esColeccion(l) && !esColeccion(r)) {
      /* Lista de valores sueltos: se trata como un todo */
      if (igual(l, b)) return r;
      if (igual(r, b)) return l;
      if (igual(l, r)) return l;
      ctx.conflictos.push({ campo: ctx.ruta.join('.') || nombre, detalle: 'lista cambiada en los dos sitios' });
      return ctx.ganaLocal ? l : r;
    }

    const mapa = arr => { const m = new Map(); arr.forEach(x => { const k = claveDe(x); if (k) m.set(k, x); }); return m; };
    const mb = mapa(b), ml = mapa(l), mr = mapa(r);
    const soloAñadir = SOLO_AÑADIR.has(nombre);
    const orden = [], vistos = new Set();
    [...l, ...r].forEach(x => { const k = claveDe(x); if (k && !vistos.has(k)) { vistos.add(k); orden.push(k); } });

    const salida = [];
    orden.forEach(k => {
      const eb = mb.get(k), el = ml.get(k), er = mr.get(k);

      /* Borrados: estaba en la base y ha desaparecido de un lado */
      if (eb && !el) return;            /* lo borré aquí */
      if (eb && !er) return;            /* lo borraron allí */

      if (el && !er) { salida.push(el); return; }   /* nuevo aquí */
      if (er && !el) { salida.push(er); return; }   /* nuevo allí */

      if (soloAñadir) {
        /* No se editan, pero sí se marcan: haber leído algo en un aparato
           vale para los dos, así que las marcas se suman en vez de pisarse. */
        const x = Object.assign({}, el);
        ['leido', 'fijado', 'resuelto'].forEach(f => { if (el[f] || er[f]) x[f] = true; });
        if (el.estado === 'procesada' || er.estado === 'procesada') x.estado = 'procesada';
        salida.push(x);
        return;
      }
      salida.push(fusionarValor(eb, el, er, k, ctx));
    });
    return salida;
  }

  function fusionarValor(base, local, remoto, nombre, ctx) {
    if (igual(local, remoto)) return local;
    if (igual(local, base)) return remoto;    /* solo cambió allí */
    if (igual(remoto, base)) return local;    /* solo cambió aquí */

    if (Array.isArray(local) || Array.isArray(remoto))
      return fusionarLista(base, local, remoto, nombre, ctx);

    /* La cotización de una ficha: precio y fecha van juntos, del día más reciente */
    if (nombre === 'cotizacion' && esObj(local) && esObj(remoto) && (local.fecha || remoto.fecha) && local.fecha !== remoto.fecha) {
      const nueva = (local.fecha || '') > (remoto.fecha || '') ? local : remoto, vieja = nueva === local ? remoto : local;
      const salida = Object.assign({}, vieja, nueva);
      /* lo demás (PER, máximos…) se junta como siempre */
      Object.keys(salida).forEach(k => {
        if (k === 'precio' || k === 'fecha') return;
        ctx.ruta.push(k);
        salida[k] = fusionarValor(base ? base[k] : undefined, local[k], remoto[k], k, ctx);
        ctx.ruta.pop();
      });
      return salida;
    }

    if (esObj(local) && esObj(remoto)) {
      const salida = {};
      const claves = new Set([...Object.keys(base || {}), ...Object.keys(local), ...Object.keys(remoto)]);
      claves.forEach(k => {
        const tieneL = Object.prototype.hasOwnProperty.call(local, k);
        const tieneR = Object.prototype.hasOwnProperty.call(remoto, k);
        const tieneB = base && Object.prototype.hasOwnProperty.call(base, k);
        if (tieneB && !tieneL) return;        /* borrada aquí */
        if (tieneB && !tieneR) return;        /* borrada allí */
        if (!tieneL) { salida[k] = remoto[k]; return; }
        if (!tieneR) { salida[k] = local[k]; return; }
        ctx.ruta.push(k);
        salida[k] = fusionarValor(base ? base[k] : undefined, local[k], remoto[k], k, ctx);
        ctx.ruta.pop();
      });
      return salida;
    }

    /* Precios: los dos aparatos los traen solos y casi nunca coinciden al
       céntimo. Eso no es un conflicto que debas resolver tú: gana el más
       reciente y no se avisa. */
    if (ctx.ruta.some(k => SIN_AVISO.has(k))) return ctx.ganaLocal ? local : remoto;

    /* Un valor suelto cambiado en los dos sitios: conflicto de verdad */
    ctx.conflictos.push({
      campo: [...ctx.ruta].join('.') || nombre,
      aqui: recorta(local), alla: recorta(remoto)
    });
    return ctx.ganaLocal ? local : remoto;
  }

  function recorta(v) {
    const t = typeof v === 'string' ? v : JSON.stringify(v);
    return String(t ?? '').slice(0, 70);
  }

  /* Punto de entrada. `guardadoLocal` y `guardadoRemoto` son las marcas de
     tiempo de cada documento: deciden quién gana en un conflicto real. */
  function fusionar(base, local, remoto, guardadoLocal, guardadoRemoto) {
    const ctx = {
      conflictos: [], ruta: [],
      ganaLocal: !(guardadoRemoto && guardadoLocal && guardadoRemoto > guardadoLocal)
    };
    const salida = fusionarValor(base, local, remoto, 'raiz', ctx);
    return { datos: salida, conflictos: ctx.conflictos, ganoLocal: ctx.ganaLocal };
  }

  return { fusionar, esColeccion, claveDe, SOLO_AÑADIR };
})();

if (typeof module !== 'undefined') module.exports = Fusion;
