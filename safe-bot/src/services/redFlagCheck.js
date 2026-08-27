/**
 * Red Flag Safety Check
 * Mendeteksi kata kunci gejala darurat sebelum mengirim ke AI
 */

const RED_FLAG_KEYWORDS = [
    // Pernapasan
    'sulit bernapas', 'sesak napas', 'tidak bisa bernapas', 'susah napas',
    'napas berhenti', 'tercekik', 'tidak bisa bernafas', 'susah bernafas',
    // Pendarahan
    'pendarahan hebat', 'darah banyak', 'mimisan parah', 'darah tidak berhenti',
    'berdarah terus', 'pendarahan tidak berhenti',
    // Pembengkakan
    'wajah bengkak parah', 'mata bengkak', 'bengkak parah',
    // Nyeri
    'nyeri sangat hebat', 'sakit kepala luar biasa', 'nyeri tidak tertahankan',
    'sakit luar biasa',
    // Kondisi kritis
    'pingsan', 'tidak sadarkan diri', 'kejang', 'demam sangat tinggi',
    'demam 40', 'demam diatas 39', 'pandangan kabur', 'leher kaku',
    // Bahasa Inggris (untuk jaga-jaga)
    'cant breathe', 'heavy bleeding', 'unconscious', 'seizure'
];

/**
 * Mengecek apakah teks mengandung kata kunci darurat
 * @param {string} text - Teks pesan pengguna
 * @returns {{ isRedFlag: boolean, matchedKeywords: string[] }}
 */
function checkRedFlags(text) {
    const lowerText = text.toLowerCase();
    const matchedKeywords = RED_FLAG_KEYWORDS.filter(keyword => 
        lowerText.includes(keyword)
    );
    
    return {
        isRedFlag: matchedKeywords.length > 0,
        matchedKeywords
    };
}

module.exports = { checkRedFlags, RED_FLAG_KEYWORDS };
