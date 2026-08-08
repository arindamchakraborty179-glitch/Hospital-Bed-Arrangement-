const USER = "admin";
const PASS = "1234";
const TOTAL = 20;

let data = JSON.parse(localStorage.getItem("hospitalData") || "[]");
let selected = -1;

function dologin() {
  const username = document.getElementById("u").value.trim();
  const password = document.getElementById("p").value;

  if (username === USER && password === PASS) {
    document.getElementById("login").hidden = true;
    document.getElementById("app").hidden = false;
    document.getElementById("err").textContent = "";
    render();
  } else {
    document.getElementById("err").textContent =
      "Invalid username or password";
  }
}

function logout() {
  loginDiv(true);
  document.getElementById("u").value = "";
  document.getElementById("p").value = "";
}

function loginDiv(show) {
  document.getElementById("login").hidden = !show;
  document.getElementById("app").hidden = show;
}

function admit() {
  const name = document.getElementById("name").value.trim();
  const id = document.getElementById("pid").value.trim();
  const ward = document.getElementById("ward").value.trim();
  const msg = document.getElementById("msg");

  if (!name || !id || !ward) {
    msg.textContent = "Enter Name, ID and Ward.";
    return;
  }

  if (data.some(patient => patient.id === id)) {
    msg.textContent = "Patient ID already exists.";
    return;
  }

  const usedBeds = data.map(patient => patient.bed);
  const availableBeds = Array.from(
    { length: TOTAL },
    (_, i) => i + 1
  ).filter(number => !usedBeds.includes(number));

  if (!availableBeds.length) {
    msg.textContent = "No beds available.";
    return;
  }

  data.push({
    n: name,
    id: id,
    w: ward,
    bed: availableBeds[0]
  });

  save();
  render();

  document.getElementById("name").value = "";
  document.getElementById("pid").value = "";
  document.getElementById("ward").value = "";

  msg.textContent = "Patient admitted successfully.";
}

function discharge() {
  if (selected < 0 || selected >= data.length) {
    document.getElementById("msg").textContent =
      "Select a patient row first.";
    return;
  }

  data.splice(selected, 1);
  selected = -1;

  save();
  render();

  document.getElementById("msg").textContent =
    "Patient discharged successfully.";
}

function save() {
  localStorage.setItem("hospitalData", JSON.stringify(data));
}

function render() {
  const total = document.getElementById("total");
  const free = document.getElementById("free");
  const rows = document.getElementById("rows");
  const beds = document.getElementById("beds");

  if (total) {
    total.textContent = TOTAL;
  }

  if (free) {
    free.textContent = TOTAL - data.length;
  }

  if (rows) {
    rows.innerHTML = data
      .map(
        (patient, index) => `
        <tr onclick="selectPatient(${index})">
          <td>${escapeHTML(patient.n)}</td>
          <td>${escapeHTML(patient.id)}</td>
          <td>${escapeHTML(patient.w)}</td>
          <td>${patient.bed}</td>
        </tr>
      `
      )
      .join("");
  }

  if (beds) {
    beds.innerHTML = "";

    for (let i = 1; i <= TOTAL; i++) {
      const occupied = data.some(patient => patient.bed === i);

      const bed = document.createElement("div");
      bed.className = occupied ? "bed occupied" : "bed free";
      bed.textContent = i;

      beds.appendChild(bed);
    }
  }
}

function selectPatient(index) {
  selected = index;
  document.getElementById("msg").textContent =
    "Patient selected: " + data[index].n;
}

function csv() {
  let text = "Name,ID,Ward,Bed\n";

  data.forEach(patient => {
    text += [
      patient.n,
      patient.id,
      patient.w,
      patient.bed
    ]
      .map(value => `"${String(value).replace(/"/g, '""')}"`)
      .join(",") + "\n";
  });

  const blob = new Blob([text], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "hospital_patients.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.login = login;
window.logout = logout;
window.loginDiv = loginDiv;
window.admit = admit;
window.discharge = discharge;
window.csv = csv;
window.save = save;
window.render = render;
window.selectPatient = selectPatient;

render();
