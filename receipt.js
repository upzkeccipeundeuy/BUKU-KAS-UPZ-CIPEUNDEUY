const receiptDate = new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'});
const receiptAmount = new Intl.NumberFormat('id-ID',{maximumFractionDigits:2});
const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

function numberWords(number) {
  if(number < 12n) return units[Number(number)];
  if(number < 20n) return numberWords(number-10n)+' belas';
  if(number < 100n) return (numberWords(number/10n)+' puluh '+numberWords(number%10n)).trim();
  if(number < 200n) return ('seratus '+numberWords(number-100n)).trim();
  if(number < 1000n) return (numberWords(number/100n)+' ratus '+numberWords(number%100n)).trim();
  if(number < 2000n) return ('seribu '+numberWords(number-1000n)).trim();
  for(const [scale,label] of [[1000000000000000n,'kuadriliun'],[1000000000000n,'triliun'],[1000000000n,'miliar'],[1000000n,'juta'],[1000n,'ribu']]) {
    if(number>=scale) return (numberWords(number/scale)+' '+label+' '+numberWords(number%scale)).trim();
  }
}

function receiptMoney(value) {
  const [whole,cents=''] = String(value).split('.');
  const rupiah = BigInt(whole);
  const sen = BigInt(cents.padEnd(2,'0'));
  const words = (numberWords(rupiah)||'nol')+' rupiah'+(sen?' '+numberWords(sen)+' sen':'');
  return {
    words:words[0].toUpperCase()+words.slice(1),
    digits:receiptAmount.format(rupiah)+(sen?','+String(sen).padStart(2,'0'):'')
  };
}

async function downloadReceipt(record, button) {
  const preview = simulated;
  const login = session;
  button.disabled=true;
  try {
    let institution = preview ? demoProfile : defaultProfile;
    if(!preview) {
      const result=await api(profileEndpoint).catch(()=>[]);
      institution=result?.[0] || defaultProfile;
    }
    if(!admin() || simulated!==preview || session!==login) return;
    const pdf=await buildReceipt(record,institution);
    if(!admin() || simulated!==preview || session!==login) return;
    const href=URL.createObjectURL(pdf);
    const link=document.createElement('a');
    link.href=href;
    link.download='Kwitansi-'+String(record.no_kwitansi||record.id).replace(/[^a-z0-9.-]+/gi,'-')+'.pdf';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(href),30000);
  } catch(error) {
    alert('Kwitansi gagal diunduh. '+error.message);
  } finally {button.disabled=false;}
}

