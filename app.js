import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signInAnonymously,
  signOut,sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  getFirestore,doc,getDoc,setDoc,addDoc,updateDoc,deleteDoc,collection,getDocs,query,where,
  serverTimestamp,runTransaction,Timestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig={
  apiKey:"AIzaSyDpw8GsnYGupBc94qt4ZqC2af8TSuZ2tes",
  authDomain:"padel-arena-manager-v11.firebaseapp.com",
  projectId:"padel-arena-manager-v11",
  storageBucket:"padel-arena-manager-v11.firebasestorage.app",
  messagingSenderId:"140040431254",
  appId:"1:140040431254:web:de0e76cac028088c1704b7"
};

const fb=initializeApp(firebaseConfig);
const auth=getAuth(fb);
const db=getFirestore(fb);
const $=id=>document.getElementById(id);

const CLUBS={
  eden:{id:"eden",name:"Eden Padel Club",logo:"assets/eden.jpeg",courts:["Campo Blu","Campo Verde"],freePlay:true,weekday:"06:30â23:00",weekend:"08:30â19:30"},
  happy:{id:"happy",name:"Happy Time",logo:"assets/happy.jpeg",courts:["Campo 1","Campo 2"],freePlay:false,weekday:"06:30â23:00",weekend:"08:30â19:30"}
};

const INSTRUCTOR={
  id:"francesco-lignola",
  name:"Francesco Lignola",
  title:"Istruttore Nazionale AICS"
};

const LESSON_SEED=[
  ["2026-09-14","16:00","17:00","eden","Classe tecnica","VolÃ©e e posizione a rete",4,15],
  ["2026-09-15","16:30","17:30","eden","Lezione X1","Lezione individuale X1",1,35],
  ["2026-09-16","16:00","17:00","eden","Classe tecnica","Difesa e uscita dal vetro",4,15],
  ["2026-09-17","14:30","15:30","happy","Lezione X1","Lezione individuale X1",1,35],
  ["2026-09-17","17:30","18:30","happy","Classe tecnica","Bandeja: tecnica e controllo",4,15],
  ["2026-09-17","18:30","19:30","happy","Classe tecnica","Transizione fondo/rete",4,15],
  ["2026-09-18","17:30","18:30","eden","Classe tecnica","Servizio, risposta e primo colpo",4,15],
  ["2026-09-19","09:30","10:30","eden","Lezione X1","X1 â spazio libero tra le due lezioni",1,35],
  ["2026-09-19","11:30","12:30","eden","Classe tecnica","Lob e conquista della rete",4,15],
  ["2026-09-21","16:00","17:00","eden","Classe tecnica","Bandeja e recupero della posizione",4,15],
  ["2026-09-22","16:30","17:30","eden","Lezione X1","Lezione individuale X1",1,35],
  ["2026-09-23","16:00","17:00","eden","Classe tecnica","Difendere con i vetri",4,15],
  ["2026-09-24","14:30","15:30","happy","Lezione X1","Lezione individuale X1",1,35],
  ["2026-09-24","17:30","18:30","happy","Classe tecnica","VolÃ©e: controllo e direzione",4,15],
  ["2026-09-24","18:30","19:30","happy","Classe tecnica","Costruzione del punto",4,15],
  ["2026-09-25","17:30","18:30","eden","Classe tecnica","Pallonetto e transizione a rete",4,15],
  ["2026-09-26","09:30","10:30","eden","Lezione X1","X1 â spazio libero tra le due lezioni",1,35],
  ["2026-09-26","11:30","12:30","eden","Classe tecnica","Bandeja e gioco aereo",4,15]
];

let S={
  user:null,profile:null,role:null,club:null,view:"home",preview:null,
  lessonFilterClub:"all",lessonFilterType:"all",adminLessons:[],playerId:null,playerSource:null,guestPlayer:null,
  lessonEditId:null,lessonEditMode:null
};

const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const name=()=>[S.profile?.firstName,S.profile?.lastName].filter(Boolean).join(" ")||S.user?.email||"";

const hasDirectLessonLink=()=>{
  const qs=new URLSearchParams(location.search);
  return !!(qs.get("lessons")||qs.get("lesson"));
};
const normalizePhone=v=>String(v||"").replace(/\D/g,"").replace(/^0039/,"39");
const normalizeEmail=v=>String(v||"").trim().toLowerCase();
const lookupKey=v=>{
  const s=String(v||"").trim();
  return s.includes("@")?`email_${normalizeEmail(s)}`:`phone_${normalizePhone(s)}`;
};
const guestStorageKey="pam_guest_player_id";

function italianDate(dateStr){
  const d=new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"});
}
function capFirst(s){return s?String(s).charAt(0).toUpperCase()+String(s).slice(1):""}
function seatsText(n){return n===1?"1 posto disponibile":`${n} posti disponibili`}

async function attachGuestSession(playerId){
  if(!S.user?.uid)return;
  await setDoc(doc(db,"guest_sessions",S.user.uid),{
    playerId,
    updatedAt:serverTimestamp()
  },{merge:true});
  localStorage.setItem(guestStorageKey,playerId);
}

async function loadGuestIdentity(){
  if(!S.user?.isAnonymous)return null;
  const stored=localStorage.getItem(guestStorageKey);
  if(stored){
    try{
      const s=await getDoc(doc(db,"guest_players",stored));
      if(s.exists()){
        S.guestPlayer={id:s.id,...s.data()};
        await attachGuestSession(s.id);
        return S.guestPlayer;
      }
    }catch(e){console.warn("Profilo ospite locale non disponibile",e)}
  }
  try{
    const session=await getDoc(doc(db,"guest_sessions",S.user.uid));
    if(session.exists()&&session.data().playerId){
      const playerId=session.data().playerId;
      const s=await getDoc(doc(db,"guest_players",playerId));
      if(s.exists()){
        S.guestPlayer={id:s.id,...s.data()};
        localStorage.setItem(guestStorageKey,playerId);
        return S.guestPlayer;
      }
    }
  }catch(e){console.warn("Sessione ospite non disponibile",e)}
  S.guestPlayer=null;
  return null;
}

async function findExistingGuest(identifier){
  const key=lookupKey(identifier);
  if(key.endsWith("_"))return null;
  const lk=await getDoc(doc(db,"player_lookup",key));
  if(!lk.exists())return null;
  const data=lk.data();
  if(!data.playerId)return null;
  const p=await getDoc(doc(db,"guest_players",data.playerId));
  if(!p.exists())return null;
  S.guestPlayer={id:p.id,...p.data()};
  await attachGuestSession(p.id);
  return S.guestPlayer;
}

async function createGuestPlayer(data){
  const phone=normalizePhone(data.phone);
  const email=normalizeEmail(data.email);
  const phoneKey=phone?`phone_${phone}`:null;
  const emailKey=email?`email_${email}`:null;

  // Se esiste giÃ  telefono o email, riusa subito l'anagrafica esistente.
  for(const key of [phoneKey,emailKey].filter(Boolean)){
    const lk=await getDoc(doc(db,"player_lookup",key));
    if(lk.exists()&&lk.data().playerId){
      const p=await getDoc(doc(db,"guest_players",lk.data().playerId));
      if(p.exists()){
        S.guestPlayer={id:p.id,...p.data()};
        await attachGuestSession(p.id);
        return S.guestPlayer;
      }
    }
  }

  const playerRef=doc(collection(db,"guest_players"));
  const payload={
    firstName:data.firstName.trim(),
    lastName:data.lastName.trim(),
    sex:data.sex,
    birthDate:data.birthDate,
    birthPlace:data.birthPlace.trim(),
    residenceCity:data.residenceCity.trim(),
    phone,
    email,
    level:data.level,
    playSide:data.playSide,
    dominantHand:data.dominantHand,
    createdAt:serverTimestamp(),
    updatedAt:serverTimestamp()
  };

  await runTransaction(db,async tx=>{
    if(phoneKey){
      const snap=await tx.get(doc(db,"player_lookup",phoneKey));
      if(snap.exists())throw new Error("Telefono giÃ  presente. Usa 'Sono giÃ  registrato'.");
    }
    if(emailKey){
      const snap=await tx.get(doc(db,"player_lookup",emailKey));
      if(snap.exists())throw new Error("Email giÃ  presente. Usa 'Sono giÃ  registrato'.");
    }
    tx.set(playerRef,payload);
    if(phoneKey)tx.set(doc(db,"player_lookup",phoneKey),{playerId:playerRef.id,type:"phone",updatedAt:serverTimestamp()});
    if(emailKey)tx.set(doc(db,"player_lookup",emailKey),{playerId:playerRef.id,type:"email",updatedAt:serverTimestamp()});
  });

  const p=await getDoc(playerRef);
  S.guestPlayer={id:p.id,...p.data()};
  await attachGuestSession(p.id);
  return S.guestPlayer;
}

