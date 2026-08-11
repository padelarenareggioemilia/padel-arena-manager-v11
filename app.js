
let DATA, currentCenter, view='home';

const icons = {play:'🎾', lessons:'🎓', events:'🏆', membership:'🪪', profile:'👤', booking:'📅'};

async function init(){
  DATA = await fetch('data.json').then(r=>r.json());
  currentCenter = localStorage.getItem('pam-center') || DATA.centers[0].id;
  render();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
}
function center(){ return DATA.centers.find(c=>c.id===currentCenter) || DATA.centers[0]; }
function setCenter(id){ currentCenter=id; localStorage.setItem('pam-center',id); view='home'; render(); }
function go(v){ view=v; render(); window.scrollTo({top:0,behavior:'smooth'}); }

function shell(content,active='home'){
  const c=center();
  return `<div class="app-shell">
    <div class="topbar">
      <img class="brand-logo" src="assets/padel-arena-manager.jpeg">
      <div class="brand-title">PADEL ARENA<br>MANAGER <small>v11</small></div>
    </div>
    ${content}
    <footer>Prototype v11 • Padel Arena Manager</footer>
  </div>
  <nav class="bottomnav">
    <button class="${active==='home'?'active':''}" onclick="go('home')">🏠<br>Home</button>
    <button class="${active==='activities'?'active':''}" onclick="go('activities')">📅<br>Attività</button>
    <button class="${active==='booking'?'active':''}" onclick="go('booking')">➕<br>Prenota</button>
    <button class="${active==='alerts'?'active':''}" onclick="go('alerts')">🔔<br>Avvisi</button>
    <button class="${active==='profile'?'active':''}" onclick="go('profile')">👤<br>Profilo</button>
  </nav>`;
}
function hero(){
  const c=center();
  return `<section class="hero">
    <div class="center-row">
      <img class="center-logo" src="${c.logo}">
      <div class="center-select">
        <div class="muted">Il tuo centro</div>
        <select onchange="setCenter(this.value)">
          ${DATA.centers.map(x=>`<option value="${x.id}" ${x.id===c.id?'selected':''}>${x.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="affiliation"><span>Affiliato / tesseramento</span><img src="${c.affiliationLogo}" alt="${c.affiliation}"></div>
  </section>`;
}
function home(){
  const c=center();
  const play = c.modules.play ? `<button class="action" onclick="go('play')">🎾<strong>Gioca</strong><span>Prenota, trova o crea una partita</span></button>` : '';
  return shell(`${hero()}
    <h2>Ciao 👋</h2>
    <div class="card activity"><div>📅</div><div><span class="badge">PROSSIMA ATTIVITÀ</span><strong style="display:block;margin-top:8px">Giovedì • 18:00</strong><div class="muted">Lezione X1 • ${c.name}</div></div></div>
    <h2>Cosa vuoi fare?</h2>
    <div class="grid">
      ${play}
      <button class="action" onclick="go('lessons')">🎓<strong>Lezioni e corsi</strong><span>Pacchetti, calendario e presenze</span></button>
      <button class="action" onclick="go('events')">🏆<strong>Tornei ed eventi</strong><span>Clinic, circuiti e campionati</span></button>
      <button class="action" onclick="go('membership')">🪪<strong>Tesseramento</strong><span>Stato tessera e documenti</span></button>
    </div>
    <h2>Succede al club</h2>
    <div class="list">
      ${c.modules.openMatches?`<div class="card notice"><div><strong>Manca 1 giocatore</strong><div class="muted">Oggi 20:30 • livello 3.0–3.5</div></div><button class="secondary">Unisciti</button></div>`:''}
      <div class="card"><div><strong>Clinic weekend</strong><div class="muted">Posti disponibili</div></div><button class="secondary">Scopri</button></div>
    </div>`, 'home');
}
function play(){
  const c=center();
  if(!c.modules.play) return shell(`${hero()}<h2>Gioca</h2><div class="card">Questo modulo non è attivo per ${c.name}.</div>`,'activities');
  return shell(`${hero()}<div class="page-head"><h2>Gioca</h2><button class="back" onclick="go('home')">← Home</button></div>
  <div class="grid">
    <button class="action" onclick="go('booking')">📅<strong>Prenota campo</strong><span>Vista rapida o pannello completo</span></button>
    <button class="action">👥<strong>Trova partita</strong><span>Partite aperte compatibili</span></button>
    <button class="action">➕<strong>Crea partita</strong><span>Privata o aperta</span></button>
    <button class="action">🕘<strong>Le mie partite</strong><span>Prossime e storico</span></button>
  </div>`,'activities');
}
function booking(){
  const c=center();
  if(!c.modules.courtBooking) return shell(`${hero()}<h2>Prenota</h2><div class="card">La prenotazione campi non è attiva per ${c.name}.</div>`,'booking');
  const rows = ['17:00','18:00','19:00','20:00','21:00'].map((t,i)=>`
    <div>${t}</div>
    <div class="${i===2?'busy':'free'}">${i===2?'Occupato':'Libero'}</div>
    <div class="${i===1||i===4?'busy':'free'}">${i===1||i===4?'Occupato':'Libero'}</div>
    <div class="${i===0?'busy':'free'}">${i===0?'Occupato':'Libero'}</div>`).join('');
  return shell(`${hero()}<div class="page-head"><h2>Prenota un campo</h2><button class="back" onclick="go('play')">← Gioca</button></div>
  <div class="card"><strong>Vista pannello completa</strong><div class="muted">Demo • oggi</div></div>
  <div class="slot-grid" style="margin-top:10px">
    <div></div><div>Campo 1</div><div>Campo 2</div><div>Campo 3</div>${rows}
  </div>
  <div class="card" style="margin-top:12px"><strong>Vista rapida</strong><div class="muted">Nel prodotto completo qui potrai scegliere giorno, ora e durata.</div></div>`,'booking');
}
function lessons(){
  const c=center();
  const packs = DATA.packages.filter(p=>p.center===c.id);
  return shell(`${hero()}<div class="page-head"><h2>Lezioni e corsi</h2><button class="back" onclick="go('home')">← Home</button></div>
  <div class="card"><span class="badge">PROSSIMA LEZIONE</span><strong style="display:block;margin-top:8px">Giovedì • 18:00</strong><div class="muted">Lezione X1 • Maestro Marco</div></div>
  <h2>I miei pacchetti</h2>
  <div class="card"><div class="kpi">3 / 5</div><strong>5 LEZIONI X1</strong><div class="muted">3 lezioni rimanenti • scadenza 31/10/2026</div><div class="progress"><i></i></div></div>
  <h2>Listino disponibile</h2>
  <div class="list">${packs.length?packs.map(p=>`<div class="card"><div><strong>${p.name}</strong><div class="muted">${p.description}</div></div><strong>${p.price}</strong></div>`).join(''):`<div class="card">Listino da configurare per ${c.name}.</div>`}</div>`,'activities');
}
function events(){ return shell(`${hero()}<h2>Tornei ed eventi</h2><div class="card">Modulo predisposto per tornei, clinic, circuiti e campionati. Potremo integrare qui il progetto tornei.</div>`,'activities');}
function membership(){ return shell(`${hero()}<h2>Tesseramento</h2><div class="card"><span class="badge">AICS</span><div class="kpi" style="font-size:1.25rem;margin-top:10px">Tesseramento attivo</div><div class="muted">Scadenza demo: 31/08/2027</div></div><h2>Documenti</h2><div class="card">✓ Anagrafica completa<br>✓ Quota registrata<br>✓ Tessera collegata al profilo</div>`,'profile');}
function profile(){ return shell(`${hero()}<h2>Profilo</h2><div class="card"><strong>Cliente Demo</strong><div class="muted">Giocatore • Allievo • Partecipante eventi</div></div><h2>Collegamenti</h2><div class="card">Pacchetti • Pagamenti • Figli collegati • Documenti • Storico attività</div>`,'profile');}
function generic(title,msg,active){ return shell(`${hero()}<h2>${title}</h2><div class="card">${msg}</div>`,active); }

function render(){
  let html;
  if(view==='home') html=home();
  else if(view==='play') html=play();
  else if(view==='booking') html=booking();
  else if(view==='lessons') html=lessons();
  else if(view==='events') html=events();
  else if(view==='membership') html=membership();
  else if(view==='profile') html=profile();
  else if(view==='activities') html=generic('Attività','Calendario unificato di partite, lezioni, corsi ed eventi.','activities');
  else if(view==='alerts') html=generic('Avvisi','Qui arriveranno notifiche utili: lezioni residue, tesseramento, partite da completare, eventi e scadenze.','alerts');
  else html=home();
  document.getElementById('app').innerHTML=html;
}
init();
