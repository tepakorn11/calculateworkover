// =====================================================
// CalculateWorkover — 22 tools, 6 categories
// =====================================================

// ----- STATE -----
const state = {
  cat: 'daily',
  tool: null, // set per-cat
  currency: 'THB',
  fxRate: 36.5, // 1 USD = 36.5 THB
  theme: 'light',
};

// ----- CATEGORIES & TOOLS -----
const CATEGORIES = {
  daily: {
    label: 'ในบ้าน & เดินทาง',
    tools: [
      { id: 'fuel',     name: 'ค่าน้ำมัน',      icon: '⛽' },
      { id: 'electric', name: 'ค่าไฟฟ้า',       icon: '💡' },
      { id: 'water',    name: 'ค่าน้ำประปา',    icon: '💧' },
      { id: 'taxi',     name: 'ค่าแท็กซี่',     icon: '🚕' },
      { id: 'split',    name: 'หารบิล',         icon: '🧾' },
    ],
  },
  finance: {
    label: 'การเงิน & ช้อปปิ้ง',
    tools: [
      { id: 'discount',  name: 'ส่วนลดสินค้า',     icon: '🏷️' },
      { id: 'unitprice', name: 'ราคาต่อหน่วย',     icon: '⚖️' },
      { id: 'roi',       name: 'ผลตอบแทน ROI',     icon: '📈' },
      { id: 'cardmin',   name: 'ขั้นต่ำบัตรเครดิต', icon: '💳' },
    ],
  },
  property: {
    label: 'ที่อยู่อาศัย & อสังหาฯ',
    tools: [
      { id: 'loan',  name: 'กู้ซื้อบ้าน',  icon: '🏠' },
      { id: 'btu',   name: 'BTU แอร์',     icon: '❄️' },
      { id: 'paint', name: 'สีทาบ้าน',     icon: '🎨' },
    ],
  },
  health: {
    label: 'สุขภาพ & ไลฟ์สไตล์',
    tools: [
      { id: 'water_intake', name: 'ดื่มน้ำต่อวัน', icon: '🥤' },
      { id: 'ovulation',    name: 'วันไข่ตก',     icon: '🌸' },
      { id: 'sleep',        name: 'รอบการนอน',    icon: '😴' },
      { id: 'pet_age',      name: 'อายุสัตว์เลี้ยง', icon: '🐕' },
    ],
  },
  work: {
    label: 'การทำงาน & เวลา',
    tools: [
      { id: 'wage',     name: 'ค่าแรงรายชั่วโมง', icon: '💼' },
      { id: 'countdown',name: 'นับวัน',           icon: '📅' },
      { id: 'download', name: 'เวลาดาวน์โหลด',    icon: '⬇️' },
    ],
  },
  cooking: {
    label: 'การทำอาหาร',
    tools: [
      { id: 'recipe',  name: 'ปรับสูตรอาหาร', icon: '🍲' },
      { id: 'units',   name: 'แปลงหน่วยตวง',  icon: '⚗️' },
    ],
  },
};

// default tool per category
const DEFAULT_TOOL = {
  daily: 'fuel', finance: 'discount', property: 'loan',
  health: 'water_intake', work: 'wage', cooking: 'recipe'
};

// ----- HELPERS -----
const $ = (id) => document.getElementById(id);
const fmt = n => {
  if (!isFinite(n)) n = 0;
  return (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const fmtInt = n => Math.round(n).toLocaleString('en-US');
const curSym = () => state.currency === 'USD' ? '$' : '฿';
const conv = (thb) => state.currency === 'USD' ? thb / state.fxRate : thb;
const fmtCur = (thb) => `${curSym()} ${fmt(conv(thb))}`;

// ----- RESULT WRITERS -----
function setMain(val, isCurrency = true, unit = '') {
  const v = isCurrency ? conv(val) : val;
  const safe = isFinite(v) ? v : 0;
  const whole = Math.floor(Math.abs(safe));
  const frac = Math.round((Math.abs(safe) - whole) * 100);
  $('r-cur').textContent = isCurrency ? curSym() : '';
  $('r-cur').style.display = isCurrency ? 'inline' : 'none';
  $('r-main').textContent = (safe < 0 ? '-' : '') + whole.toLocaleString('en-US');
  $('r-frac').textContent = '.' + String(frac).padStart(2, '0');
  $('r-frac').style.display = isCurrency || Math.abs(v) % 1 !== 0 ? 'inline' : 'none';
  $('r-unit').textContent = unit ? ' ' + unit : '';
}
function setMainText(text, unit = '') {
  $('r-cur').style.display = 'none';
  $('r-main').textContent = text;
  $('r-frac').textContent = '';
  $('r-unit').textContent = unit ? ' ' + unit : '';
}
function setLabels(label, sub) {
  $('r-label').textContent = label;
  $('r-sub').textContent = sub;
}
function setRows(rows) {
  $('r-rows').innerHTML = rows.map(r => {
    const cls = r.total ? 'row total' : 'row';
    return `<div class="${cls}"><span class="row-label">${r.label}</span><span class="row-value">${r.value}</span></div>`;
  }).join('');
}
function setExtra(html) { $('r-extra').innerHTML = html || ''; }

// ----- TOOL DEFINITIONS -----
// Each tool returns { html, init() } — init binds inputs and exposes compute()
const TOOLS = {};

// =====================================================
// CATEGORY 1: DAILY
// =====================================================
TOOLS.fuel = {
  html: () => `
    <div class="panel-eyebrow">หมวด 1 · DAILY</div>
    <h2 class="panel-title">คำนวณ<span class="accent">ค่าน้ำมัน</span></h2>
    <div class="preset-row" id="fuel-presets">
      <button class="chip" data-p="38.45">แก๊สโซฮอล์ 95</button>
      <button class="chip" data-p="38.18">แก๊สโซฮอล์ 91</button>
      <button class="chip" data-p="36.34">E20</button>
      <button class="chip" data-p="32.94">ดีเซล</button>
      <button class="chip" data-p="33.94">ดีเซล B7</button>
    </div>
    <div class="field-row">
      <div class="field"><label>ระยะทาง <span class="en">km</span></label><input type="number" id="f-distance" value="420"></div>
      <div class="field"><label>อัตราสิ้นเปลือง <span class="en">km/L</span></label><input type="number" id="f-eff" value="14" step="0.1"></div>
    </div>
    <div class="field"><label>ราคาต่อลิตร <span class="en">฿/L</span></label><input type="number" id="f-price" value="38.45" step="0.01"><div class="field-hint">เลือกชนิดน้ำมันด้านบนเพื่อกรอกราคาตลาดอัตโนมัติ</div></div>
    <div class="info-card"><b>วิธีคำนวณ</b>ปริมาณน้ำมัน = ระยะทาง ÷ อัตราสิ้นเปลือง<br>ค่าน้ำมัน = ปริมาณน้ำมัน × ราคาต่อลิตร</div>
  `,
  init() {
    document.getElementById('fuel-presets').addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      document.querySelectorAll('#fuel-presets .chip').forEach(c => c.classList.remove('is-active'));
      b.classList.add('is-active');
      $('f-price').value = b.dataset.p;
      compute();
    });
  },
  compute() {
    const d = +$('f-distance').value || 0;
    const e = +$('f-eff').value || 0.0001;
    const p = +$('f-price').value || 0;
    const litres = d / e;
    const cost = litres * p;
    const perKm = d > 0 ? cost / d : 0;
    setLabels('ค่าน้ำมันสำหรับทริปนี้', `ใช้ประมาณ ${fmt(litres)} ลิตร · เฉลี่ย ${fmtCur(perKm)}/กม.`);
    setMain(cost);
    setRows([
      { label: 'ระยะทาง', value: `${fmtInt(d)} กม.` },
      { label: 'ปริมาณน้ำมัน', value: `${fmt(litres)} ลิตร` },
      { label: 'ราคาต่อลิตร', value: fmtCur(p) },
      { label: 'ต้นทุนต่อ กม.', value: fmtCur(perKm) },
      { label: 'รวมทั้งหมด', value: fmtCur(cost), total: true },
    ]);
    setExtra('');
  }
};

