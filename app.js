const PROJECT = 'https://bpavltvdhantbwmoeabx.supabase.co';
const KEY = 'sb_publishable_xpARKQZVCB8mcwVJnOGxYA_yEetsBUM';
const ADMIN = '09a92d1b-8f35-4459-95e7-cf54a202296b';
const $ = id => document.getElementById(id);
/* ---------- Komponen UI: toast, dialog konfirmasi, keadaan kosong, skeleton ---------- */
function toast(message,type='ok') {
  const box=$('toasts'); if(!box) return;
  const el=document.createElement('div');
  el.className='toast '+type; el.setAttribute('role',type==='error'?'alert':'status');
  el.innerHTML='<span class="toast-ico" aria-hidden="true">'+(type==='error'?'!':'✓')+'</span><span></span>';
  el.lastChild.textContent=message;
  box.appendChild(el);
  setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),250);},type==='error'?6000:3200);
}
function confirmDialog(title,message,okLabel='Hapus') {
  return new Promise(resolve=>{
    const d=$('confirmDlg');
    if(!d||!d.showModal) return resolve(confirm(title+'\n\n'+message));
    d.innerHTML='<form method="dialog" class="confirm-box"><div class="confirm-ico" aria-hidden="true">!</div><h2></h2><p></p>'+
      '<div class="confirm-actions"><button value="cancel" class="secondary">Batal</button><button value="ok" class="danger-solid"></button></div></form>';
    d.querySelector('h2').textContent=title;
    d.querySelector('p').textContent=message;
    d.querySelector('.danger-solid').textContent=okLabel;
    d.onclose=()=>resolve(d.returnValue==='ok');
    d.returnValue='cancel';
    d.showModal();
  });
}
const emptyIcon='<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5z"/><path d="M4 7.5 12 11l8-3.5M12 11v9"/></svg>';
const emptyState=(title,text='')=>'<div class="empty-state"><span class="empty-ico">'+emptyIcon+'</span><strong>'+title+'</strong>'+(text?'<p>'+text+'</p>':'')+'</div>';
const skeletonRows=(n=4)=>'<div class="skeleton-list" aria-busy="true" aria-label="Memuat data">'+Array.from({length:n},()=>'<div class="sk-row"><i class="sk sk-w40"></i><i class="sk sk-w20"></i><i class="sk sk-w100"></i></div>').join('')+'</div>';
const friendlyError='Data belum dapat dimuat. Periksa koneksi internet Anda, lalu muat ulang halaman.';
let phExpanded={Perhimpunan:false,Pendistribusian:false};

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
const items = [['Dashboard'],['Profil'],['UPZ DESA'],['UPZ KEC'],['Surat'],['Pemasukan'],['Pengeluaran'],['BKU'],['Cetak Laporan'],['Login']];
const bkuGroup = ['BKU','Pemasukan','Pengeluaran','Cetak Laporan'];
let bkuOpen = false;
const rekapGroup = ['Form C2A','Form C2B'];
let rekapOpen = false;
const suratGroup = ['Daftar Surat','Surat Undangan','Surat Permohonan','Surat Pemberitahuan','Surat Keterangan','Surat Tugas','Surat Rekomendasi','Berita Acara'];
let suratOpen = false;
const upzkecGroup = ['Perhimpunan','Pendistribusian','Form C2A','Form C2B'];
let upzkecOpen = false;
ICON['Form C2A'] = ICON['Form C2B'] = ICON['Rekap Laporan'];
ICON['UPZ KEC'] = '<path d="M4 5.5h16v13H4z"/><path d="M8 9h8M8 12.5h8M8 16h4"/>';
ICON['UPZ DESA'] = ICON['Data UPZ Desa'] = '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M9 19.5v-5h6v5"/>';
ICON['Perhimpunan Desa'] = ICON.Perhimpunan;

