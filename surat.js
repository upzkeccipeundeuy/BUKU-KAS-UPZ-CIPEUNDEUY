/* ---------- SURAT: surat menyurat. Admin mengetik dan mengelola; publik hanya melihat dan mencetak ---------- */
const SR_SQL = 'setup-surat-supabase.sql';
const SR_BA = 'Berita Acara';
const SR_JENIS = ['Surat Undangan','Surat Permohonan','Surat Pemberitahuan','Surat Keterangan','Surat Tugas',SR_BA];
const SR_FIELDS = ['jenis','tgl','lamp','hal','to','isi','s1','s2','mk','cc','tempat','p1n','p1j','p2n','p2j','saksi'];
const SR_NONE = '(tidak ada)';
/* Jabatan penandatangan -> [pola jabatan di Profil, bagian susunan pengurus]; nama diambil dari menu Profil */
const SR_ROLES = {
  'Ketua UPZ':[/^ketua(?!\s+(mui|bidang))/i,'pelaksana'],
  'Sekretaris':[/^sekretaris/i,'pelaksana'],
  'Bendahara':[/^bendahara/i,'pelaksana'],
  'Camat':[/^camat/i,'penasehat'],
  'Kepala KUA':[/^(kepala\s+)?kua/i,'penasehat'],
  'Ketua MUI':[/^(ketua\s+)?mui/i,'penasehat']
};
const SR = {rows:[],loading:false,failure:'',gen:0,cur:null,draft:null,saving:false};
const srEsc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const srBulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const srHari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const srSatuan = ['','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh','sebelas'];
const srTgl = iso => {const [y,m,d]=String(iso||'').split('-');return y&&m&&d?Number(d)+' '+srBulan[m-1]+' '+y:'…';};
function srTerbilang(n) {
  n = Number(n);
  if(n<12) return srSatuan[n];
  if(n<20) return srTerbilang(n-10)+' belas';
  if(n<100) return srTerbilang(Math.floor(n/10))+' puluh'+(n%10?' '+srSatuan[n%10]:'');
  if(n<200) return 'seratus'+(n%100?' '+srTerbilang(n%100):'');
  if(n<1000) return srTerbilang(Math.floor(n/100))+' ratus'+(n%100?' '+srTerbilang(n%100):'');
  if(n<2000) return 'seribu'+(n%1000?' '+srTerbilang(n%1000):'');
  return srTerbilang(Math.floor(n/1000))+' ribu'+(n%1000?' '+srTerbilang(n%1000):'');
}
const SR_KOSONG = () => ({jenis:SR_JENIS[0],tgl:today(),no:'',lamp:'',hal:'',to:'',isi:'',s1:'Sekretaris',s2:'Ketua UPZ',mk:SR_NONE,cc:'',tempat:'',p1n:'',p1j:'',p2n:'',p2j:'',saksi:''});
const SR_DEMO = () => [
  {id:3,jenis:SR_BA,tanggal:'2026-11-23',nomor:'003/UPZ.CPD/11/2026',perihal:'Serah Terima Dana Zakat Fitrah',isi:'Telah dilakukan serah terima dana zakat fitrah hasil pengumpulan UPZ Desa Sawangan tahun 2026 kepada UPZ Kecamatan Cipeundeuy sebesar Rp25.000.000,00 (dua puluh lima juta rupiah).\n\nPenyerahan dilakukan secara tunai, telah dihitung bersama oleh kedua belah pihak, dan disaksikan oleh para saksi.',mengetahui:'Camat',detail:{tempat:'Kantor Kecamatan Cipeundeuy',p1n:'Nama Ketua UPZ Desa',p1j:'Ketua UPZ Desa Sawangan',p2n:'Nama Bendahara UPZ',p2j:'Bendahara UPZ Kecamatan Cipeundeuy',saksi:'Nama Sekretaris — Sekretaris UPZ Kecamatan'}},
  {id:2,jenis:'Surat Undangan',tanggal:'2026-11-20',nomor:'002/UPZ.CPD/11/2026',perihal:'Undangan Rapat Pengurus UPZ',tujuan:'Bapak/Ibu Pengurus UPZ Kecamatan Cipeundeuy\ndi Tempat',isi:'Dengan hormat, sehubungan dengan evaluasi penghimpunan dan pendistribusian zakat tahun 2026, kami mengundang Bapak/Ibu untuk hadir pada rapat pengurus yang akan dilaksanakan pada:\n\nHari/Tanggal : Senin, 30 November 2026\nWaktu : 09.00 WIB – selesai\nTempat : Kantor Kecamatan Cipeundeuy\n\nDemikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.',mengetahui:'Camat',tembusan:'Camat Cipeundeuy\nArsip',detail:{s1:'Sekretaris',s2:'Ketua UPZ'}},
  {id:1,jenis:'Surat Permohonan',tanggal:'2026-11-12',nomor:'001/UPZ.CPD/11/2026',lampiran:'1 (satu) berkas',perihal:'Permohonan Data Mustahik',tujuan:'Kepala Desa Sawangan\ndi Tempat',isi:'Dengan hormat, dalam rangka pendataan mustahik tahun 2026, kami memohon bantuan Bapak untuk menyampaikan data warga yang memenuhi kriteria penerima zakat di wilayah Desa Sawangan.\n\nDemikian permohonan ini kami sampaikan. Atas bantuan dan kerja samanya kami ucapkan terima kasih.',tembusan:'Arsip',detail:{s1:'Sekretaris',s2:'Ketua UPZ'}}
];

