const express = require('express');
const router = express.Router();
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Intelligent fallback responses when Gemini is unavailable
const FALLBACK_RESPONSES = [
  "GigCover provides parametric insurance for gig workers. Your policy automatically pays out when weather triggers are met (Rain >50mm, AQI >400, Temp >45°C). No claim filing needed — payouts happen instantly via UPI! 🚀",
  "Your GigCover policy covers income loss due to weather disruptions. When conditions exceed thresholds, you receive an instant UPI payout. To file a manual claim, use the 'Request Manual Claim' button on the Claims page. 📝",
  "Parametric insurance means we pay based on objective data (weather readings), not subjective assessments. This means faster payouts and zero paperwork for you! Check the Weather page to see live risk conditions in your area. ⚡",
  "GigCover has three plans: Essential Guard (basic coverage), Smart Partner (recommended), and Total Resilience (premium). Each covers different disruption types like heavy rain, extreme heat, AQI pollution, and platform outages. 🛡️",
  "Your claims are processed automatically when our weather sensors detect trigger conditions. Auto-approved claims are paid to your UPI ID within minutes. Manual claims go to admin review. 💸",
  "To understand your coverage: Go to Dashboard > My Policy to see what disruptions are covered, payout amounts, and trigger thresholds for your plan. 📊",
];

function getFallbackResponse(message) {
  const msg = (message || '').toLowerCase();
  if (msg.includes('claim') || msg.includes('request') || msg.includes('submit')) {
    return "To file a manual claim, go to Claims page and click '+ Request Manual Claim'. Describe the disruption reason and submit. Admin will review it within 24 hours. Auto-claims are processed instantly when weather thresholds are breached! 📝";
  }
  if (msg.includes('cover') || msg.includes('policy') || msg.includes('plan')) {
    return "Your GigCover policy covers income loss from: Heavy Rain (>50mm), Extreme Heat (>45°C), Air Pollution (AQI >400), Platform Outages, and more depending on your plan tier. Check your Dashboard for exact coverage details. 🛡️";
  }
  if (msg.includes('weather') || msg.includes('rain') || msg.includes('aqi') || msg.includes('heat')) {
    return "GigCover monitors real-time weather data. Trigger thresholds: Rain >50mm/hr, Temperature >45°C, AQI >400. When these are breached in your zone, your claim is automatically approved and paid via UPI — no action needed from you! ⛈️";
  }
  if (msg.includes('pay') || msg.includes('upi') || msg.includes('money') || msg.includes('payout')) {
    return "Payouts are sent directly to your registered UPI ID within minutes of an auto-trigger. For manual claims, payment is processed after admin approval (usually 24-48 hours). You can track payout status in the Claims section. 💸";
  }
  if (msg.includes('trigger') || msg.includes('auto') || msg.includes('parametric')) {
    return "Parametric triggers work automatically! Our system checks weather APIs every 2 minutes. When conditions in your delivery zone exceed thresholds (Rain >50mm, Temp >45°C, AQI >400), claims are auto-generated and paid instantly — zero paperwork! ⚡";
  }
  // Default fallback
  const idx = Math.floor(Math.random() * FALLBACK_RESPONSES.length);
  return FALLBACK_RESPONSES[idx];
}

router.post('/', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!req.body || !message || !message.trim()) {
    console.error('[Chat] Received malformed or empty message');
    return res.status(200).json({ 
      success: true, 
      reply: 'I received an empty message. How can I help you with your GigCover policy today? 🛡️', 
      message: 'I received an empty message.',
      source: 'error_prevention'
    });
  }

  // If no API key, return intelligent fallback immediately
  if (!GEMINI_API_KEY) {
    console.warn('[Chat] GEMINI_API_KEY not configured — using fallback response');
    const fallback = getFallbackResponse(message);
    return res.json({ success: true, reply: fallback, message: fallback, source: 'fallback' });
  }

  try {
    const systemPrompt = `You are GigBot, an expert AI assistant for GigCover — India's first parametric insurance platform for gig delivery workers (Swiggy, Zomato, Dunzo riders).

Key facts:
- Covers income loss from: Heavy Rain (>50mm), Extreme Heat (>45°C), AQI >400, Platform Outages, Flooding, Cyclones
- Three plans: Essential Guard, Smart Partner (recommended), Total Resilience
- Payouts via UPI — instant when parametric triggers are met
- Manual claims available for situations not auto-detected
- Fraud detection system ensures claim authenticity

Guidelines: Be concise (2-4 sentences), friendly, use ₹ for currency, answer in the user's language.`;

    // Construct conversation history for Gemini
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood! I am GigBot, ready to help GigCover users.' }] },
      ...history.slice(-6).map(h => ({
        role: h.role === 'bot' ? 'model' : 'user',
        parts: [{ text: h.content || '' }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    console.log('[Chat] Sending request to Gemini API...');
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      { contents },
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000
      }
    );

    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!reply) {
      console.warn('[Chat] Gemini returned empty response or was filtered');
      const fallback = getFallbackResponse(message);
      return res.json({ success: true, reply: fallback, message: fallback, source: 'safety_fallback' });
    }

    return res.json({ success: true, reply, message: reply, source: 'gemini' });

  } catch (err) {
    const status = err.response?.status;
    const errData = err.response?.data;
    console.error(`[Chat] Gemini error (HTTP ${status}):`, errData?.error?.message || err.message);

    // If the error is 400 and mentions API key, it's likely the key format is invalid
    if (status === 400 && errData?.error?.message?.toLowerCase().includes('key')) {
        console.error('[Chat] CRITICAL: The API Key provided appears invalid for the Gemini AI Studio endpoint.');
    }

    // On any error — return smart fallback, NOT a crash/500
    const fallback = getFallbackResponse(message);
    return res.status(200).json({
      success: true,
      reply: fallback,
      message: fallback,
      source: 'error_fallback',
      _debug: { 
        status: status || 'network_error', 
        error: errData?.error?.message || err.message 
      }
    });
  }
});

module.exports = router;
