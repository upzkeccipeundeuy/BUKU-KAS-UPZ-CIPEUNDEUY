/* ---------- UPZ DESA: identitas UPZ desa/kelurahan + perhimpunan + cetak Form A1 (khusus admin) ---------- */
const UD_SQL = 'setup-upz-desa-supabase.sql';
const udYearNow = new Date().getFullYear();
const udGroup = ['Data UPZ Desa','Perhimpunan Desa'];
let udOpen = false;
const UD = {desa:[],ph:[],loading:false,failure:'',gen:0,desaId:'',year:'',date:'',kades:null};
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
const udN = v => angka.format(Number(v||0));

async function loadUd() {
  const stamp = ++UD.gen;
  UD.loading = true; UD.failure = ''; render();
  try {
    if(simulated) {UD.desa=[...UD_DEMO.desa];UD.ph=[...UD_DEMO.ph];}
    else {
      const token = session?.access_token;
      [UD.desa,UD.ph] = await Promise.all([
        api('/rest/v1/upz_desa?select=*&order=nama_desa.asc&limit=1000',{token}),
        api('/rest/v1/upz_desa_perhimpunan?select=*&order=tahun.desc,id.asc&limit=5000',{token})]);
    }
  } catch(error) {
    if(stamp!==UD.gen) return;
    UD.desa = []; UD.ph = []; UD.failure = error.message;
  } finally {
    if(stamp===UD.gen) {UD.loading=false;render();}
  }
}