TOOLS.electric = {
  html: () => `
    <div class="panel-eyebrow">หมวด 1 · DAILY</div>
    <h2 class="panel-title">คำนวณ<span class="accent">ค่าไฟฟ้า</span></h2>
    <div class="field"><label>หน่วยที่ใช้ในเดือนนี้ <span class="en">kWh</span></label><input type="number" id="e-units" value="380"><div class="field-hint">ดูที่ใบแจ้งหนี้ MEA หรือ PEA</div></div>
    <div class="field-row">
      <div class="field"><label>ค่า Ft <span class="en">สตางค์/หน่วย</span></label><input type="number" id="e-ft" value="36.72" step="0.01"></div>
      <div class="field"><label>ค่าบริการ <span class="en">บาท</span></label><input type="number" id="e-service" value="38.22" step="0.01"></div>
    </div>
    <div class="info-card"><b>อัตราก้าวหน้า บ้านอยู่อาศัย</b>0–150: 3.2484 · 151–400: 4.2218 · เกิน 400: 4.4217 บ./หน่วย<br>+ ค่า Ft + ค่าบริการ + VAT 7%</div>
  `,
  init() {},
  compute() {
    const u = +$('e-units').value || 0;
    const ft = +$('e-ft').value || 0;
    const svc = +$('e-service').value || 0;
    let t1=0,t2=0,t3=0;
    if (u <= 150) t1 = u * 3.2484;
    else if (u <= 400) { t1 = 150*3.2484; t2 = (u-150)*4.2218; }
    else { t1 = 150*3.2484; t2 = 250*4.2218; t3 = (u-400)*4.4217; }
    const energy = t1+t2+t3;
    const ftCharge = u * (ft/100);
    const sub = energy + ftCharge + svc;
    const vat = sub * 0.07;
    const total = sub + vat;
    setLabels('ค่าไฟเดือนนี้', `${fmtInt(u)} หน่วย · เฉลี่ย ${fmtCur(total/Math.max(u,1))}/หน่วย`);
    setMain(total);
    setRows([
      { label: 'ขั้น 1 (0–150)', value: fmtCur(t1) },
      { label: 'ขั้น 2 (151–400)', value: fmtCur(t2) },
      { label: 'ขั้น 3 (>400)', value: fmtCur(t3) },
      { label: 'ค่า Ft', value: fmtCur(ftCharge) },
      { label: 'ค่าบริการ', value: fmtCur(svc) },
      { label: 'VAT 7%', value: fmtCur(vat) },
      { label: 'รวมสุทธิ', value: fmtCur(total), total: true },
    ]);
    const segs = [
      { label: '0–150', cap: 150, val: Math.min(u,150) },
      { label: '151–400', cap: 250, val: Math.max(0,Math.min(u,400)-150) },
      { label: '>400', cap: Math.max(50, u-400), val: Math.max(0,u-400) },
    ];
    setExtra(`<div class="ladder"><h4 style="font-family:var(--mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:10px;">การใช้ตามขั้น</h4><div class="ladder-bar">${segs.map(s=>{const fill=s.cap>0?Math.min(100,(s.val/s.cap)*100):0;return `<div class="ladder-seg" style="flex:${s.cap};background:linear-gradient(to right,var(--accent) ${fill}%,transparent ${fill}%);">${s.label}</div>`}).join('')}</div></div>`);
  }
};

TOOLS.water = {
  html: () => `
    <div class="panel-eyebrow">หมวด 1 · DAILY</div>
    <h2 class="panel-title">คำนวณ<span class="accent">ค่าน้ำประปา</span></h2>
    <div class="field-row">
      <div class="field"><label>มิเตอร์ครั้งก่อน <span class="en">m³</span></label><input type="number" id="w-prev" value="1240"></div>
      <div class="field"><label>มิเตอร์ครั้งนี้ <span class="en">m³</span></label><input type="number" id="w-curr" value="1268"></div>
    </div>
    <div class="field"><label>ค่าบริการ <span class="en">บาท</span></label><input type="number" id="w-svc" value="30" step="0.5"><div class="field-hint">มาตร 1/2"=30, 3/4"=40, 1"=50</div></div>
    <div class="info-card"><b>อัตราก้าวหน้า บ้านอยู่อาศัย</b>0–30 ลบ.ม.: 8.50 · เกิน 30: 10.20 บ./ลบ.ม.<br>+ ค่าบริการ + VAT 7%</div>
  `,
  init() {},
  compute() {
    const prev = +$('w-prev').value || 0;
    const curr = +$('w-curr').value || 0;
    const svc = +$('w-svc').value || 0;
    const used = Math.max(0, curr - prev);
    let t1=0, t2=0;
    if (used <= 30) t1 = used * 8.50;
    else { t1 = 30*8.50; t2 = (used-30)*10.20; }
    const water = t1+t2;
    const sub = water + svc;
    const vat = sub * 0.07;
    const total = sub + vat;
    setLabels('ค่าน้ำเดือนนี้', `${fmtInt(used)} ลบ.ม. · เฉลี่ย ${fmtCur(used>0?total/used:0)}/ลบ.ม.`);
    setMain(total);
    setRows([
      { label: 'ปริมาณที่ใช้', value: `${fmtInt(used)} ลบ.ม.` },
      { label: 'ขั้น 1 (0–30)', value: fmtCur(t1) },
      { label: 'ขั้น 2 (>30)', value: fmtCur(t2) },
      { label: 'ค่าบริการ', value: fmtCur(svc) },
      { label: 'VAT 7%', value: fmtCur(vat) },
      { label: 'รวมสุทธิ', value: fmtCur(total), total: true },
    ]);
    setExtra('');
  }
};

TOOLS.taxi = {
  html: () => `
    <div class="panel-eyebrow">หมวด 1 · DAILY</div>
    <h2 class="panel-title">คำนวณ<span class="accent">ค่าแท็กซี่</span></h2>
    <div class="field-row">
      <div class="field"><label>ระยะทาง <span class="en">km</span></label><input type="number" id="t-d" value="12" step="0.1"></div>
      <div class="field"><label>เวลารถติด <span class="en">นาที</span></label><input type="number" id="t-i" value="8"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>ค่าเรียกผ่านแอป <span class="en">฿</span></label><input type="number" id="t-app" value="20" step="5"></div>
      <div class="field"><label>ค่าทางด่วน <span class="en">฿</span></label><input type="number" id="t-toll" value="0" step="5"></div>
    </div>
    <div class="info-card"><b>อัตราแท็กซี่กรุงเทพฯ</b>เริ่ม 35฿ (1 กม.แรก) · 1–10:6.50 · 10–20:7 · 20–40:8 · 40–60:8.50 · 60–80:9 · &gt;80:10.50 · รถติด 3฿/นาที</div>
  `,
  init() {},
  compute() {
    const d = +$('t-d').value || 0;
    const idle = +$('t-i').value || 0;
    const app = +$('t-app').value || 0;
    const toll = +$('t-toll').value || 0;
    let meter = 35;
    const tiers = [{u:1,r:0},{u:10,r:6.5},{u:20,r:7},{u:40,r:8},{u:60,r:8.5},{u:80,r:9},{u:Infinity,r:10.5}];
    let prev = 0; const breakdown = [];
    for (const t of tiers) {
      const span = Math.max(0, Math.min(d,t.u) - prev);
      if (span > 0 && t.r > 0) { meter += span*t.r; breakdown.push({from:prev,to:t.u,span,rate:t.r,sub:span*t.r}); }
      prev = t.u;
      if (d <= t.u) break;
    }
    const idleC = idle * 3;
    const total = meter + idleC + app + toll;
    setLabels('ค่าแท็กซี่ทริปนี้', `ระยะทาง ${d} กม. · รถติด ${idle} นาที`);
    setMain(total);
    setRows([
      { label: 'ค่าเริ่มต้น (1 กม.แรก)', value: fmtCur(35) },
      ...breakdown.map(b => ({ label: `${b.from}–${b.to===Infinity?'∞':b.to} กม. × ${curSym()}${fmt(conv(b.rate))}`, value: fmtCur(b.sub) })),
      { label: `รถติด ${idle} นาที × 3฿`, value: fmtCur(idleC) },
      { label: 'ค่าเรียกผ่านแอป', value: fmtCur(app) },
      { label: 'ค่าทางด่วน', value: fmtCur(toll) },
      { label: 'รวมที่ต้องจ่าย', value: fmtCur(total), total: true },
    ]);
    setExtra('');
  }
};

