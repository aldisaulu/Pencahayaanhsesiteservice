// ==============================
// Default state Desk/Panel (agar export PDF/Excel tidak error bila UI Desk/Panel belum terpasang)
// ==============================
let currentDeskPanelMode = 'off'; // 'off' | 'desk' | 'panel'
let currentDeskPanelCount = 1;
const deletedDeskPanelCards = new Set();


// ==============================
// Mode existing: tabel titik
// ==============================

// Fungsi untuk menghasilkan tabel berdasarkan jumlah titik pengukuran
function generateTable() {
    const titikPengukuran = parseInt(document.getElementById('titikPengukuran').value, 10);
    const tableBody = document.getElementById('tableBody');

    tableBody.innerHTML = '';

    for (let i = 1; i <= titikPengukuran; i++) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${i}</td>
            <td>Titik ${i}</td>
            <td>
                <input type="number" id="lux-${i}-1" placeholder="Lux 1" min="0" step="0.01">
            </td>
            <td>
                <input type="number" id="lux-${i}-2" placeholder="Lux 2" min="0" step="0.01">
            </td>
            <td>
                <input type="number" id="lux-${i}-3" placeholder="Lux 3" min="0" step="0.01">
            </td>
            <td>
                <button class="delete-btn" onclick="deleteRow(${i})">Hapus</button>
            </td>
        `;

        tableBody.appendChild(row);
    }

    document.getElementById('averageResult').textContent = '-';
    const keterangan = document.getElementById('keteranganStandar');
    if (keterangan) keterangan.innerHTML = '&nbsp;';

    // sembunyikan popup saat regenerasi
    const popup = document.getElementById('completePopup');
    if (popup) popup.style.display = 'none';

    setupLuxEnterNavigation();
}

// Fungsi untuk mengaktifkan behavior saat Enter ditekan di input lux
function setupLuxEnterNavigation() {
    const titikPengukuranEl = document.getElementById('titikPengukuran');
    const titikPengukuran = parseInt(titikPengukuranEl ? titikPengukuranEl.value : '0', 10);

    if (!Number.isFinite(titikPengukuran) || titikPengukuran <= 0) return;

    for (let i = 1; i <= titikPengukuran; i++) {
        for (let k = 1; k <= 3; k++) {
            const input = document.getElementById(`lux-${i}-${k}`);
            if (!input) continue;

            input.onkeydown = null;

            input.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();

                // urutan: lux i-1 -> i-2 -> i-3 -> titik berikutnya lux-1
                let nextI = i;
                let nextK = k + 1;

                if (nextK > 3) {
                    nextI = i + 1;
                    nextK = 1;
                }

                if (nextI <= titikPengukuran) {
                    const nextInput = document.getElementById(`lux-${nextI}-${nextK}`);
                    if (nextInput) {
                        nextInput.focus();
                        nextInput.select();
                    }
                }
            });
        }
    }
}

// Fungsi untuk menghapus nilai lux pada titik tertentu saja
function deleteRow(rowNumber) {
    const i1 = document.getElementById(`lux-${rowNumber}-1`);
    const i2 = document.getElementById(`lux-${rowNumber}-2`);
    const i3 = document.getElementById(`lux-${rowNumber}-3`);

    if (i1) i1.value = '';
    if (i2) i2.value = '';
    if (i3) i3.value = '';

    calculateAverage();
}

// Isi otomatis 1 nilai lux ke kolom berikutnya secara berurutan.
// Urutan: Titik 1 Lux 1 -> Titik 1 Lux 2 -> Titik 1 Lux 3 -> Titik 2 Lux 1 -> dst.
function submitLuxToAllPoints() {
    const bulkLuxInput = document.getElementById('bulkLuxInput');
    if (!bulkLuxInput) return;

    const raw = (bulkLuxInput.value || '').trim();
    if (!raw) {
        alert('Masukkan nilai lux terlebih dahulu!');
        return;
    }

    const luxValue = parseFloat(raw);
    if (isNaN(luxValue) || luxValue < 0) {
        alert('Nilai lux harus berupa angka >= 0');
        return;
    }

    const titikPengukuranEl = document.getElementById('titikPengukuran');
    const titikPengukuran = parseInt(titikPengukuranEl ? titikPengukuranEl.value : '0', 10);
    const maxI = Number.isFinite(titikPengukuran) && titikPengukuran > 0 ? titikPengukuran : 0;

    if (maxI <= 0) {
        alert('Jumlah titik pengukuran belum valid!');
        return;
    }

    let filled = false;

    for (let i = 1; i <= maxI; i++) {
        const i1 = document.getElementById(`lux-${i}-1`);
        const i2 = document.getElementById(`lux-${i}-2`);
        const i3 = document.getElementById(`lux-${i}-3`);
        if (!i1 || !i2 || !i3) continue;

        if (i1.value === '') {
            i1.value = luxValue;
            filled = true;
            break;
        }

        if (i2.value === '') {
            i2.value = luxValue;
            filled = true;
            break;
        }

        if (i3.value === '') {
            i3.value = luxValue;
            filled = true;
            break;
        }
    }

    if (!filled) {
        alert('Semua titik sudah terisi!');
        return;
    }

    // Jangan mengosongkan input agar user tidak perlu hapus manual.
    // Fokuskan dan seleksi teks supaya mudah mengetik nilai lux baru.
    bulkLuxInput.focus();
    bulkLuxInput.select();

    calculateAverage();
    checkAllLuxFilledAndShowPopup();
}

// Fungsi untuk menghitung rata-rata
function calculateAverage() {
    const titikPengukuran = parseInt(document.getElementById('titikPengukuran').value);
    let totalLux = 0;
    let count = 0;

    for (let i = 1; i <= titikPengukuran; i++) {
        for (let k = 1; k <= 3; k++) {
            const luxInput = document.getElementById(`lux-${i}-${k}`);
            if (luxInput && luxInput.value !== '') {
                const luxValue = parseFloat(luxInput.value);
                if (!isNaN(luxValue) && luxValue >= 0) {
                    totalLux += luxValue;
                    count++;
                }
            }
        }
    }

    const resultElement = document.getElementById('averageResult');
    const standarEl = document.getElementById('standarLux');
    const keteranganEl = document.getElementById('keteranganStandar');

    if (count === 0) {
        resultElement.textContent = '-';
        if (keteranganEl) keteranganEl.innerHTML = '&nbsp;';
        resultElement.style.color = '';
        return;
    }

    const average = totalLux / count;
    resultElement.textContent = average.toFixed(2);

    const standarLux = standarEl ? parseFloat(standarEl.value) : NaN;
    if (!isNaN(standarLux) && standarLux >= 0) {
        if (average < standarLux) {
            resultElement.style.color = '#e74c3c';
            if (keteranganEl) keteranganEl.innerHTML = `(<b>Jumlah lux tidak memenuhi standar</b>)`;
        } else {
            resultElement.style.color = '#27ae60';
            if (keteranganEl) keteranganEl.innerHTML = `(<b>Jumlah lux memenuhi standar</b>)`;
        }
    } else {
        resultElement.style.color = '';
        if (keteranganEl) keteranganEl.innerHTML = '&nbsp;';
    }

    return average;
}

// Fungsi untuk export ke Excel (CSV)
function exportToExcel() {
    const lokasi = document.getElementById('lokasi').value.trim();
    const tanggal = document.getElementById('tanggal').value;
    const jam = document.getElementById('jam').value;
    const titikPengukuran = parseInt(document.getElementById('titikPengukuran').value, 10);
    const averageResult = document.getElementById('averageResult').textContent;

    const petugasNama = getNamaPetugas();
    if (!petugasNama) {
        alert('Nama petugas wajib diisi sebelum export!');
        return;
    }

    const koordinatLat = document.getElementById('koordinatLat')?.value || '-';
    const koordinatLng = document.getElementById('koordinatLng')?.value || '-';
    const standarLux = document.getElementById('standarLux')?.value || '-';

    const averageNumber = parseFloat(averageResult);
    const standarLuxNumber = parseFloat(standarLux);
    const isAverageNotMeetsStandard = Number.isFinite(averageNumber) && Number.isFinite(standarLuxNumber) && averageNumber < standarLuxNumber;
    const averageMeetsStandardText = (!Number.isFinite(averageNumber) || !Number.isFinite(standarLuxNumber))
        ? ''
        : (isAverageNotMeetsStandard
            ? 'TIDAK MEMENUHI STANDAR'
            : 'MEMENUHI STANDAR');


    if (!lokasi) {
        alert('Mohon masukkan nama lokasi!');
        return;
    }
    if (!tanggal) {
        alert('Mohon pilih tanggal!');
        return;
    }
    if (!jam) {
        alert('Mohon pilih jam!');
        return;
    }
    if (averageResult === '-') {
        alert('Mohon hitung rata-rata terlebih dahulu!');
        return;
    }

    // Collect lux data per titik: lux1/lux2/lux3
    let luxData = [];
    for (let i = 1; i <= titikPengukuran; i++) {
        const lux1 = document.getElementById(`lux-${i}-1`);
        const lux2 = document.getElementById(`lux-${i}-2`);
        const lux3 = document.getElementById(`lux-${i}-3`);
        if (!lux1 || !lux2 || !lux3) continue;

        const hasAny = lux1.value !== '' || lux2.value !== '' || lux3.value !== '';
        if (!hasAny) continue;

        luxData.push({
            no: i,
            titik: `Titik ${i}`,
            lux1: lux1.value,
            lux2: lux2.value,
            lux3: lux3.value,
        });
    }

    if (luxData.length === 0) {
        alert('Mohon masukkan setidaknya satu nilai lux!');
        return;
    }

    const catatanInput = document.getElementById('catatanInput');
    const catatanText = catatanInput ? catatanInput.value.trim() : '';

    let csvContent = '\uFEFF'; // BOM for UTF-8
    csvContent += 'PENGUKURAN PENCAHAYAAN\n';
    csvContent += '\n';
    csvContent += 'Nama Lokasi,' + lokasi + '\n';
    csvContent += 'Tanggal,' + tanggal + '\n';
    csvContent += 'Jam,' + jam + '\n';
    csvContent += 'Jumlah Titik Pengukuran,' + titikPengukuran + '\n';
    csvContent += 'Nama Petugas,' + petugasNama + '\n';
    csvContent += 'Koordinat Lat,' + koordinatLat + '\n';
    csvContent += 'Koordinat Lng,' + koordinatLng + '\n';
    csvContent += 'Standar Baku Mutu (lux),' + standarLux + '\n';
    csvContent += '\n';

    // ======= EXPORT FIXED: Titik di kolom, Lux di baris =======
    // Mapping di Excel (konsep yang diminta):
    // - Kolom bertambah untuk titik: Titik 1 => kolom pertama, Titik 2 => kolom kedua, dst.
    // - Baris: Lux 1, Lux 2, Lux 3 berurutan.

    const luxByNo = new Map();
    luxData.forEach((row) => luxByNo.set(row.no, row));

    // header: Variabel/Lux (kolom pertama), lalu Titik 1..N
    csvContent += 'Variabel/Lux,';
    for (let i = 1; i <= titikPengukuran; i++) {
        csvContent += `Titik ${i}`;
        if (i < titikPengukuran) csvContent += ',';
    }
    csvContent += '\n';

    const writeLuxLine = (k) => {
        const label = k === 1 ? 'Lux 1 (lux)' : (k === 2 ? 'Lux 2 (lux)' : 'Lux 3 (lux)');
        csvContent += label + ',';

        for (let i = 1; i <= titikPengukuran; i++) {
            const row = luxByNo.get(i);
            let val = '';

            if (row) {
                if (k === 1) val = row.lux1;
                else if (k === 2) val = row.lux2;
                else val = row.lux3;
            }

            csvContent += val !== undefined ? val : '';
            if (i < titikPengukuran) csvContent += ',';
        }

        csvContent += '\n';
    };

    writeLuxLine(1);
    writeLuxLine(2);
    writeLuxLine(3);

    csvContent += '\n';
    csvContent += 'Rata-rata Pencahayaan,' + averageResult + ' lux\n';

    if (isAverageNotMeetsStandard) {
        csvContent += 'Catatan,Hasil rata-rata tidak memenuhi standar baku mutu\n';
    }

    if (catatanText) {
        csvContent += '\n';
        csvContent += 'Catatan,' + catatanText + '\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fileName = 'Pencahayaan_' + lokasi.replace(/\s+/g, '_') + '_' + tanggal + '.csv';

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert('Data berhasil di-export ke Excel!');
}

function loadScript(src) {
    return new Promise(function(resolve, reject) {
        const script = document.createElement('script');
        const separator = src.includes('?') ? '&' : '?';
        script.src = src + separator + 't=' + Date.now();
        script.async = false;
        script.onload = function() {
            script.setAttribute('data-loaded', 'true');
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function loadJsPdfLibrary() {
    if (window.jspdf && window.jspdf.jsPDF) {
        return window.jspdf;
    }

    try {
        await loadScript('libs/jspdf.umd.min.js');
    } catch (localError) {
        console.warn('Local jsPDF failed to load:', localError);
    }

    if (window.jspdf && window.jspdf.jsPDF) {
        return window.jspdf;
    }

    try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js');
    } catch (cdnError) {
        console.warn('CDN jsPDF failed to load:', cdnError);
    }

    return window.jspdf || null;
}

function downloadPdfFile(doc, fileName) {
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
        const openedWindow = window.open(pdfUrl, '_blank', 'noopener');
        if (!openedWindow) {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.target = '_blank';
            link.rel = 'noopener';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } else {
        doc.save(fileName);
    }

    setTimeout(() => URL.revokeObjectURL(pdfUrl), 30000);
}

// Fungsi untuk export ke PDF
async function exportToPdf() {
    const lokasi = document.getElementById('lokasi').value.trim();
    const tanggal = document.getElementById('tanggal').value;
    const jam = document.getElementById('jam').value;
    const titikPengukuran = document.getElementById('titikPengukuran').value;
    const averageResult = document.getElementById('averageResult').textContent;

    const petugasNama = getNamaPetugas();
    if (!petugasNama) {
        alert('Nama petugas wajib diisi sebelum export!');
        return;
    }

    const koordinatLat = document.getElementById('koordinatLat')?.value || '-';
    const koordinatLng = document.getElementById('koordinatLng')?.value || '-';
    const standarLuxElValue = document.getElementById('standarLux')?.value || '-';
    const averageNumber = parseFloat(averageResult);
    const standarLuxNumber = parseFloat(standarLuxElValue);
    const isMeetsStandard = Number.isFinite(averageNumber) && Number.isFinite(standarLuxNumber) && averageNumber >= standarLuxNumber;
    const resultBgColor = isMeetsStandard ? [232, 245, 233] : [252, 238, 238];
    const resultAccentColor = isMeetsStandard ? [40, 167, 69] : [220, 53, 69];
    const resultTextColor = isMeetsStandard ? [40, 167, 69] : [185, 0, 0];

    if (!lokasi) {
        alert('Mohon masukkan nama lokasi terlebih dahulu!');
        document.getElementById('lokasi').focus();
        return;
    }
    if (!tanggal) {
        alert('Mohon pilih tanggal!');
        return;
    }
    if (!jam) {
        alert('Mohon pilih jam!');
        return;
    }
    if (averageResult === '-') {
        alert('Mohon hitung rata-rata pencahayaan terlebih dahulu!');
        return;
    }

    try {
        const jspdfLibrary = await loadJsPdfLibrary();
        if (!jspdfLibrary || !jspdfLibrary.jsPDF) {
            alert('Library PDF belum tersedia. Pastikan koneksi internet aktif saat pertama kali membuka web, lalu coba lagi.');
            return;
        }

        const doc = new jspdfLibrary.jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);
        let y = margin;

        // === HEADER ===
        doc.setTextColor(24, 90, 157);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('HASIL PENGUKURAN PENCAHAYAAN', pageWidth / 2, y + 5, { align: 'center' });
        y += 12;

        // === INFO BOX ===
        const colW = contentWidth / 3;
        doc.setFillColor(240, 244, 248);

        const lokasiLineHeight = 3.5;
        const wrapByWords = (text, wordsPerLine) => {
            const words = (text || '-').split(/\s+/);
            const lines = [];
            for (let i = 0; i < words.length; i += wordsPerLine) {
                lines.push(words.slice(i, i + wordsPerLine).join(' '));
            }
            return lines;
        };

        const lokasiLines = wrapByWords(lokasi, 3);
        const infoBoxHeight = 25 + Math.max(0, (lokasiLines.length - 1) * lokasiLineHeight) + 7;
        doc.rect(margin, y, contentWidth, infoBoxHeight, 'F');

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const infoY = y + 5;

        // Row 1
        doc.setFont('helvetica', 'bold');
        doc.text('Lokasi:', margin + 3, infoY);
        doc.setFont('helvetica', 'normal');
        lokasiLines.forEach((line, idx) => {
            const lineY = infoY + (idx * lokasiLineHeight);
            doc.text(line, margin + 23, lineY);
        });

        // Row 1 col
        doc.setFont('helvetica', 'bold');
        doc.text('Tanggal:', margin + 3 + colW, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(tanggal || '-', margin + 23 + colW, infoY);

        doc.setFont('helvetica', 'bold');
        doc.text('Jam:', margin + 3 + colW * 2, infoY);
        doc.setFont('helvetica', 'normal');
        doc.text(jam || '-', margin + 23 + colW * 2, infoY);

        // Row 2
        const infoRow1Height = lokasiLines.length * lokasiLineHeight;
        const infoY2 = infoY + 7 + Math.max(0, infoRow1Height - 3.5);

        doc.setFont('helvetica', 'bold');
        doc.text('Jumlah Titik:', margin + 3, infoY2);
        doc.setFont('helvetica', 'normal');
        doc.text(titikPengukuran + ' titik', margin + 23, infoY2);

        // Row 3
        const infoY3 = infoY2 + 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Petugas:', margin + 3, infoY3);
        doc.setFont('helvetica', 'normal');
        doc.text(petugasNama || '-', margin + 23, infoY3);

        doc.setFont('helvetica', 'bold');
        doc.text('Koordinat:', margin + 3 + colW, infoY3);
        doc.setFont('helvetica', 'normal');
        doc.text(`(${koordinatLat || '-'}, ${koordinatLng || '-'})`, margin + 23 + colW, infoY3);

        doc.setFont('helvetica', 'bold');
        doc.text('Standar Lux:', margin + 3 + colW * 2, infoY3);
        doc.setFont('helvetica', 'normal');
        doc.text(standarLuxElValue || '-', margin + 23 + colW * 2, infoY3);

        y += infoBoxHeight + 5;

        // === DATA TABLE ===
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);

        const titikRegularCount = parseInt(titikPengukuran, 10);

        if (titikRegularCount > 0) {
            doc.text('DATA PENGUKURAN TITIK', margin, y);
            y += 6;

            doc.setFillColor(24, 90, 157);
            doc.rect(margin, y, contentWidth, 7, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');

            const colWidth = contentWidth / 2.7;
            doc.text('No.', margin + 2, y + 5);
            doc.text('Titik Pengukuran', margin + colWidth + 2, y + 5);
            doc.text('Lux 1-3 (lux)', margin + colWidth * 2 + 2, y + 5);
            y += 7;

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            for (let i = 1; i <= titikPengukuran; i++) {
                const lux1 = document.getElementById(`lux-${i}-1`);
                const lux2 = document.getElementById(`lux-${i}-2`);
                const lux3 = document.getElementById(`lux-${i}-3`);

                if (!lux1 || !lux2 || !lux3) continue;

                const hasAny = lux1.value !== '' || lux2.value !== '' || lux3.value !== '';
                if (!hasAny) continue;

                const luxValue = `${lux1.value || '-'} / ${lux2.value || '-'} / ${lux3.value || '-'}`;

                if (y + 6 > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }

                doc.setDrawColor(200, 200, 200);
                doc.rect(margin, y, contentWidth, 6);
                doc.text(String(i), margin + 2, y + 4);
                doc.text('Titik ' + i, margin + colWidth + 2, y + 4);
                doc.text(luxValue, margin + colWidth * 2 + 2, y + 4);
                y += 6;
            }

            y += 5;
        }

        // === RATA-RATA HASIL ===
        const resultBoxHeight = 15;
        doc.setFillColor(...resultBgColor);
        doc.rect(margin, y, contentWidth, resultBoxHeight, 'F');

        doc.setFillColor(...resultAccentColor);
        doc.rect(margin, y, 3, resultBoxHeight, 'F');

        doc.setTextColor(51, 51, 51);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('RATA-RATA PENCAHAYAAN', margin + 5, y + 5);

        doc.setTextColor(...resultTextColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(averageResult + ' lux', margin + 5, y + 12);

        y += resultBoxHeight + 5;

        // === CATATAN ===
        const catatanInput = document.getElementById('catatanInput');
        const catatanText = catatanInput ? catatanInput.value.trim() : '';

        if (catatanText) {
            const noteBoxHeight = 15;
            doc.setFillColor(255, 243, 205);
            doc.rect(margin, y, contentWidth, noteBoxHeight, 'F');

            doc.setFillColor(255, 193, 7);
            doc.rect(margin, y, 3, noteBoxHeight, 'F');

            doc.setTextColor(133, 100, 4);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('CATATAN:', margin + 5, y + 5);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            const noteLines = doc.splitTextToSize(catatanText, contentWidth - 10);
            let noteY = y + 9;
            noteLines.forEach((line, index) => {
                if (index < 2) {
                    doc.text(line, margin + 5, noteY + (index * 4));
                }
            });

            y += noteBoxHeight + 5;
        }

        // === FOOTER ===
        doc.setTextColor(153, 153, 153);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.text('Dokumen ini dibuat secara otomatis oleh Sistem Pengukuran Pencahayaan', pageWidth / 2, pageHeight - 5, { align: 'center' });

        const namaFile = `Pencahayaan_${lokasi.replace(/\s+/g, '_')}_${tanggal}.pdf`;
        downloadPdfFile(doc, namaFile);

    } catch (err) {
        console.error('Error generating PDF:', err);
        alert('Gagal membuat PDF: ' + err.message);
    }
}

// Fungsi untuk meminta konfirmasi sebelum reset
function confirmReset() {
    const confirmMsg = confirm('Apakah Anda yakin ingin mereset pengukuran? Data yang ada akan dihapus.');
    if (confirmMsg) {
        resetForm();
    }
}

// Fungsi untuk reset form dan memulai pengukuran baru
function resetForm() {
    document.getElementById('lokasi').value = '';
    document.getElementById('averageResult').textContent = '-';

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggal').value = today;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('jam').value = hours + ':' + minutes;

    document.getElementById('titikPengukuran').value = '8';

    generateTable();

    if (currentDeskPanelMode !== 'off') {
        toggleDeskPanelMode();
    }
    maxDeskPanelCount = 1;
    deletedDeskPanelCards.clear();

    document.getElementById('lokasi').focus();
}

// Initialize table on page load
function getNamaPetugas() {
    const petugasSelect = document.getElementById('petugasSelect');
    const petugasLainnya = document.getElementById('petugasLainnya');
    if (!petugasSelect) return null;

    if (petugasSelect.value === 'hayrul') return 'Hayrul Amri';
    if (petugasSelect.value === 'ival') return 'Ival Maharadi';

    if (petugasSelect.value === 'ketik') {
        const nama = (petugasLainnya?.value || '').trim();
        return nama || null;
    }

    return null;
}

function handlePetugasOption() {
    const petugasSelect = document.getElementById('petugasSelect');
    const petugasLainnya = document.getElementById('petugasLainnya');
    if (!petugasSelect || !petugasLainnya) return;

    if (petugasSelect.value === 'ketik') {
        petugasLainnya.style.display = 'inline-block';
        petugasLainnya.focus();
    } else {
        petugasLainnya.style.display = 'none';
        petugasLainnya.value = '';
    }
}

function checkAllLuxFilledAndShowPopup() {
    const titikPengukuran = parseInt(document.getElementById('titikPengukuran').value, 10);
    if (!Number.isFinite(titikPengukuran) || titikPengukuran <= 0) return;

    for (let i = 1; i <= titikPengukuran; i++) {
        for (let k = 1; k <= 3; k++) {
            const el = document.getElementById(`lux-${i}-${k}`);
            if (!el) return;
            if (el.value === '' || el.value === null || el.value === undefined) {
                return;
            }
        }
    }

    const popup = document.getElementById('completePopup');
    if (!popup) return;
    popup.style.display = 'block';
    popup.style.opacity = '1';
    popup.style.transform = 'translate(-50%, 0)';
    popup.textContent = 'Semua titik terisi';

    clearTimeout(window.__popupLuxTimer);
    window.__popupLuxTimer = setTimeout(() => {
        popup.style.opacity = '0';
        popup.style.transform = 'translate(-50%, -6px)';
        setTimeout(() => {
            popup.style.display = 'none';
        }, 200);
    }, 1600);
}

function getCurrentCoordinates() {
    const statusEl = document.getElementById('koordinatStatus');
    const latEl = document.getElementById('koordinatLat');
    const lngEl = document.getElementById('koordinatLng');

    if (!navigator.geolocation) {
        if (statusEl) statusEl.textContent = 'Geolocation tidak didukung browser.';
        return;
    }

    if (statusEl) statusEl.textContent = 'Mengambil koordinat...';

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            if (latEl) latEl.value = lat.toFixed(6);
            if (lngEl) lngEl.value = lng.toFixed(6);
            if (statusEl) statusEl.textContent = 'Koordinat berhasil diambil.';
        },
        (err) => {
            if (statusEl) statusEl.textContent = `Gagal mengambil koordinat: ${err.message || err}`;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

document.addEventListener('DOMContentLoaded', function() {
    generateTable();

    const today = new Date().toISOString().split('T')[0];
    const tanggalEl = document.getElementById('tanggal');
    if (tanggalEl) tanggalEl.value = today;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const jamEl = document.getElementById('jam');
    if (jamEl) jamEl.value = hours + ':' + minutes;

    // default petugas & koordinat UI
    const petugasSelect = document.getElementById('petugasSelect');
    handlePetugasOption();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js').then(function(registration) {
            console.log('Service Worker registered:', registration.scope);
        }).catch(function(error) {
            console.log('Service Worker registration failed:', error);
        });
    });
}

