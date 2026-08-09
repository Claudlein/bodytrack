const KEY="bodytrack_measurements_v1";
const SETTINGS="bodytrack_settings_v1";
const fields=["weight","waist","abdomen","hips","chest","upperArmLeft","upperArmRight","thighLeft","thighRight"];
const labels={weight:"Gewicht",waist:"Taille",abdomen:"Bauch",hips:"Hüfte",chest:"Brust",upperArmLeft:"Oberarm links",upperArmRight:"Oberarm rechts",thighLeft:"Oberschenkel links",thighRight:"Oberschenkel rechts"};
let measurements=JSON.parse(localStorage.getItem(KEY)||"[]");
let settings=JSON.parse(localStorage.getItem(SETTINGS)||'{"targetWeight":null}');
let editingId=null,currentTab="dashboard";

const $=id=>document.getElementById(id);
const num=s=>{if(s==null||s==="")return null; const n=parseFloat(String(s).replace(",",".")); return Number.isFinite(n)?n:null};
const fmt=(n,d=1)=>n==null?"–":Number(n).toLocaleString("de-DE",{minimumFractionDigits:d,maximumFractionDigits:d});
const save=()=>localStorage.setItem(KEY,JSON.stringify(measurements));
const saveSettings=()=>localStorage.setItem(SETTINGS,JSON.stringify(settings));
const sorted=()=>[...measurements].sort((a,b)=>new Date(b.date)-new Date(a.date));
const latest=()=>sorted().find(x=>x.weight!=null)||sorted()[0];
const firstWeight=()=>[...measurements].filter(x=>x.weight!=null).sort((a,b)=>new Date(a.date)-new Date(b.date))[0];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const dateDE=d=>new Date(d+"T12:00:00").toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"});

function setTab(tab){
  currentTab=tab;
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  $("pageTitle").textContent={dashboard:"Übersicht",history:"Historie",charts:"Verlauf",settings:"Einstellungen"}[tab];
  render();
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.tab)));
$("quickAdd").onclick=()=>openModal();

function render(){
  const main=$("main");
  if(currentTab==="dashboard") main.innerHTML=dashboardHTML();
  if(currentTab==="history") main.innerHTML=historyHTML();
  if(currentTab==="charts") main.innerHTML=chartsHTML();
  if(currentTab==="settings") main.innerHTML=settingsHTML();
  bindDynamic();
  if(currentTab==="charts") drawChart($("chart"), $("metricSelect").value);
}
function dashboardHTML(){
  const m=latest(), first=firstWeight();
  if(!m)return `<div class="card empty"><div class="symbol">⚖️</div><h2>Noch keine Messungen</h2><p>Trage deine erste Messung ein, um deinen Verlauf zu sehen.</p><button class="primary" onclick="openModal()">Erste Messung eintragen</button></div>`;
  const change=m.weight!=null&&first?.weight!=null?m.weight-first.weight:null;
  const target=settings.targetWeight;
  const targetText=target!=null&&m.weight!=null?(m.weight-target>=0?`${fmt(m.weight-target)} kg bis zum Ziel`:`${fmt(Math.abs(m.weight-target))} kg unter dem Ziel`):"";
  return `<div class="card hero">
    <div class="muted">Aktuelles Gewicht</div>
    <div class="weight">${fmt(m.weight)} <span class="unit">kg</span></div>
    ${change!=null?`<div class="change ${change<=0?"green":"orange"}">${change<=0?"↓":"↑"} ${change>0?"+":""}${fmt(change)} kg seit Start</div>`:""}
    ${targetText?`<div class="muted" style="margin-top:10px">${targetText}</div>`:""}
  </div>
  <button class="primary full" onclick="openModal()">＋ Neue Messung</button>
  <div class="section-title">Letzte Messung</div>
  <div class="card">${measurementSummary(m)}</div>
  ${measurements.filter(x=>x.weight!=null).length>1?`<div class="section-title">Gewicht</div><div class="card chart-card"><div class="chart-wrap"><canvas class="chart" id="dashChart"></canvas></div></div>`:""}`;
}
function measurementSummary(m){
  const ids=["waist","abdomen","hips","chest","upperArmLeft","upperArmRight","thighLeft","thighRight"];
  return `<div class="sub">${dateDE(m.date)}</div><div class="metric-summary">${ids.map(k=>`<div class="metric-box"><small>${labels[k]}</small><strong>${m[k]!=null?fmt(m[k])+" cm":"–"}</strong></div>`).join("")}</div>${m.note?`<div class="note">📝 ${esc(m.note)}</div>`:""}`;
}
function historyHTML(){
  const list=sorted();
  if(!list.length)return `<div class="card empty"><div class="symbol">☷</div><h2>Noch keine Messungen</h2><p>Deine Messungen erscheinen hier.</p></div>`;
  return `<div class="card">${list.map(m=>`<div class="history-item">
    <div class="history-head"><span>${dateDE(m.date)}</span><span>${m.weight!=null?fmt(m.weight)+" kg":"–"}</span></div>
    <div class="sub">${["waist","abdomen","hips"].filter(k=>m[k]!=null).map(k=>`${labels[k]} ${fmt(m[k])} cm`).join(" · ")||"Keine Körpermaße eingetragen"}</div>
    <div class="actions"><button onclick="editMeasurement('${m.id}')">Bearbeiten</button><button onclick="deleteMeasurement('${m.id}')">Löschen</button></div>
  </div>`).join("")}</div>`;
}
function chartsHTML(){
  return `<div class="card"><select id="metricSelect" class="select">${fields.map(k=>`<option value="${k}">${labels[k]}</option>`).join("")}</select></div>
  <div class="card chart-card"><h2 id="chartTitle">${labels.weight}</h2><div class="chart-wrap"><canvas id="chart" class="chart"></canvas></div><div id="chartStats"></div></div>`;
}
function settingsHTML(){
  return `<div class="card"><h2>Zielgewicht</h2><p class="sub">Optional. Das Ziel wird nur auf diesem Gerät gespeichert.</p>
  <label style="display:block;margin-top:16px;font-weight:700">Zielgewicht (kg)<input id="targetInput" inputmode="decimal" class="select" style="margin-top:7px" value="${settings.targetWeight??""}" placeholder="z. B. 70"></label>
  <button class="primary full" id="saveTarget">Ziel speichern</button></div>
  <div class="card"><h2>Datenschutz</h2><p>Deine Daten werden ausschließlich im lokalen Speicher deines iPhones abgelegt. Es gibt keinen Account und keinen Server.</p></div>
  <div class="card"><h2>BodyTrack</h2><p class="sub">Version 1.0 · iPhone Web-App</p></div>`;
}
function bindDynamic(){
  if(currentTab==="charts")$("metricSelect").onchange=()=>{drawChart($("chart"),$("metricSelect").value);$("chartTitle").textContent=labels[$("metricSelect").value]};
  if(currentTab==="dashboard"&&$("dashChart"))drawChart($("dashChart"),"weight");
  if(currentTab==="settings")$("saveTarget").onclick=()=>{settings.targetWeight=num($("targetInput").value);saveSettings();render()};
}
function openModal(id=null){
  editingId=id;
  $("modal").classList.remove("hidden");
  $("modalTitle").textContent=id?"Messung bearbeiten":"Neue Messung";
  $("deleteFromEdit").classList.toggle("hidden",!id);
  const m=id?measurements.find(x=>x.id===id):null;
  $("date").value=m?.date||new Date().toISOString().slice(0,10);
  fields.forEach(k=>$(k).value=m?.[k]??"");
  $("note").value=m?.note||"";
}
window.openModal=openModal;
window.editMeasurement=id=>openModal(id);
$("closeModal").onclick=()=>$("modal").classList.add("hidden");
$("modal").addEventListener("click",e=>{if(e.target.id==="modal")$("modal").classList.add("hidden")});
$("measurementForm").onsubmit=e=>{
 e.preventDefault();
 const obj={id:editingId||crypto.randomUUID(),date:$("date").value,note:$("note").value.trim()};
 fields.forEach(k=>obj[k]=num($(k).value));
 if(editingId){const i=measurements.findIndex(x=>x.id===editingId);measurements[i]=obj}else measurements.push(obj);
 save();$("modal").classList.add("hidden");render();
};
$("deleteFromEdit").onclick=()=>{if(editingId)deleteMeasurement(editingId);$("modal").classList.add("hidden")};
window.deleteMeasurement=id=>{
 if(!confirm("Diese Messung wirklich löschen?"))return;
 measurements=measurements.filter(x=>x.id!==id);save();render();
};

