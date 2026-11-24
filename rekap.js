/* ---------- Rekap Laporan: total pengumpulan (dari Perhimpunan) dan alokasi pendistribusian per tingkat ---------- */
const RK_KEY = 'rekapLaporanPersen';
const RK_LEVELS = [['dkm','DKM/RT/RW'],['des','Desa/Kelurahan'],['kec','Kecamatan'],['kab','Kabupaten']];
const RK_ROWS = [
  {key:'zakat_fitrah',no:1,label:'Zakat Fitrah',leaves:[
    {id:'fitrah_non',label:'Asnaf non amilin',use:['dkm']},
    {id:'fitrah_amil',label:'Asnaf amilin',use:['dkm','des']}]},
  {key:'bis_ramadhan',no:2,label:'BIS Ramadhan',leaves:[
    {id:'bis_opz',label:'Penguatan kelembagaan OPZ',use:['dkm','des','kec','kab']}]},
  {key:'zakat_mal',no:3,label:'Zakat Mal Ramadhan',leaves:[{id:'zakat_mal',label:null,use:['dkm']}]},
  {key:'infak_umum',no:4,label:'Infak Umum',leaves:[{id:'infak_umum',label:null,use:['dkm']}]},
  {key:'fidyah',no:5,label:'Fidyah',leaves:[{id:'fidyah',label:null,use:['dkm']}]}
];
/* Persentase bawaan sesuai format; kolom Kecamatan/Kabupaten BIS Ramadhan dikosongkan (diisi manual) */
const RK_DEFAULT = {
  fitrah_non:{dkm:87.5}, fitrah_amil:{dkm:9.5,des:3},
  bis_opz:{dkm:5,des:10,kec:null,kab:null},
  zakat_mal:{dkm:100}, infak_umum:{dkm:100}, fidyah:{dkm:100}
};
let rkPct = null, rkTotals = {};

/* ---------- Persentase disimpan di Supabase (tabel rekap_persen): publik hanya membaca, admin mengubah ---------- */
const rkSaved = {c2a:null,c2b:null}, rkTimers = {};
let rkPctFailure = '';
async function loadRekapPct() {
  if(simulated) {render();return;}
  try {
    const data = await api('/rest/v1/rekap_persen?select=kunci,nilai');
    rkSaved.c2a = rkSaved.c2b = null;
    for(const row of data||[]) if(row.kunci in rkSaved) rkSaved[row.kunci] = row.nilai;
    rkPct = null; c2bPct = null; rkPctFailure = '';
  } catch(error) {
    rkPctFailure = /rekap_persen|schema cache/i.test(error.message) ? 'Tabel rekap_persen belum dibuat. Jalankan setup-rekap-persen-supabase.sql di Supabase SQL Editor.' : error.message;
  }
  render();
}
function rkStatus(text,bad) {
  const el = $('rkSaveStatus'); if(el) {el.textContent = text; el.style.color = bad ? '#b3261e' : '';}
}
function rkPersist(kunci,nilai) {
  if(!admin()) return;
  rkSaved[kunci] = nilai;
  if(simulated) return;
  clearTimeout(rkTimers[kunci]);
  rkStatus('Menyimpan…');
  rkTimers[kunci] = setTimeout(async()=>{
    try {
      if(nilai==null) await api('/rest/v1/rekap_persen?kunci=eq.'+kunci,{method:'DELETE',token:session.access_token});
      else await api('/rest/v1/rekap_persen?on_conflict=kunci',{method:'POST',body:{kunci,nilai,diubah:new Date().toISOString()},token:session.access_token,extra:{Prefer:'resolution=merge-duplicates,return=minimal'}});
      rkStatus('Tersimpan');
    } catch(error) {
      rkStatus('Gagal menyimpan: '+(/row-level security/i.test(error.message)?'akses ditolak, pastikan masuk sebagai admin.':error.message),true);
    }
  },500);
}

