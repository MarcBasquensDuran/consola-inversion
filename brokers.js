/* ═══════════════════════════════════════════════════════════════
   IMPORTAR EXTRACTOS DE BRÓKERS

   Hoy entiende el CSV de transacciones de Trade Republic (Perfil →
   Extractos → Exportar transacciones). Está hecho para poder añadir
   más bancos: cada uno es un «lector» que sabe reconocer su archivo y
   traducir cada fila a un movimiento común.

   Reglas que no se negocian:
   · Nada entra sin enseñarte antes qué va a entrar.
   · Volver a importar el mismo archivo (o uno más largo que lo incluye)
     no duplica nada: cada movimiento lleva el identificador del bróker.
   · Lo que no se entiende no se importa a ciegas: se enseña y se deja fuera.
   · Todo se puede deshacer justo después.
   ═══════════════════════════════════════════════════════════════ */
const Brokers = (() => {

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  /* ---------- CSV robusto ----------
     Comillas, comas dentro de comillas, separador «,» o «;», y un caso
     muy común: abrir el CSV con Excel o Numbers y guardarlo, que envuelve
     cada línea entera en otras comillas («"datetime,""date"",…"»). */
  function partir(linea, sep) {
    const out = []; let cur = '', dentro = false;
    for (let i = 0; i < linea.length; i++) {
      const c = linea[i];
      if (dentro) {
        if (c === '"') { if (linea[i + 1] === '"') { cur += '"'; i++; } else dentro = false; }
        else cur += c;
      } else if (c === '"') dentro = true;
      else if (c === sep) { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur);
    return out;
  }
  function leerCSV(txt) {
    txt = String(txt || '').replace(/^﻿/, '');
    const lineas = txt.split(/\r?\n/).filter(l => l.trim());
    if (!lineas.length) return [];
    const sep = (lineas[0].match(/;/g) || []).length > (lineas[0].match(/,/g) || []).length ? ';' : ',';
    return lineas.map(l => {
      let c = partir(l, sep);
      /* Una sola celda que dentro lleva separadores: la línea venía envuelta */
      if (c.length === 1 && c[0].includes(sep)) c = partir(c[0], sep);
      return c.map(x => x.trim());
    });
  }

  /* ---------- Lectores ---------- */
  const LECTORES = [];

  /* Trade Republic */
  LECTORES.push({
    id: 'tr', nombre: 'Trade Republic', cuenta: 'Trade Republic',
    reconoce: cab => ['datetime', 'account_type', 'category', 'type', 'symbol', 'shares', 'amount', 'transaction_id']
      .every(k => cab.includes(k)),
    traducir(filas) {
      const cab = filas[0].map(x => x.toLowerCase());
      const v = (f, k) => f[cab.indexOf(k)] ?? '';
      const num = x => { const n = parseFloat(String(x).replace(',', '.')); return isFinite(n) ? n : 0; };
      return filas.slice(1).map(f => {
        const tipo = v(f, 'type').toUpperCase(), cat = v(f, 'category').toUpperCase();
        const isin = v(f, 'symbol').toUpperCase();
        const base = {
          ref: v(f, 'transaction_id'), fecha: v(f, 'date') || v(f, 'datetime').slice(0, 10),
          isin, nombre: v(f, 'name'), clase: v(f, 'asset_class').toUpperCase(),
          crudo: tipo, descripcion: v(f, 'description')
        };
        const titulos = Math.abs(num(v(f, 'shares')));
        const importe = num(v(f, 'amount'));
        const comision = Math.abs(num(v(f, 'fee')));
        const impuesto = Math.abs(num(v(f, 'tax')));
        /* El precio que da el bróker viene redondeado; lo que te cobraron es
           exacto, y es lo que vale para Hacienda: el precio sale de ahí */
        const precio = titulos && importe ? Math.abs(importe) / titulos : num(v(f, 'price'));
        const enDivisa = v(f, 'original_currency') && v(f, 'original_amount')
          ? `${v(f, 'original_amount')} ${v(f, 'original_currency')} al cambio ${v(f, 'fx_rate')}` : '';

        /* Compras: la normal, el plan de inversión, el redondeo y el saveback */
        if (isin && titulos && (cat === 'TRADING' || /SAVINGS|SAVEBACK|ROUND/.test(tipo)) && /BUY|SAVINGS|SAVEBACK|ROUND_?UP/.test(tipo)) {
          const regalo = /SAVEBACK/.test(tipo);
          return Object.assign(base, { tipo: 'compra', titulos, precio, comision,
            nota: regalo ? 'Saveback: acciones de regalo. Fiscalmente su valor de ese día es un rendimiento, y es también su coste.'
              : /SAVINGS/.test(tipo) ? 'Plan de inversión' : /ROUND/.test(tipo) ? 'Redondeo' : '',
            regalo });
        }
        if (isin && titulos && /SELL/.test(tipo)) {
          return Object.assign(base, { tipo: 'venta', titulos, precio, comision,
            nota: impuesto ? `El bróker retuvo ${impuesto.toFixed(2)} € en esta venta` : '' });
        }
        if (/DIVIDEND|DISTRIBUTION/.test(tipo) && isin) {
          return Object.assign(base, { tipo: 'dividendo', importe: Math.abs(importe), retencion: impuesto,
            titulosEnPoder: titulos, nota: enDivisa ? `Cobrado en origen: ${enDivisa}` : '' });
        }
        if (/INTEREST/.test(tipo)) {
          return Object.assign(base, { tipo: 'interes', importe: Math.abs(importe), retencion: impuesto });
        }
        /* Dinero que entra o sale de la cuenta, tarjeta, comisiones de cuenta… */
        if (!isin && (/TRANSFER|DEPOSIT|WITHDRAW|PAYOUT|CARD|PAYMENT/.test(tipo) || cat === 'CASH')) {
          return Object.assign(base, { tipo: 'ignorar', motivo: 'movimiento de dinero, no es una inversión',
            importe });
        }
        return Object.assign(base, { tipo: 'desconocido', importe, titulos });
      });
    }
  });

  function lectorDe(txt) {
    const filas = leerCSV(txt);
    if (filas.length < 2) return null;
    const cab = filas[0].map(x => x.toLowerCase().replace(/^"|"$/g, ''));
    filas[0] = cab;
    const l = LECTORES.find(x => x.reconoce(cab));
    return l ? { lector: l, filas } : null;
  }
  const reconoce = txt => !!lectorDe(txt);

  /* ---------- Del archivo al plan ---------- */
  const CLASES = { STOCK: 'accion', ETF: 'etf', FUND: 'fondo', BOND: 'bono', CRYPTO: 'cripto', DERIVATIVE: 'accion' };
  const idDe = (l, ref) => `${l.id}-${ref}`;

  function tickerSugerido(nombre, usados) {
    let t = '';
    if (typeof VALORES !== 'undefined') {
      const limpio = String(nombre || '').replace(/[()'.,]/g, ' ').replace(/\s+/g, ' ').trim();
      const r = VALORES.buscar(limpio, 1);
      if (r[0] && r[0].p <= 3) t = r[0].ticker;
    }
    if (!t) {
      /* Sin coincidencia: iniciales del nombre, para que tengas algo con lo que trabajar */
      const p = String(nombre || '').replace(/[^A-Za-zÀ-ÿ0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
      t = (p.length > 1 ? p.map(x => x[0]).join('') : (p[0] || 'NUEVO').slice(0, 5)).toUpperCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '').slice(0, 6);
    }
    let final = t, n = 2;
    while (usados.has(final)) final = `${t}${n++}`;
    usados.add(final);
    return { ticker: final, delCatalogo: !!(typeof VALORES !== 'undefined' && VALORES.exacto(final)) };
  }

  function planificar(lector, filas) {
    const movs = lector.traducir(filas);
    const yaOps = new Set(Store.ops().map(o => o.id));
    const yaRefs = new Set(Store.ops().map(o => o.ref).filter(Boolean));
    const yaInt = new Set((Store.get().intereses || []).map(i => i.id));
    const porIsin = new Map(Store.activos().filter(a => a.isin).map(a => [a.isin.toUpperCase(), a]));
    const usados = new Set(Store.activos().map(a => (a.ticker || '').toUpperCase()));

    const nuevos = [], repetidos = [], ignorados = [], desconocidos = [];
    movs.forEach(m => {
      const id = idDe(lector, m.ref);
      if (m.tipo === 'ignorar') { ignorados.push(m); return; }
      if (m.tipo === 'desconocido') { desconocidos.push(m); return; }
      if (yaOps.has(id) || yaRefs.has(id) || yaInt.has(id)) { repetidos.push(m); return; }
      nuevos.push(Object.assign(m, { id }));
    });

    /* Valores que no tienes todavía, por ISIN */
    const fichas = new Map();
    nuevos.filter(m => m.isin).forEach(m => {
      if (porIsin.has(m.isin) || fichas.has(m.isin)) return;
      const sug = tickerSugerido(m.nombre, usados);
      fichas.set(m.isin, { isin: m.isin, nombre: m.nombre || m.isin, tipo: CLASES[m.clase] || 'accion',
        ticker: sug.ticker, delCatalogo: sug.delCatalogo });
    });

    /* Dividendos de algo cuya compra no aparece por ningún lado */
    const huerfanos = [];
    const comprasDe = isin => {
      const a = porIsin.get(isin);
      const enCasa = a ? Store.ops().some(o => o.activoId === a.id && o.tipo === 'compra') : false;
      return enCasa || nuevos.some(m => m.isin === isin && m.tipo === 'compra');
    };
    [...new Set(nuevos.filter(m => m.tipo === 'dividendo').map(m => m.isin))].forEach(isin => {
      if (comprasDe(isin)) return;
      const d = nuevos.filter(m => m.isin === isin && m.tipo === 'dividendo').sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
      huerfanos.push({ isin, nombre: d.nombre, titulos: d.titulosEnPoder, fecha: d.fecha });
    });

    const fechas = movs.map(m => m.fecha).filter(Boolean).sort();
    return { lector, movs, nuevos, repetidos, ignorados, desconocidos, fichas: [...fichas.values()], porIsin, huerfanos,
      desde: fechas[0], hasta: fechas[fechas.length - 1] };
  }

  /* ---------- La ventana de «qué va a entrar» ---------- */
  function importar(txt, nombreArchivo) {
    const L = lectorDe(txt);
    if (!L) { Util.toast('No reconozco este archivo como un extracto de bróker', 'err'); return; }
    const p = planificar(L.lector, L.filas);
    const cuenta = t => p.nuevos.filter(m => m.tipo === t).length;
    const nC = cuenta('compra'), nV = cuenta('venta'), nD = cuenta('dividendo'), nI = cuenta('interes');
    const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
    const linea = [nC && plural(nC, 'compra', 'compras'), nV && plural(nV, 'venta', 'ventas'),
      nD && plural(nD, 'dividendo', 'dividendos'), nI && plural(nI, 'pago de intereses', 'pagos de intereses')].filter(Boolean).join(' · ');

    Modal.abrir({
      titulo: `Importar de ${p.lector.nombre}`, ancho: true,
      cuerpo: `
        <p class="small mut" style="margin:0 0 12px">${Util.esc(nombreArchivo || 'Extracto')} · ${p.movs.length} movimientos
          ${p.desde ? `del ${Util.fecha(p.desde)} al ${Util.fecha(p.hasta)}` : ''}</p>

        <div class="imp-resumen">
          <div class="imp-n ${p.nuevos.length ? 'si' : ''}"><b>${p.nuevos.length}</b><span>entran${linea ? `: ${linea}` : ''}</span></div>
          ${p.repetidos.length ? `<div class="imp-n"><b>${p.repetidos.length}</b><span>ya los tenías: no se duplican</span></div>` : ''}
          ${p.ignorados.length ? `<div class="imp-n"><b>${p.ignorados.length}</b><span>se dejan fuera: dinero que entra o sale de la cuenta, no son inversiones</span></div>` : ''}
        </div>

        ${p.fichas.length ? `
        <div class="bloque-t">Valores nuevos (${p.fichas.length})</div>
        <p class="small mut" style="margin:-4px 0 10px">Tu bróker los identifica por ISIN y el programa por ticker.
          He puesto el que encaja de la lista cuando lo hay; repásalos y cambia los que quieras.</p>
        <div class="tbl-wrap"><table class="imp-fichas">
          <thead><tr><th>Valor</th><th>Ticker</th><th>Tipo</th></tr></thead>
          <tbody>${p.fichas.map((f, i) => `<tr>
            <td class="tick">${Util.esc(f.nombre)}<small>${Util.esc(f.isin)}</small></td>
            <td><input class="imp-tk" data-imp-tk="${i}" value="${Util.esc(f.ticker)}" autocapitalize="characters">
              <small class="${f.delCatalogo ? 'mut' : 'neg'}">${f.delCatalogo ? 'de la lista' : 'inventado: cámbialo si quieres'}</small></td>
            <td><select data-imp-tp="${i}">${Object.entries(TIPOS).map(([k, l]) => `<option value="${k}" ${k === f.tipo ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
          </tr>`).join('')}</tbody></table></div>` : ''}

        ${p.huerfanos.length ? `<ul class="motivos" style="margin-top:14px"><li class="alta"><i class="sev"></i><div>
          <b>Dividendos sin su compra</b>
          <p>Cobras dividendos de ${p.huerfanos.map(h => `<b>${Util.esc(h.nombre)}</b> (${Util.num(h.titulos, h.titulos < 10 ? 4 : 0)} títulos)`).join(', ')},
          pero en el archivo no aparece la compra: seguramente es anterior a las fechas que exportaste.</p>
          <p>Se importan igual y saldrán en Cartera con un botón para apuntar la compra. Mejor aún:
          exporta el historial completo, desde el primer día, y vuelve a importarlo. Lo que ya esté no se duplica.</p>
        </div></li></ul>` : ''}

        ${p.desconocidos.length ? `<ul class="motivos" style="margin-top:14px"><li class="media"><i class="sev"></i><div>
          <b>${plural(p.desconocidos.length, 'movimiento que no sé interpretar', 'movimientos que no sé interpretar')}: no se importan</b>
          <p>${p.desconocidos.slice(0, 6).map(m => `${Util.fecha(m.fecha)} · ${Util.esc(m.crudo)} · ${Util.esc(m.nombre || m.descripcion || '')}`).join('<br>')}</p>
          <p>Si son importantes (un split, un traspaso de valores…), pásame esas líneas y le enseño al importador a entenderlas.</p>
        </div></li></ul>` : ''}

        ${nI ? `<p class="small mut" style="margin-top:14px">Los intereses de la cuenta no son ningún valor, así que no salen en la
          cartera: van a Fiscal, junto a los dividendos, porque tributan igual en la base del ahorro.</p>` : ''}

        <details class="mas-datos">
          <summary>Ver uno a uno lo que entra</summary>
          <div class="tbl-wrap"><table>
            <thead><tr><th>Fecha</th><th>Qué</th><th>Valor</th><th class="r">Títulos</th><th class="r">Precio / importe</th><th class="r">Comisión / retención</th></tr></thead>
            <tbody>${p.nuevos.slice().sort((a, b) => a.fecha.localeCompare(b.fecha)).map(m => `<tr>
              <td class="nowrap small">${Util.fecha(m.fecha)}</td>
              <td>${{ compra: 'Compra', venta: 'Venta', dividendo: 'Dividendo', interes: 'Intereses' }[m.tipo]}</td>
              <td class="small">${Util.esc(m.nombre || '—')}</td>
              <td class="r num">${m.titulos ? Util.num(m.titulos, m.titulos < 10 ? 4 : 0) : ''}</td>
              <td class="r num">${m.tipo === 'compra' || m.tipo === 'venta' ? Util.num(m.precio, 2) : Util.eur(m.importe, 2)}</td>
              <td class="r num">${m.tipo === 'compra' || m.tipo === 'venta' ? Util.eur(m.comision, 2) : Util.eur(m.retencion, 2)}</td>
            </tr>`).join('') || '<tr><td colspan="6" class="vacio">Nada nuevo.</td></tr>'}</tbody></table></div>
        </details>`,
      pie: `<button class="btn" data-cerrar>Cancelar</button>
            <button class="btn pri" id="imp-ok" ${p.nuevos.length ? '' : 'disabled'}>${p.nuevos.length ? `Importar ${p.nuevos.length}` : 'Nada nuevo que importar'}</button>`,
      alAbrir: () => {
        $$('[data-imp-tk]').forEach(i => i.addEventListener('input', () => { i.value = i.value.toUpperCase(); }));
        $('#imp-ok').onclick = () => aplicar(p);
      }
    });
  }

  function aplicar(p) {
    /* Los tickers que haya escrito, sin chocar con los que ya existen */
    const usados = new Set(Store.activos().map(a => (a.ticker || '').toUpperCase()));
    for (let i = 0; i < p.fichas.length; i++) {
      const t = ($(`[data-imp-tk="${i}"]`).value || '').trim().toUpperCase();
      if (!t) { Util.toast(`Falta el ticker de ${p.fichas[i].nombre}`, 'err'); $(`[data-imp-tk="${i}"]`).focus(); return; }
      if (usados.has(t)) { Util.toast(`Ya tienes otro valor con el ticker ${t}: elige otro`, 'err'); $(`[data-imp-tk="${i}"]`).focus(); return; }
      usados.add(t);
      p.fichas[i].ticker = t;
      p.fichas[i].tipo = $(`[data-imp-tp="${i}"]`).value;
    }

    Store.marcar(`Importar de ${p.lector.nombre}`);
    const cuenta = p.lector.cuenta;
    const hoy = Util.hoy();

    /* Fichas nuevas */
    const porIsin = new Map(p.porIsin);
    p.fichas.forEach(f => {
      const ultimo = p.nuevos.filter(m => m.isin === f.isin && (m.tipo === 'compra' || m.tipo === 'venta'))
        .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
      const a = Store.normalizar({ activos: [{
        id: Util.uid('ac'), ticker: f.ticker, nombre: f.nombre, isin: f.isin, tipo: f.tipo,
        estado: 'cartera', divisa: 'EUR', fx: 1,
        cotizacion: { precio: ultimo ? ultimo.precio : 0, fecha: ultimo ? ultimo.fecha : '' },
        notas: `Creada al importar de ${p.lector.nombre} el ${hoy}.`
      }] }).activos[0];
      Store.activos().push(a);
      porIsin.set(f.isin, a);
    });

    /* Movimientos */
    let n = 0;
    p.nuevos.forEach(m => {
      if (m.tipo === 'interes') {
        Store.get().intereses.push({ id: m.id, fecha: m.fecha, importe: m.importe, retencion: m.retencion, cuenta, ref: m.id });
        n++; return;
      }
      const a = porIsin.get(m.isin);
      if (!a) return;
      Store.ops().push({
        id: m.id, ref: m.id, activoId: a.id, tipo: m.tipo, fecha: m.fecha,
        titulos: m.tipo === 'dividendo' ? 0 : m.titulos,
        precio: m.tipo === 'dividendo' ? 0 : m.precio,
        importe: m.tipo === 'dividendo' ? m.importe : 0,
        comision: m.comision || 0, retencion: m.retencion || 0,
        cuenta, motivo: m.nota || ''
      });
      /* Una compra o venta del bróker es un precio real con fecha */
      if ((m.tipo === 'compra' || m.tipo === 'venta') && (!a.cotizacion.fecha || m.fecha >= a.cotizacion.fecha)) {
        a.cotizacion.precio = m.precio; a.cotizacion.fecha = m.fecha;
      }
      n++;
    });

    /* Lo que quedó sin títulos, a «cerrada» para que no salga como posición vacía */
    p.fichas.forEach(f => {
      const a = porIsin.get(f.isin);
      const tieneCompras = Store.ops().some(o => o.activoId === a.id && o.tipo === 'compra');
      if (tieneCompras && !Calc.posicion(a.id).abierta) a.estado = 'cerrada';
    });

    Store.save();
    Modal.cerrar();
    Util.toast(`${n} movimientos importados de ${p.lector.nombre}. Se puede deshacer desde el aviso de arriba.`);
  }

  function elegirArchivo() {
    Util.leerArchivo('.csv,.txt', (txt, nombre) => importar(txt, nombre));
  }

  return { reconoce, importar, elegirArchivo, leerCSV, lectorDe, planificar, LECTORES };
})();
