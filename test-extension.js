/**
 * Quick Test Script for Shame Clock Extension
 * 
 * Run this in the browser console after loading the extension
 * to quickly test all functionality.
 */

async function testExtension() {
  console.log('🧪 Starting Shame Clock Extension Tests...\n');
  
  const browserAPI = typeof chrome !== 'undefined' && chrome.runtime ? chrome : browser;
  
  // Test 1: Check extension is loaded
  console.log('✅ Test 1: Extension Loaded');
  try {
    const response = await new Promise((resolve) => {
      browserAPI.runtime.sendMessage({ action: 'getConfig' }, resolve);
    });
    console.log('   ✓ Extension responds to messages');
    console.log('   Config:', response.config || 'Default');
  } catch (error) {
    console.error('   ✗ Extension not responding:', error);
    return;
  }
  
  // Test 2: Check site detection
  console.log('\n✅ Test 2: Site Detection');
  try {
    const testSites = [
      'https://reddit.com',
      'https://youtube.com',
      'https://google.com' // Should not be tracked
    ];
    
    for (const url of testSites) {
      const response = await new Promise((resolve) => {
        browserAPI.runtime.sendMessage({ action: 'isTrackedSite', url }, resolve);
      });
      const tracked = response.tracked;
      const icon = tracked ? '✓' : '○';
      console.log(`   ${icon} ${url}: ${tracked ? 'TRACKED' : 'not tracked'}`);
    }
  } catch (error) {
    console.error('   ✗ Site detection failed:', error);
  }
  
  // Test 3: Check time tracking
  console.log('\n✅ Test 3: Time Tracking');
  try {
    const response = await new Promise((resolve) => {
      browserAPI.runtime.sendMessage({ action: 'getTodayStats' }, resolve);
    });
    const stats = response.stats || [];
    console.log(`   ✓ Found ${stats.length} tracked sites today`);
    if (stats.length > 0) {
      stats.slice(0, 3).forEach(stat => {
        console.log(`   - ${stat.domain}: ${stat.formatted}`);
      });
    } else {
      console.log('   ℹ No activity yet today (visit a tracked site first)');
    }
  } catch (error) {
    console.error('   ✗ Time tracking failed:', error);
  }
  
  // Test 4: Check message generation (template)
  console.log('\n✅ Test 4: Message Generation (Template)');
  try {
    const response = await new Promise((resolve) => {
      browserAPI.runtime.sendMessage({
        action: 'generateMessage',
        domain: 'reddit.com',
        timeSpent: 600000 // 10 minutes
      }, resolve);
    });
    if (response.message) {
      console.log('   ✓ Message generated successfully');
      console.log(`   Persona: ${response.persona}`);
      console.log(`   Message: "${response.message.substring(0, 80)}..."`);
    } else {
      console.error('   ✗ No message returned');
    }
  } catch (error) {
    console.error('   ✗ Message generation failed:', error);
  }
  
  // Test 5: Check storage
  console.log('\n✅ Test 5: Storage');
  try {
    const config = await new Promise((resolve) => {
      browserAPI.runtime.sendMessage({ action: 'getConfig' }, (response) => {
        resolve(response.config || {});
      });
    });
    console.log('   ✓ Config loaded:', Object.keys(config).length, 'settings');
  } catch (error) {
    console.error('   ✗ Storage failed:', error);
  }
  
  // Test 6: Check current tab
  console.log('\n✅ Test 6: Current Tab Detection');
  try {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      const tab = tabs[0];
      const response = await new Promise((resolve) => {
        browserAPI.runtime.sendMessage({ action: 'isTrackedSite', url: tab.url }, resolve);
      });
      console.log(`   Current tab: ${new URL(tab.url).hostname}`);
      console.log(`   ${response.tracked ? '✓ TRACKED' : '○ Not tracked'}`);
    }
  } catch (error) {
    console.error('   ✗ Tab detection failed:', error);
  }
  
  console.log('\n✨ Tests Complete!');
  console.log('\n💡 Tips:');
  console.log('   - Visit a tracked site (reddit.com, youtube.com) to test time tracking');
  console.log('   - Wait 5+ minutes (or reduce threshold in settings) to test popups');
  console.log('   - Check Options page to configure settings');
  console.log('   - Check browser console for any errors');
}

// Auto-run if in console
if (typeof window !== 'undefined') {
  console.log('📋 Run testExtension() to test the extension');
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testExtension };
}

