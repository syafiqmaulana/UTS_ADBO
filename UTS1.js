/**
 * Class Karyawan
 * Mewakili entitas Karyawan dan melacak kuota cuti mereka.
 */
class Karyawan {
    constructor(idKaryawan, nama, peran) {
        this.idKaryawan = idKaryawan;
        this.nama = nama;
        this.peran = peran; // Contoh: "Karyawan", "Atasan", "HRD"
        
        // Inisialisasi kuota sesuai ketentuan perusahaan
        this.kuotaCuti = {
            "Cuti Tahunan": 12, // max kuota 12 hari
            "Cuti Sakit": 2,     // max kuota 2 hari
            "Cuti Melahirkan": 90 // max kuota 90 hari
        };
        this.riwayatCuti = [];
    }

    /**
     * Menampilkan sisa kuota cuti karyawan.
     */
    lihatKuota() {
        console.log(`\n--- Sisa Kuota Cuti untuk ${this.nama} ---`);
        for (const [jenis, kuota] of Object.entries(this.kuotaCuti)) {
            console.log(`- ${jenis}: ${kuota} hari`);
        }
        return this.kuotaCuti;
    }

    /**
     * Memotong kuota setelah cuti disetujui.
     */
    potongKuota(jenisCuti, jumlahHari) {
        if (this.kuotaCuti.hasOwnProperty(jenisCuti)) {
            this.kuotaCuti[jenisCuti] -= jumlahHari;
            return true;
        }
        return false;
    }
    
    /**
     * Menambahkan pengajuan ke riwayat cuti.
     */
    tambahRiwayat(pengajuan) {
        this.riwayatCuti.push(pengajuan);
    }
}

/**
 * Class AplikasiCuti
 * Kelas utama yang menangani alur kerja pengajuan dan persetujuan.
 */
class AplikasiCuti {
    constructor() {
        this.daftarKaryawan = new Map(); // idKaryawan -> Objek Karyawan
        this.pengajuanPending = [];
    }

    tambahKaryawan(karyawan) {
        this.daftarKaryawan.set(karyawan.idKaryawan, karyawan);
        console.log(`Karyawan ${karyawan.nama} (${karyawan.peran}) berhasil ditambahkan.`);
    }

    /**
     * Langkah 1: Karyawan mengajukan cuti.
     * Termasuk validasi kuota.
     */
    ajukanCuti(idKaryawan, jenisCuti, tglMulai, tglAkhir) {
        const karyawan = this.daftarKaryawan.get(idKaryawan);
        if (!karyawan) {
            console.log("Error: Karyawan tidak ditemukan.");
            return null;
        }

        // Asumsi sederhana: jumlah hari kalender
        const jumlahHari = (tglAkhir - tglMulai) + 1; 
        
        console.log(`\n--- Pengajuan dari ${karyawan.nama} (${jenisCuti}, ${jumlahHari} hari) ---`);

        // **VALIDASI SISTEM: CEK KUOTA**
        const kuotaTersedia = karyawan.kuotaCuti[jenisCuti] || 0;
        
        if (kuotaTersedia < jumlahHari) {
            // Sesuai permintaan: sistem menolak jika kuota tidak memenuhi syarat
            console.log(`**TOLAK:** Kuota anda tidak cukup untuk mengajukan cuti ini`);
            console.log(`Kuota tersedia (${jenisCuti}): ${kuotaTersedia} hari.`);
            return null;
        }

        // Jika kuota cukup, buat objek pengajuan dan kirim ke antrian pending
        const pengajuan = {
            idKaryawan: idKaryawan,
            jenis: jenisCuti,
            jumlahHari: jumlahHari,
            status: "Pending",
            diajukanOleh: karyawan.nama
        };
        this.pengajuanPending.push(pengajuan);
        console.log("Status: Pengajuan berhasil dibuat. Menunggu persetujuan Atasan/HRD.");
        return pengajuan;
    }