function rkPctState() {
  if(rkPct) return rkPct;
  const saved = rkSaved.c2a || {};
  rkPct = {};
  for(const g of RK_ROWS) for(const l of g.leaves) {
    rkPct[l.id] = {};
    for(const lv of l.use) {
      const own = saved[l.id] && Object.prototype.hasOwnProperty.call(saved[l.id],lv);
      const v = own ? saved[l.id][lv] : RK_DEFAULT[l.id]?.[lv];
      rkPct[l.id][lv] = typeof v === 'number' && Number.isFinite(v) ? v : null;
    }
  }
  return rkPct;
}
function rkSave() {rkPersist('c2a',rkPct);}

const rkNum = v => angka.format(Number(v||0));
const rkPctText = v => v==null ? '' : angka.format(v)+'%';

function rkCompute(totals) {
  const pct = rkPctState(), cell = {}, warn = [];
  const grand = {total:0,sum:0,dkm:0,des:0,kec:0,kab:0};
  for(const g of RK_ROWS) {
    const tot = Math.round(totals[g.key]||0);
    cell['tot:'+g.key] = rkNum(tot); grand.total += tot;
    let keyPct = 0, keySum = 0;
    for(const l of g.leaves) {
      let sum = 0, p = 0;
      for(const lv of l.use) {
        const v = pct[l.id][lv];
        if(v==null) {cell['amt:'+l.id+':'+lv] = ''; continue;}
        const amount = Math.round(tot*v/100);
        cell['amt:'+l.id+':'+lv] = rkNum(amount);
        sum += amount; grand[lv] += amount; p += v;
      }
      p = Math.round(p*100)/100;
      cell['sum:'+l.id] = rkNum(sum);
      cell['pct:'+l.id] = p ? rkPctText(p) : '';
      keySum += sum; keyPct += p;
    }
    cell['key:'+g.key] = rkNum(keySum); grand.sum += keySum;
    keyPct = Math.round(keyPct*100)/100;
    if(Math.abs(keyPct-100) > 0.001) warn.push(g.label+': total persentase '+angka.format(keyPct)+'% (seharusnya 100%).');
  }
  cell['gt:total'] = rkNum(grand.total); cell['gt:sum'] = rkNum(grand.sum);
  for(const [lv] of RK_LEVELS) cell['gt:'+lv] = rkNum(grand[lv]);
  return {cell,warn};
}

function rkWarnHtml(warn) {
  return warn.length ? '<ul>'+warn.map(w=>'<li>'+esc(w)+'</li>').join('')+'</ul>' : '';
}

function rkRefresh() {
  const {cell,warn} = rkCompute(rkTotals);
  document.querySelectorAll('[data-rk]').forEach(el=>{el.textContent = cell[el.dataset.rk] ?? '';});
  const box = $('rkWarn'); if(box) box.innerHTML = admin() ? rkWarnHtml(warn) : '';
}

