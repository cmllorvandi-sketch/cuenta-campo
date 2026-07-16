const STORAGE_KEY = "sigea_movimientos_v1";
const lists = {
  actividades:["Ganadería","Forestal","Arrendamiento","Administración General","Feedlot","Agricultura","Apicultura","Otro"],
  rubros:["Personal","Combustible","Veterinaria","Maquinaria","Infraestructura","Administración","Ventas","Ingresos","Arrendamiento","Inversiones","Cuenta Corriente","Caja","Otro"],
  conceptos:["Jornal","Pago jornal","Adelanto","Préstamo","Gasoil","Nafta","Aceite","Venta de terneros","Venta de vacas","Venta de carbón","Venta de leña","Arrendamiento Pantera","Guías","Repuestos","Vacunas","Saldo efectivo mes anterior","Otro"],
  personas:["Daniel","Miguel","Toño","Rubio","Papa","Negro","Sofía","Pantera","YPF","Veterinario","Proveedor","Otro"],
  medios:["Caja","Banco","Transferencia","Cheque","Cuenta corriente","Otro"]
};
const seed = [];

let movements = load(); let deferredPrompt = null;
const $ = id => document.getElementById(id);
function load(){try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY));return Array.isArray(data)?data:seed}catch{return seed}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(movements));renderAll()}
function money(n){return new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(Number(n)||0)}
function dateLabel(value){if(!value)return "Sin fecha";const [y,m,d]=value.split("-");return `${d}/${m}/${y}`}
function escapeHtml(s=""){return String(s).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}
function go(view){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===view));document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view));scrollTo({top:0,behavior:"smooth"})}
function movementHtml(m,actions=false){const sign=m.tipo==="Ingreso"?"+":m.tipo==="Egreso"?"−":"";return `<article class="movement"><div class="main"><h3>${escapeHtml(m.concepto)}${m.persona?` · ${escapeHtml(m.persona)}`:""}</h3><p>${dateLabel(m.fecha)} · ${escapeHtml(m.rubro)} · ${escapeHtml(m.estado)}</p></div><div class="amount ${m.tipo.toLowerCase()}">${sign}${money(Math.abs(m.importe))}</div>${actions?`<div class="row-actions"><button data-edit="${m.id}">Editar</button><button class="delete" data-delete="${m.id}">Eliminar</button></div>`:""}</article>`}
function renderAll(){
  const income=movements.filter(m=>m.tipo==="Ingreso").reduce((s,m)=>s+Number(m.importe),0);
  const expense=movements.filter(m=>m.tipo==="Egreso").reduce((s,m)=>s+Number(m.importe),0);
  const initial=movements.filter(m=>m.tipo==="Saldo Inicial").reduce((s,m)=>s+Number(m.importe),0);
  const pending=movements.filter(m=>["Pendiente","Parcial"].includes(m.estado)).reduce((s,m)=>s+Math.abs(Number(m.importe)),0);
  $("incomeTotal").textContent=money(income);$("expenseTotal").textContent=money(expense);$("pendingTotal").textContent=money(pending);$("balanceTotal").textContent=money(initial+income-expense);$("recordCount").textContent=`${movements.length} movimientos guardados`;
  const sorted=[...movements].sort((a,b)=>b.fecha.localeCompare(a.fecha)||b.createdAt-a.createdAt);
  $("recentList").innerHTML=sorted.slice(0,5).map(m=>movementHtml(m)).join("")||'<p class="empty">Todavía no hay movimientos.</p>';
  renderList();
}
function renderList(){const q=$("search").value.toLowerCase();const type=$("typeFilter").value;const filtered=[...movements].filter(m=>(!type||m.tipo===type)&&Object.values(m).join(" ").toLowerCase().includes(q)).sort((a,b)=>b.fecha.localeCompare(a.fecha)||b.createdAt-a.createdAt);$("allList").innerHTML=filtered.map(m=>movementHtml(m,true)).join("")||'<p class="empty">No hay resultados.</p>'}
function fillOptions(){for(const [id,key] of [["actividad","actividades"],["rubro","rubros"],["medio","medios"]])$(id).innerHTML=lists[key].map(x=>`<option>${x}</option>`).join("");$("conceptos").innerHTML=lists.conceptos.map(x=>`<option value="${x}"></option>`).join("");$("personas").innerHTML=lists.personas.map(x=>`<option value="${x}"></option>`).join("")}
function toast(text){const t=$("toast");t.textContent=text;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function download(name,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)}
function resetForm(){$("movementForm").reset();$("fecha").value=new Date().toISOString().slice(0,10);$("tipo").value="Egreso";$("estado").value="Pagado";$("actividad").value="Administración General";$("medio").value="Caja";$("editId").value="";$("saveButton").textContent="Guardar movimiento";$("cancelEdit").classList.add("hidden")}
function edit(id){const m=movements.find(x=>x.id===id);if(!m)return;for(const key of ["fecha","tipo","actividad","rubro","concepto","persona","medio","importe","estado","observacion"])$(key).value=m[key]??"";$("editId").value=id;$("saveButton").textContent="Guardar cambios";$("cancelEdit").classList.remove("hidden");go("nuevo")}

