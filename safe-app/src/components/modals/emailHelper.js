import emailjs from '@emailjs/browser';

const TARGET_EMAIL = 'jesselynidelia67@gmail.com';

/**
 * Build clean WhatsApp-formatted clinical report with markdown bolding & emojis.
 */
export function buildWhatsAppReport(data) {
  const {
    date, time, classification, finalScore, maxScore, scores, mucusColorLabel,
    symptoms = {}, environmental = {},
    symptomsList = [], environmentalList = []
  } = data;

  const isSinusRisk = classification === 'SINUS';

  const highSymptoms = [];
  const occasionalSymptoms = [];

  symptomsList.forEach((symptom, idx) => {
    const val = symptoms[idx] || 'Not answered';
    if (val === 'Very Often' || val === 'Often') {
      highSymptoms.push(`• *${val.toUpperCase()}:* ${symptom}`);
    } else if (val === 'Sometimes') {
      occasionalSymptoms.push(`• ${symptom}`);
    }
  });

  const activeTriggers = [];
  environmentalList.forEach((env, idx) => {
    const ans = environmental[idx] || 'Never';
    if (ans !== 'Never') {
      activeTriggers.push(`• ${env} (${ans})`);
    }
  });

  return `🏥 *S.A.F.E. SINUS ASSESSMENT REPORT*
━━━━━━━━━━━━━━━━━━━━
📅 *Date:* ${date} at ${time}
🔬 *Result:* ${isSinusRisk ? '⚠️ *SINUS (HIGH RISK)*' : '✅ *NON-SINUS (LOW RISK)*'}
📊 *Final Score:* *${finalScore} / ${maxScore}* (Cutoff: >= 114)

📊 *Score Breakdown:*
• Symptoms: ${scores.symptoms}/150
• Lifestyle: ${scores.lifestyle}/15
• Environment: ${scores.environmental}/28
• Mucus: ${scores.mucus}/2 (${mucusColorLabel || 'Not scanned'})

🚨 *Active / Frequent Symptoms:*
${highSymptoms.length > 0 ? highSymptoms.join('\n') : '• (None reported)'}

⚠️ *Occasional Symptoms:*
${occasionalSymptoms.length > 0 ? occasionalSymptoms.join('\n') : '• (None reported)'}

🌿 *Environmental Triggers:*
${activeTriggers.length > 0 ? activeTriggers.join('\n') : '• (None reported)'}

━━━━━━━━━━━━━━━━━━━━
_Screening via S.A.F.E. (Sinus Assessment Ecosystem)_
_Guidelines: EPOS 2020 / NCBI Sinusitis Guidelines_`;
}

/**
 * Open WhatsApp with pre-filled clinical assessment text targeted to a specific number.
 */
export const sendAssessmentWhatsApp = (data, customNumber) => {
  const targetNumber = customNumber || import.meta.env.VITE_TARGET_WA_NUMBER || '6281228781681';
  const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
  const report = buildWhatsAppReport(data);
  const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(report)}`;
  window.open(waUrl, '_blank');
};
function buildDoctorReport(data) {
  const {
    date, time, classification, finalScore, maxScore, scores, mucusColorLabel,
    symptoms = {}, lifestyle = {}, environmental = {},
    symptomsList = [], lifestyleQuestions = [], environmentalList = []
  } = data;

  const isSinusRisk = classification === 'SINUS';

  // Group symptoms clinically (Anamnesis):
  const highSymptoms = [];
  const occasionalSymptoms = [];
  const absentSymptoms = [];

  symptomsList.forEach((symptom, idx) => {
    const val = symptoms[idx] || 'Not answered';
    if (val === 'Very Often' || val === 'Often') {
      highSymptoms.push(`  • [${val.toUpperCase()}] ${symptom}`);
    } else if (val === 'Sometimes') {
      occasionalSymptoms.push(`  • [Sometimes] ${symptom}`);
    } else if (val === 'Never') {
      absentSymptoms.push(symptom);
    }
  });

  // Lifestyle formatting
  const lifestyleSummary = lifestyleQuestions.map((q, idx) => {
    const ans = lifestyle[idx] || 'Not specified';
    return `  • ${q.question}: ${ans}`;
  }).join('\n');

  // Environmental triggers (filter active vs never)
  const activeTriggers = [];
  environmentalList.forEach((env, idx) => {
    const ans = environmental[idx] || 'Never';
    if (ans !== 'Never') {
      activeTriggers.push(`  • ${env} (${ans})`);
    }
  });

  // Mucus interpretation note
  let mucusNote = mucusColorLabel || 'Not scanned';
  if (mucusColorLabel) {
    const lower = mucusColorLabel.toLowerCase();
    if (lower.includes('green') || lower.includes('yellow')) {
      mucusNote += ' [Suspicion of purulent / bacterial exudate]';
    } else if (lower.includes('brown') || lower.includes('black') || lower.includes('red')) {
      mucusNote += ' [Dried blood / airborne particulates / fungal flag]';
    } else {
      mucusNote += ' [Clear / Mucoid discharge - non-purulent]';
    }
  }

  const divider = '==================================================';
  const subDivider = '--------------------------------------------------';

  return `