function rekapTable(cell) {
  const pct = rkPctState();
  const td = (id,cls='r') => '<td class="'+cls+'" data-rk="'+id+'">'+esc(cell[id] ?? '').replace(/^—$/,'')+'</td>';
  const grey = n => '<td class="g"></td>'.repeat(n);
  const head = '<colgroup><col style="width:3.5%"><col style="width:17%"><col style="width:11%">'+
    RK_LEVELS.map(()=>'<col style="width:4.5%"><col style="width:8.5%">').join('')+'<col style="width:5%"><col style="width:10.5%"></colgroup>'+
    '<thead><tr><th rowspan="3">NO</th><th rowspan="3">URAIAN</th><th rowspan="3">TOTAL<br>PENGUMPULAN<br>(100%) RP.</th><th colspan="10">PENDISTRIBUSIAN</th></tr>'+
    '<tr>'+RK_LEVELS.map(([,label])=>'<th colspan="2">'+label+'</th>').join('')+'<th rowspan="2">%</th><th rowspan="2">Jumlah<br>Pendistribusian<br>Rp.</th></tr>'+
    '<tr>'+RK_LEVELS.map(()=>'<th>%</th><th>Jumlah Rp.</th>').join('')+'</tr>'+
    '<tr class="rk-index"><td>1</td><td>2</td><td></td>'+[4,5,6,7,8,9,10,11].map(n=>'<td>'+n+'</td>').join('')+'<td></td><td></td></tr></thead>';
  const leafCells = l => RK_LEVELS.map(([lv,label])=>{
    if(!l.use.includes(lv)) return grey(2);
    const v = pct[l.id][lv];
    const field = admin() ? '<input type="number" min="0" max="100" step="0.1" inputmode="decimal" data-rk-pct="'+l.id+':'+lv+'" value="'+(v==null?'':v)+'" aria-label="Persen '+esc((l.label||RK_ROWS.find(g=>g.leaves.includes(l)).label)+' '+label)+'">' : '';
    return '<td class="rk-pct">'+field+
      '<span class="rk-pct-print'+(admin()?'':' rk-pct-view')+'" data-rk-pcttxt="'+l.id+':'+lv+'">'+esc(rkPctText(v))+'</span></td>'+td('amt:'+l.id+':'+lv);
  }).join('');
  const body = RK_ROWS.map(g=>{
    const single = g.leaves.length===1 && g.leaves[0].label===null;
    if(single) {
      const l = g.leaves[0];
      return '<tr><td class="c"><b>'+g.no+'</b></td><td class="l"><b>'+esc(g.label)+'</b></td>'+td('tot:'+g.key)+leafCells(l)+td('pct:'+l.id,'c')+td('sum:'+l.id)+'</tr>';
    }
    return '<tr><td class="c"><b>'+g.no+'</b></td><td class="l"><b>'+esc(g.label)+'</b></td>'+td('tot:'+g.key)+grey(8)+'<td></td>'+td('key:'+g.key)+'</tr>'+
      g.leaves.map(l=>'<tr><td></td><td class="l">'+esc(l.label)+'</td><td></td>'+leafCells(l)+td('pct:'+l.id,'c')+td('sum:'+l.id)+'</tr>').join('');
  }).join('');
  const foot = '<tr class="rk-total"><td></td><td class="r"><b>JUMLAH</b></td>'+td('gt:total')+
    RK_LEVELS.map(([lv])=>'<td></td>'+td('gt:'+lv)).join('')+'<td></td>'+td('gt:sum')+'</tr>';
  return '<table class="rk-table">'+head+'<tbody>'+body+foot+'</tbody></table>';
}

