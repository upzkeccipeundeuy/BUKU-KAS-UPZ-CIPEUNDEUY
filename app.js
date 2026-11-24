const PROJECT = 'https://bpavltvdhantbwmoeabx.supabase.co';
const KEY = 'sb_publishable_xpARKQZVCB8mcwVJnOGxYA_yEetsBUM';
const ADMIN = '09a92d1b-8f35-4459-95e7-cf54a202296b';
const $ = id => document.getElementById(id);
const rupiah = new Intl.NumberFormat('id-ID', {style:'currency',currency:'IDR',minimumFractionDigits:0,maximumFractionDigits:2});
const monthName = new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric',timeZone:'UTC'});
const today = () => new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Jakarta'});
const esc = value => String(value ?? '—').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const money = n => n == null ? '—' : rupiah.format(n);
const demo = [
  {id:1,no_kwitansi:'001/UPZ/XI/2026',tanggal:'2026-11-03',kriteria:'Zakat',uraian:'Penerimaan zakat',debet:8500000,kredit:0},
  {id:2,no_kwitansi:'002/UPZ/XI/2026',tanggal:'2026-11-07',kriteria:'Infak',uraian:'Penerimaan infak',debet:3750000,kredit:0},
  {id:3,no_kwitansi:'003/UPZ/XI/2026',tanggal:'2026-11-12',kriteria:'Penyaluran',uraian:'Penyaluran dana zakat',penerima:'Penerima contoh',debet:0,kredit:4250000},
  {id:4,no_kwitansi:'004/UPZ/XI/2026',tanggal:'2026-11-16',kriteria:'Operasional',uraian:'Biaya administrasi',debet:0,kredit:350000}
];
const ICON = {
  Dashboard:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
  Profil:'<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20c.9-3.7 3.8-5.6 7.2-5.6s6.3 1.9 7.2 5.6"/>',
  Pemasukan:'<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>',
  Perhimpunan:'<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.3.2 4 1.7 4.5 4.3"/>',
  Pendistribusian:'<path d="M12 3.5v9"/><path d="M8.5 9.5 12 13l3.5-3.5"/><path d="M4 14v3.5A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5V14"/>',
  'Rekap Laporan':'<path d="M4.5 20V10M10 20V4.5M15.5 20v-7M21 20H3"/><path d="M18.5 8.5v-3M17 7h3"/>',
  Pengeluaran:'<circle cx="12" cy="12" r="8.5"/><path d="M8 12h8"/>',
  BKU:'<path d="M6 3.5h9.5L19 7v13.5H6z"/><path d="M15 3.5V7.5h4"/><path d="M9 12h7M9 15.5h7"/>',
  'Cetak Laporan':'<path d="M7 9V3.5h10V9"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v6.5H7z"/>',
  Login:'<path d="M14 4.5h4.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M4 12h10M10.5 8.5 14 12l-3.5 3.5"/>',
  Keluar:'<path d="M10 4.5H5.5A1.5 1.5 0 0 0 4 6v12a1.5 1.5 0 0 0 1.5 1.5H10"/><path d="M20 12H10M16.5 8.5 20 12l-3.5 3.5"/>'
};
const svgIcon = n => '<svg class="ico" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(ICON[n]||'')+'</svg>';
const items = [['Dashboard'],['Profil'],['Perhimpunan'],['Pendistribusian'],['Rekap Laporan'],['Pemasukan'],['Pengeluaran'],['BKU'],['Cetak Laporan'],['Login']];
const bkuGroup = ['BKU','Pemasukan','Pengeluaran','Cetak Laporan'];
let bkuOpen = false;
const rekapGroup = ['Form C2A','Form C2B'];
let rekapOpen = false;
ICON['Form C2A'] = ICON['Form C2B'] = ICON['Rekap Laporan'];

/* ---------- Perhimpunan (pengumpulan per UPZ desa/kelurahan) ---------- */
let phCamat = '', phReportDate = '';
const phNewState = () => ({rows:[],year:'',loading:false,failure:'',generation:0});
const phState = {Perhimpunan:phNewState(),Pendistribusian:phNewState()};
const demoYear = Number(today().slice(0,4));
const demoPerhimpunan = [
  {id:1,tahun:demoYear,nama_upz:'UPZ Desa Contoh A',alamat_kp:'Kp. Contoh',rt:'01',rw:'01',jumlah_jiwa:420,zakat_fitrah:4200000,beras_kg:120,bis_ramadhan:900000,zakat_mal:1500000,infak_umum:600000,fidyah:150000},
  {id:2,tahun:demoYear,nama_upz:'UPZ Desa Contoh B',alamat_kp:'Kp. Sample',rt:'02',rw:'03',jumlah_jiwa:310,zakat_fitrah:3100000,beras_kg:80,bis_ramadhan:700000,zakat_mal:900000,infak_umum:450000,fidyah:90000}
];
const demoPendistribusian = [
  {id:1,tahun:demoYear,nama_upz:'UPZ Desa Contoh A',alamat_kp:'Kp. Contoh',rt:'01',rw:'01',jumlah_jiwa:380,zakat_fitrah:3800000,beras_kg:100,bis_ramadhan:800000,zakat_mal:1200000,infak_umum:500000,fidyah:120000},
  {id:2,tahun:demoYear,nama_upz:'UPZ Desa Contoh B',alamat_kp:'Kp. Sample',rt:'02',rw:'03',jumlah_jiwa:290,zakat_fitrah:2900000,beras_kg:70,bis_ramadhan:600000,zakat_mal:800000,infak_umum:400000,fidyah:80000}
];
const PH_KINDS = {
  Perhimpunan:{table:'perhimpunan',demo:demoPerhimpunan,form:'A2',formTitle:'DATA PENGUMPULAN',group:'PENGUMPULAN',
    heading:'Perhimpunan Zakat',sub:'Pengumpulan per UPZ desa/kelurahan',empty:'perhimpunan',sql:'setup-perhimpunan-supabase.sql'},
  Pendistribusian:{table:'pendistribusian',demo:demoPendistribusian,form:'B2',formTitle:'DATA PENDISTRIBUSIAN',group:'PENDISTRIBUSIAN',
    heading:'Pendistribusian Zakat',sub:'Pendistribusian per UPZ desa/kelurahan',empty:'pendistribusian',sql:'setup-pendistribusian-supabase.sql'}
};
const angka = new Intl.NumberFormat('id-ID',{maximumFractionDigits:2});
const PH_MONEY = ['zakat_fitrah','bis_ramadhan','zakat_mal','infak_umum','fidyah'];
const PH_SUM = ['jumlah_jiwa','zakat_fitrah','beras_kg','bis_ramadhan','zakat_mal','infak_umum','fidyah'];
const phJumlah = r => PH_MONEY.reduce((sum,key)=>sum+Number(r[key]||0),0);
let screen = 'Dashboard', month = '', dashboardYear = today().slice(0,4), transactionSearch = '', transactionCategory = '', rows = [], summary = [], session, simulated = false, loading = true, failure = '', generation = 0;
const admin = () => simulated || session?.user?.id === ADMIN;
const demoReceiptCounters = new Map();

function demoReceipt(date, existing) {
  const period = date.slice(0,7);
  if(existing?.tanggal.slice(0,7) === period) return existing.no_kwitansi;
  const next = (demoReceiptCounters.get(period) || 0) + 1;
  demoReceiptCounters.set(period,next);
  const [year,monthNumber] = period.split('-');
  return String(next).padStart(3,'0')+'/UPZ.CPD/'+monthNumber+'/'+year;
}

