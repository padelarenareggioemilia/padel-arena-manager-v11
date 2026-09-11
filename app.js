import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,
  signOut,sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  getFirestore,doc,getDoc,setDoc,addDoc,updateDoc,collection,getDocs,query,where,
  serverTimestamp,runTransaction
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
  eden:{id:"eden",name:"Eden Padel Club",logo:"assets/eden.jpeg",courts:["Campo Blu","Campo Verde"],freePlay:true,weekday:"06:30–23:00",weekend:"08:30–19:30"},
  happy:{id:"happy",name:"Happy Time",logo:"assets/happy.jpeg",courts:["Campo 1","Campo 2"],freePlay:false,weekday:"06:30–23:00",weekend:"08:30–19:30"}
};

const INSTRUCTOR={
  id:"francesco-lignola",
  name:"Francesco Lignola",
  title:"Istruttore Nazionale AICS"
};

const LESSON_SEED=[
  ["2026-09-14","16:00","17:00","eden","Classe tecnica","Volée e posizione a rete",4,15],
  ["2026-09-15","16:30","17:30","eden","Lezione X1","Lezione individuale X1",1,35],
  ["2026-09-16","16:00","17:00","eden","Classe tecnica","Difesa e uscita dal vetro",4,15],
  ["2026-09-17","14:30","15:30","happy","Lezione X1","Lezione individuale X1",1,35],
  ["2026-09-17","17:30","18:30","happy","Classe tecnica","Bandeja: tecnica e controllo",4,15],
  ["2026-09-17","18:30","19:30","happy","Classe tecnica","Transizione fondo/rete",4,15],
  ["2026-09-18","17:30","18:30","eden","Classe tecnica","Servizio, risposta e primo colpo",4,15],
  ["2026-09-19","09:30","10:30","eden","Lezione X1","X1 – spazio libero tra le due lezioni",1,35],
  ["2026-09-19","11:30","12:30","eden","Classe tecnica","Lob e conquista della rete",4,15],
  ["2026-09-21","16:00","17:00","eden","Classe tecnica","Bandeja e recupero della posizione",4,15],
  ["2026-09-22","16:30","17:30","eden","Lezione X1","Lezione individuale X1",1,35],
  ["2026-09-23","16:00","17:00","eden","Classe tecnica","Difendere con i vetri",4,15],
  ["2026-09-24","14:30","15:30","happy","Lezione X1","Lezione individuale X1",1,35],
  ["2026-09-24","17:30","18:30","happy","Classe tecnica","Volée: controllo e direzione",4,15],
  ["2026-09-24","18:30","19:30","happy","Classe tecnica","Costruzione del punto",4,15],
  ["2026-09-25","17:30","18:30","eden","Classe tecnica","Pallonetto e transizione a rete",4,15],
  ["2026-09-26","09:30","10:30","eden","Lezione X1","X1 – spazio libero tra le due lezioni",1,35],
  ["2026-09-26","11:30","12:30","eden","Classe tecnica","Bandeja e gioco aereo",4,15]
];

let S={
  user:null,profile:null,role:null,club:null,view:"home",preview:null,
  lessonFilterClub:"all",lessonFilterType:"all",adminLessons:[],playerId:null
};

