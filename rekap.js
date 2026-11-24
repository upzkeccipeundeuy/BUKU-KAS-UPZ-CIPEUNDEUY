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

function rkPctState() {
  if(rkPct) return rkPct;
  let saved = {};
  try {saved = JSON.parse(localStorage.getItem(RK_KEY) || '{}') || {};} catch {}
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
function rkSave() {try {localStorage.setItem(RK_KEY,JSON.stringify(rkPct));} catch {}}

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
  const box = $('rkWarn'); if(box) box.innerHTML = rkWarnHtml(warn);
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
    return '<td class="rk-pct"><input type="number" min="0" max="100" step="0.1" inputmode="decimal" data-rk-pct="'+l.id+':'+lv+'" value="'+(v==null?'':v)+'" aria-label="Persen '+esc((l.label||RK_ROWS.find(g=>g.leaves.includes(l)).label)+' '+label)+'">'+
      '<span class="rk-pct-print" data-rk-pcttxt="'+l.id+':'+lv+'">'+esc(rkPctText(v))+'</span></td>'+td('amt:'+l.id+':'+lv);
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
  const heading = '<div class="ph-heading"><p class="crumb">Rekap Laporan</p><h1>Rekap Laporan</h1><p class="muted">Rekapitulasi pengumpulan dan pendistribusian zakat · Tahun '+esc(year)+'</p></div>';
  if(S.loading) return '<section class="panel ph-panel rk-panel">'+heading+'<p class="empty">Memuat data…</p></section>';
  if(S.failure) return '<section class="panel ph-panel rk-panel">'+heading+'<p class="empty" role="alert">Data perhimpunan gagal dimuat. '+esc(S.failure)+'</p></section>';
  const info = profile.identitas || {};
  const ketua = profileOfficer('ketua');
  const e = v => v==null ? '' : esc(v);
  const reportDate = phLongDate(phReportDate || today());
  const toolbar = '<div class="toolbar no-print"><label class="ph-year">Tahun <select id="rkYear">'+years.map(y=>'<option value="'+esc(y)+'" '+(y===year?'selected':'')+'>'+esc(y)+'</option>').join('')+'</select></label>'+
    '<label class="ph-year">Nama Camat <input id="phCamat" maxlength="100" placeholder="Isi sebelum cetak" value="'+esc(phCamat)+'"></label>'+
    '<label class="ph-year">Tanggal laporan <input id="phReportDate" type="date" max="9999-12-31" value="'+esc(phReportDate||today())+'"></label>'+
    '<span class="ph-tools"><button type="button" class="secondary" id="rkReset">Persentase bawaan</button><button type="button" id="phPrint">Cetak Rekap</button></span></div>';
  const note = '<p class="muted no-print rk-note">Total pengumpulan dijumlahkan dari menu Perhimpunan tahun '+esc(year)+'. Persentase pada kolom putih dapat diubah dan tersimpan di peramban ini.</p>';
  const sumJiwa = rows => rows.filter(x=>String(x.tahun)===year).reduce((sum,x)=>sum+Number(x.jumlah_jiwa||0),0);
  const P = phState.Pendistribusian;
  const muzaki = rkNum(sumJiwa(S.rows));
  const mustahik = P.failure ? '-' : rkNum(sumJiwa(P.rows));
  const phone = info.telepon ? ' / '+e(info.telepon) : '';
  const kop = '<div class="ph-form rk-kop" aria-hidden="true"><div class="phf-tag">form C2A Kecamatan</div><div class="rk-kop-grid"><img src="logo-baznas.png" alt="">'+
    '<div class="rk-title">LAPORAN PENGUMPULAN DAN PENDISTRIBUSIAN<br>DANA ZAKAT FITRAH, BIS RAMADHAN, ZAKAT MAL, INFAK UMUM DAN FIDYAH<br>TAHUN '+phHijriYear(year)+' H / '+esc(year)+' M<br><b>(WAJIB DISAMPAIKAN KEPADA BAZNAS KABUPATEN SUBANG)</b></div>'+
    '<dl class="rk-meta"><dt>Kecamatan</dt><dd>: CIPEUNDEUY</dd><dt>Nama/No. HP Ketua UPZ</dt><dd>: '+e(ketua).toUpperCase()+phone+'</dd>'+
    '<dt>Jumlah Muzaki</dt><dd>: '+muzaki+'</dd><dt>Jumlah Mustahik</dt><dd>: '+mustahik+'</dd></dl></div></div>';
  const sign = '<div class="ph-form rk-sign" aria-hidden="true"><div class="phf-sign"><div class="phf-left">Mengetahui,<br>Camat Cipeundeuy<div class="phf-name" id="phCamatPrint">'+(phCamat.trim()?esc(phCamat.trim()):'')+'</div></div>'+
    '<div class="phf-right"><span id="phDatePrint">Dilaporkan tanggal : '+esc(reportDate)+'</span><br>Ketua UPZ,<div class="phf-name">'+e(ketua)+'</div></div></div></div>';
  return '<section class="panel ph-panel rk-panel">'+heading+toolbar+note+kop+'<div class="scroll rk-wrap">'+rekapTable(cell)+'</div>'+
    '<div id="rkWarn" class="rk-warn no-print" role="status">'+rkWarnHtml(warn)+'</div>'+sign+'</section>';
}

function bindRekap() {
  $('rkYear')?.addEventListener('change',e=>{phState.Perhimpunan.year=e.target.value;render();});
  $('rkReset')?.addEventListener('click',()=>{
    rkPct = null;
    try {localStorage.removeItem(RK_KEY);} catch {}
    render();
  });
  document.querySelectorAll('[data-rk-pct]').forEach(input=>input.addEventListener('input',()=>{
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
