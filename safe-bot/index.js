require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const { handleMessage } = require('./src/handlers/messageHandler');

// Cek apakah API Key ada
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    console.error('CRITICAL ERROR: GEMINI_API_KEY belum diatur di file .env!');
    console.error('Silakan isi file .env dengan API key Anda sebelum menjalankan bot ini.');
    process.exit(1);
}

// Inisialisasi WhatsApp Client
console.log('Inisialisasi sistem S.I.N.A.R. AI Bot...');
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    }
});

// Event saat QR Code perlu di-scan
client.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error('Error generating QR code:', err);
            return;
        }
        
        // Halaman HTML auto-refresh setiap 3 detik
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Scan S.I.N.A.R Bot</title>
            <!-- Auto refresh setiap 3 detik agar QR selalu up-to-date -->
            <meta http-equiv="refresh" content="3">
            <style>
                body { display:flex; justify-content:center; align-items:center; height:100vh; background-color:#f0f2f5; font-family: sans-serif; }
                .container { text-align:center; padding: 40px; background: white; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .warning { color: #d9534f; font-size: 14px; font-weight: bold; margin-top: -10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>📱 Scan QR Code S.I.N.A.R. Bot</h2>
                <p class="warning">Halaman ini akan auto-refresh setiap 3 detik</p>
                <img src="${url}" style="width: 300px; height: 300px;" alt="QR Code"/>
                <p>Buka WhatsApp di HP Anda > Linked Devices > Link a Device</p>
            </div>
        </body>
        </html>
        `;
        
        fs.writeFileSync('qr.html', html);
        console.log('\n==================================================');
        console.log('⏳ MENUNGGU SCAN QR CODE');
        console.log('KLIK BUKA FILE INI DI BROWSER: file:///d:/Lomba/safe-bot/qr.html');
        console.log('Halaman akan otomatis me-refresh QR code baru setiap 3 detik.');
        console.log('==================================================');
    });
});

// Event saat proses otentikasi berhasil
client.on('authenticated', () => {
    console.log('✅ Otentikasi WhatsApp Berhasil! Menyimpan sesi...');
});

// Event saat proses otentikasi gagal
client.on('auth_failure', (msg) => {
    console.error('❌ Otentikasi WhatsApp Gagal:', msg);
    console.error('Mohon restart bot ini.');
});

// Event saat client sudah terhubung ke WA Web secara penuh
client.on('ready', () => {
    console.log('\n==================================================');
    console.log('🚀 S.I.N.A.R. WhatsApp Bot BERHASIL TERHUBUNG!');
    console.log('Bot siap menerima pesan. Coba kirim: .ai halo');
    console.log('==================================================\n');
});

// Event saat WhatsApp disconnect (misal dilogout dari HP)
client.on('disconnected', (reason) => {
    console.log('⚠️ Client was logged out or disconnected:', reason);
    console.log('Menutup program...');
    process.exit(0);
});

// Menggunakan message_create agar membaca pesan yang dikirim oleh diri sendiri (untuk testing)
client.on('message_create', async (message) => {
    // Abaikan status WA
    if (message.isStatus) return;
    
    // Serahkan pemrosesan ke messageHandler terpusat
    await handleMessage(message);
});

// Mulai jalankan client
client.initialize();
