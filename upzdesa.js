/* ---------- UPZ DESA: identitas UPZ desa/kelurahan + perhimpunan + cetak Form A1 (khusus admin) ---------- */
const UD_SQL = 'setup-upz-desa-supabase.sql';
const udYearNow = new Date().getFullYear();
const udGroup = ['Data UPZ Desa','Perhimpunan Desa','Pendistribusian Desa','Rekap Laporan Desa'];
const UD_RK_SQL = 'setup-upz-desa-rekap-supabase.sql';
const UD_PD_SQL = 'setup-upz-desa-pendistribusian-supabase.sql';
const UD_TABLE = {desa:'upz_desa',ph:'upz_desa_perhimpunan',pd:'upz_desa_pendistribusian'};
const UD_TXT = {
  ph:{crumb:'Perhimpunan',h1:'Perhimpunan UPZ Desa',desc:'Pengumpulan per UPZ DKM/RT/RW',form:'A1',title:'DATA PENGUMPULAN',group:'PENGUMPULAN',noun:'perhimpunan'},
  pd:{crumb:'Pendistribusian',h1:'Pendistribusian UPZ Desa',desc:'Pendistribusian per UPZ DKM/RT/RW',form:'B1',title:'DATA PENDISTRIBUSIAN',group:'PENDISTRIBUSIAN',noun:'pendistribusian'}
};
const udTabs = () => '<div class="bku-tabs no-print" role="tablist">'+[['Data UPZ Desa','Data UPZ Desa'],['Perhimpunan Desa','Perhimpunan'],['Pendistribusian Desa','Pendistribusian'],['Rekap Laporan Desa','Rekap Laporan']].map(([page,label])=>'<button type="button" role="tab" data-goto="'+page+'" aria-selected="'+(screen===page)+'" class="'+(screen===page?'on':'')+'">'+label+'</button>').join('')+'</div>';
const udRows = kind => kind==='desa' ? UD.desa : kind==='pd' ? UD.pd : UD.ph;
const udSqlFile = msg => /pendistribusian/i.test(msg||'') ? UD_PD_SQL : UD_SQL;
let udOpen = false;
const UD = {desa:[],ph:[],pd:[],pdFailure:'',munfiq:'',loading:false,failure:'',gen:0,desaId:'',year:'',date:'',kades:null,expandedDesa:{}};
const UD_DEMO = {
  desa:[{id:1,nama_desa:'SAWANGAN',kecamatan:'CIPEUNDEUY',kabupaten:'SUBANG',nama_ketua:'ODANG PRIATNA',no_hp:'',nama_kades:'RUDIYANTO',alamat:''}],
  ph:[
    ['UPZ DKM Al-Ikhlas','Kp. Sawangan','01','01',800,28000000,2400000],
    ['UPZ DKM Nurul Huda','Kp. Cibogo','02','01',720,26000000,2200000],
    ['UPZ DKM Al-Hidayah','Kp. Babakan','01','02',700,25000000,2000000],
    ['UPZ DKM Darussalam','Kp. Cikadu','03','02',660,24760000,1940000],
    ['UPZ DKM Baiturrahman','Kp. Pasirjati','02','03',600,25000000,1900000]
  ].map(([nama_upz,alamat_kp,rt,rw,jumlah_jiwa,zakat_fitrah,bis_ramadhan],i)=>({id:i+1,upz_desa_id:1,tahun:udYearNow,nama_upz,alamat_kp,rt,rw,jumlah_jiwa,zakat_fitrah,beras_kg:0,bis_ramadhan,zakat_mal:0,infak_umum:0,fidyah:0}))
};
UD_DEMO.pd = UD_DEMO.ph.map(r=>({...r,zakat_fitrah:Math.round(r.zakat_fitrah*0.9),bis_ramadhan:Math.round(r.bis_ramadhan*0.9)}));
const udN = v => angka.format(Number(v||0));

async function loadUd() {
  const stamp = ++UD.gen;
  UD.loading = true; UD.failure = ''; UD.pdFailure = ''; render();
  try {
    if(simulated) {UD.desa=[...UD_DEMO.desa];UD.ph=[...UD_DEMO.ph];UD.pd=[...UD_DEMO.pd];}
    else {
      const token = session?.access_token;
      [UD.desa,UD.ph,UD.pd] = await Promise.all([
        api('/rest/v1/upz_desa?select=*&order=nama_desa.asc&limit=1000',{token}),
        api('/rest/v1/upz_desa_perhimpunan?select=*&order=tahun.desc,id.asc&limit=5000',{token}),
        api('/rest/v1/upz_desa_pendistribusian?select=*&order=tahun.desc,id.asc&limit=5000',{token}).catch(e=>{UD.pdFailure=e.message;return [];}),
        api('/rest/v1/upz_desa_rekap_persen?select=kunci,nilai',{token}).then(r=>{UDR.saved=(r||[]).find(x=>x.kunci==='c1')?.nilai||null;UDR.pct=null;UDR.failure='';}).catch(e=>{UDR.failure=/rekap_persen|schema cache|does not exist/i.test(e.message)?'Tabel upz_desa_rekap_persen belum dibuat. Jalankan '+UD_RK_SQL+' di Supabase SQL Editor.':e.message;})]);
    }
  } catch(error) {
    if(stamp!==UD.gen) return;
    UD.desa = []; UD.ph = []; UD.pd = []; UD.failure = error.message;
  } finally {
    if(stamp===UD.gen) {UD.loading=false;render();}
  }
}

