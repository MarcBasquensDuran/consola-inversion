/* ═══════════════════════════════════════════════════════════════
   AVISOS EN EL CALENDARIO

   El programa está lleno de fechas que hasta ahora no avisaban de nada:
   cuándo toca revisar cada empresa, cuándo vence el plazo de una
   hipótesis, cuándo pedir el informe, cuándo caducan las minusvalías.
   Esto las convierte en eventos de un calendario propio, para que te
   busquen ellas a ti en vez de tener que acordarte de abrir la app.

   Permiso calendar.app.created: la app crea su propio calendario y solo
   puede tocar ese. No ve ni modifica ninguno de los tuyos.
   ═══════════════════════════════════════════════════════════════ */
const Agenda = (() => {
  const API = 'https://www.googleapis.com/calendar/v3';

  const TIPOS = [
    { k: 'revision',  n: 'Revisar una empresa',
      d: 'El día que toca según la cadencia de cada ficha' },
    { k: 'hipotesis', n: 'Vence el plazo de una hipótesis',
      d: 'Para juzgarla antes de que caduque sin veredicto' },
    { k: 'informe',   n: 'Pedir el informe de seguimiento',
      d: 'Según la cadencia que tengas puesta en Seguimiento' },
    { k: 'fiscal',    n: 'Cierre fiscal del año',
      d: 'Para decidir si aflorar plusvalías o pérdidas antes del 31 de diciembre' },
    { k: 'caducidad', n: 'Minusvalía a punto de caducar',
      d: 'Pasados cuatro ejercicios ya no se puede compensar' }
  ];

  const POR_DEFECTO = {
    activo: false, calendarioId: '', ultima: '', error: '', creados: 0, horizonte: 18,
    tipos: {
      revision:  { on: true,  dias: 0,  hora: '09:00', aviso: 'popup', antes: 0 },
      hipotesis: { on: true,  dias: 7,  hora: '09:00', aviso: 'popup', antes: 0 },
      informe:   { on: true,  dias: 0,  hora: '08:00', aviso: 'popup', antes: 0 },
      fiscal:    { on: true,  dias: 30, hora: '10:00', aviso: 'popup', antes: 0 },
      caducidad: { on: true,  dias: 45, hora: '10:00', aviso: 'popup', antes: 0 }
    }
  };

  function conf() {
    const aj = Store.ajustes();
    aj.avisos = Object.assign({}, POR_DEFECTO, aj.avisos || {});
    aj.avisos.tipos = Object.assign({}, POR_DEFECTO.tipos, aj.avisos.tipos || {});
    Object.keys(POR_DEFECTO.tipos).forEach(k => {
      aj.avisos.tipos[k] = Object.assign({}, POR_DEFECTO.tipos[k], aj.avisos.tipos[k] || {});
    });
    return aj.avisos;
  }

  /* Google exige que el id de un evento use solo estas letras y números.
     Uno estable por aviso permite actualizarlo sin duplicarlo. */
  function idEvento(semilla) {
    let h1 = 0x811c9dc5, h2 = 0x01000193;
    for (let i = 0; i < semilla.length; i++) {
      h1 = ((h1 ^ semilla.charCodeAt(i)) * 16777619) >>> 0;
      h2 = ((h2 + semilla.charCodeAt(i) * (i + 7)) * 2654435761) >>> 0;
    }
    const b32 = n => { let s = ''; for (let i = 0; i < 7; i++) { s = '0123456789abcdefghijklmnopqrstuv'[n % 32] + s; n = Math.floor(n / 32); } return s; };
    return 'consola' + b32(h1) + b32(h2);
  }

  const diaMenos = (fecha, dias) => {
    const d = new Date(fecha + 'T12:00:00');
    d.setDate(d.getDate() - (Number(dias) || 0));
    return d.toISOString().slice(0, 10);
  };

  /* ---- Qué eventos deberían existir hoy ---- */
  function calcular() {
    const c = conf();
    const hoy = Util.hoy();
    const ev = [];
    const tope = new Date();
    tope.setMonth(tope.getMonth() + (Number(c.horizonte) || 18));
    const limite = tope.toISOString().slice(0, 10);

    const añade = (tipo, fechaBase, titulo, detalle, clave) => {
      const t = c.tipos[tipo];
      if (!t || !t.on || !fechaBase) return;
      const fecha = diaMenos(fechaBase, t.dias);
      if (fecha < hoy) return;                     /* ya pasó: no molesta */
      if (fecha > limite) return;                  /* demasiado lejos: ya llegará */
      ev.push({
        id: idEvento(tipo + '|' + (clave || titulo) + '|' + fechaBase),
        tipo, fecha, hora: t.hora || '09:00', aviso: t.aviso, antes: Number(t.antes) || 0,
        titulo,
        detalle: detalle + (t.dias ? `\n\nEste aviso se adelanta ${t.dias} días: la fecha real es el ${Util.fecha(fechaBase)}.` : '')
      });
    };

    Store.activos().forEach(a => {
      if (a.estado !== 'cartera' && a.estado !== 'vigilancia') return;
      const p = Calc.posicion(a.id);
      const donde = a.estado === 'cartera' ? 'en cartera' : 'en vigilancia';

      añade('revision', a.seguimiento && a.seguimiento.proximaRevision,
        `Revisar ${a.ticker}`,
        `${a.nombre} · ${donde}${p.abierta ? ` · ${Util.num(p.titulos, 0)} títulos` : ''}\n\n` +
        `Abre la ficha, mira el semáforo y registra la revisión aunque decidas no hacer nada.`,
        a.id);

      (a.tesis.hipotesis || []).forEach(h => {
        if (h.estado === 'rota' || !h.plazo) return;
        const corto = h.texto.length > 52 ? h.texto.slice(0, 52).trim() + '…' : h.texto;
        añade('hipotesis', h.plazo,
          `${a.ticker} · vence: ${corto}`,
          `${a.nombre}\n\nHipótesis: ${h.texto}\n` +
          `Se mide con: ${h.metrica || 'sin métrica anotada'}\n` +
          `Esperabas: ${h.esperado || 'sin valor anotado'}\n` +
          `Ahora mismo la tienes como: ${(ESTADOS_HIPO[h.estado] || h.estado).toLowerCase()}` +
          (h.evidencia ? `\nÚltima evidencia: ${h.evidencia}` : ''),
          a.id + '|' + h.id);
      });
    });

    const aj = Store.ajustes();
    if (aj.ultimoInforme) {
      const prox = new Date(aj.ultimoInforme + 'T12:00:00');
      prox.setDate(prox.getDate() + (Number(aj.cadenciaInforme) || 14));
      añade('informe', prox.toISOString().slice(0, 10),
        'Pedir el informe de seguimiento',
        'Abre Seguimiento, pulsa «Preparar encargo» y pásamelo. Al volver, carga el paquete.');
    }

    const año = new Date().getFullYear();
    añade('fiscal', `${año}-12-31`,
      'Cierre fiscal: última oportunidad del año',
      'Abre la pestaña Fiscal y mira si te conviene aflorar plusvalías o pérdidas antes del 31 de diciembre. ' +
      'Recuerda la regla de los dos meses si piensas recomprar algo que vendas con pérdidas.');

    try {
      const f = Calc.fiscal(año);
      (f && f.pendientes || []).forEach(p => {
        if (p.restan > 1) return;
        añade('caducidad', `${p.caduca}-12-31`,
          `Caducan ${Util.eur(Math.abs(p.importe), 0)} de minusvalías`,
          `Vienen del ejercicio ${p.ano} y caducan al cerrar ${p.caduca}. ` +
          `Si tienes plusvalías latentes, este es el año de aflorarlas para compensarlas.`,
          'caduca|' + p.ano);
      });
    } catch (e) {}

    return ev.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  /* ---- El calendario propio ---- */
  function asegurarCalendario() {
    const c = conf();
    if (c.calendarioId) {
      return Nube.api(`${API}/calendars/${encodeURIComponent(c.calendarioId)}`)
        .then(r => r.json()).then(() => c.calendarioId).catch(() => crear());
    }
    return crear();
  }
  function crear() {
    return Nube.api(`${API}/calendars`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: 'Consola de inversión', timeZone: zonaHoraria(),
        description: 'Avisos creados por tu programa de inversiones. Puedes ocultarlo o cambiarle el color como cualquier calendario.' })
    }).then(r => r.json()).then(j => {
      conf().calendarioId = j.id;
      Store.guardar();
      return j.id;
    });
  }
  const zonaHoraria = () => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid'; }
    catch (e) { return 'Europe/Madrid'; }
  };

  function aEvento(e) {
    const ini = `${e.fecha}T${e.hora}:00`;
    const [hh, mm] = e.hora.split(':').map(Number);
    const fin = new Date(`${e.fecha}T${e.hora}:00`);
    fin.setMinutes(fin.getMinutes() + 30);
    const pad = n => String(n).padStart(2, '0');
    const finStr = `${e.fecha}T${pad(fin.getHours())}:${pad(fin.getMinutes())}:00`;
    const cuerpo = {
      id: e.id, summary: e.titulo, description: e.detalle,
      start: { dateTime: ini, timeZone: zonaHoraria() },
      end: { dateTime: finStr, timeZone: zonaHoraria() },
      source: { title: 'Consola de inversión', url: location.origin + location.pathname }
    };
    cuerpo.reminders = e.aviso === 'ninguno'
      ? { useDefault: false, overrides: [] }
      : { useDefault: false, overrides: [{ method: e.aviso === 'email' ? 'email' : 'popup', minutes: e.antes }] };
    return cuerpo;
  }

  /* ---- Poner al día el calendario ---- */
  function sincronizar(opciones) {
    const o = opciones || {};
    const c = conf();
    if (!c.activo) return Promise.resolve({ estado: 'apagado' });
    if (!Nube.hayClientId()) return Promise.resolve({ estado: 'sin-configurar' });

    return Nube.pedirToken(!o.interactivo).then(ok => {
      if (!ok) throw new Error('Google no ha dado permiso para el calendario');
      return asegurarCalendario();
    }).then(calId => {
      const quiero = calcular();
      const mios = new Map(quiero.map(e => [e.id, e]));
      const desde = new Date(); desde.setMonth(desde.getMonth() - 1);

      return Nube.api(`${API}/calendars/${encodeURIComponent(calId)}/events` +
        `?maxResults=250&singleEvents=true&timeMin=${encodeURIComponent(desde.toISOString())}`)
        .then(r => r.json())
        .then(lista => {
          const hay = new Map((lista.items || []).map(x => [x.id, x]));
          const tareas = [];

          quiero.forEach(e => {
            const cuerpo = aEvento(e);
            const ya = hay.get(e.id);
            if (ya) {
              const cambia = ya.summary !== cuerpo.summary ||
                (ya.start && ya.start.dateTime || '').slice(0, 16) !== cuerpo.start.dateTime.slice(0, 16) ||
                (ya.description || '') !== cuerpo.description;
              if (cambia) tareas.push(Nube.api(`${API}/calendars/${encodeURIComponent(calId)}/events/${e.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo)
              }).catch(() => {}));
            } else {
              tareas.push(Nube.api(`${API}/calendars/${encodeURIComponent(calId)}/events?conferenceDataVersion=0`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo)
              }).catch(err => {
                /* Si el evento ya existía pero estaba cancelado, se revive */
                return Nube.api(`${API}/calendars/${encodeURIComponent(calId)}/events/${e.id}`, {
                  method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo)
                }).catch(() => {});
              }));
            }
          });

          /* Lo que ya no toca: fuera, para que el calendario no mienta */
          hay.forEach((x, id) => {
            if (mios.has(id)) return;
            if (!/^consola/.test(id)) return;
            tareas.push(Nube.api(`${API}/calendars/${encodeURIComponent(calId)}/events/${id}`,
              { method: 'DELETE' }).catch(() => {}));
          });

          return Promise.all(tareas).then(() => {
            c.ultima = new Date().toISOString();
            c.creados = quiero.length; c.error = '';
            Store.guardar();
            return { estado: 'ok', eventos: quiero.length };
          });
        });
    }).catch(e => {
      conf().error = e.message || 'No se ha podido actualizar el calendario';
      Store.guardar();
      return { estado: 'error', error: conf().error };
    });
  }

  /* Quita todos los eventos de la app sin borrar el calendario */
  function limpiar() {
    const c = conf();
    if (!c.calendarioId) return Promise.resolve();
    return Nube.pedirToken(false)
      .then(() => Nube.api(`${API}/calendars/${encodeURIComponent(c.calendarioId)}/events?maxResults=250`))
      .then(r => r.json())
      .then(l => Promise.all((l.items || []).filter(x => /^consola/.test(x.id)).map(x =>
        Nube.api(`${API}/calendars/${encodeURIComponent(c.calendarioId)}/events/${x.id}`,
          { method: 'DELETE' }).catch(() => {}))))
      .then(() => { c.creados = 0; Store.guardar(); });
  }

  /* ---- Lo que se ve en Ajustes ---- */
  function pintarAjustes() {
    const el = document.querySelector('#ag-cuerpo');
    if (!el) return;
    const c = conf();

    if (!Nube.hayClientId()) {
      el.innerHTML = `<div class="sin-motivos">Primero hay que conectar con Drive, aquí arriba.
        Los avisos usan la misma cuenta de Google.</div>`;
      return;
    }

    const prox = c.activo ? calcular() : [];
    const COMO = [['popup', 'Notificación'], ['email', 'Correo'], ['ninguno', 'Solo en el calendario']];

    el.innerHTML = `
      <label class="chk" style="margin-bottom:12px">
        <input type="checkbox" id="ag-on" ${c.activo ? 'checked' : ''}>
        <span><b>Llevar estas fechas a mi calendario</b></span>
      </label>
      <p class="small mut" style="margin:-6px 0 14px">
        Crea un calendario aparte llamado «Consola de inversión». Puedes ocultarlo o cambiarle el
        color como cualquier otro. La app solo puede tocar ese, nunca el resto de los tuyos.</p>

      ${c.activo ? `
        <div class="toolbar" style="margin-bottom:12px">
          <div class="field" style="min-width:230px"><label>No poner avisos a más de</label>
            <select id="ag-horizonte">${[[6,'6 meses vista'],[12,'un año vista'],[18,'año y medio vista'],[36,'tres años vista'],[600,'sin límite']].map(([v,n]) =>
              `<option value="${v}" ${Util.n(c.horizonte) === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          <div class="small mut" style="flex:1;margin-top:16px">
            Evita llenarte el calendario de plazos lejanos. Los que queden fuera entrarán solos cuando se acerquen.</div>
        </div>

        <div class="tbl-wrap"><table>
          <thead><tr><th>Aviso</th><th class="r" style="width:92px">Días antes</th>
            <th style="width:92px">Hora</th><th style="width:150px">Cómo avisa</th></tr></thead>
          <tbody>${TIPOS.map(t => {
            const v = c.tipos[t.k];
            return `<tr class="regla-row">
              <td class="regla-nom">
                <label class="chk"><input type="checkbox" data-ag-on="${t.k}" ${v.on ? 'checked' : ''}>
                  <b>${Util.esc(t.n)}</b></label>
                <span>${Util.esc(t.d)}</span></td>
              <td class="r"><input type="number" min="0" max="365" style="width:66px" data-ag-dias="${t.k}" value="${Util.n(v.dias)}"></td>
              <td><input type="time" style="width:86px" data-ag-hora="${t.k}" value="${Util.esc(v.hora)}"></td>
              <td><select data-ag-como="${t.k}">${COMO.map(([k, n]) =>
                `<option value="${k}" ${v.aviso === k ? 'selected' : ''}>${n}</option>`).join('')}</select></td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>

        <div class="toolbar" style="margin-top:14px">
          <button class="btn pri" id="ag-sync">Poner el calendario al día</button>
          <button class="btn" id="ag-limpiar">Quitar todos los avisos</button>
        </div>
        <div class="kv" style="margin-top:12px"><span>Última vez</span>
          <b>${c.ultima ? new Date(c.ultima).toLocaleString('es-ES') : 'todavía no'}</b></div>
        <div class="kv"><span>Avisos puestos</span><b>${Util.n(c.creados)}</b></div>

        ${c.error ? `<ul class="motivos" style="margin-top:12px"><li class="alta"><i class="sev"></i><div>
          <b>No se ha podido poner el calendario al día</b>
          <p>${Util.esc(c.error)}</p>
          ${/permiso|conectar/i.test(c.error) ? '' : `<p class="small mut">Si acabas de activar los avisos, puede que Google
          tenga que pedirte permiso otra vez para el calendario: pulsa «Poner el calendario al día» y acepta.</p>`}
        </div></li></ul>` : ''}

        <div class="bloque-t">Lo que va a aparecer en tu calendario</div>
        ${prox.length ? `<ul class="hist">${prox.slice(0, 12).map(e => `
          <li><time>${Util.fecha(e.fecha)} · ${Util.esc(e.hora)}</time>
            <span><b>${Util.esc(e.titulo)}</b>
            <div class="small mut">${Util.esc((e.detalle || '').split('\n')[0].slice(0, 90))}</div></span></li>`).join('')}
          </ul>${prox.length > 12 ? `<p class="small mut" style="margin-top:8px">y ${prox.length - 12} más</p>` : ''}`
        : `<div class="sin-motivos">Ninguno por ahora. Aparecerán cuando tus fichas tengan fechas de
           revisión o tus hipótesis tengan plazo.</div>`}
      ` : ''}`;

    const on = document.querySelector('#ag-on');
    if (on) on.onchange = () => {
      c.activo = on.checked;
      Store.guardar();
      pintarAjustes();
      if (c.activo) Util.toast('Pulsa «Poner el calendario al día» para crearlos');
      else Util.toast('Avisos apagados. Los que ya están puestos siguen ahí hasta que los quites.');
    };

    const cambia = (sel, campo, conv) => document.querySelectorAll(sel).forEach(i => i.onchange = () => {
      const k = i.dataset.agOn || i.dataset.agDias || i.dataset.agHora || i.dataset.agComo;
      c.tipos[k][campo] = conv(i);
      Store.guardar(); pintarAjustes();
    });
    cambia('[data-ag-on]', 'on', i => i.checked);
    cambia('[data-ag-dias]', 'dias', i => Util.n(i.value));
    cambia('[data-ag-hora]', 'hora', i => i.value || '09:00');
    cambia('[data-ag-como]', 'aviso', i => i.value);

    const hz = document.querySelector('#ag-horizonte');
    if (hz) hz.onchange = () => { c.horizonte = Util.n(hz.value) || 18; Store.guardar(); pintarAjustes(); };

    const b1 = document.querySelector('#ag-sync');
    if (b1) b1.onclick = () => {
      Util.toast('Actualizando el calendario…');
      sincronizar({ interactivo: true }).then(r => {
        pintarAjustes();
        /* Un aviso largo no cabe en el toast: ahí va lo corto y el porqué queda arriba */
        Util.toast(r.estado === 'error'
          ? (String(r.error || '').length > 70 ? 'No se ha podido: mira el motivo aquí arriba' : r.error)
          : `Calendario al día con ${r.eventos} ${r.eventos === 1 ? 'aviso' : 'avisos'}`,
          r.estado === 'error' ? 'err' : '');
      });
    };
    const b2 = document.querySelector('#ag-limpiar');
    if (b2) b2.onclick = () => Modal.confirmar('Quitar todos los avisos',
      'Se borran del calendario los eventos que puso el programa. El calendario se queda, vacío.',
      () => limpiar().then(() => { pintarAjustes(); Util.toast('Avisos quitados'); }), 'Quitar');
  }

  return { TIPOS, conf, calcular, sincronizar, limpiar, idEvento, pintarAjustes };
})();
