/* ---------- Ekspor & Impor Excel (UPZ DESA › Perhimpunan & Pendistribusian) ----------
   Memakai SheetJS (XLSX) yang dimuat dari CDN di index.html. Setiap aksi menampilkan pratinjau
   di dialog sebelum berkas diunduh (ekspor) atau data disimpan ke server (impor). */
const XL_COLS = [
  {key:'nama_upz',  label:'Nama UPZ DKM/RT/RW', text:true, alias:['nama upz dkm/rt/rw','nama upz','nama','nama dkm','nama upz dkm rt rw']},
  {key:'alamat_kp', label:'Kp/Dsn/Blok',        text:true, alias:['kp/dsn/blok','kp dsn blok','alamat','kampung','dusun','blok']},
  {key:'rt',        label:'RT',                 text:true, alias:['rt']},
  {key:'rw',        label:'RW',                 text:true, alias:['rw']},
  {key:'jumlah_jiwa',  label:'Jiwa',            alias:['jiwa','jumlah jiwa','jumlah jiwa (orang)']},
  {key:'zakat_fitrah', label:'Zakat Fitrah (Rp)', alias:['zakat fitrah','zakat fitrah (rp)','fitrah']},
  {key:'beras_kg',     label:'Beras (kg)',      alias:['beras','beras (kg)','beras kg']},
  {key:'bis_ramadhan', label:'BIS Ramadhan',    alias:['bis ramadhan','bis ramadan','bis','bis ramadhan (rp)']},
  {key:'zakat_mal',    label:'Zakat Mal',       alias:['zakat mal','zakat maal','mal']},
  {key:'infak_umum',   label:'Infak Umum',      alias:['infak umum','infaq umum','infak','infaq']},
  {key:'fidyah',       label:'Fidyah',          alias:['fidyah','fidiah']}
];
const XL_NUM = XL_COLS.filter(c=>!c.text).map(c=>c.key);
const xlNorm = s => String(s??'').toLowerCase().replace(/\s+/g,' ').trim();
const xlKey = r => [xlNorm(r.nama_upz),xlNorm(r.alamat_kp),...[r.rt,r.rw].map(v=>xlNorm(v).replace(/^0+(?=\d)/,''))].join('|'); // RT/RW "001" dan 1 dianggap sama
const xlSafe = s => String(s||'').replace(/[^\w\-]+/g,'_').replace(/^_+|_+$/g,'') || 'data';
const xlReady = () => {
  if(typeof XLSX==='undefined') {toast('Pustaka Excel belum termuat. Periksa koneksi internet lalu muat ulang halaman.','error');return false;}
  return true;
};
/* Angka dari sel Excel: menerima angka asli maupun teks berformat Indonesia ("29.600.000", "1.250,50", "Rp 5.000") */
function xlParseNum(v) {
  if(v===null||v===undefined||v==='') return {n:0};
  if(typeof v==='number') return Number.isFinite(v) ? {n:v} : {err:true};
  let s = String(v).replace(/rp|kg|\s/gi,'').trim();
  if(s===''||s==='-') return {n:0};
  if(s.includes(',')) s = s.replace(/\./g,'').replace(',','.');
  else if(/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g,'');
  const n = Number(s);
  return Number.isFinite(n) ? {n} : {err:true};
}
const xlTotals = list => {
  const t = {}; XL_NUM.forEach(k=>{t[k]=list.reduce((s,r)=>s+Number(r[k]||0),0);});
  t.jumlah = list.reduce((s,r)=>s+phJumlah(r),0); return t;
};
const xlHeadRow = () => '<tr><th>No</th>'+XL_COLS.map(c=>'<th>'+esc(c.label)+'</th>').join('')+'<th>Jumlah (Rp)</th>';

function xlOpenDialog(html) {
  const d = $('modal');
  d.innerHTML = html; d.classList.add('xl-dialog');
  d.addEventListener('close',()=>d.classList.remove('xl-dialog'),{once:true});
  if(!d.open) d.showModal();
  return d;
}

/* ---------- EKSPOR ---------- */
function xlExportRows(list) {
  const header = ['No',...XL_COLS.map(c=>c.label),'Jumlah (Rp)'];
  const body = list.map((r,i)=>[i+1,...XL_COLS.map(c=>c.text?(r[c.key]??''):Number(r[c.key]||0)),phJumlah(r)]);
  const t = xlTotals(list);
  const total = ['','JUMLAH RP.','','','',...XL_NUM.map(k=>t[k]),t.jumlah];
  return [header,...body,total];
}

