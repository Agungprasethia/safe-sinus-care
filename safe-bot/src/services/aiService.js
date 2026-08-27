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
                    parts: [{ text: 'Start the consultation session. This is your system instruction:\n\n' + SYSTEM_PROMPT }]
                },
                {
                    role: 'model',
                    parts: [{ text: 'Understood, I am S.I.N.A.R. AI, ready to assist with nose and sinus health consultations. I will follow all instructions provided and respond in English.' }]
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
            contextSummary = `\n\nPrevious conversation context (symptoms reported by user):\n${userMessages}`;
        }

        const prompt = IMAGE_ANALYSIS_PROMPT + contextSummary + '\n\nAnalyze the following photo sent by the user:';

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