function rekapPage() {
  const S = phState.Perhimpunan;
  if(!S.year && !S.loading) S.year = S.rows.length ? String(S.rows[0].tahun) : today().slice(0,4);
  const year = S.year || today().slice(0,4);
  const years = [...new Set([...S.rows.map(r=>String(r.tahun)),year,today().slice(0,4)])].sort().reverse();
  const list = S.rows.filter(r=>String(r.tahun)===year);
  rkTotals = Object.fromEntries(RK_ROWS.map(g=>[g.key,list.reduce((sum,r)=>sum+Number(r[g.key]||0),0)]));
  const {cell,warn} = rkCompute(rkTotals);
  const heading = '<div class="ph-heading"><p class="crumb">Rekap Laporan / Form C2A</p><h1>Form C2A</h1><p class="muted">Rekapitulasi pengumpulan dan pendistribusian zakat · Tahun '+esc(year)+'</p></div>';
  if(S.loading) return '<section class="panel ph-panel rk-panel">'+rekapTabs()+heading+'<p class="empty">Memuat data…</p></section>';
  if(S.failure) return '<section class="panel ph-panel rk-panel">'+rekapTabs()+heading+'<p class="empty" role="alert">Data perhimpunan gagal dimuat. '+esc(S.failure)+'</p></section>';
  const info = profile.identitas || {};
  const ketua = profileOfficer('ketua');
  const e = v => v==null ? '' : esc(v);
  const reportDate = phLongDate(phReportDate || today());
  const toolbar = '<div class="toolbar no-print"><label class="ph-year">Tahun <select id="rkYear">'+years.map(y=>'<option value="'+esc(y)+'" '+(y===year?'selected':'')+'>'+esc(y)+'</option>').join('')+'</select></label>'+
    '<label class="ph-year">Nama Camat <input id="phCamat" maxlength="100" placeholder="Isi sebelum cetak" value="'+esc(phCamat||profileOfficer('camat'))+'"></label>'+
    '<label class="ph-year">Tanggal laporan <input id="phReportDate" type="date" max="9999-12-31" value="'+esc(phReportDate||today())+'"></label>'+
    '<span class="ph-tools">'+(admin()?'<button type="button" class="secondary" id="rkReset">Persentase bawaan</button>':'')+'<button type="button" id="phPrint">Cetak Rekap</button></span></div>';
  const note = '<p class="muted no-print rk-note">Total pengumpulan dijumlahkan dari menu Perhimpunan tahun '+esc(year)+'. '+(admin()?'Persentase pada kolom putih dapat diubah dan tersimpan di server. <span id="rkSaveStatus" role="status"></span>':'Persentase dikelola oleh admin.')+(rkPctFailure?' <b>'+esc(rkPctFailure)+'</b>':'')+'</p>';
  const sumJiwa = rows => rows.filter(x=>String(x.tahun)===year).reduce((sum,x)=>sum+Number(x.jumlah_jiwa||0),0);
  const P = phState.Pendistribusian;
  const muzaki = rkNum(sumJiwa(S.rows));
  const mustahik = P.failure ? '-' : rkNum(sumJiwa(P.rows));
  const hpKetua = officerPhone('ketua') || info.telepon;
  const phone = hpKetua ? ' / '+e(hpKetua) : '';
  const kop = '<div class="ph-form rk-kop" aria-hidden="true"><div class="phf-tag">form C2A Kecamatan</div><div class="rk-kop-grid"><img src="logo-baznas.png" alt="">'+
    '<div class="rk-title">LAPORAN PENGUMPULAN DAN PENDISTRIBUSIAN<br>DANA ZAKAT FITRAH, BIS RAMADHAN, ZAKAT MAL, INFAK UMUM DAN FIDYAH<br>TAHUN '+phHijriYear(year)+' H / '+esc(year)+' M<br><b>(WAJIB DISAMPAIKAN KEPADA BAZNAS KABUPATEN SUBANG)</b></div>'+
    '<dl class="rk-meta"><dt>Kecamatan</dt><dd>: CIPEUNDEUY</dd><dt>Nama/No. HP Ketua UPZ</dt><dd>: '+e(ketua).toUpperCase()+phone+'</dd>'+
    '<dt>Jumlah Muzaki</dt><dd>: '+muzaki+'</dd><dt>Jumlah Mustahik</dt><dd>: '+mustahik+'</dd></dl></div></div>';
  const sign = '<div class="ph-form rk-sign" aria-hidden="true"><div class="phf-sign"><div class="phf-left">Mengetahui,<br>Camat Cipeundeuy<div class="phf-name" id="phCamatPrint">'+esc(camatName())+'</div></div>'+
    '<div class="phf-right"><span id="phDatePrint">Dilaporkan tanggal : '+esc(reportDate)+'</span><br>Ketua UPZ,<div class="phf-name">'+e(ketua)+'</div></div></div></div>';
  return '<section class="panel ph-panel rk-panel">'+rekapTabs()+heading+toolbar+note+kop+'<div class="scroll rk-wrap">'+rekapTable(cell)+'</div>'+
    '<div id="rkWarn" class="rk-warn no-print" role="status">'+(admin()?rkWarnHtml(warn):'')+'</div>'+sign+'</section>';
}

function bindRekap() {
  $('rkYear')?.addEventListener('change',e=>{phState.Perhimpunan.year=e.target.value;render();});
  $('rkReset')?.addEventListener('click',()=>{
    if(!admin()) return;
    rkPct = null; rkPersist('c2a',null);
    render();
  });
  document.querySelectorAll('[data-rk-pct]').forEach(input=>input.addEventListener('input',()=>{
    if(!admin()) return;
    const [id,lv] = input.dataset.rkPct.split(':');
    const raw = input.value.trim();
    const n = raw==='' ? null : Number(raw);
    if(n!==null && (!Number.isFinite(n) || n<0 || n>100)) return;
    rkPctState()[id][lv] = n;
    rkSave();
    const printed = document.querySelector('[data-rk-pcttxt="'+input.dataset.rkPct+'"]');
    if(printed) printed.textContent = rkPctText(n);
    rkRefresh();
  }));
}