const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const name=()=>[S.profile?.firstName,S.profile?.lastName].filter(Boolean).join(" ")||S.user?.email||"";

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
  if(e.code?.includes("email-already-in-use"))return"questa email è già registrata.";
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
    S={user:null,profile:null,role:null,club:null,view:"home",preview:null,lessonFilterClub:"all",lessonFilterType:"all",adminLessons:[],playerId:null};
    showAuth();
    return;
  }
  S.user=u;
  const p=await getDoc(doc(db,"profiles",u.uid));
  if(!p.exists()){
    await signOut(auth);
    return showAuth("Account autenticato, ma il profilo non è ancora configurato.");
  }
  S.profile=p.data();
  S.role=S.profile.role||"client";
  S.preview=null;
  const qs=new URLSearchParams(location.search);
  S.view=(qs.get("lessons")||qs.get("lesson"))?"lessonDirect":"home";
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
      <div><b>${c.name}</b><div class="muted tiny">AICS • Lun–Ven ${c.weekday} • Weekend ${c.weekend}</div></div>
      <button class="btn" data-club="${c.id}">Apri</button>
    </div>`).join("")}
    <label>Cerca altri club</label><input placeholder="Cerca per nome o città">
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
      <div class="sectionHead"><h2>Lezioni disponibili</h2><button class="btn" id="lessonBack">← Home</button></div>
      <div id="lessonDirectCard" class="list"><div class="card muted">Caricamento…</div></div>`;
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
  else if(S.view==="packages")h=section("Pacchetti e promozioni","packageList",`<div class="card notice"><b>Validità per club</b><div class="muted tiny">Qui compaiono solo pacchetti, residui e scadenze validi per ${c.name}.</div></div>`);
  else if(S.view==="membership")h=section("Tesseramento","membershipList");
  else if(S.view==="profile")h=profile();
  else h=section("Le mie attività","activityList");

  $("main").innerHTML=head(c)+h;
  $("changeClub").onclick=()=>{S.club=null;S.view="home";render()};
  document.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{S.view=b.dataset.v;render()});
  hydrate(c);
}

function home(c){
  return `<h2>Cosa vuoi fare?</h2><div class="grid">
    ${c.freePlay?`<button class="tile" data-v="play"><div class="ico">🎾</div><strong>Gioca</strong><span>Prenota, organizza o trova una partita</span></button>`:""}
    <button class="tile" data-v="lessons"><div class="ico">🎓</div><strong>Lezioni e corsi</strong><span>Disponibilità di Francesco Lignola</span></button>
    <button class="tile" data-v="events"><div class="ico">🏆</div><strong>Tornei ed eventi</strong><span>Iscriviti alle attività pubblicate</span></button>
    <button class="tile" data-v="packages"><div class="ico">🏷️</div><strong>Pacchetti e promozioni</strong><span>Info, acquisto, residui e scadenze</span></button>
    <button class="tile" data-v="membership"><div class="ico">🪪</div><strong>Tesseramento</strong><span>Dati AICS e stato tessera</span></button>
    <button class="tile" data-v="profile"><div class="ico">👤</div><strong>Profilo</strong><span>Anagrafica e livello</span></button>
  </div>
  <h2>Succede al club</h2><div id="clubFeed" class="list"><div class="card muted">Caricamento…</div></div>`;
}
function play(c){
  if(!c.freePlay)return`<div class="card">Le partite libere non sono gestite da ${c.name}.</div>`;
  return `<div class="sectionHead"><h2>Gioca</h2><button class="btn" data-v="home">← Home</button></div>
  <div class="grid">
    <div class="tile"><div class="ico">📅</div><strong>Prenota campo</strong><span>60 min = 9 € a testa • 90 min = 12 € a testa. Dalle 18:30 solo 90 minuti.</span></div>
    <div class="tile"><div class="ico">📣</div><strong>Organizza</strong><span>Non blocca il campo finché non siete in 4.</span></div>
    <div class="tile"><div class="ico">👥</div><strong>Partite aperte</strong><span>Cerca giocatori compatibili.</span></div>
    <div class="tile"><div class="ico">🕘</div><strong>Le mie partite</strong><span>Prossime e storico.</span></div>
  </div>`;
}
function section(t,id,before=""){
  return `<div class="sectionHead"><h2>${t}</h2><button class="btn" data-v="home">← Home</button></div>${before}<div id="${id}" class="list"><div class="card muted">Caricamento…</div></div>`;
}
function profile(){
  const p=S.profile;
  return `<div class="sectionHead"><h2>Profilo</h2><button class="btn" data-v="home">← Home</button></div>
  <div class="card"><b>${esc(name())}</b><div class="muted">${esc(p.email)}</div>
  <div style="margin-top:10px"><b>Livello</b><div>${esc(p.level||"Non indicato")}</div>
  <div class="muted tiny">${p.levelStatus==="certified"?"Certificato da "+esc(p.levelCertifiedBy||"istruttore"):"Auto dichiarato"}</div></div></div>`;
}