function udExportPreview(kind) {
  if(!xlReady()) return;
  const T = UD_TXT[kind], c = udCurrent(kind), {desa,year,list} = c;
  if(!desa) return toast('Belum ada UPZ Desa.','error');
  if(!list.length) return toast('Belum ada data '+T.noun+' untuk diekspor.','error');
  const t = xlTotals(list);
  const rows = list.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.nama_upz)+'</td><td>'+esc(r.alamat_kp||'')+'</td><td>'+esc(r.rt||'')+'</td><td>'+esc(r.rw||'')+'</td>'+
    XL_NUM.map(k=>'<td class="money">'+udN(r[k])+'</td>').join('')+'<td class="money ph-strong">'+udN(phJumlah(r))+'</td></tr>').join('');
  const foot = '<tr class="xl-total"><td></td><td>JUMLAH RP.</td><td colspan="3"></td>'+XL_NUM.map(k=>'<td class="money">'+udN(t[k])+'</td>').join('')+'<td class="money ph-strong">'+udN(t.jumlah)+'</td></tr>';
  const fname = `${T.noun}-${xlSafe(desa.nama_desa)}-${year}.xlsx`;
  const d = xlOpenDialog(`<h2>Pratinjau Ekspor Excel</h2><p class="muted">${esc(T.h1)} · ${esc(desa.nama_desa)} · Tahun ${esc(year)} · ${list.length} baris.<br>Berkas: <strong>${esc(fname)}</strong></p>`+
    `<div class="scroll xl-scroll"><table class="ph-table">${'<thead>'+xlHeadRow()+'</tr></thead>'}<tbody>${rows}${foot}</tbody></table></div>`+
    `<div class="toolbar"><button type="button" id="xlDoExport">Unduh .xlsx</button><button type="button" class="secondary" id="xlCancel">Tutup</button></div>`);
  $('xlCancel').onclick = () => d.close();
  $('xlDoExport').onclick = () => {
    try {
      const ws = XLSX.utils.aoa_to_sheet(xlExportRows(list));
      ws['!cols'] = [5,28,22,6,6,8,16,10,16,14,14,12,16].map(wch=>({wch}));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb,ws,(kind==='ph'?'Perhimpunan':'Pendistribusian'));
      XLSX.writeFile(wb,fname);
      d.close(); toast('Berkas Excel berhasil diunduh.');
    } catch(e) {toast('Ekspor gagal. '+e.message,'error');}
  };
}

/* ---------- TEMPLAT ---------- */
function udDownloadTemplate(kind) {
  if(!xlReady()) return;
  const T = UD_TXT[kind];
  const ws = XLSX.utils.aoa_to_sheet([
    XL_COLS.map(c=>c.label),
    ['DKM AL-HUDA','DSN.III CIPEUNDEUY','001','001',800,29600000,0,2400000,0,0,0]
  ]);
  ws['!cols'] = [28,22,6,6,8,16,10,16,14,14,12].map(wch=>({wch}));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Data');
  XLSX.writeFile(wb,'templat-'+T.noun+'.xlsx');
}

/* ---------- IMPOR ---------- */
function xlParseSheet(aoa) {
  // cari baris judul: baris pertama yang memuat kolom "nama"
  const hi = aoa.findIndex(row=>(row||[]).some(c=>/^nama/.test(xlNorm(c))));
  if(hi<0) throw Error('Baris judul tidak ditemukan. Pastikan ada kolom “Nama UPZ DKM/RT/RW”. Gunakan tombol Templat jika ragu.');
  const map = {};
  (aoa[hi]||[]).forEach((cell,ci)=>{
    const h = xlNorm(cell);
    const col = XL_COLS.find(c=>!(c.key in map) && (xlNorm(c.label)===h || c.alias.includes(h)));
    if(col) map[col.key] = ci;
  });
  if(!('nama_upz' in map)) throw Error('Kolom “Nama UPZ DKM/RT/RW” tidak ditemukan.');
  const items = [];
  for(let i=hi+1;i<aoa.length;i++) {
    const row = aoa[i]||[];
    const get = k => k in map ? row[map[k]] : undefined;
    const nama = String(get('nama_upz')??'').trim();
    if(!nama) continue;                          // baris kosong / baris total tanpa nama
    if(/^jumlah\b|^total\b/i.test(nama)) continue; // baris total dari berkas ekspor
    const body = {nama_upz:nama.slice(0,120),alamat_kp:String(get('alamat_kp')??'').trim().slice(0,120)||null,rt:String(get('rt')??'').trim().slice(0,10)||null,rw:String(get('rw')??'').trim().slice(0,10)||null};
    const errors = [];
    for(const k of XL_NUM) {
      const p = xlParseNum(get(k));
      if(p.err) {errors.push(XL_COLS.find(c=>c.key===k).label+' bukan angka');body[k]=0;continue;}
      if(p.n<0) {errors.push(XL_COLS.find(c=>c.key===k).label+' negatif');body[k]=0;continue;}
      body[k] = k==='jumlah_jiwa' ? Math.round(p.n) : p.n;
    }
    items.push({line:i+1,body,errors});
  }
  return items;
}

function xlClassify(items, kind) {
  const {desa,year,list} = udCurrent(kind);
  const existing = new Map(list.map(r=>[xlKey(r),r]));
  const seen = new Set();
  items.forEach(it=>{
    const k = xlKey(it.body);
    it.record = existing.get(k)||null;
    if(seen.has(k)) it.errors.push('duplikat di berkas');
    seen.add(k);
    it.status = it.errors.length ? 'error' : it.record ? 'update' : 'baru';
  });
  return {desa,year};
}

