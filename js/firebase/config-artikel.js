import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDl6yEZtmRZl0IJb12rHYxSbzN6Jp7fWgI",
  authDomain: "monxinfo-manual-visitor.firebaseapp.com",
  databaseURL: "https://monxinfo-manual-visitor-default-rtdb.firebaseio.com",
  projectId: "monxinfo-manual-visitor",
  storageBucket: "monxinfo-manual-visitor.firebasestorage.app",
  messagingSenderId: "837409120846",
  appId: "1:837409120846:web:190addc2e5ac59d0d2d91f",
};

// Buat cegah duplicate app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

const totalRef = ref(db, "visitors/total");

const articleKey =
  "views_" +
  window.location.pathname
    .replace(/\//g, "__")
    .replace(/\.html$/, "")
    .replace(/^__/, "");

const articleRef = ref(db, `article_views/${articleKey}`);

const today = new Date().toISOString().split("T")[0];

// Logika apabila sudah visit hari ini
function sudahVisitHariIni() {
  const data = localStorage.getItem("visit_data");
  if (!data) return false;
  return JSON.parse(data).date === today;
}

function sudahViewArtikelHariIni() {
  const data = localStorage.getItem(articleKey);
  if (!data) return false;
  return JSON.parse(data).date === today;
}

// Buat hitung total visitor global
if (!sudahVisitHariIni()) {
  runTransaction(totalRef, (current) => (current || 0) + 1)
    .then(() => {
      localStorage.setItem("visit_data", JSON.stringify({ date: today }));
    })
    .catch((err) => console.error("Gagal update visitor:", err));
}

// Buat hitung view artikel
if (!sudahViewArtikelHariIni()) {
  runTransaction(articleRef, (current) => (current || 0) + 1)
    .then(() => {
      localStorage.setItem(articleKey, JSON.stringify({ date: today }));
    })
    .catch((err) => console.error("Gagal update article view:", err));
}

// Menampilkan total visitor
onValue(totalRef, (snapshot) => {
  const count = snapshot.val() || 0;
  const el = document.getElementById("visitor-count");
  const bar = document.getElementById("visitor-bar");
  if (el) el.textContent = count.toLocaleString("id-ID");
  if (bar) bar.style.width = Math.min((count / 2000) * 100, 100) + "%";
});

// Menampilkan view artikel
onValue(articleRef, (snapshot) => {
  const views = snapshot.val() || 0;
  const el = document.getElementById("article-view-count");
  if (el) el.textContent = views.toLocaleString("id-ID") + " kali dilihat";
});
