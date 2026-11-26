/* ---------- SURAT: surat menyurat. Admin mengetik dan mengelola; publik hanya melihat dan mencetak ---------- */
const SR_SQL = 'setup-surat-supabase.sql';
const SR_BA = 'Berita Acara';
const SR_TUGAS = 'Surat Tugas';
const SR_KET = 'Surat Keterangan';
const SR_REK = 'Surat Rekomendasi';
/* Pilihan bantuan pada Surat Rekomendasi: kolom kiri dan kanan sesuai format cetak */
const SR_BANTUAN = {
  kiri:[['Bantuan Pendidikan'],['Bantuan Hidup'],['Bantuan Kesehatan'],['Bantuan Hutang Piutang'],['Bantuan Modal Usaha']],
  kanan:[['Bantuan Guru Ngaji'],['Bantuan Muallaf'],['Bantuan Proposal','(Kegiatan Dakwah & Syiar Islam)'],['Bantuan Bedah Rumah','Insidental (Musibah)']]
};
const SR_BANTUAN_SEMUA = [...SR_BANTUAN.kiri,...SR_BANTUAN.kanan].map(b=>b[0]);
const SR_JENIS = ['Surat Undangan','Surat Permohonan','Surat Pemberitahuan','Surat Keterangan','Surat Tugas',SR_REK,SR_BA];
const SR_FIELDS = ['jenis','tgl','lamp','hal','to','isi','s1','s2','mk','cc','tempat','p1n','p1j','p2n','p2j','saksi','menimbang','dasar','hari','waktu','lokasi','acara','penutup','kn','kk','ka','kp','rn','rj','pn','po','ph','pa'];
const SR_NONE = '(tidak ada)';
/* Kalimat pembuka Berita Acara (tetap, tidak dapat diubah) dan baris kosong tabel rincian */
const SR_BA_ISI = 'PIHAK PERTAMA dengan ini menyerahkan uang kepada PIHAK KEDUA, dan PIHAK KEDUA menyatakan telah menerima uang tersebut dalam keadaan cukup dan sesuai dengan rincian berikut :';
const srRinciKosong = () => ({u:'',j:'',k:''});
const srRinciJumlah = list => (list||[]).reduce((t,r)=>t+(Number(r.j)||0),0);
/* Kalimat penutup bawaan tiap jenis (dapat diubah admin) */
const SR_PENUTUP = {
  'Surat Undangan':'Demikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.',
  'Surat Permohonan':'Demikian permohonan ini kami sampaikan. Atas bantuan dan kerja samanya kami ucapkan terima kasih.',
  'Surat Pemberitahuan':'Demikian pemberitahuan ini kami sampaikan. Atas perhatiannya kami ucapkan terima kasih.',
  'Surat Keterangan':'Demikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.'
};
/* Isian yang tampil pada formulir tiap sub menu (tanggal, nomor, dan tombol selalu ada) */
const SR_LAYOUT = {
  'Surat Undangan':['lamp','hal','to','isi','acara','hari','waktu','lokasi','penutup','s1','s2','mk','cc'],
  'Surat Permohonan':['lamp','hal','to','isi','penutup','s1','s2','mk','cc'],
  'Surat Pemberitahuan':['lamp','hal','to','isi','penutup','s1','s2','mk','cc'],
  'Surat Keterangan':['hal','kn','kk','ka','kp','isi','penutup','s2','mk','cc'],
  'Surat Tugas':['hal','menimbang','dasar','to','isi','hari','waktu','lokasi','s2','mk','cc'],
  'Surat Rekomendasi':['hal','sec_a','rn','rj','sec_b','pn','po','ph','pa','sec_c','rb','mk'],
  'Berita Acara':['hal','tempat','p1n','p1j','p2n','p2j','saksi','rinci','mk','cc']
};
/* Jabatan penandatangan -> [pola jabatan di Profil, bagian susunan pengurus]; nama diambil dari menu Profil */
const SR_ROLES = {
  'Ketua UPZ':[/^ketua(?!\s+(mui|bidang))/i,'pelaksana'],
  'Sekretaris':[/^sekretaris/i,'pelaksana'],
  'Bendahara':[/^bendahara/i,'pelaksana'],
  'Camat':[/^camat/i,'penasehat'],
  'Kepala KUA':[/^(kepala\s+)?kua/i,'penasehat'],
  'Ketua MUI':[/^(ketua\s+)?mui/i,'penasehat']
};
const SR = {rows:[],loading:false,failure:'',gen:0,cur:null,draft:null,saving:false,want:null,q:'',f:''};
const SR_MENU = ['Daftar Surat',...SR_JENIS];
const srJenisNow = () => SR_JENIS.includes(screen) ? screen : '';
const srRowsNow = () => {const j=srJenisNow(); return j ? SR.rows.filter(r=>r.jenis===j) : SR.rows;};
const srEsc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const srBulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const srHari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const srSatuan = ['','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh','sebelas'];
const srTgl = iso => {const [y,m,d]=String(iso||'').split('-');return y&&m&&d?Number(d)+' '+srBulan[m-1]+' '+y:'…';};
const srTitimangsa = iso => {const [y,m,d]=String(iso||'').split('-');return y&&m&&d?String(d).padStart(2,'0')+' '+srBulan[m-1]+' '+y:'…';}; // titimangsa: 01 Januari 1999
const srTglCetak = iso => {const [y,m,d]=String(iso||'').split('-');return y&&m&&d?String(d).padStart(2,'0')+'-'+String(m).padStart(2,'0')+'-'+y:'…';}; // format cetak: 00-00-0000
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
const SR_KOSONG = j => ({jenis:j||SR_JENIS[0],penutup:SR_PENUTUP[j||SR_JENIS[0]]||'',acara:'',kn:'',kk:'',ka:'',kp:'',tgl:today(),no:'',lamp:'',hal:'',to:'',isi:'',s1:'Sekretaris',s2:'Ketua UPZ',mk:SR_NONE,cc:'',tempat:'',p1n:'',p1j:'',p2n:'',p2j:'',saksi:'',menimbang:'',dasar:'',hari:'',waktu:'',lokasi:'',rinci:[srRinciKosong()],rn:'',rj:'',pn:'',po:'',ph:'',pa:'',rb:[]});
const SR_DEMO = () => [
  {id:4,jenis:SR_TUGAS,tanggal:'2026-11-25',nomor:'004/004/UPZ.CPD/11/2026',perihal:'Tugas Mengikuti Rapat Koordinasi Zakat',tujuan:'Nama Anggota — Anggota Bidang Pengumpulan',isi:'Mengikuti Rapat Koordinasi Pengelolaan Zakat Tingkat Kecamatan',detail:{menimbang:'Bahwa untuk kelancaran pengelolaan zakat, perlu menugaskan anggota UPZ untuk menghadiri rapat koordinasi.',dasar:'Surat Undangan BAZNAS Kabupaten Subang Nomor 123/BAZNAS/XI/2026.',hari:'Senin, 30-11-2026',waktu:'09.00 WIB – selesai',lokasi:'Kantor BAZNAS Kabupaten Subang',s2:'Ketua UPZ'}},
  {id:3,jenis:SR_BA,tanggal:'2026-11-23',nomor:'003/003/UPZ.CPD/11/2026',perihal:'Serah Terima Dana Zakat Fitrah',isi:'Telah dilakukan serah terima dana zakat fitrah hasil pengumpulan UPZ Desa Sawangan tahun 2026 kepada UPZ Kecamatan Cipeundeuy sebesar Rp25.000.000,00 (dua puluh lima juta rupiah).\n\nPenyerahan dilakukan secara tunai, telah dihitung bersama oleh kedua belah pihak, dan disaksikan oleh para saksi.',mengetahui:'Camat',detail:{rinci:[{u:'Zakat fitrah UPZ Desa Sawangan',j:'20000000',k:'Tunai'},{u:'Infak dan sedekah',j:'5000000',k:''}],tempat:'Kantor Kecamatan Cipeundeuy',p1n:'Nama Ketua UPZ Desa',p1j:'Ketua UPZ Desa Sawangan',p2n:'Nama Bendahara UPZ',p2j:'Bendahara UPZ Kecamatan Cipeundeuy',saksi:'Nama Sekretaris — Sekretaris UPZ Kecamatan'}},
  {id:2,jenis:'Surat Undangan',tanggal:'2026-11-20',nomor:'002/002/UPZ.CPD/11/2026',perihal:'Undangan Rapat Pengurus UPZ',tujuan:'Bapak/Ibu Pengurus UPZ Kecamatan Cipeundeuy\ndi Tempat',isi:'Dengan hormat, sehubungan dengan evaluasi penghimpunan dan pendistribusian zakat tahun 2026, kami mengundang Bapak/Ibu untuk hadir pada rapat pengurus yang akan dilaksanakan pada:\n\nHari/Tanggal : Senin, 30-11-2026\nWaktu : 09.00 WIB – selesai\nTempat : Kantor Kecamatan Cipeundeuy\n\nDemikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.',mengetahui:'Camat',tembusan:'Camat Cipeundeuy\nArsip',detail:{s1:'Sekretaris',s2:'Ketua UPZ'}},
  {id:1,jenis:'Surat Permohonan',tanggal:'2026-11-12',nomor:'001/001/UPZ.CPD/11/2026',lampiran:'1 (satu) berkas',perihal:'Permohonan Data Mustahik',tujuan:'Kepala Desa Sawangan\ndi Tempat',isi:'Dengan hormat, dalam rangka pendataan mustahik tahun 2026, kami memohon bantuan Bapak untuk menyampaikan data warga yang memenuhi kriteria penerima zakat di wilayah Desa Sawangan.\n\nDemikian permohonan ini kami sampaikan. Atas bantuan dan kerja samanya kami ucapkan terima kasih.',tembusan:'Arsip',detail:{s1:'Sekretaris',s2:'Ketua UPZ'}}
];