function lessonsClient(c){
  return `<div class="sectionHead"><h2>Lezioni e corsi</h2><button class="btn" data-v="home">← Home</button></div>
    <div class="card ok">
      <b>${INSTRUCTOR.name}</b>
      <div class="muted">${INSTRUCTOR.title}</div>
      <div class="tiny muted" style="margin-top:6px">Classi tecniche: massimo 4 partecipanti • 15 € a persona fino al 31/10/2026, poi 17 €.</div>
    </div>
    <div id="lessonList" class="list"><div class="card muted">Caricamento disponibilità…</div></div>`;
}

async function cards(club,types=null){
  const s=await getDocs(query(collection(db,"activities"),where("clubId","==",club)));
  const a=s.docs.map(d=>({id:d.id,...d.data()}))
    .filter(x=>(x.status||"approved")==="approved")
    .filter(x=>!types||types.includes(x.type));
  return a.length?a.map(x=>`<div class="card"><div><b>${esc(x.title||x.type)}</b><div class="muted">${esc(x.type)} • ${esc(x.date||"")} ${esc(x.time||"")} • ${esc(x.court||"")}</div></div><button class="btn">Dettagli</button></div>`).join(""):`<div class="card muted">Nessuna attività pubblicata al momento.</div>`;
}

function basicLessonInfo(x){
  const booked=Number(x.booked||0),cap=Number(x.capacity||1),left=Math.max(0,cap-booked);
  const state=left===0?"Completa":booked>0?"In organizzazione":"Disponibile";
  const price=x.activityType==="Classe tecnica"||x.type==="Lezione di gruppo"
    ? `${x.pricePerPerson??15} € / persona`
    : `${x.pricePerPerson??35} € oppure pacchetto X1`;
  return {booked,cap,left,state,price};
}

function lessonCard(x,clientMode=true,selectable=false){
  const {booked,cap,left,state,price}=basicLessonInfo(x);
  const club=CLUBS[x.clubId]?.name||x.clubId;
  return `<div class="card ${left===0?"bad":booked>0?"notice":"ok"}">
    ${selectable?`<input type="checkbox" class="lesson-select" data-lesson-id="${x.id}" style="width:22px;min-width:22px;height:22px">`:""}
    <div style="flex:1">
      <b>${esc(x.title)}</b>
      <div class="muted">${esc(club)} • ${esc(x.date)} • ${esc(x.time)}–${esc(x.endTime||"")}</div>
      <div class="tiny">${esc(x.instructorName||INSTRUCTOR.name)} • ${esc(x.instructorTitle||INSTRUCTOR.title)}</div>
      <div class="tiny muted" style="margin-top:5px">${esc(state)} • ${booked}/${cap} iscritti • ${left===0?"Nessun posto libero":`Mancano ${left} ${left===1?"persona":"persone"} per chiuderla`} • ${price}</div>
    </div>
    ${clientMode?`<button class="primary" data-book-lesson="${x.id}" ${left===0?"disabled":""}>${left===0?"Completa":"Prenota"}</button>`:`<button class="btn" data-share-lesson="${x.id}">Condividi</button>`}
  </div>`;
}