async function api(path, {method='GET',body,token,extra}={}) {
  const headers = {apikey:KEY,...extra};
  if(token) headers.Authorization = 'Bearer '+token;
  if(body !== undefined) headers['Content-Type'] = 'application/json';
  const result = await fetch(PROJECT+path,{method,headers,body:body === undefined ? undefined : JSON.stringify(body),signal:AbortSignal.timeout(12000)});
  const data = await result.json().catch(()=>null);
  if(!result.ok) throw Error(data?.message || data?.msg || data?.error_description || 'Permintaan gagal ('+result.status+')');
  return data;
}

function demoSummary() {
  return demo.map(r=>({bulan:r.tanggal.slice(0,7)+'-01',kriteria:r.kriteria,debet:r.debet,kredit:r.kredit,jumlah:1}));
}

async function refresh() {
  const stamp = ++generation;
  loading = true;
  failure = '';
  rows = [];
  summary = [];
  render();
  try {
    if(simulated) {
      let saldo = 0;
      rows = [...demo].sort((a,b)=>a.tanggal.localeCompare(b.tanggal)||a.id-b.id)
        .map(r=>({...r,saldo:saldo+=r.debet-r.kredit}));
      summary = demoSummary();
    } else if(admin()) {
      const all = [];
      const monthTotals = new Map();
      for(let offset=0;;offset+=500) {
        const batch = await api('/rest/v1/buku_kas?select=*&order=tanggal.asc,id.asc&limit=500&offset='+offset,{token:session.access_token});
        if(stamp!==generation) return;
        all.push(...batch);
        for(const r of batch) {
          const bulan = r.tanggal.slice(0,7)+'-01';
          if(!monthTotals.has(bulan)) monthTotals.set(bulan,{bulan,debet:0,kredit:0,jumlah:0});
          const entry = monthTotals.get(bulan);
          entry.debet += Number(r.debet);
          entry.kredit += Number(r.kredit);
          entry.jumlah++;
        }
        if(batch.length<500) break;
      }
      rows = all;
      summary = [...monthTotals.values()];
    } else {
      const result = await api('/rest/v1/rpc/bku_ringkasan_umum',{method:'POST',body:{}});
      if(stamp!==generation) return;
      summary = result;
    }
  } catch(error) {
    if(stamp!==generation) return;
    failure = 'Data Supabase gagal dimuat. '+error.message;
  } finally {
    if(stamp===generation) {loading=false;render();}
  }
}

function go(name) {
  screen=name;
  if(bkuGroup.includes(name)) bkuOpen=true;
  if(rekapGroup.includes(name)) rekapOpen=true;
  if(name==='Profil'||name==='Cetak Laporan') loadProfile();
  else if(PH_KINDS[name]) loadPh(name);
  else if(rekapGroup.includes(name)) {loadPh('Pendistribusian');loadPh('Perhimpunan');loadRekapPct();}
  else render();
}
function filters() {
  return '<label class="no-print">Periode <input id="period" type="month" value="'+esc(month)+'"></label><button class="secondary no-print" id="all">Semua periode</button>';
}
function totals(data) {
  const d = data.reduce((sum,r)=>sum+Math.round(Number(r.debet)*100),0)/100;
  const k = data.reduce((sum,r)=>sum+Math.round(Number(r.kredit)*100),0)/100;
  return [d,k,Math.round((d-k)*100)/100];
}
function cards(data) {
  const values = totals(data);
  return '<div class="cards">'+['Total Pemasukan','Total Pengeluaran','Selisih Periode'].map((label,i)=>
    '<div class="card '+['in','out','net'][i]+'"><div class="symbol" aria-hidden="true">'+svgIcon(['Pemasukan','Pengeluaran','BKU'][i])+'</div><small>'+label+'</small><strong>'+money(loading||failure?null:values[i])+'</strong></div>').join('')+'</div>';
}
function makeTable(headers, content) {
  return '<div class="scroll"><table><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+
    (content || '<tr><td class="empty" colspan="'+headers.length+'">'+(loading?'Memuat data…':failure?'Data belum tersedia.':'Belum ada transaksi pada periode ini.')+'</td></tr>')+'</tbody></table></div>';
}
function ledger(list, actions, numbered=false) {
  const columns = ['No Kwitansi','Penerima','Tanggal','Kriteria','Uraian','Debet','Kredit','Saldo'];
  if(numbered) columns.unshift('No.');
  if(actions) columns.push('Tindakan');
  let sequence=0;
  return makeTable(columns,list.map(r=>'<tr>'+
    (numbered?'<td class="report-sequence">'+(r.id == null?'—':++sequence)+'</td>':'')+
    [r.no_kwitansi,r.penerima,r.tanggal,r.kriteria,r.uraian].map(v=>'<td>'+esc(v)+'</td>').join('')+
    [r.debet,r.kredit,r.saldo].map(v=>'<td class="money">'+money(v)+'</td>').join('')+
    (actions?'<td class="receipt-actions"><button class="secondary" data-edit="'+esc(r.id)+'">Edit</button> '+
      '<button class="secondary" data-receipt="'+esc(r.id)+'">Unduh Kwitansi PDF</button>'+
      (screen==='Pemasukan'||screen==='Pengeluaran'?' <button class="danger" data-delete="'+esc(r.id)+'">Hapus</button>':'')+'</td>':'')+'</tr>').join(''));
}
function bkuMonthly(data, transactions) {
  // Sort month summaries chronologically (January first), not newest first.
  const months = [...data].sort((a,b)=>String(a.bulan).localeCompare(String(b.bulan)));
  if(!months.length) return makeTable(['Bulan','Pemasukan','Pengeluaran'],[]);
  return '<div class="bku-month-list">'+months.map((m,index)=>{
    const key=String(m.bulan).slice(0,7);
    const detail=transactions.filter(r=>String(r.tanggal).slice(0,7)===key)
      .sort((a,b)=>String(a.tanggal).localeCompare(String(b.tanggal))||Number(a.id)-Number(b.id));
    const monthLabel=monthName.format(new Date(String(m.bulan)+'T00:00:00Z'));
    const detailsHtml=admin() ? (detail.length ? ledger(detail,false,true) : '<p class="muted">Tidak ada rincian transaksi pada bulan ini.</p>')
      : '<p class="muted bku-public-note">Rincian transaksi belum tersedia pada akses umum. Login admin untuk melihat rincian transaksi.</p>';
    return '<details class="bku-month" '+(index===0?'':'')+'><summary><span class="bku-month-name">'+esc(monthLabel)+'</span><span class="bku-month-total"><span>Masuk '+money(m.debet)+'</span><span>Keluar '+money(m.kredit)+'</span></span></summary><div class="bku-month-detail">'+detailsHtml+'</div></details>';
  }).join('')+'</div>';
}

function publicLedger(data, type) {
  const grouped = new Map();
  for(const r of data) {
    const entry = grouped.get(r.bulan) || {debet:0,kredit:0};
    entry.debet += Math.round(Number(r.debet)*100);
    entry.kredit += Math.round(Number(r.kredit)*100);
    grouped.set(r.bulan,entry);
  }
  const showDebet = type!=='Pengeluaran', showKredit = type!=='Pemasukan';
  const columns = ['Bulan',...(showDebet?['Pemasukan']:[]),...(showKredit?['Pengeluaran']:[])];
  return makeTable(columns,[...grouped].sort(([a],[b])=>b.localeCompare(a)).map(([date,r])=>'<tr><td>'+monthName.format(new Date(date))+'</td>'+
    (showDebet?'<td class="money">'+money(r.debet/100)+'</td>':'')+(showKredit?'<td class="money">'+money(r.kredit/100)+'</td>':'')+'</tr>').join(''));
}