/* ---------- Nomor otomatis: no urut/UPZ.CPD/bulan/tahun (urut per bulan) ---------- */
const srNomorFormat = (urut,y,m) => String(urut).padStart(3,'0')+'/UPZ.CPD/'+m+'/'+y;
function srAutoNo(tgl, exceptId) {
  const [y,m] = String(tgl||'').split('-');
  if(!y||!m) return '';
  let max = 0;
  for(const r of SR.rows) {
    if(r.id===exceptId) continue;
    const x = /^(\d+)\/UPZ\.CPD\/(\d{2})\/(\d{4})$/.exec(r.nomor||'');
    if(x&&x[2]===m&&x[3]===y) max = Math.max(max,Number(x[1]));
  }
  return srNomorFormat(max+1,y,m);
}
/* Saat menyimpan, nomor dihitung ulang dari data terbaru di server agar tidak bentrok. */
async function srNomorBaru(tgl, exceptId) {
  if(simulated) return srAutoNo(tgl,exceptId);
  const [y,m] = tgl.split('-');
  const list = await api('/rest/v1/surat?select=id,nomor&nomor=like.'+encodeURIComponent('*/UPZ.CPD/'+m+'/'+y)+'&limit=1000',{token:session.access_token});
  let max = 0;
  for(const r of (list||[])) {
    if(r.id===exceptId) continue;
    const x = /^(\d+)\//.exec(r.nomor||'');
    if(x) max = Math.max(max,Number(x[1]));
  }
  return srNomorFormat(max+1,y,m);
}

/* ---------- Penandatangan (nama diambil dari Profil, disimpan saat surat disimpan) ---------- */
function srNama(role) {
  const rule = SR_ROLES[role];
  if(!rule || typeof officersNormalized!=='function') return '';
  const found = officersNormalized(profile?.pengurus).find(o=>rule[0].test(String(o.jabatan||'').trim())&&o.bagian===rule[1]);
  return String(found?.nama||'').trim();
}
function srTtd(d, saved) {
  const pick = (role,slot) => role&&role!==SR_NONE ? {j:role,n:(saved?.[slot]?.j===role&&saved[slot].n)||srNama(role)} : null;
  return {kiri:pick(d.s1,'kiri'),kanan:pick(d.s2,'kanan'),mk:pick(d.mk,'mk')};
}
const srSavedTtd = () => SR.rows.find(r=>r.id===SR.cur)?.detail?.ttd;

