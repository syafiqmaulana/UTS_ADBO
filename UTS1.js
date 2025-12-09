// =================================================================
// FILE: UTS1.js
// Sistem Cuti Karyawan 
// =================================================================

const readline = require('readline');

// --- Class Cuti (Menggantikan Class Karyawan) ---
class Cuti {
    constructor(idKaryawan, nama, peran) {
        this.idKaryawan = idKaryawan;
        this.nama = nama;
        this.peran = peran;
        this.kuotaCuti = {
            "Cuti Tahunan": 12,
            "Cuti Sakit": 2,
            "Cuti Melahirkan": 90 
        };
        this.riwayatCuti = [];
    }

    /** Menampilkan sisa kuota cuti karyawan. */
    lihatKuota() {
        console.log(`\n--- Sisa Kuota Cuti untuk ${this.nama} ---`);
        for (const [jenis, kuota] of Object.entries(this.kuotaCuti)) {
            console.log(`- ${jenis}: ${kuota} hari`);
        }
    }

    /** Memotong kuota setelah cuti disetujui. */
    potongKuota(jenisCuti, jumlahHari) {
        if (this.kuotaCuti.hasOwnProperty(jenisCuti)) {
            this.kuotaCuti[jenisCuti] -= jumlahHari;
            return true;
        }
        return false;
    }
    
    /** Menambahkan pengajuan ke riwayat. */
    tambahRiwayat(pengajuan) {
        this.riwayatCuti.push(pengajuan);
    }
}

// --- Class AplikasiCuti ---
class AplikasiCuti {
    constructor() {
        this.daftarKaryawan = new Map(); 
        this.pengajuanPending = [];
    }

    // Menghapus console.log di sini agar inisialisasi tidak ramai
    tambahKaryawan(cutiObjek) {
        this.daftarKaryawan.set(cutiObjek.idKaryawan, cutiObjek);
    }

    ajukanCuti(idKaryawan, jenisCuti, tglMulai, tglAkhir) {
        const cutiObjek = this.daftarKaryawan.get(idKaryawan);
        if (!cutiObjek) {
            console.log("Error: Karyawan tidak ditemukan.");
            return null;
        }

        const jumlahHari = (tglAkhir - tglMulai) + 1; 
        
        // Output hanya dipicu saat pengajuan interaktif, tidak saat inisialisasi
        if (idKaryawan === 101 && tglMulai >= 30) { 
             console.log(`\n--- Pengajuan dari ${cutiObjek.nama} (${jenisCuti}, ${jumlahHari} hari) ---`);
        }

        const kuotaTersedia = cutiObjek.kuotaCuti[jenisCuti] || 0;
        
        if (kuotaTersedia < jumlahHari) {
            console.log(`❌ **TOLAK:** Kuota anda tidak cukup untuk mengajukan cuti ini`);
            console.log(`Kuota tersedia (${jenisCuti}): ${kuotaTersedia} hari.`);
            return null;
        }

        const pengajuan = {
            idKaryawan: idKaryawan,
            jenis: jenisCuti,
            jumlahHari: jumlahHari,
            status: "Pending",
            diajukanOleh: cutiObjek.nama
        };
        this.pengajuanPending.push(pengajuan);
        
        // Output hanya dipicu saat pengajuan interaktif
        if (idKaryawan === 101 && tglMulai >= 30) {
            console.log("✅ Status: Pengajuan berhasil dibuat. Menunggu persetujuan Atasan/HRD.");
        }
        return pengajuan;
    }

    persetujuanAtasan(pengajuan, idAtasan, statusPersetujuan) {
        const atasan = this.daftarKaryawan.get(idAtasan);
        const cutiObjek = this.daftarKaryawan.get(pengajuan.idKaryawan);
        pengajuan.status = statusPersetujuan;
        
        if (statusPersetujuan === "Disetujui" && pengajuan.idKaryawan === 101 && pengajuan.jumlahHari > 0) {
            cutiObjek.potongKuota(pengajuan.jenis, pengajuan.jumlahHari);
            cutiObjek.tambahRiwayat(pengajuan);
            // Output hanya muncul untuk skenario interaktif
            if (pengajuan.jumlahHari > 0 && pengajuan.jenis !== "Cuti Sakit") { 
                console.log(`🟢 **SETUJU:** Cuti ${pengajuan.jenis} untuk ${cutiObjek.nama} disetujui oleh ${atasan.nama}.`);
                console.log(`Kuota ${pengajuan.jenis} baru: ${cutiObjek.kuotaCuti[pengajuan.jenis]} hari.`);
            }
        } 
            
        this.pengajuanPending = this.pengajuanPending.filter(p => p !== pengajuan);
        return pengajuan;
    }
}