TOOLS.split = {
  html: () => `
    <div class="panel-eyebrow">หมวด 1 · DAILY</div>
    <h2 class="panel-title">คำนวณ<span class="accent">หารบิล</span></h2>
    <div class="field"><label>ยอดอาหารก่อนภาษี <span class="en">฿</span></label><input type="number" id="s-sub" value="1850" step="10"></div>
    <div class="field-row-3">
      <div class="field"><label>VAT <span class="en">%</span></label><input type="number" id="s-vat" value="7" step="0.5"></div>
      <div class="field"><label>เซอร์วิส <span class="en">%</span></label><input type="number" id="s-svc" value="10" step="0.5"></div>
      <div class="field"><label>ทิป <span class="en">%</span></label><input type="number" id="s-tip" value="0"></div>
    </div>
    <div class="field"><label>จำนวนคน <span class="en">คน</span></label><input type="number" id="s-ppl" value="4" min="1"></div>
    <div class="info-card"><b>วิธีคำนวณ</b>คิด Service ก่อน → บวก VAT บนยอดที่รวมเซอร์วิส → บวกทิปจากยอดอาหาร → หารด้วยจำนวนคน</div>
  `,
  init() {},
  compute() {
    const sub = +$('s-sub').value || 0;
    const vat = +$('s-vat').value || 0;
    const svc = +$('s-svc').value || 0;
    const tip = +$('s-tip').value || 0;
    const ppl = Math.max(1, +$('s-ppl').value || 1);
    const svcAmt = sub*(svc/100);
    const afterSvc = sub + svcAmt;
    const vatAmt = afterSvc*(vat/100);
    const tipAmt = sub*(tip/100);
    const total = afterSvc + vatAmt + tipAmt;
    const per = total/ppl;
    setLabels('จ่ายต่อคน', `รวมบิล ${fmtCur(total)} · หาร ${ppl} คน`);
    setMain(per);
    setRows([
      { label: 'ยอดอาหาร', value: fmtCur(sub) },
      { label: `เซอร์วิส ${svc}%`, value: fmtCur(svcAmt) },
      { label: `VAT ${vat}%`, value: fmtCur(vatAmt) },
      { label: `ทิป ${tip}%`, value: fmtCur(tipAmt) },
      { label: 'ยอดรวมบิล', value: fmtCur(total) },
      { label: `จ่ายต่อคน × ${ppl}`, value: fmtCur(per), total: true },
    ]);
    setExtra('');
  }
};

// =====================================================
// CATEGORY 2: FINANCE
// =====================================================
TOOLS.discount = {
  html: () => `
    <div class="panel-eyebrow">หมวด 2 · FINANCE</div>
    <h2 class="panel-title">คำนวณ<span class="accent">ส่วนลดสินค้า</span></h2>
    <div class="field"><label>ราคาเต็ม <span class="en">฿</span></label><input type="number" id="d-price" value="2990"></div>
    <div class="preset-row" id="d-presets">
      ${[5,10,15,20,25,30,40,50,70].map(p=>`<button class="chip" data-p="${p}">${p}%</button>`).join('')}
    </div>
    <div class="field"><label>ส่วนลด <span class="en">%</span></label><input type="number" id="d-pct" value="20"></div>
    <div class="field"><label>ส่วนลดเพิ่มเติม (ถ้ามี) <span class="en">%</span></label><input type="number" id="d-pct2" value="0"><div class="field-hint">เช่น “ลด 20% + ลดอีก 10%” = ลด 28%</div></div>
    <div class="info-card"><b>วิธีคำนวณ</b>ราคาสุทธิ = ราคาเต็ม × (1 − ส่วนลด/100) × (1 − ส่วนลด2/100)</div>
  `,
  init() {
    document.getElementById('d-presets').addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      document.querySelectorAll('#d-presets .chip').forEach(c=>c.classList.remove('is-active'));
      b.classList.add('is-active');
      $('d-pct').value = b.dataset.p;
      compute();
    });
  },
  compute() {
    const p = +$('d-price').value || 0;
    const d1 = +$('d-pct').value || 0;
    const d2 = +$('d-pct2').value || 0;
    const after1 = p*(1-d1/100);
    const after2 = after1*(1-d2/100);
    const saved = p - after2;
    const effective = p > 0 ? (saved/p)*100 : 0;
    setLabels('ราคาที่ต้องจ่าย', `ประหยัดไป ${fmtCur(saved)} · ส่วนลดรวม ${effective.toFixed(1)}%`);
    setMain(after2);
    setRows([
      { label: 'ราคาเต็ม', value: fmtCur(p) },
      { label: `ส่วนลด ${d1}%`, value: `−${fmtCur(p*d1/100)}` },
      { label: `ส่วนลดเพิ่ม ${d2}%`, value: `−${fmtCur(after1*d2/100)}` },
      { label: 'ประหยัดทั้งหมด', value: fmtCur(saved) },
      { label: 'ราคาสุทธิ', value: fmtCur(after2), total: true },
    ]);
    setExtra('');
  }
};

TOOLS.unitprice = {
  html: () => `
    <div class="panel-eyebrow">หมวด 2 · FINANCE</div>
    <h2 class="panel-title">เทียบ<span class="accent">ราคาต่อหน่วย</span></h2>
    <div class="field-row">
      <div class="field"><label>สินค้า A · ราคา <span class="en">฿</span></label><input type="number" id="up-a-p" value="89"></div>
      <div class="field"><label>สินค้า A · ขนาด</label><input type="number" id="up-a-s" value="500" step="0.1"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>สินค้า B · ราคา <span class="en">฿</span></label><input type="number" id="up-b-p" value="159"></div>
      <div class="field"><label>สินค้า B · ขนาด</label><input type="number" id="up-b-s" value="1000" step="0.1"></div>
    </div>
    <div class="field"><label>หน่วยนับ <span class="en">unit</span></label>
      <select id="up-unit"><option value="ml">มิลลิลิตร (ml)</option><option value="g">กรัม (g)</option><option value="pc">ชิ้น (pc)</option><option value="other">อื่นๆ</option></select>
    </div>
    <div class="info-card"><b>วิธีเปรียบเทียบ</b>ราคาต่อหน่วย = ราคา ÷ ขนาด · อันที่ค่าน้อยกว่าคือคุ้มกว่า</div>
  `,
  init() {},
  compute() {
    const ap = +$('up-a-p').value || 0, as = +$('up-a-s').value || 0.0001;
    const bp = +$('up-b-p').value || 0, bs = +$('up-b-s').value || 0.0001;
    const unit = $('up-unit').value;
    const aPer = ap/as, bPer = bp/bs;
    const winner = aPer < bPer ? 'A' : (bPer < aPer ? 'B' : '=');
    const diff = Math.abs(aPer - bPer);
    const cheap = Math.min(aPer, bPer);
    const savePct = cheap > 0 ? (diff/Math.max(aPer,bPer))*100 : 0;
    setLabels(winner === '=' ? 'ราคาเท่ากัน' : `สินค้า ${winner} คุ้มกว่า`, winner === '=' ? '' : `ประหยัด ${savePct.toFixed(1)}% · ต่างกัน ${fmtCur(diff)}/${unit}`);
    setMainText(winner === '=' ? 'เท่ากัน' : winner);
    setRows([
      { label: 'A · ราคา/ขนาด', value: `${fmtCur(ap)} / ${as} ${unit}` },
      { label: 'A · ราคาต่อหน่วย', value: `${fmtCur(aPer)}/${unit}` },
      { label: 'B · ราคา/ขนาด', value: `${fmtCur(bp)} / ${bs} ${unit}` },
      { label: 'B · ราคาต่อหน่วย', value: `${fmtCur(bPer)}/${unit}` },
      { label: 'ตัวเลือกที่คุ้มกว่า', value: `สินค้า ${winner}`, total: true },
    ]);
    setExtra('');
  }
};

TOOLS.roi = {
  html: () => `
    <div class="panel-eyebrow">หมวด 2 · FINANCE</div>
    <h2 class="panel-title">คำนวณ<span class="accent">ผลตอบแทน ROI</span></h2>
    <div class="field-row">
      <div class="field"><label>เงินลงทุน <span class="en">฿</span></label><input type="number" id="roi-c" value="100000"></div>
      <div class="field"><label>มูลค่าปัจจุบัน <span class="en">฿</span></label><input type="number" id="roi-v" value="135000"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>เงินปันผลรับ <span class="en">฿</span></label><input type="number" id="roi-d" value="3500"></div>
      <div class="field"><label>ระยะเวลาถือ <span class="en">ปี</span></label><input type="number" id="roi-y" value="2" step="0.1"></div>
    </div>
    <div class="info-card"><b>วิธีคำนวณ</b>ROI = (กำไร ÷ ทุน) × 100 · กำไร = (มูลค่า − ทุน) + เงินปันผล · CAGR = ((มูลค่า÷ทุน)^(1/ปี) − 1) × 100</div>
  `,
  init() {},
  compute() {
    const c = +$('roi-c').value || 0;
    const v = +$('roi-v').value || 0;
    const d = +$('roi-d').value || 0;
    const y = +$('roi-y').value || 0.0001;
    const profit = (v - c) + d;
    const roi = c > 0 ? (profit/c)*100 : 0;
    const annROI = y > 0 ? roi/y : 0;
    const cagr = (c > 0 && v > 0 && y > 0) ? (Math.pow((v+d)/c, 1/y) - 1)*100 : 0;
    setLabels('ผลตอบแทนรวม (ROI)', `กำไรสุทธิ ${fmtCur(profit)} · ${y} ปี · CAGR ${cagr.toFixed(2)}%/ปี`);
    setMain(roi, false, '%');
    setRows([
      { label: 'เงินลงทุน', value: fmtCur(c) },
      { label: 'มูลค่าปัจจุบัน', value: fmtCur(v) },
      { label: 'เงินปันผลรับ', value: fmtCur(d) },
      { label: 'กำไรสุทธิ', value: fmtCur(profit) },
      { label: 'ROI ต่อปี (เฉลี่ย)', value: `${annROI.toFixed(2)}%` },
      { label: 'CAGR', value: `${cagr.toFixed(2)}%`, total: true },
    ]);
    setExtra('');
  }
};