function annualDashboard() {
  const years=[...new Set(summary.map(row=>String(row.bulan).slice(0,4)).filter(Boolean))].sort();
  const selected=years.includes(dashboardYear)?dashboardYear:(years.at(-1)||dashboardYear);
  dashboardYear=selected;
  const months=Array.from({length:12},(_,i)=>{
    const key=selected+'-'+String(i+1).padStart(2,'0');
    const matching=summary.filter(row=>String(row.bulan).startsWith(key));
    return {key,label:new Intl.DateTimeFormat('id-ID',{month:'short',timeZone:'UTC'}).format(new Date(key+'-01T00:00:00Z')),
      income:matching.reduce((sum,row)=>sum+Number(row.debet||0),0),
      expense:matching.reduce((sum,row)=>sum+Number(row.kredit||0),0)};
  });
  const income=months.reduce((sum,row)=>sum+row.income,0);
  const expense=months.reduce((sum,row)=>sum+row.expense,0);
  const peak=Math.max(1,...months.flatMap(row=>[row.income,row.expense]));
  const bars=months.map(row=>'<div class="chart-month" aria-label="'+esc(row.label)+': pemasukan '+esc(money(row.income))+', pengeluaran '+esc(money(row.expense))+'">'+
    '<div class="chart-pair"><span class="chart-bar income" style="height:'+Math.max(row.income?3:0,row.income/peak*100)+'%" title="Pemasukan '+esc(money(row.income))+'"></span>'+
    '<span class="chart-bar expense" style="height:'+Math.max(row.expense?3:0,row.expense/peak*100)+'%" title="Pengeluaran '+esc(money(row.expense))+'"></span></div>'+
    '<small>'+row.label+'</small></div>').join('');
  const options=years.map(year=>'<option value="'+year+'" '+(year===selected?'selected':'')+'>'+year+'</option>').join('');
  return '<section class="panel analytics-panel"><div class="toolbar analytics-toolbar"><div><h2>Statistik Keuangan Tahunan</h2><p class="muted">Perbandingan pemasukan dan pengeluaran per bulan</p></div>'+
    '<label class="year-select">Tahun <select id="dashboardYear">'+options+'</select></label></div>'+
    '<div class="annual-stats"><div><span>Total pemasukan</span><strong>'+money(loading||failure?null:income)+'</strong></div>'+
    '<div><span>Total pengeluaran</span><strong>'+money(loading||failure?null:expense)+'</strong></div>'+
    '<div><span>Saldo bersih</span><strong>'+money(loading||failure?null:income-expense)+'</strong></div></div>'+
    '<div class="chart-legend"><span><i class="legend-income"></i>Pemasukan</span><span><i class="legend-expense"></i>Pengeluaran</span></div>'+
    '<div class="annual-chart" role="img" aria-label="Grafik batang perbandingan pemasukan dan pengeluaran tahun '+selected+'">'+bars+'</div>'+
    '<p class="chart-footnote">Grafik menggunakan ringkasan transaksi yang tersedia pada sistem.</p></section>';
}

function transactionFilters(list) {
  const categories=[...new Set(list.map(row=>row.kriteria).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));
  return '<div class="transaction-filters no-print"><label class="search-field">Cari transaksi<input id="transactionSearch" type="search" value="'+esc(transactionSearch)+'" placeholder="Nomor kwitansi, nama, uraian…"></label>'+
    '<label>Kategori<select id="transactionCategory"><option value="">Semua kategori</option>'+
    categories.map(value=>'<option value="'+esc(value)+'" '+(transactionCategory===value?'selected':'')+'>'+esc(value)+'</option>').join('')+
    '</select></label></div>';
}
const PH_COMPONENTS = [['zakat_fitrah','Zakat Fitrah'],['bis_ramadhan','BIS Ramadhan'],['zakat_mal','Zakat Mal'],['infak_umum','Infak Umum'],['fidyah','Fidyah']];
function phDashCard(kind, year) {
  const S=phState[kind], K=PH_KINDS[kind], tone=kind==='Perhimpunan'?'in':'out';
  const list=S.rows.filter(r=>String(r.tahun)===year).sort((x,y)=>String(x.nama_upz).localeCompare(String(y.nama_upz),'id'));
  const total=list.reduce((sum,r)=>sum+phJumlah(r),0);
  const jiwa=list.reduce((sum,r)=>sum+Number(r.jumlah_jiwa||0),0);
  const beras=list.reduce((sum,r)=>sum+Number(r.beras_kg||0),0);
  const peak=Math.max(1,...list.map(phJumlah));
  const head='<div class="dash-ph-head"><span class="symbol" aria-hidden="true">'+svgIcon(kind)+'</span><div><h2>Kartu '+kind+'</h2><p class="muted">'+(kind==='Perhimpunan'?'Dana zakat yang dikumpulkan':'Dana zakat yang disalurkan')+' · Tahun '+esc(year)+'</p></div></div>';
  let body;
  if(S.loading) body='<p class="empty">Memuat data…</p>';
  else if(S.failure) body='<p class="empty" role="alert">Data '+kind.toLowerCase()+' gagal dimuat.</p>';
  else if(!list.length) body='<p class="empty">Belum ada data '+kind.toLowerCase()+' untuk tahun '+esc(year)+'.</p>';
  else body='<div class="dash-ph-total"><small>Total '+(kind==='Perhimpunan'?'pengumpulan':'pendistribusian')+'</small><strong>'+money(total)+'</strong>'+
    '<span>'+angka.format(jiwa)+' jiwa · '+angka.format(beras)+' kg beras · '+list.length+' UPZ desa/kelurahan</span></div>'+
    '<h3 class="dash-ph-sub">Rincian per desa/kelurahan</h3><ul class="dash-desa-list">'+list.map(r=>{
      const place=[r.alamat_kp,(r.rt||r.rw)?'RT '+(r.rt||'-')+'/RW '+(r.rw||'-'):''].filter(Boolean).join(' · ');
      const chips=PH_COMPONENTS.filter(([key])=>Number(r[key]||0)>0).map(([key,label])=>'<div><dt>'+label+'</dt><dd>'+money(Number(r[key]))+'</dd></div>').join('');
      return '<li class="dash-desa"><div class="dash-desa-top"><div><strong>'+esc(r.nama_upz)+'</strong><small>'+esc(place)+(place?' · ':'')+angka.format(Number(r.jumlah_jiwa||0))+' jiwa'+(Number(r.beras_kg||0)>0?' · '+angka.format(Number(r.beras_kg))+' kg beras':'')+'</small></div><b>'+money(phJumlah(r))+'</b></div>'+
        '<div class="dash-bar"><i style="width:'+Math.max(phJumlah(r)?3:0,phJumlah(r)/peak*100)+'%"></i></div>'+(chips?'<dl class="dash-chips">'+chips+'</dl>':'')+'</li>';
    }).join('')+'</ul>';
  return '<article class="panel dash-ph-card '+tone+'">'+head+body+'<button type="button" class="secondary dash-ph-link" data-goto="'+kind+'">Kelola '+kind+'</button></article>';
}
function phDashboard() {
  const P=phState.Perhimpunan, D=phState.Pendistribusian;
  const now=today().slice(0,4);
  const years=[...new Set([...P.rows.map(r=>String(r.tahun)),...D.rows.map(r=>String(r.tahun)),now])].sort().reverse();
  const year=years.includes(P.year)?P.year:(P.rows.length?String(P.rows[0].tahun):now);
  P.year=D.year=year;
  return '<div class="toolbar dash-ph-toolbar"><div><h2>Perhimpunan dan Pendistribusian</h2><p class="muted">Rincian per UPZ desa/kelurahan</p></div>'+
    '<label class="year-select">Tahun <select id="dashPhYear">'+years.map(y=>'<option value="'+y+'" '+(y===year?'selected':'')+'>'+y+'</option>').join('')+'</select></label></div>'+
    '<div class="dash-ph-grid">'+phDashCard('Perhimpunan',year)+phDashCard('Pendistribusian',year)+'</div>';
}
function phDashEnsure() {
  const key=simulated?'demo':(session?.user?.id||'public');
  for(const kind of ['Perhimpunan','Pendistribusian']) {
    const S=phState[kind];
    if(S.dashKey!==key && !S.loading) {S.dashKey=key; setTimeout(()=>loadPh(kind),0);}
  }
}
function heroExtras() {
  const updated=new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric'}).format(new Date());
  return '<div class="hero-actions"><button type="button" data-goto="Pemasukan">Lihat Pemasukan</button><button type="button" data-goto="Pengeluaran">Lihat Pengeluaran</button><button type="button" data-goto="Cetak Laporan">Cetak Laporan</button></div>'+
    '<p class="hero-updated">Diperbarui: '+updated+'</p>'+
    '<aside class="hero-quote" aria-hidden="true"><span>“</span><p>Ambillah zakat dari sebagian harta mereka, guna membersihkan dan menyucikan mereka.</p><small>QS. At-Taubah: 103</small></aside>';
}