function udCurrent(kind='ph') {
  const desa = UD.desa.find(d=>String(d.id)===String(UD.desaId)) || UD.desa[0] || null;
  const mine = desa ? udRows(kind).filter(r=>String(r.upz_desa_id)===String(desa.id)) : [];
  let year = UD.year;
  if(!year) {
    const ys = [...new Set(mine.map(r=>String(r.tahun)))].sort().reverse();
    year = !ys.length || ys.includes(String(udYearNow)) ? String(udYearNow) : ys[0];
  }
  const years = [...new Set([...mine.map(r=>String(r.tahun)),year,String(udYearNow)])].sort().reverse();
  const list = mine.filter(r=>String(r.tahun)===year);
  const total = {};
  PH_SUM.forEach(k=>{total[k]=list.reduce((s,r)=>s+Number(r[k]||0),0);});
  const grand = list.reduce((s,r)=>s+phJumlah(r),0);
  return {desa,year,years,list,total,grand};
}

/* Formulir A1 Desa dan Kelurahan */
function udPrintForm(c, kind='ph') {
  const T = UD_TXT[kind];
  const {desa,year,list,total,grand} = c;
  const e = v => v==null ? '' : esc(v);
  const cell = v => Number(v||0) ? udN(v) : '-';
  const kades = UD.kades!==null ? UD.kades : (desa?.nama_kades||'');
  const date = phLongDate(UD.date || today());
  const rowsHtml = list.map((r,i)=>`<tr><td>${i+1}</td><td class="l">${e(r.nama_upz)}</td><td class="l">${e(r.alamat_kp)}</td><td>${e(r.rt)}</td><td>${e(r.rw)}</td><td class="r">${Number(r.jumlah_jiwa||0)}</td>`+
    `<td class="r">${cell(r.zakat_fitrah)}${Number(r.beras_kg||0)?`<br><span class="beras">${udN(r.beras_kg)} kg</span>`:''}</td>`+
    ['bis_ramadhan','zakat_mal','infak_umum','fidyah'].map(k=>`<td class="r">${cell(r[k])}</td>`).join('')+`<td class="r"><b>${udN(phJumlah(r))}</b></td></tr>`).join('');
  const blank = Array.from({length:Math.max(0,5-list.length)},()=>'<tr>'+'<td></td>'.repeat(12)+'</tr>').join('');
  const tot = `<tr class="tot"><td></td><td class="l" colspan="1"><b>JUMLAH RP.</b></td><td></td><td></td><td></td><td class="r"><b>${Number(total.jumlah_jiwa||0)}</b></td>`+
    `<td class="r"><b>${cell(total.zakat_fitrah)}${Number(total.beras_kg)?`<br><span class="beras">${udN(total.beras_kg)} kg</span>`:''}</b></td>`+
    ['bis_ramadhan','zakat_mal','infak_umum','fidyah'].map(k=>`<td class="r"><b>${cell(total[k])}</b></td>`).join('')+`<td class="r"><b>${cell(grand)}</b></td></tr>`;
  return `<div class="ph-form ud-form">`+
    `<div class="phf-tag">form ${T.form} Desa dan Kelurahan</div>`+
    `<div class="phf-head"><img src="logo-baznas.png" alt="Logo BAZNAS Kabupaten Subang"><div class="phf-title">${T.title}<br>DANA ZAKAT FITRAH, BIS RAMADHAN, ZAKAT MAL, INFAK UMUM DAN FIDYAH<br>TAHUN ${phHijriYear(year)} H / ${esc(year)} M</div></div>`+
    `<div class="phf-info"><div><span>Desa/Kelurahan</span><span class="ul">: ${e(desa?.nama_desa).toUpperCase()}</span></div><div><span>Nama Ketua UPZ</span><span class="ul">: ${e(desa?.nama_ketua).toUpperCase()}</span></div>`+
    `<div><span>Kecamatan</span><span class="ul">: ${e(desa?.kecamatan).toUpperCase()}</span></div><div><span>Nomor Hp.</span><span class="ul">: ${e(desa?.no_hp)}</span></div>`+
    `<div><span>Kabupaten</span><span class="ul">: ${e(desa?.kabupaten).toUpperCase()}</span></div><div></div></div>`+
    `<table class="phf-table"><colgroup><col style="width:3.5%"><col style="width:15%"><col style="width:13%"><col style="width:4%"><col style="width:4%"><col style="width:7%"><col style="width:9.5%"><col style="width:8.5%"><col style="width:9%"><col style="width:9%"><col style="width:8%"><col style="width:9.5%"></colgroup><thead>`+
    `<tr><th rowspan="2">NO</th><th rowspan="2">NAMA UPZ<br>DKM/RT/RW</th><th colspan="3">ALAMAT</th><th rowspan="2">JUMLAH<br>JIWA<br>(Orang)</th><th colspan="6">${T.group}</th></tr>`+
    `<tr><th>Kp/Dsn/Blok</th><th>RT</th><th>RW</th><th>Zakat Fitrah<br>(Rp) / Beras<br>(3,5 L/2,8 Kg)</th><th>BIS<br>Ramadhan<br>(Rp)</th><th>Zakat Mal Rp.</th><th>Infak Umum<br>Rp.</th><th>Fidyah<br>Rp.</th><th>Jumlah<br>Rp.</th></tr></thead>`+
    `<tbody>${rowsHtml}${blank}${tot}</tbody></table>`+
    `<div class="phf-sign"><div class="phf-left">Mengetahui,<br>Kepala Desa / Lurah<div class="phf-name" id="udKadesPrint">${e(kades)}</div></div>`+
    `<div class="phf-right"><span id="udDatePrint">Dilaporkan tanggal : ${esc(date)}</span><br>Ketua UPZ,<div class="phf-name">${e(desa?.nama_ketua)}</div></div></div></div>`;
}

