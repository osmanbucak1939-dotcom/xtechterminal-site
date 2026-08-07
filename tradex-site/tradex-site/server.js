// TradeX tanıtım sitesi — basit lead toplama + admin paneli
// Deploy: Railway (mevcut bridge sunucunuzla aynı mantık)

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'leads.json');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme';

// ---- veri dosyasını hazırla ----
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function readLeads() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeLeads(leads) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2), 'utf8');
}

// ---- basic auth (sadece /admin* için) ----
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
    if (user === ADMIN_USER && pass === ADMIN_PASS) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="TradeX Admin"');
  return res.status(401).send('Yetkilendirme gerekli.');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- form gönderimi ----
app.post('/api/lead', (req, res) => {
  const { name, company, email, phone, model, message } = req.body || {};

  if (!name || !company || !email) {
    return res.status(400).json({ error: 'Ad, şirket ve e-posta zorunludur.' });
  }

  const lead = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name: String(name).slice(0, 200),
    company: String(company).slice(0, 200),
    email: String(email).slice(0, 200),
    phone: phone ? String(phone).slice(0, 60) : '',
    model: model ? String(model).slice(0, 200) : '',
    message: message ? String(message).slice(0, 2000) : '',
    submittedAt: new Date().toISOString(),
  };

  const leads = readLeads();
  leads.unshift(lead);
  writeLeads(leads);

  res.status(201).json({ ok: true });
});

// ---- admin paneli (şifreli) ----
app.get('/admin', requireAuth, (req, res) => {
  const leads = readLeads();
  const rows = leads.map(l => `
    <tr>
      <td>${escapeHtml(new Date(l.submittedAt).toLocaleString('tr-TR'))}</td>
      <td>${escapeHtml(l.name)}</td>
      <td>${escapeHtml(l.company)}</td>
      <td><a href="mailto:${escapeHtml(l.email)}">${escapeHtml(l.email)}</a></td>
      <td>${escapeHtml(l.phone)}</td>
      <td>${escapeHtml(l.model)}</td>
      <td>${escapeHtml(l.message)}</td>
    </tr>`).join('');

  res.send(`<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8">
<title>TradeX Admin — Başvurular</title>
<style>
  body{font-family:-apple-system,Segoe UI,Arial,sans-serif;background:#0A0E14;color:#E9ECF2;margin:0;padding:32px;}
  h1{font-size:20px;margin-bottom:4px;}
  p.sub{color:#8B94A6;font-size:13px;margin-bottom:24px;}
  table{width:100%;border-collapse:collapse;font-size:13px;background:#121924;border:1px solid #232C3B;}
  th,td{padding:10px 12px;border-bottom:1px solid #232C3B;text-align:left;vertical-align:top;}
  th{background:#171F2C;color:#8B94A6;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.5px;}
  tr:hover td{background:#171F2C;}
  a{color:#E8C87D;}
  .count{color:#D4A64C;font-weight:600;}
  .empty{padding:40px;text-align:center;color:#8B94A6;}
  .export{float:right;font-size:12px;background:#D4A64C;color:#12100A;padding:8px 14px;border-radius:4px;text-decoration:none;font-weight:600;}
</style></head>
<body>
  <a class="export" href="/admin/export.csv">CSV indir</a>
  <h1>TradeX — Demo Başvuruları</h1>
  <p class="sub"><span class="count">${leads.length}</span> kayıt</p>
  ${leads.length ? `<table>
    <thead><tr><th>Tarih</th><th>Ad Soyad</th><th>Şirket</th><th>E-posta</th><th>Telefon</th><th>İş Modeli</th><th>Mesaj</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>` : '<div class="empty">Henüz başvuru yok.</div>'}
</body></html>`);
});

// ---- CSV export (opsiyonel) ----
app.get('/admin/export.csv', requireAuth, (req, res) => {
  const leads = readLeads();
  const header = 'Tarih,Ad Soyad,Sirket,Eposta,Telefon,Is Modeli,Mesaj\n';
  const csv = leads.map(l => [
    l.submittedAt, l.name, l.company, l.email, l.phone, l.model, (l.message || '').replace(/\n/g, ' ')
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="tradex-basvurular.csv"');
  res.send(header + csv);
});

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

app.listen(PORT, () => {
  console.log(`TradeX tanıtım sitesi ${PORT} portunda çalışıyor.`);
  console.log(`Admin paneli: /admin  (kullanıcı: ${ADMIN_USER})`);
});