    /**
     * Langkah 2 & 3: Atasan atau HRD menyetujui/menolak.
     */
    persetujuanAtasan(pengajuan, idAtasan, statusPersetujuan) {
        const atasan = this.daftarKaryawan.get(idAtasan);
        if (!atasan || !["Atasan", "HRD"].includes(atasan.peran)) {
            console.log(`Error: Pengguna ${atasan ? atasan.nama : 'Unknown'} tidak memiliki wewenang persetujuan.`);
            return null;
        }

        const karyawan = this.daftarKaryawan.get(pengajuan.idKaryawan);
        
        pengajuan.status = statusPersetujuan;
        
        if (statusPersetujuan === "Disetujui") {
            karyawan.potongKuota(pengajuan.jenis, pengajuan.jumlahHari);
            karyawan.tambahRiwayat(pengajuan);
            console.log(`**SETUJU:** Cuti ${pengajuan.jenis} untuk ${karyawan.nama} telah disetujui oleh ${atasan.nama}.`);
            console.log(`Kuota ${pengajuan.jenis} baru: ${karyawan.kuotaCuti[pengajuan.jenis]} hari.`);
        } else {
            console.log(`**TOLAK:** Cuti ${pengajuan.jenis} untuk ${karyawan.nama} telah ditolak oleh ${atasan.nama}.`);
        }
            
        // Hapus dari daftar pending setelah diproses
        this.pengajuanPending = this.pengajuanPending.filter(p => p !== pengajuan);
        
        return pengajuan;
    }
}

// =================================================================
// SIMULASI UTAMA (MAIN EXECUTION)
// =================================================================

function main() {
    const aplikasi = new AplikasiCuti();

    // 1. Inisialisasi Karyawan
    const karyawanBudi = new Karyawan(101, "Budi", "Karyawan");
    const atasanSiti = new Karyawan(201, "Siti", "Atasan");
    const hrdDewi = new Karyawan(301, "Dewi", "HRD");

    aplikasi.tambahKaryawan(karyawanBudi);
    aplikasi.tambahKaryawan(atasanSiti);
    aplikasi.tambahKaryawan(hrdDewi);

    // --- Skenario 1: Pengajuan Berhasil ---
    console.log("\n" + "=".repeat(50));
    console.log("SKENARIO 1: PENGAJUAN BERHASIL (Cuti Tahunan 7 hari)");
    console.log("=".repeat(50));

    karyawanBudi.lihatKuota();

    // Ajukan Cuti Tahunan 7 hari (kuota awal 12)
    const pengajuan1 = aplikasi.ajukanCuti(101, "Cuti Tahunan", 1, 7); 

    if (pengajuan1) {
        // Atasan Siti menyetujui
        aplikasi.persetujuanAtasan(pengajuan1, 201, "Disetujui");
    }

    karyawanBudi.lihatKuota(); // Kuota Cuti Tahunan sisa 5

    // --- Skenario 2: Pengajuan Ditolak Otomatis (Kuota Tidak Cukup) ---
    console.log("\n" + "=".repeat(50));
    console.log("SKENARIO 2: PENGAJUAN DITOLAK OTOMATIS (Kuota Tidak Cukup)");
    console.log("=".repeat(50));

    // Coba ajukan 6 hari lagi (padahal sisa 5 hari)
    aplikasi.ajukanCuti(101, "Cuti Tahunan", 10, 15); 

    // --- Skenario 3: Cuti Lain dan Habis ---
    console.log("\n" + "=".repeat(50));
    console.log("SKENARIO 3: Cuti Sakit (2 hari)");
    console.log("=".repeat(50));

    // Ajukan Cuti Sakit 2 hari (kuota max 2)
    const pengajuan3 = aplikasi.ajukanCuti(101, "Cuti Sakit", 20, 21); 

    if (pengajuan3) {
        aplikasi.persetujuanAtasan(pengajuan3, 201, "Disetujui");
    }

    karyawanBudi.lihatKuota(); // Kuota Cuti Sakit sisa 0

    // Coba ajukan Cuti Sakit lagi
    console.log("\n" + "=".repeat(50));
    console.log("SKENARIO 4: Cuti Sakit Habis");
    console.log("=".repeat(50));
    aplikasi.ajukanCuti(101, "Cuti Sakit", 25, 25); 
}

// Menjalankan fungsi utama

main();