async function loadLessonsClient(c){
  const s=await getDocs(query(collection(db,"activities"),where("clubId","==",c.id)));
  const list=s.docs.map(d=>({id:d.id,...d.data()}))
    .filter(x=>x.module==="courses_lessons_v1" && (x.status||"approved")==="approved")
    .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  $("lessonList").innerHTML=list.length?list.map(x=>lessonCard(x,true,false)).join(""):`<div class="card muted">Nessuna disponibilità pubblicata per questo centro.</div>`;
  document.querySelectorAll("[data-book-lesson]").forEach(b=>b.onclick=()=>bookLessons([b.dataset.bookLesson]));
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
    const items=[];
    for(const id of ids){
      const snap=await getDoc(doc(db,"activities",id));
      if(snap.exists())items.push({id:snap.id,...snap.data()});
    }
    if(!items.length){
      $("lessonDirectCard").innerHTML=`<div class="card muted">Le disponibilità condivise non sono più disponibili.</div>`;
      return;
    }
    $("lessonDirectCard").innerHTML=`
      <div class="card ok"><b>Scegli una o più lezioni</b><div class="muted tiny">Puoi selezionare più disponibilità e prenotarle insieme.</div></div>
      ${items.map(x=>{
        const {booked,cap,left,price}=basicLessonInfo(x);
        return `<label class="card ${left===0?"bad":booked>0?"notice":"ok"}" style="display:flex;gap:12px;align-items:center">
          <input type="checkbox" class="direct-lesson-select" value="${x.id}" ${left===0?"disabled":""} style="width:22px;min-width:22px;height:22px">
          <div style="flex:1"><b>${esc(x.title)}</b><div class="muted">${esc(CLUBS[x.clubId]?.name||x.clubId)} • ${esc(x.date)} • ${esc(x.time)}–${esc(x.endTime||"")}</div><div class="tiny muted">${booked}/${cap} iscritti • ${left} posti liberi • ${price}</div></div>
        </label>`;
      }).join("")}
      <button id="bookSelectedLessons" class="primary" style="width:100%;margin-top:10px">Prenota le lezioni selezionate</button>`;
    $("bookSelectedLessons").onclick=()=>{
      const selected=[...document.querySelectorAll(".direct-lesson-select:checked")].map(x=>x.value);
      if(!selected.length)return alert("Seleziona almeno una lezione.");
      bookLessons(selected);
    };
  }catch(e){
    $("lessonDirectCard").innerHTML=`<div class="card bad">Impossibile caricare le lezioni condivise.</div>`;
  }
}