function udSqlHint(msg=UD.failure) {
  const f = udSqlFile(msg);
  return /upz_desa|schema cache|does not exist/i.test(msg) ? ` Jalankan <a href="${f}" download>${f}</a> di Supabase SQL Editor.` : '';
}

function udDesaPage() {
  let content;
  if(UD.loading) content = skeletonRows(4);
  else if(UD.failure) content = `<p class="empty" role="alert">Data UPZ Desa gagal dimuat. ${esc(UD.failure)}${udSqlHint()}</p>`;
  else if(!UD.desa.length) content = emptyState('Belum ada UPZ Desa','Klik “Tambah UPZ Desa” untuk mengisi identitas.');
  else {
    const mainRows = UD.desa.map((d,i)=>{
      const ph = UD.ph.filter(r=>String(r.upz_desa_id)===String(d.id));
      const years = [...new Set(ph.map(r=>String(r.tahun)))].sort().reverse();
      const expanded = !!UD.expandedDesa[d.id];
      let detail = '';
      if(expanded){
        detail = years.length ? years.map(y=>{
          const rows=ph.filter(r=>String(r.tahun)===y), totals={};
          ['zakat_fitrah','beras_kg','bis_ramadhan','zakat_mal','infak_umum','fidyah'].forEach(k=>totals[k]=rows.reduce((sum,r)=>sum+Number(r[k]||0),0));
          const grand=rows.reduce((sum,r)=>sum+phJumlah(r),0);
          return `<div class="ud-detail-year"><h4>Tahun ${esc(y)} <span>${rows.length} UPZ DKM/RT/RW</span></h4><div class="scroll"><table class="ud-detail-table"><thead><tr><th>No</th><th>Nama UPZ DKM/RT/RW</th><th>Alamat</th><th>Jiwa</th><th>Zakat Fitrah</th><th>Beras (kg)</th><th>BIS Ramadhan</th><th>Zakat Mal</th><th>Infak Umum</th><th>Fidyah</th><th>Total</th></tr></thead><tbody>${rows.map((r,j)=>`<tr><td>${j+1}</td><td>${esc(r.nama_upz)}</td><td>${esc(r.alamat_kp||'')}</td><td>${udN(r.jumlah_jiwa)}</td><td>${udN(r.zakat_fitrah)}</td><td>${udN(r.beras_kg)}</td><td>${udN(r.bis_ramadhan)}</td><td>${udN(r.zakat_mal)}</td><td>${udN(r.infak_umum)}</td><td>${udN(r.fidyah)}</td><td><b>${udN(phJumlah(r))}</b></td></tr>`).join('')}</tbody><tfoot><tr><td colspan="3">TOTAL ${esc(y)}</td><td>${udN(rows.reduce((sum,r)=>sum+Number(r.jumlah_jiwa||0),0))}</td><td>${udN(totals.zakat_fitrah)}</td><td>${udN(totals.beras_kg)}</td><td>${udN(totals.bis_ramadhan)}</td><td>${udN(totals.zakat_mal)}</td><td>${udN(totals.infak_umum)}</td><td>${udN(totals.fidyah)}</td><td>${udN(grand)}</td></tr></tfoot></table></div></div>`;
        }).join('') : `<p class="muted ud-detail-empty">Belum ada data perhimpunan untuk desa ini.</p>`;
      }
      return `<tr><td>${i+1}</td><td class="ph-name"><strong>${esc(d.nama_desa)}</strong>${d.alamat?`<br><span class="muted">${esc(d.alamat)}</span>`:''}</td><td>${esc(d.kecamatan)}</td><td>${esc(d.kabupaten)}</td><td>${esc(d.nama_ketua)}</td><td>${esc(d.no_hp)}</td><td>${esc(d.nama_kades)}</td><td class="no-print"><button type="button" class="secondary ud-toggle-detail" data-ud-expand="${esc(d.id)}">${expanded?'▼ Tutup':'＋ Rincian'} <small>(${ph.length})</small></button></td>${admin()?`<td class="no-print ph-actions"><button type="button" class="secondary" data-ud="edit:desa:${esc(d.id)}">Edit</button> <button type="button" class="danger" data-ud="del:desa:${esc(d.id)}">Hapus</button></td>`:''}</tr>${expanded?`<tr class="ud-detail-row"><td colspan="${admin()?9:8}">${detail}</td></tr>`:''}`;
    }).join('');
    content = `<div class="scroll"><table class="ph-table"><thead><tr><th>No</th><th>Desa/Kelurahan</th><th>Kecamatan</th><th>Kabupaten</th><th>Ketua UPZ</th><th>Nomor Hp.</th><th>Kepala Desa / Lurah</th><th class="no-print">Perhimpunan</th>${admin()?'<th class="no-print">Aksi</th>':''}</tr></thead><tbody>${mainRows}</tbody></table></div>`;
  }
  return `<section class="panel ud-panel">${udTabs()}<div class="ph-heading"><p class="crumb">UPZ DESA / Data UPZ Desa</p><h1>Data UPZ Desa</h1><p class="muted">Identitas UPZ desa/kelurahan${admin()?'.':' (hanya admin yang dapat mengubah).'} Klik rincian untuk melihat data perhimpunan per tahun.</p></div>`+
    `${admin()?'<div class="toolbar no-print"><span class="ph-tools"><button type="button" data-ud="add:desa">Tambah UPZ Desa</button></span></div>':''}${content}</section>`;
}

