// Zorvix v3 — Neumorphism UI + Auto Supabase + WhatsApp
const SUPABASE_URL = "https://bgnmpbnekzhwssyfjdwg.supabase.co";
const SUPABASE_KEY = "sb_publishable_9hmtvzm0pUcDCSkBiGE8iQ_uxHKzt2x";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let leads = [];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('connStatus').textContent = '🟢 Live';
  loadLeads();
  setInterval(loadLeads, 8000);
});

async function loadLeads() {
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
  if (error) {
    if (error.message.includes('relation') || error.message.includes('does not exist')) {
      document.getElementById('leadsList').innerHTML = '<div class="empty"><div class="empty-icon">⚠️</div><p>Table missing in Supabase</p><p style="font-size:0.75rem;margin-top:8px;">Run this SQL:</p><textarea readonly style="width:100%;height:50px;font-size:0.6rem;background:var(--bg);border:2px solid var(--text-muted);border-radius:8px;color:var(--text);padding:6px;margin-top:8px;">create table leads (id uuid default gen_random_uuid() primary key, name text, phone text, business_name text, city text, service text, status text default \'pending\', attempts int default 0, notes text default \'\', created_at timestamptz default now());</textarea></div>';
      return;
    }
  }
  leads = data || [];
  renderLeads();
  updateStats();
}

function updateStats() {
  const s = { total: leads.length, pending: 0, interested: 0 };
  for (const l of leads) { if (l.status === 'pending') s.pending++; if (l.status === 'interested') s.interested++; }
  document.getElementById('sTotal').textContent = s.total;
  document.getElementById('sPending').textContent = s.pending;
  document.getElementById('sInterested').textContent = s.interested;
}

function renderLeads() {
  const c = document.getElementById('leadsList');
  if (!leads.length) { c.innerHTML = '<div class="empty"><div class="empty-icon">📭</div><p>No leads yet</p><p style="font-size:0.8rem;margin-top:4px;">Tap + to upload CSV</p></div>'; return; }
  c.innerHTML = leads.slice(0, 50).map(l => `
    <div class="lead neu" onclick="openDetail('${l.id}')">
      <div class="lead-top"><div><div class="lead-name">${l.name}</div><div class="lead-meta">${l.business_name || ''} ${l.city ? '• ' + l.city : ''}</div></div><span class="badge badge-${l.status}">${l.status}</span></div>
      <div class="lead-phone">📱 ${l.phone}</div>
      <div class="lead-actions" onclick="event.stopPropagation()">
        <a href="tel:${l.phone}" class="btn btn-call btn-sm">📞</a>
        <a href="https://wa.me/${l.phone.replace('+', '')}?text=Hi ${l.name}! Main Zorvix se call kar raha hoon." target="_blank" class="btn btn-wa btn-sm" onclick="markReached('${l.id}')">💬</a>
        <button class="btn btn-outline btn-sm" onclick="genSite('${l.id}')">🌐</button>
      </div>
    </div>`).join('');
}

async function uploadCSV(e) {
  const file = e.target.files[0]; if (!file) return;
  const text = await file.text(); const lines = text.split('\n').filter(l => l.trim()); if (lines.length < 2) return toast('Invalid CSV', true);
  const rows = [];
  for (let i = 1; i < lines.length; i++) { const v = lines[i].split(',').map(x => x.trim()); if (v[0] && v[1]) rows.push({ name: v[0], phone: v[1].replace(/[\s\-\(\)]/g, ''), business_name: v[2] || '', city: v[3] || '', service: v[4] || '' }); }
  const { error } = await supabase.from('leads').insert(rows);
  if (error) return toast('Upload failed: ' + error.message, true);
  toast('✅ ' + rows.length + ' leads added'); closeModal('uploadModal'); loadLeads();
}

async function markReached(id) { await supabase.from('leads').update({ status: 'reached' }).eq('id', id); }
async function updateStatus(id, status) { await supabase.from('leads').update({ status }).eq('id', id); toast('✅ Updated'); loadLeads(); }

