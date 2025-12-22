let chart;
const KEY="zaehlerEintraege";

function getEntries(){ return JSON.parse(localStorage.getItem(KEY))||[]; }
function saveEntries(data){ localStorage.setItem(KEY,JSON.stringify(data)); }

function toggleMenu(){ const menu=document.getElementById("menuContent"); menu.style.display=menu.style.display==="block"?"none":"block"; }
function toggleDark(){ document.body.classList.toggle("dark"); renderDashboard(); renderStats(); }

function saveEntry(){
  const typ=document.getElementById("typ").value;
  const stand=document.getElementById("stand").value;
  const file=document.getElementById("bild").files[0];
  if(!stand){ alert("Zählerstand fehlt"); return; }
  const data=getEntries();
  const entry={id:Date.now(), datum:new Date().toISOString(), typ, stand:Number(stand), bild:""};
  if(file){
    const reader=new FileReader();
    reader.onload=()=>{ entry.bild=reader.result; data.push(entry); saveEntries(data); resetForm(); };
    reader.readAsDataURL(file);
  } else { data.push(entry); saveEntries(data); resetForm(); }
}

function resetForm(){
  document.getElementById("stand").value="";
  document.getElementById("bild").value="";
  renderDashboard();
  populateYearFilter();
}

function renderDashboard(){
  const container=document.getElementById("dashboard");
  const data=getEntries();
  container.innerHTML="";
  data.slice().reverse().forEach(e=>{
    const diff=calculateDiffValue(e);
    const icon=getIcon(e.typ);
    const div=document.createElement("div");

    // Typ-Klasse für Farbe
    let typClass="";
    switch(e.typ){
      case "Strom": typClass="strom"; break;
      case "Gas": typClass="gas"; break;
      case "Wasser": typClass="wasser"; break;
      case "PV": typClass="pv"; break;
    }
    div.className="entry-card "+typClass;

    div.innerHTML=`
      <h3>${icon} ${e.typ} – ${new Date(e.datum).toLocaleDateString()}</h3>
      <p>🔢 Zählerstand: <span class="stand">0</span> kWh</p>
      <p>Diff: <span class="diff">0</span> kWh</p>
      ${e.bild?`<img class="dashboard-img" src="${e.bild}" alt="Bild" onclick="openImagePopup('${e.bild}')" />`:''}
      <button class="delete-btn" onclick="deleteEntry(${e.id})">🗑️ Löschen</button>
    `;

    container.appendChild(div);

    // Karten Fade-In + Hochfahren
    setTimeout(()=>{ div.classList.add("visible"); },50);

    // Linie links animieren
    const line=document.createElement("div");
    line.style.position="absolute"; line.style.left="0"; line.style.top="0"; line.style.width="6px"; line.style.height="0%";
    line.style.borderRadius="3px 0 0 3px"; line.style.backgroundColor=getTypeColor(e.typ);
    line.style.transition="height 1s ease-out";
    div.appendChild(line);
    setTimeout(()=>{ line.style.height="100%"; },100);

    // Zählerstand + Differenz animieren
    animateValue(div.querySelector(".stand"),0,e.stand,e);
    animateValue(div.querySelector(".diff"),0,diff,e,true);
  });

  renderStats();
}

function getIcon(typ){ switch(typ){ case "Strom": return "⚡"; case "Gas": return "🔥"; case "Wasser": return "💧"; case "PV": return "☀️"; default: return ""; } }

function calculateDiffValue(entry){
  const data=getEntries();
  const prev=data.filter(e=>e.typ===entry.typ && e.id!==entry.id);
  if(prev.length===0) return 0;
  const last=prev[prev.length-1];
  return entry.stand-last.stand;
}

function getTypeColor(typ,alpha=1){
  switch(typ){
    case "Strom": return `rgba(30,144,255,${alpha})`;
    case "Gas": return `rgba(255,69,0,${alpha})`;
    case "Wasser": return `rgba(0,206,209,${alpha})`;
    case "PV": return `rgba(255,215,0,${alpha})`;
    default: return `rgba(128,128,128,${alpha})`;
  }
}