function udCurrent() {
  const desa = UD.desa.find(d=>String(d.id)===String(UD.desaId)) || UD.desa[0] || null;
  const mine = desa ? UD.ph.filter(r=>String(r.upz_desa_id)===String(desa.id)) : [];
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
function udPrintForm(c) {
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
    `<div class="phf-tag">form A1 Desa dan Kelurahan</div>`+
    `<div class="phf-head"><img src="logo-baznas.png" alt="Logo BAZNAS Kabupaten Subang"><div class="phf-title">DATA PENGUMPULAN<br>DANA ZAKAT FITRAH, BIS RAMADHAN, ZAKAT MAL, INFAK UMUM DAN FIDYAH<br>TAHUN ${phHijriYear(year)} H / ${esc(year)} M</div></div>`+
    `<div class="phf-info"><div><span>Desa/Kelurahan</span><span class="ul">: ${e(desa?.nama_desa).toUpperCase()}</span></div><div><span>Nama Ketua UPZ</span><span class="ul">: ${e(desa?.nama_ketua).toUpperCase()}</span></div>`+
    `<div><span>Kecamatan</span><span class="ul">: ${e(desa?.kecamatan).toUpperCase()}</span></div><div><span>Nomor Hp.</span><span class="ul">: ${e(desa?.no_hp)}</span></div>`+
    `<div><span>Kabupaten</span><span class="ul">: ${e(desa?.kabupaten).toUpperCase()}</span></div><div></div></div>`+
    `<table class="phf-table"><colgroup><col style="width:3.5%"><col style="width:15%"><col style="width:13%"><col style="width:4%"><col style="width:4%"><col style="width:7%"><col style="width:9.5%"><col style="width:8.5%"><col style="width:9%"><col style="width:9%"><col style="width:8%"><col style="width:9.5%"></colgroup><thead>`+
    `<tr><th rowspan="2">NO</th><th rowspan="2">NAMA UPZ<br>DKM/RT/RW</th><th colspan="3">ALAMAT</th><th rowspan="2">JUMLAH<br>JIWA<br>(Orang)</th><th colspan="6">PENGUMPULAN</th></tr>`+
    `<tr><th>Kp/Dsn/Blok</th><th>RT</th><th>RW</th><th>Zakat Fitrah<br>(Rp) / Beras<br>(3,5 L/2,8 Kg)</th><th>BIS<br>Ramadhan<br>(Rp)</th><th>Zakat Mal Rp.</th><th>Infak Umum<br>Rp.</th><th>Fidyah<br>Rp.</th><th>Jumlah<br>Rp.</th></tr></thead>`+
    `<tbody>${rowsHtml}${blank}${tot}</tbody></table>`+
    `<div class="phf-sign"><div class="phf-left">Mengetahui,<br>Kepala Desa / Lurah<div class="phf-name" id="udKadesPrint">${e(kades)}</div></div>`+
    `<div class="phf-right"><span id="udDatePrint">Dilaporkan tanggal : ${esc(date)}</span><br>Ketua UPZ,<div class="phf-name">${e(desa?.nama_ketua)}</div></div></div></div>`;
}

function udSqlHint() {
  return /upz_desa|schema cache|does not exist/i.test(UD.failure) ? ` Jalankan <a href="${UD_SQL}" download>${UD_SQL}</a> di Supabase SQL Editor.` : '';
}

function udDesaPage() {
  let content;
  if(UD.loading) content = skeletonRows(4);
  else if(UD.failure) content = `<p class="empty" role="alert">Data UPZ Desa gagal dimuat. ${esc(UD.failure)}${udSqlHint()}</p>`;
  else if(!UD.desa.length) content = emptyState('Belum ada UPZ Desa','Klik “Tambah UPZ Desa” untuk mengisi identitas.');
  else content = `<div class="scroll"><table class="ph-table"><thead><tr><th>No</th><th>Desa/Kelurahan</th><th>Kecamatan</th><th>Kabupaten</th><th>Ketua UPZ</th><th>Nomor Hp.</th><th>Kepala Desa / Lurah</th>${admin()?'<th class="no-print">Aksi</th>':''}</tr></thead><tbody>`+
    UD.desa.map((d,i)=>`<tr><td>${i+1}</td><td class="ph-name"><strong>${esc(d.nama_desa)}</strong>${d.alamat?`<br><span class="muted">${esc(d.alamat)}</span>`:''}</td><td>${esc(d.kecamatan)}</td><td>${esc(d.kabupaten)}</td><td>${esc(d.nama_ketua)}</td><td>${esc(d.no_hp)}</td><td>${esc(d.nama_kades)}</td>`+
    (admin()?`<td class="no-print ph-actions"><button type="button" class="secondary" data-ud="edit:desa:${esc(d.id)}">Edit</button> <button type="button" class="danger" data-ud="del:desa:${esc(d.id)}">Hapus</button></td>`:'')+`</tr>`).join('')+`</tbody></table></div>`;
  return `<section class="panel ud-panel"><div class="ph-heading"><p class="crumb">UPZ DESA / Data UPZ Desa</p><h1>Data UPZ Desa</h1><p class="muted">Identitas UPZ desa/kelurahan${admin()?'.':' (hanya admin yang dapat mengubah).'}</p></div>`+
    `${admin()?'<div class="toolbar no-print"><span class="ph-tools"><button type="button" data-ud="add:desa">Tambah UPZ Desa</button></span></div>':''}${content}</section>`;
}

function udPhPage() {
  const c = udCurrent(), {desa,year,years,list,total,grand} = c;
  let content;
  if(UD.loading) content = skeletonRows(6);
  else if(UD.failure) content = `<p class="empty" role="alert">Data perhimpunan gagal dimuat. ${esc(UD.failure)}${udSqlHint()}</p>`;
  else if(!desa) content = emptyState('Belum ada UPZ Desa',admin()?'Isi dulu identitas di menu UPZ DESA › Data UPZ Desa.':'Data UPZ Desa belum tersedia.');
  else {
    const rowsHtml = list.map((r,i)=>`<tr><td>${i+1}</td><td class="ph-name">${esc(r.nama_upz)}</td><td class="ph-left">${esc(r.alamat_kp)}</td><td>${esc(r.rt)}</td><td>${esc(r.rw)}</td><td class="money">${udN(r.jumlah_jiwa)}</td>`+
      ['zakat_fitrah','beras_kg','bis_ramadhan','zakat_mal','infak_umum','fidyah'].map(k=>`<td class="money">${udN(r[k])}</td>`).join('')+`<td class="money ph-strong">${udN(phJumlah(r))}</td>`+
      (admin()?`<td class="no-print ph-actions"><button type="button" class="secondary" data-ud="edit:ph:${esc(r.id)}">Edit</button> <button type="button" class="danger" data-ud="del:ph:${esc(r.id)}">Hapus</button></td>`:'')+`</tr>`).join('');
    const table = list.length ? `<div class="scroll no-print"><table class="ph-table"><thead><tr><th>No</th><th>Nama UPZ DKM/RT/RW</th><th>Kp/Dsn/Blok</th><th>RT</th><th>RW</th><th>Jiwa</th><th>Zakat Fitrah (Rp)</th><th>Beras (kg)</th><th>BIS Ramadhan</th><th>Zakat Mal</th><th>Infak Umum</th><th>Fidyah</th><th>Jumlah (Rp)</th>${admin()?'<th class="no-print">Aksi</th>':''}</tr></thead><tbody>${rowsHtml}</tbody>`+
      `<tfoot><tr><td></td><td class="ph-name">JUMLAH RP.</td><td colspan="3"></td><td class="money">${udN(total.jumlah_jiwa)}</td>${['zakat_fitrah','beras_kg','bis_ramadhan','zakat_mal','infak_umum','fidyah'].map(k=>`<td class="money">${udN(total[k])}</td>`).join('')}<td class="money ph-strong">${udN(grand)}</td>${admin()?'<td class="no-print"></td>':''}</tr></tfoot></table></div>`
      : emptyState('Belum ada data perhimpunan','Belum ada data untuk '+esc(desa.nama_desa)+' tahun '+esc(year)+'. Klik “Tambah UPZ DKM/RT/RW”.');
    content = table+`<h2 class="ud-sub no-print">Pratinjau cetak Form A1</h2><div class="ud-paper">${udPrintForm(c)}</div>`;
  }
  const opt = (v,l,sel)=>`<option value="${esc(v)}" ${sel?'selected':''}>${esc(l)}</option>`;
  return `<section class="panel ph-panel ud-panel"><div class="ph-heading"><p class="crumb">UPZ DESA / Perhimpunan</p><h1>Perhimpunan UPZ Desa</h1><p class="muted">Pengumpulan per UPZ DKM/RT/RW · Form A1 Desa dan Kelurahan${desa?' · '+esc(desa.nama_desa)+' · Tahun '+esc(year):''}</p></div>`+
    `<div class="toolbar no-print"><label class="ph-year">Desa/Kelurahan <select id="udDesaSel">${UD.desa.map(d=>opt(d.id,d.nama_desa,desa&&String(d.id)===String(desa.id))).join('')}</select></label>`+
    `<label class="ph-year">Tahun <select id="udYear">${years.map(y=>opt(y,y,y===year)).join('')}</select></label>`+
    `<label class="ph-year">Kepala Desa / Lurah <input id="udKades" maxlength="100" placeholder="Nama untuk tanda tangan" value="${esc(UD.kades!==null?UD.kades:(desa?.nama_kades||''))}"></label>`+
    `<label class="ph-year">Tanggal laporan <input id="udDate" type="date" max="9999-12-31" value="${esc(UD.date||today())}"></label>`+
    `<span class="ph-tools"><button type="button" class="secondary" id="udPrint">Cetak Form A1</button>${admin()?`<button type="button" data-ud="add:ph" ${desa?'':'disabled'}>Tambah UPZ DKM/RT/RW</button>`:''}</span></div>${content}</section>`;
}

function bindUd() {
  $('udDesaSel')?.addEventListener('change',e=>{UD.desaId=e.target.value;UD.year='';UD.kades=null;render();});
  $('udYear')?.addEventListener('change',e=>{UD.year=e.target.value;render();});
  $('udKades')?.addEventListener('input',e=>{UD.kades=e.target.value;const t=$('udKadesPrint');if(t)t.textContent=e.target.value;});
  $('udDate')?.addEventListener('input',e=>{if(!e.target.value)return;UD.date=e.target.value;const t=$('udDatePrint');if(t)t.textContent='Dilaporkan tanggal : '+phLongDate(UD.date);});
  $('udPrint')?.addEventListener('click',()=>window.print());
}

function udShowError(message) {
  const el = $('udError'); if(!el) return;
  if(/duplicate key/i.test(message)) el.textContent = 'Data dengan nama yang sama sudah ada.';
  else if(/row-level security/i.test(message)) el.textContent = 'Akses ditolak. Pastikan kamu masuk sebagai admin.';
  else if(/upz_desa|schema cache|does not exist/i.test(message)) el.innerHTML = `Jalankan <a href="${UD_SQL}" download>${UD_SQL}</a> di Supabase SQL Editor, lalu coba simpan lagi.`;
  else el.textContent = message;
}

async function udWrite(kind, record, body) {
  const demo = UD_DEMO[kind];
  if(simulated) {
    if(record) {const i=demo.findIndex(r=>r.id===record.id); if(i>=0) demo[i]={...record,...body};}
    else demo.push({...body,id:Math.max(0,...demo.map(r=>r.id))+1});
    return;
  }
  const table = kind==='desa' ? 'upz_desa' : 'upz_desa_perhimpunan';
  const result = await api('/rest/v1/'+table+(record?'?id=eq.'+encodeURIComponent(record.id):''),{method:record?'PATCH':'POST',body,token:session.access_token,extra:{Prefer:'return=representation'}});
  if(!result?.length) throw Error('Data tidak ditemukan atau akses ditolak.');
}

async function udRemove(kind, record) {
  const label = kind==='desa' ? record.nama_desa : record.nama_upz;
  const extra = kind==='desa' ? ' Seluruh data perhimpunan desa ini ikut terhapus.' : '';
  if(!await confirmDialog('Hapus '+label+'?','Data akan dihapus dan tidak dapat dikembalikan.'+extra)) return;
  try {
    if(simulated) {
      const demo = UD_DEMO[kind], i = demo.findIndex(r=>r.id===record.id);
      if(i>=0) demo.splice(i,1);
      if(kind==='desa') UD_DEMO.ph = UD_DEMO.ph.filter(r=>r.upz_desa_id!==record.id);
    } else {
      const table = kind==='desa' ? 'upz_desa' : 'upz_desa_perhimpunan';
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
      if(kind==='ph') UD.year = String(body.tahun);
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

function udEditPh(record) {
  const {desa,year} = udCurrent();
  if(!desa) return;
  const v = k => esc(record?.[k] ?? '');
  const num = (k,label,step='0.01') => `<label>${label}<input type="number" name="${k}" min="0" max="9999999999999" step="${step}" placeholder="0" value="${v(k)}"></label>`;
  const fields = `<p class="muted">UPZ Desa: <strong>${esc(desa.nama_desa)}</strong></p><label>Tahun<input type="number" name="tahun" min="2000" max="2100" required value="${esc(record?.tahun || year)}"></label>`+
    `<label>Nama UPZ DKM/RT/RW<input name="nama_upz" maxlength="120" required value="${v('nama_upz')}"></label><label>Kp/Dsn/Blok<input name="alamat_kp" maxlength="120" value="${v('alamat_kp')}"></label>`+
    `<div class="ph-grid"><label>RT<input name="rt" maxlength="10" value="${v('rt')}"></label><label>RW<input name="rw" maxlength="10" value="${v('rw')}"></label></div>`+
    num('jumlah_jiwa','Jumlah Jiwa (orang)','1')+`<div class="ph-grid">${num('zakat_fitrah','Zakat Fitrah (Rp)')}${num('beras_kg','Beras (kg)')}${num('bis_ramadhan','BIS Ramadhan (Rp)')}${num('zakat_mal','Zakat Mal (Rp)')}${num('infak_umum','Infak Umum (Rp)')}${num('fidyah','Fidyah (Rp)')}</div>`;
  udOpenDialog((record?'Edit':'Tambah')+' UPZ DKM/RT/RW',fields,'ph',record,f=>{
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
  const button = event.target.closest('[data-ud]');
  if(!button||!admin()) return;
  const [action,kind,id] = button.dataset.ud.split(':');
  if(action==='add') return kind==='desa' ? udEditDesa() : udEditPh();
  const record = (kind==='desa'?UD.desa:UD.ph).find(r=>String(r.id)===id);
  if(!record) return;
  if(action==='edit') kind==='desa' ? udEditDesa(record) : udEditPh(record);
  else udRemove(kind,record);
});
