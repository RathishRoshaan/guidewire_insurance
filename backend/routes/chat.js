const express = require('express');
const router = express.Router();
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

router.post('/', async (req, res) => {
  const { message, history } = req.body;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key not configured on server' });
  }

  try {
    const systemPrompt = "You are GigBot, an expert AI assistant for GigShield (India's first parametric insurance for gig workers). Your goal is to help delivery partners understand their coverage, file manual claims, and explain how automatic weather triggers work. Be professional, empathetic, and concise. Always mention that GigShield uses real-time weather data for automatic payouts.";
    
    // Construct the prompt with history
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...history.map(h => ({
        role: h.role === 'bot' ? 'model' : 'user',
        parts: [{ text: h.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      { contents },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const botMessage = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I'm having trouble connecting to my AI core. Please try again soon.";
    
    res.json({ message: botMessage });
  } catch (err) {
    console.error('Chat error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

module.exports = router;