/* ---------- Tampilan kertas surat (dipakai untuk pratinjau dan cetak) ---------- */
function srKop() {
  const i = profile?.identitas || {};
  const logo = (typeof profileImage==='function'&&profileImage(i.foto)) || 'logo-baznas.png';
  const kontak = [i.alamat?profileAddress(i.alamat):'',[i.telepon?'Telp. '+i.telepon:'',i.email].filter(Boolean).join(' · ')].filter(Boolean);
  return '<div class="sr-kop"><img src="'+srEsc(logo)+'" alt=""><div><b>UNIT PENGUMPUL ZAKAT (UPZ)<br>KECAMATAN CIPEUNDEUY</b><span>BAZNAS Kabupaten Subang</span>'+kontak.map(x=>'<span>'+srEsc(x)+'</span>').join('')+'</div></div>';
}
const srLines = s => String(s||'').split('\n').filter(x=>x.trim());
function srParas(text) {
  return String(text||'').split(/\n\s*\n/).filter(x=>x.trim()).map(p=>{
    const lines = p.split('\n');
    return /^\S[^:\n]{0,20}\s:\s/.test(p) ? '<p class="n">'+lines.map(srEsc).join('<br>')+'</p>' : '<p>'+lines.map(srEsc).join(' ')+'</p>';
  }).join('');
}
function srSig(title, jabatan, nama) {
  const label = [title,jabatan].filter(Boolean).map(srEsc).join('<br>');
  return '<div>'+label+'<i></i>'+(nama?'<u>'+srEsc(nama)+'</u>':'<span>………………………</span>')+'</div>';
}
const srMengetahui = t => t.mk ? '<div class="sr-sign" style="margin-top:.5em">'+srSig('Mengetahui,',t.mk.j,t.mk.n)+'</div>' : '';
const srTembusan = d => {const cc=srLines(d.cc);return cc.length?'<div class="sr-cc">Tembusan:<ol>'+cc.map(c=>'<li>'+srEsc(c)+'</li>').join('')+'</ol></div>':'';};
function srPaperSurat(d, t) {
  return srKop()+
    '<div class="sr-meta"><table><tr><td>Nomor</td><td>: '+srEsc(d.no||'…')+'</td></tr><tr><td>Lampiran</td><td>: '+srEsc(d.lamp.trim()||'–')+'</td></tr><tr><td>Perihal</td><td>: <b>'+srEsc(d.hal||'…')+'</b></td></tr></table><div>Cipeundeuy, '+srTgl(d.tgl)+'</div></div>'+
    '<div class="sr-to">Kepada Yth.<br>'+(d.to.trim()?srLines(d.to).map(srEsc).join('<br>'):'…')+'</div>'+
    '<div class="sr-body"><p class="n">Assalamu’alaikum Wr. Wb.</p>'+(srParas(d.isi)||'<p>…</p>')+'<p class="n">Wassalamu’alaikum Wr. Wb.</p></div>'+
    '<div class="sr-sign">'+(t.kiri?srSig('',t.kiri.j,t.kiri.n):'<div></div>')+(t.kanan?srSig('',t.kanan.j,t.kanan.n):'<div></div>')+'</div>'+
    srMengetahui(t)+srTembusan(d);
}
function srPaperBA(d, t) {
  const [y,m,day] = String(d.tgl||'').split('-');
  const when = d.tgl ? 'Pada hari ini '+srHari[new Date(y,m-1,day).getDay()]+' tanggal '+srTerbilang(day)+' bulan '+srBulan[m-1]+' tahun '+srTerbilang(y)+' ('+srTgl(d.tgl)+')' : 'Pada hari ini …';
  const tempat = d.tempat.trim() ? ', bertempat di '+srEsc(d.tempat.trim()) : '';
  const dua = d.p2n.trim()||d.p2j.trim();
  const pihak = (n,j,i,ket) => '<table class="sr-pk"><tr><td>'+i+'.</td><td>Nama</td><td>: '+srEsc(n||'…')+'</td></tr><tr><td></td><td>Jabatan</td><td>: '+srEsc(j||'…')+'</td></tr></table><p class="n" style="margin:0 0 .4em 2.3em">'+ket+'</p>';
  const saksi = srLines(d.saksi).map((x,k)=>{const [n,j]=x.split(/\s[—–-]\s/);return srSig('Saksi '+(k+1),j,n);});
  return srKop()+
    '<div class="sr-bat"><b><u>BERITA ACARA</u></b><br><b>'+srEsc((d.hal||'…').toUpperCase())+'</b><br>Nomor : '+srEsc(d.no||'…')+'</div>'+
    '<div class="sr-body"><p>'+when+tempat+', kami yang bertanda tangan di bawah ini:</p>'+
    pihak(d.p1n,d.p1j,1,'selanjutnya disebut <b>PIHAK PERTAMA</b>'+(dua?',':'.'))+(dua?pihak(d.p2n,d.p2j,2,'selanjutnya disebut <b>PIHAK KEDUA</b>.'):'')+
    (srParas(d.isi)||'<p>…</p>')+'<p>Demikian Berita Acara ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.</p></div>'+
    '<div class="sr-sign" style="flex-wrap:wrap">'+srSig('PIHAK PERTAMA',d.p1j,d.p1n)+(dua?srSig('PIHAK KEDUA',d.p2j,d.p2n):'')+'</div>'+
    (saksi.length?'<div class="sr-sign" style="flex-wrap:wrap;margin-top:.5em">'+saksi.join('')+'</div>':'')+
    srMengetahui(t)+srTembusan(d);
}
const srPaper = (d,t) => d.jenis===SR_BA ? srPaperBA(d,t) : srPaperSurat(d,t);

