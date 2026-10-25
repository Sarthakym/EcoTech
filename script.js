const $ = id => document.getElementById(id);
const storeKey = "ecotechDataV2";
const pickupWhatsAppNumber = "918275470063";

// Works in older Windows browsers that do not support structuredClone.
const cloneData = value => JSON.parse(JSON.stringify(value));

const defaultData = {
  points: 145,
  pickups: [],
  scans: 0,
  quizCorrect: 0,
  quizAnswered: 0,
  contacts: 0,
  activity: []
};

let data;
try {
  data = JSON.parse(localStorage.getItem(storeKey)) || cloneData(defaultData);
} catch {
  data = cloneData(defaultData);
}

function save() {
  try { localStorage.setItem(storeKey, JSON.stringify(data)); } catch (err) { /* Website still works if storage is blocked. */ }
  updateDashboard();
}

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

function toggleMenu() {
  const n = $("nav");
  n.classList.toggle("open");
}

document.querySelectorAll("#nav a").forEach(a => {
  a.addEventListener("click", () => $("nav").classList.remove("open"));
});

function addActivity(message) {
  data.activity.push({
    message,
    time: new Date().toLocaleString("en-IN", {dateStyle:"medium", timeStyle:"short"})
  });
  if (data.activity.length > 10) data.activity.shift();
  save();
}

