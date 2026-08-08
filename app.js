const USER = "admin";
const PASS = "1234";
const TOTAL = 20;

let data = JSON.parse(localStorage.getItem("hospitalData") || "[]");
let selected = -1;

function login() {
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

function loginDiv(show) {
    document.getElementById("login").hidden = !show;
    document.getElementById("app").hidden = show;
}

function logout() {
    loginDiv(true);
    document.getElementById("u").value = "";
    document.getElementById("p").value = "";
}

function admit() {
    const name = document.getElementById("name").value.trim();
    const id = document.getElementById("pid").value.trim();
    const ward = document.getElementById("ward").value;
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

    const bed = Array.from(
        { length: TOTAL },
        (_, i) => i + 1
    ).find(number => !usedBeds.includes(number));

    if (!bed) {
        msg.textContent = "No beds available.";
        return;
    }

    data.push({
        n: name,
        id: id,
        w: ward,
        bed: bed
    });

    save();

    document.getElementById("name").value = "";
    document.getElementById("pid").value = "";
    document.getElementById("ward").value = "";

    msg.textContent = "Patient admitted successfully.";

    render();
}

function discharge() {
    const msg = document.getElementById("msg");

    if (selected < 0) {
        msg.textContent = "Select a patient row first.";
        return;
    }

    data.splice(selected, 1);
    selected = -1;

    save();

    msg.textContent = "Patient discharged successfully.";

    render();
}

function save() {
    localStorage.setItem(
        "hospitalData",
        JSON.stringify(data)
    );
}

function render() {
    document.getElementById("total").textContent = TOTAL;
    document.getElementById("free").textContent =
        TOTAL - data.length;
    document.getElementById("occ").textContent =
        data.length;

    const rows = document.getElementById("rows");

    rows.innerHTML = data.map((patient, index) => `
        <tr onclick="selectPatient(${index})">
            <td>${safe(patient.n)}</td>
            <td>${safe(patient.id)}</td>
            <td>${safe(patient.w)}</td>
            <td>${patient.bed}</td>
        </tr>
    `).join("");

    const beds = document.getElementById("beds");

    beds.innerHTML = Array.from(
        { length: TOTAL },
        (_, index) => {
            const number = index + 1;
            const occupied = data.some(
                patient => patient.bed === number
            );

            return `
                <div class="bed ${occupied ? "taken" : ""}">
                    ${number}
                </div>
            `;
        }
    ).join("");
}

function selectPatient(index) {
    selected = index;
    render();
}

function safe(value) {
    return String(value).replace(/[&<>"]/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;"
    }[character]));
}

function csv() {
    let output = "Name,ID,Ward,Bed\n";

    output += data.map(patient => {
        return [
            patient.n,
            patient.id,
            patient.w,
            patient.bed
        ].map(value =>
            `"${String(value).replaceAll('"', '""')}"`
        ).join(",");
    }).join("\n");

    const blob = new Blob(
        [output],
        { type: "text/csv" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "hospital-bed-report.csv";
    link.click();

    URL.revokeObjectURL(url);
}