/* ---------- Data ---------- */
const srRowToDraft = r => {
  const dt = r.detail || {};
  return {jenis:r.jenis,tgl:r.tanggal,no:r.nomor,lamp:r.lampiran||'',hal:r.perihal||'',to:r.tujuan||'',isi:r.isi||'',s1:dt.s1||'Sekretaris',s2:dt.s2||'Ketua UPZ',mk:r.mengetahui||SR_NONE,cc:r.tembusan||'',tempat:dt.tempat||'',p1n:dt.p1n||'',p1j:dt.p1j||'',p2n:dt.p2n||'',p2j:dt.p2j||'',saksi:dt.saksi||''};
};
function srNew() {
  SR.cur = null;
  SR.draft = SR_KOSONG();
  SR.draft.no = srAutoNo(SR.draft.tgl,null);
}
async function loadSurat() {
  const stamp = ++SR.gen;
  SR.loading = true; SR.failure = ''; render();
  try {
    if(simulated) {if(!SR.demoReady) {SR.rows = SR_DEMO(); SR.demoReady = true;}}
    else {SR.demoReady = false; SR.rows = await api('/rest/v1/surat?select=*&order=tanggal.desc,id.desc&limit=2000',{token:session?.access_token});}
  } catch(error) {
    if(stamp!==SR.gen) return;
    SR.rows = [];
    SR.failure = /surat|schema cache|does not exist|relation/i.test(error.message) ? 'Tabel surat belum dibuat. Jalankan '+SR_SQL+' sekali di Supabase SQL Editor.' : friendlyError;
  } finally {
    if(stamp===SR.gen) {
      SR.loading = false;
      if(admin()) srNew(); else SR.cur = SR.rows[0]?.id ?? null;
      render();
    }
  }
}
async function srSave() {
  if(!admin()||SR.saving) return;
  const d = SR.draft, ba = d.jenis===SR_BA;
  const fail = msg => toast(msg,'error');
  if(!d.tgl) return fail('Tanggal surat wajib diisi.');
  if(!d.hal.trim()) return fail('Perihal wajib diisi.');
  if(!d.isi.trim()) return fail('Isi surat wajib diisi.');
  if(ba&&!d.p1n.trim()&&!d.p1j.trim()) return fail('Pihak pertama wajib diisi.');
  SR.saving = true;
  const btn = $('srSave'); if(btn) btn.disabled = true;
  try {
    const old = SR.cur!=null ? SR.rows.find(r=>r.id===SR.cur) : null;
    const body = {
      jenis:d.jenis, tanggal:d.tgl, lampiran:ba?null:(d.lamp.trim()||null), perihal:d.hal.trim(), tujuan:ba?null:(d.to.trim()||null),
      isi:d.isi.trim(), tembusan:d.cc.trim()||null, mengetahui:d.mk===SR_NONE?null:d.mk, diubah:new Date().toISOString(),
      detail:{s1:d.s1,s2:d.s2,tempat:d.tempat.trim(),p1n:d.p1n.trim(),p1j:d.p1j.trim(),p2n:d.p2n.trim(),p2j:d.p2j.trim(),saksi:d.saksi.trim(),ttd:srTtd(d,old?.detail?.ttd)}
    };
    const samePeriod = old && old.tanggal.slice(0,7)===d.tgl.slice(0,7);
    let saved = null;
    for(let attempt=0; attempt<3 && !saved; attempt++) {
      body.nomor = samePeriod ? old.nomor : await srNomorBaru(d.tgl,old?.id);
      if(simulated) {saved = {...(old||{}),...body,id:old?.id||Date.now()}; break;}
      try {
        const token = session.access_token, extra = {Prefer:'return=representation'};
        const res = old ? await api('/rest/v1/surat?id=eq.'+old.id,{method:'PATCH',body,token,extra}) : await api('/rest/v1/surat',{method:'POST',body,token,extra});
        saved = Array.isArray(res) ? res[0] : res;
        if(!saved) throw Error('Surat tidak tersimpan. Periksa hak akses admin di Supabase.');
      } catch(error) {
        if(/duplicate|unique|23505/i.test(error.message) && attempt<2) continue; // nomor bentrok: hitung ulang
        throw error;
      }
    }
    SR.rows = [saved,...SR.rows.filter(r=>r.id!==saved.id)].sort((a,b)=>b.tanggal.localeCompare(a.tanggal)||b.id-a.id);
    SR.cur = saved.id; SR.draft = srRowToDraft(saved);
    toast('Surat disimpan. Nomor: '+saved.nomor);
  } catch(error) {
    SR.saving = false;
    fail(/surat|schema cache|does not exist|relation/i.test(error.message) ? 'Tabel surat belum dibuat. Jalankan '+SR_SQL+' di Supabase.' : error.message);
    if(btn) btn.disabled = false;
    return;
  }
  SR.saving = false;
  render();
}
async function srDelete() {
  const old = SR.rows.find(r=>r.id===SR.cur);
  if(!admin()||!old) return;
  if(!await confirmDialog('Hapus surat?','Surat "'+old.perihal+'" ('+old.nomor+') akan dihapus permanen.')) return;
  try {
    if(!simulated) await api('/rest/v1/surat?id=eq.'+old.id,{method:'DELETE',token:session.access_token});
    SR.rows = SR.rows.filter(r=>r.id!==old.id);
    srNew(); toast('Surat dihapus.'); render();
  } catch(error) {toast(error.message,'error');}
}