async function loadPh(kind=screen) {
  const S=phState[kind], K=PH_KINDS[kind];
  const stamp = ++S.generation;
  S.loading = true;
  S.failure = '';
  render();
  try {
    if(simulated) S.rows = [...K.demo].sort((a,b)=>b.tahun-a.tahun||a.id-b.id);
    else S.rows = await api('/rest/v1/'+K.table+'?select=*&order=tahun.desc,id.asc&limit=1000');
  } catch(error) {
    if(stamp!==S.generation) return;
    S.rows = [];
    S.failure = error.message;
  } finally {
    if(stamp===S.generation) {S.loading=false;render();}
  }
}


/* Tahun Hijriah yang Ramadhan-nya jatuh pada tahun Masehi tertentu (mis. 2026 M -> 1447 H) */
const phHijriCache = {};
function phHijriYear(gregorianYear) {
  const y = Number(gregorianYear);
  if(phHijriCache[y]) return phHijriCache[y];
  let result = Math.round((y-622)*1.030684);
  try {
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{year:'numeric',month:'numeric',timeZone:'UTC'});
    for(let d=new Date(Date.UTC(y,0,1)); d.getUTCFullYear()===y; d=new Date(d.getTime()+864e5)) {
      const parts = Object.fromEntries(fmt.formatToParts(d).map(x=>[x.type,x.value]));
      if(Number(parts.month)===9) {result = Number(parts.year); break;}
    }
  } catch {}
  return phHijriCache[y] = result;
}

const phMonthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const phLongDate = iso => { const [y,m,d]=iso.split('-'); return Number(d)+' '+phMonthNames[Number(m)-1]+' '+y; };

/* Formulir cetak A2 Kecamatan (hanya tampil saat dicetak) */
function phPrintForm(kind, list, year, total, grand) {
  const K=PH_KINDS[kind];
  const e = v => v==null ? '' : esc(v);
  const n = v => angka.format(Number(v||0));
  const cell = v => Number(v||0) ? n(v) : '-';
  const info = profile.identitas || {};
  const ketua = profileOfficer('ketua');
  const phone = info.telepon || '';
  const reportDate = phLongDate(phReportDate || today());
  const MIN_ROWS = 7;
  const rowsHtml = list.map((r,i)=>'<tr><td>'+(i+1)+'</td><td class="l">'+e(r.nama_upz)+'</td><td class="l">'+e(r.alamat_kp)+'</td><td>'+e(r.rt)+'</td><td>'+e(r.rw)+'</td><td class="r">'+cell(r.jumlah_jiwa)+'</td>'+
    '<td class="r">'+cell(r.zakat_fitrah)+(Number(r.beras_kg||0)?'<br><span class="beras">'+n(r.beras_kg)+' kg</span>':'')+'</td>'+
    '<td class="r">'+cell(r.bis_ramadhan)+'</td><td class="r">'+cell(r.zakat_mal)+'</td><td class="r">'+cell(r.infak_umum)+'</td><td class="r">'+cell(r.fidyah)+'</td><td class="r"><b>'+n(phJumlah(r))+'</b></td></tr>').join('');
  const blank = Array.from({length:Math.max(0,MIN_ROWS-list.length)},(_,i)=>'<tr><td>'+(list.length+i+1)+'</td>'+'<td></td>'.repeat(11)+'</tr>').join('');
  const totalRow = '<tr class="tot"><td></td><td class="l"><b>JUMLAH</b></td><td></td><td></td><td></td><td class="r"><b>'+(list.length?n(total.jumlah_jiwa):'')+'</b></td>'+
    '<td class="r"><b>'+(list.length?n(total.zakat_fitrah)+(Number(total.beras_kg)?'<br><span class="beras">'+n(total.beras_kg)+' kg</span>':''):'')+'</b></td>'+
    ['bis_ramadhan','zakat_mal','infak_umum','fidyah'].map(k=>'<td class="r"><b>'+(list.length?n(total[k]):'')+'</b></td>').join('')+
    '<td class="r"><b>'+(list.length?n(grand):'')+'</b></td></tr>';
  return '<div class="ph-form" aria-hidden="true">'+
    '<div class="phf-tag">form '+K.form+' Kecamatan</div>'+
    '<div class="phf-head">'+'<img src="logo-baznas.png" alt="Logo BAZNAS Kabupaten Subang">'+
    '<div class="phf-title">'+K.formTitle+'<br>DANA ZAKAT FITRAH, BIS RAMADHAN, ZAKAT MAL, INFAK UMUM DAN FIDYAH<br>TAHUN '+phHijriYear(year)+' H / '+esc(year)+' M</div></div>'+
    '<div class="phf-info"><div><span>Kecamatan</span><span class="ul">: CIPEUNDEUY</span></div><div><span>Nama Ketua UPZ</span><span class="ul">: '+e(ketua).toUpperCase()+'</span></div>'+
    '<div><span>Kabupaten</span><span class="ul">: SUBANG</span></div><div><span>Nomor Hp.</span><span class="ul">: '+e(phone)+'</span></div></div>'+
    '<table class="phf-table"><colgroup><col style="width:3.5%"><col style="width:15%"><col style="width:13%"><col style="width:4%"><col style="width:4%"><col style="width:7%"><col style="width:9.5%"><col style="width:8.5%"><col style="width:9%"><col style="width:9%"><col style="width:8%"><col style="width:9.5%"></colgroup><thead>'+
    '<tr><th rowspan="2">NO</th><th rowspan="2">NAMA UPZ<br>DESA/KELURAHAN</th><th colspan="3">ALAMAT</th><th rowspan="2">JUMLAH<br>JIWA<br>(Orang)</th><th colspan="6">'+K.group+'</th></tr>'+
    '<tr><th>Kp/Dsn/Blok</th><th>RT</th><th>RW</th><th>Zakat Fitrah<br>(Rp) / Beras<br>(3,5 L/2,8 kg)</th><th>BIS<br>Ramadhan<br>(Rp)</th><th>Zakat Mal Rp.</th><th>Infak Umum<br>Rp.</th><th>Fidyah Rp.</th><th>Jumlah Rp.</th></tr></thead>'+
    '<tbody>'+rowsHtml+blank+totalRow+'</tbody></table>'+
    '<div class="phf-sign"><div class="phf-left">Mengetahui,<br>Camat Cipeundeuy<div class="phf-name" id="phCamatPrint">'+(phCamat.trim()?esc(phCamat.trim()):'')+'</div></div>'+
    '<div class="phf-right"><span id="phDatePrint">Dilaporkan tanggal : '+esc(reportDate)+'</span><br>Ketua UPZ,<div class="phf-name">'+e(ketua)+'</div></div></div></div>';
}

