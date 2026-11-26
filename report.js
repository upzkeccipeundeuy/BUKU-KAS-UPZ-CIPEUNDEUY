const reportPeriods = [['all','Semua periode'],['month','Bulanan'],['year','Tahunan']];
let reportPeriod = 'all', reportMonth = '', reportYear = '', reportPrintDate = '';

function reportFilters() {
  const options=reportPeriods.map(([value,label])=>'<option value="'+value+'" '+(reportPeriod===value?'selected':'')+'>'+label+'</option>').join('');
  const selectedMonth=reportMonth||today().slice(0,7);
  const selectedYear=reportYear||today().slice(0,4);
  return '<label>Periode Laporan <select id="reportPeriod">'+options+'</select></label>'+
    (reportPeriod==='month'?'<label>Bulan dan Tahun <input id="reportMonth" type="month" max="9999-12" value="'+esc(selectedMonth)+'" required></label>':'')+
    (reportPeriod==='year'?'<label>Tahun <input id="reportYear" type="number" min="1" max="9999" step="1" value="'+esc(selectedYear)+'" required></label>':'')+
    '<label>Tanggal Cetak <input id="reportPrintDate" type="date" max="9999-12-31" value="'+esc(reportPrintDate||today())+'" required></label>';
}

function bindReportFilters() {
  $('reportPeriod').addEventListener('change',event=>{
    reportPeriod=event.target.value;
    render();
    $(reportPeriod==='month'?'reportMonth':reportPeriod==='year'?'reportYear':'reportPeriod')?.focus();
  });
  for(const [id,update] of [
    ['reportMonth',value=>{reportMonth=value;}],
    ['reportYear',value=>{reportYear=String(Number(value)).padStart(4,'0');}],
    ['reportPrintDate',value=>{reportPrintDate=value;}]
  ]) {
    $(id)?.addEventListener('change',event=>{
      const input=event.target;
      if(!input.reportValidity()) {
        $('print').disabled=true;
        return;
      }
      update(input.value);
      render();
      $(id)?.focus();
    });
  }
}

function formatReportDate(isoDate) {
  const [year,monthNumber,day] = isoDate.split('-');
  return day+'-'+monthNumber+'-'+year;
}

function openingBalance(startDate) {
  if(!startDate) return 0;
  if(admin()) {
    const previous=rows.findLast(row=>row.tanggal<startDate);
    return Number(previous?.saldo ?? 0);
  }
  return totals(summary.filter(row=>row.bulan<startDate))[2];
}

function reportPage() {
  const currentDate=today();
  const selectedMonth=reportMonth||currentDate.slice(0,7);
  const selectedYear=reportYear||currentDate.slice(0,4);
  const prefix=reportPeriod==='month'?selectedMonth+'-':reportPeriod==='year'?selectedYear+'-':'';
  const startDate=reportPeriod==='month'?prefix+'01':reportPeriod==='year'?prefix+'01-01':'';
  const data=summary.filter(row=>row.bulan.startsWith(prefix));
  const list=rows.filter(row=>row.tanggal.startsWith(prefix));
  const info=profile.identitas;
  const logo=profileImage(info.foto);
  const officer=role=>profileOfficer(role);
  const hasData=!loading&&!failure;
  const opening=hasData?openingBalance(startDate):null;
  const [debet,kredit,movement]=totals(data);
  const closing=hasData
    ? admin()&&list.length ? Number(list.at(-1).saldo) : Math.round((opening+movement)*100)/100
    : null;
  const title=admin()?(reportPeriod==='year'?'Laporan Buku Kas Umum Tahun '+esc(selectedYear):'Laporan Buku Kas Umum'):'Laporan Ringkasan Kas';
  const period=reportPeriod==='month'?monthName.format(new Date(startDate)):reportPeriod==='year'?selectedYear:'Semua periode';
  const openingLabel=reportPeriod==='year'?'Sisa saldo tahun lalu':'Sisa saldo bulan lalu';
  const openingRow={tanggal:startDate,uraian:openingLabel,saldo:opening};
  const reportRows=startDate&&hasData?[openingRow,...list]:list;
  const table=admin()?ledger(reportRows.map(row=>({...row,tanggal:formatReportDate(row.tanggal)})),false,true)
    : makeTable(['Uraian','Pemasukan','Pengeluaran','Saldo'],
      hasData?(startDate?'<tr><td>'+openingLabel+'</td><td class="money">—</td><td class="money">—</td><td class="money">'+money(opening)+'</td></tr>':'')+
      '<tr><td>Mutasi periode</td><td class="money">'+money(debet)+'</td><td class="money">'+money(kredit)+'</td><td class="money">'+money(closing)+'</td></tr>':'');
  const date=formatReportDate(reportPrintDate||currentDate);
  const address=info.alamat || 'Jl. Raya Cipeundeuy No. 260 Cipeundeuy – Subang 41272';
  const email=info.email || 'upzkeccipeundeuy1@gmail.com';
  const phone=info.telepon ? 'Telp. '+info.telepon : '';
  return '<section class="panel bku-report"><div class="toolbar no-print">'+reportFilters()+
    '<button id="print" '+(!hasData||profileState==='loading'?'disabled':'')+'>Cetak / Simpan PDF</button></div>'+
    '<div class="letterhead '+(logo?'has-logo':'')+'">'+(logo?'<img src="'+esc(logo)+'" alt="Logo lembaga">':'')+
    '<div><strong><span class="lh-line">BAZNAS KABUPATEN SUBANG</span><span class="lh-line lh-nowrap">UNIT PENGUMPUL ZAKAT (UPZ) KECAMATAN CIPEUNDEUY</span></strong>'+
    '<div class="letter-contact">'+esc(address)+(phone?'<br>'+esc(phone):'')+'<br>Email '+esc(email)+'</div></div></div>'+
    '<div class="report-title"><h1>'+title+'</h1><p>Periode '+esc(period)+(simulated?' · Data demo':'')+'</p></div>'+
    table+
    '<dl class="report-totals">'+
    [['Total Pemasukan',hasData?debet:null],['Total Pengeluaran',hasData?kredit:null],['Saldo Akhir',closing]]
      .map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+money(value)+'</dd></div>').join('')+'</dl>'+
    '<div class="report-signatures"><div><span>Mengetahui,</span><br>Ketua UPZ<strong>'+esc(officer('ketua')||'(____________________)')+'</strong></div>'+
    '<div><span>Cipeundeuy, '+esc(date)+'</span><br>Bendahara UPZ<strong>'+esc(officer('bendahara')||'(____________________)')+'</strong></div></div></section>';
}

function reportPrintName() {
  const today10 = today();
  const m = reportMonth||today10.slice(0,7), y = reportYear||today10.slice(0,4);
  const judul = admin()?'Laporan Buku Kas Umum':'Laporan Ringkasan Kas';
  const periode = reportPeriod==='month'?monthName.format(new Date(m+'-01T00:00:00Z')):reportPeriod==='year'?'Tahun '+y:'Semua Periode';
  return [judul,periode];
}