function guestIdentityPanel(){
  if(S.guestPlayer){
    return `<div class="card ok">
      <div><b>Ciao ${esc(S.guestPlayer.firstName||"")} ð</b>
      <div class="muted tiny">Ti abbiamo riconosciuto. Seleziona la lezione e prenota.</div></div>
    </div>`;
  }
  return `<div class="card">
    <b>Hai giÃ  prenotato con noi?</b>
    <div class="muted tiny">Inserisci telefono oppure email. Se ti troviamo in anagrafica, puoi prenotare subito senza compilare di nuovo i dati.</div>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
      <input id="guestLookup" placeholder="Telefono o email" style="flex:1;min-width:220px">
      <button id="guestLookupBtn" class="btn">Riconoscimi</button>
    </div>
  </div>
  <form id="guestProfileForm" class="card">
    <b>Prima prenotazione</b>
    <div class="muted tiny">Compila l'anagrafica una sola volta. Al prossimo accesso il sistema proverÃ  a riconoscerti automaticamente.</div>
    <div class="row">
      <div><label>Nome</label><input id="gFirstName" required></div>
      <div><label>Cognome</label><input id="gLastName" required></div>
    </div>
    <div class="row">
      <div><label>Sesso</label><select id="gSex" required><option value="">Seleziona</option><option>Maschio</option><option>Femmina</option><option>Altro / preferisco non indicare</option></select></div>
      <div><label>Data di nascita</label><input id="gBirthDate" type="date" required></div>
    </div>
    <div class="row">
      <div><label>Luogo di nascita</label><input id="gBirthPlace" required></div>
      <div><label>Comune di residenza</label><input id="gResidenceCity" required></div>
    </div>
    <div class="row">
      <div><label>Telefono</label><input id="gPhone" type="tel" required></div>
      <div><label>Email</label><input id="gEmail" type="email" required></div>
    </div>
    <div class="row">
      <div><label>Livello</label>
        <select id="gLevel" required>
          <option value="">Seleziona</option>
          <option>Principiante base</option>
          <option>Principiante avanzato</option>
          <option>Medio base</option>
          <option>Intermedio</option>
          <option>Intermedio avanzato</option>
          <option>Avanzato</option>
        </select>
      </div>
      <div><label>Gioco a</label><select id="gPlaySide" required><option value="">Seleziona</option><option>Destra</option><option>Sinistra</option><option>Entrambi i lati</option></select></div>
    </div>
    <label>Con la mano</label><select id="gDominantHand" required><option value="">Seleziona</option><option>Destra</option><option>Sinistra</option></select>
    <button class="primary" style="width:100%;margin-top:12px">Salva i dati e continua</button>
  </form>`;
}

function wireGuestIdentity(){
  if($("guestLookupBtn")){
    $("guestLookupBtn").onclick=async()=>{
      const v=$("guestLookup").value.trim();
      if(!v)return alert("Inserisci telefono oppure email.");
      try{
        const p=await findExistingGuest(v);
        if(!p)return alert("Non ho trovato questa anagrafica. Compila il modulo della prima prenotazione.");
        await loadDirectLessons(currentDirectLessonIds());
      }catch(e){alert(e.message||"Impossibile verificare l'anagrafica.")}
    };
  }
  if($("guestProfileForm")){
    $("guestProfileForm").onsubmit=async e=>{
      e.preventDefault();
      try{
        await createGuestPlayer({
          firstName:$("gFirstName").value,
          lastName:$("gLastName").value,
          sex:$("gSex").value,
          birthDate:$("gBirthDate").value,
          birthPlace:$("gBirthPlace").value,
          residenceCity:$("gResidenceCity").value,
          phone:$("gPhone").value,
          email:$("gEmail").value,
          level:$("gLevel").value,
          playSide:$("gPlaySide").value,
          dominantHand:$("gDominantHand").value
        });
        await loadDirectLessons(currentDirectLessonIds());
      }catch(e){alert(e.message||"Impossibile salvare l'anagrafica.")}
    };
  }
}
function currentDirectLessonIds(){
  const qs=new URLSearchParams(location.search);
  return (qs.get("lessons")||qs.get("lesson")||"").split(",").filter(Boolean);
}

function showAuth(msg=""){
  $("authView").classList.remove("hidden");
  $("appView").classList.add("hidden");
  $("bottomNav").classList.add("hidden");
  $("authMsg").textContent=msg;
}
function showApp(){
  $("authView").classList.add("hidden");
  $("appView").classList.remove("hidden");
  $("bottomNav").classList.remove("hidden");
}
function friendly(e){
  if(e.code?.includes("invalid-credential"))return"email o password non corrette.";
  if(e.code?.includes("email-already-in-use"))return"questa email Ã¨ giÃ  registrata.";
  return e.message||"Errore.";
}

$("loginTab").onclick=()=>{
  $("loginForm").classList.remove("hidden");
  $("registerForm").classList.add("hidden");
  $("loginTab").classList.add("active");
  $("registerTab").classList.remove("active");
};
$("registerTab").onclick=()=>{
  $("registerForm").classList.remove("hidden");
  $("loginForm").classList.add("hidden");
  $("registerTab").classList.add("active");
  $("loginTab").classList.remove("active");
};
$("loginForm").onsubmit=async e=>{
  e.preventDefault();
  try{await signInWithEmailAndPassword(auth,$("loginEmail").value.trim(),$("loginPassword").value)}
  catch(x){$("authMsg").textContent=friendly(x)}
};
$("registerForm").onsubmit=async e=>{
  e.preventDefault();
  try{
    const c=await createUserWithEmailAndPassword(auth,$("regEmail").value.trim(),$("regPassword").value);
    await setDoc(doc(db,"profiles",c.user.uid),{
      role:"client",
      firstName:$("regFirstName").value.trim(),
      lastName:$("regLastName").value.trim(),
      birthDate:$("regBirthDate").value,
      birthPlace:$("regBirthPlace").value.trim(),
      residenceCity:$("regResidence").value.trim(),
      cap:$("regCap").value.trim(),
      province:$("regProvince").value.trim().toUpperCase(),
      phone:$("regPhone").value.trim(),
      email:$("regEmail").value.trim().toLowerCase(),
      photoUrl:"",
      level:$("regLevel").value,
      levelStatus:"self_declared",
      levelCertifiedBy:null,
      followedClubs:["eden","happy"],
      createdAt:serverTimestamp()
    });
  }catch(x){$("authMsg").textContent=friendly(x)}
};
$("resetPasswordBtn").onclick=async()=>{
  const e=$("loginEmail").value.trim();
  if(!e)return $("authMsg").textContent="Inserisci prima la tua email.";
  try{
    await sendPasswordResetEmail(auth,e);
    $("authMsg").textContent="Email per reimpostare la password inviata.";
  }catch(x){$("authMsg").textContent=friendly(x)}
};
$("logoutBtn").onclick=()=>signOut(auth);
$("bottomNav").onclick=e=>{
  const b=e.target.closest("[data-nav]");
  if(b){S.view=b.dataset.nav;render()}
};

onAuthStateChanged(auth,async u=>{
  if(!u){
    S={user:null,profile:null,role:null,club:null,view:"home",preview:null,lessonFilterClub:"all",lessonFilterType:"all",adminLessons:[],playerId:null,playerSource:null,guestPlayer:null,lessonEditId:null,lessonEditMode:null};

    // I link diretti alle lezioni non mostrano login: apriamo una sessione anonima Firebase in background.
    if(hasDirectLessonLink()){
      try{
        await signInAnonymously(auth);
        return;
      }catch(e){
        return showAuth("Impossibile aprire la prenotazione in questo momento. Riprova tra poco.");
      }
    }
    showAuth();
    return;
  }

  S.user=u;
  S.preview=null;

  if(u.isAnonymous){
    S.profile={role:"guest",firstName:"",lastName:"",email:""};
    S.role="guest";
    S.view=hasDirectLessonLink()?"lessonDirect":"home";
    await loadGuestIdentity();
    showApp();
    $("bottomNav").classList.add("hidden");
    render();
    return;
  }

  const p=await getDoc(doc(db,"profiles",u.uid));
  if(!p.exists()){
    await signOut(auth);
    return showAuth("Account autenticato, ma il profilo non Ã¨ ancora configurato.");
  }
  S.profile=p.data();
  S.role=S.profile.role||"client";
  S.view=hasDirectLessonLink()?"lessonDirect":"home";
  showApp();
  render();
});

function render(){
  const r=S.preview||S.role;
  $("roleBadge").textContent=r==="admin"?"Admin":r==="instructor"?"Istruttore":"Cliente";
  $("userName").textContent=name();
  previewBar();
  if(r==="admin")admin();
  else if(r==="instructor")instructor();
  else client();
}

function previewBar(){
  const e=$("adminPreviewBar");
  if(S.role!=="admin"){e.classList.add("hidden");return}
  e.classList.remove("hidden");
  const a=S.preview||"admin";
  e.innerHTML=`
    <button class="btn ${a==="admin"?"primary":""}" data-p="admin">Gestionale Admin</button>
    <button class="btn ${a==="client"?"primary":""}" data-p="client">Anteprima Cliente</button>
    <button class="btn ${a==="instructor"?"primary":""}" data-p="instructor">Anteprima Istruttore</button>`;
  e.onclick=x=>{
    const b=x.target.closest("[data-p]");
    if(b){S.preview=b.dataset.p;S.view="home";S.club=null;render()}
  };
}