function phPage(kind) {
  const S=phState[kind], K=PH_KINDS[kind];
  if(!S.year && !S.loading) S.year = S.rows.length ? String(S.rows[0].tahun) : today().slice(0,4);
  const year = S.year || today().slice(0,4);
  const years = [...new Set([...S.rows.map(r=>String(r.tahun)),year,today().slice(0,4)])].sort().reverse();
  const list = S.rows.filter(r=>String(r.tahun)===year);
  const total = {};
  PH_SUM.forEach(key=>{total[key]=list.reduce((sum,r)=>sum+Number(r[key]||0),0);});
  const grand = list.reduce((sum,r)=>sum+phJumlah(r),0);
  const canEdit = admin();
  const sql = new RegExp(K.empty+'|schema cache','i').test(S.failure) ? ' Jalankan <a href="'+K.sql+'" download>'+K.sql+'</a> di Supabase SQL Editor.' : '';
  const n = value => angka.format(Number(value||0));
  const actions = r => canEdit ? '<td class="no-print ph-actions"><button type="button" class="secondary" data-ph-edit="'+esc(r.id)+'">Edit</button> <button type="button" class="danger" data-ph-delete="'+esc(r.id)+'">Hapus</button></td>' : '';
  const body = list.map((r,i)=>'<tr><td>'+(i+1)+'</td><td class="ph-name">'+esc(r.nama_upz)+'</td><td class="ph-left">'+esc(r.alamat_kp)+'</td><td>'+esc(r.rt)+'</td><td>'+esc(r.rw)+'</td><td class="money">'+n(r.jumlah_jiwa)+'</td>'+
    '<td class="money">'+n(r.zakat_fitrah)+'</td><td class="money">'+n(r.beras_kg)+'</td><td class="money">'+n(r.bis_ramadhan)+'</td><td class="money">'+n(r.zakat_mal)+'</td><td class="money">'+n(r.infak_umum)+'</td><td class="money">'+n(r.fidyah)+'</td><td class="money ph-strong">'+n(phJumlah(r))+'</td>'+actions(r)+'</tr>').join('');
  const table = '<div class="scroll ph-table-wrap"><table class="ph-table"><thead>'+
    '<tr><th rowspan="2">No</th><th rowspan="2">Nama UPZ Desa/Kelurahan</th><th colspan="3">Alamat</th><th rowspan="2">Jumlah Jiwa (Orang)</th><th colspan="7">Pengumpulan</th>'+(canEdit?'<th rowspan="2" class="no-print">Aksi</th>':'')+'</tr>'+
    '<tr><th>Kp/Dsn/Blok</th><th>RT</th><th>RW</th><th>Zakat Fitrah (Rp)</th><th>Beras (kg)</th><th>BIS Ramadhan (Rp)</th><th>Zakat Mal (Rp)</th><th>Infak Umum (Rp)</th><th>Fidyah (Rp)</th><th>Jumlah (Rp)</th></tr></thead>'+
    '<tbody>'+body+'</tbody><tfoot><tr><td></td><td class="ph-name">JUMLAH RP.</td><td colspan="3"></td><td class="money">'+n(total.jumlah_jiwa)+'</td><td class="money">'+n(total.zakat_fitrah)+'</td><td class="money">'+n(total.beras_kg)+'</td><td class="money">'+n(total.bis_ramadhan)+'</td><td class="money">'+n(total.zakat_mal)+'</td><td class="money">'+n(total.infak_umum)+'</td><td class="money">'+n(total.fidyah)+'</td><td class="money ph-strong">'+n(grand)+'</td>'+(canEdit?'<td class="no-print"></td>':'')+'</tr></tfoot></table></div>';
  const cards = '<div class="ph-cards">'+list.map((r,i)=>'<article class="ph-card"><h3>'+(i+1)+'. '+esc(r.nama_upz)+'</h3><p class="muted">'+esc([r.alamat_kp,(r.rt||r.rw)?'RT '+(r.rt||'-')+' / RW '+(r.rw||'-'):'',n(r.jumlah_jiwa)+' jiwa'].filter(Boolean).join(' · '))+'</p><dl>'+
    '<dt>Zakat fitrah</dt><dd>'+money(Number(r.zakat_fitrah||0))+'</dd><dt>Beras</dt><dd>'+n(r.beras_kg)+' kg</dd><dt>BIS Ramadhan</dt><dd>'+money(Number(r.bis_ramadhan||0))+'</dd><dt>Zakat mal</dt><dd>'+money(Number(r.zakat_mal||0))+'</dd><dt>Infak umum</dt><dd>'+money(Number(r.infak_umum||0))+'</dd><dt>Fidyah</dt><dd>'+money(Number(r.fidyah||0))+'</dd><dt class="ph-strong">Jumlah</dt><dd class="ph-strong">'+money(phJumlah(r))+'</dd></dl>'+
    (canEdit?'<div class="toolbar"><button type="button" class="secondary" data-ph-edit="'+esc(r.id)+'">Edit</button><button type="button" class="danger" data-ph-delete="'+esc(r.id)+'">Hapus</button></div>':'')+'</article>').join('')+
    '<article class="ph-card ph-total"><h3>Jumlah Rp.</h3><p><strong>'+money(grand)+'</strong></p><p class="muted">'+n(total.jumlah_jiwa)+' jiwa · beras '+n(total.beras_kg)+' kg</p></article></div>';
  let content;
  if(S.loading) content = '<p class="empty">Memuat data…</p>';
  else if(S.failure) content = '<p class="empty" role="alert">Data '+K.empty+' gagal dimuat. '+esc(S.failure)+sql+'</p>';
  else if(!list.length) content = '<p class="empty">Belum ada data '+K.empty+' untuk tahun '+esc(year)+'.'+(canEdit?' Klik “Tambah UPZ desa” untuk mengisi.':'')+'</p>';
  else content = table+cards;
  const printForm = !S.loading&&!S.failure ? phPrintForm(kind,list,year,total,grand) : '';
  return '<section class="panel ph-panel"><div class="ph-heading"><p class="crumb">'+kind+'</p><h1>'+K.heading+'</h1><p class="muted">'+K.sub+' · Tahun '+esc(year)+'</p></div>'+
    '<div class="toolbar no-print"><label class="ph-year">Tahun <select id="phYear">'+years.map(y=>'<option value="'+esc(y)+'" '+(y===year?'selected':'')+'>'+esc(y)+'</option>').join('')+'</select></label>'+
    '<label class="ph-year">Nama Camat <input id="phCamat" maxlength="100" placeholder="Isi sebelum cetak" value="'+esc(phCamat)+'"></label>'+
    '<label class="ph-year">Tanggal laporan <input id="phReportDate" type="date" max="9999-12-31" value="'+esc(phReportDate||today())+'"></label>'+
    '<span class="ph-tools"><button type="button" class="secondary" id="phPrint">Cetak Form '+K.form+'</button>'+(canEdit?'<button type="button" id="phAdd">Tambah UPZ desa</button>':'')+'</span></div>'+content+printForm+'</section>';
}