document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.view)));document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));
$("movementForm").addEventListener("submit",e=>{e.preventDefault();const id=$("editId").value;const m={id:id||crypto.randomUUID(),fecha:$("fecha").value,tipo:$("tipo").value,actividad:$("actividad").value,rubro:$("rubro").value,concepto:$("concepto").value.trim(),persona:$("persona").value.trim(),medio:$("medio").value,importe:Number($("importe").value),estado:$("estado").value,observacion:$("observacion").value.trim(),createdAt:id?(movements.find(x=>x.id===id)?.createdAt||Date.now()):Date.now()};if(id)movements=movements.map(x=>x.id===id?m:x);else movements.push(m);save();resetForm();go("resumen");toast(id?"Cambios guardados":"Movimiento guardado")});
$("cancelEdit").addEventListener("click",resetForm);$("search").addEventListener("input",renderList);$("typeFilter").addEventListener("change",renderList);
$("allList").addEventListener("click",e=>{const editId=e.target.dataset.edit,deleteId=e.target.dataset.delete;if(editId)edit(editId);if(deleteId&&confirm("¿Eliminar este movimiento?")){movements=movements.filter(x=>x.id!==deleteId);save();toast("Movimiento eliminado")}});
$("exportCsv").addEventListener("click",()=>{const headers=["Fecha","Tipo","Actividad","Rubro","Concepto","Persona/Empresa","Medio de pago","Importe","Estado","Observación"];const fields=["fecha","tipo","actividad","rubro","concepto","persona","medio","importe","estado","observacion"];const quote=v=>`"${String(v??"").replaceAll('"','""')}"`;const csv="\uFEFF"+[headers,...movements.map(m=>fields.map(f=>m[f]))].map(r=>r.map(quote).join(";")).join("\r\n");download(`movimientos-sigea-${new Date().toISOString().slice(0,10)}.csv`,csv,"text/csv;charset=utf-8")});
$("backupJson").addEventListener("click",()=>download(`respaldo-sigea-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({app:"SIGEA Campo",version:1,movements},null,2),"application/json"));
$("restoreJson").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.movements))throw Error();if(confirm(`¿Restaurar ${data.movements.length} movimientos? Reemplazará los datos actuales.`)){movements=data.movements;save();toast("Copia restaurada")}}catch{alert("La copia de seguridad no es válida.")}e.target.value=""});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installButton").classList.remove("hidden")});$("installButton").addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("installButton").classList.add("hidden")});
function networkStatus(){const online=navigator.onLine;$("offlineBadge").textContent=online?"Datos locales":"Sin conexión";$("offlineBadge").classList.toggle("online",online)}window.addEventListener("online",networkStatus);window.addEventListener("offline",networkStatus);
if("serviceWorker" in navigator)navigator.serviceWorker.register("service-worker.js");
fillOptions();resetForm();renderAll();networkStatus();