/* ===== Mode HP: menu induk membuka halaman daftar submenu ===== */
Object.assign(ICON,{
  'Daftar Surat':'<path d="M8 6.5h11M8 12h11M8 17.5h11"/><path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>',
  'Surat Undangan':'<path d="m4 10 8-5.5 8 5.5v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="m4 10 8 5.5 8-5.5"/>',
  'Surat Permohonan':'<path d="M6 3.5h9l3.5 3.5v13.5H6z"/><path d="M14.5 3.5V7h4M9 12h6.5M9 15.5h6.5"/>',
  'Surat Pemberitahuan':'<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5h4"/>',
  'Surat Keterangan':'<rect x="3.5" y="5" width="17" height="11" rx="1.5"/><path d="M8 9h8M8 12h4M9 16v4l3-1.5 3 1.5v-4"/>',
  'Surat Tugas':'<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5v-2h6v2M3.5 13h17"/>',
  'Surat Rekomendasi':'<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/>',
  'Berita Acara':'<rect x="5.5" y="4.5" width="13" height="16" rx="2"/><path d="M9.5 4.5h5v2h-5zM9 11h6M9 14.5h6"/>'
});
/* item: [halaman, label, deskripsi singkat, kunci ikon] */
function menuLists() {
  return {
    surat:{title:'Surat',desc:'Ketik dan kelola surat UPZ.',group:suratGroup,first:'Daftar Surat',items:[
      ['Daftar Surat','Daftar Surat','Ringkasan semua surat','Daftar Surat'],
      ['Surat Undangan','Surat Undangan','Undangan rapat dan acara','Surat Undangan'],
      ['Surat Permohonan','Surat Permohonan','Permohonan resmi','Surat Permohonan'],
      ['Surat Pemberitahuan','Surat Pemberitahuan','Pemberitahuan kegiatan','Surat Pemberitahuan'],
      ['Surat Keterangan','Surat Keterangan','Keterangan resmi','Surat Keterangan'],
      ['Surat Tugas','Surat Tugas','Penugasan pengurus','Surat Tugas'],
      ['Surat Rekomendasi','Surat Rekomendasi','Rekomendasi penerima','Surat Rekomendasi'],
      ['Berita Acara','Berita Acara','Berita acara kegiatan','Berita Acara']]},
    bku:{title:'BKU',desc:'Buku Kas Umum UPZ.',group:bkuGroup,first:'BKU',items:[
      ['BKU','Ringkasan','Saldo dan rincian kas per bulan','BKU'],
      ['Pemasukan','Pemasukan','Catatan uang masuk','Pemasukan'],
      ['Pengeluaran','Pengeluaran','Catatan uang keluar','Pengeluaran'],
      ['Cetak Laporan','Cetak Laporan','Laporan siap cetak','Cetak Laporan']]},
    ud:{title:'UPZ DESA',desc:'Data dan laporan UPZ tingkat desa dan kelurahan.',group:udGroup,first:'Data UPZ Desa',items:[
      ['Data UPZ Desa','Data UPZ Desa','Identitas UPZ desa dan kelurahan','Data UPZ Desa'],
      ['Perhimpunan Desa','Perhimpunan','Dana zakat yang dikumpulkan','Perhimpunan Desa'],
      ['Pendistribusian Desa','Pendistribusian','Dana zakat yang disalurkan','Pendistribusian Desa'],
      ['Rekap Laporan Desa','Rekap Laporan','Rekap laporan per desa','Rekap Laporan Desa']]},
    upzkec:{title:'UPZ KEC',desc:'Data dan laporan UPZ tingkat kecamatan.',group:upzkecGroup,first:'Perhimpunan',items:[
      ['Perhimpunan','Perhimpunan','Dana zakat yang dikumpulkan','Perhimpunan'],
      ['Pendistribusian','Pendistribusian','Dana zakat yang disalurkan','Pendistribusian'],
      ['Form C2A','Rekap Laporan','Form C2A dan C2B','Rekap Laporan']]}
  };
}
function menuKeyOf(name) {
  const m = menuLists();
  return Object.keys(m).find(k=>m[k].group.includes(name)) || '';
}
function menuListPage(key) {
  const m = menuLists()[key];
  if(!m) return '<section class="panel"><p class="muted">Menu tidak ditemukan.</p></section>';
  return '<section class="menu-list-page"><h1>'+esc(m.title)+'</h1><p class="muted">'+esc(m.desc)+'</p><div class="menu-list">'+
    m.items.map(([page,label,desc,icon])=>'<button type="button" class="menu-row" data-goto="'+esc(page)+'"><span class="menu-ic" aria-hidden="true">'+svgIcon(icon)+'</span><span class="menu-tx"><b>'+esc(label)+'</b><small>'+esc(desc)+'</small></span><span class="menu-ch" aria-hidden="true"></span></button>').join('')+
    '</div></section>';
}
function menuBack(name) {
  const key = menuKeyOf(name);
  if(!key) return '';
  return '<button type="button" class="menu-back no-print" data-goto="Menu:'+key+'" aria-label="Kembali ke daftar menu '+esc(menuLists()[key].title)+'">'+esc(menuLists()[key].title)+'</button>';
}
ICON['Pendistribusian Desa'] = ICON.Pendistribusian;
ICON['Rekap Laporan Desa'] = ICON['Rekap Laporan'];
ICON.Surat = '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7.5 8 6 8-6"/>';

/* ---------- Perhimpunan (pengumpulan per UPZ desa/kelurahan) ---------- */
let phCamat = '', phReportDate = '';
const phNewState = () => ({rows:[],year:'',loading:false,failure:'',generation:0,source:'upzdesa'});
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
    console.error(error);
    failure = friendlyError;
  } finally {
    if(stamp===generation) {loading=false;render();}
  }
}