TOOLS.cardmin = {
  html: () => `
    <div class="panel-eyebrow">หมวด 2 · FINANCE</div>
    <h2 class="panel-title">ขั้นต่ำ<span class="accent">บัตรเครดิต</span></h2>
    <div class="field"><label>ยอดหนี้คงค้าง <span class="en">฿</span></label><input type="number" id="cc-b" value="50000"></div>
    <div class="field-row">
      <div class="field"><label>ดอกเบี้ย <span class="en">% ต่อปี</span></label><input type="number" id="cc-r" value="16" step="0.5"><div class="field-hint">เพดานในไทย ≈ 16%/ปี</div></div>
      <div class="field"><label>จ่ายขั้นต่ำ <span class="en">% ของยอด</span></label><input type="number" id="cc-m" value="8" step="0.5"></div>
    </div>
    <div class="info-card"><b>วิธีคำนวณ</b>ดอกเบี้ยรายเดือน = ยอด × (อัตรา/12) · เงินต้นที่ลด = จ่ายขั้นต่ำ − ดอกเบี้ย</div>
  `,
  init() {},
  compute() {
    const b = +$('cc-b').value || 0;
    const r = +$('cc-r').value || 0;
    const m = +$('cc-m').value || 0;
    const monthlyInt = b * (r/100/12);
    const minPay = b * (m/100);
    const principalPaid = Math.max(0, minPay - monthlyInt);
    // amortize
    let bal = b, months = 0, totalInt = 0, totalPaid = 0;
    const minFloor = 500;
    while (bal > 0.01 && months < 600) {
      const i = bal*(r/100/12);
      let pay = Math.max(minFloor, bal*(m/100));
      if (pay <= i) { months = 9999; break; }
      if (pay > bal + i) pay = bal + i;
      totalInt += i; totalPaid += pay;
      bal = bal + i - pay;
      months++;
    }
    const years = Math.floor(months/12);
    const mo = months%12;
    setLabels('จ่ายขั้นต่ำเดือนแรก', `ดอกเบี้ย ${fmtCur(monthlyInt)} · ตัดต้น ${fmtCur(principalPaid)}`);
    setMain(minPay);
    setRows([
      { label: 'ดอกเบี้ยเดือนแรก', value: fmtCur(monthlyInt) },
      { label: 'ตัดต้นได้จริง', value: fmtCur(principalPaid) },
      { label: 'ระยะเวลาผ่อนหมด', value: months >= 9999 ? 'ไม่หมด — จ่ายเพิ่ม' : `${years} ปี ${mo} เดือน` },
      { label: 'ดอกเบี้ยรวมตลอด', value: months >= 9999 ? '∞' : fmtCur(totalInt) },
      { label: 'รวมที่ต้องจ่ายทั้งหมด', value: months >= 9999 ? '∞' : fmtCur(totalPaid), total: true },
    ]);
    setExtra(`<div class="info-card" style="margin-top:18px;background:rgba(255,106,61,0.12);border-left-color:var(--accent);color:#fff;"><b style="color:var(--accent);">⚠ คำเตือน</b>การจ่ายเฉพาะขั้นต่ำทำให้ดอกเบี้ยสะสมมหาศาล — ควรจ่ายให้มากกว่าขั้นต่ำเสมอ</div>`);
  }
};

// =====================================================
// CATEGORY 3: PROPERTY
// =====================================================
TOOLS.loan = {
  html: () => `
    <div class="panel-eyebrow">หมวด 3 · PROPERTY</div>
    <h2 class="panel-title">ความสามารถ<span class="accent">กู้ซื้อบ้าน</span></h2>
    <div class="field-row">
      <div class="field"><label>รายได้ต่อเดือน <span class="en">฿</span></label><input type="number" id="ln-i" value="50000"></div>
      <div class="field"><label>ภาระหนี้อื่น/เดือน <span class="en">฿</span></label><input type="number" id="ln-d" value="5000"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>ดอกเบี้ย <span class="en">% ต่อปี</span></label><input type="number" id="ln-r" value="6.5" step="0.1"></div>
      <div class="field"><label>ระยะเวลากู้ <span class="en">ปี</span></label><input type="number" id="ln-y" value="30"></div>
    </div>
    <div class="field"><label>สัดส่วนผ่อน/รายได้ <span class="en">% (DSR)</span></label><input type="number" id="ln-dsr" value="40" step="1"><div class="field-hint">ธนาคารส่วนใหญ่กำหนด 40%</div></div>
    <div class="info-card"><b>วิธีคำนวณ</b>ความสามารถผ่อน/เดือน = (รายได้ × DSR%) − ภาระหนี้อื่น<br>วงเงินกู้ = ค่าผ่อน × ((1 − (1+r/12)^(−n)) ÷ (r/12))</div>
  `,
  init() {},
  compute() {
    const inc = +$('ln-i').value || 0;
    const debt = +$('ln-d').value || 0;
    const r = (+$('ln-r').value || 0)/100/12;
    const n = (+$('ln-y').value || 0)*12;
    const dsr = (+$('ln-dsr').value || 40)/100;
    const cap = Math.max(0, inc*dsr - debt);
    const loan = r > 0 && n > 0 ? cap * (1 - Math.pow(1+r, -n))/r : cap*n;
    const totalPaid = cap*n;
    const interest = totalPaid - loan;
    setLabels('วงเงินกู้สูงสุดที่กู้ได้', `ผ่อน ${fmtCur(cap)}/เดือน × ${+$('ln-y').value} ปี`);
    setMain(loan);
    setRows([
      { label: 'รายได้/เดือน', value: fmtCur(inc) },
      { label: 'ภาระหนี้อื่น', value: fmtCur(debt) },
      { label: 'ผ่อนได้สูงสุด/เดือน', value: fmtCur(cap) },
      { label: 'ดอกเบี้ยรวมตลอดสัญญา', value: fmtCur(interest) },
      { label: 'รวมที่ต้องจ่ายทั้งหมด', value: fmtCur(totalPaid) },
      { label: 'วงเงินกู้สูงสุด', value: fmtCur(loan), total: true },
    ]);
    setExtra('');
  }
};

TOOLS.btu = {
  html: () => `
    <div class="panel-eyebrow">หมวด 3 · PROPERTY</div>
    <h2 class="panel-title">คำนวณ<span class="accent">BTU แอร์</span></h2>
    <div class="field-row">
      <div class="field"><label>กว้าง <span class="en">เมตร</span></label><input type="number" id="btu-w" value="4" step="0.1"></div>
      <div class="field"><label>ยาว <span class="en">เมตร</span></label><input type="number" id="btu-l" value="5" step="0.1"></div>
    </div>
    <div class="field"><label>ประเภทห้อง</label>
      <select id="btu-type">
        <option value="700">ห้องนอน · 700 BTU/ตร.ม.</option>
        <option value="800" selected>ห้องนั่งเล่น · 800 BTU/ตร.ม.</option>
        <option value="900">ห้องที่โดนแดด · 900 BTU/ตร.ม.</option>
        <option value="1000">ห้องครัว/ร้านค้า · 1,000 BTU/ตร.ม.</option>
      </select>
    </div>
    <div class="info-card"><b>ขนาดที่นิยมในตลาด</b>9,000 · 12,000 · 18,000 · 24,000 · 30,000 · 36,000 BTU<br>ระบบจะแนะนำขนาดที่ใกล้เคียงและไม่ต่ำกว่าที่คำนวณได้</div>
  `,
  init() {},
  compute() {
    const w = +$('btu-w').value || 0;
    const l = +$('btu-l').value || 0;
    const rate = +$('btu-type').value || 800;
    const area = w*l;
    const need = area*rate;
    const sizes = [9000,12000,18000,24000,30000,36000,48000];
    const recommend = sizes.find(s => s >= need) || sizes[sizes.length-1];
    setLabels('BTU ที่ต้องการ', `ห้องขนาด ${area.toFixed(1)} ตร.ม. · แนะนำ ${recommend.toLocaleString()} BTU`);
    setMain(need, false, 'BTU');
    setRows([
      { label: 'พื้นที่ห้อง', value: `${area.toFixed(2)} ตร.ม.` },
      { label: 'อัตราตามประเภทห้อง', value: `${rate} BTU/ตร.ม.` },
      { label: 'BTU ที่คำนวณได้', value: `${Math.round(need).toLocaleString()} BTU` },
      { label: 'ขนาดแอร์ที่แนะนำ', value: `${recommend.toLocaleString()} BTU`, total: true },
    ]);
    setExtra('');
  }
};

