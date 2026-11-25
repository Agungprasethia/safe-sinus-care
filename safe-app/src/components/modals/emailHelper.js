import emailjs from '@emailjs/browser';

const TARGET_EMAIL = 'igstmadeagung3@gmail.com';

/**
 * Send assessment result to igstmadeagung3@gmail.com
 * Uses EmailJS when configured; otherwise falls back to opening mailto.
 */
export const sendAssessmentEmail = async (data) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  const subject = `S.A.F.E. Assessment Result — ${data.classification} (${data.finalScore}/${data.maxScore})`;
  const bodyText = 
`S.A.F.E. Assessment Result
================================
Date: ${data.date} at ${data.time}
Classification: ${data.classification}
Final Score: ${data.finalScore} / ${data.maxScore}

-- Score Breakdown --
• Symptoms: ${data.scores.symptoms} / 150
• Lifestyle: ${data.scores.lifestyle} / 15
• Environmental: ${data.scores.environmental} / 28
• Mucus Color: ${data.mucusColorLabel || 'Not scanned'} (${data.scores.mucus} / 2)

-- Symptom Responses --
${data.symptomAnswers}

-- Lifestyle Responses --
${data.lifestyleAnswers}

-- Environmental Responses --
${data.environmentalAnswers}`;

  // If EmailJS is configured in Vercel environment variables, send automatically
  if (serviceId && templateId && publicKey) {
    const templateParams = {
      to_email: TARGET_EMAIL,
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

    return emailjs.send(serviceId, templateId, templateParams, publicKey);
  } else {
    // Fallback when EmailJS keys are not configured in Vercel yet:
    // On mobile: trigger native mail client without opening blank tab
    // On desktop: open Gmail Web compose directly (prevents 'about:blank' dead page)
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      const mailtoUrl = `mailto:${TARGET_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      window.location.href = mailtoUrl;
    } else {
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${TARGET_EMAIL}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      window.open(gmailUrl, '_blank');
    }
    return Promise.resolve({ fallback: true });
  }
};
