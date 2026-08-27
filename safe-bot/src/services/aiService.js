/**
 * AI Service — Integrasi Google Gemini (Text + Multi-modal Image)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { SYSTEM_PROMPT, IMAGE_ANALYSIS_PROMPT } = require('../config/systemPrompt');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * Generate respons teks dari Gemini berdasarkan conversation history
 * @param {Array} conversationHistory - Array {role, parts} untuk konteks
 * @returns {Promise<string>}
 */
async function generateTextResponse(conversationHistory) {
    try {
        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: 'Mulai sesi konsultasi. Ini adalah system instruction-mu:\n\n' + SYSTEM_PROMPT }]
                },
                {
                    role: 'model',
                    parts: [{ text: 'Baik, saya S.I.N.A.R. AI siap membantu konsultasi kesehatan hidung dan sinus. Saya akan mengikuti semua instruksi yang diberikan.' }]
                },
                ...conversationHistory
            ]
        });

        const lastMessage = conversationHistory[conversationHistory.length - 1];
        const result = await chat.sendMessage(lastMessage.parts[0].text);
        return result.response.text();
    } catch (error) {
        console.error('[AI Service] Error generateTextResponse:', error.message);
        
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('PERMISSION_DENIED')) {
            throw new Error('API_KEY_ERROR');
        }
        if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429')) {
            throw new Error('RATE_LIMIT');
        }
        throw error;
    }
}

/**
 * Generate respons dari Gemini berdasarkan gambar + konteks percakapan
 * @param {string} base64Image - Base64 encoded image
 * @param {string} mimeType - MIME type gambar (image/jpeg, image/png, dll)
 * @param {Array} conversationHistory - Konteks percakapan sebelumnya
 * @returns {Promise<string>}
 */
async function generateImageResponse(base64Image, mimeType, conversationHistory) {
    try {
        // Bangun konteks dari riwayat percakapan
        let contextSummary = '';
        if (conversationHistory.length > 0) {
            const userMessages = conversationHistory
                .filter(msg => msg.role === 'user')
                .map(msg => msg.parts[0].text)
                .join('\n');
            contextSummary = `\n\nKonteks percakapan sebelumnya (gejala yang sudah dilaporkan pengguna):\n${userMessages}`;
        }

        const prompt = IMAGE_ANALYSIS_PROMPT + contextSummary + '\n\nAnalisis foto yang dikirim pengguna berikut ini:';

        const result = await model.generateContent([
            { text: prompt },
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Image
                }
            }
        ]);

        return result.response.text();
    } catch (error) {
        console.error('[AI Service] Error generateImageResponse:', error.message);
        
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('PERMISSION_DENIED')) {
            throw new Error('API_KEY_ERROR');
        }
        if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429')) {
            throw new Error('RATE_LIMIT');
        }
        throw error;
    }
}

module.exports = { generateTextResponse, generateImageResponse };