function editPh(record, kind=screen) {
  const S=phState[kind], K=PH_KINDS[kind];
  if(!admin()) return;
  const dialog=$('modal');
  const val=key=>esc(record?.[key] ?? '');
  const moneyField=(key,label)=>'<label>'+label+'<input type="number" name="'+key+'" min="0" max="9999999999999" step="0.01" placeholder="0" value="'+val(key)+'"></label>';
  dialog.innerHTML='<h2>'+(record?'Edit':'Tambah')+' UPZ Desa/Kelurahan</h2><form id="phForm">'+
    '<label>Tahun<input type="number" name="tahun" min="2000" max="2100" required value="'+esc(record?.tahun || S.year || today().slice(0,4))+'"></label>'+
    '<label>Nama UPZ Desa/Kelurahan<input name="nama_upz" maxlength="120" required value="'+val('nama_upz')+'"></label>'+
    '<label>Kp/Dsn/Blok<input name="alamat_kp" maxlength="120" value="'+val('alamat_kp')+'"></label>'+
    '<div class="ph-grid"><label>RT<input name="rt" maxlength="10" value="'+val('rt')+'"></label><label>RW<input name="rw" maxlength="10" value="'+val('rw')+'"></label></div>'+
    '<label>Jumlah Jiwa (orang)<input type="number" name="jumlah_jiwa" min="0" step="1" placeholder="0" value="'+val('jumlah_jiwa')+'"></label>'+
    '<div class="ph-grid">'+moneyField('zakat_fitrah','Zakat Fitrah (Rp)')+'<label>Beras (kg)<input type="number" name="beras_kg" min="0" step="0.01" placeholder="0" value="'+val('beras_kg')+'"></label>'+
    moneyField('bis_ramadhan','BIS Ramadhan (Rp)')+moneyField('zakat_mal','Zakat Mal (Rp)')+moneyField('infak_umum','Infak Umum (Rp)')+moneyField('fidyah','Fidyah (Rp)')+'</div>'+
    '<div id="phError" role="alert"></div><div class="toolbar"><button>Simpan</button><button type="button" class="secondary" id="phCancel">Batal</button>'+
    (record?'<button type="button" class="danger" id="phDelete">Hapus</button>':'')+'</div></form>';
  $('phCancel').onclick=()=>dialog.close();
  $('phForm').onsubmit=event=>{
    event.preventDefault();
    const f=Object.fromEntries(new FormData(event.currentTarget));
    const body={tahun:Number(f.tahun),nama_upz:f.nama_upz.trim(),alamat_kp:f.alamat_kp.trim()||null,rt:f.rt.trim()||null,rw:f.rw.trim()||null};
    if(!body.nama_upz) {$('phError').textContent='Nama UPZ wajib diisi.';return;}
    for(const key of PH_SUM) {
      const value=Number(f[key]||0);
      if(!Number.isFinite(value)||value<0) {$('phError').textContent='Angka tidak boleh negatif.';return;}
      body[key]=key==='jumlah_jiwa'?Math.round(value):value;
    }
    savePh(kind,record,body);
  };
  if(record) $('phDelete').onclick=()=>deletePh(kind,record);
  dialog.showModal();
}

async function savePh(kind, record, body) {
  const S=phState[kind], K=PH_KINDS[kind];
  const buttons=[...$('phForm').querySelectorAll('button')];
  buttons.forEach(b=>b.disabled=true);
  try {
    if(simulated) {
      if(record) {
        const index=K.demo.findIndex(r=>r.id===record.id);
        if(index>=0) K.demo[index]={...record,...body};
      } else K.demo.push({...body,id:Math.max(0,...K.demo.map(r=>r.id))+1});
    } else {
      const path=record?'/rest/v1/'+K.table+'?id=eq.'+encodeURIComponent(record.id):'/rest/v1/'+K.table;
      const result=await api(path,{method:record?'PATCH':'POST',body,token:session.access_token,extra:{Prefer:'return=representation'}});
      if(!result?.length) throw Error('Data tidak ditemukan atau akses ditolak.');
    }
    S.year=String(body.tahun);
    $('modal').close();
    await loadPh(kind);
  } catch(error) {
    const notice=$('phError');
    if(/duplicate key/i.test(error.message)) notice.textContent='UPZ dengan nama itu sudah ada pada tahun '+body.tahun+'.';
    else if(/row-level security/i.test(error.message)) notice.textContent='Akses ditolak. Pastikan kamu masuk sebagai admin.';
    else if(new RegExp(K.empty+'|schema cache','i').test(error.message)) notice.innerHTML='Jalankan <a href="'+K.sql+'" download>'+K.sql+'</a> di Supabase SQL Editor, lalu coba simpan lagi.';
    else notice.textContent=error.message;
  } finally {buttons.forEach(b=>b.disabled=false);}
}

async function deletePh(kind,record) {
  if(!admin()) return;
  if(!confirm('Hapus data '+record.nama_upz+' tahun '+record.tahun+'?\n\nData yang dihapus tidak dapat dikembalikan.')) return;
  try {
    if(simulated) {
      const index=K.demo.findIndex(r=>r.id===record.id);
      if(index>=0) K.demo.splice(index,1);
    } else {
      const result=await api('/rest/v1/'+K.table+'?id=eq.'+encodeURIComponent(record.id),{method:'DELETE',token:session.access_token,extra:{Prefer:'return=representation'}});
      if(!result?.length) throw Error('Data tidak ditemukan atau akses ditolak.');
    }
    if($('modal').open) $('modal').close();
    await loadPh(kind);
  } catch(error) {alert('Data gagal dihapus. '+error.message);}
}

function bkuTabs() {
  return '<div class="bku-tabs no-print" role="tablist">'+[['BKU','Ringkasan'],['Pemasukan','Pemasukan'],['Pengeluaran','Pengeluaran'],['Cetak Laporan','Cetak']].map(([page,label])=>
    '<button type="button" role="tab" data-goto="'+page+'" aria-selected="'+(screen===page)+'" class="'+(screen===page?'on':'')+'">'+label+'</button>').join('')+'</div>';
}