function drawChart(canvas,metric){
 const data=measurements.filter(m=>m[metric]!=null).sort((a,b)=>new Date(a.date)-new Date(b.date));
 const ctx=canvas.getContext("2d"), dpr=devicePixelRatio||1, rect=canvas.getBoundingClientRect();
 canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;ctx.scale(dpr,dpr);
 const w=rect.width,h=rect.height,p={l:42,r:12,t:20,b:34};
 ctx.clearRect(0,0,w,h);
 if(!data.length){ctx.fillStyle="#888";ctx.font="15px system-ui";ctx.fillText("Noch keine Daten",p.l,h/2);return}
 const vals=data.map(m=>m[metric]), min=Math.min(...vals),max=Math.max(...vals),range=max-min||1;
 const x=i=>p.l+(w-p.l-p.r)*(data.length===1?.5:i/(data.length-1));
 const y=v=>p.t+(h-p.t-p.b)*(1-(v-min)/range);
 ctx.strokeStyle=getComputedStyle(document.body).color;ctx.globalAlpha=.12;ctx.lineWidth=1;
 for(let i=0;i<4;i++){const yy=p.t+(h-p.t-p.b)*i/3;ctx.beginPath();ctx.moveTo(p.l,yy);ctx.lineTo(w-p.r,yy);ctx.stroke()}
 ctx.globalAlpha=1;ctx.strokeStyle="#4f46e5";ctx.lineWidth=3;ctx.lineCap="round";ctx.lineJoin="round";ctx.beginPath();
 data.forEach((m,i)=>i?ctx.lineTo(x(i),y(m[metric])):ctx.moveTo(x(i),y(m[metric])));ctx.stroke();
 ctx.fillStyle="#4f46e5";data.forEach((m,i)=>{ctx.beginPath();ctx.arc(x(i),y(m[metric]),4,0,Math.PI*2);ctx.fill()});
 ctx.fillStyle="#777";ctx.font="11px system-ui";ctx.fillText(fmt(min),4,h-p.b+4);ctx.fillText(fmt(max),4,p.t+4);
 if($("chartStats")){const delta=vals[vals.length-1]-vals[0];$("chartStats").innerHTML=`<div class="metric-summary" style="margin-top:15px"><div class="metric-box"><small>Erster Wert</small><strong>${fmt(vals[0])}${metric==="weight"?" kg":" cm"}</strong></div><div class="metric-box"><small>Veränderung</small><strong>${delta>0?"+":""}${fmt(delta)}${metric==="weight"?" kg":" cm"}</strong></div></div>`}
}
window.addEventListener("resize",()=>{if(currentTab==="charts")drawChart($("chart"),$("metricSelect").value);if(currentTab==="dashboard"&&$("dashChart"))drawChart($("dashChart"),"weight")});
render();
