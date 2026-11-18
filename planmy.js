// Creador: Sergio Ávila - ECI 380 Huelva
const planState={data:null,category:"iPhone",months:24,model:null,connectivity:null,product:null};
const byId=id=>document.getElementById(id);
const euro=value=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(value);
const roundMoney=value=>Math.round((value+Number.EPSILON)*100)/100;
const monthlyPayment=(principal,annualRate,months,residual)=>{const rate=annualRate/100/12;return rate*(principal-residual/Math.pow(1+rate,months))/(1-Math.pow(1+rate,-months))};
function financingEstimate(principal,annualRate,months,residual){
  const regular=roundMoney(monthlyPayment(principal,annualRate,months,residual));
  let balance=principal;
  let interests=0;
  for(let period=1;period<months;period++){
    const interest=roundMoney(balance/12*annualRate/100);
    interests+=interest;
    balance-=regular-interest;
  }
  const finalInterest=roundMoney(balance/12*annualRate/100);
  interests=roundMoney(interests+finalInterest);
  const adjustedFinal=roundMoney(balance-residual+finalInterest);
  return {regular,adjustedFinal,interests};
}
function calculateTAE(principal,months,residual,regular,adjustedFinal){
  const flows=[-principal,...Array(months-1).fill(regular),adjustedFinal,residual];
  const npv=rate=>flows.reduce((total,flow,index)=>total+flow/Math.pow(1+rate,index),0);
  let low=0,high=.1;
  for(let iteration=0;iteration<80;iteration++){
    const middle=(low+high)/2;
    if(npv(middle)>0)low=middle;else high=middle;
  }
  return (Math.pow(1+(low+high)/2,12)-1)*100;
}
const categoryPlans=()=>planState.data.plans.filter(plan=>plan.category===planState.category&&plan.months===planState.months);
const unique=values=>[...new Set(values)];
function modelFor(plan){
  const name=plan.name;
  if(plan.category==="iPhone")return name.replace(/\s+(?:128GB|256GB|512GB|1TB|2TB).*$/,"");
  if(plan.category==="Watch"){
    if(name.startsWith("Ultra 4"))return "Ultra 4";
    if(name.startsWith("Series 12"))return "Series 12";
    if(name.startsWith("SE 3"))return "SE 3";
  }
  if(plan.category==="iPad"){
    if(name.startsWith("iPad Pro"))return "iPad Pro";
    if(name.startsWith("iPad Air"))return "iPad Air";
    if(name.startsWith("iPad mini"))return "iPad mini";
    return "iPad";
  }
  if(name.startsWith("MacBook Air"))return "MacBook Air";
  if(name.startsWith("MacBook Pro"))return "MacBook Pro";
  if(name.startsWith("MacBook Neo"))return "MacBook Neo";
  if(name.startsWith("Mac mini"))return "Mac mini";
  if(name.startsWith("Mac Studio"))return "Mac Studio";
  if(name.startsWith("iMac"))return "iMac";
  return name;
}
function connectivityFor(plan){
  if(plan.category==="Watch")return plan.name.includes("GPS+Cell")?"GPS+Cell":"GPS";
  if(plan.category==="iPad")return /\b(?:Cell|Cellular)\b/.test(plan.name)?"Wi‑Fi + Cellular":"Wi‑Fi";
  return null;
}
function ensureValidFilters(){
  const plans=categoryPlans();
  const models=unique(plans.map(modelFor));
  if(!models.includes(planState.model))planState.model=models[0]??null;
  const connectivities=unique(plans.filter(plan=>modelFor(plan)===planState.model).map(connectivityFor).filter(Boolean));
  if(!connectivities.includes(planState.connectivity))planState.connectivity=connectivities[0]??null;
  return {models,connectivities};
}
function availablePlans(){
  return categoryPlans().filter(plan=>modelFor(plan)===planState.model&&(!planState.connectivity||connectivityFor(plan)===planState.connectivity));
}