${divider}
  S.A.F.E. SINUS ASSESSMENT - CLINICAL SCREENING REPORT
${divider}
Date / Time   : ${date} at ${time}
Patient Status: ${isSinusRisk ? '⚠️ HIGH RISK (SUSPECTED SINUSITIS)' : '✅ LOW RISK (NON-SINUSITIS)'}
Total Score   : ${finalScore} / ${maxScore} pts (Cutoff Threshold >= 114)

${subDivider}
I. SCORE BREAKDOWN
${subDivider}
1. Clinical Symptoms     : ${scores.symptoms} / 150 pts
2. Lifestyle Risk Factors: ${scores.lifestyle} / 15 pts
3. Environmental Triggers: ${scores.environmental} / 28 pts
4. Mucus Examination     : ${scores.mucus} / 2 pts (${mucusNote})

${subDivider}
II. ANAMNESIS & CLINICAL SYMPTOMS (EPOS / NHS Criteria)
${subDivider}
🚨 FREQUENT / ACTIVE COMPLAINTS (Very Often / Often):
${highSymptoms.length > 0 ? highSymptoms.join('\n') : '  (None reported)'}

⚠️ OCCASIONAL COMPLAINTS (Sometimes):
${occasionalSymptoms.length > 0 ? occasionalSymptoms.join('\n') : '  (None reported)'}

⚪ ABSENT SYMPTOMS (Never):
  ${absentSymptoms.length > 0 ? absentSymptoms.join(', ') : '(None)'}

${subDivider}
III. LIFESTYLE & ENVIRONMENTAL RISK FACTORS
${subDivider}
[Lifestyle Habits]
${lifestyleSummary}

[Environmental Triggers Reported]
${activeTriggers.length > 0 ? activeTriggers.join('\n') : '  (No significant triggers reported)'}

${subDivider}
IV. CLINICAL RECOMMENDATIONS FOR PRACTITIONER
${subDivider}
${isSinusRisk 
  ? `• Patient score (${finalScore}) exceeds the clinical screening threshold (114).
• High probability of rhinosinusitis. Recommend anterior rhinoscopy or nasal endoscopy.
• Correlate duration of symptoms (>10 days) to distinguish viral vs acute post-viral/bacterial.`
  : `• Patient score (${finalScore}) is below threshold (114).
• Current clinical symptoms are more consistent with allergic rhinitis or common cold.
• Recommend symptomatic relief and monitoring if symptoms worsen.`}

==================================================
CONFIDENTIAL MEDICAL SCREENING - S.A.F.E. ECOSYSTEM
Sources: EPOS 2020, NCBI Sinusitis Guidelines, NHS UK
==================================================
`.trim();
}

/**
 * Send assessment result to igstmadeagung3@gmail.com
 * Formats a clean clinical report for medical doctors.
 */
export const sendAssessmentEmail = async (data) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  const subject = `[S.A.F.E. Screening] ${data.classification} Risk - Score ${data.finalScore}/${data.maxScore} (${data.date})`;
  const doctorReport = buildDoctorReport(data);

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
      doctor_report: doctorReport,
      symptom_answers: data.symptomAnswers,
      lifestyle_answers: data.lifestyleAnswers,
      environmental_answers: data.environmentalAnswers,
    };

    return emailjs.send(serviceId, templateId, templateParams, publicKey);
  } else {
    // Fallback: Open Gmail Web directly on desktop or mail client on mobile
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      const mailtoUrl = `mailto:${TARGET_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(doctorReport)}`;
      window.location.href = mailtoUrl;
    } else {
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${TARGET_EMAIL}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(doctorReport)}`;
      window.open(gmailUrl, '_blank');
    }
    return Promise.resolve({ fallback: true });
  }
};