function clubList(){
  return `<div class="card">
    <div class="top">
      <div><b>Club che segui</b><div class="muted tiny">Apri un club per entrare nel suo ambiente.</div></div>
      <img src="assets/aics.jpeg" style="width:88px;background:white;border-radius:8px;padding:4px">
    </div>
    ${Object.values(CLUBS).map(c=>`<div class="clubrow">
      <img src="${c.logo}">
      <div><b>${c.name}</b><div class="muted tiny">AICS â¢ LunâVen ${c.weekday} â¢ Weekend ${c.weekend}</div></div>
      <button class="btn" data-club="${c.id}">Apri</button>
    </div>`).join("")}
    <label>Cerca altri club</label><input placeholder="Cerca per nome o cittÃ ">
  </div>`;
}
function head(c){
  return `<div class="card top">
    <div style="display:flex;gap:10px;align-items:center">
      <img class="clubLogo" src="${c.logo}">
      <div><b>${c.name}</b><div class="muted tiny">Club aperto</div></div>
    </div>
    <button class="btn" id="changeClub">Cambia club</button>
  </div>`;
}

function client(){
  const qs=new URLSearchParams(location.search);
  const lessonIds=(qs.get("lessons")||qs.get("lesson")||"").split(",").filter(Boolean);

  if(S.view==="lessonDirect"&&lessonIds.length){
    $("main").innerHTML=`
      <div class="sectionHead"><h2>Lezioni disponibili</h2><button class="btn" id="lessonBack">â Home</button></div>
      <div id="lessonDirectCard" class="list"><div class="card muted">Caricamentoâ¦</div></div>`;
    $("lessonBack").onclick=()=>{history.replaceState({},'',location.pathname);S.view="home";render()};
    loadDirectLessons(lessonIds);
    return;
  }

  if(!S.club){
    $("main").innerHTML=clubList();
    document.querySelectorAll("[data-club]").forEach(b=>b.onclick=()=>{S.club=b.dataset.club;S.view="home";render()});
    return;
  }

  const c=CLUBS[S.club];
  let h="";
  if(S.view==="home")h=home(c);
  else if(S.view==="play")h=play(c);
  else if(S.view==="lessons")h=lessonsClient(c);
  else if(S.view==="events")h=section("Tornei ed eventi","eventList");
  else if(S.view==="packages")h=section("Pacchetti e promozioni","packageList",`<div class="card notice"><b>ValiditÃ  per club</b><div class="muted tiny">Qui compaiono solo pacchetti, residui e scadenze validi per ${c.name}.</div></div>`);
  else if(S.view==="membership")h=section("Tesseramento","membershipList");
  else if(S.view==="profile")h=profile();
  else h=section("Le mie attivitÃ ","activityList");

  $("main").innerHTML=head(c)+h;
  $("changeClub").onclick=()=>{S.club=null;S.view="home";render()};
  document.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{S.view=b.dataset.v;render()});
  hydrate(c);
}

function home(c){
  return `<h2>Cosa vuoi fare?</h2><div class="grid">
    ${c.freePlay?`<button class="tile" data-v="play"><div class="ico">ð¾</div><strong>Gioca</strong><span>Prenota, organizza o trova una partita</span></button>`:""}
    <button class="tile" data-v="lessons"><div class="ico">ð</div><strong>Lezioni e corsi</strong><span>DisponibilitÃ  di Francesco Lignola</span></button>
    <button class="tile" data-v="events"><div class="ico">ð</div><strong>Tornei ed eventi</strong><span>Iscriviti alle attivitÃ  pubblicate</span></button>
    <button class="tile" data-v="packages"><div class="ico">ð·ï¸</div><strong>Pacchetti e promozioni</strong><span>Info, acquisto, residui e scadenze</span></button>
    <button class="tile" data-v="membership"><div class="ico">ðªª</div><strong>Tesseramento</strong><span>Dati AICS e stato tessera</span></button>
    <button class="tile" data-v="profile"><div class="ico">ð¤</div><strong>Profilo</strong><span>Anagrafica e livello</span></button>
  </div>
  <h2>Succede al club</h2><div id="clubFeed" class="list"><div class="card muted">Caricamentoâ¦</div></div>`;
}
function play(c){
  if(!c.freePlay)return`<div class="card">Le partite libere non sono gestite da ${c.name}.</div>`;
  return `<div class="sectionHead"><h2>Gioca</h2><button class="btn" data-v="home">â Home</button></div>
  <div class="grid">
    <div class="tile"><div class="ico">ð</div><strong>Prenota campo</strong><span>60 min = 9 â¬ a testa â¢ 90 min = 12 â¬ a testa. Dalle 18:30 solo 90 minuti.</span></div>
    <div class="tile"><div class="ico">ð£</div><strong>Organizza</strong><span>Non blocca il campo finchÃ© non siete in 4.</span></div>
    <div class="tile"><div class="ico">ð¥</div><strong>Partite aperte</strong><span>Cerca giocatori compatibili.</span></div>
    <div class="tile"><div class="ico">ð</div><strong>Le mie partite</strong><span>Prossime e storico.</span></div>
  </div>`;
}
function section(t,id,before=""){
  return `<div class="sectionHead"><h2>${t}</h2><button class="btn" data-v="home">â Home</button></div>${before}<div id="${id}" class="list"><div class="card muted">Caricamentoâ¦</div></div>`;
}
function profile(){
  const p=S.profile;
  return `<div class="sectionHead"><h2>Profilo</h2><button class="btn" data-v="home">â Home</button></div>
  <div class="card"><b>${esc(name())}</b><div class="muted">${esc(p.email)}</div>
  <div style="margin-top:10px"><b>Livello</b><div>${esc(p.level||"Non indicato")}</div>
  <div class="muted tiny">${p.levelStatus==="certified"?"Certificato da "+esc(p.levelCertifiedBy||"istruttore"):"Auto dichiarato"}</div></div></div>`;
}

function lessonsClient(c){
  return `<div class="sectionHead"><h2>Lezioni e corsi</h2><button class="btn" data-v="home">â Home</button></div>
    <div class="card ok">
      <b>${INSTRUCTOR.name}</b>
      <div class="muted">${INSTRUCTOR.title}</div>
      <div class="tiny muted" style="margin-top:6px">Classi tecniche: massimo 4 partecipanti â¢ 15 â¬ a persona fino al 31/10/2026, poi 17 â¬.</div>
    </div>
    <div id="lessonList" class="list"><div class="card muted">Caricamento disponibilitÃ â¦</div></div>`;
}

async function cards(club,types=null){
  const s=await getDocs(query(collection(db,"activities"),where("clubId","==",club)));
  const a=s.docs.map(d=>({id:d.id,...d.data()}))
    .filter(x=>(x.status||"approved")==="approved")
    .filter(x=>!types||types.includes(x.type));
  return a.length?a.map(x=>`<div class="card"><div><b>${esc(x.title||x.type)}</b><div class="muted">${esc(x.type)} â¢ ${esc(x.date||"")} ${esc(x.time||"")} â¢ ${esc(x.court||"")}</div></div><button class="btn">Dettagli</button></div>`).join(""):`<div class="card muted">Nessuna attivitÃ  pubblicata al momento.</div>`;
}

function basicLessonInfo(x){
  const booked=Number(x.booked||0),cap=Number(x.capacity||1),left=Math.max(0,cap-booked);
  const state=left===0?"Completa":booked>0?"In organizzazione":"Disponibile";
  const price=x.activityType==="Classe tecnica"||x.type==="Lezione di gruppo"
    ? `${x.pricePerPerson??15} â¬ / persona`
    : `${x.pricePerPerson??35} â¬ oppure pacchetto X1`;
  return {booked,cap,left,state,price};
}

function lessonStartMs(x){
  if(!x?.date || !x?.time)return NaN;
  return new Date(`${x.date}T${x.time}:00`).getTime();
}

function selfCancelAllowed(x){
  const start=lessonStartMs(x);
  return Number.isFinite(start) && (start-Date.now()) >= 48*60*60*1000;
}

function lessonCard(x,clientMode=true,selectable=false,myBooking=null){
  const {booked,cap,left,state,price}=basicLessonInfo(x);
  const club=CLUBS[x.clubId]?.name||x.clubId;
  const alreadyBooked=!!myBooking;
  const cancelOk=alreadyBooked && selfCancelAllowed(x);
  return `<div class="card ${left===0?"bad":booked>0?"notice":"ok"}">
    ${selectable?`<input type="checkbox" class="lesson-select" data-lesson-id="${x.id}" style="width:22px;min-width:22px;height:22px">`:""}
    <div style="flex:1">
      <b>${esc(x.title)}</b>
      <div class="muted">${esc(club)} â¢ ${esc(x.date)} â¢ ${esc(x.time)}â${esc(x.endTime||"")}</div>
      <div class="tiny">${esc(x.instructorName||INSTRUCTOR.name)} â¢ ${esc(x.instructorTitle||INSTRUCTOR.title)}</div>
      <div class="tiny muted" style="margin-top:5px">${esc(state)} â¢ ${booked}/${cap} iscritti â¢ ${left===0?"Nessun posto libero":`Mancano ${left} ${left===1?"persona":"persone"} per chiuderla`} â¢ ${price}</div>
      ${alreadyBooked?`<div class="tiny" style="margin-top:7px"><b>Sei iscritto.</b> ${cancelOk?"Puoi cancellarti fino a 48 ore prima della lezione.":"La cancellazione autonoma non Ã¨ piÃ¹ disponibile perchÃ© mancano meno di 48 ore."}</div>`:""}
    </div>
    ${clientMode
      ? alreadyBooked
        ? `<button class="${cancelOk?"danger":"btn"}" data-cancel-own="${x.id}" data-booking-id="${myBooking.id}" ${cancelOk?"":"disabled"}>${cancelOk?"Cancella iscrizione":"Iscritto"}</button>`
        : `<button class="primary" data-book-lesson="${x.id}" ${left===0?"disabled":""}>${left===0?"Completa":"Prenota"}</button>`
      : `<button class="btn" data-share-lesson="${x.id}">Condividi</button>`}
  </div>`;
}