function udPhPage(kind='ph') {
  const T = UD_TXT[kind];
  const c = udCurrent(kind), {desa,year,years,list,total,grand} = c;
  let content;
  if(UD.loading) content = skeletonRows(6);
  else if(UD.failure || (kind==='pd' && UD.pdFailure)) {const msg = UD.failure || UD.pdFailure; content = `<p class="empty" role="alert">Data ${T.noun} gagal dimuat. ${esc(msg)}${udSqlHint(msg)}</p>`;}
  else if(!desa) content = emptyState('Belum ada UPZ Desa',admin()?'Isi dulu identitas di menu UPZ DESA › Data UPZ Desa.':'Data UPZ Desa belum tersedia.');
  else {
    const rowsHtml = list.map((r,i)=>`<tr><td>${i+1}</td><td class="ph-name">${esc(r.nama_upz)}</td><td class="ph-left">${esc(r.alamat_kp)}</td><td>${esc(r.rt)}</td><td>${esc(r.rw)}</td><td class="money">${udN(r.jumlah_jiwa)}</td>`+
      ['zakat_fitrah','beras_kg','bis_ramadhan','zakat_mal','infak_umum','fidyah'].map(k=>`<td class="money">${udN(r[k])}</td>`).join('')+`<td class="money ph-strong">${udN(phJumlah(r))}</td>`+
      (admin()?`<td class="no-print ph-actions"><button type="button" class="secondary" data-ud="edit:${kind}:${esc(r.id)}">Edit</button> <button type="button" class="danger" data-ud="del:${kind}:${esc(r.id)}">Hapus</button></td>`:'')+`</tr>`).join('');
    const table = list.length ? `<div class="scroll no-print"><table class="ph-table"><thead><tr><th>No</th><th>Nama UPZ DKM/RT/RW</th><th>Kp/Dsn/Blok</th><th>RT</th><th>RW</th><th>Jiwa</th><th>Zakat Fitrah (Rp)</th><th>Beras (kg)</th><th>BIS Ramadhan</th><th>Zakat Mal</th><th>Infak Umum</th><th>Fidyah</th><th>Jumlah (Rp)</th>${admin()?'<th class="no-print">Aksi</th>':''}</tr></thead><tbody>${rowsHtml}</tbody>`+
      `<tfoot><tr><td></td><td class="ph-name">JUMLAH RP.</td><td colspan="3"></td><td class="money">${udN(total.jumlah_jiwa)}</td>${['zakat_fitrah','beras_kg','bis_ramadhan','zakat_mal','infak_umum','fidyah'].map(k=>`<td class="money">${udN(total[k])}</td>`).join('')}<td class="money ph-strong">${udN(grand)}</td>${admin()?'<td class="no-print"></td>':''}</tr></tfoot></table></div>`
      : emptyState('Belum ada data '+T.noun,'Belum ada data untuk '+esc(desa.nama_desa)+' tahun '+esc(year)+'. Klik “Tambah UPZ DKM/RT/RW”.');
    content = table+`<h2 class="ud-sub no-print">Pratinjau cetak Form ${T.form}</h2><div class="ud-paper">${udPrintForm(c,kind)}</div>`;
  }
  const opt = (v,l,sel)=>`<option value="${esc(v)}" ${sel?'selected':''}>${esc(l)}</option>`;
  return `<section class="panel ph-panel ud-panel">${udTabs()}<div class="ph-heading"><p class="crumb">UPZ DESA / ${T.crumb}</p><h1>${T.h1}</h1><p class="muted">${T.desc} · Form ${T.form} Desa dan Kelurahan${desa?' · '+esc(desa.nama_desa)+' · Tahun '+esc(year):''}</p></div>`+
    `<div class="toolbar no-print"><label class="ph-year">Desa/Kelurahan <select id="udDesaSel">${UD.desa.map(d=>opt(d.id,d.nama_desa,desa&&String(d.id)===String(desa.id))).join('')}</select></label>`+
    `<label class="ph-year">Tahun <select id="udYear">${years.map(y=>opt(y,y,y===year)).join('')}</select></label>`+
    `<label class="ph-year">Kepala Desa / Lurah <input id="udKades" maxlength="100" placeholder="Nama untuk tanda tangan" value="${esc(UD.kades!==null?UD.kades:(desa?.nama_kades||''))}"></label>`+
    `<label class="ph-year">Tanggal laporan <input id="udDate" type="date" max="9999-12-31" value="${esc(UD.date||today())}"></label>`+
    `<span class="ph-tools"><button type="button" class="secondary" id="udPrint">Cetak Form ${T.form}</button>`+
    `<button type="button" class="secondary" id="udXlExport" ${desa?'':'disabled'}>Ekspor Excel</button>${admin()?`<button type="button" class="secondary" id="udXlImport" ${desa?'':'disabled'}>Impor Excel</button><button type="button" class="secondary" id="udXlTemplate">Templat</button><input type="file" id="udXlFile" accept=".xlsx,.xls,.csv" hidden>`:''}`+
    `${admin()?`<button type="button" data-ud="add:${kind}" ${desa?'':'disabled'}>Tambah UPZ DKM/RT/RW</button>`:''}</span></div>${content}</section>`;
}

function bindUd() {
  $('udDesaSel')?.addEventListener('change',e=>{UD.desaId=e.target.value;UD.year='';UD.kades=null;UD.munfiq='';render();});
  $('udYear')?.addEventListener('change',e=>{UD.year=e.target.value;render();});
  $('udKades')?.addEventListener('input',e=>{UD.kades=e.target.value;const t=$('udKadesPrint');if(t)t.textContent=e.target.value;});
  $('udDate')?.addEventListener('input',e=>{if(!e.target.value)return;UD.date=e.target.value;const t=$('udDatePrint');if(t)t.textContent='Dilaporkan tanggal : '+phLongDate(UD.date);});
  $('udMunfiq')?.addEventListener('input',e=>{UD.munfiq=e.target.value;const t=$('udMunfiqPrint');if(t)t.textContent=e.target.value;});
  $('udPrint')?.addEventListener('click',()=>window.print());
  bindUdExcel();
  bindUdRk();
}