/* ---------- Halaman ---------- */
function srForm(d) {
  const opt = (list,v) => list.map(x=>'<option'+(x===v?' selected':'')+'>'+srEsc(x)+'</option>').join('');
  const L = (label,control,cls='') => '<label'+(cls?' class="'+cls+'"':'')+'>'+label+control+'</label>';
  const inp = (id,ph='',type='text') => '<input id="sr_'+id+'" type="'+type+'" maxlength="200" placeholder="'+srEsc(ph)+'" value="'+srEsc(d[id])+'">';
  const ta = (id,ph='',h='') => '<textarea id="sr_'+id+'" maxlength="20000" placeholder="'+srEsc(ph)+'"'+(h?' style="min-height:'+h+'px"':'')+'>'+srEsc(d[id])+'</textarea>';
  return '<form id="srForm" class="sr-form'+(d.jenis===SR_BA?' isba':'')+'" autocomplete="off" onsubmit="return false">'+
    L('Jenis surat','<select id="sr_jenis">'+opt(SR_JENIS,d.jenis)+'</select>')+
    L('Tanggal surat','<input id="sr_tgl" type="date" max="9999-12-31" required value="'+srEsc(d.tgl)+'">')+
    L('Nomor surat (otomatis)','<input id="sr_no" readonly value="'+srEsc(d.no)+'"><span class="sr-hint">Urut per bulan, mengikuti tanggal surat.</span>','full')+
    L('Lampiran',inp('lamp','1 (satu) berkas, atau kosongkan'),'full nba')+
    L('Perihal',inp('hal','Contoh: Undangan Rapat Pengurus'),'full')+
    L('Kepada Yth.',ta('to','Bapak/Ibu …\ndi Tempat','62'),'full nba')+
    '<div class="ba">'+
      L('Bertempat di',inp('tempat','Kantor Kecamatan Cipeundeuy'),'full')+
      L('Pihak pertama — nama',inp('p1n'))+L('Pihak pertama — jabatan',inp('p1j','Bendahara UPZ'))+
      L('Pihak kedua — nama',inp('p2n'))+L('Pihak kedua — jabatan',inp('p2j','Kosongkan jika hanya satu pihak'))+
      L('Saksi (satu per baris, opsional)',ta('saksi','Nama — Jabatan','62'),'full')+
    '</div>'+
    L('Isi surat',ta('isi','Tulis isi surat. Pisahkan paragraf dengan satu baris kosong.')+'<span class="sr-hint nba">Salam pembuka dan penutup ditambahkan otomatis.</span><span class="sr-hint ba2">Tulis uraian atau kesepakatan. Kalimat pembuka dan penutup berita acara ditambahkan otomatis.</span>','full')+
    L('Penandatangan kiri','<select id="sr_s1">'+opt(['Sekretaris','Bendahara',SR_NONE],d.s1)+'</select>','nba')+
    L('Penandatangan kanan','<select id="sr_s2">'+opt(['Ketua UPZ','Camat'],d.s2)+'</select>','nba')+
    L('Mengetahui (opsional)','<select id="sr_mk">'+opt([SR_NONE,'Camat','Kepala KUA','Ketua MUI'],d.mk)+'</select><span class="sr-hint">Nama penandatangan diambil dari menu Profil › Susunan Pengurus.</span>','full')+
    L('Tembusan (satu per baris)',ta('cc','','62'),'full')+
    '<div class="sr-actions"><button type="button" id="srSave">Simpan Surat</button><button type="button" class="secondary" id="srPrint2">Cetak / PDF</button>'+(SR.cur!=null?'<button type="button" class="danger" id="srDel">Hapus</button>':'')+'</div></form>';
}
function suratPage() {
  const adm = admin();
  const head = '<div class="no-print"><p class="crumb">Surat</p><h1>Surat Menyurat</h1><p class="muted">'+(adm?'Ketik dan kelola surat resmi UPZ. Nomor surat dibuat otomatis.':'Daftar surat resmi UPZ. Pilih surat untuk melihat dan mencetak.')+'</p></div>';
  if(SR.loading) return '<section class="panel">'+head+skeletonRows(4)+'</section>';
  if(SR.failure) return '<section class="panel">'+head+emptyState('Surat belum dapat dimuat',esc(SR.failure))+'</section>';
  if(adm&&!SR.draft) srNew();
  if(!adm&&SR.cur==null&&SR.rows[0]) SR.cur = SR.rows[0].id;
  const row = SR.rows.find(r=>r.id===SR.cur) || null;
  let paper = '';
  if(adm) paper = srPaper(SR.draft,srTtd(SR.draft,row?.detail?.ttd));
  else if(row) {const d=srRowToDraft(row); paper = srPaper(d,row.detail?.ttd||srTtd(d));}
  const list = SR.rows.length ? SR.rows.map(r=>'<button type="button" class="sr-item'+(r.id===SR.cur?' on':'')+'" data-sr-id="'+srEsc(r.id)+'"><span><b>'+srEsc(r.perihal)+'</b><small>'+srEsc(r.nomor)+' · '+srTgl(r.tanggal)+'</small></span><span class="sr-tag">'+srEsc(String(r.jenis).replace('Surat ',''))+'</span></button>').join('') : emptyState('Belum ada surat',adm?'Ketik surat pertama pada formulir di bawah.':'');
  return '<div class="surat-page">'+head+'<div class="sr-grid">'+
    '<section class="panel no-print"><div class="toolbar"><h2>Daftar Surat</h2>'+(adm?'<button type="button" id="srNew">+ Surat Baru</button>':'')+'</div><div class="sr-list">'+list+'</div>'+(adm?'<div class="toolbar"><h2>'+(SR.cur!=null?'Ubah Surat':'Ketik Surat Baru')+'</h2></div>'+srForm(SR.draft):'')+'</section>'+
    '<section class="panel"><div class="toolbar no-print"><h2>Pratinjau Surat</h2><button type="button" class="secondary" id="srPrint">Cetak / PDF</button></div><div class="sr-stage"><div class="surat-paper" id="srPaper">'+(paper||emptyState('Pilih surat dari daftar'))+'</div></div></section>'+
    '</div></div>';
}
const srRefresh = () => {const el=$('srPaper'); if(el) el.innerHTML = srPaper(SR.draft,srTtd(SR.draft,srSavedTtd()));};
function srSetNo() {
  const old = SR.rows.find(r=>r.id===SR.cur);
  SR.draft.no = old && old.tanggal.slice(0,7)===SR.draft.tgl.slice(0,7) ? old.nomor : srAutoNo(SR.draft.tgl,SR.cur);
  $('sr_no').value = SR.draft.no;
}
function bindSurat() {
  document.querySelectorAll('[data-sr-id]').forEach(b=>b.onclick=()=>{
    const row = SR.rows.find(r=>String(r.id)===b.dataset.srId);
    if(!row) return;
    SR.cur = row.id;
    if(admin()) SR.draft = srRowToDraft(row);
    render();
    $('srPaper')?.scrollIntoView({block:'nearest'});
  });
  $('srNew')?.addEventListener('click',()=>{srNew();render();});
  $('srPrint')?.addEventListener('click',()=>window.print());
  $('srPrint2')?.addEventListener('click',()=>window.print());
  const form = $('srForm');
  if(!form) return;
  for(const key of SR_FIELDS) {
    const el = $('sr_'+key);
    el.addEventListener('input',()=>{
      SR.draft[key] = el.value;
      if(key==='tgl') srSetNo();
      if(key==='jenis') form.classList.toggle('isba',el.value===SR_BA);
      srRefresh();
    });
  }
  $('srSave').addEventListener('click',srSave);
  $('srDel')?.addEventListener('click',srDelete);
}