async function loadMyBookings(){
  const s=await getDocs(query(collection(db,"activity_bookings"),where("userId","==",S.user.uid)));
  const map={};
  s.docs.forEach(d=>{
    const b={id:d.id,...d.data()};
    if(b.status==="confirmed")map[b.activityId]=b;
  });
  return map;
}

async function loadLessonsClient(c){
  const [s,myBookings]=await Promise.all([
    getDocs(query(collection(db,"activities"),where("clubId","==",c.id))),
    loadMyBookings()
  ]);
  const list=s.docs.map(d=>({id:d.id,...d.data()}))
    .filter(x=>x.module==="courses_lessons_v1" && (x.status||"approved")==="approved")
    .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  $("lessonList").innerHTML=list.length?list.map(x=>lessonCard(x,true,false,myBookings[x.id]||null)).join(""):`<div class="card muted">Nessuna disponibilitÃ  pubblicata per questo centro.</div>`;
  document.querySelectorAll("[data-book-lesson]").forEach(b=>b.onclick=()=>bookLessons([b.dataset.bookLesson]));
  document.querySelectorAll("[data-cancel-own]").forEach(b=>b.onclick=()=>cancelOwnBooking(b.dataset.cancelOwn,b.dataset.bookingId));
}

async function hydrate(c){
  try{
    if($("clubFeed"))$("clubFeed").innerHTML=await cards(c.id);
    if($("lessonList"))await loadLessonsClient(c);
    if($("eventList"))$("eventList").innerHTML=await cards(c.id,["Clinic","Torneo","Campionato","Evento"]);
    if($("activityList"))$("activityList").innerHTML=await cards(c.id);
    if($("membershipList"))$("membershipList").innerHTML=`<div class="card"><b>AICS</b><div class="muted">Stato tesseramento e documenti collegati al profilo personale.</div></div>`;
    if($("packageList")){
      const s=await getDocs(query(collection(db,"packages"),where("clubId","==",c.id)));
      $("packageList").innerHTML=s.empty?`<div class="card muted">Nessun pacchetto configurato per questo club.</div>`:s.docs.map(d=>{
        const p=d.data();
        return`<div class="card"><div><b>${esc(p.name)}</b><div class="muted">${esc(p.description||"")}</div></div><b>${esc(p.price||"")}</b></div>`;
      }).join("");
    }
  }catch(e){console.error(e)}
}

async function loadDirectLessons(ids){
  try{
    if(S.user?.isAnonymous)await loadGuestIdentity();

    const items=[];
    for(const id of ids){
      const snap=await getDoc(doc(db,"activities",id));
      if(snap.exists())items.push({id:snap.id,...snap.data()});
    }
    if(!items.length){
      $("lessonDirectCard").innerHTML=`<div class="card muted">Le disponibilitÃ  condivise non sono piÃ¹ disponibili.</div>`;
      return;
    }

    const guestMode=!!S.user?.isAnonymous;
    let myBookings={};

    if(guestMode && S.guestPlayer){
      const bs=await getDocs(query(collection(db,"activity_bookings"),where("playerId","==",S.guestPlayer.id)));
      bs.docs.forEach(d=>{
        const b={id:d.id,...d.data()};
        if(b.status==="confirmed")myBookings[b.activityId]=b;
      });
    }else if(!guestMode){
      myBookings=await loadMyBookings();
    }

    $("lessonDirectCard").innerHTML=`
      ${guestMode?guestIdentityPanel():""}
      <div class="card ok"><b>Scegli una o piÃ¹ lezioni</b><div class="muted tiny">Seleziona ciÃ² che ti interessa e conferma. Nessun account o password richiesti.</div></div>
      ${items.map(x=>{
        const {booked,cap,left,price}=basicLessonInfo(x);
        const myBooking=myBookings[x.id]||null;
        const cancelOk=myBooking && selfCancelAllowed(x);
        return `<div class="card ${left===0?"bad":booked>0?"notice":"ok"}" style="display:flex;gap:12px;align-items:center">
          ${myBooking
            ? `<div style="width:22px;min-width:22px">â</div>`
            : `<input type="checkbox" class="direct-lesson-select" value="${x.id}" ${left===0||(!S.guestPlayer&&guestMode)?"disabled":""} style="width:22px;min-width:22px;height:22px">`}
          <div style="flex:1">
            <b>${esc(x.title)}</b>
            <div class="muted">${capFirst(italianDate(x.date))} â¢ ${esc(x.time)}â${esc(x.endTime||"")} â¢ ${esc(CLUBS[x.clubId]?.name||x.clubId)}</div>
            <div class="tiny muted">${booked}/${cap} iscritti â¢ ${seatsText(left)} â¢ ${price}</div>
            ${myBooking?`<div class="tiny"><b>Sei giÃ  iscritto.</b> ${cancelOk?"Puoi cancellarti entro il limite delle 48 ore.":"Mancano meno di 48 ore: per cancellarti devi contattare il maestro."}</div>`:""}
          </div>
          ${myBooking?`<button class="${cancelOk?"danger":"btn"}" data-cancel-own="${x.id}" data-booking-id="${myBooking.id}" ${cancelOk?"":"disabled"}>${cancelOk?"Cancella":"Iscritto"}</button>`:""}
        </div>`;
      }).join("")}
      <button id="bookSelectedLessons" class="primary" style="width:100%;margin-top:10px" ${guestMode&&!S.guestPlayer?"disabled":""}>Prenota le lezioni selezionate</button>`;

    if(guestMode)wireGuestIdentity();

    $("bookSelectedLessons").onclick=()=>{
      const selected=[...document.querySelectorAll(".direct-lesson-select:checked")].map(x=>x.value);
      if(!selected.length)return alert("Seleziona almeno una lezione.");
      bookLessons(selected);
    };
    document.querySelectorAll("[data-cancel-own]").forEach(b=>b.onclick=()=>cancelOwnBooking(b.dataset.cancelOwn,b.dataset.bookingId));
  }catch(e){
    console.error(e);
    $("lessonDirectCard").innerHTML=`<div class="card bad">Impossibile caricare le lezioni condivise.</div>`;
  }
}

async function bookLessons(activityIds){
  try{
    const guestMode=!!S.user?.isAnonymous;
    if(guestMode && !S.guestPlayer)throw new Error("Completa prima la tua anagrafica.");

    const bookingOwnerId=guestMode?S.guestPlayer.id:S.user.uid;
    const bookingUserName=guestMode
      ? [S.guestPlayer.firstName,S.guestPlayer.lastName].filter(Boolean).join(" ")
      : name();
    const bookingEmail=guestMode?S.guestPlayer.email:(S.user.email||S.profile.email||"");
    const bookingLevel=guestMode?S.guestPlayer.level:(S.profile.level||null);

    await runTransaction(db,async tx=>{
      const activityRefs=activityIds.map(id=>doc(db,"activities",id));
      const bookingRefs=activityIds.map(id=>doc(db,"activity_bookings",`${id}_${bookingOwnerId}`));

      const activitySnaps=[];
      const bookingSnaps=[];
      for(const ref of activityRefs)activitySnaps.push(await tx.get(ref));
      for(const ref of bookingRefs)bookingSnaps.push(await tx.get(ref));

      activitySnaps.forEach((snap,i)=>{
        if(!snap.exists())throw new Error("Una delle lezioni non Ã¨ piÃ¹ disponibile.");
        if(bookingSnaps[i].exists())throw new Error("Sei giÃ  iscritto a una delle lezioni selezionate.");
        const a=snap.data();
        const booked=Number(a.booked||0),capacity=Number(a.capacity||1);
        if(booked>=capacity)throw new Error(`La lezione "${a.title}" Ã¨ giÃ  completa.`);
      });

      activitySnaps.forEach((snap,i)=>{
        const a=snap.data();
        const booked=Number(a.booked||0),capacity=Number(a.capacity||1);
        const start=new Date(`${a.date}T${a.time}:00`);
        tx.set(bookingRefs[i],{
          activityId:activityIds[i],
          userId:S.user.uid,
          playerId:guestMode?S.guestPlayer.id:null,
          playerSource:guestMode?"guest":"profile",
          userEmail:bookingEmail,
          userName:bookingUserName,
          playerLevel:bookingLevel,
          playSide:guestMode?(S.guestPlayer.playSide||null):null,
          dominantHand:guestMode?(S.guestPlayer.dominantHand||null):null,
          clubId:a.clubId,
          status:"confirmed",
          lessonStart:Timestamp.fromDate(start),
          cancellationDeadline:Timestamp.fromDate(new Date(start.getTime()-48*60*60*1000)),
          createdAt:serverTimestamp()
        });
        tx.update(activityRefs[i],{
          booked:booked+1,
          bookingState:(booked+1)>=capacity?"full":"organizing",
          updatedAt:serverTimestamp()
        });
      });
    });

    alert(activityIds.length>1?`${activityIds.length} lezioni prenotate correttamente.`:"Prenotazione confermata.");
    if(hasDirectLessonLink())await loadDirectLessons(currentDirectLessonIds());
    else render();
  }catch(e){
    alert(e.message||"Impossibile completare la prenotazione.");
  }
}