async function bookLessons(activityIds){
  try{
    await runTransaction(db,async tx=>{
      const activityRefs=activityIds.map(id=>doc(db,"activities",id));
      const bookingRefs=activityIds.map(id=>doc(db,"activity_bookings",`${id}_${S.user.uid}`));

      const activitySnaps=[];
      const bookingSnaps=[];
      for(const ref of activityRefs)activitySnaps.push(await tx.get(ref));
      for(const ref of bookingRefs)bookingSnaps.push(await tx.get(ref));

      activitySnaps.forEach((snap,i)=>{
        if(!snap.exists())throw new Error("Una delle lezioni non è più disponibile.");
        if(bookingSnaps[i].exists())throw new Error("Sei già iscritto a una delle lezioni selezionate.");
        const a=snap.data();
        const booked=Number(a.booked||0),capacity=Number(a.capacity||1);
        if(booked>=capacity)throw new Error(`La lezione "${a.title}" è già completa.`);
      });

      activitySnaps.forEach((snap,i)=>{
        const a=snap.data();
        const booked=Number(a.booked||0),capacity=Number(a.capacity||1);
        tx.set(bookingRefs[i],{
          activityId:activityIds[i],
          userId:S.user.uid,
          userEmail:S.user.email||S.profile.email||"",
          userName:name(),
          playerLevel:S.profile.level||null,
          clubId:a.clubId,
          status:"confirmed",
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
    render();
  }catch(e){
    alert(e.message||"Impossibile completare la prenotazione.");
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
  <h2>Crea attività</h2>
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
  $("main").innerHTML=`<div class="sectionHead"><h2>Le mie lezioni</h2><button id="instructorLessonsBack" class="btn">← Area istruttore</button></div>
  <div id="instructorLessonList" class="list"><div class="card muted">Caricamento…</div></div>`;
  $("instructorLessonsBack").onclick=()=>{S.view="home";instructor()};
  const s=await getDocs(query(collection(db,"activities"),where("module","==","courses_lessons_v1")));
  const bookings=await getDocs(collection(db,"activity_bookings"));
  const grouped=groupBookings(bookings.docs.map(d=>({id:d.id,...d.data()})));
  const list=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  $("instructorLessonList").innerHTML=list.length?list.map(x=>lessonStaffCard(x,grouped[x.id]||[],false)).join(""):`<div class="card muted">Nessuna lezione.</div>`;
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
  alert("Richiesta inviata all'Admin. Non è ancora visibile ai clienti.");
  e.target.reset();loadRequests();
}
async function loadRequests(){
  const s=await getDocs(query(collection(db,"activity_requests"),where("instructorId","==",S.user.uid)));
  $("insRequests").innerHTML=s.empty?`<div class="card muted">Nessuna richiesta.</div>`:s.docs.map(d=>{
    const r=d.data();
    return`<div class="card ${r.status==="pending"?"notice":r.status==="approved"?"ok":"bad"}"><div><b>${esc(r.title)}</b><div class="muted">${esc(r.type)} • ${esc(CLUBS[r.clubId]?.name||r.clubId)}</div><div class="tiny">Stato: ${r.status==="pending"?"IN ATTESA":r.status==="approved"?"APPROVATA":"RIFIUTATA"}</div></div></div>`;
  }).join("");
}

function admin(){
  if(S.view==="lessonsAdmin"){adminLessons();return}
  if(S.view==="playerDetail"){adminPlayerDetail();return}

  S.club=S.club||"eden";
  const c=CLUBS[S.club];
  $("main").innerHTML=`<div class="card">
    <div class="top"><div><b>Centro di controllo</b><div class="muted tiny">Solo Admin può vedere tutte le anteprime.</div></div><span class="rolebadge">ADMIN</span></div>
    <label>Club</label><select id="adminClub">${Object.values(CLUBS).map(x=>`<option value="${x.id}" ${x.id===S.club?"selected":""}>${x.name}</option>`).join("")}</select>
  </div>
  <div class="kpis"><div class="card"><div class="muted tiny">Richieste istruttori</div><div id="pending" class="kpi">—</div></div><div class="card"><div class="muted tiny">Attività pubblicate</div><div id="published" class="kpi">—</div></div></div>
  <h2>Corsi e lezioni</h2>
  <div class="card ok"><div><b>${INSTRUCTOR.name}</b><div class="muted">${INSTRUCTOR.title}</div><div class="tiny muted">Programmazione 14–26 settembre 2026 • EDEN + Happy Time</div></div><button id="openLessonsAdmin" class="primary">Apri calendario</button></div>
  <h2>Richieste istruttori</h2><div id="queue" class="list"></div>
  <h2>Configurazione club</h2><div class="card"><b>${c.name}</b><div class="muted">Campi: ${c.courts.join(", ")}</div><div class="muted">Lun–Ven ${c.weekday} • Weekend ${c.weekend}</div><div class="muted">Partite libere: ${c.freePlay?"attive":"non gestite"}</div></div>`;

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
        <div class="muted">${esc(CLUBS[x.clubId]?.name||x.clubId)} • ${esc(x.date)} • ${esc(x.time)}–${esc(x.endTime||"")}</div>
        <div class="tiny muted">${state} • ${booked}/${cap} iscritti • ${left===0?"CHIUSA":`Mancano ${left} ${left===1?"persona":"persone"} per chiuderla`} • ${price}</div>
      </div>
      ${isAdminView?`<button class="btn" data-share-lesson="${x.id}">Condividi</button>`:""}
    </div>
    <div style="margin-top:10px;border-top:1px solid #173950;padding-top:8px">
      <div class="tiny muted" style="margin-bottom:6px">Giocatori iscritti</div>
      ${bookings.length
        ? `<div style="display:flex;flex-wrap:wrap;gap:6px">${bookings.map(b=>`<button class="btn" ${isAdminView?`data-player-id="${b.userId}"`:""} style="padding:7px 9px">${esc(b.userName||b.userEmail||"Giocatore")}${b.playerLevel?` · ${esc(b.playerLevel)}`:""}</button>`).join("")}</div>`
        : `<div class="tiny muted">Nessun giocatore iscritto.</div>`}
    </div>
  </div>`;
}

async function adminLessons(){
  $("main").innerHTML=`<div class="sectionHead"><h2>Corsi e lezioni</h2><button id="lessonsAdminBack" class="btn">← Gestionale</button></div>
  <div class="card ok"><b>${INSTRUCTOR.name}</b><div class="muted">${INSTRUCTOR.title}</div><div class="tiny muted">Prima apertura controllata • 14–26 settembre 2026</div></div>
  <div class="card">
    <div class="row">
      <div><label>Centro</label><select id="lessonFilterClub"><option value="all">Tutti</option><option value="eden">EDEN</option><option value="happy">Happy Time</option></select></div>
      <div><label>Tipo</label><select id="lessonFilterType"><option value="all">Tutti</option><option value="Classe tecnica">Classi tecniche</option><option value="Lezione X1">X1</option></select></div>
    </div>
    <div class="actions"><button id="seedLessonsBtn" class="primary">Carica programmazione 14–26/9</button><button id="refreshLessonsBtn" class="btn">Aggiorna</button></div>
    <div class="actions"><button id="selectAllLessonsBtn" class="btn">Seleziona tutte</button><button id="clearLessonsBtn" class="btn">Deseleziona</button></div>
    <button id="shareSelectedLessonsBtn" class="primary" style="width:100%;margin-top:8px">📲 Condividi lezioni selezionate su WhatsApp</button>
    <div class="tiny muted" style="margin-top:8px">Nel messaggio il giocatore apre un unico link e può scegliere una o più lezioni a cui iscriversi.</div>
  </div>
  <div id="adminLessonList" class="list"><div class="card muted">Caricamento…</div></div>`;

  $("lessonsAdminBack").onclick=()=>{S.view="home";admin()};
  $("lessonFilterClub").value=S.lessonFilterClub;
  $("lessonFilterType").value=S.lessonFilterType;
  $("lessonFilterClub").onchange=e=>{S.lessonFilterClub=e.target.value;loadAdminLessons()};
  $("lessonFilterType").onchange=e=>{S.lessonFilterType=e.target.value;loadAdminLessons()};
  $("seedLessonsBtn").onclick=seedLessons;
  $("refreshLessonsBtn").onclick=loadAdminLessons;
  $("selectAllLessonsBtn").onclick=()=>document.querySelectorAll(".lesson-select").forEach(x=>x.checked=true);
  $("clearLessonsBtn").onclick=()=>document.querySelectorAll(".lesson-select").forEach(x=>x.checked=false);
  $("shareSelectedLessonsBtn").onclick=shareSelectedLessons;
  loadAdminLessons();
}

async function seedLessons(){
  if(!confirm("Carico le 18 disponibilità reali del 14–26 settembre? Non verranno duplicate se sono già presenti."))return;
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
      pricingRule:activityType==="Classe tecnica"?"15 € fino al 31/10/2026; 17 € dal 01/11/2026":"35 € singola o pacchetto X1",
      status:"approved",
      bookingState:"available",
      visibility:"public",
      source:"admin_francesco",
      createdBy:S.user.uid,
      createdAt:serverTimestamp()
    });
    added++;
  }
  alert(added?`${added} disponibilità caricate.`:"Programmazione già presente: nessun duplicato creato.");
  loadAdminLessons();
}

async function loadAdminLessons(){
  const s=await getDocs(query(collection(db,"activities"),where("module","==","courses_lessons_v1")));
  const bs=await getDocs(collection(db,"activity_bookings"));
  const grouped=groupBookings(bs.docs.map(d=>({id:d.id,...d.data()})));

  let list=s.docs.map(d=>({id:d.id,...d.data()}));
  if(S.lessonFilterClub!=="all")list=list.filter(x=>x.clubId===S.lessonFilterClub);
  if(S.lessonFilterType!=="all")list=list.filter(x=>x.activityType===S.lessonFilterType);
  list.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  S.adminLessons=list;

  $("adminLessonList").innerHTML=list.length
    ? list.map(x=>lessonStaffCard(x,grouped[x.id]||[],true)).join("")
    : `<div class="card muted">Nessuna disponibilità caricata. Premi “Carica programmazione 14–26/9”.</div>`;

  document.querySelectorAll("[data-share-lesson]").forEach(b=>b.onclick=()=>shareLesson(b.dataset.shareLesson));
  document.querySelectorAll("[data-player-id]").forEach(b=>b.onclick=()=>openPlayer(b.dataset.playerId));
}

function selectedLessonIds(){
  return [...document.querySelectorAll(".lesson-select:checked")].map(x=>x.dataset.lessonId);
}

async function shareSelectedLessons(){
  const ids=selectedLessonIds();
  if(!ids.length)return alert("Seleziona almeno una lezione.");
  const selected=S.adminLessons.filter(x=>ids.includes(x.id));
  const link=`${location.origin}${location.pathname}?lessons=${encodeURIComponent(ids.join(","))}`;
  const lines=selected.map(x=>{
    const info=basicLessonInfo(x);
    return `• ${x.title} — ${CLUBS[x.clubId]?.name||x.clubId}, ${x.date} ${x.time}-${x.endTime} (${info.left} posti liberi)`;
  }).join("\n");
  const message=`🎾 DISPONIBILITÀ LEZIONI — FRANCESCO LIGNOLA\n\n${lines}\n\nApri il link e seleziona una o più lezioni a cui vuoi iscriverti:\n${link}`;
  const wa=`https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(wa,"_blank");
}

async function shareLesson(id){
  const x=S.adminLessons.find(a=>a.id===id);
  const link=`${location.origin}${location.pathname}?lessons=${encodeURIComponent(id)}`;
  const message=x
    ? `🎾 ${x.title}\n${CLUBS[x.clubId]?.name||x.clubId} • ${x.date} • ${x.time}-${x.endTime}\nFrancesco Lignola — Istruttore Nazionale AICS\n\nPrenota qui:\n${link}`
    : `Prenota la lezione:\n${link}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`,"_blank");
}

function openPlayer(userId){
  S.playerId=userId;
  S.view="playerDetail";
  admin();
}

async function adminPlayerDetail(){
  $("main").innerHTML=`<div class="sectionHead"><h2>Anagrafica giocatore</h2><button id="playerBack" class="btn">← Corsi e lezioni</button></div>
  <div id="playerDetailBody" class="list"><div class="card muted">Caricamento…</div></div>`;
  $("playerBack").onclick=()=>{S.view="lessonsAdmin";admin()};

  try{
    const profileSnap=await getDoc(doc(db,"profiles",S.playerId));
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
          Livello: ${esc(p.level||"Non indicato")}
        </div>
      </div>
      <div class="card">
        <b>Pacchetti / abbonamenti</b>
        ${packages.length?packages.map(x=>`<div style="margin-top:8px"><b>${esc(x.name||x.type||"Pacchetto")}</b><div class="muted tiny">Residuo: ${esc(x.remaining??x.residual??"—")} • Stato: ${esc(x.status||"attivo")} ${x.expiresAt?`• Scadenza: ${esc(x.expiresAt)}`:""}</div></div>`).join(""):`<div class="muted tiny" style="margin-top:8px">Nessun pacchetto registrato nel nuovo archivio.</div>`}
      </div>
      <div class="card">
        <b>Pagamenti</b>
        ${payments.length?payments.map(x=>`<div style="margin-top:8px"><b>${esc(x.description||"Pagamento")}</b><div class="muted tiny">${esc(x.amount??"")} ${esc(x.currency||"EUR")} • ${esc(x.status||"")} ${x.date?`• ${esc(x.date)}`:""}</div></div>`).join(""):`<div class="muted tiny" style="margin-top:8px">Nessun movimento di pagamento registrato nel nuovo archivio.</div>`}
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
  $("queue").innerHTML=r.length?r.map(x=>`<div class="card ${x.status==="pending"?"notice":x.status==="approved"?"ok":"bad"}"><div><b>${esc(x.title)}</b><div class="muted">${esc(x.instructorName)} • ${esc(x.type)} • ${esc(x.date||"")} ${esc(x.time||"")}</div></div>${x.status==="pending"?`<div class="actions"><button class="primary" data-a="${x.id}">Approva</button><button class="danger" data-r="${x.id}">Rifiuta</button></div>`:`<span class="rolebadge">${x.status.toUpperCase()}</span>`}</div>`).join(""):`<div class="card muted">Nessuna richiesta.</div>`;
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
