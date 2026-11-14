const state={products:[],query:"",family:null,subfamily:null};
const $=id=>document.getElementById(id);
const iconFor=f=>/iphone/i.test(f)?"▯":/ipad/i.test(f)?"▭":/watch/i.test(f)?"◉":/macbook/i.test(f)?"⌨":/imac|pantalla/i.test(f)?"▣":"◆";
const imageFor=p=>{
  if(p.family==="iPhone"){
    const model=iphoneModel(p);
    if(/^18 Pro/.test(model))return "images/iphone-18-pro-real.png";
    if(/^17 Pro/.test(model))return "images/iphone-17-pro-real.jpg";
    if(model==="17e")return "images/iphone-17e-real.png";
    if(model==="Air")return "images/iphone-air-real.png";
    if(model==="Duo")return "images/iphone-duo-real.png";
    if(model==="16")return "images/iphone-16-real.jpg";
    return "images/iphone-17-real.png";
  }
  const f=p.family;
  return /ipad air/i.test(f)?"images/ipad-air-real.png":/ipad mini/i.test(f)?"images/ipad-mini-real.png":/ipad pro/i.test(f)?"images/ipad-pro-real.png":/ipad/i.test(f)?"images/ipad-a16-real.png":/watch/i.test(f)?"images/watch-real.jpg":/macbook neo/i.test(f)?"images/macbook-neo-real.jpg":/macbook air/i.test(f)?"images/macbook-air-real.jpg":/macbook pro/i.test(f)?"images/macbook-pro-real.jpg":/mac mini/i.test(f)?"images/mac-mini-real.jpg":/mac studio/i.test(f)?"images/mac-studio-real.jpg":/imac/i.test(f)?"images/imac-real.jpg":/pantalla/i.test(f)?"images/display-real.jpg":"icon.svg";
};
const money=p=>p>0?new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(p):"Sin PVP";
const eanDigits=value=>{const digits=String(value??"").replace(/\D/g,"");return digits.length===12?`0${digits}`:digits.length===13?digits:""};
const barcodeSvg=value=>{
  let digits=String(value??"").replace(/\D/g,"");
  if(digits.length===12)digits=`0${digits}`;
  if(digits.length!==13)return "";
  const left={L:["0001101","0011001","0010011","0111101","0100011","0110001","0101111","0111011","0110111","0001011"],G:["0100111","0110011","0011011","0100001","0011101","0111001","0000101","0010001","0001001","0010111"]};
  const right=["1110010","1100110","1101100","1000010","1011100","1001110","1010000","1000100","1001000","1110100"];
  const parity=["LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG","LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL"][Number(digits[0])];
  let bits="101";
  for(let i=1;i<=6;i++)bits+=left[parity[i-1]][Number(digits[i])];
  bits+="01010";
  for(let i=7;i<=12;i++)bits+=right[Number(digits[i])];
  bits+="101";
  const quiet=11,module=3,height=82,width=(bits.length+quiet*2)*module;
  const bars=[...bits].map((bit,i)=>bit==="1"?`<rect x="${(quiet+i)*module}" y="0" width="${module}" height="${height}"/>`:"").join("");
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Código de barras EAN ${digits}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">${bars}</g></svg>`;
};
const formatReference=value=>{const digits=String(value??"").replace(/\D/g,"");if(digits.length===11)return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;if(digits.length===8)return `${digits.slice(0,3)} ${digits.slice(3)}`;return String(value??"")};
const normalize=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es-ES").replace(/[^a-z0-9]+/g," ").trim();
const aliases={mba:"macbook air",mbp:"macbook pro",portatil:"macbook",movil:"iphone",telefono:"iphone",tablet:"ipad",reloj:"apple watch",watch:"apple watch",monitor:"pantallas",display:"pantallas"};
const queryTokens=query=>normalize(query).split(" ").filter(Boolean).flatMap(token=>(aliases[token]||token).split(" "));
const searchHints=p=>/macbook air/i.test(p.family)?"mba mac air portatil":/macbook pro/i.test(p.family)?"mbp mac pro portatil":/macbook/i.test(p.family)?"mac portatil":/iphone/i.test(p.family)?"movil telefono ios":/ipad/i.test(p.family)?"tablet ipados":/watch/i.test(p.family)?"reloj smartwatch":/pantalla/i.test(p.family)?"monitor display":"";
const searchable=p=>normalize([p.id,p.name,p.family,p.modelCode,p.status,p.ean,p.details,searchHints(p)].join(" "));
const isDemo=p=>/\bdemo\b/i.test(`${p.name} ${p.details}`);
const matchesToken=(p,token)=>{
  if(/^\d{1,2}$/.test(token))return normalize(`${p.name} ${p.family} ${p.details}`).split(" ").includes(token);
  return searchable(p).includes(token);
};
const filterFamily=p=>{
  if(p.family!=="MacBook Pro")return p.family;
  const screenSizeText=`${p.name} ${p.details.split("/")[0]}`;
  if(/(^|\D)16(\D|$)/.test(screenSizeText))return "MacBook Pro 16";
  return "MacBook Pro 14";
};
const iphoneModel=p=>p.name.match(/^iPhone\s+(.+?)(?=\s+\d+(?:GB|TB)\b)/i)?.[1]?.trim()||"Otros";
const iphoneModelOrder=["18 Pro Max","18 Pro","17 Pro Max","17 Pro","17","17e","Air","Duo","16"];
const iphoneModels=()=>[...new Set(state.products.filter(p=>p.family==="iPhone").map(iphoneModel))].sort((a,b)=>{
  const ai=iphoneModelOrder.indexOf(a),bi=iphoneModelOrder.indexOf(b);
  return (ai<0?99:ai)-(bi<0?99:bi)||a.localeCompare(b,"es");
});
const topFamily=p=>/^iPad(?: |$)/.test(p.family)?"iPad":["iMac","Mac mini","Mac Studio","Pantallas"].includes(p.family)?"Mac":/^MacBook(?: |$)/.test(p.family)?"MacBook":filterFamily(p);
const watchModel=p=>p.name.match(/^Watch\s+(SE\s+\d+|Series\s+\d+|Ultra\s+\d+)/i)?.[1]||"Otros";
const subfamilyFor=p=>{
  if(topFamily(p)==="iPhone")return iphoneModel(p);
  if(topFamily(p)==="iPad"){
    if(p.family==="iPad")return "iPad A16";
    if(p.family==="iPad Air")return /13[\"\s]/.test(p.name)?"iPad Air 13":"iPad Air 11";
    if(p.family==="iPad Pro")return /13 pulgadas/i.test(p.name)?"iPad Pro 13":"iPad Pro 11";
    return p.family;
  }
  if(topFamily(p)==="Mac")return p.family==="Pantallas"?(/Studio Display XDR/i.test(p.name)?"Studio Display XDR":"Studio Display"):p.family;
  if(topFamily(p)==="Apple Watch")return watchModel(p);
  if(topFamily(p)==="MacBook")return filterFamily(p);
  return null;
};
const pickerConfig={
  iPhone:{title:"Modelos de iPhone",label:"iPhone",items:iphoneModels},
  iPad:{title:"Modelos de iPad",label:"iPad",items:()=>["iPad A16","iPad Air 11","iPad Air 13","iPad mini","iPad Pro 11","iPad Pro 13"]},
  Mac:{title:"Ordenadores de sobremesa",label:"Mac",items:()=>["iMac","Mac mini","Mac Studio","Studio Display","Studio Display XDR"]},
  "Apple Watch":{title:"Modelos de Apple Watch",label:"Apple Watch",items:()=>["SE 3","Series 12","Ultra 4"]},
  MacBook:{title:"Portátiles Apple",label:"MacBook",items:()=>["MacBook Air","MacBook Neo","MacBook Pro 14","MacBook Pro 16","MacBook ProLED"]}
};
const isCellular=p=>/cellular|\bcell\b|wi[\s‑-]*fi\s*\+\s*cellular/i.test(p.name);
const specialOrder=p=>{
  if(state.subfamily==="iPad A16"||/^iPad Air /.test(state.subfamily||"")||/^iPad Pro /.test(state.subfamily||""))return isCellular(p)?1:0;
  if(state.subfamily==="iPad mini"){
    if(/A20/i.test(p.name))return isCellular(p)?1:0;
    return 2;
  }
  if(state.subfamily==="iMac")return /\bM6\b/i.test(p.name)?0:1;
  if(/^Studio Display/.test(state.subfamily||""))return /novedad/i.test(p.status)?0:1;
  if(state.subfamily==="MacBook Pro 14"){
    if(/\bM6\b/i.test(p.name))return 0;
    if(/M5 Pro/i.test(p.name)&&!/EOL/i.test(p.status))return 1;
    if(/M5 Max/i.test(p.name)&&!/EOL/i.test(p.status))return 2;
    return 3;
  }
  if(state.subfamily==="MacBook ProLED")return /MacBook Pro 14/i.test(p.name)?0:1;
  return 0;
};
const priceOrder=p=>p.price>0?p.price:Number.MAX_SAFE_INTEGER;
const matchesStructuredQuery=p=>{
  const query=normalize(state.query);
  const requestedIphone=query.match(/\biphone\s+(\d+)(?:\s+(pro(?:\s+max)?|air|duo))?\b/);
  if(!requestedIphone)return true;
  const requestedModel=`${requestedIphone[1]}${requestedIphone[2]?` ${requestedIphone[2]}`:""}`;
  return requestedIphone[2]?normalize(iphoneModel(p))===requestedModel:normalize(iphoneModel(p)).startsWith(`${requestedModel} `)||normalize(iphoneModel(p))===requestedModel;
};

function visibleProducts(){
  const tokens=queryTokens(state.query);
  return state.products.filter(p=>{
    if(!tokens.length&&pickerConfig[state.family]&&!state.subfamily)return false;
    const matchesFamily=tokens.length>0||topFamily(p)===state.family;
    const matchesModel=tokens.length>0||!pickerConfig[state.family]||subfamilyFor(p)===state.subfamily;
    return matchesFamily&&matchesModel&&matchesStructuredQuery(p)&&tokens.every(token=>matchesToken(p,token));
  }).sort((a,b)=>Number(isDemo(a))-Number(isDemo(b))||specialOrder(a)-specialOrder(b)||priceOrder(a)-priceOrder(b)||a.name.localeCompare(b.name,"es",{numeric:true,sensitivity:"base"}));
}
function renderFilters(){
  const sortedFamilies=[...new Set(state.products.map(topFamily))].sort((a,b)=>a.localeCompare(b,"es",{numeric:true,sensitivity:"base"}));
  const families=sortedFamilies;
  $("filters").innerHTML=families.map(f=>`<button class="filter ${f===state.family?"active":""}" data-family="${f}">${f}</button>`).join("");
  $("filters").querySelectorAll("button").forEach(b=>b.onclick=()=>{state.family=b.dataset.family;state.subfamily=null;renderFilters();renderSectionPicker();renderProducts()});
}
function renderSectionPicker(){
  const picker=$("sectionPicker");
  const config=pickerConfig[state.family];
  if(!config||state.query){picker.classList.add("hidden");picker.innerHTML="";return}
  const models=config.items();
  picker.classList.remove("hidden");
  picker.innerHTML=`<div class="picker-heading"><div><p class="eyebrow">Elige una familia</p><h2>${config.title}</h2></div>${state.subfamily?'<button id="allSubfamilies" class="picker-back">Ver familias</button>':""}</div><div class="model-grid">${models.map(model=>`<button class="model-button ${model===state.subfamily?"active":""}" data-model="${model}"><span>${config.label}</span><strong>${model.replace(/^iPhone\s+/i,"").replace(/^iPad\s+/i,"")}</strong><small>${state.products.filter(p=>subfamilyFor(p)===model).length} referencias</small></button>`).join("")}</div>`;
  picker.querySelectorAll("[data-model]").forEach(button=>button.onclick=()=>{state.subfamily=button.dataset.model;renderSectionPicker();renderProducts()});
  $("allSubfamilies")?.addEventListener("click",()=>{state.subfamily=null;renderSectionPicker();renderProducts()});
}
function renderProducts(){
  const products=visibleProducts();
  const categoryLanding=!state.family&&!state.query;
  const sectionLanding=pickerConfig[state.family]&&!state.subfamily&&!state.query;
  const sectionProductCount=sectionLanding?state.products.filter(p=>topFamily(p)===state.family).length:0;
  $("resultCount").textContent=categoryLanding?state.products.length:sectionLanding?sectionProductCount:products.length;
  $("resultLabel").textContent=sectionLanding?`productos de ${state.family}`:"productos disponibles";
  $("emptyState").classList.toggle("hidden",products.length!==0||sectionLanding||categoryLanding);
  $("catalog").innerHTML=products.map((p,i)=>`
    <button class="card" data-index="${state.products.indexOf(p)}">
      <span class="product-icon"><img src="${imageFor(p)}" alt="" loading="lazy"></span>
      <span><span class="family">${p.family}</span><h2>${p.name}</h2><span class="reference">${formatReference(p.id)}</span></span>
      <span class="card-price">${money(p.price)}<span class="status">${p.status}</span></span>
    </button>`).join("");
  $("catalog").querySelectorAll(".card").forEach(card=>card.onclick=()=>showProduct(state.products[card.dataset.index]));
}
function showProduct(p){
  $("detailImage").src=imageFor(p);$("detailImage").alt=`Imagen de ${p.name}`;$("detailFamily").textContent=`${p.family} · ${p.status}`;
  $("detailName").textContent=p.name;$("detailReference").textContent=formatReference(p.id);$("detailPrice").textContent=money(p.price);
  const barcode=barcodeSvg(p.ean);
  $("barcodeBlock").classList.toggle("hidden",!barcode);$("barcodeUnavailable").classList.toggle("hidden",Boolean(barcode));
  $("barcodeGraphic").innerHTML=barcode;$("barcodeNumber").textContent=eanDigits(p.ean);
  const specs=[["Modelo fabricante",p.modelCode],["EAN",p.ean],["Configuración",p.details]].filter(([,v])=>v);
  $("detailSpecs").innerHTML=specs.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  $("productDialog").showModal();
}
let scannerControls=null;
function stopScanner(){
  scannerControls?.stop();scannerControls=null;
  const video=$("scannerVideo");
  video.srcObject?.getTracks().forEach(track=>track.stop());video.srcObject=null;
  if($("scannerDialog").open)$("scannerDialog").close();
}
async function startScanner(){
  const dialog=$("scannerDialog"),status=$("scannerStatus");
  if(!navigator.mediaDevices?.getUserMedia){alert("Este navegador no permite acceder a la cámara. Abre la web con Safari y comprueba los permisos.");return}
  if(!window.ZXingBrowser){alert("No se ha podido cargar el lector de códigos. Recarga la página e inténtalo de nuevo.");return}
  dialog.showModal();status.textContent="Iniciando cámara…";
  try{
    const reader=new ZXingBrowser.BrowserMultiFormatOneDReader();
    scannerControls=await reader.decodeFromConstraints({audio:false,video:{facingMode:{ideal:"environment"},width:{ideal:1920},height:{ideal:1080}}},$("scannerVideo"),(result)=>{
      if(!result)return;
      const rawCode=String(result.getText()??"").trim();
      const scanned=eanDigits(rawCode);
      const normalizedCode=normalize(rawCode).replace(/\s/g,"");
      if(!rawCode)return;
      const product=state.products.find(p=>
        (scanned&&eanDigits(p.ean)===scanned)||
        normalize(p.modelCode).replace(/\s/g,"")===normalizedCode||
        normalize(p.id).replace(/\s/g,"")===normalizedCode
      );
      if(product){
        status.textContent=`Código ${rawCode} encontrado`;
        if(navigator.vibrate)navigator.vibrate(80);
        stopScanner();showProduct(product);
      }else{
        status.textContent=`El código ${rawCode} no está en el catálogo`;
        $("searchInput").value=rawCode;state.query=rawCode;renderProducts();
      }
    });
    status.textContent="Coloca el EAN dentro del recuadro.";
  }catch(error){
    stopScanner();
    alert(error?.name==="NotAllowedError"?"No se ha autorizado la cámara. Actívala en Ajustes > Safari > Cámara y vuelve a intentarlo.":"No se pudo iniciar la cámara. Comprueba el permiso y que la web esté abierta mediante HTTPS.");
  }
}
async function start(){
  try{
    state.products=await fetch("catalog.json").then(r=>{if(!r.ok)throw Error();return r.json()});
    renderFilters();renderSectionPicker();renderProducts();
  }catch{$("catalog").innerHTML='<section class="empty glass"><h2>No se pudo cargar el catálogo</h2><p>Comprueba la conexión y vuelve a intentarlo.</p></section>'}
}
$("searchInput").addEventListener("input",e=>{state.query=e.target.value;if(state.query&&state.family){state.family=null;state.subfamily=null;renderFilters()}renderSectionPicker();$("clearButton").classList.toggle("hidden",!state.query);renderProducts()});
$("clearButton").onclick=()=>{$("searchInput").value="";state.query="";state.family=null;state.subfamily=null;$("clearButton").classList.add("hidden");renderFilters();renderSectionPicker();renderProducts();$("searchInput").focus()};
$("scanButton").onclick=startScanner;
$("closeScanner").onclick=stopScanner;
$("scannerDialog").addEventListener("cancel",event=>{event.preventDefault();stopScanner()});
$("scannerDialog").addEventListener("click",event=>{if(event.target===$("scannerDialog"))stopScanner()});
$("closeDialog").onclick=()=>$("productDialog").close();
$("productDialog").addEventListener("click",e=>{if(e.target===$("productDialog"))$("productDialog").close()});
let installPrompt;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("installButton").classList.remove("hidden")});
$("installButton").onclick=async()=>{if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("installButton").classList.add("hidden")}else{alert("En Safari, pulsa Compartir y después Añadir a pantalla de inicio.")}};
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
start();