function udShowError(message) {
  const el = $('udError'); if(!el) return;
  if(/duplicate key/i.test(message)) el.textContent = 'Data yang sama persis sudah ada (nama, alamat, RT, dan RW sama). Ubah alamat, RT, atau RW jika memang berbeda.';
  else if(/row-level security/i.test(message)) el.textContent = 'Akses ditolak. Pastikan kamu masuk sebagai admin.';
  else if(/upz_desa|schema cache|does not exist/i.test(message)) el.innerHTML = `Jalankan <a href="${udSqlFile(message)}" download>${udSqlFile(message)}</a> di Supabase SQL Editor, lalu coba simpan lagi.`;
  else el.textContent = message;
}

async function udWrite(kind, record, body) {
  const demo = UD_DEMO[kind];
  if(simulated) {
    if(record) {const i=demo.findIndex(r=>r.id===record.id); if(i>=0) demo[i]={...record,...body};}
    else demo.push({...body,id:Math.max(0,...demo.map(r=>r.id))+1});
    return;
  }
  const table = UD_TABLE[kind];
  const result = await api('/rest/v1/'+table+(record?'?id=eq.'+encodeURIComponent(record.id):''),{method:record?'PATCH':'POST',body,token:session.access_token,extra:{Prefer:'return=representation'}});
  if(!result?.length) throw Error('Data tidak ditemukan atau akses ditolak.');
}

async function udRemove(kind, record) {
  const label = kind==='desa' ? record.nama_desa : record.nama_upz;
  const extra = kind==='desa' ? ' Seluruh data perhimpunan dan pendistribusian desa ini ikut terhapus.' : '';
  if(!await confirmDialog('Hapus '+label+'?','Data akan dihapus dan tidak dapat dikembalikan.'+extra)) return;
  try {
    if(simulated) {
      const demo = UD_DEMO[kind], i = demo.findIndex(r=>r.id===record.id);
      if(i>=0) demo.splice(i,1);
      if(kind==='desa') {UD_DEMO.ph = UD_DEMO.ph.filter(r=>r.upz_desa_id!==record.id);UD_DEMO.pd = UD_DEMO.pd.filter(r=>r.upz_desa_id!==record.id);}
    } else {
      const table = UD_TABLE[kind];
      const result = await api('/rest/v1/'+table+'?id=eq.'+encodeURIComponent(record.id),{method:'DELETE',token:session.access_token,extra:{Prefer:'return=representation'}});
      if(!result?.length) throw Error('Data tidak ditemukan atau akses ditolak.');
    }
    if(kind==='desa' && String(UD.desaId)===String(record.id)) UD.desaId = '';
    await loadUd();
    toast('Data berhasil dihapus.');
  } catch(error) {toast('Data gagal dihapus. '+error.message,'error');}
}

function udOpenDialog(title, fields, kind, record, build) {
  const dialog = $('modal');
  dialog.innerHTML = `<h2>${title}</h2><form id="udForm">${fields}<div id="udError" role="alert"></div><div class="toolbar"><button>Simpan</button><button type="button" class="secondary" id="udCancel">Batal</button></div></form>`;
  $('udCancel').onclick = () => dialog.close();
  $('udForm').onsubmit = async event => {
    event.preventDefault();
    const body = build(Object.fromEntries(new FormData(event.currentTarget)));
    if(!body) return;
    const buttons = [...$('udForm').querySelectorAll('button')];
    buttons.forEach(b=>b.disabled=true);
    try {
      await udWrite(kind,record,body);
      if(kind!=='desa') UD.year = String(body.tahun);
      dialog.close();
      await loadUd();
      toast('Data berhasil disimpan.');
    } catch(error) {udShowError(error.message);}
    finally {buttons.forEach(b=>b.disabled=false);}
  };
  dialog.showModal();
}

function udEditDesa(record) {
  const v = k => esc(record?.[k] ?? '');
  const fields = `<label>Nama Desa/Kelurahan<input name="nama_desa" maxlength="120" required value="${v('nama_desa')}"></label>`+
    `<div class="ph-grid"><label>Kecamatan<input name="kecamatan" maxlength="100" value="${esc(record?.kecamatan ?? 'CIPEUNDEUY')}"></label><label>Kabupaten<input name="kabupaten" maxlength="100" value="${esc(record?.kabupaten ?? 'SUBANG')}"></label></div>`+
    `<label>Nama Ketua UPZ<input name="nama_ketua" maxlength="100" value="${v('nama_ketua')}"></label><label>Nomor Hp. Ketua<input name="no_hp" type="tel" inputmode="tel" maxlength="30" value="${v('no_hp')}"></label>`+
    `<label>Kepala Desa / Lurah<input name="nama_kades" maxlength="100" value="${v('nama_kades')}"></label><label>Alamat (opsional)<input name="alamat" maxlength="200" value="${v('alamat')}"></label>`;
  udOpenDialog((record?'Edit':'Tambah')+' UPZ Desa',fields,'desa',record,f=>{
    const body = {};
    for(const k of ['nama_desa','kecamatan','kabupaten','nama_ketua','no_hp','nama_kades','alamat']) body[k] = (f[k]||'').trim() || null;
    if(!body.nama_desa) {$('udError').textContent='Nama desa/kelurahan wajib diisi.';return null;}
    return body;
  });
}