TOOLS.paint = {
  html: () => `
    <div class="panel-eyebrow">หมวด 3 · PROPERTY</div>
    <h2 class="panel-title">คำนวณ<span class="accent">สีทาบ้าน</span></h2>
    <div class="field-row-3">
      <div class="field"><label>กว้าง <span class="en">m</span></label><input type="number" id="pt-w" value="4" step="0.1"></div>
      <div class="field"><label>ยาว <span class="en">m</span></label><input type="number" id="pt-l" value="5" step="0.1"></div>
      <div class="field"><label>สูง <span class="en">m</span></label><input type="number" id="pt-h" value="2.7" step="0.1"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>ประตู/หน้าต่าง <span class="en">ตร.ม.</span></label><input type="number" id="pt-open" value="6" step="0.1"></div>
      <div class="field"><label>จำนวนเที่ยวทา <span class="en">รอบ</span></label><input type="number" id="pt-coats" value="2" min="1"></div>
    </div>
    <div class="field"><label>อัตราการกินสี <span class="en">ตร.ม./ลิตร</span></label><input type="number" id="pt-rate" value="11" step="0.5"><div class="field-hint">สีน้ำพลาสติกทั่วไป ~10–12 ตร.ม./ลิตร/รอบ</div></div>
    <div class="info-card"><b>วิธีคำนวณ</b>พื้นที่ผนัง = (กว้าง+ยาว) × 2 × สูง − ประตู/หน้าต่าง<br>ปริมาณสี = พื้นที่ × รอบทา ÷ อัตราการกินสี</div>
  `,
  init() {},
  compute() {
    const w = +$('pt-w').value || 0;
    const l = +$('pt-l').value || 0;
    const h = +$('pt-h').value || 0;
    const open = +$('pt-open').value || 0;
    const coats = Math.max(1, +$('pt-coats').value || 1);
    const rate = +$('pt-rate').value || 11;
    const wall = Math.max(0, (w+l)*2*h - open);
    const totalArea = wall * coats;
    const litres = totalArea / rate;
    const cans3_5 = Math.ceil(litres / 3.5);
    const cans9 = Math.ceil(litres / 9);
    setLabels('ปริมาณสีที่ต้องใช้', `ผนัง ${wall.toFixed(1)} ตร.ม. × ${coats} รอบ`);
    setMain(litres, false, 'ลิตร');
    setRows([
      { label: 'พื้นที่ผนังสุทธิ', value: `${wall.toFixed(2)} ตร.ม.` },
      { label: 'พื้นที่ทา (รวมรอบ)', value: `${totalArea.toFixed(2)} ตร.ม.` },
      { label: 'ปริมาณสีที่ต้องใช้', value: `${litres.toFixed(2)} ลิตร` },
      { label: 'ถังเล็ก 3.5 ลิตร', value: `${cans3_5} ถัง` },
      { label: 'ถังใหญ่ 9 ลิตร', value: `${cans9} ถัง`, total: true },
    ]);
    setExtra('');
  }
};

// =====================================================
// CATEGORY 4: HEALTH
// =====================================================
TOOLS.water_intake = {
  html: () => `
    <div class="panel-eyebrow">หมวด 4 · HEALTH</div>
    <h2 class="panel-title">ปริมาณ<span class="accent">น้ำที่ควรดื่ม</span></h2>
    <div class="field-row">
      <div class="field"><label>น้ำหนักตัว <span class="en">kg</span></label><input type="number" id="wi-w" value="65"></div>
      <div class="field"><label>ออกกำลังกาย <span class="en">นาที/วัน</span></label><input type="number" id="wi-e" value="30"></div>
    </div>
    <div class="field"><label>สภาพอากาศ</label>
      <select id="wi-c">
        <option value="1.0">ปกติ</option>
        <option value="1.1" selected>ร้อน (ไทย)</option>
        <option value="1.2">ร้อนจัด/แดดจัด</option>
      </select>
    </div>
    <div class="info-card"><b>วิธีคำนวณ</b>น้ำพื้นฐาน = น้ำหนัก × 33 มล. + ออกกำลังกาย × 12 มล./นาที × ตัวคูณอากาศ</div>
  `,
  init() {},
  compute() {
    const w = +$('wi-w').value || 0;
    const e = +$('wi-e').value || 0;
    const c = +$('wi-c').value || 1;
    const ml = (w*33 + e*12) * c;
    const litres = ml/1000;
    const glasses = Math.round(ml/250);
    setLabels('ปริมาณน้ำที่ควรดื่มต่อวัน', `≈ ${glasses} แก้ว (250 มล.)`);
    setMain(litres, false, 'ลิตร');
    setRows([
      { label: 'จากน้ำหนักตัว', value: `${(w*33).toFixed(0)} ml` },
      { label: 'ชดเชยการออกกำลังกาย', value: `${(e*12).toFixed(0)} ml` },
      { label: 'ตัวคูณสภาพอากาศ', value: `× ${c}` },
      { label: 'รวมต่อวัน', value: `${ml.toFixed(0)} ml`, total: true },
    ]);
    setExtra(`<div class="result-grid"><div class="mini-stat"><div class="mini-label">เป็นแก้ว</div><div class="mini-val">${glasses}</div><div class="mini-sub">แก้ว 250 มล.</div></div><div class="mini-stat"><div class="mini-label">เป็นขวด</div><div class="mini-val">${(ml/600).toFixed(1)}</div><div class="mini-sub">ขวด 600 มล.</div></div></div>`);
  }
};

TOOLS.ovulation = {
  html: () => `
    <div class="panel-eyebrow">หมวด 4 · HEALTH</div>
    <h2 class="panel-title">คำนวณ<span class="accent">วันไข่ตก</span></h2>
    <div class="field"><label>วันแรกของประจำเดือนรอบล่าสุด</label><input type="date" id="ov-d"></div>
    <div class="field"><label>ความยาวรอบเดือน <span class="en">วัน</span></label><input type="number" id="ov-c" value="28" min="20" max="40"></div>
    <div class="info-card"><b>วิธีคำนวณ</b>วันไข่ตก ≈ วันที่ 14 ก่อนรอบเดือนถัดไป · ช่วงตั้งครรภ์ง่ายคือ 5 วันก่อน + วันไข่ตก<br><br>ตัวเลขนี้เป็นค่าโดยประมาณ — ควรปรึกษาแพทย์ประกอบ</div>
  `,
  init() {
    const today = new Date();
    today.setDate(today.getDate() - 7);
    $('ov-d').value = today.toISOString().slice(0,10);
  },
  compute() {
    const dStr = $('ov-d').value;
    if (!dStr) { setLabels('กรุณาเลือกวันที่', ''); setMainText('—'); setRows([]); return; }
    const start = new Date(dStr);
    const cycle = +$('ov-c').value || 28;
    const ovDay = new Date(start); ovDay.setDate(ovDay.getDate() + cycle - 14);
    const fertileStart = new Date(ovDay); fertileStart.setDate(fertileStart.getDate() - 5);
    const nextPeriod = new Date(start); nextPeriod.setDate(nextPeriod.getDate() + cycle);
    const fmtDate = d => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const ovDayStr = fmtDate(ovDay);
    setLabels('วันไข่ตก (โดยประมาณ)', `ช่วงเจริญพันธุ์: ${fmtDate(fertileStart)} – ${fmtDate(ovDay)}`);
    setMainText(ovDayStr);
    setRows([
      { label: 'วันแรกของรอบล่าสุด', value: fmtDate(start) },
      { label: 'ช่วงเจริญพันธุ์เริ่ม', value: fmtDate(fertileStart) },
      { label: 'วันไข่ตก', value: fmtDate(ovDay) },
      { label: 'รอบเดือนถัดไปคาดว่า', value: fmtDate(nextPeriod), total: true },
    ]);
    setExtra('');
  }
};