// --- FUNGSI BANTU UNTUK INPUT INTERAKTIF ---
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

// =================================================================
// SIMULASI UTAMA (MAIN EXECUTION)
// =================================================================

async function main() {
    console.log("--- INISIALISASI SISTEM CUTI ---");
    const aplikasi = new AplikasiCuti();

    // 1. Inisialisasi Karyawan (Tanpa Console Log)
    const cutiBudi = new Cuti(101, "Budi", "Karyawan");
    const cutiSiti = new Cuti(201, "Siti", "Atasan");
    const cutiDewi = new Cuti(301, "Dewi", "HRD");

    aplikasi.tambahKaryawan(cutiBudi);
    aplikasi.tambahKaryawan(cutiSiti);
    aplikasi.tambahKaryawan(cutiDewi);

    // 2. Pra-proses Kuota (JANGAN TAMBAHKAN CONSOLE.LOG DI SINI)
    // Skenario 1: Cuti Tahunan 7 hari (12 -> 5)
    const p1 = aplikasi.ajukanCuti(101, "Cuti Tahunan", 1, 7); 
    if (p1) { aplikasi.persetujuanAtasan(p1, 201, "Disetujui"); }

    // Skenario 2: Ditolak otomatis (6 hari vs sisa 5 hari)
    aplikasi.ajukanCuti(101, "Cuti Tahunan", 10, 15); 

    // Skenario 3: Cuti Sakit 2 hari (2 -> 0)
    const p3 = aplikasi.ajukanCuti(101, "Cuti Sakit", 20, 21);
    if (p3) { aplikasi.persetujuanAtasan(p3, 201, "Disetujui"); }
    
    // Skenario 4: Ditolak otomatis (Cuti Sakit habis)
    aplikasi.ajukanCuti(101, "Cuti Sakit", 25, 25); 

    // =============================================================
    // --- START OUTPUT HANYA UNTUK INTERAKSI PENGGUNA ---
    // =============================================================
    console.log("\n" + "=".repeat(50));
    console.log("⚠️ PENGAJUAN CUTI INTERAKTIF (Fokus Output di Sini)");
    console.log("======================================");
    
    // Tampilkan kuota awal (setelah dipotong skenario di atas)
    cutiBudi.lihatKuota();

    console.log("\n*** SILAKAN MASUKKAN DETAIL PENGAJUAN CUTI ANDA ***");
    
    // Input Interaktif
    const jenisCutiAnda = await askQuestion("Jenis Cuti (Cuti Tahunan/Cuti Sakit/Cuti Melahirkan): ");
    let hariMulaiAnda = await askQuestion("Tanggal Mulai (Contoh: 40): ");
    let hariSelesaiAnda = await askQuestion("Tanggal Selesai (Contoh: 42): ");
    
    hariMulaiAnda = parseInt(hariMulaiAnda);
    hariSelesaiAnda = parseInt(hariSelesaiAnda);

    // Proses Pengajuan Interaktif
    const pengajuanInteraktif = aplikasi.ajukanCuti(
        101, // ID Karyawan Budi
        jenisCutiAnda, 
        hariMulaiAnda, 
        hariSelesaiAnda
    ); 

    // Proses Persetujuan
    if (pengajuanInteraktif) {
        // Output persetujuan hanya akan muncul jika lolos validasi cuti di metode di atas
        aplikasi.persetujuanAtasan(pengajuanInteraktif, 201, "Disetujui");
    }

    // Lihat sisa kuota setelah pengajuan interaktif
    console.log("\n--- HASIL AKHIR SETELAH PENGAJUAN ANDA ---");
    cutiBudi.lihatKuota(); 
}

main();

