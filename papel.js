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
    if (p && Number(p.precio)) return { precio: Number(p.precio), fecha: p.fecha || '', de: 'a mano' };
    const a = Store.activos().find(x => (x.ticker || '').toUpperCase() === tk);
    if (a && Number(a.cotizacion.precio)) return { precio: Number(a.cotizacion.precio), fecha: a.cotizacion.fecha, de: 'tu ficha' };
    try {
      const e = Store.universo().find(x => (x.ticker || '').toUpperCase() === tk);
      if (e && Number(e.precio)) return { precio: Number(e.precio), fecha: '', de: 'el cribado' };
    } catch (err) {}
    return { precio: 0, fecha: '', de: '' };
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
          <h3>Carteras de papel</h3>
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
        </tr>`).join('')}</tbody></table></div>
      ${orden.length > 1 ? `<p class="small mut" style="margin:10px 0 0">Compara «Al año», no «Gana»: una cartera de hace
        tres años y otra de hace dos meses no son comparables en total. Y con menos de veinte operaciones cerradas,
        el porcentaje de aciertos dice más de la suerte que del método.</p>` : ''}`;
  }

  function detalle(r) {
    const c = r.c;
    return `
      <div class="card">
        <div class="card-h">
          <h3>${Util.esc(c.nombre)}</h3>
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
              <td class="tick">${Util.esc(p.ticker)}${p.dePrecio ? `<small>precio de ${p.dePrecio}</small>` : ''}</td>
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
          ${r.cerradas.length > 1 ? `<span class="small mut" style="font-weight:400"> · mejor ${Util.esc(r.mejor.ticker)} ${Util.signo(r.mejor.pct, 0)} %
          · peor ${Util.esc(r.peor.ticker)} ${Util.signo(r.peor.pct, 0)} %${r.diasMedios ? ` · ${Util.num(r.diasMedios, 0)} días de media` : ''}</span>`
          : r.diasMedios ? `<span class="small mut" style="font-weight:400"> · ${Util.num(r.diasMedios, 0)} días en cartera</span>` : ''}</div>
        <div class="card-b tight tbl-wrap"><table>
          <thead><tr><th>Valor</th><th>Comprada</th><th>Vendida</th><th class="r">Títulos</th>
          <th class="r">Coste</th><th class="r">Ingreso</th><th class="r">Resultado</th><th class="r">Días</th></tr></thead>
          <tbody>${r.cerradas.slice().reverse().map(x => `
            <tr>
              <td class="tick">${Util.esc(x.ticker)}</td>
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
              <td class="tick">${Util.esc(o.ticker)}</td>
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
      titulo: c ? 'Editar la cartera' : 'Nueva cartera de papel',
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
        Util.toast(c ? 'Cartera guardada' : `«${nb}» en marcha`);
      }
    });
  }

  function borrar(id) {
    const c = cartera(id);
    Modal.abrir({
      titulo: `Borrar «${c.nombre}»`,
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
        Store.save(); Modal.cerrar(); Util.toast('Cartera borrada');
      }
    });
  }

  /* ---------- Comprar y vender ---------- */
  function operar(id, tipo, tkPrevio) {
    const c = cartera(id);
    const r = calcular(c);
    const venta = tipo === 'venta';
    if (venta && !r.posiciones.length) { Util.toast('No hay nada que vender todavía', 'err'); return; }

    Modal.abrir({
      titulo: venta ? `Vender en «${c.nombre}»` : `Comprar en «${c.nombre}»`,
      cuerpo: `
        ${venta ? `<div class="field"><label>Qué vendo</label>
            <select id="pa-otk">${r.posiciones.map(p => `<option value="${Util.esc(p.ticker)}" ${p.ticker === tkPrevio ? 'selected' : ''}>
              ${Util.esc(p.ticker)} · ${Util.num(p.titulos, 0)} títulos a ${Util.num(p.costeMedio)} de coste</option>`).join('')}</select></div>`
          : `<div class="field buscador"><label>Qué compro</label>
            <input id="pa-obuscar" placeholder="Nombre o ticker" autocomplete="off">
            <div id="pa-osug" class="sugerencias"></div></div>
            <div class="field" style="margin-top:10px"><label>Ticker</label><input id="pa-otk" placeholder="ITX"></div>`}
        <div class="form-grid" style="margin-top:12px">
          <div class="field"><label>Títulos</label><input type="number" step="any" id="pa-oti"></div>
          <div class="field"><label>Precio</label><input type="number" step="any" id="pa-opr"></div>
          <div class="field"><label>Fecha</label><input type="date" id="pa-ofe" value="${hoy()}"></div>
          <div class="field"><label>Comisión</label><input type="number" step="any" id="pa-oco" value="0"></div>
        </div>
        <div class="field" style="margin-top:12px"><label>Por qué lo hago</label>
          <input id="pa-ono" placeholder="Lo que te va a servir dentro de un año para entender la decisión"></div>
        <p class="small mut" id="pa-oinfo" style="margin-top:12px"></p>`,
      pie: `<button class="btn" data-cerrar>Cancelar</button><button class="btn pri" id="pa-ook">${venta ? 'Apuntar la venta' : 'Apuntar la compra'}</button>`,
      alAbrir: () => {
        const info = $('#pa-oinfo');
        const tkDe = () => (venta ? $('#pa-otk').value : $('#pa-otk').value.trim().toUpperCase());
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
          /* El mismo buscador del catálogo que en «Añadir activo» */
          const caja = $('#pa-obuscar'), lista = $('#pa-osug');
          let sug = [];
          const pintar = () => {
            lista.innerHTML = sug.map((x, i) => `<div class="sug" data-psug="${i}">
              <b>${Util.esc(x.ticker)}</b><span>${Util.esc(x.nombre)}</span>
              <em>${x.mercado ? Util.esc(x.mercado) : ''}</em></div>`).join('');
            lista.style.display = sug.length ? '' : 'none';
            $$('[data-psug]').forEach(d => d.onclick = () => {
              const x = sug[+d.dataset.psug];
              $('#pa-otk').value = x.ticker;
              caja.value = `${x.ticker} · ${x.nombre}`;
              sug = []; pintar(); ponPrecio(); refrescaInfo(); $('#pa-oti').focus();
            });
          };
          caja.oninput = () => { sug = VALORES.buscar(caja.value, 6); pintar(); };
          $('#pa-otk').onchange = () => { ponPrecio(); refrescaInfo(); };
        }
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
              Util.toast(`Solo tienes ${Util.num((p || {}).titulos || 0, 0)} títulos de ${tk}`, 'err'); return;
            }
          }
          Store.marcar(`${venta ? 'Venta' : 'Compra'} de papel en «${c.nombre}»`);
          c.operaciones.push({
            id: uid('po'), ticker: tk, tipo: venta ? 'venta' : 'compra',
            fecha: $('#pa-ofe').value || hoy(), titulos: tit, precio: pre,
            comision: Util.n($('#pa-oco').value), nota: $('#pa-ono').value.trim()
          });
          /* De paso guardo el precio para que la valoración no quede coja */
          if (!raiz().precios[tk]) raiz().precios[tk] = { precio: pre, fecha: $('#pa-ofe').value || hoy() };
          Store.save(); Modal.cerrar();
          Util.toast(`${venta ? 'Venta' : 'Compra'} apuntada en «${c.nombre}»`);
        };
      }
    });
  }

  return { render, calcular, todas, raiz, carteras, precio };
})();