function updateDashboard() {
  $("points").textContent = data.points;
  $("dashPoints").textContent = data.points;
  $("dashPickups").textContent = data.pickups.length;
  $("dashScans").textContent = data.scans;
  $("dashQuiz").textContent = `${data.quizCorrect}/5`;
  $("activity").innerHTML = data.activity.length
    ? data.activity.slice().reverse().map(x =>
        `<p>• ${escapeHTML(x.message)} <small>(${escapeHTML(x.time)})</small></p>`
      ).join("")
    : "No activity yet. Use the forms or vending machine above.";
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

function clearActivity() {
  if (!confirm("Clear all demo activity, pickup requests, points and machine scans?")) return;
  data = cloneData(defaultData);
  qi = 0;
  runCorrect = 0;
  loadQuestion();
  save();
  $("machineScreen").innerHTML = "READY<br><small>SELECT AN ITEM</small>";
  $("pickupWhatsAppStatus").hidden = true;
  $("pickupWhatsAppLink").removeAttribute("href");
  toast("Demo data cleared.");
}

function pickupWhatsAppUrl(item) {
  const message = [
    "EcoTech | E-Waste Pickup Request",
    "",
    `Name: ${item.name}`,
    `Mobile: ${item.mobile}`,
    `Address: ${item.address}`,
    `E-waste type: ${item.type}`,
    `Quantity: ${item.qty}`,
    `Preferred date: ${item.date}`,
    `Preferred time: ${item.time}`,
    "",
    "Please confirm whether this pickup can be arranged."
  ].join("\n");
  return `https://wa.me/${pickupWhatsAppNumber}?text=${encodeURIComponent(message)}`;
}

$("pickupForm").addEventListener("submit", e => {
  e.preventDefault();
  const form = e.target;
  $("pName").setCustomValidity($("pName").value.trim() ? "" : "Enter your name.");
  $("pAddress").setCustomValidity($("pAddress").value.trim() ? "" : "Enter your pickup address.");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const item = {
    name: $("pName").value.trim(),
    mobile: $("pMobile").value.trim(),
    address: $("pAddress").value.trim(),
    type: $("pType").value,
    qty: Number($("pQty").value),
    date: $("pDate").value,
    time: $("pTime").value
  };

  data.pickups.push(item);
  addActivity(`Pickup draft saved for ${item.type} (${item.qty} item(s)) on ${item.date}, ${item.time}. Send the prepared WhatsApp message to deliver this request.`);
  const url = pickupWhatsAppUrl(item);
  $("pickupWhatsAppLink").href = url;
  $("pickupWhatsAppStatus").hidden = false;
  form.reset();
  $("pDate").min = new Date().toISOString().split("T")[0];
  // Open during the submit gesture; the visible link also works if pop-ups are blocked.
  try {
    window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    toast("Saved locally. Use the WhatsApp message link below to continue.");
    return;
  }
  toast("Saved locally. Tap Send in WhatsApp to deliver your request.");
});

$("contactForm").addEventListener("submit", e => {
  e.preventDefault();
  if (!e.target.checkValidity()) {
    e.target.reportValidity();
    return;
  }
  data.contacts++;
  addActivity(`Contact message submitted by ${$("cName").value.trim()}.`);
  e.target.reset();
  toast("Demo message saved locally; no email was sent. ");
});

function redeem() {
  if (data.points >= 100) {
    data.points -= 100;
    addActivity("Redeemed 100 Eco Points for a demo reward.");
    toast("Demo reward redeemed ");
  } else {
    toast("You need at least 100 points.");
  }
}

function scan(type, pts) {
  data.scans++;
  data.points += pts;
  $("machineScreen").innerHTML =
    `${escapeHTML(type.toUpperCase())} DETECTED<br><small>+${pts} ECO POINTS</small>`;
  addActivity(`Vending machine: ${type} scanned, +${pts} points.`);
  toast(`+${pts} Eco Points added`);
}

const centers = [
  {name:"Eco Collection Point - Demo",city:"Loni",items:"Mobiles, chargers, cables",time:"Demo listing"},
  {name:"Green Electronics Hub - Demo",city:"Sangamner",items:"Computers, peripherals",time:"Demo listing"},
  {name:"Responsible Recycling Center - Demo",city:"Nashik",items:"Mixed small e-waste",time:"Demo listing"},
  {name:"Campus E-Waste Desk - Demo",city:"Loni",items:"Small electronics",time:"College prototype"}
];

function renderCenters(list = centers) {
  $("centerList").innerHTML = list.length
    ? list.map(c => `<article class="card">
        <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 10c0 6-7 12-7 12S5 16 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></svg></div>
        <h3>${escapeHTML(c.name)}</h3>
        <p><b>City:</b> ${escapeHTML(c.city)}</p>
        <p><b>Accepts:</b> ${escapeHTML(c.items)}</p>
        <p><b>Hours:</b> ${escapeHTML(c.time)}</p>
      </article>`).join("")
    : `<div class="card empty">No matching demo center found.</div>`;
}

function filterCenters() {
  const q = $("centerSearch").value.trim().toLowerCase();
  renderCenters(centers.filter(c =>
    `${c.name} ${c.city} ${c.items}`.toLowerCase().includes(q)
  ));
}

$("centerSearch").addEventListener("input", filterCenters);

const questions = [
  ["What is e-waste?",["Discarded electronic and electrical products","Only food waste","Garden waste","Rainwater"],0],
  ["Which is a responsible option for an old phone?",["Throw it in a river","Give it to an appropriate collection/recycling channel","Burn it","Bury it"],1],
  ["Before recycling a computer, what should you do with personal data?",["Share it","Back it up and securely remove it","Print it","Ignore it"],1],
  ["Which item can be e-waste?",["Charger","Banana","Paper napkin","Cotton shirt"],0],
  ["Why recycle e-waste?",["To recover materials and reduce environmental impact","To increase landfill waste","To waste resources","None"],0]
];

let qi = 0;
let runCorrect = 0;
let answered = false;

function loadQuestion() {
  const q = questions[qi];
  $("qText").textContent = `${qi + 1}. ${q[0]}`;
  $("options").innerHTML = q[1].map((x,i) =>
    `<button class="option" onclick="answer(${i})">${String.fromCharCode(65+i)}. ${escapeHTML(x)}</button>`
  ).join("");
  $("quizResult").textContent = "";
  answered = false;
}

function answer(i) {
  if (answered) return;
  answered = true;

  const q = questions[qi];
  const buttons = [...document.querySelectorAll(".option")];
  buttons[i].classList.add(i === q[2] ? "correct" : "wrong");
  if (i !== q[2]) buttons[q[2]].classList.add("correct");

  data.quizAnswered++;
  if (i === q[2]) {
    runCorrect++;
    data.quizCorrect = runCorrect;
    $("quizResult").textContent = " Correct!";
  } else {
    $("quizResult").textContent = " Not quite. The highlighted answer is correct.";
  }
  addActivity(`Quiz question ${qi + 1}: ${i === q[2] ? "correct" : "incorrect"}.`);
}

function nextQuestion() {
  if (!answered) {
    toast("Please answer the current question first.");
    return;
  }
  if (qi < questions.length - 1) {
    qi++;
    loadQuestion();
  } else {
    toast(`Quiz completed: ${data.quizCorrect}/5 correct `);
    qi = 0;
    runCorrect = 0;
    data.quizCorrect = 0;
    data.quizAnswered = 0;
    save();
    loadQuestion();
  }
}

$("pDate").min = new Date().toISOString().split("T")[0];
renderCenters();
loadQuestion();
updateDashboard();
