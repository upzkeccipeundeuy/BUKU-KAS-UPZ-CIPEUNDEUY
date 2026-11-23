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
const items = [['Dashboard','▦'],['Profil','♙'],['Pemasukan','⊕'],['Pengeluaran','⊖'],['BKU','▤'],['Cetak Laporan','▧'],['Login','⇥']];
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
  if(name==='Profil'||name==='Cetak Laporan') loadProfile();
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
    '<div class="card"><div class="symbol" aria-hidden="true">'+['⊕','⊖','▤'][i]+'</div><small>'+label+'</small><strong>'+money(loading||failure?null:values[i])+'</strong></div>').join('')+'</div>';
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
function render() {
  $('role').textContent = simulated?'Admin · Demo':admin()?'Administrator':'Akses Umum';
  $('status').hidden = !failure&&!simulated;
  $('status').textContent = failure || (simulated?'Mode demo · Seluruh perubahan hanya berlaku selama halaman ini terbuka.':'');
  $('nav').innerHTML = items.map(([name,icon])=>{
    const label = name==='Login'&&admin()?'Keluar':name;
    return '<button type="button" data-page="'+name+'" class="'+(screen===name?'active':'')+'" '+(screen===name?'aria-current="page"':'')+'><span class="nav-icon" aria-hidden="true">'+icon+'</span><span class="nav-label">'+label+'</span></button>';
  }).join('');
  const data = summary.filter(r=>!month||r.bulan.startsWith(month));
  const list = rows.filter(r=>!month||r.tanggal.startsWith(month));
  let content;
  if(screen==='Dashboard') {
    const saldo = totals(summary)[2];
    content = '<div class="hero"><div class="eyebrow">'+(admin()?'DASHBOARD ADMIN':'DASHBOARD UMUM')+'</div><h1>Kas UPZ Cipeundeuy</h1><p>Ringkasan penerimaan, pengeluaran, dan saldo kas.</p><strong>Saldo kas keseluruhan · '+money(loading||failure?null:saldo)+'</strong></div>'+
      cards(data)+annualDashboard()+'<div class="panel"><div class="toolbar"><h2>'+ (admin()?'Transaksi Terbaru':'Ringkasan Bulanan')+'</h2>'+filters()+'</div>'+
      (admin()?ledger([...list].reverse().slice(0,8),false):publicLedger(data))+'</div>';
  } else if(screen==='Profil') {
    content = profilePage();
  } else if(screen==='Login') {
    content = '<section class="panel login"><h1>Login Admin</h1><p class="muted">Gunakan akun yang terdaftar di Supabase Auth.</p><form id="login"><label>Email<input type="email" name="email" autocomplete="username" required></label><label>Kata sandi<input type="password" name="password" autocomplete="current-password" required></label><div id="loginError" role="alert"></div><button>Masuk</button><button type="button" class="secondary" id="demo">Coba Admin Demo</button></form></section>';
  } else if(screen==='Cetak Laporan') {
    content = reportPage();
  } else if(screen==='BKU') {
    content = '<section class="panel bku-panel"><div class="bku-heading"><h1>BKU</h1><p class="muted">Ringkasan kas dan rincian transaksi per bulan, dimulai dari Januari.</p></div>'+
      '<div class="toolbar no-print">'+filters()+'</div>'+
      '<div class="bku-month-list">'+bkuMonthly(data,list)+'</div></section>';
  } else {
    const type = screen==='Pemasukan'?'debet':screen==='Pengeluaran'?'kredit':'';
    const selection = (type?list.filter(r=>Number(r[type])>0):list).filter(r=>{
      const query=transactionSearch.trim().toLocaleLowerCase('id');
      const matches=!query||[r.no_kwitansi,r.penerima,r.tanggal,r.kriteria,r.uraian].some(value=>String(value||'').toLocaleLowerCase('id').includes(query));
      return matches&&(!transactionCategory||r.kriteria===transactionCategory);
    });
    content = '<section class="panel"><h1>'+esc(screen)+'</h1>'+
      '<div class="toolbar no-print">'+filters()+
      (admin()?'<button id="add">Tambah '+esc(type?screen:'Transaksi')+'</button>':'')+
      '</div>'+(admin()?transactionFilters(type?list.filter(r=>Number(r[type])>0):list)+ledger(selection,true):publicLedger(data,screen))+'</section>';
  }
  $('page').innerHTML = content;
  $('period')?.addEventListener('change',e=>{month=e.target.value;render();});
  $('dashboardYear')?.addEventListener('change',e=>{dashboardYear=e.target.value;render();});
  $('transactionSearch')?.addEventListener('change',e=>{transactionSearch=e.target.value;render();});
  $('transactionCategory')?.addEventListener('change',e=>{transactionCategory=e.target.value;render();});
  $('all')?.addEventListener('click',()=>{month='';render();});
  $('print')?.addEventListener('click',()=>window.print());
  if(screen==='Cetak Laporan') bindReportFilters();
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
