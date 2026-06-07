import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getDatabase, ref, push, onValue, get, set, update } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

// CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCWeaXfGKcMy8JN3vtO-oqobO3n85XJzO4",
  authDomain: "monxinfoid.firebaseapp.com",
  databaseURL: "https://monxinfoid-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "monxinfoid",
  storageBucket: "monxinfoid.firebasestorage.app",
  messagingSenderId: "261274105717",
  appId: "1:261274105717:web:257d531b3305ed4bab453c",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ARTICLE_ID =
  location.pathname
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.html?$/i, "")
    .replace(/[.#$\[\]\/]/g, "_")
    .replace(/_+/g, "_") || "home";

console.log("ARTICLE_ID:", ARTICLE_ID);

const commentsRef = ref(db, "comments/" + ARTICLE_ID);

let replyTarget = null;

// Balasan terbaru yang baru dikirim, supaya tetap terlihat dulu
let latestVisibleReply = null;

// HELPERS
const COLORS = ["cmn-av-green", "cmn-av-blue", "cmn-av-amber", "cmn-av-pink", "cmn-av-red"];

function getInitials(name) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??"
  );
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

function renderText(text) {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/(@[\w\s]+?)(?=\s|$)/g, '<span class="mention">$1</span>');
}

function formatTimeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return Math.floor(diff / 60) + " menit lalu";
  if (diff < 86400) return Math.floor(diff / 3600) + " jam lalu";
  return Math.floor(diff / 86400) + " hari lalu";
}

function cmnToast(msg, isError) {
  const t = document.getElementById("cmn-toast");
  t.textContent = msg;
  t.style.background = isError ? "#dc2626" : "#059669";
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}

// Jumlah input
document.getElementById("cmn-inp-text").addEventListener("input", function () {
  document.getElementById("cmn-char-left").textContent = 500 - this.value.length;
});

// tombol anonim
document.getElementById("cmn-anonim").addEventListener("change", function () {
  const nameInput = document.getElementById("cmn-inp-name");
  if (this.checked) {
    nameInput.value = "AnonimonXinfo";
    nameInput.disabled = true;
    nameInput.style.opacity = "0.5";
  } else {
    nameInput.value = "";
    nameInput.disabled = false;
    nameInput.style.opacity = "1";
  }
});

// REPLY Balas Komen
window.cmnReply = function (name, commentId) {
  replyTarget = {
    id: commentId,
    name: name,
  };

  const t = document.getElementById("cmn-inp-text");
  t.value = "@" + name + " ";
  document.getElementById("cmn-char-left").textContent = 500 - t.value.length;
  t.focus();

  document.getElementById("cmn-inp-name").scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
};

// ── LIKE ─────────────────────────────────────────────────
window.cmnLike = function (btn, commentId) {
  const liked = btn.dataset.liked === "1";
  const span = btn.querySelector("span");

  // Optimistic UI
  const newCount = parseInt(span.textContent) + (liked ? -1 : 1);
  span.textContent = newCount;
  btn.dataset.liked = liked ? "0" : "1";
  btn.classList.toggle("liked", !liked);

  // Tandai komentar ini sedang di-like, skip re-render
  likingInProgress.add(commentId);

  const likeRef = ref(db, "comments/" + ARTICLE_ID + "/" + commentId + "/likes");

  get(likeRef).then((snap) => {
    const current = snap.val() || 0;
    return set(likeRef, Math.max(0, current + (liked ? -1 : 1)));
  }).finally(() => {
    likingInProgress.delete(commentId);
  });
};

//  KIRIM KOMENTAR
window.cmnSubmit = function () {
  const nameEl = document.getElementById("cmn-inp-name");
  const textEl = document.getElementById("cmn-inp-text");
  const name = nameEl.value.trim();
  const text = textEl.value.trim();

  if (!name) {
    cmnToast("Nama tidak boleh kosong", true);
    return;
  }
  if (!text) {
    cmnToast("Komentar tidak boleh kosong", true);
    return;
  }

  const btn = document.querySelector(".cmn-submit");
  btn.disabled = true;
  btn.textContent = "Mengirim…";

  const activeReplyTarget = replyTarget
    ? {
        id: replyTarget.id,
        name: replyTarget.name,
      }
    : null;

  const newCommentRef = push(commentsRef);

  if (activeReplyTarget) {
    latestVisibleReply = {
      parentId: activeReplyTarget.id,
      replyId: newCommentRef.key,
    };
  }

  set(newCommentRef, {
    name,
    text,
    timestamp: Date.now(),
    likes: 0,
    parentId: activeReplyTarget ? activeReplyTarget.id : "",
    replyToName: activeReplyTarget ? activeReplyTarget.name : "",
  })
    .then(() => {
      nameEl.value = "";
      textEl.value = "";
      replyTarget = null;
      document.getElementById("cmn-char-left").textContent = "500";
      document.getElementById("cmn-anonim").checked = false;
      nameEl.disabled = false;
      nameEl.style.opacity = "1";
      cmnToast("Komentar berhasil dikirim!");
    })
    .catch((error) => {
      console.error("Firebase error:", error.code, error.message);

      if (activeReplyTarget) {
        latestVisibleReply = null;
      }

      cmnToast("Gagal mengirim: " + (error.code || error.message), true);
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Kirim Komentar";
    });
};

