/**
 * Message Handler
 * Merouting semua pesan masuk (teks & media)
 */

const { checkRedFlags, EMERGENCY_TEMPLATE } = require('../services/redFlagCheck');
const { generateTextResponse, generateImageResponse } = require('../services/aiService');
const { getSession, addMessageToHistory, resetSession } = require('../state/sessionManager');

// Rate limiting sederhana: Max 5 request per menit per user
const rateLimits = new Map();

function checkRateLimit(chatId) {
    const now = Date.now();
    const userLimit = rateLimits.get(chatId) || { count: 0, lastReset: now };

    // Reset limit setelah 1 menit
    if (now - userLimit.lastReset > 60000) {
        userLimit.count = 0;
        userLimit.lastReset = now;
    }

    userLimit.count++;
    rateLimits.set(chatId, userLimit);

    return userLimit.count <= 10; // Max 10 pesan / menit
}

async function handleMessage(message) {
    const chatId = message.from;
    const isAiCommand = message.body.toLowerCase().startsWith('.ai');
    const isResetCommand = message.body.toLowerCase() === '.reset';
    const isHelpCommand = message.body.toLowerCase() === '.help';

    // 1. Handle command .help
    if (isHelpCommand) {
        return message.reply(
            '*🤖 Panduan Penggunaan S.I.N.A.R. AI*\n\n' +
            'Gunakan awalan *.ai* untuk berkonsultasi tentang kesehatan hidung dan sinus Anda.\n\n' +
            '📌 *Contoh Teks:*\n' +
            '_.ai Hidung saya sering tersumbat saat pagi hari, kenapa ya?_\n\n' +
            '📷 *Analisis Foto:*\n' +
            'Kirim foto (misal cairan hidung) dengan *caption*: _.ai tolong cek ini_\n\n' +
            '🔄 *Reset Sesi:*\n' +
            'Gunakan perintah *.reset* untuk menghapus riwayat konsultasi saat ini dan mengulang dari awal.'
        );
    }

    // 2. Handle command .reset
    if (isResetCommand) {
        resetSession(chatId);
        return message.reply('🔄 Riwayat konsultasi berhasil dihapus. Silakan ketik *.ai [pertanyaan]* untuk memulai sesi baru.');
    }

    // 3. Handle konsultasi (.ai)
    if (isAiCommand) {
        if (!checkRateLimit(chatId)) {
            return message.reply('⚠️ Anda mengirim pesan terlalu cepat. Silakan tunggu sebentar sebelum mencoba lagi.');
        }

        const userPrompt = message.body.slice(3).trim(); // Hapus awalan .ai

        try {
            await message.react('⏳');

            // --- RED FLAG CHECK ---
            const redFlagResult = checkRedFlags(userPrompt);
            if (redFlagResult.isRedFlag) {
                console.log(`[Red Flag] Terdeteksi pada ${chatId}: ${redFlagResult.matchedKeywords.join(', ')}`);
                await message.react('🚨');
                return message.reply(EMERGENCY_TEMPLATE);
            }

            // Dapatkan / buat sesi
            const session = getSession(chatId);

            // --- MULTI-MODAL (IMAGE) HANDLING ---
            if (message.hasMedia) {
                const media = await message.downloadMedia();

                // Pastikan media adalah gambar
                if (media && media.mimetype.startsWith('image/')) {
                    // Cek ukuran (max 5MB estimasi base64 length)
                    if (media.data.length > 7000000) {
                        await message.react('❌');
                        return message.reply('⚠️ Maaf, ukuran gambar terlalu besar. Mohon kirim gambar di bawah 5MB.');
                    }

                    console.log(`[Media Masuk] Menganalisis gambar dari ${chatId}`);

                    // Generate respon gambar + konteks history
                    const responseText = await generateImageResponse(media.data, media.mimetype, session.history);

                    // Simpan ke history (teks dari user, walau kirim gambar)
                    addMessageToHistory(chatId, 'user', userPrompt || '[Mengirim Gambar]');
                    addMessageToHistory(chatId, 'model', responseText);

                    await message.react('✅');
                    return message.reply(responseText);
                } else {
                    await message.react('❌');
                    return message.reply('⚠️ Maaf, AI saat ini hanya mendukung analisis file berupa *Gambar* (JPG/PNG).');
                }
            }

            // --- TEXT HANDLING ---
            if (userPrompt.length === 0) {
                return message.reply('Ketik *.ai [spasi] [keluhan/pertanyaan]* untuk memulai. Contoh: _.ai hidung saya mampet sebelah_');
            }

            console.log(`[Teks Masuk] ${chatId}: ${userPrompt}`);

            // Simpan input user ke history
            addMessageToHistory(chatId, 'user', userPrompt);

            // Generate respons
            const responseText = await generateTextResponse(session.history);

            // Simpan respons AI ke history
            addMessageToHistory(chatId, 'model', responseText);

            await message.react('✅');
            await message.reply(responseText);

        } catch (error) {
            console.error('[MessageHandler] Error:', error.message);
            await message.react('❌');

            if (error.message === 'API_KEY_ERROR') {
                message.reply('⚠️ *Sistem Error*: API Key AI tidak valid atau ditolak. Mohon periksa pengaturan API Key.');
            } else if (error.message === 'RATE_LIMIT') {
                message.reply('⚠️ *Sistem Sibuk*: Limit penggunaan AI tercapai. Silakan coba beberapa saat lagi.');
            } else {
                message.reply('⚠️ Maaf, saya sedang mengalami gangguan sistem saat memproses pesan Anda. Silakan coba lagi nanti.');
            }
        }
    }
}

module.exports = { handleMessage };
