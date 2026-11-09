/* ═══════════════ PRECIOS AUTOMÁTICOS · GOOGLE FINANCE ═══════════════
   Google no da los precios de Google Finance a programas como este, pero
   sí deja usarlos en una hoja de cálculo con la fórmula GOOGLEFINANCE.
   Así que la consola crea una hoja suya en tu carpeta de Drive, escribe en
   ella una fórmula por valor, espera a que Google la calcule y lee el
   resultado. Tú no tienes que abrir la hoja nunca.

   - Retraso: hasta unos 20 minutos respecto a la bolsa.
   - Cubre acciones y ETF de las bolsas grandes, y criptomonedas.
     Los fondos europeos no están: esos siguen con el extracto o a mano.
   - Usa el mismo permiso que Drive (solo los archivos que crea la app),
     pero necesita la «Google Sheets API» activada en tu proyecto. */
const Precios = (() => {
  const NOMBRE = 'Precios · Consola de inversión';
  const HOJA = 'precios';
  const FUENTE = 'Google Finance';
  const CADA_MIN = 30;                      /* como mucho, una vez cada media hora */
  const KEY = 'ENGINE_CARTERA_V1_PRECIOS';  /* el estado de ESTE aparato: no se sincroniza */
  let enCurso = false;

  /* Lo que se comparte entre aparatos (en tus datos): si está encendido y qué hoja usar */
  const conf = () => {
    const aj = Store.ajustes();
    aj.precios = Object.assign({ activo: false, hojaId: '' }, aj.precios || {});
    return aj.precios;
  };
  /* Lo que es de este aparato: cuándo fue la última vez y qué salió */
  let est = { ultima: '', error: '', ok: 0, sinDato: [], sinCodigo: [], total: 0 };
  try { est = Object.assign(est, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const guardarEst = () => { try { localStorage.setItem(KEY, JSON.stringify(est)); } catch (e) {} };

  const espera = ms => new Promise(r => setTimeout(r, ms));
  const api = (url, o) => Nube.api(url, o);
  const json = (metodo, cuerpo) => ({ method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
  const S = 'https://sheets.googleapis.com/v4/spreadsheets';

  /* ---- Qué valores se buscan ---- */
  function lista() {
    const filas = [], sinCodigo = [], vistos = new Set();
    Store.activos().forEach(a => {
      if (a.estado === 'descartada') return;
      const c = Enlaces.codigo(a);
      if (!c) { if (a.estado !== 'cerrada') sinCodigo.push({ id: a.id, ticker: a.ticker, tipo: a.tipo }); return; }
      vistos.add(String(a.ticker || '').toUpperCase());
      filas.push({ clave: a.id, codigo: c, divisa: a.divisa || 'EUR', ticker: a.ticker });
    });
    /* Los valores que solo están en tus carteras de papel */
    if (typeof Papel !== 'undefined') {
      const tks = new Set();
      Papel.carteras().forEach(c => (c.operaciones || []).forEach(o => o.ticker && tks.add(String(o.ticker).toUpperCase())));
      tks.forEach(tk => {
        if (vistos.has(tk)) return;
        const v = (typeof VALORES !== 'undefined' && VALORES.exacto(tk)) || {};
        const c = Enlaces.codigo({ ticker: tk, mercado: v.mercado || '', tipo: v.tipo || '' });
        if (c) filas.push({ clave: 'papel:' + tk, codigo: c, divisa: 'EUR', ticker: tk });
      });
    }
    return { filas, sinCodigo };
  }

  /* Una fila de la hoja. La hoja va en inglés para que las fórmulas
     lleven comas y punto decimal, como las entiende la API. */
  function fila(f, i) {
    const r = i + 2, B = 'B' + r, D = 'D' + r, F = 'F' + r;
    return [
      f.clave, f.codigo,
      `=IFERROR(GOOGLEFINANCE(${B},"price"),"")`,
      `=IF(LEFT(${B},9)="CURRENCY:",RIGHT(${B},3),IFERROR(GOOGLEFINANCE(${B},"currency"),""))`,
      `=IF(LEFT(${B},9)="CURRENCY:","",IFERROR(TEXT(GOOGLEFINANCE(${B},"tradetime"),"yyyy-mm-dd"),""))`,
      f.divisa,
      /* Factor para pasar de la divisa de la bolsa a la de tu ficha.
         Londres cotiza en peniques (GBX): cien peniques, una libra. */
      `=IF(${D}="","",IF(${D}=${F},1,IF(AND(${D}="GBX",${F}="GBP"),0.01,IFERROR(GOOGLEFINANCE("CURRENCY:"&IF(${D}="GBX","GBP",${D})&${F})*IF(${D}="GBX",0.01,1),""))))`,
      `=IF(${F}="EUR",1,IFERROR(GOOGLEFINANCE("CURRENCY:"&${F}&"EUR"),""))`
    ];
  }

  /* ---- La hoja: la que ya hay o una nueva dentro de tu carpeta ---- */
  function asegurarHoja() {
    const c = conf();
    const comprobar = id => api(`${S}/${id}?fields=spreadsheetId`).then(() => id).catch(e => {
      if (/no encuentra/.test(e.message)) return '';
      throw e;
    });
    return (c.hojaId ? comprobar(c.hojaId) : Promise.resolve('')).then(id => {
      if (id) return id;
      /* Quizá la creó otro de tus aparatos y aún no ha llegado su aviso */
      const q = `name='${NOMBRE.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
      return api('https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(q) + '&fields=files(id)&pageSize=1')
        .then(r => r.json()).then(j => (j.files && j.files[0] && j.files[0].id) || crear());
    }).then(id => {
      if (c.hojaId !== id) { c.hojaId = id; Store.save(); }
      return id;
    });
  }
  function crear() {
    return api(S, json('POST', {
      properties: { title: NOMBRE, locale: 'en_US', timeZone: 'Europe/Madrid' },
      sheets: [{ properties: { title: HOJA } }]
    })).then(r => r.json()).then(h => {
      const id = h.spreadsheetId;
      /* A tu carpeta, junto a los datos. Si no se puede, se queda en «Mi unidad», sin más */
      const carpeta = Nube.estado().carpetaId;
      if (!carpeta) return id;
      return api(`https://www.googleapis.com/drive/v3/files/${id}?addParents=${carpeta}&removeParents=root&fields=id`, json('PATCH', {}))
        .then(() => id).catch(() => id);
    });
  }

  /* ---- Escribir las fórmulas, esperar y leer ---- */
  function consultar(id, filas) {
    const n = filas.length;
    const valores = [['clave', 'codigo', 'precio', 'divisa', 'fecha', 'tu divisa', 'factor', 'a euros'], ...filas.map(fila)];
    /* Reescribir las fórmulas cada vez obliga a Google a recalcularlas: si
       solo leyéramos, podría darnos el precio de la última vez que se abrió */
    return api(`${S}/${id}/values/${HOJA}!A1:H1000:clear`, json('POST', {}))
      .then(() => api(`${S}/${id}/values/${HOJA}!A1:H${n + 1}?valueInputOption=USER_ENTERED`, json('PUT', { values: valores })))
      .then(() => leerHastaQueEste(id, n, 0));
  }
  function leerHastaQueEste(id, n, intento) {
    return espera(intento ? 3000 : 2500)
      .then(() => api(`${S}/${id}/values/${HOJA}!A2:H${n + 1}?valueRenderOption=UNFORMATTED_VALUE`))
      .then(r => r.json()).then(j => {
        const v = j.values || [];
        const cargando = v.some(x => /loading|cargando/i.test(String(x[2] || '') + String(x[6] || '')));
        if (cargando && intento < 4) return leerHastaQueEste(id, n, intento + 1);
        return v;
      });
  }

  /* ---- Pasar lo leído a tus fichas ---- */
  const redondea = (x, d) => Math.round(x * Math.pow(10, d)) / Math.pow(10, d);
  function apuntarEnFicha(a, fecha, precio) {
    if (!Array.isArray(a.serie)) a.serie = [];
    const i = a.serie.findIndex(t => t.fecha === fecha);
    if (i < 0) a.serie.push({ id: 'gf-' + fecha, fecha, fuente: FUENTE, precio });
    /* El mismo día se va corrigiendo; una toma tuya de ese día no se pisa */
    else if (a.serie[i].fuente === FUENTE || a.serie[i].precio === undefined) {
      a.serie[i].precio = precio; if (!a.serie[i].fuente) a.serie[i].fuente = FUENTE;
    }
    a.serie.sort((x, y) => (x.fecha || '').localeCompare(y.fecha || ''));
    if (fecha >= (a.cotizacion.fecha || '')) { a.cotizacion.precio = precio; a.cotizacion.fecha = fecha; }
  }

  function aplicar(filas, valores) {
    const hoy = Util.hoy();
    const r = { ok: 0, sinDato: [], antiguos: 0 };
    filas.forEach((f, i) => {
      const v = valores[i] || [];
      const bruto = Number(v[2]), factor = Number(v[6]);
      if (String(v[0]) !== f.clave || !(bruto > 0) || !(factor > 0)) {
        r.sinDato.push({ clave: f.clave, ticker: f.ticker, codigo: f.codigo });
        return;
      }
      const precio = redondea(bruto * factor, 4);
      let fecha = /^\d{4}-\d{2}-\d{2}$/.test(String(v[4])) ? String(v[4]) : hoy;
      if (fecha > hoy) fecha = hoy;
      if (f.clave.startsWith('papel:')) {
        const tk = f.ticker.toUpperCase(), pr = Papel.raiz().precios;
        pr[tk] = { precio, fecha, fuente: FUENTE };
        Papel.apuntarPrecio(tk, fecha, precio);
        r.ok++; return;
      }
      const a = Store.activo(f.clave); if (!a) return;
      if (fecha < (a.cotizacion.fecha || '')) { r.antiguos++; return; }   /* el tuyo es más reciente */
      apuntarEnFicha(a, fecha, precio);
      /* El cambio a euros, si la ficha va en otra divisa */
      const fx = Number(v[7]);
      if ((a.divisa || 'EUR') !== 'EUR' && fx > 0 && Math.abs(fx - (Util.n(a.fx) || 1)) / fx > 0.002) a.fx = redondea(fx, 6);
      r.ok++;
    });
    return r;
  }

  /* ---- La orden completa ---- */
  function actualizar(o) {
    o = o || {};
    if (enCurso) return Promise.resolve({ estado: 'ocupado' });
    if (!conf().activo && !o.forzar) return Promise.resolve({ estado: 'apagado' });
    if (!Nube.hayClientId()) return Promise.resolve({ estado: 'error', error: 'Primero hay que conectar con Drive (Ajustes).' });
    const { filas, sinCodigo } = lista();
    if (!filas.length) {
      est = Object.assign(est, { ultima: new Date().toISOString(), error: '', ok: 0, sinDato: [], sinCodigo, total: 0 });
      guardarEst(); pintarAjustes();
      return Promise.resolve({ estado: 'nada', sinCodigo });
    }
    enCurso = true; pintarAjustes();
    return Nube.pedirToken(!o.interactivo).then(ok => {
      if (!ok) throw new Error(Nube.estado().error || 'No se ha podido entrar en Google');
      return asegurarHoja();
    }).then(id => consultar(id, filas)).then(valores => {
      const r = aplicar(filas, valores);
      Store.save();
      est = Object.assign(est, { ultima: new Date().toISOString(), error: '', ok: r.ok, sinDato: r.sinDato, antiguos: r.antiguos, sinCodigo, total: filas.length });
      guardarEst(); enCurso = false;
      if (typeof Vistas !== 'undefined') Vistas.refrescar();
      pintarAjustes();
      return Object.assign({ estado: 'hecho' }, r);
    }).catch(e => {
      enCurso = false;
      est.error = e.message || 'No se han podido traer los precios';
      guardarEst(); pintarAjustes();
      return { estado: 'error', error: est.error };
    });
  }

  /* Al abrir, y cada vez que Drive termina de sincronizar: si toca, en silencio */
  function trasSincronizar() {
    if (!conf().activo || enCurso) return;
    if (est.ultima && Date.now() - new Date(est.ultima).getTime() < CADA_MIN * 60000) return;
    actualizar({}).then(r => {
      if (r.estado === 'hecho' && r.ok) Util.toast(`Precios al día (${FUENTE}): ${r.ok} de ${est.total}`);
      else if (r.estado === 'error') Util.toast('Precios automáticos: ' + r.error.split('. ')[0], 'err');
    });
  }

  function hace(iso) {
    if (!iso) return 'nunca';
    const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'ahora mismo';
    if (m < 60) return `hace ${m} min`;
    if (m < 60 * 24) return `hace ${Math.round(m / 60)} h`;
    return new Date(iso).toLocaleString('es-ES');
  }

  /* ---- Ajustes ---- */
  function pintarAjustes() {
    const c = document.querySelector('#pr-cuerpo'); if (!c) return;
    const k = conf();
    const conectado = Nube.hayClientId() && Nube.estado().conectado;
    const sinDato = est.sinDato || [], sinCodigo = est.sinCodigo || [];
    const nombreDe = x => { const a = Store.activo(x.id || x.clave); return Util.esc(Util.nombreDe(a || x.ticker)); };
    c.innerHTML = `
      <label class="chk" style="display:flex;gap:8px;align-items:flex-start">
        <input type="checkbox" id="pr-on" ${k.activo ? 'checked' : ''} ${conectado ? '' : 'disabled'}>
        <span><b>Traer los precios solos al abrir la consola</b><br>
        <span class="small mut">De Google Finance, con hasta 20 minutos de retraso. Como mucho una vez cada media hora.</span></span>
      </label>
      ${!conectado ? `<p class="small mut" style="margin-top:10px">Primero conecta con Drive aquí arriba: los precios se piden a través de una hoja de cálculo que la consola crea en tu carpeta.</p>` : ''}
      ${k.activo || est.ultima ? `
        <div class="kv" style="margin-top:12px"><span>Última vez en este aparato</span><b>${enCurso ? 'trayendo precios…' : hace(est.ultima)}</b></div>
        ${est.ultima && !est.error ? `<div class="kv"><span>Actualizados</span><b>${est.ok} de ${est.total}</b></div>
        ${est.antiguos ? `<p class="small mut" style="margin:6px 0 0">${est.antiguos === 1 ? 'Uno se queda' : est.antiguos + ' se quedan'} con el precio que pusiste tú, que es más reciente que el de Google.</p>` : ''}` : ''}` : ''}
      ${est.error ? `<ul class="motivos" style="margin-top:12px"><li class="alta"><i class="sev"></i><div>
        <b>No han llegado los precios</b><p>${Util.esc(est.error)}</p></div></li></ul>` : ''}
      ${!est.error && sinDato.length ? `<ul class="motivos" style="margin-top:12px"><li class="media"><i class="sev"></i><div>
        <b>Google no encuentra ${sinDato.length === 1 ? 'este' : 'estos'}</b>
        <p>Abre la ficha y corrige el «Código de bolsa» en Identidad. Puedes probarlo antes en Google Finance.</p>
        <div class="toolbar" style="margin-top:6px">${sinDato.map(x => `<button class="btn mini" data-pr-ficha="${Util.esc(x.clave)}">${nombreDe(x)} · ${Util.esc(x.codigo)}</button>`).join('')}</div>
      </div></li></ul>` : ''}
      ${sinCodigo.length ? `<p class="small mut" style="margin-top:10px">Sin código de bolsa, se quedan como están:
        ${sinCodigo.map(x => `<a href="#" data-pr-ficha="${Util.esc(x.id)}">${nombreDe(x)}</a>`).join(', ')}.
        ${sinCodigo.some(x => x.tipo === 'fondo') ? 'Los fondos no están en Google Finance: para ellos, el extracto de Trade Republic o a mano.' : ''}</p>` : ''}
      <div class="toolbar" style="margin-top:14px">
        <button class="btn pri" id="pr-ya" ${conectado && !enCurso ? '' : 'disabled'}>${enCurso ? 'Trayendo…' : 'Traer precios ahora'}</button>
        ${k.hojaId ? `<a class="btn" style="text-decoration:none" href="https://docs.google.com/spreadsheets/d/${encodeURIComponent(k.hojaId)}" target="_blank" rel="noopener">Ver la hoja ↗</a>` : ''}
      </div>
      <p class="small mut" style="margin-top:10px">La hoja «${NOMBRE}» es de la consola: no hace falta abrirla ni tocarla.
      Si la borras, se vuelve a crear. Hace falta tener activada la «Google Sheets API» en tu proyecto de Google (en el LEEME, paso a paso).</p>`;

    const on = c.querySelector('#pr-on');
    if (on) on.onchange = () => {
      conf().activo = on.checked; Store.save();
      if (on.checked) ahora(); else pintarAjustes();
    };
    const ya = c.querySelector('#pr-ya'); if (ya) ya.onclick = ahora;
    c.querySelectorAll('[data-pr-ficha]').forEach(b => b.onclick = ev => {
      ev.preventDefault();
      const id = b.dataset.prFicha; if (Store.activo(id)) Ficha.abrir(id);
      else Util.toast('Es de una cartera de papel: corrígelo añadiendo el valor a vigilancia');
    });
  }

  /* Pulsado a mano: con ventana de Google si hace falta y aviso al acabar */
  function ahora() {
    Util.toast('Pidiendo los precios a Google Finance…');
    return actualizar({ interactivo: true, forzar: true }).then(r => {
      if (r.estado === 'error') Util.toast(r.error.split('. ')[0], 'err');
      else if (r.estado === 'nada') Util.toast('Ningún valor tiene código de bolsa todavía');
      else if (r.estado === 'hecho') Util.toast(`${r.ok} de ${est.total} precios al día` + (r.sinDato.length ? ` · ${r.sinDato.length} sin dato` : ''));
      return r;
    });
  }

  return { actualizar, ahora, trasSincronizar, pintarAjustes, lista, fila, aplicar, estado: () => est, conf };
})();