TOOLS.sleep = {
  html: () => `
    <div class="panel-eyebrow">หมวด 4 · HEALTH</div>
    <h2 class="panel-title">คำนวณ<span class="accent">รอบการนอน</span></h2>
    <div class="field"><label>โหมด</label>
      <select id="sl-mode">
        <option value="wake" selected>อยากตื่นเวลา... ฉันควรเข้านอนกี่โมง?</option>
        <option value="bed">ฉันจะนอนเดี๋ยวนี้... ควรตั้งนาฬิกาตื่นกี่โมง?</option>
      </select>
    </div>
    <div class="field" id="sl-wake-wrap"><label>เวลาที่ต้องการตื่น</label><input type="time" id="sl-wake" value="06:30"></div>
    <div class="info-card"><b>หลักการ</b>การนอน 1 รอบ = ประมาณ 90 นาที · ตื่นในช่วงระหว่างรอบจะรู้สึกสดชื่นกว่าตื่นกลางรอบ<br>เผื่อเวลาเข้านอน 15 นาที</div>
  `,
  init() {
    $('sl-mode').addEventListener('change', () => {
      const wakeWrap = $('sl-wake-wrap');
      if ($('sl-mode').value === 'bed') {
        wakeWrap.style.display = 'none';
      } else {
        wakeWrap.style.display = '';
      }
      compute();
    });
  },
  compute() {
    const mode = $('sl-mode').value;
    const FALL = 15; // minutes
    const CYCLE = 90;
    const fmtTime = d => d.toTimeString().slice(0,5);
    if (mode === 'wake') {
      const wakeStr = $('sl-wake').value || '06:30';
      const [h,m] = wakeStr.split(':').map(Number);
      const wake = new Date(); wake.setHours(h, m, 0, 0);
      const cycles = [3,4,5,6];
      const times = cycles.map(c => {
        const t = new Date(wake.getTime() - (c*CYCLE + FALL)*60000);
        return { c, t };
      });
      const best = times.find(x => x.c === 5) || times[2];
      setLabels('ควรเข้านอนเวลา (เลือกที่เหมาะกับคุณ)', `เผื่อเวลานอนหลับ ${FALL} นาที · รอบ 90 นาที`);
      setMainText(fmtTime(best.t));
      setRows([
        { label: 'เวลาตื่นที่ตั้งไว้', value: wakeStr },
        ...times.map(x => ({ label: `${x.c} รอบ (${(x.c*1.5).toFixed(1)} ชม.)`, value: fmtTime(x.t) + (x.c===5?' ⭐':'') })),
      ]);
      setExtra(`<div class="cycle-grid">${times.map(x => `<div class="cycle-pill ${x.c===5?'best':''}"><div class="ct">${fmtTime(x.t)}</div><div class="cs">${x.c} รอบ · ${(x.c*1.5).toFixed(1)} ชม.</div></div>`).join('')}</div>`);
    } else {
      const now = new Date();
      const cycles = [3,4,5,6];
      const times = cycles.map(c => {
        const t = new Date(now.getTime() + (c*CYCLE + FALL)*60000);
        return { c, t };
      });
      const best = times.find(x => x.c === 5) || times[2];
      setLabels('ควรตั้งนาฬิกาตื่นเวลา', `เริ่มนอนตอนนี้ · ${fmtTime(now)}`);
      setMainText(fmtTime(best.t));
      setRows([
        { label: 'เริ่มนอนตอนนี้', value: fmtTime(now) },
        ...times.map(x => ({ label: `${x.c} รอบ (${(x.c*1.5).toFixed(1)} ชม.)`, value: fmtTime(x.t) + (x.c===5?' ⭐':'') })),
      ]);
      setExtra(`<div class="cycle-grid">${times.map(x => `<div class="cycle-pill ${x.c===5?'best':''}"><div class="ct">${fmtTime(x.t)}</div><div class="cs">${x.c} รอบ · ${(x.c*1.5).toFixed(1)} ชม.</div></div>`).join('')}</div>`);
    }
  }
};

TOOLS.pet_age = {
  html: () => `
    <div class="panel-eyebrow">หมวด 4 · HEALTH</div>
    <h2 class="panel-title">อายุ<span class="accent">สัตว์เลี้ยง</span> เทียบเป็นคน</h2>
    <div class="field"><label>ประเภท</label>
      <select id="pa-t">
        <option value="dog-s">สุนัขพันธุ์เล็ก (&lt;10 กก.)</option>
        <option value="dog-m" selected>สุนัขพันธุ์กลาง (10–25 กก.)</option>
        <option value="dog-l">สุนัขพันธุ์ใหญ่ (&gt;25 กก.)</option>
        <option value="cat">แมว</option>
      </select>
    </div>
    <div class="field"><label>อายุของน้อง <span class="en">ปี</span></label><input type="number" id="pa-y" value="3" step="0.5" min="0"></div>
    <div class="info-card"><b>หลักการ</b>2 ปีแรกของสุนัข ≈ 24 ปีคน · หลังจากนั้นพันธุ์เล็ก/กลาง/ใหญ่จะแก่ในอัตราต่างกัน<br>แมว: ปีแรก = 15 ปีคน · ปีที่ 2 = 24 · หลังจากนั้น +4 ปี/ปี</div>
  `,
  init() {},
  compute() {
    const t = $('pa-t').value;
    const y = +$('pa-y').value || 0;
    let human = 0;
    if (t === 'cat') {
      if (y <= 1) human = y*15;
      else if (y <= 2) human = 15 + (y-1)*9;
      else human = 24 + (y-2)*4;
    } else {
      // dog: first 2 years = 24
      if (y <= 1) human = y*15;
      else if (y <= 2) human = 15 + (y-1)*9;
      else {
        const perYear = t === 'dog-s' ? 4 : t === 'dog-m' ? 5 : 6;
        human = 24 + (y-2)*perYear;
      }
    }
    const lifespan = t === 'cat' ? 15 : t === 'dog-s' ? 14 : t === 'dog-m' ? 12 : 10;
    const pct = Math.min(100, (y/lifespan)*100);
    setLabels('อายุน้องเทียบเป็นคน', `น้อง ${y} ปี · อายุขัยเฉลี่ย ${lifespan} ปี (≈ ${pct.toFixed(0)}% ของชีวิต)`);
    setMain(human, false, 'ปีคน');
    setRows([
      { label: 'อายุจริง', value: `${y} ปี` },
      { label: 'ประเภท', value: $('pa-t').selectedOptions[0].textContent },
      { label: 'เทียบเป็นปีคน', value: `${human.toFixed(1)} ปี`, total: true },
    ]);
    setExtra('');
  }
};

// =====================================================
// CATEGORY 5: WORK
// =====================================================
TOOLS.wage = {
  html: () => `
    <div class="panel-eyebrow">หมวด 5 · WORK</div>
    <h2 class="panel-title">ค่าแรง<span class="accent">รายชั่วโมง</span></h2>
    <div class="field"><label>เงินเดือน/รายได้รวมต่อเดือน <span class="en">฿</span></label><input type="number" id="wg-s" value="35000"></div>
    <div class="field-row">
      <div class="field"><label>ทำงาน <span class="en">วัน/สัปดาห์</span></label><input type="number" id="wg-d" value="5" step="0.5"></div>
      <div class="field"><label>ทำงาน <span class="en">ชั่วโมง/วัน</span></label><input type="number" id="wg-h" value="8" step="0.5"></div>
    </div>
    <div class="field"><label>วันลาพักร้อน/ปี <span class="en">วัน</span></label><input type="number" id="wg-v" value="14"></div>
    <div class="info-card"><b>วิธีคำนวณ</b>ชั่วโมงทำงาน/ปี = (52 สัปดาห์ × วัน × ชั่วโมง) − (วันลา × ชั่วโมง)<br>ค่าแรง/ชม. = (เงินเดือน × 12) ÷ ชั่วโมงทำงาน/ปี</div>
  `,
  init() {},
  compute() {
    const s = +$('wg-s').value || 0;
    const d = +$('wg-d').value || 0;
    const h = +$('wg-h').value || 0;
    const v = +$('wg-v').value || 0;
    const yearlyHours = Math.max(1, 52*d*h - v*h);
    const hourly = (s*12)/yearlyHours;
    const daily = hourly*h;
    const weekly = daily*d;
    const ot15 = hourly*1.5;
    const ot3 = hourly*3;
    setLabels('ค่าแรง/ชั่วโมง', `${fmtInt(yearlyHours)} ชม.ทำงาน/ปี · ${fmtCur(s*12)}/ปี`);
    setMain(hourly);
    setRows([
      { label: 'รายได้/ปี', value: fmtCur(s*12) },
      { label: 'ชม.ทำงาน/ปี', value: `${fmtInt(yearlyHours)} ชม.` },
      { label: 'ค่าแรง/ชั่วโมง', value: fmtCur(hourly), total: true },
    ]);
    setExtra(`<div class="result-grid">
      <div class="mini-stat"><div class="mini-label">ต่อวัน</div><div class="mini-val">${fmtCur(daily)}</div><div class="mini-sub">${h} ชม.</div></div>
      <div class="mini-stat"><div class="mini-label">ต่อสัปดาห์</div><div class="mini-val">${fmtCur(weekly)}</div><div class="mini-sub">${d*h} ชม.</div></div>
      <div class="mini-stat"><div class="mini-label">OT × 1.5</div><div class="mini-val">${fmtCur(ot15)}</div><div class="mini-sub">/ชม.</div></div>
      <div class="mini-stat"><div class="mini-label">OT วันหยุด × 3</div><div class="mini-val">${fmtCur(ot3)}</div><div class="mini-sub">/ชม.</div></div>
    </div>`);
  }
};

