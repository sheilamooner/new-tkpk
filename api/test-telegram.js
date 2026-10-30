/**
 * Test endpoint to verify Telegram credentials
 * Access: POST /api/test-telegram
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

    // Check if environment variables exist
    const hasToken = !!TELEGRAM_BOT_TOKEN;
    const hasChat = !!TELEGRAM_CHAT_ID;

    if (!hasToken || !hasChat) {
      return res.status(500).json({
        success: false,
        error: 'Missing environment variables',
        debug: {
          TELEGRAM_BOT_TOKEN: hasToken ? '✅ Set' : '❌ Missing',
          TELEGRAM_CHAT_ID: hasChat ? '✅ Set' : '❌ Missing',
        }
      });
    }

    // Test 1: Verify bot token with getMe
    const getMeUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`;
    const getMeResponse = await fetch(getMeUrl);
    const getMeData = await getMeResponse.json();

    if (!getMeResponse.ok) {
      return res.status(500).json({
        success: false,
        error: 'Invalid bot token',
        test: 'getMe',
        details: getMeData,
        debug: {
          tokenPrefix: TELEGRAM_BOT_TOKEN.substring(0, 10) + '...',
          tokenLength: TELEGRAM_BOT_TOKEN.length
        }
      });
    }

    // Test 2: Send test message
    const sendMessageUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const testMessage = `🧪 <b>Test Message from Vercel</b>\n\n✅ Bot Token: Valid\n✅ Chat ID: ${TELEGRAM_CHAT_ID}\n✅ Time: ${new Date().toISOString()}\n\nIf you see this, your Telegram integration is working! 🎉`;

    const sendResponse = await fetch(sendMessageUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: testMessage,
        parse_mode: 'HTML',
      }),
    });

    const sendData = await sendResponse.json();

    if (!sendResponse.ok) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send message',
        test: 'sendMessage',
        details: sendData,
        debug: {
          botInfo: getMeData.result,
          chatId: TELEGRAM_CHAT_ID,
          possibleIssues: [
            'Chat ID might be incorrect',
            'Bot not started (send /start to bot)',
            'Bot not added to group (if using group chat)',
            'Bot blocked by user'
          ]
        }
      });
    }

    // Success!
    return res.status(200).json({
      success: true,
      message: '🎉 Telegram integration is working!',
      botInfo: getMeData.result,
      chatId: TELEGRAM_CHAT_ID,
      messageId: sendData.result.message_id,
      sentAt: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message,
      stack: error.stack
    });
  }
}
