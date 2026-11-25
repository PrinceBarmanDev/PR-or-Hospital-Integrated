/* ============ PR OR HOSPITAL - CLEAN JS - FINAL - POSITIVE SCORE + SWIPE + ICONS ONLY + 04 ANALYSIS + 05 HOW IT WORKS ============ */
/* BARBELL RULE - MATCHES YOUR CSS: CSS has LEFT=row-reverse, RIGHT=row */
/* SO JS MUST APPEND SAME ORDER TO BOTH SIDES. DO NOT REVERSE LEFT IN JS. */
const API_BASE = "https://pr-or-hospital-backend.onrender.com";
const CIRCUMFERENCE = 2 * Math.PI * 82;
const $ = (id) => document.getElementById(id);
const slider = $("weight-slider");
const targetInput = $("target-weight");
const runButton = $("run-prediction");
let animatedProb = 0;
let lastRecovery = { score: 75, verdict: "BEAST MODE", risk: 0 };
let lastPopupData = null;

const safe = (id, fn) => { const el = $(id); if (el && fn) fn(el); return el; };
const liftMap = { squat: "Squat", bench: "Bench", deadlift: "Deadlift" };
const getNum = (id) => { const v = $(id)?.value; if (v === "" || v === null || v === undefined) return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
const markEmpty = (id) => { const el = $(id); if (el) { el.style.borderColor = "#ff3b30"; el.style.boxShadow = "0 0 0 3px rgba(255,59,48,.25)"; el.focus(); setTimeout(()=>{ el.style.boxShadow=""; }, 2000); } };
const clearMark = (id) => { const el = $(id); if (el) { el.style.borderColor = ""; el.style.boxShadow = ""; } };

// ---------- NAME + DATE ----------
function getUserName(){ return ($("user-name")?.value || "").trim(); }
function getCheckDate(){
  const v = $("check-date")?.value;
  if(!v) return new Date().toLocaleDateString("en-US",{day:"numeric",month:"short"}).toUpperCase();
  const d = new Date(v+"T00:00:00");
  return d.toLocaleDateString("en-US",{day:"numeric",month:"short"}).toUpperCase();
}
function autoFillDate(){
  const now = new Date();
  const localDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
  const dateEl = $("check-date");
  if (dateEl && !dateEl.value) dateEl.value = localDate;
  const sessionEl = $("session-date");
  if (sessionEl) {
    sessionEl.textContent = now.toLocaleDateString(undefined, {
      weekday: "short", month: "short", day: "numeric"
    }).toUpperCase();
  }
}
function getNameLine(){
  const name = getUserName();
  return name ? name.toUpperCase() + " - CHECK ON " + getCheckDate() : "CHECK ON " + getCheckDate();
}

// ---------- POWER SCORE - POSITIVE ONLY, NO RISK % ----------
function updateRecovery() {
  const sleep = getNum("sleep-hours");
  const sore = getNum("soreness");
  const rest = getNum("rest-days");
  const energy = getNum("energy");
  if (sleep === null && sore === null && rest === null && energy === null) {
    lastRecovery = { score: 0, verdict: "ENTER DETAILS", risk: 0 };
    safe("recovery-score", el => { el.textContent = "—"; el.style.color = "#fff"; });
    safe("recovery-verdict", el => { el.textContent = "ENTER DETAILS"; el.style.color = "#8a968a"; });
    safe("recovery-risk", el => { el.textContent = "—"; el.style.color = "#8a968a"; });
    safe("d-ready", el => { el.textContent = "—"; el.style.color = "#fff"; });
    return lastRecovery;
  }
  const s = sleep ?? 7;
  const so = sore ?? 5;
  const r = rest ?? 1;
  const e = energy ?? 7;
  let score = (Math.min(s, 9) / 9 * 35) + ((10 - so) / 9 * 30) + (Math.min(r, 3) / 3 * 15) + (e / 10 * 20);
  score = Math.max(0, Math.min(100, Math.round(score)));
  const verdict = score >= 70 ? "BEAST MODE" : score >= 50 ? "PUSH MODE" : "SMART MODE";
  const risk = Math.max(0, Math.round(100 - score));
  lastRecovery = { score, verdict, risk };
  safe("recovery-score", el => { el.textContent = score + "/100"; el.style.color = score >= 70 ? "#b8ff00" : score >= 50 ? "#eab308" : "#ff3b30"; });
  safe("recovery-verdict", el => { el.textContent = verdict; el.style.color = score >= 70 ? "#b8ff00" : score >= 50 ? "#eab308" : "#ff3b30"; });
  safe("recovery-risk", el => { el.textContent = score + "% ENERGY"; el.style.color = score >= 70 ? "#b8ff00" : score >= 50 ? "#eab308" : "#ff3b30"; });
  safe("d-ready", el => { el.textContent = score + "/100"; el.style.color = score >= 70 ? "#b8ff00" : score >= 50 ? "#eab308" : "#ff3b30"; });
  const sleepEl = $("sleep-hours"); if (sleepEl) sleepEl.style.borderColor = s < 5 ? "#ff3b30" : "#2b332b";
  const soreEl = $("soreness"); if (soreEl) soreEl.style.borderColor = so >= 8 ? "#ff3b30" : "#2b332b";
  return lastRecovery;
}

// ---------- SLIDER / WEIGHT ----------
function paintSlider() {
  if (!slider) return;
  const min = Number(slider.min), max = Number(slider.max), value = Number(slider.value);
  const pct = ((value - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, #ff3b30 0%, #ff3b30 ${pct}%, #2b332b ${pct}%, #2b332b 100%)`;
}
function updateWeight(value) {
  const rawWeight = Number(value);
  const weight = Math.min(1000, Math.max(20, Math.round((Number.isFinite(rawWeight) ? rawWeight : 20) / 2.5) * 2.5));
  if (targetInput) targetInput.value = weight;
  if (slider) slider.value = Math.min(Number(slider.max), Math.max(Number(slider.min), weight));
  safe("target-weight-val", el => el.textContent = weight.toLocaleString(undefined, { maximumFractionDigits: 1 }));
  const prior = getNum("prior-success");
  safe("intensity-pct", el => el.textContent = prior !== null && prior > 0 ? `${(weight / prior * 100).toFixed(1)}% OF YOUR LAST BEST` : "ENTER YOUR LAST BEST");
  safe("d-target", el => el.textContent = weight + " kg");
  safe("d-pr", el => el.textContent = prior !== null ? prior + " kg" : "—");
  safe("d-sleep", el => el.textContent = getNum("sleep-hours") !== null ? getNum("sleep-hours") + " hrs" : "—");
  safe("d-sore", el => el.textContent = getNum("soreness") !== null ? getNum("soreness") + " / 10" : "—");
  safe("d-rest", el => el.textContent = getNum("rest-days") !== null ? getNum("rest-days") + " day" : "—");
  renderBarbell(weight);
  paintSlider();
}

// ---------- BARBELL - BIGGEST PLATE NEAR BAR - CORRECTED FOR YOUR CSS ----------
// YOUR CSS: #left-plates { flex-direction: row-reverse } , #right-plates { flex-direction: row }
// SO: Append SAME order [25,20,15...] to BOTH sides. CSS flips LEFT automatically.
// RESULT: LEFT shows [15 | 25] , RIGHT shows [25 | 15] - BIG always near BAR.
function renderBarbell(totalKg) {
  const left = $("left-plates"), right = $("right-plates");
  if (!left || !right) return;
  left.replaceChildren(); right.replaceChildren();
  let perSide = Math.max(0, (totalKg - 20) / 2);
  const perSideStart = perSide;
  const plates = [25, 20, 15, 10, 5, 2.5, 1.25];
  const summary = [];
  const ordered = [];
  for (const kg of plates) {
    const count = Math.floor((perSide + 1e-6) / kg);
    if (!count) continue;
    summary.push(`${count}x${kg}`);
    perSide -= count * kg;
    for (let i = 0; i < count; i++) ordered.push(kg);
  }
  // SAME ORDER BOTH SIDES - DO NOT REVERSE HERE
  ordered.forEach((kg) => {
    const pR = document.createElement("div");
    pR.className = `plate plate-${String(kg).replace('.', '_')}`;
    pR.textContent = kg;
    right.appendChild(pR);
    const pL = document.createElement("div");
    pL.className = `plate plate-${String(kg).replace('.', '_')}`;
    pL.textContent = kg;
    left.appendChild(pL);
  });
  safe("plate-breakdown", el => el.textContent = summary.length ? `${summary.join(" + ")} KG / SIDE` : "20 KG BAR ONLY");
  safe("plate-per-side", el => el.textContent = perSideStart.toFixed(1) + " KG");
  safe("plate-guide-per-side", el => el.textContent = perSideStart.toFixed(1) + " KG");
}
function setStatus(text, isError = false) {
  safe("api-status-tag", el => { el.textContent = text; el.style.color = isError ? "#ff6b63" : "#b8ff00"; });
}

function setResultState(state, message = "") {
  const card = $("lift-card");
  if (card) card.dataset.resultState = state;
  const badge = $("lift-badge");
  const title = $("verdict-title");
  const sub = $("verdict-sub");
  const eyebrow = $("verdict-eyebrow");
  if (state === "loading") {
    if (badge) { badge.textContent = "ANALYSING"; badge.className = "lift-badge pending"; }
    if (title) { title.textContent = "CHECKING YOUR DETAILS"; title.className = "verdict-title"; }
    if (sub) sub.textContent = "Please wait while the prediction service processes your entries.";
    if (eyebrow) eyebrow.textContent = "PREDICTION IN PROGRESS";
  } else if (state === "error") {
    if (badge) { badge.textContent = "UNAVAILABLE"; badge.className = "lift-badge pending"; }
    if (title) { title.textContent = "RESULT UNAVAILABLE"; title.className = "verdict-title danger"; }
    if (sub) sub.textContent = message || "The prediction service could not be reached. Start the backend and try again.";
    if (eyebrow) eyebrow.textContent = "NO PREDICTION WAS GENERATED";
    ["out-complete", "out-risk", "out-safe", "out-conf"].forEach(id => safe(id, el => el.textContent = "—"));
    safe("advice-text", el => el.textContent = "No result was generated. Check that the backend is running at http://127.0.0.1:8000, then try again.");
    safe("risk-list", el => el.innerHTML = "<li>The API did not return a valid prediction.</li>");
    safe("failure-prob", el => el.textContent = "—");
    safe("gauge-arc", el => { el.style.strokeDashoffset = String(CIRCUMFERENCE); el.style.stroke = "#4b554b"; });
    animatedProb = 0;
  } else if (state === "empty") {
    if (badge) { badge.textContent = "AWAITING DETAILS"; badge.className = "lift-badge pending"; }
    if (title) { title.textContent = "COMPLETE THE FORM"; title.className = "verdict-title"; }
    if (sub) sub.textContent = "Enter your details, recovery information and planned weight, then select CHECK MY LIFT to request an analysis.";
    if (eyebrow) eyebrow.textContent = "YOUR RESULT WILL APPEAR HERE";
    ["out-complete", "out-risk", "out-safe", "out-conf"].forEach(id => safe(id, el => el.textContent = "—"));
    safe("failure-prob", el => el.textContent = "—");
    safe("gauge-arc", el => { el.style.strokeDashoffset = String(CIRCUMFERENCE); el.style.stroke = "#4b554b"; });
    safe("advice-text", el => el.textContent = "Complete the form and request an analysis to see your result.");
    safe("risk-list", el => el.innerHTML = "<li>Your result will appear here after the prediction service responds.</li>");
    animatedProb = 0;
    lastPopupData = null;
  } else if (state === "result") {
    if (card) card.dataset.resultState = "result";
  }
}

// ---------- GAUGE - LIFT SCORE 0-100, GREEN = HIGH ----------
function animateGauge(targetPct) {
  const arc = $("gauge-arc");
  const label = $("failure-prob");
  if (!arc || !label) return;
  const start = animatedProb;
  const startTime = performance.now();
  const duration = 800;
  function frame(now) {
    const p = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = start + (targetPct - start) * eased;
    animatedProb = val;
    label.textContent = val.toFixed(0);
    arc.style.strokeDashoffset = (CIRCUMFERENCE * (1 - val / 100)).toFixed(2);
    arc.style.stroke = val >= 70 ? "#b8ff00" : val >= 50 ? "#eab308" : "#ff3b30";
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ---------- BIG RESULT POPUP - POSITIVE ONLY ----------
function showPopup(success, advice) {
  const d = lastPopupData;
  if (!d) { $("result-popup")?.classList.add("show"); return; }
  const zone = success >= 70 ? "GREEN ZONE" : success >= 50 ? "PUSH ZONE" : "SMART ZONE";
  safe("popup-prob", el => el.textContent = success.toFixed(0));
  safe("popup-title", el => { el.textContent = success >= 70 ? "YOU GOT THIS!" : success >= 50 ? "ALMOST THERE!" : "SMART MOVE!"; el.style.color = success >= 70 ? "#b8ff00" : success >= 50 ? "#eab308" : "#ff3b30"; });
  safe("popup-badge", el => { el.textContent = zone; el.className = "lift-badge " + (success >= 70 ? "low" : success >= 50 ? "medium" : "high"); });
  safe("popup-date", el => el.textContent = getCheckDate() + (getUserName() ? " - " + getUserName().toUpperCase() : ""));
  safe("popup-bar", el => { el.style.width = success + "%"; el.style.background = success >= 70 ? "#b8ff00" : success >= 50 ? "#eab308" : "#ff3b30"; });
  safe("popup-complete", el => el.textContent = success.toFixed(0) + "%");
  safe("popup-complete-2", el => el.textContent = success.toFixed(0) + "%");
  safe("popup-risk", el => { el.textContent = zone; el.style.color = success >= 70 ? "#b8ff00" : success >= 50 ? "#eab308" : "#ff3b30"; });
  safe("popup-risk-2", el => { el.textContent = zone; el.style.color = success >= 70 ? "#b8ff00" : success >= 50 ? "#eab308" : "#ff3b30"; });
  safe("popup-safe", el => el.textContent = d.safeWeight + " kg");
  safe("popup-conf", el => el.textContent = lastRecovery.score + "/100");
  safe("popup-pr-target", el => el.textContent = d.prior + " kg -> " + d.target + " kg");
  safe("popup-sleep", el => el.textContent = d.sleep + " hrs");
  safe("popup-sore", el => el.textContent = d.sore + "/10");
  safe("popup-rest", el => el.textContent = d.rest + "d");
  safe("popup-ready", el => el.textContent = lastRecovery.score + "/100");
  safe("popup-reasons", el => el.innerHTML = d.reasons.map(r => `<li>${r}</li>`).join(""));
  safe("popup-sub", el => el.textContent = success >= 70 ? "YOU ARE READY - GO SMASH IT" : success >= 50 ? "GOOD ENERGY - GO A LITTLE LIGHTER" : "GO LIGHT TODAY - COME BACK STRONGER TOMORROW");
  safe("popup-advice", el => el.textContent = advice);
  safe("popup-warning", el => el.style.display = success < 50 ? "block" : "none");
  $("result-popup")?.classList.add("show");
}
function hidePopup() { $("result-popup")?.classList.remove("show"); }

// ---------- 04 MY LIFT ANALYSIS - HISTORY + SINGLE GRAPH ----------
function getHistory(){ try{ return JSON.parse(localStorage.getItem("liftHistory")||"[]"); }catch(e){ return []; } }
function saveHistoryEntry(entry){
  const h = getHistory();
  entry.test = "TEST " + (h.length + 1);
  h.push(entry);
  localStorage.setItem("liftHistory", JSON.stringify(h));
  renderHistory();
}
function drawHistoryChart(h){
  const c = $("history-chart"); if(!c) return;
  const ctx = c.getContext("2d");
  ctx.clearRect(0,0,c.width,c.height);
  ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.lineWidth = 1;
  for(let i=0;i<=4;i++){ const y=20+i*55; ctx.beginPath(); ctx.moveTo(40,y); ctx.lineTo(780,y); ctx.stroke(); }
  ctx.fillStyle = "#8a968a"; ctx.font = "700 11px JetBrains Mono";
  for(let i=0;i<=4;i++){ ctx.fillText(String(100-i*25)+"%", 2, 24+i*55); }
  if(!h.length){ ctx.fillStyle="#8a968a"; ctx.font="700 16px Inter"; ctx.fillText("No data yet - Do TEST 1", 280, 130); return; }
  const maxW = Math.max(...h.map(x=>x.winning), 100);
  const X = i => h.length===1 ? 400 : 50 + i*(700/(h.length-1));
  ctx.strokeStyle="#ff3b30"; ctx.lineWidth=2; ctx.beginPath();
  h.forEach((r,i)=>{ const x=X(i), y=240-(r.winning/maxW)*210; i?ctx.lineTo(x,y):ctx.moveTo(x,y); });
  ctx.stroke();
  ctx.strokeStyle="#b8ff00"; ctx.lineWidth=3; ctx.beginPath();
  h.forEach((r,i)=>{ const x=X(i), y=240-(r.score/100)*210; i?ctx.lineTo(x,y):ctx.moveTo(x,y); });
  ctx.stroke();
  h.forEach((r,i)=>{ const x=X(i), y=240-(r.score/100)*210; ctx.fillStyle="#b8ff00"; ctx.beginPath(); ctx.arc(x,y,5,0,7); ctx.fill(); ctx.strokeStyle="#000"; ctx.lineWidth=2; ctx.stroke(); ctx.fillStyle="#fff"; ctx.font="700 11px JetBrains Mono"; ctx.fillText(r.score+"%", x-14, y-10); ctx.fillText(r.test, x-20, 255); });
}
function renderHistory(){
  const h = getHistory();
  const body = $("history-body"); if(!body) return;
  safe("history-count", el => el.textContent = h.length + " TESTS SAVED");
  if(!h.length){
    body.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#8a968a;padding:1.2rem">No tests yet - Press CHECK MY LIFT to start your journey!</td></tr>';
    safe("hist-best-score", el => el.textContent = "—");
    safe("hist-best-weight", el => el.textContent = "—");
    safe("hist-avg-score", el => el.textContent = "—");
  } else {
    body.innerHTML = h.slice().reverse().map(r=>`<tr><td><b style="color:#b8ff00">${r.test}</b></td><td>${r.date}</td><td>${r.lift}</td><td><b>${r.score}%</b></td><td>${r.zone}</td><td><b style="color:#b8ff00">${r.winning} kg</b></td><td>${r.target} kg</td><td>${r.sleep} hrs</td></tr>`).join("");
    const best = Math.max(...h.map(x=>x.score));
    const bestW = Math.max(...h.map(x=>x.winning));
    const avg = Math.round(h.reduce((a,x)=>a+x.score,0)/h.length);
    safe("hist-best-score", el => el.textContent = best + "%");
    safe("hist-best-weight", el => el.textContent = bestW + " kg");
    safe("hist-avg-score", el => el.textContent = avg + "%");
  }
  drawHistoryChart(h);
}

// ---------- RESULT - CONVERT FAIL TO SUCCESS SCORE ----------
function renderResult(data) {
  const prob01 = Number(data.fail_probability);
  if (!Number.isFinite(prob01)) throw new Error("No score returned");
  setResultState("result");
  const failPct = Math.max(0, Math.min(100, prob01 * 100));
  const success = Math.round(100 - failPct);
  const zone = success >= 70 ? "GREEN ZONE" : success >= 50 ? "PUSH ZONE" : "SMART ZONE";
  const target = Number(targetInput?.value) || 0;
  const prior = getNum("prior-success") ?? 0;
  const sleep = getNum("sleep-hours") ?? 7;
  const sore = getNum("soreness") ?? 5;
  const rest = getNum("rest-days") ?? 1;
  const energy = getNum("energy") ?? 7;
  let safeWeight = target;
  if (success < 50) safeWeight = Math.round(prior * 0.92);
  else if (success < 70) safeWeight = Math.round(target * 0.92);
  else safeWeight = target;
  if (safeWeight < 20) safeWeight = 20;
  const reasons = [];
  if (sleep >= 7) reasons.push(`Great sleep (${sleep} hrs) - your body is ready`);
  else if (sleep < 6) reasons.push(`Low sleep (${sleep} hrs) - go a little lighter today`);
  if (sore <= 4) reasons.push(`Muscles fresh (${sore}/10) - nice recovery`);
  else if (sore >= 7) reasons.push(`Muscles still sore (${sore}/10) - body needs more recovery`);
  if (rest >= 2) reasons.push(`Well rested (${rest} days) - you are recharged`);
  else if (rest < 1) reasons.push(`No rest day yet - take it easier today`);
  if (energy >= 7) reasons.push(`High energy (${energy}/10) - you feel strong`);
  else if (energy < 5) reasons.push(`Low energy (${energy}/10) - save power for tomorrow`);
  if (prior > 0 && target / prior > 1.10) reasons.push(`Big jump: ${((target/prior-1)*100).toFixed(0)}% above your last best - small steps win`);
  else if (prior > 0) reasons.push(`Smart jump from ${prior}kg to ${target}kg - perfect progression`);
  if (reasons.length === 0) reasons.push(`All good: slept well, fresh, smart jump. Let's go!`);
  lastPopupData = { completePct: success, safeWeight, conf: lastRecovery.score, prior, target, sleep, sore, rest, reasons };
  saveHistoryEntry({ date: getCheckDate(), lift: liftMap[$("lift-type")?.value] || "Squat", score: success, zone, winning: safeWeight, target, sleep });
  animateGauge(success);
  const title = success >= 70 ? "YOU GOT THIS!" : success >= 50 ? "ALMOST THERE!" : "SMART MOVE!";
  const sub = success >= 70 ? "YOU ARE READY - GO SMASH IT" : success >= 50 ? "GOOD ENERGY - GO A LITTLE LIGHTER" : "GO LIGHT TODAY - COME BACK STRONGER TOMORROW";
  const advice = success >= 70
    ? `Power ${lastRecovery.score}/100 - ${lastRecovery.verdict}. Your winning weight today is ${safeWeight}kg. Warm up well and go smash it!`
    : success >= 50
    ? `Power ${lastRecovery.score}/100 - ${lastRecovery.verdict}. Your winning weight today is ${safeWeight}kg. Go a little lighter, move clean, and you will PR soon.`
    : `Power ${lastRecovery.score}/100 - ${lastRecovery.verdict}. Your winning weight today is ${safeWeight}kg. Go light, move well, sleep well - tomorrow you come back stronger. That's how PRs are made.`;
  safe("d-sleep", el => el.textContent = sleep + " hrs");
  safe("d-sore", el => el.textContent = sore + " / 10");
  safe("d-rest", el => el.textContent = rest + " day");
  safe("d-target", el => el.textContent = target + " kg");
  safe("d-pr", el => el.textContent = prior + " kg");
  safe("d-ready", el => { el.textContent = lastRecovery.score + "/100"; el.style.color = lastRecovery.score >= 70 ? "#b8ff00" : lastRecovery.score >= 50 ? "#eab308" : "#ff3b30"; });
  safe("out-complete", el => el.textContent = success + "%");
  safe("out-risk", el => { el.textContent = zone; el.style.color = success >= 70 ? "#b8ff00" : success >= 50 ? "#eab308" : "#ff3b30"; });
  safe("out-safe", el => el.textContent = safeWeight + " kg");
  safe("out-conf", el => el.textContent = lastRecovery.score + "/100");
  safe("lift-badge", el => { el.textContent = zone; el.className = "lift-badge " + (success >= 70 ? "low" : success >= 50 ? "medium" : "high"); });
  safe("verdict-eyebrow", el => el.textContent = getNameLine() + " - POWER " + lastRecovery.score + "/100 - " + lastRecovery.verdict);
  safe("verdict-title", el => { el.textContent = title; el.className = `verdict-title ${success >= 70 ? "safe" : success >= 50 ? "warn" : "danger"}`; });
  safe("verdict-sub", el => { el.textContent = sub; el.className = `verdict-sub ${success < 50 ? "danger" : "safe"}`; });
  safe("advice-text", el => el.textContent = advice);
  safe("risk-list", el => el.innerHTML = reasons.map(r => `<li>${r}</li>`).join(""));
  safe("recovery-warning", el => el.style.display = success < 50 ? "block" : "none");
  setTimeout(() => showPopup(success, advice), 450);
}

// ---------- PREDICT - NEVER SHOW ERROR TO USER ----------
async function runPrediction() {
  const age = getNum("age");
  const bodyweight = getNum("bodyweight");
  const target = getNum("target-weight");
  const prior = getNum("prior-success");
  setResultState("empty");
  ["age", "bodyweight", "prior-success", "target-weight"].forEach(clearMark);

  if (age === null || age < 10 || age > 100) {
    setStatus("CHECK YOUR AGE", true);
    safe("verdict-title", el => el.textContent = age === null ? "ENTER YOUR AGE" : "CHECK YOUR AGE");
    safe("verdict-sub", el => el.textContent = "Enter an age between 10 and 100.");
    markEmpty("age"); return;
  }
  if (bodyweight === null || bodyweight < 20 || bodyweight > 300) {
    setStatus("CHECK BODYWEIGHT", true);
    safe("verdict-title", el => el.textContent = "CHECK BODYWEIGHT");
    safe("verdict-sub", el => el.textContent = "Enter your bodyweight between 20 and 300 kg.");
    markEmpty("bodyweight"); return;
  }
  if (target === null || target < 20 || target > 1000) {
    setStatus("CHECK TARGET WEIGHT", true);
    safe("verdict-title", el => el.textContent = "CHECK TARGET WEIGHT");
    safe("verdict-sub", el => el.textContent = "The bar weighs 20 kg. Choose a total weight from 20 to 1000 kg.");
    markEmpty("target-weight"); return;
  }
  if (prior === null || prior < 0 || prior > 1000) {
    setStatus("CHECK PREVIOUS BEST", true);
    safe("verdict-title", el => el.textContent = "ENTER YOUR LAST BEST");
    safe("verdict-sub", el => el.textContent = "Enter your previous successful weight from 0 to 1000 kg.");
    markEmpty("prior-success"); return;
  }

  updateRecovery();
  if (runButton) {
    runButton.disabled = true;
    runButton.textContent = "ANALYSING...";
  }
  setResultState("loading");
  setStatus("CHECKING YOUR LIFT...");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        Age: age,
        BodyweightKg: bodyweight,
        Sex: $("sex")?.value || "M",
        Event: "SBD",
        Equipment: $("equipment")?.value || "Raw",
        lift_type: liftMap[$("lift-type")?.value] || "Squat",
        attempt_number: Number($("attempt-number")?.value) || 1,
        target_weight_kg: target,
        prior_successful_weight_kg: prior,
        sleep_hours: getNum("sleep-hours") ?? 7,
        soreness: getNum("soreness") ?? 5,
        rest_days: getNum("rest-days") ?? 1,
        energy: getNum("energy") ?? 7
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = typeof data.detail === "string" ? data.detail : `API error ${response.status}`;
      throw new Error(detail);
    }
    renderResult(data);
    setStatus("PREDICTION RECEIVED");
  } catch (error) {
    const message = error.name === "AbortError"
      ? "The prediction service took too long to respond. Check the backend and try again."
      : (error.message || "Could not connect to the prediction service. Start the backend and try again.");
    setResultState("error", message);
    setStatus("BACKEND UNAVAILABLE", true);
  } finally {
    clearTimeout(timeoutId);
    if (runButton) {
      runButton.disabled = false;
      runButton.innerHTML = 'CHECK MY LIFT <span>-&gt;</span>';
    }
  }
}

// ---------- CARD DATA - GYM GUIDES ----------
const CARD_DATA = {
  heavy:{title:"HEAVY LIFT",tag:"MAX ATTEMPT · 90-100%",intro:"Heavy lifting means working with a very high percentage of your personal record. It can build strength, but it also places high demands on your muscles, joints and technique. Attempt it only with suitable preparation and supervision.",stats:[["90-100%","INTENSITY"],["1-3 REPS","PER SET"],["3-5 MIN","REST BETWEEN SETS"]],cards:[{h:"ADVANTAGES",list:["Develops maximum strength","Tests your current strength level","Can build confidence when properly planned","Helps track training progress"]},{h:"FOOD AND FUEL",list:["Include protein-rich foods in your daily meals","Eat a familiar carbohydrate meal before training","Drink water regularly","Have a balanced meal after training"]},{h:"RECOVERY",list:["Aim for 7-9 hours of sleep","Warm up gradually before heavy sets","Use a suitable cool-down routine","Allow enough recovery before another heavy session"]},{h:"WHEN TO SKIP",list:["Very poor sleep or unusual fatigue","Severe soreness","Sharp pain or joint pain","Dizziness or feeling unwell"],red:true},{h:"HOW TO APPROACH IT",text:"Warm up with lighter weights and gradually increase the load. Use a spotter and safety bars where appropriate. Stop if your technique breaks down or you feel pain. Do not force a repetition.",full:true}]},
  noexcuses:{title:"NO EXCUSES",tag:"DISCIPLINE · CONSISTENCY",intro:"Consistency does not mean training through injury. It means building a sustainable routine and adjusting the session to match how you feel. A lighter session or rest day can be the right decision.",stats:[["CONSISTENCY","TRAINING HABIT"],["30-60 MIN","SESSION EXAMPLE"],["RECOVERY","PART OF TRAINING"]],cards:[{h:"ADVANTAGES",list:["Builds a regular training habit","Small improvements add up over time","Can support mood and general fitness","Helps maintain long-term progress"]},{h:"FOOD AND FUEL",list:["Avoid training when you feel faint or unwell","Choose a familiar snack before training if needed","Include dal, eggs, chicken, paneer or other protein foods","Eat balanced meals and stay hydrated"]},{h:"RECOVERY",list:["Include rest days in your plan","Track sleep and muscle soreness","Use lighter sessions when needed","Increase training volume gradually"]},{h:"SMART CONSISTENCY",list:["Low motivation? Start with an easy warm-up","Sore muscles? Reduce intensity if appropriate","Injured? Stop and seek qualified advice","Busy day? Choose a shorter, manageable session"],red:true},{h:"TODAY'S PLAN",text:"Choose your session based on your recovery, experience and training plan. If you feel unusually tired, dizzy or in pain, do not force a workout. Rest is part of progress.",full:true}]},
  prmode:{title:"PR MODE",tag:"PERSONAL RECORD",intro:"PR means Personal Record: your heaviest successful lift under the conditions you track. A PR attempt should be planned, not rushed. Small increases are generally more manageable than sudden large jumps.",stats:[["SMALL STEPS","LOAD INCREASE"],["ONE REP","COMMON PR TEST"],["PLANNING","BEFORE PR DAY"]],cards:[{h:"WHY TRACK A PR?",list:["Shows progress over time","Sets a new training reference point","Can build confidence when achieved safely","Helps plan future training"]},{h:"FOOD AND FUEL",list:["Eat familiar balanced meals before testing","Include carbohydrates for training energy","Include protein in your daily diet","Stay hydrated"]},{h:"PREPARATION",list:["Avoid exhausting sessions before a planned test","Prioritise sleep","Do not try unfamiliar exercises on test day","Warm up progressively"]},{h:"COMMON PR MISTAKES",list:["Making a very large weight jump","Lifting without appropriate safety support","Trying a maximum lift when unwell","Copying another person's target"],red:true},{h:"HOW THIS TOOL HELPS",text:"Enter your previous best and your planned target. We give you a Lift Score and Winning Weight to help you decide.",full:true}]},
  beast:{title:"BEAST MODE",tag:"MINDSET + ENERGY",intro:"Good training is not just motivation. It also depends on preparation, technique, food, sleep and recovery. Being focused means knowing when to train hard and when to take it easier.",stats:[["SLEEP","RECOVERY"],["ENERGY","READINESS"],["TECHNIQUE","CONTROL"]],cards:[{h:"BENEFITS OF GOOD PREPARATION",list:["Can improve focus and technique","Helps you follow your training plan","Supports consistent performance","Makes training more enjoyable"]},{h:"FOOD AND FUEL",list:["Eat balanced meals throughout the day","Include carbohydrates for energy","Include protein-rich foods","Drink enough water"]},{h:"RECOVERY",list:["Prioritise consistent sleep","Use light movement when suitable","Take rest days","Avoid increasing intensity too quickly"]},{h:"WHEN TO SWITCH IT OFF",list:["Very low energy or poor sleep","Pain during a movement","Dizziness or feeling faint","Loss of control or unsafe technique"],red:true},{h:"CHECK YOUR READINESS",text:"Use your sleep, soreness, rest and freshness answers as part of a wider decision. If you feel unwell or have pain, do not rely on a score to continue lifting.",full:true}]},
  deadlift:{title:"DEADLIFT",tag:"FULL BODY LIFT",intro:"The deadlift involves lifting a bar from the floor to a standing position. It uses several muscle groups, including the legs, back, grip and core. Learn the movement with a manageable load before increasing weight.",stats:[["FULL BODY","MUSCLES USED"],["CONTROL","MOVEMENT QUALITY"],["TECHNIQUE","FIRST PRIORITY"]],cards:[{h:"MUSCLES INVOLVED",list:["Glutes and hamstrings","Back and core muscles","Grip and forearms","Quadriceps also contribute"]},{h:"FOOD AND FUEL",list:["Eat balanced meals","Include protein sources such as eggs, dal or paneer","Include carbohydrates for training energy","Stay hydrated"]},{h:"TECHNIQUE CHECK",list:["Keep the bar close to your body","Brace your core before lifting","Maintain a controlled back position","Use a load you can move with control"]},{h:"STOP IF YOU NOTICE",list:["Sharp or sudden back pain","Dizziness or feeling faint","Sudden loss of grip or control","Painful joint symptoms"],red:true},{h:"BASIC MOVEMENT CUES",text:"Set your feet, bring the bar close, brace your trunk and push through the floor. Stand tall without leaning back. Learn the movement from a qualified coach and stop if you feel pain.",full:true}]},
  squat:{title:"SQUAT",tag:"LOWER BODY LIFT",intro:"The squat is a compound movement that trains the legs, glutes and core. Use a comfortable stance and a range of motion you can control. Technique and suitable safety equipment matter more than lifting the heaviest possible load.",stats:[["LEGS + GLUTES","MAIN MUSCLES"],["CONTROL","MOVEMENT QUALITY"],["SAFETY BARS","HEAVY SETS"]],cards:[{h:"MUSCLES INVOLVED",list:["Quadriceps","Glutes","Hamstrings","Core muscles"]},{h:"FOOD AND FUEL",list:["Eat balanced meals","Include protein-rich foods","Choose carbohydrates for energy","Drink water throughout the day"]},{h:"TECHNIQUE CHECK",list:["Choose a stable foot position","Keep your whole foot supported","Control the descent and ascent","Use a range of motion you can maintain"]},{h:"STOP IF YOU NOTICE",list:["Sharp knee or hip pain","Loss of balance or control","Dizziness or feeling faint","Technique breaking down under load"],red:true},{h:"BASIC MOVEMENT CUES",text:"Set your feet, brace your core, lower under control and stand while keeping balance. Use safety bars and a spotter for heavy attempts. Ask a qualified coach to check your form.",full:true}]}
};
if (typeof window !== "undefined") window.CARD_DATA = CARD_DATA;

// ---------- CARD POPUP + SWIPE ----------
const CARD_ORDER = ["heavy","noexcuses","prmode","beast","deadlift","squat"];
let currentCardIndex = 0;
function getCardData(key){
  if (typeof CARD_DATA !== "undefined" && CARD_DATA && CARD_DATA[key]) return CARD_DATA[key];
  if (typeof window !== "undefined" && window.CARD_DATA && window.CARD_DATA[key]) return window.CARD_DATA[key];
  return null;
}
function renderCardDots(){
  const dots = $("card-dots");
  if(!dots) return;
  dots.innerHTML = CARD_ORDER.map((k,i)=>`<span class="card-dot ${i===currentCardIndex?"active":""}" data-i="${i}"></span>`).join("");
  dots.querySelectorAll(".card-dot").forEach(d=>{
    d.addEventListener("click",(e)=>{ e.stopPropagation(); showCardByKey(CARD_ORDER[Number(d.dataset.i)], ""); });
  });
}
function showCardByKey(key, dir="next"){
  const d = getCardData(key);
  const popup = $("card-popup");
  if (!d || !popup) return;
  currentCardIndex = CARD_ORDER.indexOf(key);
  if(currentCardIndex < 0) currentCardIndex = 0;
  const cardEl = document.querySelector(`.gym-card[data-card="${key}"]`);
  const img = cardEl?.querySelector("img");
  safe("card-popup-img", el => { if (img) el.src = img.src; });
  safe("card-popup-tag", el => el.textContent = d.tag);
  safe("card-popup-title", el => el.innerHTML = d.title + ' <span>GUIDE</span>');
  safe("card-popup-intro", el => el.textContent = d.intro);
  safe("card-popup-stats", el => el.innerHTML = d.stats.map(s => `<div class="mini-stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join(""));
  safe("card-popup-grid", el => el.innerHTML = d.cards.map(c => {
    if (c.full) return `<div class="info-card full lime"><h4>${c.h}</h4><p>${c.text}</p></div>`;
    return `<div class="info-card ${c.red ? "red" : ""}"><h4>${c.h}</h4><ul>${c.list.map(li => `<li>${li}</li>`).join("")}</ul></div>`;
  }).join(""));
  safe("card-counter", el => el.textContent = (currentCardIndex+1) + " / " + CARD_ORDER.length);
  renderCardDots();
  const content = $("card-popup-content");
  if(content){ content.classList.remove("slide-in-left","slide-in-right"); void content.offsetWidth; if(dir) content.classList.add(dir==="prev"?"slide-in-right":"slide-in-left"); }
  popup.classList.add("show");
  const box = popup.querySelector(".big-popup-box");
  if (box) box.scrollTop = 0;
}
function openCardPopup(key, cardEl) { showCardByKey(key, "next"); }
function nextCard(){ showCardByKey(CARD_ORDER[(currentCardIndex+1)%CARD_ORDER.length], "next"); }
function prevCard(){ showCardByKey(CARD_ORDER[(currentCardIndex-1+CARD_ORDER.length)%CARD_ORDER.length], "prev"); }
function closeCardPopup() { $("card-popup")?.classList.remove("show"); }

// ---------- INIT ----------
safe("dec-weight", el => el.addEventListener("click", () => updateWeight(Math.max(1, Number(targetInput?.value) - 2.5))));
safe("inc-weight", el => el.addEventListener("click", () => updateWeight(Math.min(1000, Number(targetInput?.value) + 2.5))));
safe("weight-slider", el => el.addEventListener("input", () => updateWeight(el.value)));
safe("target-weight", el => el.addEventListener("input", () => { clearMark("target-weight"); updateWeight(el.value); }));
safe("prior-success", el => el.addEventListener("input", () => { clearMark("prior-success"); updateWeight(targetInput?.value); }));
safe("age", el => el.addEventListener("input", () => clearMark("age")));
safe("bodyweight", el => el.addEventListener("input", () => clearMark("bodyweight")));
safe("user-name", el => el.addEventListener("input", () => { safe("verdict-eyebrow", e => e.textContent = getNameLine()); }));
safe("check-date", el => el.addEventListener("change", () => { safe("verdict-eyebrow", e => e.textContent = getNameLine()); }));
safe("run-prediction", el => el.addEventListener("click", runPrediction));
safe("popup-close", el => el.addEventListener("click", hidePopup));
safe("popup-ok", el => el.addEventListener("click", hidePopup));
safe("result-popup", el => el.addEventListener("click", (e) => { if (e.target.id === "result-popup") hidePopup(); }));
safe("card-popup-close", el => el.addEventListener("click", closeCardPopup));
safe("card-popup-ok", el => el.addEventListener("click", () => { closeCardPopup(); $("run-prediction")?.scrollIntoView({ behavior: "smooth", block: "center" }); }));
safe("card-popup", el => el.addEventListener("click", (e) => { if (e.target.id === "card-popup") closeCardPopup(); }));
safe("card-next", el => el.addEventListener("click", (e) => { e.stopPropagation(); nextCard(); }));
safe("card-prev", el => el.addEventListener("click", (e) => { e.stopPropagation(); prevCard(); }));
safe("history-clear", el => el.addEventListener("click", () => { if(confirm("Clear all your Lift Analysis history?")){ localStorage.removeItem("liftHistory"); renderHistory(); } }));
safe("history-export", el => el.addEventListener("click", () => {
  const h = getHistory(); if(!h.length) return alert("No tests to download yet!");
  let csv = "Test,Date,Lift,Score,Zone,Winning Weight,Target,Sleep\n" + h.map(r=>[r.test,r.date,r.lift,r.score,r.zone,r.winning,r.target,r.sleep].join(",")).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download = "my-lift-analysis.csv"; a.click();
}));
document.querySelectorAll(".gym-card").forEach(card => {
  card.style.cursor = "pointer";
  card.addEventListener("click", () => openCardPopup(card.dataset.card, card));
  card.addEventListener("keydown", (e) => { if(e.key==="Enter"||e.key===" "){ e.preventDefault(); openCardPopup(card.dataset.card, card); } });
});
document.addEventListener("keydown", (e) => {
  const cardOpen = $("card-popup")?.classList.contains("show");
  const resultOpen = $("result-popup")?.classList.contains("show");
  if (cardOpen) {
    if (e.key === "ArrowRight") { e.preventDefault(); nextCard(); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); prevCard(); return; }
  }
  if (e.key === "Enter" && !cardOpen && !resultOpen) runPrediction();
  if (e.key === "Escape") { hidePopup(); closeCardPopup(); }
});
(function initCardSwipe(){
  const popup = $("card-popup");
  if(!popup) return;
  const box = popup.querySelector(".big-popup-box");
  if(!box) return;
  let sx=0, sy=0;
  box.addEventListener("touchstart", e=>{ sx=e.touches[0].clientX; sy=e.touches[0].clientY; }, {passive:true});
  box.addEventListener("touchend", e=>{
    if(!popup.classList.contains("show")) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = Math.abs(e.changedTouches[0].clientY - sy);
    if(Math.abs(dx) > 60 && dy < 80){ dx < 0 ? nextCard() : prevCard(); }
  }, {passive:true});
  let mx=0, md=false;
  box.addEventListener("mousedown", e=>{ md=true; mx=e.clientX; });
  box.addEventListener("mouseup", e=>{ if(!md) return; md=false; const dx=e.clientX-mx; if(Math.abs(dx)>80) dx<0?nextCard():prevCard(); });
})();
["sleep-hours","soreness","rest-days","energy"].forEach(id => safe(id, el => el.addEventListener("input", updateRecovery)));
const resultInputIds = new Set(["user-name", "check-date", "age", "bodyweight", "sex", "equipment", "lift-type", "attempt-number", "target-weight", "prior-success", "sleep-hours", "soreness", "rest-days", "energy"]);
document.addEventListener("input", event => {
  if (resultInputIds.has(event.target?.id)) {
    setResultState("empty");
    setStatus("READY TO CHECK");
  }
});
document.addEventListener("change", event => {
  if (resultInputIds.has(event.target?.id)) {
    setResultState("empty");
    setStatus("READY TO CHECK");
  }
});
autoFillDate();
updateWeight(100);
updateRecovery();
renderHistory();
setResultState("empty");
setStatus("READY");
console.log("PR-or-Hospital JS loaded - FINAL - Positive Lift Score + Swipe + Icons Only + 04 Analysis + 05 How It Works");