/* ---------- Tab sub menu Rekap Laporan (tampil di HP; di desktop memakai sub menu sidebar) ---------- */
function rekapTabs() {
  return '<div class="bku-tabs no-print" role="tablist">'+[['Form C2A','Form C2A'],['Form C2B','Form C2B']].map(([page,label])=>
    '<button type="button" role="tab" data-goto="'+page+'" aria-selected="'+(screen===page)+'" class="'+(screen===page?'on':'')+'">'+label+'</button>').join('')+'</div>';
}

/* ---------- Form C2B Kecamatan: Rencana Program Pendistribusian Dana Infak Terikat BIS Ramadhan ---------- */
const C2B_KEY = 'rekapC2BPersen';
const C2B_GROUPS = [['opr','Operasional Amil'],['sar','Sarana dan Prasarana'],['pem','Pembinaan OPZ'],['sos','Kegiatan Sosial Keagamaan']];
const C2B_DEFAULT = {pool:35, opr:15, sar:25, pem:30, sos:30};
let c2bPct = null;

function c2bState() {
  if(c2bPct) return c2bPct;
  const saved = rkSaved.c2b || {};
  c2bPct = {};
  for(const k of Object.keys(C2B_DEFAULT)) {
    const own = Object.prototype.hasOwnProperty.call(saved,k);
    const v = own ? saved[k] : C2B_DEFAULT[k];
    c2bPct[k] = typeof v === 'number' && Number.isFinite(v) ? v : null;
  }
  return c2bPct;
}
function c2bSave() {rkPersist('c2b',c2bPct);}

function c2bCompute(totalBis) {
  const p = c2bState(), cell = {}, warn = [];
  const pool = Math.round((totalBis||0)*(p.pool||0)/100);
  let sum = 0, pctSum = 0;
  cell['pool'] = rkNum(pool);
  cell['lbl:pool'] = 'Jumlah Pengumpulan '+(p.pool==null?'':angka.format(p.pool))+'%';
  cell['uraian'] = rkNum(pool);
  for(const [k] of C2B_GROUPS) {
    const v = p[k];
    if(v==null) {cell['amt:'+k] = ''; continue;}
    const amount = Math.round(pool*v/100);
    cell['amt:'+k] = rkNum(amount); sum += amount; pctSum += v;
  }
  pctSum = Math.round(pctSum*100)/100;
  cell['pct'] = pctSum ? rkPctText(pctSum) : '';
  cell['sum'] = rkNum(sum);
  if(Math.abs(pctSum-100) > 0.001) warn.push('Total persentase program: '+angka.format(pctSum)+'% (seharusnya 100%).');
  if(p.pool==null) warn.push('Persentase pengumpulan UPZ belum diisi.');
  return {cell,warn};
}

function c2bRefresh() {
  const {cell,warn} = c2bCompute(rkTotals.bis_ramadhan);
  document.querySelectorAll('[data-c2b]').forEach(el=>{el.textContent = cell[el.dataset.c2b] ?? '';});
  const box = $('c2bWarn'); if(box) box.innerHTML = admin() ? rkWarnHtml(warn) : '';
}