async function cancelOwnBooking(activityId,bookingId){
  const activitySnap=await getDoc(doc(db,"activities",activityId));
  if(!activitySnap.exists())return alert("Lezione non trovata.");
  const activity={id:activitySnap.id,...activitySnap.data()};
  if(!selfCancelAllowed(activity)){
    return alert("Puoi cancellarti autonomamente solo fino a 48 ore prima della lezione. Contatta il maestro per eventuali modifiche.");
  }
  if(!confirm(`Confermi la cancellazione da "${activity.title}"?`))return;
  await removeBooking(activityId,bookingId,S.user?.isAnonymous?(S.guestPlayer?.id||S.user.uid):S.user.uid,"self");
}

async function removeBooking(activityId,bookingId,userId,mode="staff"){
  try{
    await runTransaction(db,async tx=>{
      const activityRef=doc(db,"activities",activityId);
      const bookingRef=doc(db,"activity_bookings",bookingId);
      const [activitySnap,bookingSnap]=await Promise.all([tx.get(activityRef),tx.get(bookingRef)]);
      if(!activitySnap.exists())throw new Error("Lezione non trovata.");
      if(!bookingSnap.exists())throw new Error("Iscrizione non trovata.");

      const a=activitySnap.data();
      const b=bookingSnap.data();

      if(mode==="self"){
        if(S.user?.isAnonymous){
          if(!S.guestPlayer || b.playerId!==S.guestPlayer.id)throw new Error("Non puoi cancellare l'iscrizione di un altro giocatore.");
        }else if(b.userId!==S.user.uid){
          throw new Error("Non puoi cancellare l'iscrizione di un altro giocatore.");
        }
        const start=new Date(`${a.date}T${a.time}:00`).getTime();
        if(!Number.isFinite(start) || start-Date.now()<48*60*60*1000){
          throw new Error("Il termine di 48 ore Ã¨ scaduto. Contatta il maestro.");
        }
      }else{
        const role=S.preview||S.role;
        if(role!=="admin" && role!=="instructor")throw new Error("Operazione non autorizzata.");
      }

      const current=Math.max(0,Number(a.booked||0));
      const next=Math.max(0,current-1);
      tx.delete(bookingRef);
      tx.update(activityRef,{
        booked:next,
        bookingState:next>=Number(a.capacity||1)?"full":next>0?"organizing":"available",
        updatedAt:serverTimestamp()
      });
    });

    alert(mode==="self"?"Iscrizione cancellata.":"Giocatore rimosso dalla lezione.");
    if(hasDirectLessonLink())await loadDirectLessons(currentDirectLessonIds());
    else render();
  }catch(e){
    alert(e.message||"Impossibile cancellare l'iscrizione.");
  }
}

function instructor(){
  if(S.view==="instructorLessons"){instructorLessons();return}
  const clubs=S.profile.clubIds?.length?S.profile.clubIds:["eden","happy"];
  S.club=S.club&&clubs.includes(S.club)?S.club:clubs[0];
  const c=CLUBS[S.club];
  $("main").innerHTML=`<div class="card">
    <div class="top"><div><b>Area Istruttore</b><div class="muted tiny">${esc(name())}</div></div><span class="rolebadge">ISTRUTTORE</span></div>
    <label>Club</label><select id="insClub">${clubs.map(id=>`<option value="${id}" ${id===S.club?"selected":""}>${CLUBS[id].name}</option>`).join("")}</select>
  </div>
  <div class="card ok"><div><b>Le mie lezioni</b><div class="muted tiny">Visualizza iscritti e posti mancanti.</div></div><button id="openInstructorLessons" class="primary">Apri</button></div>
  <h2>Crea attivitÃ </h2>
  <form id="insForm" class="card">
    <div class="row"><div><label>Tipo</label><select id="insType"><option>Partita libera</option><option>Lezione X1</option><option>Lezione X2</option><option>Lezione di gruppo</option><option>Corso</option><option>Clinic</option><option>Torneo</option><option>Campionato</option><option>Evento</option><option>Blocco campo</option></select></div><div><label>Campo</label><select id="insCourt">${c.courts.map(x=>`<option>${x}</option>`).join("")}</select></div></div>
    <div class="row"><div><label>Data</label><input id="insDate" type="date" required></div><div><label>Ora</label><input id="insTime" type="time" value="18:30" required></div></div>
    <div class="row"><div><label>Durata</label><select id="insDuration"><option value="60">60 min</option><option value="90" selected>90 min</option></select></div><div><label>Posti max</label><input id="insCapacity" type="number" min="1" value="4"></div></div>
    <label>Titolo</label><input id="insTitle" required><label>Nota per l'Admin</label><input id="insNote">
    <button class="primary" style="width:100%;margin-top:12px">Invia per approvazione</button>
  </form>
  <h2>Le mie richieste</h2><div id="insRequests" class="list"></div>`;

  $("insClub").onchange=e=>{S.club=e.target.value;instructor()};
  $("openInstructorLessons").onclick=()=>{S.view="instructorLessons";instructor()};
  $("insForm").onsubmit=sendRequest;
  loadRequests();
}

async function instructorLessons(){
  $("main").innerHTML=`<div class="sectionHead"><h2>Le mie lezioni</h2><button id="instructorLessonsBack" class="btn">â Area istruttore</button></div>
  <div id="instructorLessonList" class="list"><div class="card muted">Caricamentoâ¦</div></div>`;
  $("instructorLessonsBack").onclick=()=>{S.view="home";instructor()};
  const s=await getDocs(query(collection(db,"activities"),where("module","==","courses_lessons_v1")));
  const bookings=await getDocs(collection(db,"activity_bookings"));
  const grouped=groupBookings(bookings.docs.map(d=>({id:d.id,...d.data()})));
  const list=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  $("instructorLessonList").innerHTML=list.length?list.map(x=>lessonStaffCard(x,grouped[x.id]||[],false)).join(""):`<div class="card muted">Nessuna lezione.</div>`;
  document.querySelectorAll("[data-remove-booking]").forEach(b=>b.onclick=()=>{
    if(confirm("Vuoi rimuovere questo giocatore dalla lezione?")){
      removeBooking(b.dataset.removeActivity,b.dataset.removeBooking,b.dataset.removeUser,"staff");
    }
  });
}

async function sendRequest(e){
  e.preventDefault();
  const t=$("insTime").value,d=+$("insDuration").value;
  if(t>="18:30"&&$("insType").value==="Partita libera"&&d===60)return alert("Dalle 18:30 le partite libere possono essere solo da 90 minuti.");
  await addDoc(collection(db,"activity_requests"),{
    instructorId:S.user.uid,instructorName:name(),clubId:$("insClub").value,type:$("insType").value,
    court:$("insCourt").value,date:$("insDate").value,time:t,duration:d,capacity:+$("insCapacity").value,
    title:$("insTitle").value.trim(),note:$("insNote").value.trim(),status:"pending",createdAt:serverTimestamp()
  });
  alert("Richiesta inviata all'Admin. Non Ã¨ ancora visibile ai clienti.");
  e.target.reset();loadRequests();
}
async function loadRequests(){
  const s=await getDocs(query(collection(db,"activity_requests"),where("instructorId","==",S.user.uid)));
  $("insRequests").innerHTML=s.empty?`<div class="card muted">Nessuna richiesta.</div>`:s.docs.map(d=>{
    const r=d.data();
    return`<div class="card ${r.status==="pending"?"notice":r.status==="approved"?"ok":"bad"}"><div><b>${esc(r.title)}</b><div class="muted">${esc(r.type)} â¢ ${esc(CLUBS[r.clubId]?.name||r.clubId)}</div><div class="tiny">Stato: ${r.status==="pending"?"IN ATTESA":r.status==="approved"?"APPROVATA":"RIFIUTATA"}</div></div></div>`;
  }).join("");
}