TOOLS.countdown = {
  html: () => `
    <div class="panel-eyebrow">หมวด 5 · WORK</div>
    <h2 class="panel-title">นับ<span class="accent">วัน</span></h2>
    <div class="field-row">
      <div class="field"><label>วันที่เริ่มต้น</label><input type="date" id="cd-s"></div>
      <div class="field"><label>วันที่ปลายทาง</label><input type="date" id="cd-e"></div>
    </div>
    <div class="field"><label>นับเฉพาะ</label>
      <select id="cd-mode">
        <option value="all" selected>ทุกวัน</option>
        <option value="weekday">วันทำงาน (จันทร์–ศุกร์)</option>
        <option value="weekend">เฉพาะเสาร์–อาทิตย์</option>
      </select>
    </div>
    <div class="info-card"><b>วิธีใช้</b>ตั้งวันเริ่มเป็นวันนี้ และวันปลายทางเป็น deadline ของโปรเจกต์ — ระบบจะนับวันที่เหลือให้</div>
  `,
  init() {
    const today = new Date();
    const future = new Date(); future.setDate(future.getDate() + 30);
    $('cd-s').value = today.toISOString().slice(0,10);
    $('cd-e').value = future.toISOString().slice(0,10);
  },
  compute() {
    const s = $('cd-s').value, e = $('cd-e').value;
    if (!s || !e) { setLabels('กรุณาเลือกวันที่', ''); setMainText('—'); setRows([]); return; }
    const sd = new Date(s), ed = new Date(e);
    const diff = Math.round((ed - sd)/(1000*60*60*24));
    const mode = $('cd-mode').value;
    let count = 0;
    const sign = diff < 0 ? -1 : 1;
    const steps = Math.abs(diff);
    for (let i = 0; i <= steps; i++) {
      const d = new Date(sd); d.setDate(d.getDate() + i*sign);
      const w = d.getDay();
      const isWeekend = w === 0 || w === 6;
      if (mode === 'all') count++;
      else if (mode === 'weekday' && !isWeekend) count++;
      else if (mode === 'weekend' && isWeekend) count++;
    }
    if (steps > 0) count -= 1; // exclude end day end? keep inclusive simpler — but feels right inclusive
    if (count < 0) count = 0;
    const weeks = Math.floor(steps/7);
    const months = (steps/30.44).toFixed(1);
    setLabels(diff >= 0 ? 'จำนวนวันที่เหลือ' : 'ผ่านมาแล้ว', `${sd.toLocaleDateString('th-TH')} → ${ed.toLocaleDateString('th-TH')}`);
    setMain(Math.abs(count), false, 'วัน');
    setRows([
      { label: 'รวมทุกวัน', value: `${Math.abs(diff)} วัน` },
      { label: 'จำนวนสัปดาห์', value: `${weeks} สัปดาห์` },
      { label: 'จำนวนเดือน (ประมาณ)', value: `${months} เดือน` },
      { label: $('cd-mode').selectedOptions[0].textContent, value: `${Math.abs(count)} วัน`, total: true },
    ]);
    setExtra('');
  }
};

TOOLS.download = {
  html: () => `
    <div class="panel-eyebrow">หมวด 5 · WORK</div>
    <h2 class="panel-title">เวลา<span class="accent">ดาวน์โหลด</span></h2>
    <div class="field-row">
      <div class="field"><label>ขนาดไฟล์</label><input type="number" id="dl-s" value="2.5" step="0.1"></div>
      <div class="field"><label>หน่วย</label>
        <select id="dl-su"><option value="MB">MB</option><option value="GB" selected>GB</option><option value="TB">TB</option></select>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>ความเร็วเน็ต</label><input type="number" id="dl-r" value="100"></div>
      <div class="field"><label>หน่วย</label>
        <select id="dl-ru"><option value="Mbps" selected>Mbps</option><option value="Gbps">Gbps</option><option value="MBps">MB/s</option></select>
      </div>
    </div>
    <div class="info-card"><b>เกร็ดความรู้</b>1 ไบต์ = 8 บิต → 100 Mbps ≈ 12.5 MB/s · ประสิทธิภาพจริงมักได้ ~85–90% ของความเร็วที่โฆษณา</div>
  `,
  init() {},
  compute() {
    const s = +$('dl-s').value || 0;
    const su = $('dl-su').value;
    const r = +$('dl-r').value || 0.0001;
    const ru = $('dl-ru').value;
    const sizeMB = s * (su === 'MB' ? 1 : su === 'GB' ? 1024 : 1024*1024);
    const speedMBps = r * (ru === 'Mbps' ? 1/8 : ru === 'Gbps' ? 1024/8 : 1);
    const seconds = sizeMB / speedMBps;
    const realistic = seconds / 0.875; // 87.5% efficiency
    const fmtTime = sec => {
      if (sec < 60) return `${sec.toFixed(1)} วินาที`;
      if (sec < 3600) return `${Math.floor(sec/60)} นาที ${Math.round(sec%60)} วิ`;
      const h = Math.floor(sec/3600); const m = Math.round((sec%3600)/60);
      return `${h} ชม. ${m} นาที`;
    };
    setLabels('เวลาในอุดมคติ', `เน็ต ${r} ${ru} ≈ ${speedMBps.toFixed(2)} MB/s`);
    setMainText(fmtTime(seconds));
    setRows([
      { label: 'ขนาดไฟล์', value: `${s} ${su} (${fmtInt(sizeMB)} MB)` },
      { label: 'ความเร็วเน็ต', value: `${r} ${ru}` },
      { label: 'ความเร็วใน MB/s', value: `${speedMBps.toFixed(2)} MB/s` },
      { label: 'เวลาในอุดมคติ', value: fmtTime(seconds) },
      { label: 'เวลาที่น่าจะเป็นจริง', value: fmtTime(realistic), total: true },
    ]);
    setExtra('');
  }
};

// =====================================================
// CATEGORY 6: COOKING
// =====================================================
TOOLS.recipe = {
  html: () => `
    <div class="panel-eyebrow">หมวด 6 · KITCHEN</div>
    <h2 class="panel-title">ปรับ<span class="accent">สูตรอาหาร</span></h2>
    <div class="field-row">
      <div class="field"><label>สูตรเดิมทำได้ <span class="en">ที่</span></label><input type="number" id="rc-from" value="2"></div>
      <div class="field"><label>ต้องการทำ <span class="en">ที่</span></label><input type="number" id="rc-to" value="5"></div>
    </div>
    <div class="field"><label>วัตถุดิบ <span class="en">ingredients</span></label></div>
    <div class="ing-list" id="rc-list"></div>
    <button class="add-row" id="rc-add">+ เพิ่มวัตถุดิบ</button>
    <div class="info-card"><b>วิธีใช้</b>กรอกชื่อ + จำนวน + หน่วยของแต่ละส่วนผสม ระบบจะคูณตัวคูณ (ที่ใหม่ ÷ ที่เดิม) ให้อัตโนมัติ</div>
  `,
  init() {
    const seeds = [
      { n: 'ข้าวสวย', q: 1, u: 'ถ้วย' },
      { n: 'ไข่ไก่', q: 2, u: 'ฟอง' },
      { n: 'น้ำปลา', q: 1, u: 'ช้อนโต๊ะ' },
      { n: 'น้ำมันพืช', q: 2, u: 'ช้อนโต๊ะ' },
    ];
    const list = $('rc-list'); list.innerHTML = '';
    seeds.forEach(s => addRow(s));
    $('rc-add').addEventListener('click', () => { addRow(); compute(); });
    function addRow(seed = {n:'',q:1,u:'ช้อนโต๊ะ'}) {
      const row = document.createElement('div');
      row.className = 'ing-row';
      row.innerHTML = `
        <input type="text" placeholder="ชื่อส่วนผสม" value="${seed.n}">
        <input type="number" step="0.01" value="${seed.q}">
        <input type="text" value="${seed.u}">
        <button class="x-btn" type="button">×</button>
      `;
      row.querySelectorAll('input').forEach(i => i.addEventListener('input', compute));
      row.querySelector('.x-btn').addEventListener('click', () => { row.remove(); compute(); });
      list.appendChild(row);
    }
  },
  compute() {
    const from = +$('rc-from').value || 1;
    const to = +$('rc-to').value || 1;
    const k = to/from;
    const rows = [...document.querySelectorAll('#rc-list .ing-row')];
    const data = rows.map(r => {
      const ins = r.querySelectorAll('input');
      return { n: ins[0].value, q: +ins[1].value || 0, u: ins[2].value };
    }).filter(d => d.n);
    setLabels(`สูตรปรับเป็น ${to} ที่`, `จากเดิม ${from} ที่ · ตัวคูณ × ${k.toFixed(2)}`);
    setMainText(`× ${k.toFixed(2)}`);
    setRows(data.map(d => ({
      label: d.n,
      value: `${(d.q*k).toFixed(d.q*k % 1 === 0 ? 0 : 2)} ${d.u}`
    })));
    setExtra('');
  }
};