function udImportPreview(kind, fileName, items) {
  const T = UD_TXT[kind];
  const {desa,year} = xlClassify(items,kind);
  const cnt = s => items.filter(i=>i.status===s).length;
  const nBaru = cnt('baru'), nUpd = cnt('update'), nErr = cnt('error');
  const label = {baru:'Baru',update:'Perbarui',error:'Error'};
  const rows = items.map((it,i)=>'<tr class="xl-'+it.status+'"><td>'+(i+1)+'</td><td><span class="xl-badge xl-b-'+it.status+'">'+label[it.status]+'</span></td><td>'+esc(it.body.nama_upz)+'</td><td>'+esc(it.body.alamat_kp||'')+'</td><td>'+esc(it.body.rt||'')+'</td><td>'+esc(it.body.rw||'')+'</td>'+
    XL_NUM.map(k=>'<td class="money">'+udN(it.body[k])+'</td>').join('')+'<td class="money ph-strong">'+udN(phJumlah(it.body))+'</td><td class="xl-note">'+esc(it.errors.join('; '))+'</td></tr>').join('');
  const good = items.filter(i=>i.status!=='error');
  const t = xlTotals(good.map(i=>i.body));
  const d = xlOpenDialog(`<h2>Pratinjau Impor Excel</h2><p class="muted">Berkas <strong>${esc(fileName)}</strong> → ${esc(T.h1)} · <strong>${esc(desa.nama_desa)}</strong> · Tahun <strong>${esc(year)}</strong>.<br>`+
    `<span class="xl-badge xl-b-baru">${nBaru} baru</span> <span class="xl-badge xl-b-update">${nUpd} diperbarui</span> <span class="xl-badge xl-b-error">${nErr} error</span> — baris error dilewati. Baris yang nama, alamat, RT, dan RW-nya sama dengan data yang ada akan memperbarui data tersebut.</p>`+
    `<div class="scroll xl-scroll"><table class="ph-table"><thead><tr><th>#</th><th>Status</th>${XL_COLS.map(c=>'<th>'+esc(c.label)+'</th>').join('')}<th>Jumlah (Rp)</th><th>Catatan</th></tr></thead><tbody>${rows}</tbody>`+
    `<tfoot><tr><td></td><td></td><td>JUMLAH (baris valid)</td><td colspan="3"></td>${XL_NUM.map(k=>'<td class="money">'+udN(t[k])+'</td>').join('')}<td class="money ph-strong">${udN(t.jumlah)}</td><td></td></tr></tfoot></table></div>`+
    `<div id="udError" role="alert"></div><div class="toolbar"><button type="button" id="xlApply" ${good.length?'':'disabled'}>Impor ${good.length} baris</button><button type="button" class="secondary" id="xlCancel">Batal</button></div>`);
  $('xlCancel').onclick = () => d.close();
  $('xlApply').onclick = async () => {
    const btns = [$('xlApply'),$('xlCancel')]; btns.forEach(b=>b.disabled=true);
    let ok = 0;
    try {
      for(const it of good) {
        $('xlApply').textContent = 'Menyimpan '+(ok+1)+' / '+good.length+'…';
        await udWrite(kind,it.record,{...it.body,upz_desa_id:desa.id,tahun:Number(year)});
        ok++;
      }
      UD.year = String(year);
      d.close(); await loadUd();
      toast(ok+' baris berhasil diimpor.');
    } catch(e) {
      udShowError(e.message+(ok?' ('+ok+' baris sebelumnya sudah tersimpan.)':''));
      btns.forEach(b=>b.disabled=false); $('xlApply').textContent = 'Coba lagi';
      if(ok) {UD.year=String(year); await loadUd().catch(()=>{});}
    }
  };
}

async function udHandleImportFile(kind, file) {
  if(!file) return;
  if(!xlReady()) return;
  if(file.size>5*1024*1024) return toast('Ukuran berkas maksimal 5 MB.','error');
  try {
    const wb = XLSX.read(await file.arrayBuffer(),{type:'array'});
    const ws = wb.Sheets[wb.SheetNames[0]];
    const aoa = XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true});
    const items = xlParseSheet(aoa);
    if(!items.length) return toast('Tidak ada baris data yang dapat dibaca.','error');
    if(items.length>1000) return toast('Maksimal 1.000 baris per impor.','error');
    udImportPreview(kind,file.name,items);
  } catch(e) {toast('Berkas gagal dibaca. '+e.message,'error');}
}

/* Pengikatan tombol: dipanggil dari bindUd() setiap halaman dirender */
function bindUdExcel() {
  const kind = screen==='Pendistribusian Desa' ? 'pd' : screen==='Perhimpunan Desa' ? 'ph' : null;
  if(!kind) return;
  $('udXlExport')?.addEventListener('click',()=>udExportPreview(kind));
  $('udXlTemplate')?.addEventListener('click',()=>udDownloadTemplate(kind));
  $('udXlImport')?.addEventListener('click',()=>$('udXlFile')?.click());
  $('udXlFile')?.addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';udHandleImportFile(kind,f);});
}