function admin(){
  if(S.view==="lessonsAdmin"){adminLessons();return}
  if(S.view==="lessonEdit"){adminLessonEditor();return}
  if(S.view==="playerDetail"){adminPlayerDetail();return}

  S.club=S.club||"eden";
  const c=CLUBS[S.club];
  $("main").innerHTML=`<div class="card">
    <div class="top"><div><b>Centro di controllo</b><div class="muted tiny">Solo Admin puÃ² vedere tutte le anteprime.</div></div><span class="rolebadge">ADMIN</span></div>
    <label>Club</label><select id="adminClub">${Object.values(CLUBS).map(x=>`<option value="${x.id}" ${x.id===S.club?"selected":""}>${x.name}</option>`).join("")}</select>
  </div>
  <div class="kpis"><div class="card"><div class="muted tiny">Richieste istruttori</div><div id="pending" class="kpi">â</div></div><div class="card"><div class="muted tiny">AttivitÃ  pubblicate</div><div id="published" class="kpi">â</div></div></div>
  <h2>Corsi e lezioni</h2>
  <div class="card ok"><div><b>${INSTRUCTOR.name}</b><div class="muted">${INSTRUCTOR.title}</div><div class="tiny muted">Programmazione 14â26 settembre 2026 â¢ EDEN + Happy Time</div></div><button id="openLessonsAdmin" class="primary">Apri calendario</button></div>
  <h2>Richieste istruttori</h2><div id="queue" class="list"></div>
  <h2>Configurazione club</h2><div class="card"><b>${c.name}</b><div class="muted">Campi: ${c.courts.join(", ")}</div><div class="muted">LunâVen ${c.weekday} â¢ Weekend ${c.weekend}</div><div class="muted">Partite libere: ${c.freePlay?"attive":"non gestite"}</div></div>`;

  $("adminClub").onchange=e=>{S.club=e.target.value;admin()};
  $("openLessonsAdmin").onclick=()=>{S.view="lessonsAdmin";admin()};
  loadQueue();
}

function groupBookings(list){
  const g={};
  for(const b of list){
    if(b.status!=="confirmed")continue;
    (g[b.activityId]??=[]).push(b);
  }
  return g;
}

function lessonStaffCard(x,bookings,isAdminView=true){
  const {booked,cap,left,state,price}=basicLessonInfo(x);
  return `<div class="card ${left===0?"bad":booked>0?"notice":"ok"}" style="display:block">
    <div style="display:flex;gap:10px;align-items:flex-start">
      ${isAdminView?`<input type="checkbox" class="lesson-select" data-lesson-id="${x.id}" style="width:22px;min-width:22px;height:22px;margin-top:4px">`:""}
      <div style="flex:1">
        <b>${esc(x.title)}</b>
        <div class="muted">${esc(CLUBS[x.clubId]?.name||x.clubId)} â¢ ${esc(x.date)} â¢ ${esc(x.time)}â${esc(x.endTime||"")}</div>
        <div class="tiny muted">${state} â¢ ${booked}/${cap} iscritti â¢ ${left===0?"CHIUSA":`Mancano ${left} ${left===1?"persona":"persone"} per chiuderla`} â¢ ${price}</div>
      </div>
      ${isAdminView?`<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
        <button class="btn" data-edit-lesson="${x.id}">Modifica</button>
        <button class="btn" data-duplicate-lesson="${x.id}">Duplica</button>
        <button class="btn" data-share-lesson="${x.id}">Condividi</button>
        <button class="danger" data-delete-lesson="${x.id}">Elimina</button>
      </div>`:""}
    </div>
    <div style="margin-top:10px;border-top:1px solid #173950;padding-top:8px">
      <div class="tiny muted" style="margin-bottom:6px">Giocatori iscritti</div>
      ${bookings.length
        ? `<div style="display:flex;flex-direction:column;gap:7px">${bookings.map(b=>`<div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap"><button class="btn" ${isAdminView?`data-player-id="${b.playerId||b.userId}" data-player-source="${b.playerSource||"profile"}"`:""} style="padding:7px 9px">${esc(b.userName||b.userEmail||"Giocatore")}${b.playerLevel?` Â· ${esc(b.playerLevel)}`:""}</button><button class="danger" data-remove-booking="${b.id}" data-remove-activity="${x.id}" data-remove-user="${b.playerId||b.userId}" style="padding:7px 9px">Rimuovi</button></div>`).join("")}</div>`
        : `<div class="tiny muted">Nessun giocatore iscritto.</div>`}
    </div>
  </div>`;
}

async function adminLessons(){
  $("main").innerHTML=`<div class="sectionHead"><h2>Corsi e lezioni</h2><button id="lessonsAdminBack" class="btn">â Gestionale</button></div>
  <div class="card ok"><b>${INSTRUCTOR.name}</b><div class="muted">${INSTRUCTOR.title}</div><div class="tiny muted">Prima apertura controllata â¢ 14â26 settembre 2026</div></div>
  <div class="card">
    <div class="row">
      <div><label>Centro</label><select id="lessonFilterClub"><option value="all">Tutti</option><option value="eden">EDEN</option><option value="happy">Happy Time</option></select></div>
      <div><label>Tipo</label><select id="lessonFilterType"><option value="all">Tutti</option><option value="Classe tecnica">Classi tecniche</option><option value="Lezione X1">X1</option></select></div>
    </div>
    <div class="actions"><button id="seedLessonsBtn" class="primary">Carica programmazione 14â26/9</button><button id="refreshLessonsBtn" class="btn">Aggiorna</button></div>
    <div class="actions"><button id="selectAllLessonsBtn" class="btn">Seleziona tutte</button><button id="clearLessonsBtn" class="btn">Deseleziona</button></div>
    <div class="actions" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
      <button id="shareSelectedWhatsAppBtn" class="primary" style="flex:1;min-width:180px">ð² WhatsApp</button>
      <button id="shareSelectedWhatsAppBusinessBtn" class="primary" style="flex:1;min-width:180px">ð¼ WhatsApp Business</button>
      <button id="copySelectedMessageBtn" class="btn" style="flex:1;min-width:180px">ð Copia messaggio</button>
    </div>
    <div class="tiny muted" style="margin-top:8px">Ogni slot puÃ² essere modificato o duplicato. Una duplicazione crea sempre una nuova lezione con un nuovo ID e un nuovo link PRENOTA. Il messaggio include un link PRENOTA sotto ogni lezione e il link finale per prenotarne piÃ¹ di una.</div>
  </div>
  <div id="adminLessonList" class="list"><div class="card muted">Caricamentoâ¦</div></div>`;

  $("lessonsAdminBack").onclick=()=>{S.view="home";admin()};
  $("lessonFilterClub").value=S.lessonFilterClub;
  $("lessonFilterType").value=S.lessonFilterType;
  $("lessonFilterClub").onchange=e=>{S.lessonFilterClub=e.target.value;loadAdminLessons()};
  $("lessonFilterType").onchange=e=>{S.lessonFilterType=e.target.value;loadAdminLessons()};
  $("seedLessonsBtn").onclick=seedLessons;
  $("refreshLessonsBtn").onclick=loadAdminLessons;
  $("selectAllLessonsBtn").onclick=()=>document.querySelectorAll(".lesson-select").forEach(x=>x.checked=true);
  $("clearLessonsBtn").onclick=()=>document.querySelectorAll(".lesson-select").forEach(x=>x.checked=false);
  $("shareSelectedWhatsAppBtn").onclick=()=>shareSelectedLessons("whatsapp");
  $("shareSelectedWhatsAppBusinessBtn").onclick=()=>shareSelectedLessons("business");
  $("copySelectedMessageBtn").onclick=()=>shareSelectedLessons("copy");
  loadAdminLessons();
}

async function seedLessons(){
  if(!confirm("Carico le 18 disponibilitÃ  reali del 14â26 settembre? Non verranno duplicate se sono giÃ  presenti."))return;
  const existing=await getDocs(query(collection(db,"activities"),where("module","==","courses_lessons_v1")));
  const keys=new Set(existing.docs.map(d=>d.data().seedKey).filter(Boolean));
  let added=0;
  for(const row of LESSON_SEED){
    const [date,start,end,clubId,activityType,title,capacity,price]=row;
    const seedKey=`${date}_${start}_${clubId}_${title}`;
    if(keys.has(seedKey))continue;
    await addDoc(collection(db,"activities"),{
      module:"courses_lessons_v1",
      seedKey,
      clubId,
      activityType,
      type:activityType==="Classe tecnica"?"Lezione di gruppo":"Lezione X1",
      title,
      instructorId:INSTRUCTOR.id,
      instructorName:INSTRUCTOR.name,
      instructorTitle:INSTRUCTOR.title,
      date,time:start,endTime:end,duration:60,capacity,booked:0,
      pricePerPerson:price,
      pricingRule:activityType==="Classe tecnica"?"15 â¬ fino al 31/10/2026; 17 â¬ dal 01/11/2026":"35 â¬ singola o pacchetto X1",
      status:"approved",
      bookingState:"available",
      visibility:"public",
      source:"admin_francesco",
      createdBy:S.user.uid,
      createdAt:serverTimestamp()
    });
    added++;
  }
  alert(added?`${added} disponibilitÃ  caricate.`:"Programmazione giÃ  presente: nessun duplicato creato.");
  loadAdminLessons();
}

