const defaultProfile = {
  identitas: {
    nama: 'UPZ Cipeundeuy',
    deskripsi: 'Unit Pengumpul Zakat Cipeundeuy mencatat penerimaan dan pengeluaran dana melalui Buku Kas Umum.'
  },
  pengurus: []
};
const profileEndpoint = '/rest/v1/profil_lembaga_bku?id=eq.1&select=identitas,pengurus';
const profileFields = [
  ['nama','Nama lembaga',150], ['alamat','Alamat',300],
  ['telepon','Nomor telepon lembaga',40], ['email','Email lembaga',150],
  ['deskripsi','Profil singkat',2000]
];
let profile = defaultProfile, publicProfile = defaultProfile, demoProfile = defaultProfile, profileState = '', profileRequest = 0;

function profileOfficer(role) {
  return (profile.pengurus || []).find(entry=>entry.jabatan?.trim().toLowerCase().startsWith(role))?.nama || '';
}

function updateBrandLogo() {
  const logo = $('brandLogo');
  const source = profileImage(profile.identitas.foto);
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
  if(['Profil','Cetak Laporan','Perhimpunan','Pendistribusian'].includes(screen)) render();
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
  if(['Profil','Cetak Laporan','Perhimpunan','Pendistribusian'].includes(screen)) render();
}

function profileImage(source) {
  return typeof source === 'string' && /^data:image\/(png|jpeg);base64,[a-z0-9+/=]+$/i.test(source) ? source : '';
}

function profilePage() {
  const info = profile.identitas;
  const photo = profileImage(info.foto);
  const canEdit = admin() && profileState === 'ready';
  const facts = profileFields.slice(1,4).filter(([key]) => info[key])
    .map(([key,label])=>'<div><dt>'+label+'</dt><dd>'+esc(info[key])+'</dd></div>').join('');
  const officers = profile.pengurus.map((entry,index)=>'<tr><td>'+(index+1)+'</td><td>'+
    esc(entry.jabatan)+'</td><td>'+esc(entry.nama)+'</td></tr>').join('');
  return '<div class="profile-layout"><div><h1>Profil Lembaga</h1></div>'+
    (profileState==='loading'?'<p role="status">Memuat profil…</p>':'')+
    (profileState==='error'?'<p class="muted">Profil tersimpan belum dapat dimuat.'+
      (admin()?' Jalankan <a href="setup-profil-supabase.sql" download>setup-profil-supabase.sql</a> di Supabase SQL Editor, lalu buka lagi menu Profil.':'')+'</p>':'')+
    '<section class="panel"><div class="toolbar"><h2>Identitas Lembaga</h2>'+
    (canEdit?'<button id="editProfile">Edit Identitas</button>':'')+'</div>'+
    '<div class="institution"><div class="institution-photo">'+(photo?'<img src="'+esc(photo)+'" alt="Foto atau logo '+esc(info.nama)+'">':'<span aria-hidden="true">▤</span>')+
    '</div><div><h3>'+esc(info.nama)+'</h3><p class="institution-description">'+esc(info.deskripsi || '')+'</p>'+
    (facts?'<dl class="profile-facts">'+facts+'</dl>':'')+'</div></div></section>'+
    '<section class="panel"><div class="toolbar"><h2>Susunan Pengurus</h2>'+
    (canEdit?'<button id="editOfficers">Edit Pengurus</button>':'')+'</div>'+
    (officers?makeTable(['No.','Jabatan','Nama'],officers):'<p class="muted">Susunan pengurus belum tersedia.</p>')+'</section></div>';
}

function editInstitution() {
  const info = profile.identitas;
  const fields = profileFields.map(([key,label,limit])=>'<label>'+label+(key==='deskripsi'?
    '<textarea name="'+key+'" maxlength="'+limit+'" rows="3">'+esc(info[key] || '')+'</textarea>':
    '<input name="'+key+'" type="'+({email:'email',telepon:'tel'}[key] || 'text')+'" maxlength="'+limit+'" '+(key==='nama'?'required':'')+' value="'+esc(info[key] || '')+'">')+'</label>').join('');
  const form = profileDialog('Edit Identitas Lembaga',fields+
    '<label>Foto atau logo lembaga <input name="foto" type="file" accept="image/jpeg,image/png"></label>'+
    '<p class="muted photo-help">Format JPG atau PNG, maksimal 5 MB.</p>'+
    (profileImage(info.foto)?'<label class="checkbox"><input type="checkbox" name="hapusFoto">Hapus foto saat ini</label>':''));
  form.onsubmit = event => {
    event.preventDefault();
    const data = new FormData(form);
    saveProfile(form,async () => {
      const identitas = Object.fromEntries(profileFields.map(([key])=>[key,data.get(key).trim()]));
      if(!identitas.nama) throw Error('Nama lembaga wajib diisi.');
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
    '<div id="officerRows"></div><button class="secondary" id="addOfficer" type="button">Tambah Pengurus</button>');
  const rows = $('officerRows');
  function addOfficer(entry = {}) {
    const row = document.createElement('fieldset');
    row.className = 'officer-entry';
    row.innerHTML = '<label>Jabatan<input name="jabatan" maxlength="100" required value="'+esc(entry.jabatan || '')+'"></label>'+
      '<label>Nama<input name="namaPengurus" maxlength="100" required value="'+esc(entry.nama || '')+'"></label>'+
      '<button type="button" class="danger" aria-label="Hapus baris pengurus">Hapus</button>';
    row.querySelector('button').onclick = () => {row.remove();$('addOfficer').disabled=false;};
    rows.append(row);
    $('addOfficer').disabled = rows.children.length >= 50;
  }
  profile.pengurus.forEach(addOfficer);
  $('addOfficer').onclick = () => addOfficer();
  form.onsubmit = event => {
    event.preventDefault();
    saveProfile(form,() => {
      const pengurus = [...rows.children].map(row=>({
        jabatan:row.querySelector('[name=jabatan]').value.trim(),
        nama:row.querySelector('[name=namaPengurus]').value.trim()
      }));
      if(pengurus.some(entry=>!entry.jabatan||!entry.nama)) throw Error('Jabatan dan nama wajib diisi.');
      return {pengurus};
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
  try {
    const changes = await prepare();
    if(simulated) {
      demoProfile = {...demoProfile,...changes};
      profile = demoProfile;
    } else {
      const result = await api(profileEndpoint,{
        method:'PATCH',body:changes,token:session.access_token,extra:{Prefer:'return=representation'}
      });
      if(!result?.[0]) throw Error('Profil belum tersimpan. Periksa akses admin Supabase.');
      publicProfile = result[0];
      profile = publicProfile;
    }
    updateBrandLogo();
    modal.close();
    render();
  } catch(error) {
    $('profileError').textContent = error.message;
  } finally {
    modal.removeEventListener('cancel',preventClose);
    disabled.forEach(control=>control.disabled=false);
  }
}