function animateValue(element,start,end,entry,isDiff=false){
  let startTime=null;
  const color=getTypeColor(entry.typ);
  const step=(timestamp)=>{
    if(!startTime) startTime=timestamp;
    const progress=Math.min((timestamp-startTime)/1200,1);
    element.textContent=Math.round(start + (end-start)*progress);
    if(isDiff){ element.style.color=end>0?"red":"green"; } 
    else { element.style.color=color; }
    if(progress<1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

function deleteEntry(id){ if(!confirm("Diesen Eintrag wirklich löschen?")) return; const data=getEntries().filter(e=>e.id!==id); saveEntries(data); renderDashboard(); renderStats(); }

function openPopup(){ document.getElementById("popup").style.display="flex"; }
function closePopup(){ document.getElementById("popup").style.display="none"; }
function sendRequest(){ alert("Änderungsantrag gespeichert (Demo)"); closePopup(); }

function openImagePopup(src){ document.getElementById("imagePopup").style.display="flex"; document.getElementById("popupImg").src=src; }
function closeImagePopup(){ document.getElementById("imagePopup").style.display="none"; document.getElementById("popupImg").src=""; }

function toggleStats(){ const section=document.getElementById("statsSection"); const btn=document.getElementById("toggleStatsBtn"); if(section.style.display==="none"){ section.style.display="block"; btn.textContent="📊 Statistik ausblenden"; } else{ section.style.display="none"; btn.textContent="📊 Statistik einblenden"; } }

function populateYearFilter(){ const select=document.getElementById("filterYear"); const data=getEntries(); const years=[...new Set(data.map(e=>new Date(e.datum).getFullYear()))].sort((a,b)=>b-a); select.innerHTML="<option value='All'>Alle</option>"; years.forEach(y=>{ const opt=document.createElement("option"); opt.value=y; opt.textContent=y; select.appendChild(opt); }); }

function renderStats(){
  const filterYear=document.getElementById("filterYear").value;
  const filterTyp=document.getElementById("filterTyp").value;
  const data=getEntries().filter(e=>(filterYear==="All"||new Date(e.datum).getFullYear()==filterYear)&&(filterTyp==="All"||e.typ===filterTyp));
  const currentYear=new Date().getFullYear();
  const prevYear=currentYear-1;
  const grouped={};
  data.forEach(e=>{ const y=new Date(e.datum).getFullYear(); const t=e.typ; if(!grouped[t]) grouped[t]={}; grouped[t][y]=e.stand; });

  const numbersDiv=document.getElementById("statNumbers"); numbersDiv.innerHTML="";
  Object.keys(grouped).forEach(t=>{
    const curr=grouped[t][currentYear]||0;
    const prev=grouped[t][prevYear]||0;
    const diff=curr-prev;
    const icon=getIcon(t);
    const diffText=diff>0?`<span style="color:red;">🔺 +${diff} kWh</span>`:`<span style="color:green;">🟢 ${diff} kWh</span>`;
    numbersDiv.innerHTML+=`<p>${icon} ${t} - ${prevYear}: ${prev} kWh | ${currentYear}: ${curr} kWh | Diff: ${diffText}</p>`;
  });

  const labels=Object.keys(grouped);
  const currData=labels.map(t=>grouped[t][currentYear]||0);
  const prevData=labels.map(t=>grouped[t][prevYear]||0);
  const ctx=document.getElementById("statChart").getContext("2d");
  if(chart) chart.destroy();

  chart=new Chart(ctx,{
    type:'bar',
    data:{
      labels:labels.map(l=>getIcon(l)+" "+l),
      datasets:[
        {
          label:`${prevYear}`,
          data:prevData,
          backgroundColor: labels.map(l=>getTypeColor(l.replace(/^[^ ]+ /,""),0.5))
        },
        {
          label:`${currentYear}`,
          data:currData,
          backgroundColor: labels.map(l=>getTypeColor(l.replace(/^[^ ]+ /,""),0.9))
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      animation:{ duration:1200, easing:'easeOutQuart' },
      plugins:{
        legend:{labels:{color: document.body.classList.contains("dark")?"#eee":"#000"}},
        tooltip:{
          backgroundColor: document.body.classList.contains("dark") ? "#333" : "#fff",
          titleColor: document.body.classList.contains("dark") ? "#fff" : "#000",
          bodyColor: document.body.classList.contains("dark") ? "#eee" : "#000",
          borderColor: document.body.classList.contains("dark") ? "#666" : "#ccc",
          borderWidth:1,
          callbacks:{
            label:function(ctx){
              const t=ctx.label.replace(/^[^ ]+ /,"");
              const prev=grouped[t][prevYear]||0;
              const curr=grouped[t][currentYear]||0;
              const diff=curr-prev; const sym=diff>0?"🔺":"🟢";
              return `${ctx.dataset.label}: ${ctx.raw} kWh | Vorjahr: ${prev} kWh | Diff: ${sym} ${diff} kWh`;
            }
          }
        }
      }
    }
  });
}

function exportBackup(){ const data=getEntries(); const blob=new Blob([JSON.stringify(data, null, 2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="backup.json"; a.click(); }
function importBackup(event){ const file=event.target.files[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>{ try{ const data=JSON.parse(reader.result); saveEntries(data); renderDashboard(); populateYearFilter(); }catch(e){ alert("Fehler beim Import"); } }; reader.readAsText(file); }

window.onload=()=>{ renderDashboard(); populateYearFilter(); };
