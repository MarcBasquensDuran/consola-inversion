/* ═══════════════════════════════════════════════════════════════
   CARTERAS DE PAPEL

   Carteras imaginarias para probar métodos sin poner dinero. Cada una
   es un método («PER bajo», «dividendos crecientes»…) con su dinero
   inicial y sus compras y ventas. Al final, una tabla las enfrenta
   para que puedas tirar las que van peor.

   Vive completamente aparte de la cartera de verdad: ni toca los
   totales, ni el rendimiento, ni el informe fiscal. No hay manera de
   que lo imaginario se te cuele en lo real.

   Los precios salen solos de los que ya tienes (fichas y universo del
   cribado) y, si no, los pones a mano aquí.
   ═══════════════════════════════════════════════════════════════ */
const Papel = (() => {

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const hoy = () => new Date().toISOString().slice(0, 10);
  const uid = p => p + Math.random().toString(36).slice(2, 9);

  /* ---------- Datos ---------- */
  function raiz() {
    const d = Store.get();
    if (!d.papel || typeof d.papel !== 'object') d.papel = {};
    if (!Array.isArray(d.papel.carteras)) d.papel.carteras = [];
    if (!d.papel.precios || typeof d.papel.precios !== 'object') d.papel.precios = {};
    /* Precios con fecha, ticker a ticker: con ellos se dibuja la curva de cada
       estrategia. Cada punto lleva id para que dos aparatos se junten sin pisarse */
    if (!d.papel.historial || typeof d.papel.historial !== 'object' || Array.isArray(d.papel.historial)) d.papel.historial = {};
    d.papel.carteras.forEach(c => {
      c.id = c.id || uid('pc');
      c.nombre = c.nombre || 'Sin nombre';
      c.metodo = c.metodo || '';
      c.creada = c.creada || hoy();
      c.capital = Number(c.capital) || 0;
      c.cerrada = !!c.cerrada;
      if (!Array.isArray(c.operaciones)) c.operaciones = [];
      c.operaciones.forEach(o => {
        o.id = o.id || uid('po');
        o.ticker = String(o.ticker || '').toUpperCase();
        o.tipo = o.tipo === 'venta' ? 'venta' : 'compra';
        o.fecha = o.fecha || hoy();
        o.titulos = Number(o.titulos) || 0;
        o.precio = Number(o.precio) || 0;
        o.comision = Number(o.comision) || 0;
      });
    });
    return d.papel;
  }
  const carteras = () => raiz().carteras;
  const cartera = id => carteras().find(c => c.id === id);

  /* El precio de hoy: primero el que hayas puesto aquí, luego el de tu
     ficha de ese valor, luego el del universo del cribado */
  function precio(tk) {
    tk = String(tk || '').toUpperCase();
    const p = raiz().precios[tk];
    if (p && Number(p.precio)) return { precio: Number(p.precio), fecha: p.fecha || '', de: p.fuente || 'a mano' };
    const a = Store.activos().find(x => (x.ticker || '').toUpperCase() === tk);
    if (a && Number(a.cotizacion.precio)) return { precio: Number(a.cotizacion.precio), fecha: a.cotizacion.fecha, de: 'tu ficha' };
    try {
      const e = Store.universo().find(x => (x.ticker || '').toUpperCase() === tk);
      if (e && Number(e.precio)) return { precio: Number(e.precio), fecha: '', de: 'el cribado' };
    } catch (err) {}
    return { precio: 0, fecha: '', de: '' };
  }

  function apuntarPrecio(tk, f, v) {
    tk = String(tk || '').toUpperCase(); v = Number(v);
    if (!tk || !f || !(v > 0)) return;
    const h = raiz().historial;
    const L = h[tk] = Array.isArray(h[tk]) ? h[tk] : [];
    const id = tk + '@' + f;
    const ya = L.find(x => x.id === id);
    if (ya) ya.v = v; else L.push({ id, f, v });
    L.sort((a, b) => a.f.localeCompare(b.f));
  }

  /* Todos los precios con fecha que sabemos de un valor: los apuntados aquí,
     los de cada compra y venta de papel, el histórico de su ficha si la tienes
     y el precio de hoy */
  function puntosPrecio(tk) {
    tk = String(tk || '').toUpperCase();
    const m = new Map();
    const pon = (f, v) => { if (f && Number(v) > 0) m.set(f, Number(v)); };
    const a = Store.activos().find(x => (x.ticker || '').toUpperCase() === tk);
    if (a) {
      (a.serie || []).forEach(t => pon(t.fecha, t.precio));
      pon(a.cotizacion.fecha, a.cotizacion.precio);
    }
    carteras().forEach(c => c.operaciones.forEach(o => { if (o.ticker === tk) pon(o.fecha, o.precio); }));
    (raiz().historial[tk] || []).forEach(p => pon(p.f, p.v));
    const hoyP = precio(tk);
    if (hoyP.precio && !m.has(hoy())) pon(hoyP.fecha || hoy(), hoyP.precio);
    return [...m.entries()].map(([f, v]) => ({ f, v })).sort((x, y) => x.f.localeCompare(y.f));
  }

  /* Precio en una fecha: el exacto si lo hay; si no, la recta entre los dos
     conocidos más cercanos, marcado como estimado para no engañar */
  function precioEn(pts, f) {
    if (!pts.length) return { v: 0, est: true };
    if (f <= pts[0].f) return { v: pts[0].v, est: f !== pts[0].f };
    const last = pts[pts.length - 1];
    if (f >= last.f) return { v: last.v, est: f !== last.f };
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].f === f) return { v: pts[i].v, est: false };
      if (pts[i].f > f) {
        const a = pts[i - 1], b = pts[i];
        const ta = new Date(a.f).getTime(), tb = new Date(b.f).getTime(), t = new Date(f).getTime();
        return { v: a.v + (b.v - a.v) * (t - ta) / (tb - ta), est: true };
      }
    }
    return { v: last.v, est: true };
  }

  /* Valor de una cartera de papel a lo largo del tiempo, en euros y en base
     100 sobre el dinero inicial. Aquí no entra ni sale dinero tras el primer
     día, así que la base 100 ya es una rentabilidad limpia. */
  function serie(c) {
    const ops = c.operaciones.slice().sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
    const tks = [...new Set(ops.map(o => o.ticker))];
    const pts = {}; tks.forEach(t => { pts[t] = puntosPrecio(t); });
    const fechas = [...new Set([c.creada, hoy(), ...ops.map(o => o.fecha),
      ...tks.flatMap(t => pts[t].map(p => p.f))])].filter(f => f && f >= c.creada && f <= hoy()).sort();
    return fechas.map(f => {
      let caja = c.capital; const tit = {};
      ops.filter(o => o.fecha <= f).forEach(o => {
        if (o.tipo === 'compra') { caja -= o.titulos * o.precio + o.comision; tit[o.ticker] = (tit[o.ticker] || 0) + o.titulos; }
        else { caja += o.titulos * o.precio - o.comision; tit[o.ticker] = (tit[o.ticker] || 0) - o.titulos; }
      });
      let valor = caja, est = false;
      Object.keys(tit).forEach(t => {
        if (tit[t] <= 0.0000001) return;
        const p = precioEn(pts[t], f);
        if (p.est) est = true;
        valor += tit[t] * p.v;
      });
      return { fecha: f, valor, base: c.capital > 0 ? valor / c.capital * 100 : 100, est };
    });
  }

  /* ---------- Cuentas ---------- */
  /* FIFO propio, más simple que el de la cartera real: aquí no hay
     fiscalidad ni divisas, solo saber qué queda y qué se ganó. */
  function calcular(c) {
    const lotes = {}, cerradas = [];
    let caja = c.capital, comisiones = 0, invertido = 0;

    c.operaciones.slice().sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '')).forEach(o => {
      const L = lotes[o.ticker] = lotes[o.ticker] || [];
      comisiones += o.comision;
      if (o.tipo === 'compra') {
        caja -= o.titulos * o.precio + o.comision;
        invertido += o.titulos * o.precio + o.comision;
        L.push({ fecha: o.fecha, titulos: o.titulos, precio: o.precio, comision: o.comision });
      } else {
        caja += o.titulos * o.precio - o.comision;
        let quedan = o.titulos, coste = 0, abierto = null;
        while (quedan > 0.0000001 && L.length) {
          const l = L[0];
          const usa = Math.min(l.titulos, quedan), parte = usa / l.titulos;
          coste += usa * l.precio + l.comision * parte;
          if (!abierto) abierto = l.fecha;
          l.titulos -= usa; l.comision -= l.comision * parte; quedan -= usa;
          if (l.titulos <= 0.0000001) L.shift();
        }
        const ingreso = o.titulos * o.precio - o.comision;
        cerradas.push({
          ticker: o.ticker, fecha: o.fecha, abierto, titulos: o.titulos,
          coste, ingreso, resultado: ingreso - coste,
          pct: coste > 0 ? (ingreso - coste) / coste * 100 : 0,
          dias: abierto ? Math.round((new Date(o.fecha) - new Date(abierto)) / 86400000) : null
        });
      }
    });

    const posiciones = Object.keys(lotes).map(tk => {
      const L = lotes[tk].filter(l => l.titulos > 0.0000001);
      if (!L.length) return null;
      const titulos = L.reduce((s, l) => s + l.titulos, 0);
      const coste = L.reduce((s, l) => s + l.titulos * l.precio + l.comision, 0);
      const pr = precio(tk);
      const valor = titulos * pr.precio;
      return {
        ticker: tk, titulos, coste, costeMedio: titulos ? coste / titulos : 0,
        precio: pr.precio, dePrecio: pr.de, valor: pr.precio ? valor : 0, sinPrecio: !pr.precio,
        latente: pr.precio ? valor - coste : 0,
        latentePct: pr.precio && coste > 0 ? (valor - coste) / coste * 100 : 0,
        desde: L[0].fecha
      };
    }).filter(Boolean).sort((a, b) => b.valor - a.valor);

    const enBolsa = posiciones.reduce((s, p) => s + p.valor, 0);
    const costeAbierto = posiciones.reduce((s, p) => s + p.coste, 0);
    const valor = caja + enBolsa;
    const realizado = cerradas.reduce((s, x) => s + x.resultado, 0);
    const latente = posiciones.reduce((s, p) => s + p.latente, 0);
    const dias = Math.max(1, Math.round((new Date(hoy()) - new Date(c.creada)) / 86400000));
    const total = c.capital > 0 ? (valor / c.capital - 1) * 100 : 0;
    const anos = dias / 365.25;
    const aciertos = cerradas.length ? cerradas.filter(x => x.resultado > 0).length / cerradas.length * 100 : null;
    const diasMedios = cerradas.filter(x => x.dias !== null).length
      ? cerradas.filter(x => x.dias !== null).reduce((s, x) => s + x.dias, 0) / cerradas.filter(x => x.dias !== null).length
      : null;

    return {
      c, caja, enBolsa, valor, costeAbierto, posiciones, cerradas, realizado, latente,
      comisiones, invertido, dias, total,
      anual: anos >= 0.25 && c.capital > 0 ? (Math.pow(valor / c.capital, 1 / anos) - 1) * 100 : null,
      aciertos, diasMedios,
      mejor: cerradas.slice().sort((a, b) => b.pct - a.pct)[0] || null,
      peor: cerradas.slice().sort((a, b) => a.pct - b.pct)[0] || null,
      sinPrecio: posiciones.filter(p => p.sinPrecio).map(p => p.ticker)
    };
  }

  const todas = () => carteras().map(calcular);

  /* ---------- Pintar ---------- */
  function render() {
    const z = $('#papel-zona');
    if (!z) return;
    const rs = todas();
    const act = raiz().activa && cartera(raiz().activa) ? raiz().activa : (carteras()[0] || {}).id;
    raiz().activa = act;

    z.innerHTML = `
      <div class="card no-print">
        <div class="card-h">
          <h3><span class="papel-sello">Papel</span>Carteras imaginarias</h3>
          <div class="sub">${rs.length ? `${rs.length} ${rs.length === 1 ? 'método' : 'métodos'} en marcha` : 'Dinero imaginario para probar métodos sin arriesgar nada'}</div>
          <div class="toolbar"><button class="btn pri" id="pa-nueva">Nueva cartera</button></div>
        </div>
        <div class="card-b">
          <p class="small mut" style="margin-top:0">Esto no toca nada de lo real: ni los totales de tu cartera, ni el
          rendimiento, ni el informe fiscal. Los precios se cogen de tus fichas y del cribado; los que falten, se ponen a mano.</p>
          ${rs.length ? comparativa(rs) : `<div class="vacio" style="padding:26px 10px">
            <b>Todavía no hay ninguna</b>Crea una por cada método que quieras probar («PER bajo», «solo dividendos»,
            «lo que diga el semáforo»…), ponle un dinero inicial y ve apuntando compras y ventas.
            Dentro de unos meses la tabla te dirá cuál merece la pena.</div>`}
        </div>
      </div>
      ${rs.length ? detalle(rs.find(r => r.c.id === act) || rs[0]) : ''}`;

    $('#pa-nueva').onclick = () => editar(null);
    $$('[data-pa-ver]').forEach(b => b.onclick = () => { raiz().activa = b.dataset.paVer; Store.guardar(); render(); });
    $$('[data-pa-ed]').forEach(b => b.onclick = () => editar(b.dataset.paEd));
    $$('[data-pa-op]').forEach(b => b.onclick = () => operar(b.dataset.paOp, b.dataset.paTipo, b.dataset.paTk));
    $$('[data-pa-del]').forEach(b => b.onclick = () => borrar(b.dataset.paDel));
    $$('[data-pa-opdel]').forEach(b => b.onclick = () => {
      const c = cartera(raiz().activa);
      Store.marcar('Borrar operación de papel');
      c.operaciones.splice(c.operaciones.findIndex(o => o.id === b.dataset.paOpdel), 1);
      Store.save();
    });
    $$('[data-pa-precio]').forEach(i => i.onchange = () => {
      raiz().precios[i.dataset.paPrecio] = { precio: Util.n(i.value), fecha: hoy() };
      apuntarPrecio(i.dataset.paPrecio, hoy(), Util.n(i.value));
      Store.save();
    });
  }

  function comparativa(rs) {
    const orden = rs.slice().sort((a, b) => b.total - a.total);
    const act = raiz().activa;
    return `<div class="tbl-wrap"><table>
      <thead><tr><th>Método</th><th class="r">Dinero inicial</th><th class="r">Vale hoy</th>
      <th class="r">Gana</th><th class="r">Al año</th><th class="r">Operaciones</th>
      <th class="r">Aciertos</th><th class="r">Abiertas</th><th class="no-print"></th></tr></thead>
      <tbody>${orden.map((r, i) => `
        <tr class="${r.c.id === act ? 'sel' : ''}">
          <td class="tick">${i === 0 && orden.length > 1 && r.total > 0 ? '<i class="corona" title="La que mejor va">★</i> ' : ''}${Util.esc(r.c.nombre)}
            <small>${r.c.cerrada ? 'cerrada · ' : ''}desde ${Util.fecha(r.c.creada)} · ${r.dias} días</small></td>
          <td class="r num">${Util.eur(r.c.capital, 0)}</td>
          <td class="r num">${Util.eur(r.valor, 0)}</td>
          <td class="r num ${r.total >= 0 ? 'pos' : 'neg'}">${Util.signo(r.total)} %</td>
          <td class="r num ${(r.anual || 0) >= 0 ? 'pos' : 'neg'}">${r.anual === null ? '—' : Util.signo(r.anual) + ' %'}</td>
          <td class="r num">${r.c.operaciones.length}</td>
          <td class="r num">${r.aciertos === null ? '—' : Util.num(r.aciertos, 0) + ' %'}</td>
          <td class="r num">${r.posiciones.length}</td>
          <td class="no-print nowrap">
            <button class="btn mini" data-pa-ver="${r.c.id}">Ver</button>
            <button class="btn mini" data-pa-ed="${r.c.id}">Editar</button>
            <button class="btn mini" data-pa-del="${r.c.id}">Borrar</button></td>
        </tr>`).join('')}
        ${referencias()}</tbody></table></div>
      ${orden.length > 1 ? `<p class="small mut" style="margin:10px 0 0">Compara «Al año», no «Gana»: una cartera de hace
        tres años y otra de hace dos meses no son comparables en total. Y con menos de veinte operaciones cerradas,
        el porcentaje de aciertos dice más de la suerte que del método.</p>` : ''}`;
  }

  /* Dos filas grises para saber si un método merece la pena: no basta con
     ganar a los demás métodos, hay que ganar a no hacer nada (el índice) */
  function referencias() {
    let r = null;
    try { r = Calc.rendimiento(); } catch (e) {}
    if (!r) return `<tr class="ref"><td class="tick" colspan="9"><small>Tu cartera real y el índice saldrán aquí como referencia
      en cuanto haya operaciones reales y precios de la referencia (pestaña Análisis).</small></td></tr>`;
    const fila = (nombre, sub, total, anual) => `
      <tr class="ref">
        <td class="tick">${nombre}<small>${sub}</small></td>
        <td class="r num">—</td><td class="r num">—</td>
        <td class="r num ${total >= 0 ? 'pos' : 'neg'}">${Util.signo(total)} %</td>
        <td class="r num ${anual >= 0 ? 'pos' : 'neg'}">${Util.signo(anual)} %</td>
        <td colspan="4" class="small mut">referencia</td>
      </tr>`;
    return fila('Tu cartera real', `desde ${Util.fecha(r.desde)} · sin contar cuándo metiste el dinero`, r.twr, r.twrAnual)
      + (r.ref ? fila(Util.esc(r.ref.nombre), 'el índice en el mismo periodo', r.indice, r.indiceAnual) : '');
  }

  function detalle(r) {
    const c = r.c;
    return `
      <div class="card">
        <div class="card-h">
          <h3><span class="papel-sello">Papel</span>${Util.esc(c.nombre)}</h3>
          <div class="sub">${Util.esc(c.metodo || 'Sin método escrito')}</div>
          <div class="toolbar">
            <button class="btn" data-pa-op="${c.id}" data-pa-tipo="venta">Vender</button>
            <button class="btn pri" data-pa-op="${c.id}" data-pa-tipo="compra">Comprar</button>
          </div>
        </div>
        <div class="card-b">
          <div class="hdr-metrics" style="margin-bottom:4px">
            <div class="hdr-metric"><b class="num">${Util.eur(r.valor, 0)}</b><span>Vale hoy</span></div>
            <div class="hdr-metric"><b class="num ${r.total >= 0 ? 'pos' : 'neg'}">${Util.signo(r.total)} %</b><span>Desde el principio</span></div>
            <div class="hdr-metric"><b class="num">${Util.eur(r.caja, 0)}</b><span>Sin invertir</span></div>
            <div class="hdr-metric"><b class="num ${r.realizado >= 0 ? 'pos' : 'neg'}">${Util.eur(r.realizado, 0)}</b><span>Ya realizado</span></div>
            <div class="hdr-metric"><b class="num ${r.latente >= 0 ? 'pos' : 'neg'}">${Util.eur(r.latente, 0)}</b><span>Latente</span></div>
            <div class="hdr-metric"><b class="num">${Util.eur(r.comisiones, 0)}</b><span>En comisiones</span></div>
          </div>
          ${r.caja < 0 ? `<ul class="motivos" style="margin-top:12px"><li class="alta"><i class="sev"></i><div>
            <b>Has gastado más de lo que pusiste</b>
            <p>Te faltan ${Util.eur(-r.caja, 0)}. En la vida real esa compra no habría entrado. Sube el dinero inicial
            o quita alguna compra para que la prueba valga de algo.</p></div></li></ul>` : ''}
          ${r.sinPrecio.length ? `<ul class="motivos" style="margin-top:12px"><li class="media"><i class="sev"></i><div>
            <b>Sin precio de hoy: ${r.sinPrecio.join(', ')}</b>
            <p>Esas posiciones cuentan como cero y hunden el resultado. Pon el precio abajo, en la tabla.</p></div></li></ul>` : ''}
        </div>

        <div class="bloque-t" style="padding:0 var(--pad)">Lo que tiene ahora</div>
        <div class="card-b tight tbl-wrap"><table>
          <thead><tr><th>Valor</th><th class="r">Títulos</th><th class="r">Coste medio</th>
          <th class="r">Precio</th><th class="r">Valor</th><th class="r">Latente</th><th>Desde</th><th class="no-print"></th></tr></thead>
          <tbody>${r.posiciones.length ? r.posiciones.map(p => `
            <tr>
              <td class="tick">${Util.nt(p.ticker, p.dePrecio ? 'precio de ' + Util.esc(p.dePrecio) : '')}</td>
              <td class="r num">${Util.num(p.titulos, p.titulos < 10 ? 2 : 0)}</td>
              <td class="r num">${Util.num(p.costeMedio)}</td>
              <td class="r"><input type="number" step="any" class="num" style="width:88px;text-align:right"
                   value="${p.precio || ''}" placeholder="—" data-pa-precio="${p.ticker}"></td>
              <td class="r num">${p.sinPrecio ? '—' : Util.eur(p.valor, 0)}</td>
              <td class="r num ${p.latente >= 0 ? 'pos' : 'neg'}">${p.sinPrecio ? '—' : Util.signo(p.latentePct) + ' %'}</td>
              <td class="small soft">${Util.fecha(p.desde)}</td>
              <td class="no-print"><button class="btn mini" data-pa-op="${c.id}" data-pa-tipo="venta" data-pa-tk="${Util.esc(p.ticker)}">Vender</button></td>
            </tr>`).join('') : `<tr><td colspan="8" class="vacio">Nada comprado todavía.</td></tr>`}</tbody>
        </table></div>

        ${r.cerradas.length ? `
        <div class="bloque-t" style="padding:0 var(--pad)">Operaciones cerradas
          ${r.cerradas.length > 1 ? `<span class="small mut" style="font-weight:400"> · mejor ${Util.esc(Util.nombreDe(r.mejor.ticker))} ${Util.signo(r.mejor.pct, 0)} %
          · peor ${Util.esc(Util.nombreDe(r.peor.ticker))} ${Util.signo(r.peor.pct, 0)} %${r.diasMedios ? ` · ${Util.num(r.diasMedios, 0)} días de media` : ''}</span>`
          : r.diasMedios ? `<span class="small mut" style="font-weight:400"> · ${Util.num(r.diasMedios, 0)} días en cartera</span>` : ''}</div>
        <div class="card-b tight tbl-wrap"><table>
          <thead><tr><th>Valor</th><th>Comprada</th><th>Vendida</th><th class="r">Títulos</th>
          <th class="r">Coste</th><th class="r">Ingreso</th><th class="r">Resultado</th><th class="r">Días</th></tr></thead>
          <tbody>${r.cerradas.slice().reverse().map(x => `
            <tr>
              <td class="tick">${Util.nt(x.ticker)}</td>
              <td class="small soft">${x.abierto ? Util.fecha(x.abierto) : '—'}</td>
              <td class="small soft">${Util.fecha(x.fecha)}</td>
              <td class="r num">${Util.num(x.titulos, 0)}</td>
              <td class="r num">${Util.eur(x.coste, 0)}</td>
              <td class="r num">${Util.eur(x.ingreso, 0)}</td>
              <td class="r num ${x.resultado >= 0 ? 'pos' : 'neg'}">${Util.eur(x.resultado, 0)} (${Util.signo(x.pct, 0)} %)</td>
              <td class="r num">${x.dias === null ? '—' : x.dias}</td>
            </tr>`).join('')}</tbody>
        </table></div>` : ''}

        <div class="bloque-t" style="padding:0 var(--pad)">Todo lo apuntado</div>
        <div class="card-b tight tbl-wrap"><table>
          <thead><tr><th>Fecha</th><th>Qué</th><th>Valor</th><th class="r">Títulos</th>
          <th class="r">Precio</th><th class="r">Comisión</th><th>Nota</th><th class="no-print"></th></tr></thead>
          <tbody>${c.operaciones.length ? c.operaciones.slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).map(o => `
            <tr>
              <td class="small soft">${Util.fecha(o.fecha)}</td>
              <td><span class="pill ${o.tipo === 'compra' ? 'comprar' : 'vender'}">${o.tipo === 'compra' ? 'Compra' : 'Venta'}</span></td>
              <td class="tick">${Util.nt(o.ticker)}</td>
              <td class="r num">${Util.num(o.titulos, 0)}</td>
              <td class="r num">${Util.num(o.precio)}</td>
              <td class="r num">${Util.num(o.comision)}</td>
              <td class="small soft">${Util.esc(o.nota || '')}</td>
              <td class="no-print"><button class="btn mini" data-pa-opdel="${o.id}">Borrar</button></td>
            </tr>`).join('') : `<tr><td colspan="8" class="vacio">Sin operaciones.</td></tr>`}</tbody>
        </table></div>
      </div>`;
  }

  /* ---------- Crear y editar ---------- */
  function editar(id) {
    const c = id ? cartera(id) : null;
    Modal.abrir({
      titulo: c ? 'Papel · Editar la cartera' : 'Papel · Nueva cartera imaginaria', clase: 'papel',
      cuerpo: `<div class="form-grid">
          <div class="field"><label>Nombre del método</label>
            <input id="pa-nb" placeholder="PER bajo en small caps" value="${c ? Util.esc(c.nombre) : ''}"></div>
          <div class="field"><label>Dinero inicial (€)</label>
            <input type="number" step="any" id="pa-cap" value="${c ? c.capital : 10000}"></div>
          <div class="field"><label>Empieza el</label>
            <input type="date" id="pa-fe" value="${c ? c.creada : hoy()}"></div>
          <div class="field"><label>¿Cerrada?</label>
            <select id="pa-cerr"><option value="">En marcha</option><option value="1" ${c && c.cerrada ? 'selected' : ''}>Cerrada, ya no la toco</option></select></div>
        </div>
        <div class="field" style="margin-top:12px"><label>En qué consiste el método</label>
          <textarea id="pa-me" placeholder="Qué compro, cuándo lo compro y cuándo lo vendo. Cuanto más concreto, más sirve la prueba.">${c ? Util.esc(c.metodo) : ''}</textarea></div>`,
      pie: `<button class="btn" data-cerrar>Cancelar</button><button class="btn pri" id="pa-ok">${c ? 'Guardar' : 'Crear'}</button>`,
      alAbrir: () => $('#pa-ok').onclick = () => {
        const nb = $('#pa-nb').value.trim();
        if (!nb) { Util.toast('Ponle un nombre al método', 'err'); return; }
        Store.marcar(c ? 'Editar cartera de papel' : 'Nueva cartera de papel');
        if (c) {
          c.nombre = nb; c.capital = Util.n($('#pa-cap').value);
          c.creada = $('#pa-fe').value || c.creada;
          c.metodo = $('#pa-me').value.trim(); c.cerrada = !!$('#pa-cerr').value;
        } else {
          const nueva = {
            id: uid('pc'), nombre: nb, capital: Util.n($('#pa-cap').value) || 10000,
            creada: $('#pa-fe').value || hoy(), metodo: $('#pa-me').value.trim(),
            cerrada: false, operaciones: []
          };
          carteras().push(nueva);
          raiz().activa = nueva.id;
        }
        Store.save(); Modal.cerrar();
        Util.toast(c ? 'Cartera de papel guardada' : `Cartera de papel «${nb}» en marcha`);
      }
    });
  }

  function borrar(id) {
    const c = cartera(id);
    Modal.abrir({
      titulo: `Papel · Borrar «${c.nombre}»`, clase: 'papel',
      cuerpo: `<p>Se va con sus ${c.operaciones.length} ${c.operaciones.length === 1 ? 'operación' : 'operaciones'}.</p>
        <p class="small mut" style="margin-top:10px">Si lo que quieres es dejar de tocarla pero conservar el resultado
        para comparar, mejor edítala y márcala como «cerrada».</p>
        <p class="small mut">Se puede deshacer desde el aviso de arriba.</p>`,
      pie: `<button class="btn" data-cerrar>Cancelar</button><button class="btn pri" id="pa-bok">Borrar</button>`,
      alAbrir: () => $('#pa-bok').onclick = () => {
        Store.marcar(`Borrar la cartera de papel «${c.nombre}»`);
        const L = carteras();
        L.splice(L.findIndex(x => x.id === id), 1);
        if (raiz().activa === id) raiz().activa = (L[0] || {}).id || '';
        Store.save(); Modal.cerrar(); Util.toast('Cartera de papel borrada');
      }
    });
  }

  /* ---------- Comprar y vender ---------- */
  /* «Probar en papel» desde la lista de vigilancia */
  function probar(tk, nombre) {
    if (!carteras().length) {
      Util.toast('Crea antes una cartera de papel: una por método que quieras probar', 'err');
      if (typeof ModoCartera !== 'undefined') ModoCartera.poner('papel');
      setTimeout(() => editar(null), 250);
      return;
    }
    operar(raiz().activa && cartera(raiz().activa) ? raiz().activa : carteras()[0].id, 'compra', tk, { elegir: true, nombre });
  }

  function operar(id, tipo, tkPrevio, extra) {
    extra = extra || {};
    const c = cartera(id);
    let r = calcular(c);
    const venta = tipo === 'venta';
    if (venta && !r.posiciones.length) { Util.toast('No hay nada que vender todavía', 'err'); return; }

    Modal.abrir({
      titulo: venta ? `Papel · Vender en «${c.nombre}»` : `Papel · Comprar en «${c.nombre}»`, clase: 'papel',
      cuerpo: `
        ${venta ? `<div class="field"><label>Qué vendo</label>
            <select id="pa-otk">${r.posiciones.map(p => `<option value="${Util.esc(p.ticker)}" ${p.ticker === tkPrevio ? 'selected' : ''}>
              ${Util.esc(Util.nombreDe(p.ticker))} (${Util.esc(p.ticker)}) · ${Util.num(p.titulos, 0)} títulos a ${Util.num(p.costeMedio)} de coste</option>`).join('')}</select></div>`
          : `${extra.elegir && carteras().length > 1 ? `<div class="field" style="margin-bottom:12px"><label>En qué cartera de papel</label>
            <select id="pa-ocar">${carteras().filter(x => !x.cerrada || x.id === c.id).map(x => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${Util.esc(x.nombre)}</option>`).join('')}</select></div>` : ''}
            <div class="field"><label>Qué compro</label>
            <input id="pa-otk" placeholder="Escribe el ticker o el nombre y elige" value="${tkPrevio && !venta ? Util.esc(tkPrevio) : ''}">
            <div class="small mut" id="pa-onb" style="margin-top:5px">${extra.nombre ? Util.esc(extra.nombre) : ''}</div></div>`}
        <div class="form-grid" style="margin-top:12px">
          <div class="field"><label>Títulos</label><input type="number" step="any" id="pa-oti"></div>
          <div class="field"><label>Precio</label><input type="number" step="any" id="pa-opr"></div>
          <div class="field"><label>Fecha</label><input type="date" id="pa-ofe" value="${hoy()}"></div>
          <div class="field"><label>Comisión</label><input type="number" step="any" id="pa-oco" value="0"></div>
        </div>
        <div class="field" style="margin-top:12px"><label>Por qué lo hago</label>
          <input id="pa-ono" placeholder="Lo que te va a servir dentro de un año para entender la decisión"></div>
        <p class="small mut" id="pa-oinfo" style="margin-top:12px"></p>`,
      pie: `<button class="btn" data-cerrar>Cancelar</button><button class="btn pri" id="pa-ook">${venta ? 'Apuntar venta imaginaria' : 'Apuntar compra imaginaria'}</button>`,
      alAbrir: () => {
        const info = $('#pa-oinfo');
        const tkDe = () => (venta ? $('#pa-otk').value : $('#pa-otk').value.split('·')[0].trim().toUpperCase());
        const ponPrecio = () => {
          const pr = precio(tkDe());
          if (pr.precio && !$('#pa-opr').value) $('#pa-opr').value = pr.precio;
        };
        const refrescaInfo = () => {
          const tit = Util.n($('#pa-oti').value), pre = Util.n($('#pa-opr').value), com = Util.n($('#pa-oco').value);
          const importe = tit * pre + (venta ? -com : com);
          if (!tit || !pre) { info.textContent = `Sin invertir tienes ${Util.eur(r.caja, 0)}.`; return; }
          if (venta) { info.textContent = `Ingresarías ${Util.eur(importe, 0)} y te quedarían ${Util.eur(r.caja + importe, 0)} sin invertir.`; return; }
          const queda = r.caja - importe;
          info.innerHTML = queda < 0
            ? `<span class="neg">Te costaría ${Util.eur(importe, 0)} y solo tienes ${Util.eur(r.caja, 0)}: te pasarías ${Util.eur(-queda, 0)}.</span>`
            : `Te costaría ${Util.eur(importe, 0)} y te quedarían ${Util.eur(queda, 0)} sin invertir.`;
        };
        ['#pa-oti', '#pa-opr', '#pa-oco'].forEach(s => { $(s).oninput = refrescaInfo; });
        if (venta) {
          $('#pa-otk').onchange = () => { $('#pa-opr').value = ''; ponPrecio(); refrescaInfo(); };
          const p0 = r.posiciones.find(p => p.ticker === $('#pa-otk').value);
          if (p0) $('#pa-oti').value = p0.titulos;
        } else if (typeof VALORES !== 'undefined') {
          /* El mismo buscador que en «Añadir activo»: se escribe en el propio campo */
          VALORES.enganchar($('#pa-otk'), {
            elegir: x => {
              $('#pa-otk').value = x.ticker;
              $('#pa-onb').textContent = x.nombre;
              $('#pa-opr').value = '';
              ponPrecio(); refrescaInfo();
              if (document.activeElement) document.activeElement.blur();
            }
          });
          $('#pa-otk').addEventListener('input', () => { $('#pa-onb').textContent = ''; });
          $('#pa-otk').addEventListener('change', () => { ponPrecio(); refrescaInfo(); });
        }
        /* Si cambia de cartera, las cuentas de «sin invertir» son de la nueva */
        if ($('#pa-ocar')) $('#pa-ocar').onchange = () => { r = calcular(cartera($('#pa-ocar').value)); refrescaInfo(); };
        ponPrecio(); refrescaInfo();

        $('#pa-ook').onclick = () => {
          const tk = tkDe();
          const tit = Util.n($('#pa-oti').value), pre = Util.n($('#pa-opr').value);
          if (!tk) { Util.toast('Falta el ticker', 'err'); return; }
          if (tit <= 0) { Util.toast('Faltan los títulos', 'err'); return; }
          if (pre <= 0) { Util.toast('Falta el precio', 'err'); return; }
          if (venta) {
            const p = r.posiciones.find(x => x.ticker === tk);
            if (!p || tit > p.titulos + 0.0000001) {
              Util.toast(`Solo tienes ${Util.num((p || {}).titulos || 0, 0)} títulos de ${Util.nombreDe(tk)}`, 'err'); return;
            }
          }
          const destino = ($('#pa-ocar') && cartera($('#pa-ocar').value)) || c;
          Store.marcar(`${venta ? 'Venta' : 'Compra'} de papel en «${destino.nombre}»`);
          destino.operaciones.push({
            id: uid('po'), ticker: tk, tipo: venta ? 'venta' : 'compra',
            fecha: $('#pa-ofe').value || hoy(), titulos: tit, precio: pre,
            comision: Util.n($('#pa-oco').value), nota: $('#pa-ono').value.trim()
          });
          /* De paso guardo el precio para que la valoración no quede coja */
          if (!raiz().precios[tk]) raiz().precios[tk] = { precio: pre, fecha: $('#pa-ofe').value || hoy() };
          apuntarPrecio(tk, $('#pa-ofe').value || hoy(), pre);
          Store.save(); Modal.cerrar();
          raiz().activa = destino.id;
          Util.toast(`${venta ? 'Venta' : 'Compra'} imaginaria apuntada en «${destino.nombre}»`);
        };
      }
    });
  }

  return { render, calcular, todas, raiz, carteras, cartera, precio, serie, probar, apuntarPrecio };
})();
