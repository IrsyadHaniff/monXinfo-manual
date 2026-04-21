import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-analytics.js";
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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const totalRef = ref(db, "visitors/total");

const today = new Date().toISOString().split("T")[0];

// Cek apakah sudah visit hari ini
function sudahVisitHariIni() {
  const data = localStorage.getItem("visit_data");
  if (!data) return false;
  const { date } = JSON.parse(data);
  const today = new Date().toISOString().split("T")[0];
  return date === today;
}

function tandaiSudahVisit() {
  localStorage.setItem("visit_data", JSON.stringify({ date: today }));
}

// Hanya hitung 1x per hari, meski tab ditutup & dibuka lagi
if (!sudahVisitHariIni()) {
  runTransaction(totalRef, (current) => (current || 0) + 1)
    .then(() => {
      tandaiSudahVisit();
    })
    .catch((err) => console.error("Gagal update visitor:", err));
}

// Tampilkan total visitor — tidak pernah reset
onValue(totalRef, (snapshot) => {
  const count = snapshot.val() || 0;
  const el = document.getElementById("visitor-count");
  const bar = document.getElementById("visitor-bar");

  if (el) el.textContent = count.toLocaleString("id-ID");
  if (bar) bar.style.width = Math.min((count / 2000) * 100, 100) + "%";
});
