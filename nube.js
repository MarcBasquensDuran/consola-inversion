/* ═══════════════ DRIVE ═══════════════
   Los datos viven en un único JSON dentro de una carpeta de tu Drive.
   Permiso drive.file: la app solo ve los archivos que ella misma crea,
   nunca el resto de tu Drive.

   La base de la última sincronización se guarda en IndexedDB, que tiene
   sitio de sobra, y es la que permite juntar los cambios de dos
   dispositivos sin perder ninguno. */
const Nube = (() => {
  const SCOPE_DRIVE = 'https://www.googleapis.com/auth/drive.file';
  /* Solo los calendarios que crea la app: no puede ver ni tocar los tuyos */
  const SCOPE_AGENDA = 'https://www.googleapis.com/auth/calendar.app.created';
  const scopes = () => {
    const a = (Store.ajustes && Store.ajustes().avisos) || {};
    return a.activo ? SCOPE_DRIVE + ' ' + SCOPE_AGENDA : SCOPE_DRIVE;
  };
  const KEY_EST = 'ENGINE_CARTERA_V1_NUBE';
  const cfg = () => Object.assign({ clientId: '', archivo: 'consola-inversion.json',
    carpeta: 'Consola de inversión', cadaMinutos: 10 }, window.CONFIG || {});

  let token = null, expira = 0, cliente = null, sincronizando = false, scopeActual = '';
  let est = { conectado: false, ultima: '', archivoId: '', carpetaId: '',
              huella: '', correo: '', conflictos: [], error: '', ultimaCopia: '' };

  try { est = Object.assign(est, JSON.parse(localStorage.getItem(KEY_EST) || '{}')); } catch (e) {}
  const guardarEstado = () => { try { localStorage.setItem(KEY_EST, JSON.stringify(est)); } catch (e) {} };

  /* ---- La base: en IndexedDB, que no compite por el hueco de localStorage ---- */
  function abrirBD() {
    return new Promise((res, rej) => {
      const p = indexedDB.open('consola-inversion', 1);
      p.onupgradeneeded = () => p.result.createObjectStore('sync');
      p.onsuccess = () => res(p.result);
      p.onerror = () => rej(p.error);
    });
  }
  function leerBase() {
    return abrirBD().then(db => new Promise(res => {
      const p = db.transaction('sync').objectStore('sync').get('base');
      p.onsuccess = () => res(p.result || null);
      p.onerror = () => res(null);
    })).catch(() => null);
  }
  function guardarBase(d) {
    return abrirBD().then(db => new Promise(res => {
      const t = db.transaction('sync', 'readwrite');
      t.objectStore('sync').put(JSON.parse(JSON.stringify(d)), 'base');
      t.oncomplete = () => res(true);
      t.onerror = () => res(false);
    })).catch(() => false);
  }

  /* ---- Sesión ---- */
  const hayClientId = () => !!(cfg().clientId || '').trim();
  const tokenVivo = () => token && Date.now() < expira - 60000;

  function iniciar() {
    /* Si han cambiado los permisos que hacen falta, hay que rehacer el cliente */
    if (cliente && scopeActual === scopes()) return;
    if (!hayClientId()) return;
    if (!(window.google && google.accounts && google.accounts.oauth2)) return;
    scopeActual = scopes();
    cliente = google.accounts.oauth2.initTokenClient({
      client_id: cfg().clientId, scope: scopeActual,
      callback: r => {
        if (r && r.access_token) {
          token = r.access_token;
          expira = Date.now() + (Number(r.expires_in || 3600) * 1000);
          est.conectado = true; est.error = ''; guardarEstado();
          if (pendiente) { const f = pendiente; pendiente = null; f(true); }
        } else if (pendiente) { const f = pendiente; pendiente = null; f(false); }
      },
      error_callback: e => {
        est.error = (e && e.type === 'popup_closed') ? 'Has cerrado la ventana de Google' : 'Google no ha dado permiso';
        guardarEstado();
        if (pendiente) { const f = pendiente; pendiente = null; f(false); }
      }
    });
  }
  let pendiente = null;

  /* `callado` intenta renovar sin molestar; solo funciona si ya diste permiso antes */
  function pedirToken(callado) {
    return new Promise(res => {
      const antes = scopeActual;
      iniciar();
      if (!cliente) { est.error = 'Falta el identificador de Google en config.js'; return res(false); }
      /* Permisos nuevos: el token viejo ya no sirve */
      if (antes && antes !== scopeActual) { token = null; expira = 0; }
      if (tokenVivo()) return res(true);
      pendiente = res;
      try { cliente.requestAccessToken({ prompt: callado ? '' : 'consent' }); }
      catch (e) { pendiente = null; res(false); }
    });
  }

  /* Google explica en el cuerpo de la respuesta qué ha pasado. Si nos quedamos
     con el número suelto, un 403 puede ser cinco cosas distintas y no hay por
     dónde cogerlo, así que leemos el motivo y lo contamos en castellano. */
  function api(url, opts) {
    const servicio = /googleapis\.com\/calendar/.test(url) ? 'Calendar' : 'Drive';
    return fetch(url, Object.assign({}, opts, {
      headers: Object.assign({ Authorization: 'Bearer ' + token }, (opts || {}).headers || {})
    })).then(r => {
      if (r.status === 401) { token = null; expira = 0; throw new Error('sesión caducada'); }
      if (r.ok) return r;
      return r.text().then(t => {
        let j = null; try { j = JSON.parse(t); } catch (e) {}
        const err = (j && j.error) || {};
        const det = (err.errors && err.errors[0]) || {};
        const razon = det.reason || (err.details && (err.details.find(d => d.reason) || {}).reason) || '';
        const dice = err.message || '';
        throw new Error(explicar(r.status, razon, dice, servicio));
      });
    });
  }

  /* Las tres que de verdad pasan, dichas de manera que se puedan arreglar */
  function explicar(estado, razon, dice, servicio) {
    const api = servicio === 'Calendar' ? 'Google Calendar API' : 'Google Drive API';
    if (estado === 403 && (razon === 'accessNotConfigured' || /SERVICE_DISABLED|has not been used in project|is disabled/i.test(dice)))
      return `Falta activar la ${api} en tu proyecto de Google. ` +
             `Entra en console.cloud.google.com, busca «${api}» en la Biblioteca de APIs, ` +
             `pulsa «Habilitar» y vuelve a intentarlo.`;
    if (estado === 403 && (razon === 'insufficientPermissions' || /insufficient|scope/i.test(dice)))
      return `No le has dado permiso de ${servicio === 'Calendar' ? 'calendario' : 'Drive'} todavía. ` +
             `Desconecta y vuelve a conectar en Ajustes, y acepta la pantalla de permisos que saldrá.`;
    if (estado === 403 && razon === 'rateLimitExceeded')
      return 'Google está limitando las peticiones. Espera un minuto y vuelve a intentarlo.';
    if (estado === 404) return `${servicio} no encuentra eso. Si borraste el calendario o el archivo a mano, vuelve a sincronizar y se recrea.`;
    if (estado >= 500) return `Google está dando problemas ahora mismo (${estado}). Inténtalo dentro de un rato.`;
    return `${servicio} ha respondido ${estado}${dice ? ': ' + dice : ''}`;
  }

  /* ---- Carpeta y archivo ---- */
  function buscar(q, campos) {
    return api('https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(q) +
      '&spaces=drive&fields=' + encodeURIComponent('files(' + campos + ')') + '&pageSize=10')
      .then(r => r.json()).then(j => j.files || []);
  }

  function asegurarCarpeta() {
    if (est.carpetaId) return Promise.resolve(est.carpetaId);
    const n = cfg().carpeta.replace(/'/g, "\\'");
    return buscar(`name='${n}' and mimeType='application/vnd.google-apps.folder' and trashed=false`, 'id,name')
      .then(fs => {
        if (fs.length) return fs[0].id;
        return api('https://www.googleapis.com/drive/v3/files?fields=id', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cfg().carpeta, mimeType: 'application/vnd.google-apps.folder' })
        }).then(r => r.json()).then(j => j.id);
      })
      .then(id => { est.carpetaId = id; guardarEstado(); return id; });
  }

  function buscarArchivo() {
    if (est.archivoId) {
      return api('https://www.googleapis.com/drive/v3/files/' + est.archivoId +
        '?fields=id,md5Checksum,modifiedTime,trashed')
        .then(r => r.json())
        .then(f => (f && !f.trashed) ? f : null)
        .catch(() => null)
        .then(f => f || buscarPorNombre());
    }
    return buscarPorNombre();
  }
  function buscarPorNombre() {
    const n = cfg().archivo.replace(/'/g, "\\'");
    return buscar(`name='${n}' and trashed=false`, 'id,md5Checksum,modifiedTime')
      .then(fs => fs.length ? fs[0] : null);
  }

  function descargar(id) {
    return api('https://www.googleapis.com/drive/v3/files/' + id + '?alt=media')
      .then(r => r.json());
  }

  function subir(datos, id, nombre, carpetaId) {
    const cuerpo = JSON.stringify(datos);
    const meta = id ? { name: nombre } : { name: nombre, parents: [carpetaId] };
    const lim = '-------consola' + Date.now();
    const multi = `--${lim}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(meta) + `\r\n--${lim}\r\nContent-Type: application/json\r\n\r\n` +
      cuerpo + `\r\n--${lim}--`;
    const url = 'https://www.googleapis.com/upload/drive/v3/files' + (id ? '/' + id : '') +
      '?uploadType=multipart&fields=id,md5Checksum,modifiedTime';
    return api(url, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'multipart/related; boundary=' + lim },
      body: multi
    }).then(r => r.json());
  }

  /* Una copia con fecha al día, como mucho, y se conservan las diez últimas */
  function copiaDelDia(datos, carpetaId) {
    const hoy = Util.hoy();
    if (est.ultimaCopia === hoy) return Promise.resolve();
    return subir(datos, null, `copia-${hoy}.json`, carpetaId)
      .then(() => { est.ultimaCopia = hoy; guardarEstado(); })
      .then(() => buscar(`name contains 'copia-' and '${carpetaId}' in parents and trashed=false`, 'id,name'))
      .then(fs => {
        const viejas = fs.sort((a, b) => b.name.localeCompare(a.name)).slice(10);
        return Promise.all(viejas.map(f =>
          api('https://www.googleapis.com/drive/v3/files/' + f.id, { method: 'DELETE' }).catch(() => {})));
      })
      .catch(() => {});
  }

  /* Para que puedas comparar antes de decidir */
  function resumen(d) {
    d = d || {};
    const acts = d.activos || [];
    return {
      activos: acts.length,
      operaciones: (d.operaciones || []).length,
      tomas: acts.reduce((n, a) => n + ((a.serie || []).length), 0),
      noticias: (d.noticias || []).length,
      guardado: (d.meta && d.meta.guardado) ? new Date(d.meta.guardado).toLocaleString('es-ES') : '—'
    };
  }

  /* La marca de guardado cambia cada vez que se toca algo, así que no
     puede contar como un cambio de verdad ni como conflicto. */
  function sinSello(d) {
    const c = JSON.parse(JSON.stringify(d || {}));
    if (c.meta) delete c.meta.guardado;
    return c;
  }
  const mismoContenido = (a, b) => JSON.stringify(sinSello(a)) === JSON.stringify(sinSello(b));

  /* ---- La sincronización ---- */
  function sincronizar(opciones) {
    const o = opciones || {};
    if (sincronizando) return Promise.resolve({ estado: 'ocupado' });
    if (!hayClientId()) return Promise.resolve({ estado: 'sin-configurar' });
    sincronizando = true;
    refrescarIndicador('sincronizando');

    return pedirToken(!o.interactivo).then(ok => {
      if (!ok) throw new Error(est.error || 'No se ha podido entrar en Google');
      return asegurarCarpeta();
    }).then(carpetaId => {
      return buscarArchivo().then(remotoMeta => ({ carpetaId, remotoMeta }));
    }).then(({ carpetaId, remotoMeta }) => {
      const local = Store.get();

      /* Primera vez: no hay nada en Drive, sube lo de aquí */
      if (!remotoMeta) {
        return subir(local, null, cfg().archivo, carpetaId).then(f => {
          est.archivoId = f.id; est.huella = f.md5Checksum || '';
          return guardarBase(local).then(() => ({ estado: 'creado' }));
        });
      }

      est.archivoId = remotoMeta.id;
      return leerBase().then(base => {
        const sinCambiosFuera = remotoMeta.md5Checksum && remotoMeta.md5Checksum === est.huella;
        const sinCambiosAqui = base && mismoContenido(base, local);
        if (sinCambiosFuera && sinCambiosAqui) return { estado: 'al-dia' };

        /* Si no ha cambiado nada fuera, basta con subir lo de aquí */
        if (sinCambiosFuera) {
          return copiaDelDia(local, est.carpetaId)
            .then(() => subir(local, est.archivoId, cfg().archivo))
            .then(f => { est.huella = f.md5Checksum || ''; return guardarBase(local); })
            .then(() => ({ estado: 'subido' }));
        }

        return descargar(est.archivoId).then(remoto => {
          if (sinCambiosAqui) {
            /* Nada que aportar: me quedo con lo de Drive tal cual */
            Store.marcar('Sincronización con Drive');
            Store.reemplazar(remoto);
            est.huella = remotoMeta.md5Checksum || '';
            return guardarBase(Store.get()).then(() => ({ estado: 'bajado' }));
          }

          /* Primera vez que ESTE aparato ve el archivo de Drive, y los dos
             lados tienen datos. Sin una base común no hay forma de saber si
             algo falta porque lo borraste o porque este aparato no lo tuvo
             nunca, así que no se decide por tu cuenta: se pregunta. */
          if (!base) {
            if (!o.decision) {
              est.pendienteDecision = { remoto: resumen(remoto), local: resumen(local) };
              guardarEstado();
              return { estado: 'necesita-decision' };
            }
            if (o.decision === 'drive') {
              Store.marcar('Primera sincronización: me quedo con lo de Drive');
              Store.reemplazar(remoto);
              est.huella = remotoMeta.md5Checksum || '';
              est.pendienteDecision = null;
              return guardarBase(Store.get()).then(() => ({ estado: 'bajado' }));
            }
            if (o.decision === 'aqui') {
              Store.marcar('Primera sincronización: subo lo de este aparato');
              est.pendienteDecision = null;
              return copiaDelDia(local, est.carpetaId)
                .then(() => subir(local, est.archivoId, cfg().archivo))
                .then(f => { est.huella = f.md5Checksum || ''; return guardarBase(local); })
                .then(() => ({ estado: 'subido' }));
            }
            /* «juntar»: base vacía, así nada se interpreta como borrado */
          }

          const tl = (local.meta && local.meta.guardado) || 0;
          const tr = (remoto.meta && remoto.meta.guardado) || 0;
          const r = Fusion.fusionar(sinSello(base || {}), sinSello(local), sinSello(remoto), tl, tr);
          r.datos.meta = Object.assign({}, r.datos.meta, { guardado: Math.max(tl, tr) });
          Store.marcar('Sincronización con Drive');
          Store.reemplazar(r.datos);
          est.conflictos = r.conflictos.slice(0, 20);
          est.pendienteDecision = null;

          const fundido = Store.get();
          return copiaDelDia(fundido, est.carpetaId)
            .then(() => subir(fundido, est.archivoId, cfg().archivo))
            .then(f => { est.huella = f.md5Checksum || ''; return guardarBase(fundido); })
            .then(() => ({ estado: 'fusionado', conflictos: r.conflictos.length }));
        });
      });
    }).then(res => {
      est.ultima = new Date().toISOString();
      est.error = ''; guardarEstado();
      sincronizando = false;
      if (res.estado !== 'al-dia' && res.estado !== 'ocupado') Vistas.refrescar();
      else refrescarIndicador();
      return res;
    }).catch(e => {
      sincronizando = false;
      est.error = e.message || 'Error al sincronizar';
      guardarEstado(); refrescarIndicador();
      return { estado: 'error', error: est.error };
    });
  }

  function desconectar() {
    if (token && window.google && google.accounts) {
      try { google.accounts.oauth2.revoke(token, () => {}); } catch (e) {}
    }
    token = null; expira = 0;
    est = { conectado: false, ultima: '', archivoId: '', carpetaId: '', huella: '',
            correo: '', conflictos: [], error: '', ultimaCopia: '', pendienteDecision: null };
    guardarEstado();
    abrirBD().then(db => db.transaction('sync', 'readwrite').objectStore('sync').delete('base')).catch(() => {});
    Vistas.refrescar();
  }

  function refrescarIndicador(forzar) {
    const el = document.querySelector('#nube-estado');
    if (!el) return;
    const s = forzar || (est.pendienteDecision ? 'error' : (est.error ? 'error' : (est.conectado ? 'ok' : 'off')));
    const txt = s === 'sincronizando' ? 'Sincronizando…'
      : est.pendienteDecision ? 'Hay que decidir'
      : s === 'error' ? 'Sin sincronizar'
      : s === 'ok' ? (est.ultima ? 'Guardado ' + hace(est.ultima) : 'Conectado')
      : 'Solo en este aparato';
    el.className = 'nube ' + s;
    el.innerHTML = `<i></i><span>${Util.esc(txt)}</span>`;
    el.title = est.error || (est.ultima ? 'Última sincronización: ' + new Date(est.ultima).toLocaleString('es-ES') : '');
  }

  function hace(iso) {
    const m = Math.round((Date.now() - new Date(iso)) / 60000);
    if (m < 1) return 'ahora';
    if (m < 60) return 'hace ' + m + ' min';
    const h = Math.round(m / 60);
    if (h < 24) return 'hace ' + h + (h === 1 ? ' hora' : ' horas');
    return 'el ' + new Date(iso).toLocaleDateString('es-ES');
  }

  function init() {
    if (!hayClientId()) { refrescarIndicador(); return; }
    /* Si ya habías entrado, intenta reconectar sin molestar */
    const arranque = () => {
      iniciar();
      if (est.conectado) sincronizar({ interactivo: false });
      else refrescarIndicador();
    };
    if (window.google && google.accounts) arranque();
    else window.addEventListener('load', () => setTimeout(arranque, 600));

    const cada = Number(cfg().cadaMinutos) || 0;
    if (cada > 0) setInterval(() => { if (est.conectado && !document.hidden) sincronizar({ interactivo: false }); }, cada * 60000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && est.conectado) sincronizar({ interactivo: false });
    });
    window.addEventListener('online', () => { if (est.conectado) sincronizar({ interactivo: false }); });
  }

  /* El momento más delicado de toda la sincronización: este aparato y Drive
     tienen datos distintos y es la primera vez que se ven. Decides tú. */
  function preguntarPrimeraVez() {
    const d = est.pendienteDecision;
    if (!d) return;
    const fila = (et, a, b) => `<tr><td>${et}</td><td class="r num">${a}</td><td class="r num">${b}</td></tr>`;
    Modal.abrir({
      titulo: 'En Drive ya hay datos', ancho: true,
      cuerpo: `
        <p class="soft small" style="margin-bottom:12px">
          Es la primera vez que este aparato se conecta, y los dos lados tienen cosas.
          No puedo saber si lo que falta aquí es porque lo borraste o porque este aparato
          nunca lo tuvo, así que lo eliges tú. Se puede deshacer después.</p>
        <div class="tbl-wrap"><table>
          <thead><tr><th>Contenido</th><th class="r">En este aparato</th><th class="r">En Drive</th></tr></thead>
          <tbody>
            ${fila('Activos', d.local.activos, d.remoto.activos)}
            ${fila('Operaciones', d.local.operaciones, d.remoto.operaciones)}
            ${fila('Tomas de datos', d.local.tomas, d.remoto.tomas)}
            ${fila('Novedades', d.local.noticias, d.remoto.noticias)}
          </tbody>
        </table></div>
        <p class="small mut" style="margin-top:8px">
          Guardado por última vez · aquí: ${Util.esc(d.local.guardado)} · en Drive: ${Util.esc(d.remoto.guardado)}</p>
        <div class="opciones" style="margin-top:16px">
          <button class="opcion" data-dec="drive"><span class="marca"></span><span style="flex:1">
            <b>Quedarme con lo de Drive</b>
            <span>Lo de este aparato se sustituye. Es lo normal si este es el aparato nuevo.</span></span></button>
          <button class="opcion" data-dec="juntar"><span class="marca"></span><span style="flex:1">
            <b>Juntar los dos</b>
            <span>Se queda todo lo de ambos lados; no se borra nada. Puede devolverte cosas que ya habías borrado en el otro aparato.</span></span></button>
          <button class="opcion" data-dec="aqui"><span class="marca"></span><span style="flex:1">
            <b>Subir lo de este aparato</b>
            <span>Sustituye lo que hay en Drive. Antes se guarda allí una copia con fecha.</span></span></button>
        </div>`,
      pie: `<button class="btn" data-cerrar>Ahora no</button>`,
      alAbrir: () => {
        document.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => {
          const dec = b.dataset.dec;
          Modal.cerrar();
          sincronizar({ interactivo: true, decision: dec }).then(r => {
            Util.toast(r.estado === 'error' ? r.error
              : dec === 'drive' ? 'Traídos los datos de Drive'
              : dec === 'aqui' ? 'Subidos los datos de este aparato'
              : 'Juntado todo', r.estado === 'error' ? 'err' : '');
          });
        });
      }
    });
  }

  /* ---- Lo que se ve en Ajustes ---- */
  function pintarAjustes() {
    const c = document.querySelector('#dr-cuerpo');
    if (!c) return;

    if (!hayClientId()) {
      c.innerHTML = `
        <ul class="motivos"><li class="media"><i class="sev"></i><div>
          <b>Todavía no está configurado</b>
          <p>Tus datos se guardan solo en este aparato. Para tenerlos también en el móvil
          hay que crear un identificador de Google y pegarlo en el archivo <b>config.js</b>.
          El programa funciona igual mientras tanto.</p>
        </div></li></ul>
        <p class="small mut" style="margin-top:10px">Cuando lo pegues, recarga la página y
        aparecerá aquí el botón para conectar.</p>`;
      return;
    }

    const con = est.conectado;
    c.innerHTML = `
      <div class="kv"><span>Estado</span><b>${con ? (est.error ? 'Conectado, con un problema' : 'Conectado a tu Drive') : 'Sin conectar'}</b></div>
      <div class="kv"><span>Última sincronización</span><b>${est.ultima ? new Date(est.ultima).toLocaleString('es-ES') : '—'}</b></div>
      <div class="kv"><span>Carpeta en Drive</span><b>${Util.esc(cfg().carpeta)}</b></div>
      <div class="kv"><span>Última copia con fecha</span><b>${est.ultimaCopia ? Util.fecha(est.ultimaCopia) : '—'}</b></div>

      ${est.pendienteDecision ? `<ul class="motivos" style="margin-top:12px"><li class="critica"><i class="sev"></i><div>
        <b>Hay que decidir algo antes de sincronizar</b>
        <p>Este aparato y Drive tienen datos distintos y es la primera vez que se ven.
        No se toca nada hasta que elijas.</p>
        <button class="btn pri mini" id="dr-decidir" style="margin-top:8px">Ver y decidir</button>
      </div></li></ul>` : ''}

      ${est.error ? `<ul class="motivos" style="margin-top:12px"><li class="alta"><i class="sev"></i><div>
        <b>${Util.esc(est.error)}</b>
        <p>Tus datos siguen a salvo en este aparato. Vuelve a intentarlo; si insiste,
        desconecta y conecta otra vez.</p></div></li></ul>` : ''}

      ${est.conflictos && est.conflictos.length ? `<ul class="motivos" style="margin-top:12px"><li class="media"><i class="sev"></i><div>
        <b>${est.conflictos.length} ${est.conflictos.length === 1 ? 'cambio se pisaba' : 'cambios se pisaban'} entre los dos aparatos</b>
        <p>Se ha quedado la versión guardada más tarde. Puedes deshacerlo desde el aviso de arriba.</p>
        <ul class="hist" style="margin-top:6px">${est.conflictos.slice(0, 6).map(x => `
          <li><time>${Util.esc(String(x.campo).slice(0, 26))}</time><span class="small">
            aquí «${Util.esc(x.aqui || '—')}» · en Drive «${Util.esc(x.alla || '—')}»</span></li>`).join('')}</ul>
        <button class="btn mini" id="dr-vistos" style="margin-top:8px">Entendido</button>
      </div></li></ul>` : ''}

      <div class="toolbar" style="margin-top:14px">
        ${con ? `<button class="btn pri" id="dr-sync">Sincronizar ahora</button>
                 <button class="btn" id="dr-off">Desconectar</button>`
               : `<button class="btn pri" id="dr-on">Conectar con Drive</button>`}
      </div>
      <p class="small mut" style="margin-top:10px">
        La app solo ve los archivos que ella misma crea en tu Drive, nunca el resto.
        Guarda una copia con fecha al día y conserva las diez últimas.
        «Guardar archivo» y «Abrir archivo» siguen funcionando: son tu salvavidas si algún día
        dejas de usar Drive.</p>`;

    const b1 = document.querySelector('#dr-on');
    if (b1) b1.onclick = () => {
      Util.toast('Abriendo la ventana de Google…');
      sincronizar({ interactivo: true }).then(r => {
        if (r.estado === 'error') Util.toast(r.error, 'err');
        else if (r.estado === 'necesita-decision') preguntarPrimeraVez();
        else Util.toast(r.estado === 'creado' ? 'Conectado: tus datos ya están en Drive' : 'Conectado y sincronizado');
      });
    };
    const b2 = document.querySelector('#dr-sync');
    if (b2) b2.onclick = () => sincronizar({ interactivo: true }).then(r => {
      if (r.estado === 'necesita-decision') return preguntarPrimeraVez();
      const txt = { 'al-dia': 'Ya estaba todo al día', 'subido': 'Subidos tus cambios',
                    'bajado': 'Traídos los cambios de Drive', 'creado': 'Archivo creado en Drive',
                    'fusionado': 'Juntados los cambios de los dos aparatos' };
      Util.toast(r.estado === 'error' ? r.error : (txt[r.estado] || 'Listo'), r.estado === 'error' ? 'err' : '');
    });
    const b3 = document.querySelector('#dr-off');
    if (b3) b3.onclick = () => Modal.confirmar('Desconectar de Drive',
      'Tus datos se quedan aquí y el archivo de Drive no se toca. Podrás volver a conectar cuando quieras.',
      () => { desconectar(); Util.toast('Desconectado'); }, 'Desconectar');
    const b5 = document.querySelector('#dr-decidir');
    if (b5) b5.onclick = preguntarPrimeraVez;
    const b4 = document.querySelector('#dr-vistos');
    if (b4) b4.onclick = () => { est.conflictos = []; guardarEstado(); pintarAjustes(); };
  }

  return { init, sincronizar, desconectar, estado: () => est, hayClientId,
           refrescarIndicador, pintarAjustes, preguntarPrimeraVez, leerBase, guardarBase,
           api, pedirToken, guardarEstado, scopes };
})();