function c2bTable(cell) {
  const p = c2bState();
  const td = (id,cls='r') => '<td class="'+cls+'" data-c2b="'+id+'">'+esc(cell[id] ?? '')+'</td>';
  const pctCell = (k,label) => '<td class="rk-pct">'+(admin()?'<input type="number" min="0" max="100" step="0.1" inputmode="decimal" data-c2b-pct="'+k+'" value="'+(p[k]==null?'':p[k])+'" aria-label="Persen '+esc(label)+'">':'')+
    '<span class="rk-pct-print'+(admin()?'':' rk-pct-view')+'" data-c2b-pcttxt="'+k+'">'+esc(rkPctText(p[k]))+'</span></td>'+td('amt:'+k);
  const head = '<colgroup><col style="width:3.5%"><col style="width:15%"><col style="width:11%">'+
    C2B_GROUPS.map(()=>'<col style="width:4.5%"><col style="width:9.5%">').join('')+'<col style="width:5.5%"><col style="width:11%"></colgroup>'+
    '<thead><tr><th rowspan="3">NO</th><th rowspan="3">URAIAN</th><th rowspan="3">PENGUMPULAN<br>DITERIMA UPZ<br>(<span data-c2b-pool-pct>'+esc(p.pool==null?'':angka.format(p.pool))+'</span>%) RP</th><th colspan="10" class="c2b-title">RENCANA PROGRAM PENDISTRIBUSIAN</th></tr>'+
    '<tr>'+C2B_GROUPS.map(([,label])=>'<th colspan="2">'+label+'</th>').join('')+'<th rowspan="2">%</th><th rowspan="2">Jumlah<br>Pendistribusian<br>Rp.</th></tr>'+
    '<tr>'+C2B_GROUPS.map(()=>'<th>%</th><th>Jumlah Rp.</th>').join('')+'</tr>'+
    '<tr class="rk-index"><td>1</td><td>2</td><td></td>'+[4,5,6,7,8,9,10,11].map(n=>'<td>'+n+'</td>').join('')+'<td></td><td></td></tr></thead>';
  const body = '<tr><td class="c"><b>1</b></td><td class="l"><b>BIS Ramadhan</b></td><td class="r"><b data-c2b="pool">'+esc(cell.pool)+'</b></td>'+'<td></td>'.repeat(10)+'</tr>'+
    '<tr><td></td><td class="l">PENGUATAN KELEMBAGAAN</td>'+td('uraian')+C2B_GROUPS.map(([k,label])=>pctCell(k,label)).join('')+td('pct','c')+'<td></td></tr>'+
    '<tr class="c2b-blank"><td></td><td></td><td></td>'+'<td></td>'.repeat(10)+'</tr>';
  const foot = '<tr class="rk-total"><td></td><td class="r"><b>JUMLAH</b></td>'+td('uraian')+C2B_GROUPS.map(([k])=>'<td></td>'+td('amt:'+k)).join('')+'<td></td>'+td('sum')+'</tr>';
  return '<table class="rk-table c2b-table">'+head+'<tbody>'+body+foot+'</tbody></table>';
}