TOOLS.units = {
  html: () => `
    <div class="panel-eyebrow">หมวด 6 · KITCHEN</div>
    <h2 class="panel-title">แปลง<span class="accent">หน่วยตวง</span></h2>
    <div class="field"><label>ประเภท</label>
      <select id="u-type">
        <option value="vol">ปริมาตร (ของเหลว/ตวง)</option>
        <option value="mass">น้ำหนัก/มวล</option>
        <option value="temp">อุณหภูมิ</option>
        <option value="len">ความยาว</option>
      </select>
    </div>
    <div class="field-row">
      <div class="field"><label>ค่า</label><input type="number" id="u-val" value="1" step="0.01"></div>
      <div class="field"><label>จาก</label><select id="u-from"></select></div>
    </div>
    <div class="field"><label>ไป</label><select id="u-to"></select></div>
    <div class="info-card"><b>เกร็ด</b>1 ช้อนโต๊ะ = 15 มล. · 1 ช้อนชา = 5 มล. · 1 ถ้วยตวง (US) = 240 มล. · 1 ออนซ์ = 28.35 กรัม</div>
  `,
  init() {
    const UNITS = {
      vol: { ml:1, l:1000, tsp:5, tbsp:15, cup:240, 'fl-oz':29.5735, 'pint':473.176, 'quart':946.353, 'gallon':3785.41, 'thai-cup':250 },
      mass: { g:1, kg:1000, mg:0.001, oz:28.3495, lb:453.592, 'thai-baht':15 },
      len: { mm:1, cm:10, m:1000, inch:25.4, ft:304.8 },
    };
    const LABELS = {
      vol: { ml:'มิลลิลิตร (ml)', l:'ลิตร (L)', tsp:'ช้อนชา (tsp)', tbsp:'ช้อนโต๊ะ (tbsp)', cup:'ถ้วยตวง US (240ml)', 'fl-oz':'fl oz', 'pint':'ไพนต์', 'quart':'ควอร์ต', 'gallon':'แกลลอน', 'thai-cup':'ถ้วยไทย (250ml)' },
      mass: { g:'กรัม (g)', kg:'กิโลกรัม (kg)', mg:'มิลลิกรัม (mg)', oz:'ออนซ์ (oz)', lb:'ปอนด์ (lb)', 'thai-baht':'บาทน้ำหนักทอง' },
      len: { mm:'มม.', cm:'ซม.', m:'เมตร', inch:'นิ้ว', ft:'ฟุต' },
    };
    function fillSelects() {
      const t = $('u-type').value;
      const fromSel = $('u-from'), toSel = $('u-to');
      fromSel.innerHTML = ''; toSel.innerHTML = '';
      if (t === 'temp') {
        ['c','f','k'].forEach(k => {
          const lbl = k === 'c' ? '°C เซลเซียส' : k === 'f' ? '°F ฟาเรนไฮต์' : 'K เคลวิน';
          fromSel.innerHTML += `<option value="${k}">${lbl}</option>`;
          toSel.innerHTML += `<option value="${k}">${lbl}</option>`;
        });
        fromSel.value = 'c'; toSel.value = 'f';
      } else {
        const keys = Object.keys(UNITS[t]);
        keys.forEach(k => {
          fromSel.innerHTML += `<option value="${k}">${LABELS[t][k]}</option>`;
          toSel.innerHTML += `<option value="${k}">${LABELS[t][k]}</option>`;
        });
        fromSel.value = keys[0]; toSel.value = keys[1] || keys[0];
      }
    }
    fillSelects();
    $('u-type').addEventListener('change', () => { fillSelects(); compute(); });
    TOOLS.units._UNITS = UNITS;
    TOOLS.units._LABELS = LABELS;
  },
  compute() {
    const t = $('u-type').value;
    const v = +$('u-val').value || 0;
    const from = $('u-from').value, to = $('u-to').value;
    let result = 0;
    if (t === 'temp') {
      // to celsius first
      let c;
      if (from === 'c') c = v;
      else if (from === 'f') c = (v - 32) * 5/9;
      else c = v - 273.15;
      if (to === 'c') result = c;
      else if (to === 'f') result = c * 9/5 + 32;
      else result = c + 273.15;
      const unitMap = { c:'°C', f:'°F', k:'K' };
      setLabels(`${v} ${unitMap[from]} = ${result.toFixed(2)} ${unitMap[to]}`, '');
      setMainText(result.toFixed(2), unitMap[to]);
      setRows([
        { label: 'ค่าเริ่มต้น', value: `${v} ${unitMap[from]}` },
        { label: 'ผลลัพธ์', value: `${result.toFixed(2)} ${unitMap[to]}`, total: true },
      ]);
    } else {
      const units = TOOLS.units._UNITS[t];
      const labels = TOOLS.units._LABELS[t];
      const baseVal = v * units[from];
      result = baseVal / units[to];
      setLabels(`${v} ${labels[from]} = ${result} ${labels[to]}`, '');
      setMainText(result.toLocaleString('en-US', {maximumFractionDigits: 4}), labels[to].split(' ')[0]);
      setRows([
        { label: 'ค่าเริ่มต้น', value: `${v} ${labels[from]}` },
        { label: 'แปลงเป็น', value: `${result.toLocaleString('en-US',{maximumFractionDigits:4})} ${labels[to]}`, total: true },
      ]);
    }
    setExtra('');
  }
};

// =====================================================
// APP DRIVER
// =====================================================
function compute() {
  const tool = TOOLS[state.tool];
  if (tool && tool.compute) tool.compute();
}

function renderTools() {
  const cat = CATEGORIES[state.cat];
  const nav = $('tools-nav');
  nav.innerHTML = cat.tools.map(t => `<button class="tool-chip ${t.id===state.tool?'active':''}" data-tool="${t.id}"><span class="icon">${t.icon}</span>${t.name}</button>`).join('');
  nav.querySelectorAll('.tool-chip').forEach(b => b.addEventListener('click', () => {
    state.tool = b.dataset.tool;
    renderTools();
    renderTool();
  }));
}

function renderTool() {
  const tool = TOOLS[state.tool];
  if (!tool) return;
  $('input-panel').innerHTML = tool.html();
  if (tool.init) tool.init();
  // bind inputs
  $('input-panel').querySelectorAll('input, select').forEach(i => i.addEventListener('input', compute));
  $('input-panel').querySelectorAll('select').forEach(i => i.addEventListener('change', compute));
  compute();
}

function selectCategory(cat) {
  state.cat = cat;
  state.tool = DEFAULT_TOOL[cat];
  document.querySelectorAll('.cat').forEach(c => c.classList.toggle('active', c.dataset.cat === cat));
  renderTools();
  renderTool();
}

// ----- TOPBAR -----
function bindTopbar() {
  // currency
  $('cur-btn').addEventListener('click', e => {
    const seg = e.target.closest('.seg');
    if (!seg) {
      // toggle
      state.currency = state.currency === 'THB' ? 'USD' : 'THB';
    } else {
      state.currency = seg.dataset.cur;
    }
    document.querySelectorAll('#cur-btn .seg').forEach(s => s.classList.toggle('on', s.dataset.cur === state.currency));
    compute();
  });
  // theme
  $('theme-btn').addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    $('theme-ico').textContent = state.theme === 'light' ? '☀' : '☾';
    $('theme-lbl').textContent = state.theme === 'light' ? 'Light' : 'Dark';
  });
}

// ----- INIT -----
function init() {
  document.querySelectorAll('.cat').forEach(c => c.addEventListener('click', () => selectCategory(c.dataset.cat)));
  bindTopbar();
  selectCategory('daily');
}
init();