/* ---------- Nomor otomatis: urut tahun/urut bulan/UPZ.CPD/bulan/tahun ----------
   Contoh: 005/002/UPZ.CPD/11/2026 = surat ke-5 tahun 2026, ke-2 pada bulan November.
   Nomor format lama (002/UPZ.CPD/11/2026) tetap dikenali sebagai urut bulan. */
const srNomorFormat = (urutTahun,urutBulan,y,m) => String(urutTahun).padStart(3,'0')+'/'+String(urutBulan).padStart(3,'0')+'/UPZ.CPD/'+m+'/'+y;
function srNomorHitung(rows, y, m, exceptId) {
  let maxTahun = 0, maxBulan = 0, jumlahTahun = 0;
  for(const r of (rows||[])) {
    if(r.id===exceptId) continue;
    const baru = /^(\d+)\/(\d+)\/UPZ\.CPD\/(\d{2})\/(\d{4})$/.exec(r.nomor||'');
    const lama = /^(\d+)\/UPZ\.CPD\/(\d{2})\/(\d{4})$/.exec(r.nomor||'');
    const [ry,rm,ut,ub] = baru ? [baru[4],baru[3],Number(baru[1]),Number(baru[2])] : lama ? [lama[3],lama[2],0,Number(lama[1])] : [];
    if(ry!==y) continue;
    jumlahTahun++;
    maxTahun = Math.max(maxTahun,ut);
    if(rm===m) maxBulan = Math.max(maxBulan,ub);
  }
  // surat berformat lama tidak punya urut tahun, jadi pakai jumlah surat pada tahun itu sebagai pembanding
  return srNomorFormat(Math.max(maxTahun,jumlahTahun)+1,maxBulan+1,y,m);
}
function srAutoNo(tgl, exceptId) {
  const [y,m] = String(tgl||'').split('-');
  if(!y||!m) return '';
  return srNomorHitung(SR.rows,y,m,exceptId);
}
/* Saat menyimpan, nomor dihitung ulang dari data terbaru di server agar tidak bentrok. */
async function srNomorBaru(tgl, exceptId) {
  if(simulated) return srAutoNo(tgl,exceptId);
  const [y,m] = tgl.split('-');
  const list = await api('/rest/v1/surat?select=id,nomor&nomor=like.'+encodeURIComponent('*/UPZ.CPD/*/'+y)+'&limit=1000',{token:session.access_token});
  return srNomorHitung(list,y,m,exceptId);
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
  // Kop surat berupa gambar resmi (sudah memuat logo, nama UPZ, alamat, kontak, dan garis ganda)
  return '<div class="sr-kop sr-kop-img"><img src="kop-surat.png" alt="Kop surat BAZNAS Kabupaten Subang — UPZ Kecamatan Cipeundeuy"></div>';
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
const srRows3 = (rows, cls) => '<table class="'+cls+'"><tbody>'+rows.filter(r=>String(r[1]||'').trim()).map(([l,v])=>'<tr><td class="l">'+srEsc(l)+'</td><td class="c">:</td><td>'+srEsc(String(v).trim())+'</td></tr>').join('')+'</tbody></table>';
function srAcara(d) {
  const rows = [['Hari/Tanggal',d.hari],['Waktu',d.waktu],['Tempat',d.lokasi],['Acara',d.acara]];
  return rows.some(r=>String(r[1]||'').trim()) ? srRows3(rows,'sr-tg2')+'<div style="height:.4em"></div>' : '';
}
function srPaperKeterangan(d, t) {
  const yang = srRows3([['Nama',t.kanan?.n||'………………………'],['Jabatan',t.kanan?.j]],'sr-tg2');
  const dia = srRows3([['Nama',d.kn],['NIK',d.kk],['Alamat',d.ka],['Pekerjaan/Ket.',d.kp]],'sr-tg2');
  return srKop()+
    '<div class="sr-bat"><b><u>SURAT KETERANGAN</u></b><br>Nomor : '+srEsc(d.no||'…')+'</div>'+
    '<div class="sr-body"><p class="n">Yang bertanda tangan di bawah ini:</p>'+yang+'<p class="n" style="margin-top:.6em">Menerangkan bahwa:</p>'+(dia||'')+
    '<div style="height:.4em"></div>'+(srParas(d.isi)||'<p>…</p>')+srParas(d.penutup)+'</div>'+
    '<div class="sr-ttd-r">Cipeundeuy, '+srTitimangsa(d.tgl)+'<br>'+(t.kanan?srEsc(t.kanan.j)+',':'')+'<i></i>'+(t.kanan&&t.kanan.n?'<u>'+srEsc(t.kanan.n)+'</u>':'<span>………………………</span>')+'</div>'+
    srMengetahui(t)+srTembusan(d);
}
function srPaperSurat(d, t) {
  return srKop()+
    '<div class="sr-meta"><table><tr><td>Nomor</td><td>: '+srEsc(d.no||'…')+'</td></tr><tr><td>Lampiran</td><td>: '+srEsc(d.lamp.trim()||'–')+'</td></tr><tr><td>Perihal</td><td>: <b>'+srEsc(d.hal||'…')+'</b></td></tr></table><div>Cipeundeuy, '+srTitimangsa(d.tgl)+'</div></div>'+
    '<div class="sr-to">Kepada Yth.<br>'+(d.to.trim()?srLines(d.to).map(srEsc).join('<br>'):'…')+'</div>'+
    '<div class="sr-body"><p class="n">Assalamu’alaikum Wr. Wb.</p>'+(srParas(d.isi)||'<p>…</p>')+srAcara(d)+srParas(d.penutup)+'<p class="n">Wassalamu’alaikum Wr. Wb.</p></div>'+
    '<div class="sr-sign">'+(t.kiri?srSig('',t.kiri.j,t.kiri.n):'<div></div>')+(t.kanan?srSig('',t.kanan.j,t.kanan.n):'<div></div>')+'</div>'+
    srMengetahui(t)+srTembusan(d);
}
function srRinciTabel(list) {
  const rows = (list||[]).filter(r=>String(r.u||'').trim()||String(r.j||'').trim()||String(r.k||'').trim());
  const jml = srRinciJumlah(rows);
  const body = (rows.length?rows:[srRinciKosong()]).map((r,i)=>'<tr><td class="no">'+(i+1)+'</td><td>'+(srEsc(String(r.u||'').trim())||'…')+'</td><td class="jm">'+(String(r.j||'').trim()?srEsc(money(Number(r.j)||0)):'')+'</td><td>'+srEsc(String(r.k||'').trim())+'</td></tr>').join('');
  return '<table class="sr-rinci"><thead><tr><th>No.</th><th>Uraian</th><th>Jumlah</th><th>Ket.</th></tr></thead><tbody>'+body+'</tbody>'+
    (rows.length>1?'<tfoot><tr><td colspan="2" class="tt">Total</td><td class="jm">'+srEsc(money(jml))+'</td><td></td></tr></tfoot>':'')+'</table>';
}
function srPaperBA(d, t) {
  const [y,m,day] = String(d.tgl||'').split('-');
  const when = d.tgl ? 'Pada hari ini '+srHari[new Date(y,m-1,day).getDay()]+' tanggal '+srTerbilang(day)+' bulan '+srBulan[m-1]+' tahun '+srTerbilang(y)+' ('+srTglCetak(d.tgl)+')' : 'Pada hari ini …';
  const tempat = d.tempat.trim() ? ', bertempat di '+srEsc(d.tempat.trim()) : '';
  const dua = d.p2n.trim()||d.p2j.trim();
  const pihak = (n,j,i,ket) => '<table class="sr-pk"><tr><td>'+i+'.</td><td>Nama</td><td>: '+srEsc(n||'…')+'</td></tr><tr><td></td><td>Jabatan</td><td>: '+srEsc(j||'…')+'</td></tr></table><p class="n" style="margin:0 0 .4em 2.3em">'+ket+'</p>';
  const saksi = srLines(d.saksi).map((x,k)=>{const [n,j]=x.split(/\s[—–-]\s/);return srSig('Saksi '+(k+1),j,n);});
  // Berita acara lama (tanpa tabel rincian) tetap tampil dengan isi aslinya
  const lama = !(d.rinci||[]).some(r=>String(r.u||'').trim()) && String(d.isi||'').trim() && d.isi.trim()!==SR_BA_ISI;
  const isi = lama ? srParas(d.isi) : '<p>'+srEsc(SR_BA_ISI).replace('PIHAK PERTAMA','<b>PIHAK PERTAMA</b>').replace('PIHAK KEDUA','<b>PIHAK KEDUA</b>').replace('PIHAK KEDUA','<b>PIHAK KEDUA</b>')+'</p>'+srRinciTabel(d.rinci);
  return srKop()+
    '<div class="sr-bat"><b><u>BERITA ACARA</u></b><br><b>'+srEsc((d.hal||'…').toUpperCase())+'</b><br>Nomor : '+srEsc(d.no||'…')+'</div>'+
    '<div class="sr-body"><p>'+when+tempat+', kami yang bertanda tangan di bawah ini:</p>'+
    pihak(d.p1n,d.p1j,1,'selanjutnya disebut <b>PIHAK PERTAMA</b>'+(dua?',':'.'))+(dua?pihak(d.p2n,d.p2j,2,'selanjutnya disebut <b>PIHAK KEDUA</b>.'):'')+
    isi+'<p style="margin-top:.8em">Demikian Berita Acara ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.</p></div>'+
    '<div class="sr-sign" style="flex-wrap:wrap">'+srSig('PIHAK PERTAMA',d.p1j,d.p1n)+(dua?srSig('PIHAK KEDUA',d.p2j,d.p2n):'')+'</div>'+
    (saksi.length?'<div class="sr-sign" style="flex-wrap:wrap;margin-top:.5em">'+saksi.join('')+'</div>':'')+
    srMengetahui(t)+srTembusan(d);
}
function srPaperRek(d, t) {
  const tbl = rows => '<table class="sr-tg2 ind"><tbody>'+rows.map(([l,v,kosong])=>'<tr><td class="l">'+srEsc(l)+'</td><td class="c">:</td><td>'+(String(v||'').trim()?srEsc(String(v).trim()):kosong)+'</td></tr>').join('')+'</tbody></table>';
  const pilih = d.rb||[];
  const kotak = ([nama,sub]) => '<div class="sr-cbi"><span class="bx'+(pilih.includes(nama)?' on':'')+'"></span><span class="tx">'+srEsc(nama)+(sub?'<small>'+srEsc(sub)+'</small>':'')+'</span></div>';
  return srKop()+
    '<div class="sr-bat"><b><u>SURAT REKOMENDASI</u></b><br>Nomor : '+srEsc(d.no||'…')+'</div>'+
    '<div class="sr-body"><p class="n">Yang bertanda tangan dibawah ini :</p>'+
    tbl([['Nama',d.rn,'…'],['Jabatan',d.rj,'…']])+
    '<p class="n sr-gap">Dengan ini memberikan rekomendasi kepada :</p>'+
    tbl([['Nama',d.pn,'…'],['Nama Orang Tua',d.po,'-'],['No. Hp',d.ph,'-'],['Alamat',d.pa,'…']])+
    '<p class="n sr-gap">Direkomendasikan untuk mengajukan bantuan :</p>'+
    '<div class="sr-cb"><div>'+SR_BANTUAN.kiri.map(kotak).join('')+'</div><div>'+SR_BANTUAN.kanan.map(kotak).join('')+'</div></div>'+
    '<p class="sr-gap">Demikian surat rekomendasi ini saya buat dengan harapan akan dikabulkan.</p></div>'+
    '<div class="sr-ttd-r">Cipeundeuy, '+srTitimangsa(d.tgl)+'<br>'+(d.rj.trim()?srEsc(d.rj.trim())+',':'')+'<i></i>'+(d.rn.trim()?'<u>'+srEsc(d.rn.trim())+'</u>':'<span>………………………</span>')+'</div>'+
    srMengetahui(t);
}
function srPaperTugas(d, t) {
  const row = (label,html) => '<tr><td class="l">'+label+'</td><td class="c">:</td><td class="v">'+html+'</td></tr>';
  const lines = s => srLines(s).map(srEsc).join('<br>');
  const orang = srLines(d.to).map(x=>{const [n,j]=x.split(/\s[—–-]\s/);return srEsc(n)+(j?'<br>'+srEsc(j):'');});
  const kepada = orang.length>1 ? orang.map((o,i)=>'<div style="margin-bottom:.4em">'+(i+1)+'. '+o+'</div>').join('') : (orang[0]||'…');
  const ada = d.hari.trim()||d.waktu.trim()||d.lokasi.trim();
  const kegiatan = (lines(d.isi)||'…')+(ada&&!/pada\s*:?\s*$/i.test(d.isi.trim())?' pada :':'');
  const sub = ada ? '<table class="sr-tg2" style="margin:.6em 0"><tbody>'+[['Hari/Tanggal',d.hari],['Waktu',d.waktu],['Tempat',d.lokasi]].map(([l,v])=>'<tr><td class="l">'+l+'</td><td class="c">:</td><td>'+srEsc(v.trim())+'</td></tr>').join('')+'</tbody></table>' : '';
  const penutup = '<p style="margin:.4em 0 0;text-align:justify">Melaksanakan tugas dengan sebaik-baiknya serta penuh tanggung jawab.</p>';
  return srKop()+
    '<div class="sr-bat"><b>SURAT TUGAS</b><br>Nomor : '+srEsc(d.no||'…')+'</div>'+
    '<table class="sr-tg"><tbody>'+(d.menimbang.trim()?row('Menimbang',lines(d.menimbang)):'')+(d.dasar.trim()?row('Dasar',lines(d.dasar)):'')+'</tbody></table>'+
    '<div class="sr-mt">Memberi Tugas</div>'+
    '<table class="sr-tg"><tbody>'+row('Kepada',kepada)+row('Untuk',kegiatan+sub+penutup)+'</tbody></table>'+
    '<div class="sr-ttd-r">Cipeundeuy, '+srTitimangsa(d.tgl)+'<br>'+(t.kanan?srEsc(t.kanan.j)+',':'')+'<i></i>'+(t.kanan&&t.kanan.n?'<u>'+srEsc(t.kanan.n)+'</u>':'<span>………………………</span>')+'</div>'+
    srMengetahui(t)+srTembusan(d);
}
const srPaper = (d,t) => d.jenis===SR_REK ? srPaperRek(d,t) : d.jenis===SR_BA ? srPaperBA(d,t) : d.jenis===SR_TUGAS ? srPaperTugas(d,t) : d.jenis===SR_KET ? srPaperKeterangan(d,t) : srPaperSurat(d,t);

/* ---------- Data ---------- */
const srRowToDraft = r => {
  const dt = r.detail || {};
  return {jenis:r.jenis,tgl:r.tanggal,no:r.nomor,lamp:r.lampiran||'',hal:r.perihal||'',to:r.tujuan||'',isi:r.isi||'',s1:dt.s1||'Sekretaris',s2:dt.s2||'Ketua UPZ',mk:r.mengetahui||SR_NONE,cc:r.tembusan||'',tempat:dt.tempat||'',p1n:dt.p1n||'',p1j:dt.p1j||'',p2n:dt.p2n||'',p2j:dt.p2j||'',saksi:dt.saksi||'',menimbang:dt.menimbang||'',dasar:dt.dasar||'',hari:dt.hari||'',waktu:dt.waktu||'',lokasi:dt.lokasi||'',acara:dt.acara||'',penutup:dt.penutup||'',kn:dt.kn||'',kk:dt.kk||'',ka:dt.ka||'',kp:dt.kp||'',rinci:Array.isArray(dt.rinci)&&dt.rinci.length?dt.rinci.map(r=>({u:r.u||'',j:r.j||'',k:r.k||''})):[srRinciKosong()],rn:dt.rn||'',rj:dt.rj||'',pn:dt.pn||'',po:dt.po||'',ph:dt.ph||'',pa:dt.pa||'',rb:Array.isArray(dt.rb)?dt.rb:[]};
};
function srNew() {
  SR.cur = null;
  SR.draft = SR_KOSONG(srJenisNow());
  SR.draft.no = srAutoNo(SR.draft.tgl,null);
}
/* Dipanggil setelah data dimuat atau saat pindah sub menu: pilih surat yang diminta, atau siapkan formulir baru */
function srEnter() {
  const want = SR.want!=null ? SR.rows.find(r=>String(r.id)===String(SR.want)) : null;
  SR.want = null;
  if(want) {SR.cur = want.id; if(admin()) SR.draft = srRowToDraft(want); return;}
  if(admin()) srNew(); else SR.cur = srRowsNow()[0]?.id ?? null;
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
      srEnter();
      render();
    }
  }
}
async function srSave() {
  if(!admin()||SR.saving) return;
  const d = SR.draft, ba = d.jenis===SR_BA, tg = d.jenis===SR_TUGAS, kt = d.jenis===SR_KET, rk = d.jenis===SR_REK;
  const fail = msg => toast(msg,'error');
  if(!d.tgl) return fail('Tanggal surat wajib diisi.');
  if(!d.hal.trim()) return fail('Perihal wajib diisi.');
  const rinci = (d.rinci||[]).filter(r=>String(r.u).trim()||String(r.j).trim()||String(r.k).trim()).map(r=>({u:String(r.u).trim(),j:String(r.j).replace(/\D/g,''),k:String(r.k).trim()}));
  if(!ba&&!rk&&!d.isi.trim()) return fail('Isi surat wajib diisi.');
  if(rk&&!d.rn.trim()) return fail('Nama pemberi rekomendasi wajib diisi.');
  if(rk&&!d.pn.trim()) return fail('Nama penerima rekomendasi wajib diisi.');
  if(rk&&!d.rb.length) return fail('Pilih minimal satu jenis bantuan.');
  if(ba&&!rinci.some(r=>r.u)) return fail('Rincian berita acara wajib diisi (minimal satu uraian).');
  if(ba&&!d.p1n.trim()&&!d.p1j.trim()) return fail('Pihak pertama wajib diisi.');
  if(tg&&!d.to.trim()) return fail('Penerima tugas (Kepada) wajib diisi.');
  if(kt&&!d.kn.trim()) return fail('Nama yang diterangkan wajib diisi.');
  SR.saving = true;
  const btn = $('srSave'); if(btn) btn.disabled = true;
  try {
    const old = SR.cur!=null ? SR.rows.find(r=>r.id===SR.cur) : null;
    const body = {
      jenis:d.jenis, tanggal:d.tgl, lampiran:ba||tg||kt||rk?null:(d.lamp.trim()||null), perihal:d.hal.trim(), tujuan:ba||kt||rk?null:(d.to.trim()||null),
      isi:ba?SR_BA_ISI:rk?'Rekomendasi untuk: '+d.rb.join(', '):d.isi.trim(), tembusan:d.cc.trim()||null, mengetahui:d.mk===SR_NONE?null:d.mk, diubah:new Date().toISOString(),
      detail:{rinci:ba?rinci:[],rn:d.rn.trim(),rj:d.rj.trim(),pn:d.pn.trim(),po:d.po.trim(),ph:d.ph.trim(),pa:d.pa.trim(),rb:rk?d.rb:[],s1:d.s1,s2:d.s2,tempat:d.tempat.trim(),p1n:d.p1n.trim(),p1j:d.p1j.trim(),p2n:d.p2n.trim(),p2j:d.p2j.trim(),saksi:d.saksi.trim(),menimbang:d.menimbang.trim(),dasar:d.dasar.trim(),hari:d.hari.trim(),waktu:d.waktu.trim(),lokasi:d.lokasi.trim(),acara:d.acara.trim(),penutup:d.penutup.trim(),kn:d.kn.trim(),kk:d.kk.trim(),ka:d.ka.trim(),kp:d.kp.trim(),ttd:srTtd(d,old?.detail?.ttd)}
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
  const j = d.jenis, tg = j===SR_TUGAS, ba = j===SR_BA, kt = j===SR_KET, rk = j===SR_REK;
  const opt = (list,v) => list.map(x=>'<option'+(x===v?' selected':'')+'>'+srEsc(x)+'</option>').join('');
  const L = (label,control,cls='') => '<label'+(cls?' class="'+cls+'"':'')+'>'+label+control+'</label>';
  const inp = (id,ph='') => '<input id="sr_'+id+'" type="text" maxlength="200" placeholder="'+srEsc(ph)+'" value="'+srEsc(d[id])+'">';
  const ta = (id,ph='',h='') => '<textarea id="sr_'+id+'" maxlength="20000" placeholder="'+srEsc(ph)+'"'+(h?' style="min-height:'+h+'px"':'')+'>'+srEsc(d[id])+'</textarea>';
  const hint = t => '<span class="sr-hint">'+t+'</span>';
  const F = {
    lamp:()=>L('Lampiran',inp('lamp','1 (satu) berkas, atau kosongkan'),'full'),
    hal:()=>L('Perihal',inp('hal','Contoh: '+(tg?'Tugas Mengikuti Rapat Koordinasi':rk?'Rekomendasi Bantuan Pendidikan':ba?'Serah Terima Dana Zakat Fitrah':kt?'Keterangan Penerima Manfaat':'Undangan Rapat Pengurus'))+(tg||kt||rk?hint('Tidak dicetak pada surat; dipakai sebagai judul di daftar surat.'):''),'full'),
    to:()=>L(tg?'Kepada — satu orang per baris, format: Nama — Jabatan':'Kepada Yth.',ta('to',tg?'Nama — Jabatan':'Bapak/Ibu …\ndi Tempat','62'),'full'),
    menimbang:()=>L('Menimbang',ta('menimbang','Pertimbangan penugasan (opsional)','62'),'full'),
    dasar:()=>L('Dasar',ta('dasar','Dasar penugasan, misalnya surat undangan atau SK (opsional)','62'),'full'),
    sec_a:()=>'<h3 class="full sr-sec">Yang bertanda tangan (pemberi rekomendasi)</h3>',
    sec_b:()=>'<h3 class="full sr-sec">Penerima rekomendasi</h3>',
    sec_c:()=>'<h3 class="full sr-sec">Direkomendasikan untuk mengajukan bantuan</h3>',
    rn:()=>L('Nama',inp('rn')), rj:()=>L('Jabatan',inp('rj')),
    pn:()=>L('Nama',inp('pn'),'full'),
    po:()=>L('Nama orang tua',inp('po')+hint('Wajib diisi untuk bantuan pendidikan/kesehatan.')),
    ph:()=>L('No. HP',inp('ph')), pa:()=>L('Alamat',inp('pa'),'full'),
    rb:()=>'<div class="full sr-cbs">'+SR_BANTUAN_SEMUA.map(n=>'<label class="sr-chk"><input type="checkbox" data-rb="'+srEsc(n)+'"'+(d.rb.includes(n)?' checked':'')+'><span>'+srEsc(n)+'</span></label>').join('')+'</div>',
    rinci:()=>'<div class="full sr-ri"><span class="sr-ri-t">Isi berita acara</span><div class="sr-ri-fix">'+srEsc(SR_BA_ISI)+'</div><span class="sr-ri-t" style="margin-top:6px">Rincian</span>'+
      d.rinci.map((r,i)=>'<div class="sr-ri-row"><span class="no">'+(i+1)+'</span><input data-ri="'+i+'" data-rf="u" maxlength="200" placeholder="Uraian" value="'+srEsc(r.u)+'"><input data-ri="'+i+'" data-rf="j" inputmode="numeric" maxlength="15" placeholder="Jumlah (Rp)" value="'+srEsc(r.j)+'"><input data-ri="'+i+'" data-rf="k" maxlength="100" placeholder="Ket." value="'+srEsc(r.k)+'"><button type="button" class="secondary sr-ri-del" data-ri-del="'+i+'" aria-label="Hapus baris '+(i+1)+'">×</button></div>').join('')+
      '<button type="button" class="secondary sr-ri-add" id="srRiAdd">+ Tambah baris</button>'+hint('Nomor urut dan total dibuat otomatis. Kalimat pembuka dan penutup ditambahkan otomatis.')+'</div>',
    isi:()=>L(tg?'Untuk (tugas yang dilaksanakan)':ba?'Isi berita acara':kt?'Isi keterangan':j==='Surat Undangan'?'Isi undangan (paragraf pembuka)':'Isi surat',ta('isi',kt?'Uraian keterangan tentang yang bersangkutan.':'Pisahkan paragraf dengan satu baris kosong.')+(tg?'':hint(ba?'Tulis uraian atau kesepakatan. Kalimat pembuka dan penutup berita acara ditambahkan otomatis.':kt?'Judul, identitas, dan tanda tangan ditambahkan otomatis.':'Salam pembuka dan penutup ditambahkan otomatis.')),'full'),
    acara:()=>L('Acara',inp('acara','Contoh: Rapat evaluasi zakat'),'full'),
    hari:()=>L('Hari/Tanggal',inp('hari','Senin, 30-11-2026')),
    waktu:()=>L('Waktu',inp('waktu','09.00 WIB – selesai')),
    lokasi:()=>L('Tempat',inp('lokasi','Kantor Kecamatan Cipeundeuy'),'full'),
    penutup:()=>L('Kalimat penutup',ta('penutup','Kosongkan jika tidak diperlukan','62'),'full'),
    tempat:()=>L('Bertempat di',inp('tempat','Kantor Kecamatan Cipeundeuy'),'full'),
    p1n:()=>L('Pihak pertama — nama',inp('p1n')), p1j:()=>L('Pihak pertama — jabatan',inp('p1j','Bendahara UPZ')),
    p2n:()=>L('Pihak kedua — nama',inp('p2n')), p2j:()=>L('Pihak kedua — jabatan',inp('p2j','Kosongkan jika hanya satu pihak')),
    saksi:()=>L('Saksi (satu per baris, opsional)',ta('saksi','Nama — Jabatan','62'),'full'),
    kn:()=>L('Nama yang diterangkan',inp('kn')), kk:()=>L('NIK',inp('kk')),
    ka:()=>L('Alamat',inp('ka'),'full'), kp:()=>L('Pekerjaan / keterangan lain',inp('kp'),'full'),
    s1:()=>L('Penandatangan kiri','<select id="sr_s1">'+opt(['Sekretaris','Bendahara',SR_NONE],d.s1)+'</select>'),
    s2:()=>L(tg||kt?'Penandatangan':'Penandatangan kanan','<select id="sr_s2">'+opt(['Ketua UPZ','Camat'],d.s2)+'</select>'),
    mk:()=>L('Mengetahui (opsional)','<select id="sr_mk">'+opt([SR_NONE,'Camat','Kepala KUA','Ketua MUI'],d.mk)+'</select>'+hint('Nama penandatangan diambil dari menu Profil › Susunan Pengurus.'),'full'),
    cc:()=>L('Tembusan (satu per baris)',ta('cc','','62'),'full')
  };
  return '<form id="srForm" class="sr-form" autocomplete="off" onsubmit="return false">'+
    L('Tanggal surat','<input id="sr_tgl" type="date" max="9999-12-31" required value="'+srEsc(d.tgl)+'">')+
    L('Nomor surat (otomatis)','<input id="sr_no" readonly value="'+srEsc(d.no)+'">'+hint('Urut per bulan, mengikuti tanggal surat.'))+
    (SR_LAYOUT[j]||SR_LAYOUT[SR_JENIS[0]]).map(k=>F[k]()).join('')+
    '<div class="sr-actions"><button type="button" id="srSave">Simpan Surat</button><button type="button" class="secondary" id="srPrint2">Cetak / PDF</button>'+(SR.cur!=null?'<button type="button" class="danger" id="srDel">Hapus</button>':'')+'</div></form>';
}
const srTabs = () => '<div class="sr-tabs no-print" role="tablist">'+SR_MENU.map(n=>'<button type="button" data-page="'+srEsc(n)+'" class="'+(n===screen?'on':'')+'">'+srEsc(n.replace('Surat ',''))+'</button>').join('')+'</div>';
/* Warna tiap jenis surat (dipakai untuk label dan kartu ringkasan) */
const SR_WARNA = {'Surat Undangan':'und','Surat Permohonan':'per','Surat Pemberitahuan':'pem','Surat Keterangan':'ket','Surat Tugas':'tug','Surat Rekomendasi':'rek','Berita Acara':'ba'};
const srWarna = j => 't-'+(SR_WARNA[j]||'tug');
const SR_IKON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h9l3.5 3.5v13.5H6z"/><path d="M14.5 3.5V7h4M9 12h6.5M9 15.5h6.5"/></svg>';
function srSummaryRows() {
  const q = SR.q.trim().toLowerCase();
  const list = SR.rows.filter(r=>(!SR.f||r.jenis===SR.f)&&(!q||(String(r.nomor||'')+' '+String(r.perihal||'')).toLowerCase().includes(q)));
  return list.length ? list.map(r=>'<tr class="sr-row" data-sr-go="'+srEsc(r.jenis)+'" data-sr-want="'+srEsc(r.id)+'"><td class="no">'+srEsc(r.nomor)+'</td><td class="tg">'+srTgl(r.tanggal)+'</td><td class="jn"><span class="sr-tag '+srWarna(r.jenis)+'">'+srEsc(String(r.jenis).replace('Surat ',''))+'</span></td><td class="ph">'+srEsc(r.perihal)+'</td><td class="ar" aria-hidden="true">›</td></tr>').join('') : '<tr><td colspan="5" class="sr-empty">Tidak ada surat yang cocok dengan pencarian.</td></tr>';
}
function srSummaryPage(head) {
  const cards = SR_JENIS.map(j=>{
    const l = SR.rows.filter(r=>r.jenis===j);
    return '<button type="button" class="sr-card '+srWarna(j)+(l.length?'':' zero')+'" data-page="'+srEsc(j)+'"><span class="sr-card-top"><span class="ic">'+SR_IKON+'</span><span class="n">'+l.length+'</span></span><b>'+srEsc(j)+'</b><small>'+(l[0]?'Terakhir: '+srEsc(l[0].perihal)+'<em>'+srTgl(l[0].tanggal)+'</em>':'Belum ada surat')+'</small><span class="go">Buka <i>→</i></span></button>';
  }).join('');
  return '<div class="surat-page">'+head+srTabs()+'<div class="sr-cards no-print">'+cards+'</div>'+
    '<section class="panel sr-sum no-print"><div class="toolbar"><h2>Surat Terbaru<span class="sr-count">'+SR.rows.length+' surat</span></h2><div class="sr-filter"><input id="srQ" type="search" placeholder="Cari nomor / perihal" value="'+srEsc(SR.q)+'"><select id="srF"><option value="">Semua jenis</option>'+SR_JENIS.map(j=>'<option'+(j===SR.f?' selected':'')+'>'+srEsc(j)+'</option>').join('')+'</select></div></div>'+
    '<div class="sr-tablewrap"><table class="sr-table"><thead><tr><th>Nomor</th><th>Tanggal</th><th>Jenis</th><th>Perihal</th><th></th></tr></thead><tbody id="srTb">'+srSummaryRows()+'</tbody></table></div></section></div>';
}
function suratPage() {
  const adm = admin(), jn = srJenisNow();
  const title = jn || (screen==='Daftar Surat' ? 'Daftar Surat' : 'Surat Menyurat');
  const head = '<div class="no-print"><p class="crumb">Surat'+(screen==='Daftar Surat'||jn?' / '+srEsc(title):'')+'</p><h1>'+srEsc(title)+'</h1><p class="muted">'+(screen==='Daftar Surat'?'Ringkasan surat UPZ per jenis. Pilih kartu atau baris untuk membuka suratnya.':jn?(adm?'Ketik dan kelola '+srEsc(jn.toLowerCase())+'. Nomor surat dibuat otomatis.':'Daftar '+srEsc(jn.toLowerCase())+'. Pilih surat untuk melihat dan mencetak.'):'')+'</p></div>';
  if(SR.loading) return '<section class="panel">'+head+skeletonRows(4)+'</section>';
  if(SR.failure) return '<section class="panel">'+head+emptyState('Surat belum dapat dimuat',esc(SR.failure))+'</section>';
  if(screen==='Daftar Surat') return srSummaryPage(head);
  if(adm&&!SR.draft) srNew();
  const rows = srRowsNow();
  if(!adm&&!rows.some(r=>r.id===SR.cur)) SR.cur = rows[0]?.id ?? null;
  const row = rows.find(r=>r.id===SR.cur) || null;
  let paper = '';
  if(adm) paper = srPaper(SR.draft,srTtd(SR.draft,row?.detail?.ttd));
  else if(row) {const d=srRowToDraft(row); paper = srPaper(d,row.detail?.ttd||srTtd(d));}
  const list = rows.length ? rows.map(r=>'<button type="button" class="sr-item'+(r.id===SR.cur?' on':'')+'" data-sr-id="'+srEsc(r.id)+'"><span><b>'+srEsc(r.perihal)+'</b><small>'+srEsc(r.nomor)+' · '+srTgl(r.tanggal)+'</small></span><span class="sr-tag">'+srEsc(String(r.jenis).replace('Surat ',''))+'</span></button>').join('') : emptyState('Belum ada '+srEsc(jn.toLowerCase()),adm?'Ketik surat pertama pada formulir di bawah.':'');
  return '<div class="surat-page">'+head+srTabs()+'<div class="sr-grid">'+
    '<section class="panel no-print"><div class="toolbar"><h2>Daftar '+srEsc(jn)+'</h2>'+(adm?'<button type="button" id="srNew">+ Surat Baru</button>':'')+'</div><div class="sr-list">'+list+'</div>'+(adm?'<div class="toolbar"><h2>'+(SR.cur!=null?'Ubah Surat':'Ketik Surat Baru')+'</h2></div>'+srForm(SR.draft):'')+'</section>'+
    '<section class="panel"><div class="toolbar no-print"><h2>Pratinjau Surat</h2><button type="button" class="secondary" id="srPrint">Cetak / PDF</button></div><div class="sr-stage"><div class="surat-paper" id="srPaper">'+(paper||emptyState('Pilih surat dari daftar'))+'</div></div></section>'+
    '</div></div>';
}
const srRefresh = () => {const el=$('srPaper'); if(el) el.innerHTML = srPaper(SR.draft,srTtd(SR.draft,srSavedTtd()));};
function srSetNo() {
  const old = SR.rows.find(r=>r.id===SR.cur);
  SR.draft.no = old && old.tanggal.slice(0,7)===SR.draft.tgl.slice(0,7) ? old.nomor : srAutoNo(SR.draft.tgl,SR.cur);
  $('sr_no').value = SR.draft.no;
}
function srBindRows() {
  document.querySelectorAll('tr[data-sr-go]').forEach(r=>r.onclick=()=>{SR.want=r.dataset.srWant; go(r.dataset.srGo);});
}
function bindSurat() {
  srBindRows();
  const redraw = () => {const tb=$('srTb'); if(tb) {tb.innerHTML=srSummaryRows(); srBindRows();}};
  $('srQ')?.addEventListener('input',e=>{SR.q=e.target.value; redraw();});
  $('srF')?.addEventListener('change',e=>{SR.f=e.target.value; redraw();});
  document.querySelectorAll('[data-sr-id]').forEach(b=>b.onclick=()=>{
    const row = SR.rows.find(r=>String(r.id)===b.dataset.srId);
    if(!row) return;
    SR.cur = row.id;
    if(admin()) SR.draft = srRowToDraft(row);
    render();
    $('srPaper')?.scrollIntoView({block:'nearest'});
  });
  $('srNew')?.addEventListener('click',()=>{srNew();render();});
  // Nama file unduhan: "Jenis - Perihal"
  const srPrintNamed = () => {
    const row = SR.rows.find(r=>String(r.id)===String(SR.cur));
    const d = SR.draft || (row ? srRowToDraft(row) : null);
    printNamed(d&&d.jenis, d&&d.hal);
  };
  $('srPrint')?.addEventListener('click',srPrintNamed);
  $('srPrint2')?.addEventListener('click',srPrintNamed);
  const form = $('srForm');
  if(!form) return;
  for(const key of SR_FIELDS) {
    const el = $('sr_'+key);
    if(!el) continue;
    el.addEventListener('input',()=>{
      SR.draft[key] = el.value;
      if(key==='tgl') srSetNo();
      srRefresh();
    });
  }
  form.querySelectorAll('[data-rb]').forEach(el=>el.addEventListener('change',()=>{
    const pilih = new Set(SR.draft.rb);
    if(el.checked) pilih.add(el.dataset.rb); else pilih.delete(el.dataset.rb);
    SR.draft.rb = SR_BANTUAN_SEMUA.filter(n=>pilih.has(n));
    srRefresh();
  }));
  form.querySelectorAll('[data-ri]').forEach(el=>el.addEventListener('input',()=>{
    const f = el.dataset.rf;
    if(f==='j') {const v=el.value.replace(/\D/g,''); if(v!==el.value) el.value=v;}
    SR.draft.rinci[Number(el.dataset.ri)][f] = el.value;
    srRefresh();
  }));
  $('srRiAdd')?.addEventListener('click',()=>{SR.draft.rinci.push(srRinciKosong()); render();});
  form.querySelectorAll('[data-ri-del]').forEach(b=>b.onclick=()=>{
    SR.draft.rinci.splice(Number(b.dataset.riDel),1);
    if(!SR.draft.rinci.length) SR.draft.rinci.push(srRinciKosong());
    render();
  });
  $('srSave').addEventListener('click',srSave);
  $('srDel')?.addEventListener('click',srDelete);
}