async function buildReceipt(record, institution) {
  const info=institution.identitas;
  const incoming=Number(record.debet)>0;
  const value=receiptMoney(incoming?record.debet:record.kredit);
  const defaultName=!info.nama || info.nama===defaultProfile.identitas.nama;
  const name=defaultName?'UNIT PENGUMPUL ZAKAT (UPZ)\nKECAMATAN CIPEUNDEUY':info.nama.toUpperCase();
  const officer=role=>institution.pengurus.find(p=>p.jabatan?.trim().toLowerCase().startsWith(role))?.nama;
  const party=record.penerima || '—';
  const date=receiptDate.format(new Date(record.tanggal+'T00:00:00Z'));
  const canvas=document.createElement('canvas');
  const ctx=canvas.getContext('2d');
  const width=1000;
  const left=34, right=966, valueX=328;

  function lines(text,maxWidth,font) {
    ctx.font=font;
    const output=[];
    const wrap=part=>{
      let line='';
      for(const word of part.split(/\s+/).filter(Boolean)) {
        const next=line?line+' '+word:word;
        if(ctx.measureText(next).width<=maxWidth) {line=next;continue;}
        if(line) output.push(line);
        line='';
        for(const character of word) {
          if(ctx.measureText(line+character).width>maxWidth && line) {output.push(line);line='';}
          line+=character;
        }
      }
      output.push(line);
    };
    String(text).split(/\r?\n/).forEach(wrap);
    return output;
  }
  const bodyFont='20px Arial';
  const italicFont='italic 20px Arial';
  const titleFont='bold 35px Arial';
  const subFont='italic 19px Arial';
  const logoSource=profileImage(info.foto);
  let logo;
  if(logoSource) {
    const image=new Image();
    image.src=logoSource;
    await image.decode().then(()=>{logo=image;}).catch(()=>{});
  }
  const headerCenter=logo?600:500;
  const headerWidth=logo?690:880;
  const nameLines=lines(name,headerWidth,titleFont);
  const addressLines=info.alamat?lines(info.alamat,headerWidth,subFont):[];
  const headerEnd=Math.max(160,43+nameLines.length*39+addressLines.length*23+18);
  const details=[
    ['Nomor Bukti',record.no_kwitansi || '—'],
    ['Sudah Terima Dari',incoming?party:(defaultName?'UPZ KECAMATAN CIPEUNDEUY':info.nama)],
    ['Terbilang',value.words,'box',italicFont],
    [incoming?'Uraian Penerimaan':'Untuk Pembayaran',record.uraian || '—','box'],
    ['Sejumlah','Rp '+value.digits,'amount','bold italic 20px Arial']
  ].map(([label,text,style,font=bodyFont])=>({label,style,font,rows:lines(text,style==='amount'?330:right-valueX-25,font)}));
  const detailsEnd=headerEnd+65+details.reduce((height,field)=>height+Math.max(38,field.rows.length*25+14),0)+10;
  const signatures=[
    ['Menyetujui','Ketua UPZ',officer('ketua')],
    [incoming?'Penerima Dana':'Lunas Bayar','Bendahara UPZ',officer('bendahara')],
    ['Cipeundeuy, '+date,incoming?'Yang Menyerahkan':'Yang Menerima',party==='—'?'':party]
  ].map(([top,role,person])=>({top,role,name:lines(person||'',270,'bold 18px Arial')}));
  const signatureHeight=150+Math.max(...signatures.map(s=>s.name.length))*22;
  const height=Math.max(700,detailsEnd+signatureHeight+14);
  canvas.width=width*2;
  canvas.height=height*2;
  ctx.scale(2,2);
  ctx.fillStyle='white';
  ctx.fillRect(0,0,width,height);
  ctx.fillStyle='black';
  ctx.strokeStyle='black';
  ctx.lineWidth=2;
  ctx.textBaseline='top';
  ctx.strokeRect(14,14,width-28,height-28);

  function textRows(values,x,y,font,align='left',spacing=25) {
    ctx.font=font;
    ctx.textAlign=align;
    values.forEach((text,i)=>ctx.fillText(text,x,y+i*spacing));
  }
  function separator(y) {ctx.beginPath();ctx.moveTo(14,y);ctx.lineTo(width-14,y);ctx.stroke();}
  if(logo) {
    const scale=Math.min(170/logo.width,112/logo.height);
    ctx.drawImage(logo,138-logo.width*scale/2,32,logo.width*scale,logo.height*scale);
  }
  textRows(nameLines,headerCenter,44,titleFont,'center',39);
  textRows(addressLines,headerCenter,47+nameLines.length*39,subFont,'center',23);
  separator(headerEnd);
  textRows([incoming?'KWITANSI PENERIMAAN':'KWITANSI PEMBAYARAN'],500,headerEnd+13,'bold 32px Arial','center');
  let y=headerEnd+65;
  for(const field of details) {
    textRows([field.label],left,y+7,bodyFont);
    textRows([':'],valueX-18,y+7,bodyFont);
    const rowHeight=Math.max(38,field.rows.length*25+14);
    if(field.style) {
      const boxWidth=field.style==='amount'?350:right-valueX;
      if(field.style==='amount') {
        ctx.fillStyle='#e3e3e3';
        ctx.fillRect(valueX,y,boxWidth,rowHeight-6);
        ctx.fillStyle='black';
      }
      ctx.lineWidth=1.3;
      ctx.strokeRect(valueX,y,boxWidth,rowHeight-6);
    }
    textRows(field.rows,valueX+10,y+7,field.font);
    y+=rowHeight;
  }
  separator(detailsEnd);
  signatures.forEach((signature,i)=>{
    const x=[170,500,830][i];
    textRows([signature.top,signature.role],x,detailsEnd+14,bodyFont,'center');
    ctx.beginPath();ctx.moveTo(x-110,detailsEnd+126);ctx.lineTo(x+110,detailsEnd+126);ctx.stroke();
    textRows(signature.name,x,detailsEnd+132,'bold 18px Arial','center',22);
  });
  const jpeg=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.94));
  if(!jpeg) throw Error('Gambar kwitansi tidak dapat dibuat.');
  return receiptPdf(new Uint8Array(await jpeg.arrayBuffer()),canvas.width,canvas.height);
}

function receiptPdf(image,width,height) {
  const encoder=new TextEncoder();
  const parts=[];
  const offsets=[0];
  let length=0;
  function add(content) {
    const bytes=typeof content==='string'?encoder.encode(content):content;
    parts.push(bytes);
    length+=bytes.length;
  }
  function object(...content) {
    offsets.push(length);
    add(offsets.length-1+' 0 obj\n');
    content.forEach(add);
    add('\nendobj\n');
  }
  const scale=Math.min(595/width,420/height);
  const w=(width*scale).toFixed(3), h=(height*scale).toFixed(3);
  const draw='q '+w+' 0 0 '+h+' '+((595-w)/2).toFixed(3)+' '+((420-h)/2).toFixed(3)+' cm /Receipt Do Q\n';
  add('%PDF-1.4\n');
  object('<< /Type /Catalog /Pages 2 0 R >>');
  object('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 420] /Resources << /XObject << /Receipt 4 0 R >> >> /Contents 5 0 R >>');
  object('<< /Type /XObject /Subtype /Image /Width '+width+' /Height '+height+
    ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+image.length+' >>\nstream\n',image,'\nendstream');
  object('<< /Length '+draw.length+' >>\nstream\n',draw,'endstream');
  const start=length;
  add('xref\n0 '+offsets.length+'\n0000000000 65535 f \n');
  offsets.slice(1).forEach(offset=>add(String(offset).padStart(10,'0')+' 00000 n \n'));
  add('trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF\n');
  return new Blob(parts,{type:'application/pdf'});
}
