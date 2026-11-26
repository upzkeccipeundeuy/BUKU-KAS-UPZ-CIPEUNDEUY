// Cetak dengan nama file unduhan (Simpan sebagai PDF mengikuti document.title).
// Bagian nama dipisah " - ", bagian kosong dilewati, karakter terlarang diganti "-".
function printNamed(...bagian) {
  const nama = bagian.map(t=>String(t==null?'':t).replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').trim()).filter(Boolean).join(' - ');
  const lama = document.title;
  if(nama) document.title = nama;
  const pulih = () => {document.title = lama; window.removeEventListener('afterprint',pulih);};
  window.addEventListener('afterprint',pulih);
  window.print();
}

const defaultProfile = {
  identitas: {
    nama: 'UPZ Cipeundeuy',
    deskripsi: 'Unit Pengumpul Zakat Cipeundeuy mencatat penerimaan dan pengeluaran dana melalui Buku Kas Umum.'
  },
  pengurus: []
};
const profileEndpoint = '/rest/v1/profil_lembaga_bku?id=eq.1&select=identitas,pengurus';
const profileFields = [
  ['nama','Nama lembaga',150], ['deskripsi','Profil singkat',2000,'textarea'], ['visi','Visi',500,'textarea','Contoh: Menjadi lembaga pengelola zakat yang amanah, transparan, dan profesional.'],
  ['misi','Misi (satu poin per baris)',1500,'textarea','Tulis satu misi di tiap baris, tanpa nomor.\nContoh:\nOptimalisasi pengumpulan zakat\nPendistribusian tepat sasaran'],
  ['alamat','Alamat',300], ['wilayah','Wilayah kerja',200], ['telepon','Nomor telepon lembaga',40,'tel'],
  ['whatsapp','Nomor WhatsApp',40,'tel'], ['email','Email lembaga',150,'email'], ['jam_layanan','Jam layanan',200],
  ['peta','Tautan peta (opsional, diawali https://)',300,'url'],
  ['nomor_sk','Nomor SK',150], ['periode','Periode kepengurusan (contoh: 2024–2029)',80],
  ['rek_bank','Nama bank',60], ['rek_nomor','Nomor rekening',40], ['rek_nama','Atas nama rekening',100]
];
let privateContacts = {}, privateKey = '';
let profile = defaultProfile, publicProfile = defaultProfile, demoProfile = defaultProfile, profileState = '', profileRequest = 0;

/* Visi dan misi disimpan terpisah (identitas.visi & identitas.misi). Data lama yang masih
   tergabung dalam satu kolom "misi" dipecah otomatis. */
function profileMisiList(text) {
  return String(text||'').replace(/\r/g,'').split('\n')
    .map(v=>v.replace(/^\s*(?:\d+\s*[.)]|[-•*])\s*/,'').replace(/^[\s"“”'‘’]+|[\s"“”'‘’]+$/g,'').trim()).filter(Boolean);
}
function profileVisiMisi(info) {
  info = info || {};
  if(typeof info.visi === 'string') return {visi:info.visi.trim(), misi:profileMisiList(info.misi)};
  const parsed = parseVisiMisi(info.misi);
  return {visi:parsed.visi.join(' '), misi:parsed.misi};
}
/* Bagian susunan pengurus: Penasehat, Pelaksana, dan tiga Bidang. Setiap entri pengurus
   menyimpan {id, bagian, jabatan, nama}. Data lama tanpa "bagian" ditempatkan otomatis. */
const officerSections = [
  {key:'penasehat', label:'Penasehat', numbered:true, roles:['Camat Cipeundeuy','Kepala KUA Cipeundeuy','Ketua MUI Cipeundeuy'], hint:['Camat Cipeundeuy','Kepala KUA Cipeundeuy','Ketua MUI Cipeundeuy']},
  {key:'pelaksana', label:'Pelaksana', roles:['Ketua UPZ','Sekretaris UPZ','Bendahara UPZ'], hint:['Ketua UPZ','Wakil Ketua UPZ','Sekretaris UPZ','Bendahara UPZ']},
  {key:'bidang1', label:'Bidang Pengumpulan', bidang:true, hint:['Ketua Bidang','Anggota']},
  {key:'bidang2', label:'Bidang Pendistribusian dan Pendayagunaan', bidang:true, hint:['Ketua Bidang','Anggota']},
  {key:'bidang3', label:'Bidang Administrasi dan Umum', bidang:true, hint:['Ketua Bidang','Anggota']}
];
function officerSectionKey(entry) {
  if(officerSections.some(s=>s.key===entry.bagian)) return entry.bagian;
  const role = String(entry.jabatan||'').trim().toLowerCase();
  return /^(camat|kepala kua|kua|ketua mui|mui|penasehat|pembina)/.test(role) ? 'penasehat' : 'pelaksana';
}
function officersNormalized(list) {
  return (list||[]).map(entry=>({...entry,bagian:officerSectionKey(entry)}));
}
function findOfficer(list, role) {
  const items = officersNormalized(list).filter(item=>item.jabatan?.trim().toLowerCase().startsWith(role));
  if(role==='camat') return items.find(item=>item.bagian==='penasehat') || items[0];
  return items.find(item=>item.bagian==='pelaksana') || items.find(item=>item.bagian!=='penasehat');
}
function profileOfficer(role) {
  return findOfficer(profile.pengurus,role)?.nama || '';
}
function officerPhone(role) {
  if(!admin()) return '';
  const entry = findOfficer(profile.pengurus,role);
  return (entry && privateContacts[entry.id]) || '';
}
function camatName() {
  return (typeof phCamat === 'string' && phCamat.trim()) || profileOfficer('camat');
}
function profileNewId() {
  return 'p'+Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
}
function profileAddress(text) {
  return String(text || '').replace(/\s+-(?=[A-Za-z])/g,', ');
}
function profileWhatsappUrl(number) {
  let digits = String(number || '').replace(/[^0-9]/g,'');
  if(digits.startsWith('0')) digits = '62'+digits.slice(1);
  return digits.length >= 9 ? 'https://wa.me/'+digits : '';
}
function profileMapUrl(info) {
  if(info.peta && /^https:\/\//i.test(info.peta)) return info.peta;
  return info.alamat ? 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(profileAddress(info.alamat)) : '';
}
async function loadPrivateContacts() {
  if(!admin() || simulated) {if(!simulated) {privateContacts = {}; privateKey = '';} return;}
  const key = session.user.id+session.access_token.slice(-10);
  if(privateKey === key) return;
  privateKey = key;
  try {
    const result = await api('/rest/v1/profil_pengurus_privat?id=eq.1&select=kontak',{token:session.access_token});
    privateContacts = result?.[0]?.kontak || {};
  } catch {privateContacts = {};}
  if(['Profil','Form C2A','Form C2B'].includes(screen)) render();
}

function updateBrandLogo() {
  const logo = $('brandLogo');
  const source = profileImage(profile.identitas.foto) || 'logo-baznas.png';
  if(source) {
    if(logo.getAttribute('src') !== source) logo.src = source;
  } else {
    logo.removeAttribute('src');
  }
  logo.hidden = !source;
  $('brandFallback').hidden = !!source;
}

async function loadProfile() {
  const request = ++profileRequest;
  if(simulated) {
    profile = demoProfile;
    profileState = 'ready';
    updateBrandLogo();
    render();
    return;
  }
  profileState = 'loading';
  profile = publicProfile;
  updateBrandLogo();
  if(['Dashboard','Profil','Cetak Laporan','Perhimpunan','Pendistribusian','Rekap Laporan'].includes(screen)) render();
  try {
    const result = await api(profileEndpoint);
    if(request !== profileRequest) return;
    if(!result?.[0]) throw Error('Profil belum tersedia.');
    publicProfile = result[0];
    profile = publicProfile;
    profileState = 'ready';
  } catch {
    if(request !== profileRequest) return;
    profileState = 'error';
  }
  updateBrandLogo();
  if(['Dashboard','Profil','Cetak Laporan','Perhimpunan','Pendistribusian','Rekap Laporan'].includes(screen)) render();
}

function profileImage(source) {
  return typeof source === 'string' && /^data:image\/(png|jpeg);base64,[a-z0-9+/=]+$/i.test(source) ? source : '';
}

function profilePage() {
  const info = profile.identitas;
  const photo = profileImage(info.foto);
  const canEdit = admin() && profileState === 'ready';
  const officersList = profile.pengurus || [];
  const fact = (label,value) => value ? '<div><dt>'+label+'</dt><dd>'+value+'</dd></div>' : '';
  const mapUrl = profileMapUrl(info);
  const waUrl = profileWhatsappUrl(info.whatsapp || info.telepon);
  const facts = fact('Alamat',esc(profileAddress(info.alamat)))+fact('Wilayah kerja',esc(info.wilayah))+
    fact('Nomor telepon lembaga',esc(info.telepon))+fact('Email lembaga',info.email?'<a href="mailto:'+esc(info.email)+'">'+esc(info.email)+'</a>':'')+
    fact('Jam layanan',esc(info.jam_layanan));
  const actions = (waUrl?'<a class="btn-link" href="'+esc(waUrl)+'" target="_blank" rel="noopener noreferrer">Hubungi via WhatsApp</a>':'')+
    (mapUrl?'<a class="btn-link secondary" href="'+esc(mapUrl)+'" target="_blank" rel="noopener noreferrer">Lihat di peta</a>':'');
  const showPhone = admin();
  const officerTable = list => makeTable(['No.','Jabatan','Nama'].concat(showPhone?['No. HP (hanya admin)']:[]),
    list.map((entry,index)=>'<tr><td>'+(index+1)+'</td><td>'+esc(entry.jabatan)+'</td><td>'+esc(entry.nama || '—')+'</td>'+
      (showPhone?'<td>'+esc(privateContacts[entry.id] || '—')+'</td>':'')+'</tr>').join(''));
  const normalizedOfficers = officersNormalized(officersList);
  const officers = officerSections.map(section=>{
    const list = normalizedOfficers.filter(entry=>entry.bagian===section.key);
    if(!list.length) return '';
    return '<div class="officer-group"><h3>'+(section.bidang?(officerSections.filter(s=>s.bidang).indexOf(section)+1)+'. ':'')+esc(section.label)+'</h3>'+officerTable(list)+'</div>';
  }).join('');
  const legal = [info.nomor_sk?'SK No. '+esc(info.nomor_sk):'',info.periode?'Periode '+esc(info.periode):''].filter(Boolean).join(' · ');
  const visionMission = (() => {
    const vm = profileVisiMisi(info);
    if(!vm.visi && !vm.misi.length) return '';
    return '<div class="institution-vm-grid">'+
      (vm.visi?'<section class="institution-vm-card vision-card"><h4><span aria-hidden="true">◎</span> Visi</h4><p>'+esc(vm.visi).replace(/\n/g,'<br>')+'</p></section>':'')+
      (vm.misi.length?'<section class="institution-vm-card mission-card"><h4><span aria-hidden="true">✧</span> Misi</h4><ol class="vm-list">'+vm.misi.map(m=>'<li>'+esc(m)+'</li>').join('')+'</ol></section>':'')+'</div>';
  })();
  const rekening = info.rek_nomor ? '<section class="panel"><div class="toolbar"><h2>Rekening Penyaluran Zakat</h2></div><dl class="profile-facts rek-facts">'+
    fact('Bank',esc(info.rek_bank))+'<div><dt>Nomor rekening</dt><dd><span class="rek-number" id="rekNumber">'+esc(info.rek_nomor)+'</span> <button type="button" class="secondary copy-btn" id="copyRek">Salin</button></dd></div>'+
    fact('Atas nama',esc(info.rek_nama))+'</dl></section>' : '';
  const updated = info.diperbarui ? new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric'}).format(new Date(info.diperbarui)) : '';
  return '<div class="profile-layout"><div><h1>Profil Lembaga</h1></div>'+
    (profileState==='loading'?'<p role="status">Memuat profil…</p>':'')+
    (profileState==='error'?'<p class="muted">Profil tersimpan belum dapat dimuat.'+
      (admin()?' Jalankan <a href="setup-profil-supabase.sql" download>setup-profil-supabase.sql</a> di Supabase SQL Editor, lalu buka lagi menu Profil.':'')+'</p>':'')+
    '<section class="panel"><div class="toolbar"><h2>Identitas Lembaga</h2>'+
    (canEdit?'<button id="editProfile">Edit Identitas</button>':'')+'</div>'+
    '<div class="institution"><div class="institution-photo">'+(photo?'<img src="'+esc(photo)+'" alt="Foto atau logo '+esc(info.nama)+'">':'<span aria-hidden="true">▤</span>')+
    '</div><div><h3>'+esc(info.nama)+'</h3><p class="institution-description">'+esc(info.deskripsi || '')+'</p>'+
    visionMission+
    (facts?'<dl class="profile-facts">'+facts+'</dl>':'')+(actions?'<div class="profile-actions">'+actions+'</div>':'')+'</div></div></section>'+
    rekening+
    '<section class="panel"><div class="toolbar"><div><h2>Susunan Pengurus</h2>'+(legal?'<p class="muted legal-line">'+legal+'</p>':'')+'</div>'+
    (canEdit?'<button id="editOfficers">Edit Pengurus</button>':'')+'</div>'+
    (officers||'<p class="muted">Susunan pengurus belum tersedia.</p>')+'</section>'+
    (updated?'<p class="muted profile-updated">Terakhir diperbarui: '+esc(updated)+'</p>':'')+'</div>';
}

function bindProfile() {
  $('copyRek')?.addEventListener('click',async event=>{
    const button = event.currentTarget, number = $('rekNumber')?.textContent || '';
    try {await navigator.clipboard.writeText(number); button.textContent = 'Tersalin';}
    catch {
      const range = document.createRange(); range.selectNodeContents($('rekNumber'));
      const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
      button.textContent = 'Pilih lalu salin';
    }
    setTimeout(()=>{button.textContent = 'Salin';},2000);
  });
}

function editInstitution() {
  const vm = profileVisiMisi(profile.identitas);
  const info = {...profile.identitas, visi:vm.visi, misi:vm.misi.join('\n')};
  const control = ([key,label,limit,kind,hint]) => '<label>'+label+(kind==='textarea'?
    '<textarea name="'+key+'" maxlength="'+limit+'" rows="'+(key==='misi'?6:3)+'"'+(hint?' placeholder="'+esc(hint)+'"':'')+'>'+esc(info[key] || '')+'</textarea>':
    '<input name="'+key+'" type="'+(kind||'text')+'" maxlength="'+limit+'" '+(key==='nama'?'required':'')+' value="'+esc(info[key] || '')+'">')+'</label>';
  const section = (title,keys) => '<fieldset class="form-section"><legend>'+title+'</legend>'+profileFields.filter(([key])=>keys.includes(key)).map(control).join('')+'</fieldset>';
  const form = profileDialog('Edit Identitas Lembaga',
    section('Identitas',['nama','deskripsi'])+section('Visi dan misi',['visi','misi'])+
    section('Alamat dan kontak',['alamat','wilayah','telepon','whatsapp','email','jam_layanan','peta'])+
    section('Legalitas kepengurusan',['nomor_sk','periode'])+
    section('Rekening penyaluran zakat',['rek_bank','rek_nomor','rek_nama'])+
    '<label>Foto atau logo lembaga <input name="foto" type="file" accept="image/jpeg,image/png"></label>'+
    '<p class="muted photo-help">Format JPG atau PNG, maksimal 5 MB.</p>'+
    (profileImage(info.foto)?'<label class="checkbox"><input type="checkbox" name="hapusFoto">Hapus foto saat ini</label>':''));
  form.onsubmit = event => {
    event.preventDefault();
    const data = new FormData(form);
    saveProfile(form,async () => {
      const identitas = Object.fromEntries(profileFields.map(([key])=>[key,data.get(key).trim()]));
      identitas.misi = profileMisiList(identitas.misi).join('\n');
      if(!identitas.nama) throw Error('Nama lembaga wajib diisi.');
      if(identitas.peta && !/^https:\/\/[^\s]+$/i.test(identitas.peta)) throw Error('Tautan peta harus diawali https://');
      const file = data.get('foto');
      identitas.foto = file.size ? await prepareProfileImage(file) : data.has('hapusFoto') ? '' : profileImage(info.foto);
      return {identitas};
    });
  };
}

async function prepareProfileImage(file) {
  if(!['image/jpeg','image/png'].includes(file.type) || file.size > 5*1024*1024) {
    throw Error('Gunakan gambar JPG atau PNG dengan ukuran maksimal 5 MB.');
  }
  let image;
  try {image = await createImageBitmap(file);}
  catch {throw Error('Gambar tidak dapat dibaca. Pilih file JPG atau PNG yang valid.');}
  try {
    const canvas = document.createElement('canvas');
    for(const maxSide of [800,600,400]) {
      const scale = Math.min(1,maxSide/Math.max(image.width,image.height));
      canvas.width = Math.max(1,Math.round(image.width*scale));
      canvas.height = Math.max(1,Math.round(image.height*scale));
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      const source = canvas.toDataURL(file.type,0.88);
      if(profileImage(source) && source.length <= 1400000) return source;
    }
    throw Error('Ukuran gambar hasil kompresi terlalu besar.');
  } finally {image.close();}
}

function editOfficers() {
  const form = profileDialog('Edit Susunan Pengurus',
    officerSections.map(s=>'<datalist id="jabatanList-'+s.key+'">'+s.hint.map(j=>'<option value="'+esc(j)+'">').join('')+'</datalist>').join('')+
    '<p class="muted">Kosongkan nama jika belum ada pejabatnya. Nomor HP hanya tersimpan untuk admin dan tidak tampil di halaman publik. Jabatan \"Camat\" (bagian Penasehat) dan \"Ketua UPZ\", \"Bendahara UPZ\" (bagian Pelaksana) dipakai otomatis pada formulir cetak.</p>'+
    officerSections.map(s=>'<section class="officer-section" data-section="'+s.key+'"><h3>'+esc(s.label)+'</h3><div class="officer-rows"></div>'+
      '<button class="secondary" data-add type="button">Tambah '+(s.bidang?'Anggota Bidang':s.key==='penasehat'?'Penasehat':'Pengurus')+'</button></section>').join(''));
  const total = () => form.querySelectorAll('.officer-entry').length;
  const refresh = () => {
    form.querySelectorAll('.officer-section').forEach(section=>{
      const list = [...section.querySelector('.officer-rows').children];
      list.forEach((row,index)=>{
        row.querySelector('[data-up]').disabled = index===0;
        row.querySelector('[data-down]').disabled = index===list.length-1;
      });
    });
    form.querySelectorAll('[data-add]').forEach(button=>button.disabled = total() >= 80);
  };
  function addOfficer(sectionKey, entry = {}) {
    const rows = form.querySelector('[data-section="'+sectionKey+'"] .officer-rows');
    const row = document.createElement('fieldset');
    row.className = 'officer-entry';
    row.dataset.id = entry.id || profileNewId();
    row.innerHTML = '<label>Jabatan<input name="jabatan" list="jabatanList-'+sectionKey+'" maxlength="100" required value="'+esc(entry.jabatan || '')+'"></label>'+
      '<label>Nama<input name="namaPengurus" maxlength="100" value="'+esc(entry.nama || '')+'"></label>'+
      '<label>No. HP (khusus admin)<input name="hpPengurus" type="tel" inputmode="tel" maxlength="20" value="'+esc(privateContacts[entry.id] || '')+'"></label>'+
      '<div class="officer-actions"><button type="button" class="secondary" data-up aria-label="Naikkan urutan">↑</button><button type="button" class="secondary" data-down aria-label="Turunkan urutan">↓</button>'+
      '<button type="button" class="danger" data-del aria-label="Hapus baris pengurus">Hapus</button></div>';
    row.querySelector('[data-del]').onclick = () => {row.remove();refresh();};
    row.querySelector('[data-up]').onclick = () => {row.previousElementSibling?.before(row);refresh();};
    row.querySelector('[data-down]').onclick = () => {row.nextElementSibling?.after(row);refresh();};
    rows.append(row);
    refresh();
  }
  form.querySelectorAll('[data-add]').forEach(button=>{
    const key = button.closest('.officer-section').dataset.section;
    button.onclick = () => addOfficer(key,{jabatan:key.startsWith('bidang')?'Anggota':''});
  });
  const existing = officersNormalized(profile.pengurus);
  if(existing.length) existing.forEach(entry=>addOfficer(entry.bagian,entry));
  else officerSections.forEach(s=>(s.roles||[]).forEach(role=>addOfficer(s.key,{jabatan:role})));
  form.onsubmit = event => {
    event.preventDefault();
    saveProfile(form,() => {
      const kontak = {};
      const pengurus = [];
      form.querySelectorAll('.officer-section').forEach(section=>{
        [...section.querySelector('.officer-rows').children].forEach(row=>{
          const id = row.dataset.id;
          const hp = row.querySelector('[name=hpPengurus]').value.trim();
          if(hp && !/^[0-9+()\s-]{5,20}$/.test(hp)) throw Error('Nomor HP hanya boleh berisi angka, spasi, +, - dan tanda kurung.');
          if(hp) kontak[id] = hp;
          pengurus.push({id,bagian:section.dataset.section,jabatan:row.querySelector('[name=jabatan]').value.trim(),nama:row.querySelector('[name=namaPengurus]').value.trim()});
        });
      });
      if(pengurus.some(entry=>!entry.jabatan)) throw Error('Jabatan wajib diisi.');
      return {pengurus,_kontak:kontak};
    });
  };
}

function profileDialog(title, fields) {
  const modal = $('modal');
  modal.innerHTML = '<h2>'+title+'</h2><form id="profileForm">'+fields+
    '<div id="profileError" role="alert"></div><div class="toolbar">'+
    '<button type="submit">Simpan</button><button type="button" class="secondary" id="cancelProfile">Batal</button></div></form>';
  $('cancelProfile').onclick = () => modal.close();
  modal.showModal();
  return $('profileForm');
}

async function saveProfile(form, prepare) {
  if(!admin()) return;
  const modal = $('modal');
  const disabled = [...form.elements].filter(control=>!control.disabled);
  disabled.forEach(control=>control.disabled=true);
  const preventClose = event=>event.preventDefault();
  modal.addEventListener('cancel',preventClose);
  let contactError = '';
  try {
    const changes = await prepare();
    const kontak = changes._kontak;
    delete changes._kontak;
    changes.identitas = {...profile.identitas,...(changes.identitas||{}),diperbarui:new Date().toISOString()};
    if(simulated) {
      demoProfile = {...demoProfile,...changes};
      profile = demoProfile;
      if(kontak) privateContacts = kontak;
    } else {
      const result = await api(profileEndpoint,{
        method:'PATCH',body:changes,token:session.access_token,extra:{Prefer:'return=representation'}
      });
      if(!result?.[0]) throw Error('Profil belum tersimpan. Periksa akses admin Supabase.');
      publicProfile = result[0];
      profile = publicProfile;
      if(kontak) {
        try {
          await api('/rest/v1/profil_pengurus_privat?on_conflict=id',{method:'POST',body:{id:1,kontak},token:session.access_token,
            extra:{Prefer:'resolution=merge-duplicates,return=minimal'}});
          privateContacts = kontak;
        } catch(error) {
          contactError = /profil_pengurus_privat|schema cache/i.test(error.message)
            ? 'Pengurus tersimpan, tetapi nomor HP belum: jalankan setup-profil-lanjutan-supabase.sql di Supabase SQL Editor, lalu simpan lagi.'
            : 'Pengurus tersimpan, tetapi nomor HP gagal disimpan. '+error.message;
        }
      }
    }
    updateBrandLogo();
    render();
    if(contactError) throw Error(contactError);
    modal.close();
  } catch(error) {
    $('profileError').textContent = error.message;
  } finally {
    modal.removeEventListener('cancel',preventClose);
    disabled.forEach(control=>control.disabled=false);
  }
}