async function loadAdminLessons(){
  const s=await getDocs(query(collection(db,"activities"),where("module","==","courses_lessons_v1")));
  const bs=await getDocs(collection(db,"activity_bookings"));
  const bookingList=bs.docs.map(d=>({id:d.id,...d.data()}));

  let list=s.docs.map(d=>({id:d.id,...d.data()}));

  // Migrazione automatica delle vecchie iscrizioni: aggiunge la scadenza 48h
  // alle prenotazioni create prima della v3, cosÃ¬ anche quelle possono essere
  // cancellate correttamente dal giocatore quando il limite temporale lo consente.
  const activitiesById=Object.fromEntries(list.map(x=>[x.id,x]));
  for(const b of bookingList){
    if(b.cancellationDeadline || !b.activityId)continue;
    const a=activitiesById[b.activityId];
    if(!a?.date || !a?.time)continue;
    const start=new Date(`${a.date}T${a.time}:00`);
    if(Number.isNaN(start.getTime()))continue;
    try{
      await updateDoc(doc(db,"activity_bookings",b.id),{
        lessonStart:Timestamp.fromDate(start),
        cancellationDeadline:Timestamp.fromDate(new Date(start.getTime()-48*60*60*1000))
      });
      b.lessonStart=Timestamp.fromDate(start);
      b.cancellationDeadline=Timestamp.fromDate(new Date(start.getTime()-48*60*60*1000));
    }catch(e){
      console.warn("Migrazione scadenza iscrizione non riuscita",b.id,e);
    }
  }

  const grouped=groupBookings(bookingList);
  if(S.lessonFilterClub!=="all")list=list.filter(x=>x.clubId===S.lessonFilterClub);
  if(S.lessonFilterType!=="all")list=list.filter(x=>x.activityType===S.lessonFilterType);
  list.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  S.adminLessons=list;

  $("adminLessonList").innerHTML=list.length
    ? list.map(x=>lessonStaffCard(x,grouped[x.id]||[],true)).join("")
    : `<div class="card muted">Nessuna disponibilitÃ  caricata. Premi âCarica programmazione 14â26/9â.</div>`;

  document.querySelectorAll("[data-edit-lesson]").forEach(b=>b.onclick=()=>openLessonEditor(b.dataset.editLesson,"edit"));
  document.querySelectorAll("[data-duplicate-lesson]").forEach(b=>b.onclick=()=>duplicateLesson(b.dataset.duplicateLesson));
  document.querySelectorAll("[data-delete-lesson]").forEach(b=>b.onclick=()=>deleteLessonSlot(b.dataset.deleteLesson));
  document.querySelectorAll("[data-share-lesson]").forEach(b=>b.onclick=()=>shareLesson(b.dataset.shareLesson));
  document.querySelectorAll("[data-player-id]").forEach(b=>b.onclick=()=>openPlayer(b.dataset.playerId,b.dataset.playerSource||"profile"));
  document.querySelectorAll("[data-remove-booking]").forEach(b=>b.onclick=()=>{
    if(confirm("Vuoi rimuovere questo giocatore dalla lezione?")){
      removeBooking(b.dataset.removeActivity,b.dataset.removeBooking,b.dataset.removeUser,"staff");
    }
  });
}


function openLessonEditor(id,mode="edit"){
  S.lessonEditId=id;
  S.lessonEditMode=mode;
  S.view="lessonEdit";
  admin();
}

async function adminLessonEditor(){
  const id=S.lessonEditId;
  const snap=id?await getDoc(doc(db,"activities",id)):null;
  if(!snap?.exists()){
    S.view="lessonsAdmin";
    return adminLessons();
  }
  const x={id:snap.id,...snap.data()};

  $("main").innerHTML=`<div class="sectionHead"><h2>${S.lessonEditMode==="duplicate"?"Duplica lezione":"Modifica lezione"}</h2><button id="lessonEditorBack" class="btn">â Corsi e lezioni</button></div>
  <form id="lessonEditorForm" class="card">
    <div class="tiny muted" style="margin-bottom:10px">
      ${S.lessonEditMode==="duplicate"
        ? "Stai creando una nuova lezione indipendente. Al salvataggio avrÃ  un nuovo ID e un nuovo link PRENOTA."
        : `ID lezione: ${esc(x.id)} Â· Il link PRENOTA resta invariato.`}
    </div>

    <div class="row">
      <div><label>Centro</label><select id="editClub"><option value="eden">Eden Padel Club</option><option value="happy">Happy Time</option></select></div>
      <div><label>Tipo</label><select id="editType"><option value="Classe tecnica">Classe tecnica</option><option value="Lezione X1">Lezione individuale X1</option></select></div>
    </div>

    <label>Titolo</label><input id="editTitle" required>

    <div class="row">
      <div><label>Data</label><input id="editDate" type="date" required></div>
      <div><label>Ora inizio</label><input id="editTime" type="time" required></div>
    </div>

    <div class="row">
      <div><label>Ora fine</label><input id="editEndTime" type="time" required></div>
      <div><label>Durata (minuti)</label><input id="editDuration" type="number" min="15" step="15" required></div>
    </div>

    <div class="row">
      <div><label>Posti massimi</label><input id="editCapacity" type="number" min="1" required></div>
      <div><label>Prezzo a persona (â¬)</label><input id="editPrice" type="number" min="0" step="0.01" required></div>
    </div>

    <label>Istruttore</label><input id="editInstructorName" required>
    <label>Qualifica istruttore</label><input id="editInstructorTitle" required>

    <div class="actions" style="margin-top:12px">
      <button type="submit" class="primary">${S.lessonEditMode==="duplicate"?"Crea nuova lezione":"Salva modifiche"}</button>
      <button type="button" id="lessonEditorCancel" class="btn">Annulla</button>
    </div>
  </form>`;

  $("editClub").value=x.clubId||"eden";
  $("editType").value=x.activityType||"Classe tecnica";
  $("editTitle").value=x.title||"";
  $("editDate").value=x.date||"";
  $("editTime").value=x.time||"";
  $("editEndTime").value=x.endTime||"";
  $("editDuration").value=Number(x.duration||60);
  $("editCapacity").value=Number(x.capacity||1);
  $("editPrice").value=Number(x.pricePerPerson||0);
  $("editInstructorName").value=x.instructorName||INSTRUCTOR.name;
  $("editInstructorTitle").value=x.instructorTitle||INSTRUCTOR.title;

  $("lessonEditorBack").onclick=$("lessonEditorCancel").onclick=()=>{
    S.lessonEditId=null;
    S.lessonEditMode=null;
    S.view="lessonsAdmin";
    admin();
  };

  $("lessonEditorForm").onsubmit=async e=>{
    e.preventDefault();

    const payload={
      clubId:$("editClub").value,
      activityType:$("editType").value,
      type:$("editType").value==="Classe tecnica"?"Lezione di gruppo":"Lezione X1",
      title:$("editTitle").value.trim(),
      date:$("editDate").value,
      time:$("editTime").value,
      endTime:$("editEndTime").value,
      duration:Number($("editDuration").value||60),
      capacity:Number($("editCapacity").value||1),
      pricePerPerson:Number($("editPrice").value||0),
      instructorId:x.instructorId||INSTRUCTOR.id,
      instructorName:$("editInstructorName").value.trim(),
      instructorTitle:$("editInstructorTitle").value.trim(),
      pricingRule:$("editType").value==="Classe tecnica"
        ? "15 â¬ fino al 31/10/2026; 17 â¬ dal 01/11/2026"
        : "35 â¬ singola o pacchetto X1",
      status:x.status||"approved",
      visibility:x.visibility||"public",
      module:"courses_lessons_v1",
      updatedAt:serverTimestamp()
    };

    if(S.lessonEditMode==="duplicate"){
      const ref=await addDoc(collection(db,"activities"),{
        ...payload,
        booked:0,
        bookingState:"available",
        seedKey:null,
        source:"duplicated_by_admin",
        duplicatedFrom:x.id,
        createdBy:S.user.uid,
        createdAt:serverTimestamp()
      });
      alert("Nuova lezione creata. Ha un nuovo ID e quindi un nuovo link PRENOTA.");
      S.lessonEditId=ref.id;
      S.lessonEditMode="edit";
      S.view="lessonsAdmin";
      admin();
      return;
    }

    if(Number(payload.capacity)<Number(x.booked||0)){
      return alert(`Non puoi impostare ${payload.capacity} posti: ci sono giÃ  ${Number(x.booked||0)} iscritti.`);
    }

    await updateDoc(doc(db,"activities",x.id),payload);
    alert("Lezione aggiornata. Il suo link PRENOTA Ã¨ rimasto invariato.");
    S.lessonEditId=null;
    S.lessonEditMode=null;
    S.view="lessonsAdmin";
    admin();
  };
}

async function duplicateLesson(id){
  const snap=await getDoc(doc(db,"activities",id));
  if(!snap.exists())return alert("Lezione non trovata.");
  S.lessonEditId=id;
  S.lessonEditMode="duplicate";
  S.view="lessonEdit";
  admin();
}

async function deleteLessonSlot(id){
  const x=S.adminLessons.find(a=>a.id===id);
  if(!x)return alert("Lezione non trovata.");

  const bs=await getDocs(query(collection(db,"activity_bookings"),where("activityId","==",id)));
  const confirmed=bs.docs.filter(d=>d.data().status==="confirmed");

  if(confirmed.length){
    const first=confirm(`Questa lezione ha ${confirmed.length} ${confirmed.length===1?"giocatore iscritto":"giocatori iscritti"}. Eliminando lo slot verranno eliminate anche le relative iscrizioni. Vuoi continuare?`);
    if(!first)return;
    const second=confirm("Conferma definitiva: eliminare lezione e iscrizioni? Questa operazione non puÃ² essere annullata.");
    if(!second)return;
  }else{
    if(!confirm(`Eliminare definitivamente "${x.title}" del ${x.date} alle ${x.time}?`))return;
  }

  for(const d of bs.docs){
    await deleteDoc(doc(db,"activity_bookings",d.id));
  }
  await deleteDoc(doc(db,"activities",id));
  alert("Lezione eliminata.");
  loadAdminLessons();
}