async function genSite(id) {
  const lead = leads.find(l => l.id === id); if (!lead) return;
  const svc = lead.service ? lead.service.split(',').map(s => s.trim()) : ['Quality Services'];
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${lead.business_name || lead.name}</title><style>body{font-family:Inter,sans-serif;margin:0;background:#f8fafc;color:#1e293b}.n{background:#fff;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 1px 3px rgb(0 0 0 / .1)}.lo{font-size:1.3rem;font-weight:700;color:#6366f1;text-decoration:none}.ct{background:#6366f1;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600}.h{background:linear-gradient(135deg,#6366f1,#f59e0b);color:#fff;padding:80px 24px;text-align:center}.h h1{font-size:2.2rem;margin-bottom:12px}.t{font-size:1.1rem;opacity:.9;max-width:500px;margin:0 auto 28px}.b{background:#fff;color:#6366f1;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600}.s{padding:60px 24px}.s h2{text-align:center;font-size:1.6rem;margin-bottom:32px}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;max-width:900px;margin:0 auto}.sc{background:#fff;padding:24px;border-radius:8px;text-align:center;border:1px solid #e2e8f0}.cn{padding:60px 24px;text-align:center}.cn p{margin:8px 0;font-size:1rem}.f{background:#1e293b;color:#94a3b8;text-align:center;padding:24px 0;font-size:.85rem}@media(max-width:600px){.h h1{font-size:1.6rem}}</style></head><body><nav class="n"><a href="#" class="lo">${lead.business_name || lead.name}</a><a href="tel:${lead.phone}" class="ct">📞 Call Now</a></nav><header class="h"><h1>Welcome to ${lead.business_name || lead.name}</h1><p class="t">${svc.join(', ')} in ${lead.city || 'your area'}</p><a href="tel:${lead.phone}" class="b">📞 Call Us Now</a></header><section class="s"><h2>Our Services</h2><div class="g">${svc.map(s=>`<div class="sc"><div style="font-size:2rem">⭐</div><h3>${s}</h3></div>`).join('')}</div></section><section class="cn"><h2>Contact</h2>${lead.name?`<p><strong>Owner:</strong> ${lead.name}</p>`:''}<p><strong>Phone:</strong> <a href="tel:${lead.phone}">${lead.phone}</a></p>${lead.city?`<p><strong>Location:</strong> ${lead.city}</p>`:''}</section><footer class="f"><p>© ${new Date().getFullYear()} ${lead.business_name || lead.name}. Powered by Zorvix</p></footer></body></html>`;
  const blob = new Blob([html], { type: 'text/html' }); window.open(URL.createObjectURL(blob), '_blank'); toast('✅ Site opened!');
}

function openDetail(id) {
  const l = leads.find(x => x.id === id); if (!l) return;
  const msg = prompt(`Message for ${l.name}?`, `Hi ${l.name}! Aapki website ban gayi hai!`); if (msg) { window.open(`https://wa.me/${l.phone.replace('+', '')}?text=${encodeURIComponent(msg)}`, '_blank'); updateStatus(id, 'reached'); }
}

async function autoCall() {
  const pending = leads.filter(l => l.status === 'pending'); if (!pending.length) return toast('No pending leads', true);
  if (!confirm('Call ' + Math.min(5, pending.length) + ' leads?')) return;
  for (const l of pending.slice(0, 5)) await updateStatus(l.id, 'calling');
  toast('📞 Calls queued');
}

function exportReport() {
  const h = ['Name', 'Phone', 'Business', 'City', 'Service', 'Status'];
  const r = leads.map(l => [l.name, l.phone, l.business_name, l.city, l.service, l.status].map(c => '"' + (c || '') + '"').join(','));
  const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent([h.join(','), ...r].join('\n')); a.download = 'zorvix_report.csv'; a.click(); toast('📥 Downloaded');
}

function showSetup() { document.getElementById('setupModal').classList.add('show'); checkWa(); }
function openUpload() { document.getElementById('uploadModal').classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

async function checkWa() {
  try {
    const res = await fetch('/api/baileys/qr');
    const data = await res.json();
    const el = document.getElementById('waStatus');
    if (data.connected) el.innerHTML = '<p style="color: #16a34a; font-weight: 600;">✅ WhatsApp Connected!</p>';
    else if (data.qr) {
      el.innerHTML = '<p style="color: #6366f1; font-weight: 600;">📱 Scan with WhatsApp</p>';
      document.getElementById('qrContainer').style.display = 'block';
      document.getElementById('qrImage').src = data.qr;
    } else el.innerHTML = '<p style="color: #718096;">⏳ Waiting for QR...</p>';
  } catch { document.getElementById('waStatus').innerHTML = '<p style="color: #dc2626;">❌ Backend not running</p>'; }
}

function refreshQR() { toast('🔄 Refreshing...'); setTimeout(checkWa, 2000); }

function saveSupabase() {
  const url = document.getElementById('sbUrl').value;
  const key = document.getElementById('sbKey').value;
  if (url && key) { localStorage.setItem('sb_cfg', JSON.stringify({ url, key })); location.reload(); }
}

function toast(msg, err) { const t = document.getElementById('toast'); t.textContent = msg; t.className = 'toast show' + (err ? ' err' : ''); setTimeout(() => t.className = 'toast', 2500); }
document.getElementById('fabBtn').onclick = openUpload;
document.getElementById('autoCallBtn').onclick = autoCall;