function go(name) {
  if(name==='Surat') name='Daftar Surat';
  if(String(name).startsWith('Menu:')) window.scrollTo(0,0);
  screen=name;
  loadPrivateContacts();
  if(bkuGroup.includes(name)) bkuOpen=true;
  if(rekapGroup.includes(name)) rekapOpen=true;
  if(upzkecGroup.includes(name)) upzkecOpen=true;
  if(udGroup.includes(name)) udOpen=true;
  if(suratGroup.includes(name)) suratOpen=true;
  if(suratGroup.includes(name)) {loadProfile();loadSurat();}
  else if(name==='Profil'||name==='Cetak Laporan') loadProfile();
  else if(PH_KINDS[name]) loadPh(name);
  else if(udGroup.includes(name)) loadUd();
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
function monthTrend(data,key) {
  const by=new Map();
  for(const r of data) {const m=String(r.bulan).slice(0,7); by.set(m,(by.get(m)||0)+Number(r[key]||0));}
  const ms=[...by.keys()].sort();
  if(!ms.length) return '';
  const cur=by.get(ms.at(-1)), prev=ms.length>1?by.get(ms.at(-2)):0;
  const label=new Intl.DateTimeFormat('id-ID',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(ms.at(-1)+'-01T00:00:00Z'));
  let delta='';
  if(prev>0) {const pct=Math.round((cur-prev)/prev*100); delta=' <em class="delta '+(pct>=0?'up':'down')+'">'+(pct>=0?'▲':'▼')+' '+Math.abs(pct)+'%</em> dari bulan lalu';}
  return '<span class="card-sub">'+label+': '+money(cur)+delta+'</span>';
}
function cards(data, labels=['Total Pemasukan','Total Pengeluaran','Selisih Periode'], trend=false) {
  const values = totals(data);
  return '<div class="cards">'+labels.map((label,i)=>
    '<div class="card '+['in','out','net'][i]+'"><div class="symbol" aria-hidden="true">'+svgIcon(['Pemasukan','Pengeluaran','BKU'][i])+'</div><small>'+label+'</small><strong'+(loading?' class="sk-text"':'')+'>'+money(loading||failure?null:values[i])+'</strong>'+(trend&&!loading&&!failure?(i<2?monthTrend(data,['debet','kredit'][i]):'<span class="card-sub">Pemasukan dikurangi pengeluaran</span>'):'')+'</div>').join('')+'</div>';
}
function makeTable(headers, content, cls='') {
  return '<div class="scroll"><table'+(cls?' class="'+cls+'"':'')+'><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+
    (content || '<tr><td class="empty" colspan="'+headers.length+'">'+(loading?skeletonRows(4):failure?emptyState('Data belum tersedia','Silakan coba lagi beberapa saat.'):emptyState('Belum ada transaksi','Tidak ada transaksi pada periode ini.'))+'</td></tr>')+'</tbody></table></div>';
}
function ledger(list, actions, numbered=false) {
  const columns = ['No Kwitansi','Penerima','Tanggal','Kriteria','Uraian','Debet','Kredit','Saldo'];
  if(numbered) columns.unshift('No.');
  if(actions) columns.push('Tindakan');
  let sequence=0;
  const lab=i=>' data-label="'+columns[i]+'"';
  const badge=v=>{const t=String(v??'');const k=/zakat/i.test(t)?'zakat':/infak|infaq|sedekah/i.test(t)?'infak':/salur|distribusi/i.test(t)?'salur':/operasional/i.test(t)?'ops':'lain';return t?'<span class="badge b-'+k+'">'+esc(t)+'</span>':'—';};
  const amt=(v,cls)=>Number(v)>0?'<td class="money '+cls+'">'+money(v)+'</td>':'<td class="money zero">—</td>';
  return makeTable(columns,list.map(r=>{
    let i=numbered?1:0;
    return '<tr>'+
    (numbered?'<td class="report-sequence">'+(r.id == null?'—':++sequence)+'</td>':'')+
    '<td'+lab(i++)+'>'+esc(r.no_kwitansi)+'</td><td'+lab(i++)+'>'+esc(r.penerima)+'</td><td'+lab(i++)+'>'+esc(r.tanggal)+'</td>'+
    '<td'+lab(i++)+'>'+(actions?badge(r.kriteria):esc(r.kriteria))+'</td><td'+lab(i++)+'>'+esc(r.uraian)+'</td>'+
    (actions?amt(r.debet,'in').replace('<td','<td'+lab(i++)):'<td class="money">'+money(r.debet)+'</td>')+
    (actions?amt(r.kredit,'out').replace('<td','<td'+lab(i++)):'<td class="money">'+money(r.kredit)+'</td>')+
    '<td class="money"'+(actions?lab(i++):'')+'>'+money(r.saldo)+'</td>'+
    (actions?'<td class="receipt-actions"><button class="secondary" data-edit="'+esc(r.id)+'">Edit</button> '+
      '<button class="secondary" data-receipt="'+esc(r.id)+'">Unduh Kwitansi PDF</button>'+
      (screen==='Pemasukan'||screen==='Pengeluaran'?' <button class="danger" data-delete="'+esc(r.id)+'">Hapus</button>':'')+'</td>':'')+'</tr>';
  }).join(''),actions?'ledger-table':'');
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

function annualDashboard(compact=false) {
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
    (compact?'':'<div class="annual-stats"><div><span>Total pemasukan</span><strong>'+money(loading||failure?null:income)+'</strong></div>'+
    '<div><span>Total pengeluaran</span><strong>'+money(loading||failure?null:expense)+'</strong></div>'+
    '<div><span>Saldo bersih</span><strong>'+money(loading||failure?null:income-expense)+'</strong></div></div>')+
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
  const list=S.rows.filter(r=>String(r.tahun)===year).sort((x,y)=>phJumlah(y)-phJumlah(x)||String(x.nama_upz).localeCompare(String(y.nama_upz),'id'));
  const total=list.reduce((sum,r)=>sum+phJumlah(r),0);
  const jiwa=list.reduce((sum,r)=>sum+Number(r.jumlah_jiwa||0),0);
  const beras=list.reduce((sum,r)=>sum+Number(r.beras_kg||0),0);
  const peak=Math.max(1,...list.map(phJumlah));
  const clean=v=>{const t=String(v??'').trim();return /^[.\-–—_\s]*$/.test(t)?'':t;};
  const head='<div class="dash-ph-head"><span class="symbol" aria-hidden="true">'+svgIcon(kind)+'</span><div><h2>Kartu '+kind+'</h2><p class="muted">'+(kind==='Perhimpunan'?'Dana zakat yang dikumpulkan':'Dana zakat yang disalurkan')+' · Tahun '+esc(year)+'</p></div><button type="button" class="secondary dash-ph-link" data-goto="'+kind+'">Kelola</button></div>';
  let body;
  if(S.loading) body=skeletonRows(5);
  else if(S.failure) body=emptyState('Data '+kind.toLowerCase()+' gagal dimuat','Periksa koneksi internet Anda.');
  else if(!list.length) body=emptyState('Belum ada data '+kind.toLowerCase(),'Belum ada data untuk tahun '+esc(year)+'.');
  else body='<div class="dash-ph-total"><small>Total '+(kind==='Perhimpunan'?'pengumpulan':'pendistribusian')+'</small><strong>'+money(total)+'</strong>'+
    '<span>'+angka.format(jiwa)+' jiwa · '+angka.format(beras)+' kg beras · '+list.length+' UPZ desa/kelurahan</span></div>'+
    '<h3 class="dash-ph-sub">Rincian per desa/kelurahan</h3><ul class="dash-desa-list">'+(phExpanded[kind]?list:list.slice(0,3)).map((r,idx)=>{
      const rt=clean(r.rt), rw=clean(r.rw);
      const place=[clean(r.alamat_kp),(rt||rw)?'RT '+(rt||'-')+'/RW '+(rw||'-'):''].filter(Boolean).join(' · ');
      const chips=PH_COMPONENTS.filter(([key])=>Number(r[key]||0)>0).map(([key,label])=>'<div><dt>'+label+'</dt><dd>'+money(Number(r[key]))+'</dd></div>').join('');
      return '<li class="dash-desa"><div class="dash-desa-top"><span class="dash-rank">'+(idx+1)+'</span><div><strong>'+esc(r.nama_upz)+'</strong><small>'+esc(place)+(place?' · ':'')+angka.format(Number(r.jumlah_jiwa||0))+' jiwa'+(Number(r.beras_kg||0)>0?' · '+angka.format(Number(r.beras_kg))+' kg beras':'')+'</small></div><b>'+money(phJumlah(r))+'</b></div>'+
        '<div class="dash-bar-row"><div class="dash-bar"><i style="width:'+Math.max(phJumlah(r)?3:0,phJumlah(r)/peak*100)+'%"></i></div><span class="dash-pct">'+(total?Math.round(phJumlah(r)/total*100):0)+'%</span></div>'+(chips?'<dl class="dash-chips">'+chips+'</dl>':'')+'</li>';
    }).join('')+'</ul>'+(list.length>3?'<button type="button" class="secondary dash-more" data-more="'+kind+'">'+(phExpanded[kind]?'Tampilkan lebih sedikit':'Lihat semua ('+list.length+' desa/kelurahan)')+'</button>':'');
  return '<article class="panel dash-ph-card '+tone+'">'+head+body+'</article>';
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
function parseVisiMisi(raw) {
  const clean = v => String(v||'').replace(/^\s*(?:\d+\s*[.)]|[-•*])\s*/,'').replace(/^[\s"“”'‘’]+|[\s"“”'‘’]+$/g,'').trim();
  const lines = String(raw||'').replace(/\r/g,'').split('\n').map(v=>v.trim()).filter(Boolean);
  const out = {visi:[],misi:[]};
  let current = '', headed = false;
  for(const line of lines) {
    const m = line.match(/^(?:["“]?)(visi|misi)(?:["”]?)\s*(?:[:：]\s*(.*))?$/i);
    if(m) {
      headed = true; current = m[1].toLowerCase();
      const rest = clean(m[2]); if(rest) out[current].push(rest);
      continue;
    }
    const item = clean(line);
    if(item) out[current||'visi'].push(item);
  }
  if(!headed && out.visi.length>1) { out.misi = out.visi.slice(1); out.visi = out.visi.slice(0,1); }
  return out;
}
function dashboardVisiInfo() {
  const info = profile?.identitas || {};
  const nama = info.nama || 'UPZ Kecamatan Cipeundeuy';
  const wilayah = info.wilayah || 'Kecamatan Cipeundeuy, Kabupaten Subang';
  const alamat = info.alamat || 'Alamat belum diatur pada menu Profil';
  const ketua = profileOfficer('ketua') || 'Belum diatur';
  const periode = info.periode || 'Belum diatur';
  const parsed = parseVisiMisi(info.misi);
  const visi = parsed.visi.join(' ') || 'Mewujudkan UPZ yang profesional, amanah dan terpercaya dalam pengelolaan zakat, infak dan sedekah untuk kesejahteraan umat.';
  const missions = parsed.misi.length ? parsed.misi : ['Mengoptimalkan penghimpunan zakat, infak dan sedekah.','Menyalurkan dana secara tepat sasaran dan amanah.','Meningkatkan pelayanan kepada masyarakat.','Membangun sinergi dengan berbagai pihak.'];
  const row = (label,value) => '<div><dt>'+label+'</dt><dd>'+esc(value)+'</dd></div>';
  return '<section class="dash-vision-info" aria-label="Visi, misi, dan info UPZ">'+
    '<div class="dash-vision">'+
      '<article class="dash-vi-card dash-visi"><h2 class="dash-vi-title"><span aria-hidden="true">◎</span> Visi</h2><p class="dash-vision-text">'+esc(visi)+'</p></article>'+
      '<article class="dash-vi-card dash-misi"><h2 class="dash-vi-title"><span aria-hidden="true">✦</span> Misi</h2><ol>'+missions.map((m,i)=>'<li><span aria-hidden="true">'+(i+1)+'</span><p>'+esc(m)+'</p></li>').join('')+'</ol></article>'+
    '</div>'+
    '<div class="dash-info"><div class="dash-info-card"><div class="dash-info-head"><img src="logo-baznas.png" alt="" width="48" height="48"><div><small>Info UPZ</small><h2>'+esc(nama)+'</h2></div></div>'+
      '<dl>'+row('Wilayah',wilayah)+row('Alamat',alamat)+row('Ketua',ketua)+row('Periode',periode)+'</dl></div></div></section>';
}

/* ---------- Dashboard (tampilan profesional) ---------- */
Object.assign(ICON,{
  Rasio:'<path d="M4 19 19 4"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
  Selisih:'<path d="M4 8h13M13.5 4.5 17 8l-3.5 3.5"/><path d="M20 16H7M10.5 12.5 7 16l3.5 3.5"/>',
  Kalender:'<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/>',
  Panah:'<path d="M5 12h14M13 6l6 6-6 6"/>'
});
function dashboardPage() {
  const P=phState.Perhimpunan, D=phState.Pendistribusian;
  const now=today().slice(0,4);
  const years=[...new Set([...P.rows.map(r=>String(r.tahun)),...D.rows.map(r=>String(r.tahun)),now])].sort().reverse();
  const year=years.includes(P.year)?P.year:(P.rows.length?String(P.rows[0].tahun):now);
  P.year=D.year=year;
  const busy=P.loading||D.loading, bad=!!(P.failure||D.failure);
  const pl=P.rows.filter(r=>String(r.tahun)===year), dl=D.rows.filter(r=>String(r.tahun)===year);
  const sum=(l,f)=>l.reduce((t,r)=>t+f(r),0);
  const pTot=sum(pl,phJumlah), dTot=sum(dl,phJumlah);
  const pJiwa=sum(pl,r=>Number(r.jumlah_jiwa||0)), dJiwa=sum(dl,r=>Number(r.jumlah_jiwa||0));
  const ratio=pTot?Math.min(100,dTot/pTot*100):0;
  const val=v=>busy?'<i class="sk db-sk"></i>':bad?'—':v;
  const updated=new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric'}).format(new Date());

  const kpi=(cls,icon,label,value,note,extra='')=>'<article class="db-kpi '+cls+'"><span class="db-kpi-ico" aria-hidden="true">'+svgIcon(icon)+'</span>'+
    '<div class="db-kpi-body"><span class="db-kpi-label">'+label+'</span><strong class="db-kpi-val">'+value+'</strong><small>'+note+'</small>'+extra+'</div></article>';
  const kpis='<section class="db-kpis" aria-label="Ringkasan utama">'+
    kpi('in','Perhimpunan','Total Pengumpulan',val(money(pTot)),val(angka.format(pJiwa)+' jiwa muzaki · '+pl.length+' UPZ'))+
    kpi('out','Pendistribusian','Total Pendistribusian',val(money(dTot)),val(angka.format(dJiwa)+' jiwa mustahik · '+dl.length+' UPZ'))+
    kpi('net','Selisih','Selisih Dana',val(money(pTot-dTot)),'Pengumpulan dikurangi pendistribusian')+
    kpi('rate','Rasio','Rasio Penyaluran',val(angka.format(Math.round(ratio*10)/10)+'%'),'Pendistribusian terhadap pengumpulan',
      '<div class="db-meter" role="img" aria-label="Rasio penyaluran '+Math.round(ratio)+' persen"><i style="width:'+(busy||bad?0:ratio)+'%"></i></div>')+
    '</section>';

  /* Komposisi per jenis dana */
  const peak=Math.max(1,...PH_COMPONENTS.flatMap(([k])=>[sum(pl,r=>Number(r[k]||0)),sum(dl,r=>Number(r[k]||0))]));
  const compRows=PH_COMPONENTS.map(([k,label])=>{
    const a=sum(pl,r=>Number(r[k]||0)), b=sum(dl,r=>Number(r[k]||0));
    return '<li class="db-comp"><span class="db-comp-name">'+label+'</span><div class="db-comp-bars">'+
      '<div class="db-comp-line"><span class="db-track"><i class="in" style="width:'+(a/peak*100)+'%"></i></span><b>'+money(a)+'</b></div>'+
      '<div class="db-comp-line"><span class="db-track"><i class="out" style="width:'+(b/peak*100)+'%"></i></span><b>'+money(b)+'</b></div></div></li>';
  }).join('');
  const berasP=sum(pl,r=>Number(r.beras_kg||0)), berasD=sum(dl,r=>Number(r.beras_kg||0));
  let compBody;
  if(busy) compBody=skeletonRows(4);
  else if(bad) compBody=emptyState('Data gagal dimuat','Periksa koneksi internet Anda.');
  else if(!pl.length&&!dl.length) compBody=emptyState('Belum ada data tahun '+esc(year),'Data muncul setelah Perhimpunan atau Pendistribusian diisi.');
  else compBody='<ul class="db-comp-list">'+compRows+'</ul><p class="db-foot">Beras (tidak termasuk dalam jumlah Rp): '+angka.format(berasP)+' kg dikumpulkan · '+angka.format(berasD)+' kg disalurkan</p>';
  const composition='<section class="db-panel"><div class="db-panel-head"><div><h2>Komposisi per Jenis Dana</h2><p>Perbandingan pengumpulan dan pendistribusian · Tahun '+esc(year)+'</p></div>'+
    '<div class="db-legend"><span><i class="in"></i>Pengumpulan</span><span><i class="out"></i>Pendistribusian</span></div></div>'+compBody+'</section>';

  /* Tabel peringkat desa */
  const clean=v=>{const t=String(v??'').trim();return /^[.\-–—_\s]*$/.test(t)?'':t;};
  const LIMIT=5;
  const rankTable=(kind,list)=>{
    const tone=kind==='Perhimpunan'?'in':'out';
    const sorted=[...list].sort((x,y)=>phJumlah(y)-phJumlah(x)||String(x.nama_upz).localeCompare(String(y.nama_upz),'id'));
    const total=sum(sorted,phJumlah), top=Math.max(1,...sorted.map(phJumlah));
    const shown=phExpanded[kind]?sorted:sorted.slice(0,LIMIT);
    const S=phState[kind];
    let body;
    if(S.loading) body=skeletonRows(4);
    else if(S.failure) body=emptyState('Data '+kind.toLowerCase()+' gagal dimuat','Periksa koneksi internet Anda.');
    else if(!sorted.length) body=emptyState('Belum ada data '+kind.toLowerCase(),'Belum ada data untuk tahun '+esc(year)+'.');
    else body='<div class="db-table-wrap"><table class="db-table"><thead><tr><th class="c-rank">#</th><th>UPZ Desa/Kelurahan</th><th class="c-jiwa num">Jiwa</th><th class="num">Jumlah</th><th class="c-share">Porsi</th></tr></thead><tbody>'+
      shown.map((r,i)=>{
        const rt=clean(r.rt), rw=clean(r.rw);
        const place=[clean(r.alamat_kp),(rt||rw)?'RT '+(rt||'-')+'/RW '+(rw||'-'):''].filter(Boolean).join(' · ');
        const pct=total?Math.round(phJumlah(r)/total*100):0;
        return '<tr><td class="c-rank"><span class="db-rank '+tone+'">'+(i+1)+'</span></td><td><strong>'+esc(r.nama_upz)+'</strong>'+(place?'<small>'+esc(place)+'</small>':'')+'</td>'+
          '<td class="c-jiwa num">'+angka.format(Number(r.jumlah_jiwa||0))+'</td><td class="num"><b>'+money(phJumlah(r))+'</b></td>'+
          '<td class="c-share"><span class="db-share"><span class="db-track"><i class="'+tone+'" style="width:'+(phJumlah(r)/top*100)+'%"></i></span><em>'+pct+'%</em></span></td></tr>';
      }).join('')+'</tbody><tfoot><tr><td></td><td>Total ('+sorted.length+' UPZ)</td><td class="c-jiwa num">'+angka.format(sum(sorted,r=>Number(r.jumlah_jiwa||0)))+'</td><td class="num">'+money(total)+'</td><td class="c-share"></td></tr></tfoot></table></div>'+
      (sorted.length>LIMIT?'<button type="button" class="db-more" data-more="'+kind+'">'+(phExpanded[kind]?'Tampilkan lebih sedikit':'Lihat semua ('+sorted.length+' desa/kelurahan)')+'</button>':'');
    return '<section class="db-panel"><div class="db-panel-head"><div><h2><span class="db-dot '+tone+'"></span>'+kind+'</h2><p>'+(kind==='Perhimpunan'?'Peringkat pengumpulan':'Peringkat pendistribusian')+' per UPZ desa/kelurahan</p></div>'+
      '<button type="button" class="db-link" data-goto="'+kind+'">Kelola '+svgIcon('Panah')+'</button></div>'+body+'</section>';
  };

  /* Panel samping */
  const info=profile?.identitas||{};
  const nama=info.nama||'UPZ Kecamatan Cipeundeuy';
  const parsed=profileVisiMisi(info);
  const visi=parsed.visi||'Mewujudkan UPZ yang profesional, amanah dan terpercaya dalam pengelolaan zakat, infak dan sedekah untuk kesejahteraan umat.';
  const missions=parsed.misi.length?parsed.misi:['Mengoptimalkan penghimpunan zakat, infak dan sedekah.','Menyalurkan dana secara tepat sasaran dan amanah.','Meningkatkan pelayanan kepada masyarakat.','Membangun sinergi dengan berbagai pihak.'];
  const dl2=(label,value)=>'<div><dt>'+label+'</dt><dd>'+esc(value)+'</dd></div>';
  const side='<div class="db-side">'+
    '<section class="db-panel db-info"><div class="db-info-head"><img src="logo-baznas.png" alt="" width="48" height="48"><div><small>Profil Lembaga</small><h2>'+esc(nama)+'</h2></div></div>'+
      '<dl>'+dl2('Wilayah',info.wilayah||'Kecamatan Cipeundeuy, Kabupaten Subang')+dl2('Alamat',info.alamat||'Alamat belum diatur pada menu Profil')+dl2('Ketua',profileOfficer('ketua')||'Belum diatur')+dl2('Periode',info.periode||'Belum diatur')+'</dl></section>'+
    '<section class="db-panel db-vm"><h3><span aria-hidden="true">'+svgIcon('Profil')+'</span>Visi</h3><p class="db-visi">'+esc(visi)+'</p>'+
      '<h3><span aria-hidden="true">'+svgIcon('Rekap Laporan')+'</span>Misi</h3><ol>'+missions.map((m,i)=>'<li><span aria-hidden="true">'+(i+1)+'</span><p>'+esc(m)+'</p></li>').join('')+'</ol></section>'+
    '<section class="db-panel db-quick"><h3>Akses Cepat</h3>'+
      [['Perhimpunan','Perhimpunan'],['Pendistribusian','Pendistribusian'],['BKU','Buku Kas Umum'],['Cetak Laporan','Cetak Laporan']].map(([pg,l])=>'<button type="button" data-goto="'+pg+'"><span aria-hidden="true">'+svgIcon(pg)+'</span>'+l+svgIcon('Panah')+'</button>').join('')+'</section>'+
    '</div>';

  return '<div class="db">'+
    '<div class="db-head"><div><p class="db-eyebrow">Ringkasan</p><h1>Dashboard</h1><p class="db-sub">Pengumpulan dan pendistribusian ZIS · '+esc(nama)+'</p></div>'+
    '<div class="db-tools"><span class="db-updated">'+svgIcon('Kalender')+'Diperbarui '+updated+'</span>'+
    '<label class="db-year">Tahun<select id="dashPhYear">'+years.map(y=>'<option value="'+y+'" '+(y===year?'selected':'')+'>'+y+'</option>').join('')+'</select></label></div></div>'+
    kpis+'<div class="db-grid"><div class="db-main">'+composition+rankTable('Perhimpunan',pl)+rankTable('Pendistribusian',dl)+'</div>'+side+'</div></div>';
}
function heroExtras() {
  const updated=new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric'}).format(new Date());
  return '<div class="hero-actions"><button type="button" data-goto="Pemasukan">Lihat Pemasukan</button><button type="button" data-goto="Pengeluaran">Lihat Pengeluaran</button><button type="button" data-goto="Cetak Laporan">Cetak Laporan</button></div>'+
    '<p class="hero-updated">Diperbarui: '+updated+'</p>'+
    '<div class="hero-quote" aria-hidden="true"><span>“</span><p>Ambillah zakat dari sebagian harta mereka, guna membersihkan dan menyucikan mereka.</p><small>QS. At-Taubah: 103</small></div>';
}

async function loadPh(kind=screen) {
  const S=phState[kind], K=PH_KINDS[kind];
  const stamp = ++S.generation;
  S.loading = true;
  S.failure = '';
  S.source = 'upzdesa';
  render();
  try {
    if(simulated) {
      const source = kind==='Perhimpunan' ? UD_DEMO.ph : UD_DEMO.pd;
      const grouped = new Map();
      for(const r of source) {
        const d=UD_DEMO.desa.find(x=>String(x.id)===String(r.upz_desa_id));
        const key=String(r.upz_desa_id)+'|'+String(r.tahun);
        if(!grouped.has(key)) grouped.set(key,{id:'upzdesa-'+key,upz_desa_id:r.upz_desa_id,tahun:Number(r.tahun),nama_upz:d?.nama_desa||r.nama_upz,alamat_kp:d?.kecamatan||'',rt:'',rw:'',jumlah_jiwa:0,zakat_fitrah:0,beras_kg:0,bis_ramadhan:0,zakat_mal:0,infak_umum:0,fidyah:0,jumlah_transaksi:0});
        const target=grouped.get(key);
        for(const field of PH_SUM) target[field]+=Number(r[field]||0);
        target.jumlah_transaksi++;
      }
      S.rows=[...grouped.values()];
    } else {
      // Menu Perhimpunan/Pendistribusian adalah rekap otomatis dari seluruh data UPZ Desa.
      const token = session?.access_token;
      const table = kind==='Perhimpunan' ? 'upz_desa_perhimpunan' : 'upz_desa_pendistribusian';
      const [desa, transaksi] = await Promise.all([
        api('/rest/v1/upz_desa?select=id,nama_desa,kecamatan,kabupaten&order=nama_desa.asc&limit=1000',{token}),
        api('/rest/v1/'+table+'?select=*&order=tahun.desc,id.asc&limit=5000',{token})
      ]);
      if(stamp!==S.generation) return;
      const desaMap = new Map((desa||[]).map(d=>[String(d.id),d]));
      const grouped = new Map();
      for(const r of (transaksi||[])) {
        const d = desaMap.get(String(r.upz_desa_id));
        if(!d) continue;
        const key = String(r.upz_desa_id)+'|'+String(r.tahun);
        if(!grouped.has(key)) grouped.set(key,{id:'upzdesa-'+key,upz_desa_id:r.upz_desa_id,tahun:Number(r.tahun),nama_upz:d.nama_desa,alamat_kp:d.kecamatan||'',rt:'',rw:'',jumlah_jiwa:0,zakat_fitrah:0,beras_kg:0,bis_ramadhan:0,zakat_mal:0,infak_umum:0,fidyah:0,jumlah_transaksi:0});
        const target=grouped.get(key);
        for(const field of PH_SUM) target[field]+=Number(r[field]||0);
        target.jumlah_transaksi++;
      }
      S.rows=[...grouped.values()].sort((a,b)=>b.tahun-a.tahun||a.nama_upz.localeCompare(b.nama_upz,'id'));
    }
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
    '<div class="phf-sign"><div class="phf-left">Mengetahui,<br>Camat Cipeundeuy<div class="phf-name" id="phCamatPrint">'+esc(camatName())+'</div></div>'+
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
  const canEdit = admin() && S.source !== 'upzdesa';
  const sql = new RegExp(K.empty+'|schema cache','i').test(S.failure) ? ' Pastikan tabel UPZ Desa sudah dibuat di Supabase SQL Editor.' : '';
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
  if(S.loading) content = skeletonRows(6);
  else if(S.failure) content = '<p class="empty" role="alert">Data '+K.empty+' gagal dimuat. '+esc(S.failure)+sql+'</p>';
  else if(!list.length) content = emptyState('Belum ada data '+K.empty,'Belum ada data untuk tahun '+esc(year)+'.'+(canEdit?' Klik “Tambah UPZ desa” untuk mengisi.':''));
  else content = table+cards;
  const printForm = !S.loading&&!S.failure ? phPrintForm(kind,list,year,total,grand) : '';
  return '<section class="panel ph-panel">'+kecTabs()+'<div class="ph-heading"><p class="crumb">'+kind+'</p><h1>'+K.heading+'</h1><p class="muted">'+K.sub+' · Tahun '+esc(year)+'</p></div>'+
    '<div class="toolbar no-print"><label class="ph-year">Tahun <select id="phYear">'+years.map(y=>'<option value="'+esc(y)+'" '+(y===year?'selected':'')+'>'+esc(y)+'</option>').join('')+'</select></label>'+
    '<label class="ph-year">Nama Camat <input id="phCamat" maxlength="100" placeholder="Isi sebelum cetak" value="'+esc(phCamat||profileOfficer('camat'))+'"></label>'+
    '<label class="ph-year">Tanggal laporan <input id="phReportDate" type="date" max="9999-12-31" value="'+esc(phReportDate||today())+'"></label>'+
    '<span class="ph-tools"><button type="button" class="secondary" id="phPrint">Cetak Form '+K.form+'</button>'+(canEdit?'<button type="button" id="phAdd">Tambah UPZ desa</button>':'<span class="muted">Data otomatis dari menu UPZ Desa</span>')+'</span></div>'+content+printForm+'</section>';
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
    toast('Data berhasil disimpan.');
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
  if(!await confirmDialog('Hapus data '+record.nama_upz+'?','Data tahun '+record.tahun+' akan dihapus dan tidak dapat dikembalikan.')) return;
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
    toast('Data berhasil dihapus.');
  } catch(error) {toast('Data gagal dihapus. '+error.message,'error');}
}

function kecTabs() {
  const cur=rekapGroup.includes(screen)?'Form C2A':screen;
  return '<div class="bku-tabs menu-tabs no-print" role="tablist">'+[['Perhimpunan','Perhimpunan'],['Pendistribusian','Pendistribusian'],['Form C2A','Rekap Laporan']].map(([page,label])=>
    '<button type="button" role="tab" data-goto="'+page+'" aria-selected="'+(cur===page)+'" class="'+(cur===page?'on':'')+'">'+label+'</button>').join('')+'</div>';
}

function bkuTabs() {
  return '<div class="bku-tabs menu-tabs no-print" role="tablist">'+[['BKU','Ringkasan'],['Pemasukan','Pemasukan'],['Pengeluaran','Pengeluaran'],['Cetak Laporan','Cetak']].map(([page,label])=>
    '<button type="button" role="tab" data-goto="'+page+'" aria-selected="'+(screen===page)+'" class="'+(screen===page?'on':'')+'">'+label+'</button>').join('')+'</div>';
}

function render() {
  $('role').textContent = simulated?'Admin · Demo':admin()?'Administrator':'Akses Umum';
  $('status').hidden = !failure&&!simulated;
  $('status').textContent = failure || (simulated?'Mode demo · Seluruh perubahan hanya berlaku selama halaman ini terbuka.':'');
  const navButton = (name,label,iconName,extra='')=>'<button type="button" data-page="'+name+'" class="'+(screen===name?'active':'')+extra+'" '+(screen===name?'aria-current="page"':'')+'><span class="nav-icon" aria-hidden="true">'+svgIcon(iconName)+'</span><span class="nav-label">'+label+'</span></button>';
  const menuKey = String(screen).startsWith('Menu:')?String(screen).slice(5):'';
  const inBku = bkuGroup.includes(screen)||menuKey==='bku';
  $('nav').innerHTML = items.map(([name])=>{
    if(name==='Pemasukan'||name==='Pengeluaran'||name==='Cetak Laporan') return '';
    if(name==='Surat') {
      const inSr = suratGroup.includes(screen)||menuKey==='surat';
      return '<button type="button" id="suratParent" class="nav-parent'+(inSr?' in-group active':'')+(suratOpen?' open':'')+'" '+(inSr?'aria-current="page" ':'')+'aria-expanded="'+suratOpen+'" aria-controls="suratSub"><span class="nav-icon" aria-hidden="true">'+svgIcon('Surat')+'</span><span class="nav-label">Surat</span><span class="nav-chevron" aria-hidden="true"></span></button>'+
        '<div class="nav-sub'+(suratOpen?' show':'')+'" id="suratSub">'+suratGroup.map(n=>navButton(n,n,'Surat')).join('')+'</div>';
    }
    if(name==='UPZ DESA') {
      const inUd = udGroup.includes(screen)||menuKey==='ud';
      return '<button type="button" id="udParent" class="nav-parent'+(inUd?' in-group active':'')+(udOpen?' open':'')+'" '+(inUd?'aria-current="page" ':'')+'aria-expanded="'+udOpen+'" aria-controls="udSub"><span class="nav-icon" aria-hidden="true">'+svgIcon('UPZ DESA')+'</span><span class="nav-label">UPZ DESA</span><span class="nav-chevron" aria-hidden="true"></span></button>'+
        '<div class="nav-sub'+(udOpen?' show':'')+'" id="udSub">'+navButton('Data UPZ Desa','Data UPZ Desa','Data UPZ Desa')+navButton('Perhimpunan Desa','Perhimpunan','Perhimpunan Desa')+navButton('Pendistribusian Desa','Pendistribusian','Pendistribusian Desa')+navButton('Rekap Laporan Desa','Rekap Laporan','Rekap Laporan Desa')+'</div>';
    }
    if(name==='UPZ KEC') {
      const inUpzKec = upzkecGroup.includes(screen)||menuKey==='upzkec';
      const rekapActive = rekapGroup.includes(screen);
      return '<button type="button" id="upzkecParent" class="nav-parent'+(inUpzKec?' in-group active':'')+(upzkecOpen?' open':'')+'" '+(inUpzKec?'aria-current="page" ':'')+'aria-expanded="'+upzkecOpen+'" aria-controls="upzkecSub"><span class="nav-icon" aria-hidden="true">'+svgIcon('UPZ KEC')+'</span><span class="nav-label">UPZ KEC</span><span class="nav-chevron" aria-hidden="true"></span></button>'+
        '<div class="nav-sub'+(upzkecOpen?' show':'')+'" id="upzkecSub">'+navButton('Perhimpunan','Perhimpunan','Perhimpunan')+navButton('Pendistribusian','Pendistribusian','Pendistribusian')+'<button type="button" data-page="Form C2A" class="'+(rekapActive?'active':'')+'" '+(rekapActive?'aria-current="page"':'')+'><span class="nav-icon" aria-hidden="true">'+svgIcon('Rekap Laporan')+'</span><span class="nav-label">Rekap Laporan</span></button></div>';
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
  if(String(screen).startsWith('Menu:')) {
    content = menuListPage(String(screen).slice(5));
  } else if(screen==='Dashboard') {
    phDashEnsure();
    const saldo = totals(summary)[2];
    content = dashboardPage();
  } else if(screen==='Profil') {
    content = profilePage();
  } else if(screen==='Login') {
    content = '<div class="login-shell"><div class="login-side"><img src="logo-baznas.png" alt="" width="72" height="72"><h2>BKU UPZ Cipeundeuy</h2><p>Sistem informasi buku kas umum yang transparan dan akuntabel.</p><blockquote>“Ambillah zakat dari sebagian harta mereka…”<small>QS. At-Taubah: 103</small></blockquote></div><section class="panel login"><h1>Login Admin</h1><p class="muted">Gunakan akun yang terdaftar di Supabase Auth.</p><form id="login"><label>Email<input type="email" name="email" autocomplete="username" required></label><label>Kata sandi<input type="password" name="password" autocomplete="current-password" required></label><div id="loginError" role="alert"></div><button>Masuk</button><button type="button" class="secondary" id="demo">Coba Admin Demo</button></form></section></div>';
  } else if(suratGroup.includes(screen)) {
    content = suratPage();
  } else if(PH_KINDS[screen]) {
    content = phPage(screen);
  } else if(screen==='Data UPZ Desa') {
    content = udDesaPage();
  } else if(screen==='Perhimpunan Desa') {
    content = udPhPage('ph');
  } else if(screen==='Pendistribusian Desa') {
    content = udPhPage('pd');
  } else if(screen==='Rekap Laporan Desa') {
    content = udRekapPage();
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
  content = menuBack(screen)+content;
  $('page').innerHTML = content;
  $('period')?.addEventListener('change',e=>{month=e.target.value;render();});
  $('dashPhYear')?.addEventListener('change',e=>{phState.Perhimpunan.year=phState.Pendistribusian.year=e.target.value;render();});
  $('dashboardYear')?.addEventListener('change',e=>{dashboardYear=e.target.value;render();});
  $('transactionSearch')?.addEventListener('change',e=>{transactionSearch=e.target.value;render();});
  $('transactionCategory')?.addEventListener('change',e=>{transactionCategory=e.target.value;render();});
  $('all')?.addEventListener('click',()=>{month='';render();});
  $('print')?.addEventListener('click',()=>printNamed(...reportPrintName()));
  $('phYear')?.addEventListener('change',e=>{phState[screen].year=e.target.value;render();});
  $('phAdd')?.addEventListener('click',()=>editPh());
  $('phPrint')?.addEventListener('click',()=>{
    const th = phState.Perhimpunan.year || today().slice(0,4);
    if(screen==='Form C2A') return printNamed('Rekap Laporan Form C2A','Tahun '+th);
    if(screen==='Form C2B') return printNamed('Rencana Program Form C2B','Tahun '+th);
    const K = PH_KINDS[screen];
    printNamed(K?'Form '+K.form+' '+screen:screen, 'Tahun '+((phState[screen]&&phState[screen].year)||today().slice(0,4)));
  });
  $('phCamat')?.addEventListener('input',e=>{phCamat=e.target.value;const t=$('phCamatPrint');if(t)t.textContent=camatName();});
  $('phReportDate')?.addEventListener('input',e=>{
    if(!e.target.value) return;
    phReportDate=e.target.value;
    const t=$('phDatePrint');if(t)t.textContent='Dilaporkan tanggal : '+phLongDate(phReportDate);
  });
  document.querySelectorAll('[data-more]').forEach(b=>b.addEventListener('click',()=>{phExpanded[b.dataset.more]=!phExpanded[b.dataset.more];render();}));
  document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.goto)));
  if(screen==='Cetak Laporan') bindReportFilters();
  if(screen==='Profil') bindProfile();
  if(suratGroup.includes(screen)) bindSurat();
  if(udGroup.includes(screen)) bindUd();
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
    toast('Transaksi berhasil disimpan.');
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
  if(!await confirmDialog('Hapus transaksi ini?',description+' sebesar '+money(Number(record.debet)||Number(record.kredit))+' akan dihapus dan tidak dapat dikembalikan.')) return;
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
    toast('Transaksi berhasil dihapus.');
  } catch(error) {
    const notice='Transaksi gagal dihapus. '+error.message;
    if(fromDialog) $('entryError').textContent=notice;
    else toast(notice,'error');
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
  const upzkecParent=event.target.closest('#upzkecParent');
  if(upzkecParent) {
    if(window.matchMedia('(max-width:900px)').matches) {
      go('Menu:upzkec');
      return;
    }
    upzkecOpen=!upzkecOpen;
    upzkecParent.classList.toggle('open',upzkecOpen);
    upzkecParent.setAttribute('aria-expanded',String(upzkecOpen));
    $('upzkecSub')?.classList.toggle('show',upzkecOpen);
    return;
  }
  const suratParent=event.target.closest('#suratParent');
  if(suratParent) {
    if(window.matchMedia('(max-width:900px)').matches) {
      go('Menu:surat');
      return;
    }
    suratOpen=!suratOpen;
    suratParent.classList.toggle('open',suratOpen);
    suratParent.setAttribute('aria-expanded',String(suratOpen));
    $('suratSub')?.classList.toggle('show',suratOpen);
    return;
  }
  const udParent=event.target.closest('#udParent');
  if(udParent) {
    if(window.matchMedia('(max-width:900px)').matches) {
      go('Menu:ud');
      return;
    }
    udOpen=!udOpen;
    udParent.classList.toggle('open',udOpen);
    udParent.setAttribute('aria-expanded',String(udOpen));
    $('udSub')?.classList.toggle('show',udOpen);
    return;
  }
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
      go('Menu:bku');
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
window.matchMedia('(max-width:900px)').addEventListener?.('change',e=>{
  if(!e.matches&&String(screen).startsWith('Menu:')) {
    const m=menuLists()[String(screen).slice(5)];
    go(m?m.first:'Dashboard');
  }
});
refresh();
loadProfile();
