import emailjs from '@emailjs/browser';

/**
 * Send assessment result via EmailJS (fire-and-forget).
 * Requires these Vite env vars:
 *   VITE_EMAILJS_SERVICE_ID
 *   VITE_EMAILJS_TEMPLATE_ID
 *   VITE_EMAILJS_PUBLIC_KEY
 */
export const sendAssessmentEmail = (data) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  // Skip silently if not configured
  if (!serviceId || !templateId || !publicKey) {
    console.warn('[EmailJS] Not configured — skipping email send.');
    return Promise.resolve();
  }

  const templateParams = {
    to_email: 'igstmadeagung3@gmail.com',
    date: data.date,
    time: data.time,
    classification: data.classification,
    final_score: `${data.finalScore} / ${data.maxScore}`,
    symptoms_score: `${data.scores.symptoms} / 150`,
    lifestyle_score: `${data.scores.lifestyle} / 15`,
    environmental_score: `${data.scores.environmental} / 28`,
    mucus_score: `${data.scores.mucus} / 2`,
    mucus_color: data.mucusColorLabel || 'Not scanned',
    symptom_answers: data.symptomAnswers,
    lifestyle_answers: data.lifestyleAnswers,
    environmental_answers: data.environmentalAnswers,
  };

  return emailjs.send(serviceId, templateId, templateParams, publicKey)
    .then((res) => {
      console.log('[EmailJS] Sent successfully:', res.status);
    })
    .catch((err) => {
      console.error('[EmailJS] Failed to send:', err);
    });
};