function render() {
  $('role').textContent = simulated?'Admin · Demo':admin()?'Administrator':'Akses Umum';
  $('status').hidden = !failure&&!simulated;
  $('status').textContent = failure || (simulated?'Mode demo · Seluruh perubahan hanya berlaku selama halaman ini terbuka.':'');
  const navButton = (name,label,iconName,extra='')=>'<button type="button" data-page="'+name+'" class="'+(screen===name?'active':'')+extra+'" '+(screen===name?'aria-current="page"':'')+'><span class="nav-icon" aria-hidden="true">'+svgIcon(iconName)+'</span><span class="nav-label">'+label+'</span></button>';
  const inBku = bkuGroup.includes(screen);
  $('nav').innerHTML = items.map(([name])=>{
    if(name==='Pemasukan'||name==='Pengeluaran'||name==='Cetak Laporan') return '';
    if(name==='Rekap Laporan') {
      const inRekap = rekapGroup.includes(screen);
      return '<button type="button" id="rekapParent" class="nav-parent'+(inRekap?' in-group active':'')+(rekapOpen?' open':'')+'" '+(inRekap?'aria-current="page" ':'')+'aria-expanded="'+rekapOpen+'" aria-controls="rekapSub"><span class="nav-icon" aria-hidden="true">'+svgIcon('Rekap Laporan')+'</span><span class="nav-label">Rekap Laporan</span><span class="nav-chevron" aria-hidden="true"></span></button>'+
        '<div class="nav-sub'+(rekapOpen?' show':'')+'" id="rekapSub">'+navButton('Form C2A','Form C2A','Form C2A')+navButton('Form C2B','Form C2B','Form C2B')+'</div>';
    }
    if(name==='BKU') {
      return '<button type="button" id="bkuParent" class="nav-parent'+(inBku?' in-group active':'')+(bkuOpen?' open':'')+'" '+(inBku?'aria-current="page" ':'')+'aria-expanded="'+bkuOpen+'" aria-controls="bkuSub"><span class="nav-icon" aria-hidden="true">'+svgIcon('BKU')+'</span><span class="nav-label">BKU</span><span class="nav-chevron" aria-hidden="true"></span></button>'+
        '<div class="nav-sub'+(bkuOpen?' show':'')+'" id="bkuSub">'+
        '<button type="button" data-page="BKU" class="'+(screen==='BKU'?'active':'')+'" '+(screen==='BKU'?'aria-current="page"':'')+'><span class="nav-icon" aria-hidden="true">'+svgIcon('BKU')+'</span><span class="nav-label"><span class="lbl-desk">Ringkasan</span><span class="lbl-mob">BKU</span></span></button>'+
        navButton('Pemasukan','Pemasukan','Pemasukan')+navButton('Pengeluaran','Pengeluaran','Pengeluaran')+navButton('Cetak Laporan','Cetak Laporan','Cetak Laporan')+'</div>';
    }
    const label = name==='Login'&&admin()?'Keluar':name;
    return navButton(name,label,name==='Login'&&admin()?'Keluar':name);
  }).join('');
  const data = summary.filter(r=>!month||r.bulan.startsWith(month));
  const list = rows.filter(r=>!month||r.tanggal.startsWith(month));
  let content;
  if(screen==='Dashboard') {
    phDashEnsure();
    const saldo = totals(summary)[2];
    content = '<div class="hero"><div class="eyebrow">'+(admin()?'DASHBOARD ADMIN':'DASHBOARD UMUM')+'</div><h1>Kas UPZ Cipeundeuy</h1><p>Ringkasan penerimaan, pengeluaran, dan saldo kas.</p><strong>Saldo kas keseluruhan · '+money(loading||failure?null:saldo)+'</strong>'+heroExtras()+'</div>'+
      phDashboard();
  } else if(screen==='Profil') {
    content = profilePage();
  } else if(screen==='Login') {
    content = '<section class="panel login"><h1>Login Admin</h1><p class="muted">Gunakan akun yang terdaftar di Supabase Auth.</p><form id="login"><label>Email<input type="email" name="email" autocomplete="username" required></label><label>Kata sandi<input type="password" name="password" autocomplete="current-password" required></label><div id="loginError" role="alert"></div><button>Masuk</button><button type="button" class="secondary" id="demo">Coba Admin Demo</button></form></section>';
  } else if(PH_KINDS[screen]) {
    content = phPage(screen);
  } else if(screen==='Form C2A') {
    content = rekapPage();
  } else if(screen==='Form C2B') {
    content = rekapC2BPage();
  } else if(screen==='Cetak Laporan') {
    content = bkuTabs()+reportPage();
  } else if(screen==='BKU') {
    content = '<section class="panel bku-panel">'+bkuTabs()+'<div class="bku-heading"><p class="crumb">BKU / Ringkasan</p><h1>BKU</h1><p class="muted">Ringkasan kas dan rincian transaksi per bulan, dimulai dari Januari.</p></div>'+
      '<div class="toolbar no-print">'+filters()+'</div>'+
      '<div class="bku-month-list">'+bkuMonthly(data,list)+'</div></section>';
  } else {
    const type = screen==='Pemasukan'?'debet':screen==='Pengeluaran'?'kredit':'';
    const selection = (type?list.filter(r=>Number(r[type])>0):list).filter(r=>{
      const query=transactionSearch.trim().toLocaleLowerCase('id');
      const matches=!query||[r.no_kwitansi,r.penerima,r.tanggal,r.kriteria,r.uraian].some(value=>String(value||'').toLocaleLowerCase('id').includes(query));
      return matches&&(!transactionCategory||r.kriteria===transactionCategory);
    });
    content = '<section class="panel">'+bkuTabs()+'<p class="crumb">BKU / '+esc(screen)+'</p><h1>'+esc(screen)+'</h1>'+
      '<div class="toolbar no-print">'+filters()+
      (admin()?'<button id="add">Tambah '+esc(type?screen:'Transaksi')+'</button>':'')+
      '</div>'+(admin()?transactionFilters(type?list.filter(r=>Number(r[type])>0):list)+ledger(selection,true):publicLedger(data,screen))+'</section>';
  }
  $('page').innerHTML = content;
  $('period')?.addEventListener('change',e=>{month=e.target.value;render();});
  $('dashPhYear')?.addEventListener('change',e=>{phState.Perhimpunan.year=phState.Pendistribusian.year=e.target.value;render();});
  $('dashboardYear')?.addEventListener('change',e=>{dashboardYear=e.target.value;render();});
  $('transactionSearch')?.addEventListener('change',e=>{transactionSearch=e.target.value;render();});
  $('transactionCategory')?.addEventListener('change',e=>{transactionCategory=e.target.value;render();});
  $('all')?.addEventListener('click',()=>{month='';render();});
  $('print')?.addEventListener('click',()=>window.print());
  $('phYear')?.addEventListener('change',e=>{phState[screen].year=e.target.value;render();});
  $('phAdd')?.addEventListener('click',()=>editPh());
  $('phPrint')?.addEventListener('click',()=>window.print());
  $('phCamat')?.addEventListener('input',e=>{phCamat=e.target.value;const t=$('phCamatPrint');if(t)t.textContent=phCamat.trim();});
  $('phReportDate')?.addEventListener('input',e=>{
    if(!e.target.value) return;
    phReportDate=e.target.value;
    const t=$('phDatePrint');if(t)t.textContent='Dilaporkan tanggal : '+phLongDate(phReportDate);
  });
  document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.goto)));
  if(screen==='Cetak Laporan') bindReportFilters();
  if(screen==='Form C2A') bindRekap();
  if(screen==='Form C2B') bindRekapC2B();
  $('login')?.addEventListener('submit',login);
  $('demo')?.addEventListener('click',()=>{simulated=true;screen='Dashboard';loadProfile();refresh();});
  $('add')?.addEventListener('click',()=>edit());
  $('editProfile')?.addEventListener('click',editInstitution);
  $('editOfficers')?.addEventListener('click',editOfficers);
}

async function login(e) {
  e.preventDefault();
  const form = e.currentTarget;
  form.querySelector('button').disabled = true;
  try {
    const credentials = Object.fromEntries(new FormData(form));
    const userSession = await api('/auth/v1/token?grant_type=password',{method:'POST',body:credentials});
    if(userSession.user?.id!==ADMIN || screen!=='Login' || simulated) {
      await api('/auth/v1/logout?scope=local',{method:'POST',token:userSession.access_token}).catch(()=>{});
      throw Error('Akun ini tidak terdaftar sebagai admin BKU.');
    }
    session = userSession;
    screen = 'Dashboard';
    await refresh();
  } catch(error) {
    if($('loginError')) $('loginError').textContent=error.message;
  } finally {form.querySelector('button').disabled=false;}
}

const transactionCriteria = [
  'Operasional Amil',
  'Sarana dan Prasarana',
  'Pembinaan OPZ',
  'Kegiatan Sosial Keagamaan',
  'Lainnya'
];

function criteriaOptions(current) {
  const options = current && !transactionCriteria.includes(current)
    ? [...transactionCriteria,current] : transactionCriteria;
  return '<option value="" disabled '+(current?'':'selected')+'>Pilih kriteria</option>'+
    options.map(value=>'<option value="'+esc(value)+'" '+(value===current?'selected':'')+'>'+esc(value)+'</option>').join('');
}