function selectedLessonIds(){
  return [...document.querySelectorAll(".lesson-select:checked")].map(x=>x.dataset.lessonId);
}

function buildSelectedLessonsMessage(){
  const ids=selectedLessonIds();
  if(!ids.length)throw new Error("Seleziona almeno una lezione.");

  const selected=S.adminLessons.filter(x=>ids.includes(x.id));
  const blocks=selected.map(x=>{
    const info=basicLessonInfo(x);
    const directLink=`${location.origin}${location.pathname}?lesson=${encodeURIComponent(x.id)}`;
    return `ð *${capFirst(italianDate(x.date))} Â· ${x.time}â${x.endTime}*
ð ${CLUBS[x.clubId]?.name||x.clubId}
${x.activityType==="Classe tecnica"?"ð¯":"ð¤"} *${x.title}*
ð¥ ${seatsText(info.left)}
ð PRENOTA: ${directLink}`;
  }).join("\n\n");

  const multiLink=`${location.origin}${location.pathname}?lessons=${encodeURIComponent(ids.join(","))}`;

  return `ð¾ *DISPONIBILITÃ LEZIONI PADEL*
*Francesco Lignola â Istruttore Nazionale AICS*

Scegli la lezione che ti interessa e premi direttamente PRENOTA ð

${blocks}

Vuoi prenotare piÃ¹ lezioni insieme?
ð ${multiLink}

â¹ï¸ Nessun account o password: alla prima prenotazione inserisci i tuoi dati una sola volta. Puoi cancellarti autonomamente fino a 48 ore prima della lezione.`;
}

async function copyShareMessage(message){
  try{
    await navigator.clipboard.writeText(message);
    alert("Messaggio copiato. Ora puoi incollarlo in WhatsApp Business o dove preferisci.");
  }catch(e){
    const ta=document.createElement("textarea");
    ta.value=message;
    ta.style.position="fixed";
    ta.style.opacity="0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    alert("Messaggio copiato. Ora puoi incollarlo in WhatsApp Business o dove preferisci.");
  }
}

async function shareSelectedLessons(target="whatsapp"){
  let message;
  try{
    message=buildSelectedLessonsMessage();
  }catch(e){
    return alert(e.message||"Seleziona almeno una lezione.");
  }

  if(target==="copy"){
    await copyShareMessage(message);
    return;
  }

  if(target==="business"){
    // Deep link dedicato all'app WhatsApp Business.
    // Su alcuni dispositivi/browser il sistema puÃ² comunque proporre l'app disponibile.
    const businessUrl=`whatsapp-business://send?text=${encodeURIComponent(message)}`;
    window.location.href=businessUrl;

    // Copia anche il testo come fallback pratico, senza interrompere l'apertura dell'app.
    try{await navigator.clipboard.writeText(message)}catch(e){}
    return;
  }

  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`,"_blank");
}

async function shareLesson(id){
  const x=S.adminLessons.find(a=>a.id===id);
  const link=`${location.origin}${location.pathname}?lesson=${encodeURIComponent(id)}`;
  const info=x?basicLessonInfo(x):null;
  const message=x
    ? `ð¾ *LEZIONE PADEL*

ð *${capFirst(italianDate(x.date))} Â· ${x.time}â${x.endTime}*
ð ${CLUBS[x.clubId]?.name||x.clubId}
${x.activityType==="Classe tecnica"?"ð¯":"ð¤"} *${x.title}*
ð¥ ${seatsText(info.left)}

ð PRENOTA: ${link}

Francesco Lignola â Istruttore Nazionale AICS
Nessun account o password richiesti.`
    : `Prenota la lezione:\n${link}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`,"_blank");
}

function openPlayer(userId,source="profile"){
  S.playerId=userId;
  S.playerSource=source;
  S.view="playerDetail";
  admin();
}

async function adminPlayerDetail(){
  $("main").innerHTML=`<div class="sectionHead"><h2>Anagrafica giocatore</h2><button id="playerBack" class="btn">â Corsi e lezioni</button></div>
  <div id="playerDetailBody" class="list"><div class="card muted">Caricamentoâ¦</div></div>`;
  $("playerBack").onclick=()=>{S.view="lessonsAdmin";admin()};

  try{
    const playerCollection=S.playerSource==="guest"?"guest_players":"profiles";
    const profileSnap=await getDoc(doc(db,playerCollection,S.playerId));
    const p=profileSnap.exists()?profileSnap.data():{};
    const packSnap=await getDocs(query(collection(db,"user_packages"),where("userId","==",S.playerId)));
    const paySnap=await getDocs(query(collection(db,"payments"),where("userId","==",S.playerId)));

    const packages=packSnap.docs.map(d=>({id:d.id,...d.data()}));
    const payments=paySnap.docs.map(d=>({id:d.id,...d.data()}));

    $("playerDetailBody").innerHTML=`
      <div class="card">
        <div><b>${esc([p.firstName,p.lastName].filter(Boolean).join(" ")||"Giocatore")}</b>
        <div class="muted">${esc(p.email||"")}</div></div>
        <div class="tiny" style="margin-top:10px">
          ${p.phone?`Telefono: ${esc(p.phone)}<br>`:""}
          ${p.birthDate?`Data di nascita: ${esc(p.birthDate)}<br>`:""}
          ${p.birthPlace?`Luogo di nascita: ${esc(p.birthPlace)}<br>`:""}
          ${p.residenceCity?`Residenza: ${esc(p.residenceCity)} ${esc(p.cap||"")} ${esc(p.province||"")}<br>`:""}
          Livello: ${esc(p.level||"Non indicato")}<br>
          ${p.sex?`Sesso: ${esc(p.sex)}<br>`:""}
          ${p.playSide?`Gioco a: ${esc(p.playSide)}<br>`:""}
          ${p.dominantHand?`Con la mano: ${esc(p.dominantHand)}<br>`:""}
        </div>
      </div>
      <div class="card">
        <b>Pacchetti / abbonamenti</b>
        ${packages.length?packages.map(x=>`<div style="margin-top:8px"><b>${esc(x.name||x.type||"Pacchetto")}</b><div class="muted tiny">Residuo: ${esc(x.remaining??x.residual??"â")} â¢ Stato: ${esc(x.status||"attivo")} ${x.expiresAt?`â¢ Scadenza: ${esc(x.expiresAt)}`:""}</div></div>`).join(""):`<div class="muted tiny" style="margin-top:8px">Nessun pacchetto registrato nel nuovo archivio.</div>`}
      </div>
      <div class="card">
        <b>Pagamenti</b>
        ${payments.length?payments.map(x=>`<div style="margin-top:8px"><b>${esc(x.description||"Pagamento")}</b><div class="muted tiny">${esc(x.amount??"")} ${esc(x.currency||"EUR")} â¢ ${esc(x.status||"")} ${x.date?`â¢ ${esc(x.date)}`:""}</div></div>`).join(""):`<div class="muted tiny" style="margin-top:8px">Nessun movimento di pagamento registrato nel nuovo archivio.</div>`}
      </div>`;
  }catch(e){
    $("playerDetailBody").innerHTML=`<div class="card bad">Impossibile aprire l'anagrafica: ${esc(e.message||"errore")}</div>`;
  }
}

async function loadQueue(){
  const rs=await getDocs(query(collection(db,"activity_requests"),where("clubId","==",S.club)));
  const as=await getDocs(query(collection(db,"activities"),where("clubId","==",S.club)));
  const r=rs.docs.map(d=>({id:d.id,...d.data()}));
  $("pending").textContent=r.filter(x=>x.status==="pending").length;
  $("published").textContent=as.size;
  $("queue").innerHTML=r.length?r.map(x=>`<div class="card ${x.status==="pending"?"notice":x.status==="approved"?"ok":"bad"}"><div><b>${esc(x.title)}</b><div class="muted">${esc(x.instructorName)} â¢ ${esc(x.type)} â¢ ${esc(x.date||"")} ${esc(x.time||"")}</div></div>${x.status==="pending"?`<div class="actions"><button class="primary" data-a="${x.id}">Approva</button><button class="danger" data-r="${x.id}">Rifiuta</button></div>`:`<span class="rolebadge">${x.status.toUpperCase()}</span>`}</div>`).join(""):`<div class="card muted">Nessuna richiesta.</div>`;
  document.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>approve(b.dataset.a,r.find(x=>x.id===b.dataset.a)));
  document.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>reject(b.dataset.r));
}

async function approve(id,r){
  await updateDoc(doc(db,"activity_requests",id),{status:"approved",approvedBy:S.user.uid,approvedAt:serverTimestamp()});
  await addDoc(collection(db,"activities"),{
    clubId:r.clubId,type:r.type,court:r.court,date:r.date,time:r.time,duration:r.duration,capacity:r.capacity,
    title:r.title,status:"approved",source:"instructor",instructorId:r.instructorId,instructorName:r.instructorName,createdAt:serverTimestamp()
  });
  loadQueue();
}

async function reject(id){
  const reason=prompt("Motivo del rifiuto (facoltativo):","Da modificare");
  await updateDoc(doc(db,"activity_requests",id),{status:"rejected",rejectionReason:reason||"",reviewedBy:S.user.uid,reviewedAt:serverTimestamp()});
  loadQueue();
}