function udEditPh(record, kind='ph') {
  const {desa,year} = udCurrent(kind);
  if(!desa) return;
  const v = k => esc(record?.[k] ?? '');
  const num = (k,label,step='0.01') => `<label>${label}<input type="number" name="${k}" min="0" max="9999999999999" step="${step}" placeholder="0" value="${v(k)}"></label>`;
  const fields = `<p class="muted">UPZ Desa: <strong>${esc(desa.nama_desa)}</strong></p><label>Tahun<input type="number" name="tahun" min="2000" max="2100" required value="${esc(record?.tahun || year)}"></label>`+
    `<label>Nama UPZ DKM/RT/RW<input name="nama_upz" maxlength="120" required value="${v('nama_upz')}"></label><label>Kp/Dsn/Blok<input name="alamat_kp" maxlength="120" value="${v('alamat_kp')}"></label>`+
    `<div class="ph-grid"><label>RT<input name="rt" maxlength="10" value="${v('rt')}"></label><label>RW<input name="rw" maxlength="10" value="${v('rw')}"></label></div>`+
    num('jumlah_jiwa','Jumlah Jiwa (orang)','1')+`<div class="ph-grid">${num('zakat_fitrah','Zakat Fitrah (Rp)')}${num('beras_kg','Beras (kg)')}${num('bis_ramadhan','BIS Ramadhan (Rp)')}${num('zakat_mal','Zakat Mal (Rp)')}${num('infak_umum','Infak Umum (Rp)')}${num('fidyah','Fidyah (Rp)')}</div>`;
  udOpenDialog((record?'Edit':'Tambah')+' UPZ DKM/RT/RW',fields,kind,record,f=>{
    const body = {upz_desa_id:record?.upz_desa_id ?? desa.id,tahun:Number(f.tahun),nama_upz:f.nama_upz.trim(),alamat_kp:f.alamat_kp.trim()||null,rt:f.rt.trim()||null,rw:f.rw.trim()||null};
    if(!body.nama_upz) {$('udError').textContent='Nama UPZ wajib diisi.';return null;}
    for(const k of PH_SUM) {
      const n = Number(f[k]||0);
      if(!Number.isFinite(n)||n<0) {$('udError').textContent='Angka tidak boleh negatif.';return null;}
      body[k] = k==='jumlah_jiwa' ? Math.round(n) : n;
    }
    return body;
  });
}

document.getElementById('page').addEventListener('click',event=>{
  const exp = event.target.closest('[data-ud-expand]');
  if(exp){const id=exp.dataset.udExpand;UD.expandedDesa[id]=!UD.expandedDesa[id];render();return;}
  const button = event.target.closest('[data-ud]');
  if(!button||!admin()) return;
  const [action,kind,id] = button.dataset.ud.split(':');
  if(action==='add') return kind==='desa' ? udEditDesa() : udEditPh(undefined,kind);
  const record = udRows(kind).find(r=>String(r.id)===id);
  if(!record) return;
  if(action==='edit') kind==='desa' ? udEditDesa(record) : udEditPh(record,kind);
  else udRemove(kind,record);
});


/* ---------- Rekap Laporan Desa: Form C1 Desa dan Kelurahan ----------
   Total pengumpulan diambil dari Perhimpunan desa terpilih; persentase dikelola admin (tabel upz_desa_rekap_persen, kunci 'c1'). */
const UDR = {pct:null,saved:null,failure:'',timer:null};
const UDR_DEFAULT = {
  fitrah_non:{dkm:87.5}, fitrah_amil:{dkm:9.5,des:3},
  bis_opz:{dkm:5,des:10,kec:35,kab:50},
  zakat_mal:{dkm:100}, infak_umum:{dkm:100}, fidyah:{dkm:100}
};
const UDR_ROWS = RK_ROWS.map(g=>({...g,label:g.key==='zakat_mal'?'Zakat Mal':g.label,
  leaves:g.leaves.map(l=>l.id==='bis_opz'?{...l,label:'Penguatan Kelembagaan UPZ'}:l)}));
const udSumFmt = new Intl.NumberFormat('id-ID',{minimumFractionDigits:1,maximumFractionDigits:2});

function udRkState() {
  if(UDR.pct) return UDR.pct;
  const saved = UDR.saved || {};
  UDR.pct = {};
  for(const g of UDR_ROWS) for(const l of g.leaves) {
    UDR.pct[l.id] = {};
    for(const lv of l.use) {
      const own = saved[l.id] && Object.prototype.hasOwnProperty.call(saved[l.id],lv);
      const v = own ? saved[l.id][lv] : UDR_DEFAULT[l.id]?.[lv];
      UDR.pct[l.id][lv] = typeof v === 'number' && Number.isFinite(v) ? v : null;
    }
  }
  return UDR.pct;
}
function udRkStatus(text,bad) {
  const el = $('udRkSaveStatus'); if(el) {el.textContent = text; el.style.color = bad ? '#b3261e' : '';}
}
function udRkPersist(nilai) {
  if(!admin()) return;
  UDR.saved = nilai;
  if(simulated) return;
  clearTimeout(UDR.timer);
  udRkStatus('Menyimpan…');
  UDR.timer = setTimeout(async()=>{
    try {
      if(nilai==null) await api('/rest/v1/upz_desa_rekap_persen?kunci=eq.c1',{method:'DELETE',token:session.access_token});
      else await api('/rest/v1/upz_desa_rekap_persen?on_conflict=kunci',{method:'POST',body:{kunci:'c1',nilai,diubah:new Date().toISOString()},token:session.access_token,extra:{Prefer:'resolution=merge-duplicates,return=minimal'}});
      udRkStatus('Tersimpan');
    } catch(error) {
      udRkStatus('Gagal menyimpan: '+(/row-level security/i.test(error.message)?'akses ditolak, pastikan masuk sebagai admin.':error.message),true);
    }
  },500);
}