function edit(record) {
  if(!admin()) return;
  const dialog=$('modal');
  const type=record?(Number(record.debet)>0?'debet':'kredit'):screen==='Pengeluaran'?'kredit':'debet';
  dialog.innerHTML='<h2>'+(record?'Edit':'Tambah')+' Transaksi</h2><form id="entry">'+
    '<label>No Kwitansi<input readonly value="'+esc(record ? record.no_kwitansi || '—' : 'Dibuat otomatis saat disimpan')+'"></label>'+
    '<label><span id="entryParty">'+(type==='debet'?'Pemberi / Sumber Dana':'Penerima')+'</span><input name="penerima" value="'+esc(record?.penerima??'')+'"></label>'+
    '<label>Tanggal<input type="date" name="tanggal" required value="'+esc(record?.tanggal??today())+'"></label>'+
    '<label>Kriteria<select name="kriteria" required>'+criteriaOptions(record?.kriteria)+'</select></label>'+
    '<label>Uraian<input name="uraian" required value="'+esc(record?.uraian??'')+'"></label>'+
    '<label>Jenis<select name="type"><option value="debet">Pemasukan</option><option value="kredit" '+(type==='kredit'?'selected':'')+'>Pengeluaran</option></select></label>'+
    '<label>Nominal (Rp)<input type="number" name="nominal" min="0.01" max="9999999999999" step="0.01" required value="'+esc(record?.[type]??'')+'"></label>'+
    '<div id="entryError" role="alert"></div><div class="toolbar"><button>Simpan</button><button type="button" class="secondary" id="cancel">Batal</button>'+
    (record?'<button type="button" class="danger" id="delete">Hapus</button>':'')+'</div></form>';
  $('cancel').onclick=()=>dialog.close();
  $('entry').elements.type.onchange=event=>{
    $('entryParty').textContent=event.target.value==='debet'?'Pemberi / Sumber Dana':'Penerima';
  };
  $('entry').onsubmit=event=>{
    event.preventDefault();
    const {type,nominal,...fields}=Object.fromEntries(new FormData(event.currentTarget));
    for(const key of Object.keys(fields)) fields[key]=fields[key].trim();
    if(!fields.kriteria||!fields.uraian) {$('entryError').textContent='Kriteria dan uraian wajib diisi.';return;}
    save(record,{...fields,penerima:fields.penerima||null,debet:type==='debet'?nominal:0,kredit:type==='kredit'?nominal:0});
  };
  if(record) $('delete').onclick=()=>deleteTransaction(record,$('delete'),true);
  dialog.showModal();
}

async function save(record, body) {
  const buttons=[...$('entry').querySelectorAll('button')];
  buttons.forEach(b=>b.disabled=true);
  try {
    if(simulated) {
      const index=demo.findIndex(r=>r.id===record?.id);
      const entry = {...body,id:record?.id ?? Math.max(0,...demo.map(r=>r.id))+1,
        no_kwitansi:demoReceipt(body.tanggal,record),debet:Number(body.debet),kredit:Number(body.kredit)};
      if(record) demo[index]=entry;
      else demo.push(entry);
    } else {
      const token=session.access_token;
      const result=await api('/rest/v1/rpc/bku_simpan_transaksi',{method:'POST',body:{p_transaksi:body,p_id:record?.id ?? null},token});
      if(!result?.length) throw Error('Transaksi tidak ditemukan atau akses ditolak.');
    }
    $('modal').close();
    await refresh();
  } catch(error) {
    const notice=$('entryError');
    if(error.message.includes('bku_simpan_transaksi')) {
      notice.innerHTML='Jalankan <a href="setup-kwitansi-supabase.sql" download>setup-kwitansi-supabase.sql</a> di Supabase SQL Editor, lalu coba simpan lagi.';
    } else notice.textContent=error.message;
  }
  finally {buttons.forEach(b=>b.disabled=false);}
}

const deletingTransactions = new Set();

async function deleteTransaction(record,button,fromDialog=false) {
  const id=String(record.id);
  if(!admin() || deletingTransactions.has(id)) return;
  const description=record.no_kwitansi || record.uraian || record.tanggal;
  if(!confirm('Hapus transaksi '+description+' sebesar '+money(Number(record.debet)||Number(record.kredit))+'?\n\nTransaksi yang dihapus tidak dapat dikembalikan.')) return;
  deletingTransactions.add(id);
  const controls=fromDialog?[...$('entry').querySelectorAll('button')].filter(control=>!control.disabled):[button];
  controls.forEach(control=>control.disabled=true);
  const modal=$('modal');
  const preventClose=event=>event.preventDefault();
  if(fromDialog) modal.addEventListener('cancel',preventClose);
  try {
    if(simulated) {
      const index=demo.findIndex(row=>String(row.id)===id);
      if(index<0) throw Error('Transaksi tidak ditemukan.');
      demo.splice(index,1);
    } else {
      const result=await api('/rest/v1/transaksi_kas?id=eq.'+encodeURIComponent(id),{
        method:'DELETE',token:session.access_token,extra:{Prefer:'return=representation'}
      });
      if(!result?.length) throw Error('Transaksi tidak ditemukan atau akses ditolak.');
    }
    if(fromDialog) modal.close();
    await refresh();
  } catch(error) {
    const notice='Transaksi gagal dihapus. '+error.message;
    if(fromDialog) $('entryError').textContent=notice;
    else alert(notice);
  } finally {
    deletingTransactions.delete(id);
    if(fromDialog) modal.removeEventListener('cancel',preventClose);
    controls.forEach(control=>control.disabled=false);
  }
}

$('page').addEventListener('click',event=>{
  const button=event.target.closest('[data-edit],[data-receipt],[data-delete]');
  if(!button||!admin()) return;
  const record=rows.find(row=>String(row.id)===(button.dataset.edit ?? button.dataset.receipt ?? button.dataset.delete));
  if(!record) return;
  if(button.dataset.edit) edit(record);
  else if(button.dataset.delete) deleteTransaction(record,button);
  else downloadReceipt(record,button);
});

$('page').addEventListener('click',event=>{
  const button=event.target.closest('[data-ph-edit],[data-ph-delete]');
  if(!button||!admin()) return;
  const record=phState[screen]?.rows.find(row=>String(row.id)===(button.dataset.phEdit ?? button.dataset.phDelete));
  if(!record) return;
  if(button.dataset.phEdit!==undefined) editPh(record);
  else deletePh(screen,record);
});

const menuToggle = $('menuToggle');
const navBackdrop = $('navBackdrop');
function setNavigationOpen(open) {
  document.body.classList.toggle('nav-open',open);
  menuToggle?.setAttribute('aria-expanded',String(open));
  menuToggle?.setAttribute('aria-label',open?'Tutup menu navigasi':'Buka menu navigasi');
}
menuToggle?.addEventListener('click',()=>setNavigationOpen(!document.body.classList.contains('nav-open')));
navBackdrop?.addEventListener('click',()=>setNavigationOpen(false));
document.addEventListener('keydown',event=>{
  if(event.key==='Escape') setNavigationOpen(false);
});
$('nav').addEventListener('click',event=>{
  const rekapParent=event.target.closest('#rekapParent');
  if(rekapParent) {
    if(window.matchMedia('(max-width:900px)').matches) {
      if(!rekapGroup.includes(screen)) go('Form C2A');
      return;
    }
    rekapOpen=!rekapOpen;
    rekapParent.classList.toggle('open',rekapOpen);
    rekapParent.setAttribute('aria-expanded',String(rekapOpen));
    $('rekapSub')?.classList.toggle('show',rekapOpen);
    return;
  }
  const parent=event.target.closest('#bkuParent');
  if(parent) {
    if(window.matchMedia('(max-width:900px)').matches) {
      if(!bkuGroup.includes(screen)) go('BKU');
      return;
    }
    bkuOpen=!bkuOpen;
    parent.classList.toggle('open',bkuOpen);
    parent.setAttribute('aria-expanded',String(bkuOpen));
    $('bkuSub')?.classList.toggle('show',bkuOpen);
    return;
  }
  const button=event.target.closest('[data-page]');
  if(!button) return;
  if(button.dataset.page==='Login'&&admin()) {
    const token=session?.access_token;
    const wasDemo=simulated;
    session=undefined;
    simulated=false;
    screen='Dashboard';
    if(token) api('/auth/v1/logout?scope=local',{method:'POST',token}).catch(()=>{});
    if(wasDemo) loadProfile();
    refresh();
    return;
  }
  go(button.dataset.page);
});
refresh();
loadProfile();