//  BUILD ELEMEN KOMENTAR
function buildCommentEl(comment, replies = [], isReply = false) {
  const item = document.createElement("div");
  item.className = "cmn-item";
  const initials = getInitials(comment.name);
  const colorClass = COLORS[hashCode(comment.name) % COLORS.length];
  const timeAgo = formatTimeAgo(comment.timestamp);

  const safeName = comment.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeNameForJs = comment.name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  item.innerHTML = `
    <div class="cmn-avatar ${colorClass}">${initials}</div>
    <div class="cmn-body">
      <div class="cmn-meta">
        <span class="cmn-name text-zinc-900 dark:text-zinc-100">${safeName}</span>
        <span class="cmn-time">${timeAgo}</span>
      </div>
      <p class="cmn-text">${renderText(comment.text)}</p>
      <div class="cmn-actions">
        <button class="cmn-btn" data-liked="0" onclick="cmnLike(this, '${comment.id}')">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
          </svg>
          <span>${comment.likes || 0}</span>
        </button>

        ${
          !isReply
            ? `<button class="cmn-btn" onclick="cmnReply('${safeNameForJs}', '${comment.id}')">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
              </svg>
              Balas
            </button>`
            : ""
        }
      </div>
    </div>`;

  // replay-komentar
  if (replies.length > 0) {
    const BATCH = 3;
    let shown = 0;

    let pinnedReply =
      latestVisibleReply && latestVisibleReply.parentId === comment.id
        ? replies.find((reply) => reply.id === latestVisibleReply.replyId)
        : null;

    let replySource = pinnedReply
      ? replies.filter((reply) => reply.id !== pinnedReply.id)
      : replies;

    // Wrapper balasan
    const repliesWrap = document.createElement("div");
    repliesWrap.className = "cmn-replies";

    if (pinnedReply) {
      repliesWrap.classList.add("cmn-replies-visible");
      repliesWrap.appendChild(buildCommentEl(pinnedReply, [], true));
    } else {
      repliesWrap.classList.add("cmn-replies-hidden");
    }

    // Tombol BUKA - di atas
    const showBtn = document.createElement("button");
    showBtn.className = "cmn-btn cmn-toggle-replies";

    function updateShowBtnText() {
      showBtn.innerHTML = `
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
        Lihat ${replies.length} balasan
      `;
    }

    updateShowBtnText();

    if (pinnedReply) {
      showBtn.classList.add("cmn-replies-hidden");
    }

    // Tombol BAWAH — load more dan sembunyikan
    const bottomBtn = document.createElement("button");
    bottomBtn.className = "cmn-btn cmn-toggle-replies";

    if (!pinnedReply) {
      bottomBtn.classList.add("cmn-replies-hidden");
    }

    function updateBottomBtn() {
      const remaining = replySource.length - shown;

      if (remaining > 0) {
        bottomBtn.innerHTML = `
          <span class="cmn-bottom-actions">
            <span class="cmn-btn cmn-toggle-replies cmn-load-more-btn">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
              Lihat ${remaining} balasan lainnya
            </span>

            <span class="cmn-btn cmn-toggle-replies cmn-hide-btn">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/>
              </svg>
              Sembunyikan
            </span>
          </span>
        `;
      } else {
        bottomBtn.innerHTML = `
          <span class="cmn-btn cmn-toggle-replies cmn-hide-btn">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/>
            </svg>
            Sembunyikan
          </span>
        `;
      }
    }

    if (pinnedReply) {
      updateBottomBtn();
    }

    function showNextBatch() {
      const end = Math.min(shown + BATCH, replySource.length);

      for (let i = shown; i < end; i++) {
        repliesWrap.appendChild(buildCommentEl(replySource[i], [], true));
      }

      shown = end;
      updateBottomBtn();
    }

    function hideAll() {
      repliesWrap.innerHTML = "";
      shown = 0;

      if (latestVisibleReply && latestVisibleReply.parentId === comment.id) {
        latestVisibleReply = null;
      }

      pinnedReply = null;
      replySource = replies;

      repliesWrap.classList.remove("cmn-replies-visible");
      repliesWrap.classList.add("cmn-replies-hidden");

      bottomBtn.classList.add("cmn-replies-hidden");
      showBtn.classList.remove("cmn-replies-hidden");

      updateShowBtnText();
    }

    // Klik tombol BUKA atas
    showBtn.addEventListener("click", () => {
      repliesWrap.classList.remove("cmn-replies-hidden");
      repliesWrap.classList.add("cmn-replies-visible");

      repliesWrap.innerHTML = "";
      shown = 0;

      showNextBatch();

      showBtn.classList.add("cmn-replies-hidden");
      bottomBtn.classList.remove("cmn-replies-hidden");
    });

    // Klik tombol bawah
    bottomBtn.addEventListener("click", (e) => {
      const loadMore = e.target.closest(".cmn-load-more-btn");
      const hide = e.target.closest(".cmn-hide-btn");

      if (loadMore) {
        showNextBatch();
      } else if (hide) {
        hideAll();
      }
    });

    const body = item.querySelector(".cmn-body");

    if (pinnedReply) {
      body.appendChild(repliesWrap);
      body.appendChild(showBtn);
      body.appendChild(bottomBtn);
    } else {
      body.appendChild(showBtn);
      body.appendChild(repliesWrap);
      body.appendChild(bottomBtn);
    }
  }

  return item;
}

