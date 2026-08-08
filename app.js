const TOTAL = 50;

let data = JSON.parse(localStorage.getItem("hospitalData") || "[]");
let selected = -1;


// ===============================
// DIRECT DASHBOARD
// ===============================
function openDashboard() {
  const loginPage = document.getElementById("login");
  const app = document.getElementById("app");

  if (loginPage) loginPage.hidden = true;
  if (app) app.hidden = false;

  render();
}


// ===============================
// LOGIN
// ===============================
function dologin() {
  const username = document.getElementById("u")?.value.trim();
  const password = document.getElementById("p")?.value;

  if (username === "admin" && password === "1234") {
    openDashboard();

    const err = document.getElementById("err");
    if (err) err.textContent = "";
  } else {
    const err = document.getElementById("err");
    if (err) err.textContent = "Invalid username or password";
  }
}


// ===============================
// LOGOUT
// ===============================
function logout() {
  const loginPage = document.getElementById("login");
  const app = document.getElementById("app");

  if (loginPage) loginPage.hidden = false;
  if (app) app.hidden = true;

  const u = document.getElementById("u");
  const p = document.getElementById("p");

  if (u) u.value = "";
  if (p) p.value = "";
}


// ===============================
// LOGIN DIV
// ===============================
function loginDiv(show) {
  const loginPage = document.getElementById("login");
  const app = document.getElementById("app");

  if (loginPage) loginPage.hidden = !show;
  if (app) app.hidden = show;
}


// ===============================
// ADMIT PATIENT
// ===============================
function admit() {

  const nameEl = document.getElementById("name");
  const idEl = document.getElementById("pid");
  const wardEl = document.getElementById("ward");
  const msg = document.getElementById("msg");

  const name = nameEl ? nameEl.value.trim() : "";
  const id = idEl ? idEl.value.trim() : "";
  const ward = wardEl ? wardEl.value.trim() : "";

  if (!name || !id || !ward) {
    if (msg) msg.textContent = "Enter Name, ID and Ward.";
    return;
  }

  // Check duplicate ID
  if (data.some(patient => patient.id === id)) {
    if (msg) msg.textContent = "Patient ID already exists.";
    return;
  }

  // Find free bed
  const usedBeds = data.map(patient => Number(patient.bed));

  const availableBeds = [];

  for (let i = 1; i <= TOTAL; i++) {
    if (!usedBeds.includes(i)) {
      availableBeds.push(i);
    }
  }

  if (availableBeds.length === 0) {
    if (msg) msg.textContent = "No beds available.";
    return;
  }

  // Add patient
  data.push({
    n: name,
    id: id,
    w: ward,
    bed: availableBeds[0]
  });

  selected = -1;

  save();
  render();

  // Clear inputs
  if (nameEl) nameEl.value = "";
  if (idEl) idEl.value = "";
  if (wardEl) wardEl.value = "";

  if (msg) {
    msg.textContent =
      "Patient admitted successfully. Bed " +
      availableBeds[0] +
      " assigned.";
  }
}


// ===============================
// DISCHARGE PATIENT
// ===============================
function discharge() {

  const msg = document.getElementById("msg");

  if (selected < 0 || selected >= data.length) {
    if (msg) {
      msg.textContent = "Select a patient row first.";
    }
    return;
  }

  const patientName = data[selected].n;
  const bedNumber = data[selected].bed;

  // Remove selected patient
  data.splice(selected, 1);

  selected = -1;

  save();
  render();

  if (msg) {
    msg.textContent =
      patientName +
      " discharged successfully. Bed " +
      bedNumber +
      " is now free.";
  }
}


// ===============================
// SAVE DATA
// ===============================
function save() {
  localStorage.setItem(
    "hospitalData",
    JSON.stringify(data)
  );
}


// ===============================
// RENDER DASHBOARD
// ===============================
function render() {

  const total = document.getElementById("total");
  const free = document.getElementById("free");
  const occupied = document.getElementById("occupied");
  const rows = document.getElementById("rows");
  const beds = document.getElementById("beds");

  // Total beds
  if (total) {
    total.textContent = TOTAL;
  }

  // Occupied beds
  const occupiedCount = data.length;

  if (occupied) {
    occupied.textContent = occupiedCount;
  }

  // Free beds
  if (free) {
    free.textContent = TOTAL - occupiedCount;
  }


  // =========================
  // PATIENT RECORDS
  // =========================
  if (rows) {

    rows.innerHTML = "";

    data.forEach((patient, index) => {

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${escapeHTML(patient.n)}</td>
        <td>${escapeHTML(patient.id)}</td>
        <td>${escapeHTML(patient.w)}</td>
        <td>${patient.bed}</td>
      `;

      tr.onclick = function () {
        selectPatient(index);
      };

      // Highlight selected row
      if (index === selected) {
        tr.style.background = "#333";
      }

      rows.appendChild(tr);
    });
  }


  // =========================
  // BED MAP
  // =========================
  if (beds) {

    beds.innerHTML = "";

    for (let i = 1; i <= TOTAL; i++) {

      const patientIndex = data.findIndex(
        patient => Number(patient.bed) === i
      );

      const bed = document.createElement("div");

      if (patientIndex !== -1) {

        bed.className = "bed occupied";
        bed.textContent = i;

        bed.title =
          "Occupied by " +
          data[patientIndex].n;

        bed.onclick = function () {
          selectPatient(patientIndex);
        };

      } else {

        bed.className = "bed free";
        bed.textContent = i;

        bed.title = "Free Bed " + i;
      }

      beds.appendChild(bed);
    }
  }
}


// ===============================
// SELECT PATIENT
// ===============================
function selectPatient(index) {

  if (index < 0 || index >= data.length) {
    return;
  }

  selected = index;

  const msg = document.getElementById("msg");

  if (msg) {
    msg.textContent =
      "Selected: " +
      data[index].n +
      " | Bed " +
      data[index].bed;
  }

  render();
}


// ===============================
// EXPORT CSV
// ===============================
function csv() {

  let text = "Name,ID,Ward,Bed\n";

  data.forEach(patient => {

    text += [
      patient.n,
      patient.id,
      patient.w,
      patient.bed
    ]
      .map(value =>
        `"${String(value).replace(/"/g, '""')}"`
      )
      .join(",") + "\n";
  });


  const blob = new Blob(
    [text],
    {
      type: "text/csv;charset=utf-8;"
    }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "hospital_patients.csv";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}


// ===============================
// ESCAPE HTML
// ===============================
function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ===============================
// GLOBAL FUNCTIONS
// ===============================
window.dologin = dologin;
window.login = dologin;
window.logout = logout;
window.loginDiv = loginDiv;
window.admit = admit;
window.discharge = discharge;
window.csv = csv;
window.save = save;
window.render = render;
window.selectPatient = selectPatient;


// ===============================
// START DIRECTLY WITH DASHBOARD
// ===============================
openDashboard();
