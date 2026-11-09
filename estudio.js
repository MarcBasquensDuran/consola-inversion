/* ═══════════════════════════════════════════════════════════════
   ENCARGAR UN ESTUDIO

   El programa no puede llamar a nadie: lo que hace es escribir el
   encargo exacto, con tus hipótesis, tus fechas y lo que ya sabes de
   cada empresa, para que el análisis que vuelva hable de TU tesis y no
   sea un resumen de prensa.
   ═══════════════════════════════════════════════════════════════ */
const Estudio = (() => {

  const ALCANCES = [
    ['abiertas', 'Solo las posiciones abiertas'],
    ['todas',    'Posiciones y lista de vigilancia'],
    ['semaforo', 'Solo lo que el semáforo marca en ámbar o rojo'],
    ['vencidas', 'Solo las que tienen la revisión vencida'],
    ['manual',   'Elijo yo una a una']
  ];

  const MIRAR = [
    ['cifras',     'Cifras del último periodo publicado'],
    ['expectativas', 'Expectativas y guía de la compañía'],
    ['organizacion', 'Cambios en el consejo y la dirección'],
    ['accionistas',  'Movimientos de accionistas significativos'],
    ['sector',       'Competencia y sector'],
    ['regulacion',   'Regulación que le afecte'],
    ['corporativo',  'Operaciones corporativas: compras, ventas, ampliaciones']
  ];

  function guardado() {
    return Object.assign({
      alcance: 'abiertas', fondo: true, seleccion: [],
      mirar: ['cifras', 'expectativas', 'organizacion', 'corporativo'], extra: ''
    }, Store.ajustes().encargoEstudio || {});
  }

  /* Qué empresas entran según el alcance elegido */
  function candidatas(alcance) {
    const c = Calc.cartera();
    const hoy = Util.hoy();
    return Store.activos().filter(a => {
      if (a.estado !== 'cartera' && a.estado !== 'vigilancia') return false;
      const abierta = Calc.posicion(a.id).abierta;
      if (alcance === 'abiertas') return a.estado === 'cartera' && abierta;
      if (alcance === 'todas') return a.estado === 'vigilancia' || abierta;
      if (alcance === 'semaforo') {
        const v = Motor.evaluar(a, c);
        return v.accion !== 'mantener';
      }
      if (alcance === 'vencidas') {
        const pr = a.seguimiento && a.seguimiento.proximaRevision;
        return pr && pr < hoy;
      }
      return true;                       /* manual: las ofrece todas */
    });
  }

  function abrir() {
    const g = guardado();
    const todas = Store.activos().filter(a => a.estado === 'cartera' || a.estado === 'vigilancia');
    if (!todas.length) { Util.toast('No tienes empresas que estudiar', 'err'); return; }

    Modal.abrir({
      titulo: 'Encargar un estudio', ancho: true,
      cuerpo: `
        <p class="soft small" style="margin-bottom:14px">
          Elige qué empresas y qué quieres que mire. El encargo que sale abajo lleva tus hipótesis
          con su plazo y lo último que sabías de cada una, para que el estudio hable de tu tesis.
          De tus posiciones, solo lo que elijas abajo.</p>

        <div class="form-grid">
          <div class="field"><label>Qué empresas</label>
            <select id="es-alcance">${ALCANCES.map(([k, n]) =>
              `<option value="${k}" ${g.alcance === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          <div class="field"><label>Hasta dónde quiero que llegue</label>
            <select id="es-fondo">
              <option value="1" ${g.fondo ? 'selected' : ''}>Estudio a fondo, con informe escrito</option>
              <option value="0" ${!g.fondo ? 'selected' : ''}>Actualización: datos y novedades</option>
            </select></div>
        </div>

        <div class="bloque-t">Empresas <span id="es-cuenta" class="mut" style="font-weight:440"></span></div>
        <div class="chips" id="es-lista"></div>

        <div class="bloque-t">Qué quiero que mire</div>
        <div class="chips">${MIRAR.map(([k, n]) =>
          `<label class="chip ${g.mirar.includes(k) ? 'on' : ''}" style="--col:var(--g5)">
            <input type="checkbox" data-es-mirar="${k}" ${g.mirar.includes(k) ? 'checked' : ''} style="width:auto;margin:0">
            <span>${n}</span></label>`).join('')}</div>

        <div style="margin-top:14px">${Privacidad.selector('es-priv')}</div>
        <div class="field" style="margin-top:2px"><label>Algo más que quiera pedir esta vez</label>
          <textarea id="es-extra" style="min-height:52px"
            placeholder="Por ejemplo: mira si han publicado el plan estratégico">${Util.esc(g.extra)}</textarea></div>

        <div class="bloque-t">Encargo listo para copiar</div>
        <textarea id="es-out" style="min-height:210px;font-family:ui-monospace,Menlo,monospace;font-size:12px"></textarea>`,
      pie: `<button class="btn" data-cerrar>Cerrar</button>
            <button class="btn" id="es-dl">Guardar como archivo</button>
            <button class="btn pri" id="es-cp">Copiar</button>`,
      alAbrir: () => {
        let sel = new Set(g.seleccion);

        function pintarLista() {
          const alc = document.querySelector('#es-alcance').value;
          const cand = candidatas(alc);
          if (alc !== 'manual') sel = new Set(cand.map(a => a.id));
          else if (!sel.size) sel = new Set(cand.filter(a => a.estado === 'cartera').map(a => a.id));

          document.querySelector('#es-lista').innerHTML = todas.map(a => {
            const elegible = alc === 'manual' || cand.some(x => x.id === a.id);
            const on = sel.has(a.id);
            return `<label class="chip ${on ? 'on' : ''}" style="--col:${a.estado === 'cartera' ? 'var(--g1)' : 'var(--g3)'};${elegible ? '' : 'opacity:.4'}">
              <input type="checkbox" data-es-emp="${a.id}" ${on ? 'checked' : ''} style="width:auto;margin:0">
              <span>${Util.esc(Util.nombreDe(a))} <span class="tk-mini">${Util.esc(a.ticker)}</span></span>
              <span class="n">${a.estado === 'cartera' ? 'cartera' : 'vigilancia'}</span></label>`;
          }).join('');

          document.querySelectorAll('[data-es-emp]').forEach(i => i.onchange = () => {
            i.checked ? sel.add(i.dataset.esEmp) : sel.delete(i.dataset.esEmp);
            document.querySelector('#es-alcance').value = 'manual';
            pintarLista();
          });
          refrescar();
        }

        function refrescar() {
          const fondo = document.querySelector('#es-fondo').value === '1';
          const n = sel.size;
          const cuenta = document.querySelector('#es-cuenta');
          cuenta.textContent = `· ${n} ${n === 1 ? 'empresa' : 'empresas'} · ${fondo ? 'estudio a fondo' : 'actualización'}` +
            (fondo && n > 6 ? ' · son muchas para un estudio a fondo, piensa en partirlo en dos tandas' : '');
          cuenta.className = (fondo && n > 6) ? 'neg' : 'mut';

          const v = {
            alcance: document.querySelector('#es-alcance').value,
            fondo, seleccion: [...sel],
            mirar: [...document.querySelectorAll('[data-es-mirar]')].filter(x => x.checked).map(x => x.dataset.esMirar),
            extra: document.querySelector('#es-extra').value.trim()
          };
          document.querySelectorAll('[data-es-mirar]').forEach(x => x.closest('.chip').classList.toggle('on', x.checked));
          document.querySelector('#es-out').value = texto(v);
          Store.ajustes().encargoEstudio = v;
          Store.guardar();
        }

        document.querySelector('#es-alcance').onchange = () => { sel = new Set(); pintarLista(); };
        document.querySelector('#es-fondo').onchange = refrescar;
        document.querySelector('#es-priv').onchange = () => { Privacidad.poner(document.querySelector('#es-priv').value); refrescar(); };
        document.querySelector('#es-extra').oninput = refrescar;
        document.querySelectorAll('[data-es-mirar]').forEach(x => x.onchange = refrescar);
        document.querySelector('#es-cp').onclick = () => {
          const ta = document.querySelector('#es-out'); ta.select();
          navigator.clipboard ? navigator.clipboard.writeText(ta.value).then(() => Util.toast('Encargo copiado'),
            () => { document.execCommand('copy'); Util.toast('Encargo copiado'); })
            : (document.execCommand('copy'), Util.toast('Encargo copiado'));
        };
        document.querySelector('#es-dl').onclick = () =>
          Util.bajar(`encargo_estudio_${Util.hoy()}.txt`, document.querySelector('#es-out').value, 'text/plain');
        pintarLista();
      }
    });
  }

  /* ---- El texto del encargo ---- */
  function texto(v) {
    const acts = v.seleccion.map(id => Store.activo(id)).filter(Boolean);
    const hoy = Util.hoy();
    const c = Calc.cartera();

    const bloques = acts.map(a => {
      const p = Calc.posicion(a.id);
      const ult = (a.estudios || [])[0];
      const L = [];
      L.push(`── ${a.ticker} · ${a.nombre}`);
      L.push(`   ${TIPOS[a.tipo]} · ${a.sector || 'sector sin anotar'} · ${a.pais || 'país sin anotar'}${a.isin ? ' · ISIN ' + a.isin : ''}`);
      L.push(`   Situación: ${Privacidad.situacion(a)}`);
      L.push(`   Precio que tengo guardado: ${Util.num(a.cotizacion.precio)} ${a.divisa} del ${a.cotizacion.fecha || 'fecha desconocida'}`);
      L.push(`   Tomas de indicadores: ${(a.serie || []).length}${(a.serie || []).length ? `, la última del ${Util.fecha(a.serie[a.serie.length - 1].fecha)}` : ''}`);
      L.push(a.fundamentales.length
        ? `   Últimas cifras registradas: ejercicio ${a.fundamentales[a.fundamentales.length - 1].periodo}`
        : '   No tengo cifras del negocio registradas.');
      L.push(ult ? `   Último estudio: ${Util.fecha(ult.fecha)} · «${ult.titular}»`
                 : '   Nunca he pedido un estudio de esta.');

      const abiertas = (a.tesis.hipotesis || []).filter(h => h.estado !== 'rota');
      if (abiertas.length) {
        L.push('   Hipótesis abiertas, que son lo que quiero que compruebes:');
        abiertas.forEach((h, i) => {
          L.push(`     ${i + 1}. [${ESTADOS_HIPO[h.estado]}] ${h.texto}`);
          L.push(`        Se mide con: ${h.metrica || 'sin métrica anotada'} · Espero: ${h.esperado || 'sin valor anotado'} · Plazo: ${h.plazo ? Util.fecha(h.plazo) : 'sin plazo'}`);
          if (h.evidencia) L.push(`        Lo último que sé: ${h.evidencia}`);
        });
      }
      const rotas = (a.tesis.hipotesis || []).filter(h => h.estado === 'rota');
      if (rotas.length) L.push(`   Ya doy por rotas: ${rotas.map(h => h.texto).join('; ')}`);
      if (a.tesis.riesgos.length) L.push(`   Riesgos que vigilo: ${a.tesis.riesgos.map(r => r.texto).join(' ')}`);
      if (a.tesis.premortem) L.push(`   Lo que escribí que podría salir mal: ${a.tesis.premortem}`);
      return L.join('\n');
    });

    const pide = {
      cifras: 'Las cifras del último periodo publicado: ventas, resultado de explotación, margen, caja libre, deuda neta y número de acciones. De las cuentas de la compañía, no de un agregador.',
      expectativas: 'Las expectativas: la guía que haya dado la propia compañía y, si hay consenso de analistas público, también. Si no encuentras consenso fiable, dilo en vez de estimarlo.',
      organizacion: 'Cambios en el consejo y en la dirección: quién entra, quién sale y qué razón se da.',
      accionistas: 'Movimientos de accionistas significativos y compras o ventas de directivos con su propio dinero.',
      sector: 'Qué está pasando en su sector y con sus competidores directos, solo si afecta a la tesis.',
      regulacion: 'Cambios regulatorios o decisiones administrativas que le afecten.',
      corporativo: 'Operaciones corporativas: compras, ventas de negocios, ampliaciones de capital, recompras, refinanciaciones.'
    };

    const aj = Store.ajustes();
    const L = [
      `ENCARGO DE ESTUDIO · ${Util.fecha(hoy)}`,
      aj.ultimoInforme ? `Periodo a cubrir: desde el ${Util.fecha(aj.ultimoInforme)} hasta hoy.`
                       : 'Periodo a cubrir: los últimos tres meses.',
      Privacidad.aviso(),
      '',
      v.fondo
        ? `Estudia a fondo estas ${acts.length} ${acts.length === 1 ? 'empresa' : 'empresas'} y devuélveme el resultado como un único bloque JSON con el esquema del final, sin texto antes ni después.`
        : `Actualiza los datos de estas ${acts.length} ${acts.length === 1 ? 'empresa' : 'empresas'} y devuélveme el resultado como un único bloque JSON con el esquema del final, sin texto antes ni después.`,
      '',
      'QUÉ NECESITO',
      '1. Una toma completa de indicadores por empresa, con su fecha y su fuente. Esto alimenta mis gráficas en el tiempo y es lo que no debe fallar nunca.',
      '2. Para cada hipótesis que te listo abajo: si hay evidencia nueva, cuál es, y si te parece que sigue cumpliéndose, conviene vigilarla o está rota. Es la parte importante del encargo.',
      ...v.mirar.map((k, i) => `${i + 3}. ${pide[k] || k}`),
      v.fondo ? `${v.mirar.length + 3}. Un informe escrito por empresa, con el titular, los apartados y las fuentes que pide el esquema.` : null,
      '',
      'CÓMO QUIERO QUE TRABAJES',
      '· Fuentes primarias: cuentas anuales, informes semestrales, hechos relevantes del regulador, presentaciones de la compañía. Los agregadores solo para múltiplos, diciéndome cuál usas.',
      '· Fecha cada dato. Lo que no encuentres, déjalo fuera en lugar de estimarlo, y dímelo en el resumen.',
      '· El titular tiene que decir lo más importante en una frase, porque es lo único que veré sin abrir el informe. Nada de «actualización de X»: dime qué ha pasado.',
      '· Distingue siempre el hecho de tu interpretación.',
      '· El veredicto que propongas es una sugerencia que yo acepto o descarto: no cambia nada por sí solo.',
      '· No me des recomendaciones de compra ni de venta. Dame datos comprobables y qué le pasa a cada hipótesis.',
      v.extra ? `· Además: ${v.extra}` : null,
      '',
      '═══ MIS EMPRESAS ═══',
      '',
      bloques.join('\n\n'),
      '',
      '═══ ESQUEMA DE LA RESPUESTA ═══',
      '',
      '{',
      '  "fecha": "AAAA-MM-DD",',
      '  "resumen": "Qué has encontrado en conjunto y qué no has podido verificar",',
      v.fondo ? '  "estudios": [' : null,
      v.fondo ? '    {' : null,
      v.fondo ? '      "ticker": "XXX.MC",' : null,
      v.fondo ? '      "fecha": "AAAA-MM-DD",' : null,
      v.fondo ? '      "titular": "Lo más importante en una frase",' : null,
      v.fondo ? '      "veredicto": "mantener | revisar | reducir | vender",' : null,
      v.fondo ? '      "resumen": "Tres o cuatro frases con lo esencial",' : null,
      v.fondo ? '      "secciones": [' : null,
      v.fondo ? '        { "titulo": "Qué ha pasado desde el último estudio", "texto": "" },' : null,
      v.fondo ? '        { "titulo": "Las cifras", "texto": "" },' : null,
      v.fondo ? '        { "titulo": "Expectativas y guía", "texto": "" },' : null,
      v.fondo ? '        { "titulo": "Cambios en la organización", "texto": "" },' : null,
      v.fondo ? '        { "titulo": "Qué le pasa a cada hipótesis", "texto": "" },' : null,
      v.fondo ? '        { "titulo": "Qué vigilar hasta el próximo", "texto": "" }' : null,
      v.fondo ? '      ],' : null,
      v.fondo ? '      "fuentes": [{ "titulo": "", "url": "https://...", "fecha": "AAAA-MM-DD" }]' : null,
      v.fondo ? '    }' : null,
      v.fondo ? '  ],' : null,
      '  "datos": [',
      '    { "ticker": "XXX.MC", "fecha": "AAAA-MM-DD", "fuente": "De dónde salen los múltiplos",',
      '      "precio": 0, "capitalizacion": 0, "per": 0, "pvc": 0, "evEbit": 0, "evEbitda": 0,',
      '      "roe": 0, "roic": 0, "margen": 0, "deudaEbitda": 0, "divYield": 0, "fcfYield": 0 }',
      '  ],',
      '  "hipotesis": [',
      '    { "ticker": "XXX.MC", "texto": "las primeras palabras de mi hipótesis, para identificarla",',
      '      "evidencia": "El dato nuevo, con su cifra y su fecha",',
      '      "estadoSugerido": "cumpliendo | vigilar | rota | pendiente", "fecha": "AAAA-MM-DD" }',
      '  ],',
      '  "noticias": [',
      '    { "ticker": "XXX.MC", "fecha": "AAAA-MM-DD", "titular": "",',
      '      "resumen": "El hecho, sin adjetivos", "fuente": "", "url": "",',
      '      "impacto": "alto | medio | bajo",',
      '      "tipo": "resultados | regulatorio | operativo | mercado | otro",',
      '      "efecto": "refuerza | debilita | incierto" }',
      '  ],',
      '  "fundamentales": [',
      '    { "ticker": "XXX.MC", "periodo": "2026", "ventas": 0, "ebit": 0, "bpa": 0, "fcf": 0,',
      '      "roic": 0, "margen": 0, "deudaEbitda": 0, "acciones": 0, "dividendo": 0 }',
      '  ]',
      '}'
    ];
    return L.filter(x => x !== null).join('\n');
  }

  return { abrir, candidatas, texto };
})();
