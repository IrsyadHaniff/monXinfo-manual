(function () {
const COLORS = ['cmn-av-green', 'cmn-av-blue', 'cmn-av-amber', 'cmn-av-pink', 'cmn-av-red'];
let cmnCount = 3;

// Counter karakter
const textarea = document.getElementById('cmn-inp-text');
const charLeft = document.getElementById('cmn-char-left');
textarea.addEventListener('input', function () {
charLeft.textContent = 500 - this.value.length;
});

// Toast
window.cmnToast = function (msg, isError) {
const t = document.getElementById('cmn-toast');
t.textContent = msg;
t.style.background = isError ? '#dc2626' : '#059669';
t.classList.add('show');
setTimeout(() => t.classList.remove('show'), 2600);
};

// Like toggle
window.cmnLike = function (btn) {
const span = btn.querySelector('span');
const liked = btn.dataset.liked === '1';
span.textContent = liked ? parseInt(span.textContent) - 1 : parseInt(span.textContent) + 1;
btn.dataset.liked = liked ? '0' : '1';
btn.classList.toggle('liked', !liked);
};

// Balas — auto-fill nama di textarea
window.cmnReply = function (name) {
const t = document.getElementById('cmn-inp-text');
t.value = '@' + name + ' ';
charLeft.textContent = 500 - t.value.length;
t.focus();
document.getElementById('cmn-inp-name').scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// Ambil inisial dari nama
function getInitials(name) {
return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
}

// Render teks dengan @mention berwarna
function renderText(text) {
return text
.replace(/</g, '&lt;').replace(/>/g, '&gt;')
.replace(/(@[\w\s]+?)(?=\s|$)/g, '<span class="mention">$1</span>');
}

// Kirim komentar baru
window.cmnSubmit = function () {
const nameEl = document.getElementById('cmn-inp-name');
const textEl = document.getElementById('cmn-inp-text');
const name = nameEl.value.trim();
const text = textEl.value.trim();

if (!name) { cmnToast('Nama tidak boleh kosong', true); return; }
if (!text)  { cmnToast('Komentar tidak boleh kosong', true); return; }

const initials  = getInitials(name);
const colorClass = COLORS[cmnCount % COLORS.length];
cmnCount++;

// Update badge jumlah
document.getElementById('cmn-count-badge').textContent = cmnCount + ' komentar';

// Buat elemen komentar baru
const item = document.createElement('div');
item.className = 'cmn-item';
item.innerHTML = `
<div class="cmn-avatar ${colorClass}">${initials}</div>
<div class="cmn-body">
<div class="cmn-meta">
<span class="cmn-name">${name.replace(/</g,'&lt;')}</span>
<span class="cmn-time">Baru saja</span>
</div>
<p class="cmn-text">${renderText(text)}</p>
<div class="cmn-actions">
<button class="cmn-btn" onclick="cmnLike(this)">
<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
</svg>
<span>0</span>
</button>
<button class="cmn-btn" onclick="cmnReply('${name.replace(/'/g,"\\'")}')">
<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
</svg>
Balas
</button>
</div>
</div>`;

const list = document.getElementById('cmn-list');
list.insertBefore(item, list.firstChild);

nameEl.value = '';
nameEl.disabled = false;
document.getElementById('cmn-anon').checked = false;
nameEl.style.opacity = '1';
textEl.value = '';
charLeft.textContent = '500';

cmnToast('Komentar berhasil dikirim!');
};
})();
// Anonim toggle
const anonCheck = document.getElementById('cmn-anon');
const nameInput = document.getElementById('cmn-inp-name');

anonCheck.addEventListener('change', function () {
  if (this.checked) {
    nameInput.value = 'anonimmonXinfo';
    nameInput.disabled = true;
    nameInput.style.opacity = '0.5';
  } else {
    nameInput.value = '';
    nameInput.disabled = false;
    nameInput.style.opacity = '1';
  }
});