function renderCategories(){
  const categories=["iPhone","Watch","iPad","Mac"];
  byId("categorySelector").innerHTML=categories.map(category=>`<button class="category-button ${category===planState.category?"active":""}" data-category="${category}">${category}</button>`).join("");
  byId("categorySelector").querySelectorAll("button").forEach(button=>button.onclick=()=>{
    planState.category=button.dataset.category;
    const terms=[...new Set(planState.data.plans.filter(plan=>plan.category===planState.category).map(plan=>plan.months))].sort((a,b)=>a-b);
    planState.months=terms[0];
    planState.model=null;
    planState.connectivity=null;
    renderAll();
  });
}
function renderTerms(){
  const terms=[...new Set(planState.data.plans.filter(plan=>plan.category===planState.category).map(plan=>plan.months))].sort((a,b)=>a-b);
  byId("termSelect").innerHTML=terms.map(months=>`<option value="${months}" ${months===planState.months?"selected":""}>${months} meses</option>`).join("");
  byId("termSelect").onchange=()=>{
    planState.months=Number(byId("termSelect").value);
    renderFilters();
    renderProducts();
  };
}
function renderFilters(){
  const {models,connectivities}=ensureValidFilters();
  byId("modelFilter").innerHTML=models.map(model=>`<button class="filter-button ${model===planState.model?"active":""}" data-model="${model}">${model}</button>`).join("");
  byId("modelFilter").querySelectorAll("button").forEach(button=>button.onclick=()=>{
    planState.model=button.dataset.model;
    planState.connectivity=null;
    renderFilters();
    renderProducts();
  });

  const connectivityGroup=byId("connectivityFilterGroup");
  connectivityGroup.hidden=connectivities.length<2;
  byId("connectivityLabel").textContent=planState.category==="Watch"?"Conexión":"Conectividad";
  byId("connectivityFilter").innerHTML=connectivities.map(connectivity=>`<button class="filter-button ${connectivity===planState.connectivity?"active":""}" data-connectivity="${connectivity}">${connectivity}</button>`).join("");
  byId("connectivityFilter").querySelectorAll("button").forEach(button=>button.onclick=()=>{
    planState.connectivity=button.dataset.connectivity;
    renderFilters();
    renderProducts();
  });
}
function renderProducts(){
  const plans=availablePlans();
  byId("productSelect").innerHTML=plans.map((plan,index)=>`<option value="${index}">${plan.name}</option>`).join("");
  planState.product=plans[0]??null;
  byId("productSelect").onchange=()=>{planState.product=plans[Number(byId("productSelect").value)];syncPriceAndResults()};
  syncPriceAndResults();
}
function syncPriceAndResults(){
  if(!planState.product)return;
  byId("priceInput").value=planState.product.pvp;
  renderResults();
}
function renderResults(){
  const plan=planState.product;
  if(!plan)return;
  const price=Number(byId("priceInput").value)||plan.pvp;
  const rate=planState.data.rates[String(plan.months)];
  const estimate=financingEstimate(price,rate,plan.months,plan.residual);
  const total=price+estimate.interests;
  const tae=calculateTAE(price,plan.months,plan.residual,estimate.regular,estimate.adjustedFinal);
  byId("planBadge").textContent=`${plan.months} meses`;
  byId("monthlyPayment").textContent=euro(estimate.regular);
  byId("paymentCount").textContent=`${plan.months} + 1 final`;
  byId("residualPayment").textContent=euro(plan.residual);
  byId("interestAmount").textContent=euro(estimate.interests);
  byId("totalAmount").textContent=euro(roundMoney(total));
  byId("tinValue").textContent=`TIN ${rate.toLocaleString("es-ES",{minimumFractionDigits:2})} %`;
  byId("taeValue").textContent=`TAE ${tae.toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2})} %`;
}
function renderAll(){renderCategories();renderTerms();renderFilters();renderProducts()}
byId("priceInput").addEventListener("input",renderResults);
fetch("planmy-data.json").then(response=>{if(!response.ok)throw Error();return response.json()}).then(data=>{planState.data=data;renderAll()}).catch(()=>{byId("results").innerHTML="<h2>No se pudo cargar la calculadora</h2><p>Actualiza la página e inténtalo de nuevo.</p>"});