function rekapC2BPage() {
  const S = phState.Perhimpunan;
  if(!S.year && !S.loading) S.year = S.rows.length ? String(S.rows[0].tahun) : today().slice(0,4);
  const year = S.year || today().slice(0,4);
  const years = [...new Set([...S.rows.map(r=>String(r.tahun)),year,today().slice(0,4)])].sort().reverse();
  const list = S.rows.filter(r=>String(r.tahun)===year);
  rkTotals = Object.fromEntries(RK_ROWS.map(g=>[g.key,list.reduce((sum,r)=>sum+Number(r[g.key]||0),0)]));
  const {cell,warn} = c2bCompute(rkTotals.bis_ramadhan);
  const heading = '<div class="ph-heading"><p class="crumb">Rekap Laporan / Form C2B</p><h1>Form C2B</h1><p class="muted">Rencana program pendistribusian dana infak terikat BIS Ramadhan · Tahun '+esc(year)+'</p></div>';
  if(S.loading) return '<section class="panel ph-panel rk-panel">'+rekapTabs()+heading+'<p class="empty">Memuat data…</p></section>';
  if(S.failure) return '<section class="panel ph-panel rk-panel">'+rekapTabs()+heading+'<p class="empty" role="alert">Data perhimpunan gagal dimuat. '+esc(S.failure)+'</p></section>';
  const p = c2bState();
  const ketua = profileOfficer('ketua');
  const hpKetua = officerPhone('ketua') || (profile.identitas||{}).telepon;
  const phone = hpKetua ? ' / '+esc(hpKetua) : '';
  const e = v => v==null ? '' : esc(v);
  const reportDate = phLongDate(phReportDate || today());
  const toolbar = '<div class="toolbar no-print"><label class="ph-year">Tahun <select id="rkYear">'+years.map(y=>'<option value="'+esc(y)+'" '+(y===year?'selected':'')+'>'+esc(y)+'</option>').join('')+'</select></label>'+
    (admin()?'<label class="ph-year">Bagian UPZ (%) <input id="c2bPool" type="number" min="0" max="100" step="0.1" inputmode="decimal" value="'+(p.pool==null?'':p.pool)+'"></label>':'')+
    '<label class="ph-year">Nama Camat <input id="phCamat" maxlength="100" placeholder="Isi sebelum cetak" value="'+esc(phCamat||profileOfficer('camat'))+'"></label>'+
    '<label class="ph-year">Tanggal laporan <input id="phReportDate" type="date" max="9999-12-31" value="'+esc(phReportDate||today())+'"></label>'+
    '<span class="ph-tools">'+(admin()?'<button type="button" class="secondary" id="c2bReset">Persentase bawaan</button>':'')+'<button type="button" id="phPrint">Cetak C2B</button></span></div>';
  const note = '<p class="muted no-print rk-note">Pengumpulan diterima UPZ = total BIS Ramadhan menu Perhimpunan tahun '+esc(year)+' × bagian UPZ (bawaan 35%). '+(admin()?'Persentase pada kolom putih dapat diubah dan tersimpan di server. <span id="rkSaveStatus" role="status"></span>':'Persentase dikelola oleh admin.')+(rkPctFailure?' <b>'+esc(rkPctFailure)+'</b>':'')+'</p>';
  const kop = '<div class="ph-form rk-kop" aria-hidden="true"><div class="phf-tag">form C2B Kecamatan</div><div class="rk-kop-grid"><img src="logo-baznas.png" alt="">'+
    '<div class="rk-title">RENCANA PROGRAM PENDISTRIBUSIAN<br>DANA INFAK TERIKAT BIS RAMADHAN<br>TAHUN '+phHijriYear(year)+' H / '+esc(year)+' M<br><b>(WAJIB DISAMPAIKAN KEPADA BAZNAS KABUPATEN SUBANG)</b></div>'+
    '<dl class="rk-meta"><dt>Kecamatan</dt><dd>: Cipeundeuy</dd><dt>Nama/No. HP Ketua UPZ</dt><dd>: '+e(ketua)+phone+'</dd>'+
    '<dt data-c2b="lbl:pool">'+esc(cell['lbl:pool'])+'</dt><dd>: Rp. <span data-c2b="pool">'+esc(cell.pool)+'</span></dd><dt>Rencana Pendistribusian</dt><dd>: Rp. <span data-c2b="sum">'+esc(cell.sum)+'</span></dd></dl></div></div>';
  const sign = '<div class="ph-form rk-sign" aria-hidden="true"><div class="phf-sign"><div class="phf-left">Mengetahui,<br>Camat Cipeundeuy<div class="phf-name" id="phCamatPrint">'+esc(camatName())+'</div></div>'+
    '<div class="phf-right"><span id="phDatePrint">Dilaporkan tanggal : '+esc(reportDate)+'</span><br>Ketua UPZ,<div class="phf-name">'+e(ketua)+'</div></div></div></div>';
  return '<section class="panel ph-panel rk-panel">'+rekapTabs()+heading+toolbar+note+kop+'<div class="scroll rk-wrap">'+c2bTable(cell)+'</div>'+
    '<div id="c2bWarn" class="rk-warn no-print" role="status">'+(admin()?rkWarnHtml(warn):'')+'</div>'+sign+'</section>';
}

function bindRekapC2B() {
  $('rkYear')?.addEventListener('change',e=>{phState.Perhimpunan.year=e.target.value;render();});
  $('c2bReset')?.addEventListener('click',()=>{
    if(!admin()) return;
    c2bPct = null; rkPersist('c2b',null);
    render();
  });
  const setPct = (key,raw) => {
    if(!admin()) return false;
    const n = raw.trim()==='' ? null : Number(raw);
    if(n!==null && (!Number.isFinite(n) || n<0 || n>100)) return false;
    c2bState()[key] = n; c2bSave();
    return true;
  };
  $('c2bPool')?.addEventListener('input',e=>{
    if(!setPct('pool',e.target.value)) return;
    const t = document.querySelector('[data-c2b-pool-pct]'); if(t) t.textContent = c2bState().pool==null ? '' : angka.format(c2bState().pool);
    c2bRefresh();
  });
  document.querySelectorAll('[data-c2b-pct]').forEach(input=>input.addEventListener('input',()=>{
    const key = input.dataset.c2bPct;
    if(!setPct(key,input.value)) return;
    const printed = document.querySelector('[data-c2b-pcttxt="'+key+'"]');
    if(printed) printed.textContent = rkPctText(c2bState()[key]);
    c2bRefresh();
  }));
}
