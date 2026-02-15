import { auth, db } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import {
  collection, addDoc, getDocs, doc, deleteDoc, updateDoc,
  query, orderBy, Timestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const LS_KEY = "selectedTracker";
let uid = null;
let trackers = [];
let currentTracker = null;
let editingPayment = null;

const loginBtn = document.getElementById("loginBtn");
const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");

loginBtn.onclick = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};

onAuthStateChanged(auth, user => {
  if (!user) return;
  uid = user.uid;
  loginView.classList.add("d-none");
  appView.classList.remove("d-none");
  loadTrackers();
});

async function loadTrackers() {
  const snap = await getDocs(collection(db, "users", uid, "trackers"));
  trackers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderTabs();
}

function renderTabs() {
  const ul = document.getElementById("trackerTabs");
  ul.innerHTML = "";

  trackers.forEach(t => {
    const li = document.createElement("li");
    li.className = "nav-item";

    const btn = document.createElement("button");
    btn.className = "nav-link" + (currentTracker?.id === t.id ? " active" : "");
    btn.textContent = t.name;

    btn.onclick = () => focusTrackerTab(t);

    li.appendChild(btn);
    ul.appendChild(li);
  });


  const plus = document.createElement("li");
  plus.innerHTML = `<button class="nav-link">+</button>`;
  plus.onclick = () => new bootstrap.Modal("#trackerModal").show();
  ul.appendChild(plus);

  const stored = localStorage.getItem(LS_KEY);
  const found = trackers.find(t => t.name === stored);
  if (found) selectTracker(found);
  else if (trackers.length) selectTracker(trackers[0]);
  else localStorage.setItem(LS_KEY, "");
}

async function focusTrackerTab(tracker) {
    selectTracker(tracker);
    renderTabs();
    loadPayments();
    const active = document.querySelector("#trackerTabs .nav-link.active");
    active?.scrollIntoView({ behavior: "smooth", inline: "center" });
}

async function selectTracker(tracker) {
  currentTracker = tracker;
  localStorage.setItem(LS_KEY, tracker.name);
  document.getElementById("trackerContent").classList.remove("d-none");
}

async function loadPayments() {
  const q = query(
    collection(db, "users", uid, "trackers", currentTracker.id, "payments"),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);

  let total = 0;
  const tbody = document.getElementById("paymentsTable");
  tbody.innerHTML = "";

  snap.docs.forEach((d, i) => {
    const p = d.data();
    total += p.amount;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.date.toDate().toLocaleDateString()}</td>
      <td>${p.amount.toFixed(2)}</td>
      <td><button class="btn btn-sm">✎</button></td>
    `;
    tr.querySelector("button").onclick = () => editPayment(d.id, p);
    tbody.appendChild(tr);
  });

  document.getElementById("totalAmount").textContent = `Total: $${total.toFixed(2)}`;
}

document.getElementById("confirmCreateTracker").onclick = async () => {
  const name = document.getElementById("trackerNameInput").value.trim();
  if (!name || trackers.some(t => t.name === name)) return;

  await addDoc(collection(db, "users", uid, "trackers"), {
    name,
    createdAt: Timestamp.now()
  });

  bootstrap.Modal.getInstance("#trackerModal").hide();
  document.getElementById("trackerNameInput").value = "";
  loadTrackers();
};

document.getElementById("addPaymentBtn").onclick = () => {
  editingPayment = null;
  document.getElementById("paymentDate").valueAsDate = new Date();
  document.getElementById("paymentAmount").value = "";
  document.getElementById("deletePaymentBtn").classList.add("d-none");
  new bootstrap.Modal("#paymentModal").show();
};

async function editPayment(id, data) {
  editingPayment = id;
  document.getElementById("paymentDate").value =
    data.date.toDate().toISOString().substring(0, 10);
  document.getElementById("paymentAmount").value = data.amount;
  document.getElementById("deletePaymentBtn").classList.remove("d-none");
  new bootstrap.Modal("#paymentModal").show();
}

async function savePayment() {
  const date = new Date(document.getElementById("paymentDate").value);
  const amount = parseFloat(document.getElementById("paymentAmount").value);

  const ref = collection(
    db,
    "users",
    uid,
    "trackers",
    currentTracker.id,
    "payments"
  );

  if (editingPayment) {
    await updateDoc(doc(ref, editingPayment), {
      date: Timestamp.fromDate(date),
      amount
    });
  } else {
    await addDoc(ref, {
      date: Timestamp.fromDate(date),
      amount,
      createdAt: Timestamp.now()
    });
  }

  bootstrap.Modal.getInstance("#paymentModal").hide();
  loadPayments();
}


document.getElementById("savePaymentBtn").onclick = () => {
  if (editingPayment) {
    new bootstrap.Modal("#confirmModal").show();
  } else {
    savePayment();
  }
};

document.getElementById("confirmActionBtn").onclick = async () => {
  bootstrap.Modal.getInstance("#confirmModal").hide();
  await savePayment();
};

document.getElementById("deletePaymentBtn").onclick = () => {
  new bootstrap.Modal("#deleteConfirmModal").show();
};

document.getElementById("deleteTextInput").oninput = e => {
  document.getElementById("finalDeleteBtn").disabled = e.target.value !== "eliminar";
};

document.getElementById("finalDeleteBtn").onclick = async () => {
  const ref = doc(
    db,
    "users",
    uid,
    "trackers",
    currentTracker.id,
    "payments",
    editingPayment
  );
  await deleteDoc(ref);
  bootstrap.Modal.getInstance("#deleteConfirmModal").hide();
  bootstrap.Modal.getInstance("#paymentModal").hide();
  loadPayments();
};

document.getElementById("trackerFilter").oninput = e => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll("#trackerTabs .nav-link").forEach(btn => {
    const visible = btn.textContent.toLowerCase().includes(term) || btn.textContent === "+";
    btn.parentElement.style.display = visible ? "" : "none";
  });
};
