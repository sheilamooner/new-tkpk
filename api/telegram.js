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
    const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

    // Validate environment variables
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Missing Telegram credentials');
      console.error('TELEGRAM_BOT_TOKEN exists:', !!TELEGRAM_BOT_TOKEN);
      console.error('TELEGRAM_CHAT_ID exists:', !!TELEGRAM_CHAT_ID);
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
    const ip = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
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

    // Format message with emojis
    const message = `
🚀 <b>New Visitor Activity</b>

👤 <b>Visitor Info:</b>
├ IP: <code>${ip}</code>
├ User Agent: <code>${userAgent.substring(0, 100)}${userAgent.length > 100 ? '...' : ''}</code>

🔍 <b>Traffic Source:</b>
├ Source: ${searchEngine}
├ Referrer: <code>${referer}</code>
├ URL: <code>${url}</code>

${data ? `📝 <b>Form Data:</b>\n${Object.entries(data).map(([key, value]) => `├ ${key}: <code>${value}</code>`).join('\n')}` : ''}

⏰ <b>Timestamp:</b> ${new Date().toISOString()}
    `.trim();

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