// LISTEN REAL-TIME
const COMMENTS_PER_PAGE = 5;
let visibleCount = COMMENTS_PER_PAGE;
let allCommentsCache = [];

function renderComments(comments) {
  const list = document.getElementById("cmn-list");
  list.innerHTML = "";

  const parentComments = comments
    .filter((comment) => !comment.parentId)
    .sort((a, b) => b.timestamp - a.timestamp);

  // Ambil komentar sesuai batas visibleCount
  const toShow = parentComments.slice(0, visibleCount);

  if (toShow.length === 0) {
    list.innerHTML = `<p class="cmn-loading">Belum ada komentar.</p>`;
  }

  toShow.forEach((parent) => {
    const replies = comments
      .filter((comment) => comment.parentId === parent.id)
      .sort((a, b) => b.timestamp - a.timestamp);

    list.appendChild(buildCommentEl(parent, replies, false));
  });

  // Total komentar tetap menghitung komentar + balasan
  document.getElementById("cmn-count-badge").textContent =
    comments.length + " komentar";

  // Tombol load more
  const loadWrap = document.querySelector(".cmn-load-wrap");
  const loadBtn = document.querySelector(".cmn-load-btn");

  if (parentComments.length > visibleCount) {
    loadWrap.style.display = "block";

    const remaining = parentComments.length - visibleCount;
    loadBtn.textContent = `Muat ${remaining} komentar lainnya`;
  } else {
    loadWrap.style.display = "none";
  }
}

const likingInProgress = new Set();

onValue(commentsRef, (snapshot) => {
  const newComments = [];
  snapshot.forEach((child) => {
    newComments.push({ id: child.key, ...child.val() });
  });

  // Cek apakah perubahan hanya di field likes
  const onlyLikesChanged = 
    allCommentsCache.length === newComments.length &&
    newComments.every((nc) => {
      const oc = allCommentsCache.find((c) => c.id === nc.id);
      if (!oc) return false;
      const { likes: l1, ...rest1 } = nc;
      const { likes: l2, ...rest2 } = oc;
      return JSON.stringify(rest1) === JSON.stringify(rest2);
    });

  if (onlyLikesChanged) {
    // Hanya update angka like di DOM, jangan re-render
    newComments.forEach((nc) => {
      const oc = allCommentsCache.find((c) => c.id === nc.id);
      if (oc && oc.likes !== nc.likes) {
        // Cari tombol like milik komentar ini
        const allLikeBtns = document.querySelectorAll(
          `[onclick="cmnLike(this, '${nc.id}')"] span, .cmn-btn[onclick*="${nc.id}"] span`
        );
        allLikeBtns.forEach((span) => {
          // Hanya update jika user tidak sedang klik (biar optimistic UI tidak dilawan)
          if (!likingInProgress.has(nc.id)) {
            span.textContent = nc.likes || 0;
          }
        });
      }
    });
    allCommentsCache = newComments;
    return; // ← tidak re-render!
  }

  allCommentsCache = newComments;
  renderComments(allCommentsCache);
});

// LOAD MORE BUTTON
document.querySelector(".cmn-load-btn").addEventListener("click", () => {
  visibleCount += COMMENTS_PER_PAGE;
  renderComments(allCommentsCache);
});