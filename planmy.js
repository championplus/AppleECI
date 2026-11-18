// Creador: Sergio Ávila - ECI 380 Huelva
const planState={data:null,category:"iPhone",months:24,product:null};
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
const availablePlans=()=>planState.data.plans.filter(plan=>plan.category===planState.category&&plan.months===planState.months);

function renderCategories(){
  const categories=["iPhone","Watch","iPad","Mac"];
  byId("categorySelector").innerHTML=categories.map(category=>`<button class="category-button ${category===planState.category?"active":""}" data-category="${category}">${category}</button>`).join("");
  byId("categorySelector").querySelectorAll("button").forEach(button=>button.onclick=()=>{
    planState.category=button.dataset.category;
    const terms=[...new Set(planState.data.plans.filter(plan=>plan.category===planState.category).map(plan=>plan.months))].sort((a,b)=>a-b);
    planState.months=terms[0];
    renderAll();
  });
}
function renderTerms(){
  const terms=[...new Set(planState.data.plans.filter(plan=>plan.category===planState.category).map(plan=>plan.months))].sort((a,b)=>a-b);
  byId("termSelect").innerHTML=terms.map(months=>`<option value="${months}" ${months===planState.months?"selected":""}>${months} meses</option>`).join("");
  byId("termSelect").onchange=()=>{planState.months=Number(byId("termSelect").value);renderProducts()};
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
function renderAll(){renderCategories();renderTerms();renderProducts()}
byId("priceInput").addEventListener("input",renderResults);
fetch("planmy-data.json").then(response=>{if(!response.ok)throw Error();return response.json()}).then(data=>{planState.data=data;renderAll()}).catch(()=>{byId("results").innerHTML="<h2>No se pudo cargar la calculadora</h2><p>Actualiza la página e inténtalo de nuevo.</p>"});