function udRkCompute(totals) {
  const pct = udRkState(), cell = {}, warn = [];
  const grand = {total:0,sum:0,dkm:0,des:0,kec:0,kab:0};
  for(const g of UDR_ROWS) {
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
      cell['pct:'+l.id] = p ? udSumFmt.format(p)+'%' : '';
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

let udRkTotals = {};
function udRkRefresh() {
  const {cell,warn} = udRkCompute(udRkTotals);
  document.querySelectorAll('[data-urk]').forEach(el=>{el.textContent = cell[el.dataset.urk] ?? '';});
  const box = $('udRkWarn'); if(box) box.innerHTML = admin() ? rkWarnHtml(warn) : '';
}

function udRkTable(cell) {
  const pct = udRkState();
  const td = (id,cls='r') => '<td class="'+cls+'" data-urk="'+id+'">'+esc(cell[id] ?? '')+'</td>';
  const grey = n => '<td class="g"></td>'.repeat(n);
  const head = '<colgroup><col style="width:3.5%"><col style="width:15%"><col style="width:12.5%">'+
    RK_LEVELS.map(()=>'<col style="width:4.5%"><col style="width:8.5%">').join('')+'<col style="width:5%"><col style="width:12%"></colgroup>'+
    '<thead><tr><th rowspan="3">NO</th><th rowspan="3">URAIAN</th><th rowspan="3">TOTAL<br>PENGUMPULAN<br>(100%)<br>RP</th><th colspan="10">PENDISTRIBUSIAN</th></tr>'+
    '<tr>'+RK_LEVELS.map(([,label])=>'<th colspan="2">'+label+'</th>').join('')+'<th rowspan="2">%</th><th rowspan="2">Jumlah<br>Pendistribusian<br>Rp.</th></tr>'+
    '<tr>'+RK_LEVELS.map(()=>'<th>%</th><th>Jumlah<br>Rp.</th>').join('')+'</tr>'+
    '<tr class="rk-index"><td>1</td><td>2</td><td></td>'+[4,5,6,7,8,9,10,11].map(n=>'<td>'+n+'</td>').join('')+'<td></td><td></td></tr></thead>';
  const leafCells = (l,g) => RK_LEVELS.map(([lv,label])=>{
    if(!l.use.includes(lv)) return grey(2);
    const v = pct[l.id][lv];
    const field = admin() ? '<input type="number" min="0" max="100" step="0.1" inputmode="decimal" data-urk-pct="'+l.id+':'+lv+'" value="'+(v==null?'':v)+'" aria-label="Persen '+esc((l.label||g.label)+' '+label)+'">' : '';
    return '<td class="rk-pct">'+field+'<span class="rk-pct-print'+(admin()?'':' rk-pct-view')+'" data-urk-pcttxt="'+l.id+':'+lv+'">'+esc(rkPctText(v))+'</span></td>'+td('amt:'+l.id+':'+lv);
  }).join('');
  const body = UDR_ROWS.map(g=>{
    const single = g.leaves.length===1 && g.leaves[0].label===null;
    if(single) {
      const l = g.leaves[0];
      return '<tr><td class="c"><b>'+g.no+'</b></td><td class="l"><b>'+esc(g.label)+'</b></td>'+td('tot:'+g.key)+leafCells(l,g)+td('pct:'+l.id,'c')+td('sum:'+l.id)+'</tr>';
    }
    const multi = g.leaves.length>1;
    return '<tr><td class="c"><b>'+g.no+'</b></td><td class="l"><b>'+esc(g.label)+'</b></td>'+td('tot:'+g.key)+grey(8)+'<td></td>'+td('key:'+g.key)+'</tr>'+
      g.leaves.map(l=>'<tr><td></td><td class="l">'+esc(l.label)+'</td>'+(multi?'<td class="g"></td>':'<td></td>')+leafCells(l,g)+td('pct:'+l.id,'c')+td('sum:'+l.id)+'</tr>').join('');
  }).join('');
  const foot = '<tr class="rk-total"><td></td><td class="c"><b>JUMLAH</b></td>'+td('gt:total')+
    RK_LEVELS.map(([lv])=>'<td></td>'+td('gt:'+lv)).join('')+'<td></td>'+td('gt:sum')+'</tr>';
  return '<table class="rk-table udc1-table">'+head+'<tbody>'+body+foot+'</tbody></table>';
}

function udRekapPage() {
  const c = udCurrent('ph'), {desa,year,years,total} = c;
  const heading = `<div class="ph-heading"><p class="crumb">UPZ DESA / Rekap Laporan</p><h1>Rekap Laporan UPZ Desa</h1><p class="muted">Pengumpulan dan pendistribusian zakat · Form C1 Desa dan Kelurahan${desa?' · '+esc(desa.nama_desa)+' · Tahun '+esc(year):''}</p></div>`;
  let content;
  if(UD.loading) content = skeletonRows(6);
  else if(UD.failure) content = `<p class="empty" role="alert">Data perhimpunan gagal dimuat. ${esc(UD.failure)}${udSqlHint()}</p>`;
  else if(!desa) content = emptyState('Belum ada UPZ Desa',admin()?'Isi dulu identitas di menu UPZ DESA › Data UPZ Desa.':'Data UPZ Desa belum tersedia.');
  else {
    udRkTotals = Object.fromEntries(UDR_ROWS.map(g=>[g.key,total[g.key]||0]));
    const {cell,warn} = udRkCompute(udRkTotals);
    const e = v => v==null ? '' : esc(v);
    const kades = UD.kades!==null ? UD.kades : (desa.nama_kades||'');
    const date = phLongDate(UD.date || today());
    const sumJiwa = rows => rows.filter(x=>String(x.upz_desa_id)===String(desa.id)&&String(x.tahun)===year).reduce((s,x)=>s+Number(x.jumlah_jiwa||0),0);
    const muzaki = rkNum(sumJiwa(UD.ph));
    const mustahik = UD.pdFailure ? '-' : rkNum(sumJiwa(UD.pd));
    const phone = desa.no_hp ? ' / '+e(desa.no_hp) : '';
    const opt = (v,l,sel)=>`<option value="${esc(v)}" ${sel?'selected':''}>${esc(l)}</option>`;
    const toolbar = `<div class="toolbar no-print"><label class="ph-year">Desa/Kelurahan <select id="udDesaSel">${UD.desa.map(d=>opt(d.id,d.nama_desa,String(d.id)===String(desa.id))).join('')}</select></label>`+
      `<label class="ph-year">Tahun <select id="udYear">${years.map(y=>opt(y,y,y===year)).join('')}</select></label>`+
      `<label class="ph-year">Kepala Desa / Lurah <input id="udKades" maxlength="100" placeholder="Nama untuk tanda tangan" value="${esc(kades)}"></label>`+
      `<label class="ph-year">Jumlah Munfiq <input id="udMunfiq" inputmode="numeric" maxlength="12" placeholder="Opsional" value="${esc(UD.munfiq)}"></label>`+
      `<label class="ph-year">Tanggal laporan <input id="udDate" type="date" max="9999-12-31" value="${esc(UD.date||today())}"></label>`+
      `<span class="ph-tools">${admin()?'<button type="button" class="secondary" id="udRkReset">Persentase bawaan</button>':''}<button type="button" id="udPrint">Cetak Form C1</button></span></div>`;
    const note = `<p class="muted no-print rk-note">Total pengumpulan dijumlahkan dari menu Perhimpunan ${esc(desa.nama_desa)} tahun ${esc(year)}. ${admin()?'Persentase pada kolom putih dapat diubah dan tersimpan di server. <span id="udRkSaveStatus" role="status"></span>':'Persentase dikelola oleh admin.'}${UDR.failure?' <b>'+esc(UDR.failure)+'</b>':''}</p>`;
    const form = `<div class="ph-form ud-form udc1-form"><div class="phf-tag">form C1 Desa dan Kelurahan</div>`+
      `<div class="udc1-kop"><img src="logo-baznas.png" alt="Logo BAZNAS Kabupaten Subang"><div class="udc1-title">LAPORAN PENGUMPULAN DAN PENDISTRIBUSIAN<br>DANA ZAKAT FITRAH, BIS RAMADHAN, ZAKAT MAL, INFAK UMUM DAN FIDYAH<br>TAHUN ${phHijriYear(year)} H / ${esc(year)} M<br><b>(WAJIB DISAMPAIKAN KEPADA UPZ KECAMATAN)</b></div>`+
      `<dl class="udc1-meta"><dt>Desa/Kel</dt><dd>: ${e(desa.nama_desa).toUpperCase()}</dd><dt>Kecamatan</dt><dd>: ${e(desa.kecamatan).toUpperCase()}</dd>`+
      `<dt>Nama/No. HP Ketua UPZ</dt><dd>: ${e(desa.nama_ketua).toUpperCase()}${phone}</dd>`+
      `<dt>Jumlah Muzaki/Munfiq</dt><dd>: ${muzaki} / <span id="udMunfiqPrint">${e(UD.munfiq)}</span></dd><dt>Jumlah Mustahik</dt><dd>: ${mustahik}</dd></dl></div>`+
      `<div class="scroll rk-wrap">${udRkTable(cell)}</div>`+
      `<div class="phf-sign"><div class="phf-left">Mengetahui,<br>Kepala Desa / Lurah<div class="phf-name" id="udKadesPrint">${e(kades)}</div></div>`+
      `<div class="phf-right"><span id="udDatePrint">Dilaporkan tanggal : ${esc(date)}</span><br>Ketua UPZ,<div class="phf-name">${e(desa.nama_ketua)}</div></div></div></div>`;
    content = toolbar+note+`<div id="udRkWarn" class="rk-warn no-print" role="status">${admin()?rkWarnHtml(warn):''}</div><h2 class="ud-sub no-print">Pratinjau cetak Form C1</h2><div class="ud-paper udc1-paper">${form}</div>`;
  }
  return `<section class="panel ph-panel ud-panel ud-rk">${udTabs()}${heading}${content}</section>`;
}

function bindUdRk() {
  $('udRkReset')?.addEventListener('click',()=>{
    if(!admin()) return;
    UDR.pct = null; udRkPersist(null);
    render();
  });
  document.querySelectorAll('[data-urk-pct]').forEach(input=>input.addEventListener('input',()=>{
    if(!admin()) return;
    const [id,lv] = input.dataset.urkPct.split(':');
    const raw = input.value.trim();
    const n = raw==='' ? null : Number(raw);
    if(n!==null && (!Number.isFinite(n) || n<0 || n>100)) return;
    udRkState()[id][lv] = n;
    udRkPersist(UDR.pct);
    const printed = document.querySelector('[data-urk-pcttxt="'+input.dataset.urkPct+'"]');
    if(printed) printed.textContent = rkPctText(n);
    udRkRefresh();
  }));
}
