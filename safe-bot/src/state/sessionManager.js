/**
 * Session Manager
 * Mengelola state percakapan per pengguna (chatId)
 */

const sessions = new Map();

// Session timeout: 30 menit
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Mengambil atau membuat sesi baru untuk pengguna
 * @param {string} chatId - ID chat pengguna (nomor WA)
 * @returns {Object} State sesi
 */
function getSession(chatId) {
    if (!sessions.has(chatId)) {
        sessions.set(chatId, {
            stage: 'idle', // 'idle' -> 'consulting' -> 'collecting_photo' -> dll
            history: [],   // Array of {role, parts} untuk Gemini
            lastActivity: Date.now(),
            hasSentDisclaimer: false
        });
    } else {
        // Update last activity
        const session = sessions.get(chatId);
        session.lastActivity = Date.now();
    }
    return sessions.get(chatId);
}

/**
 * Menambahkan riwayat pesan ke sesi pengguna
 * @param {string} chatId 
 * @param {string} role - 'user' atau 'model'
 * @param {string} text 
 */
function addMessageToHistory(chatId, role, text) {
    const session = getSession(chatId);
    
    // Hapus format awalan '.ai' dari riwayat jika ada
    const cleanText = text.replace(/^\.ai\s*/i, '');
    
    session.history.push({
        role: role,
        parts: [{ text: cleanText }]
    });
}

/**
 * Menghapus/reset sesi pengguna (misal saat command .reset atau timeout)
 * @param {string} chatId 
 */
function resetSession(chatId) {
    sessions.delete(chatId);
}

/**
 * Mengupdate stage sesi
 * @param {string} chatId 
 * @param {string} newStage 
 */
function updateStage(chatId, newStage) {
    const session = getSession(chatId);
    session.stage = newStage;
}

/**
 * Menandai bahwa disclaimer sudah dikirim di sesi ini
 * @param {string} chatId 
 */
function markDisclaimerSent(chatId) {
    const session = getSession(chatId);
    session.hasSentDisclaimer = true;
}

// Cleanup interval: Hapus sesi yang idle > 30 menit
setInterval(() => {
    const now = Date.now();
    for (const [chatId, session] of sessions.entries()) {
        if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
            sessions.delete(chatId);
            console.log(`[SessionManager] Sesi ${chatId} dihapus karena timeout.`);
        }
    }
}, 5 * 60 * 1000); // Cek setiap 5 menit

module.exports = { 
    getSession, 
    addMessageToHistory, 
    resetSession, 
    updateStage,
    markDisclaimerSent 
};
