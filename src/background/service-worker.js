// Background service worker for Cold Email Warmer
import { getConfig, setStorageValue } from '../utils/storage.js';
import { STORAGE_KEYS, DEFAULT_CONFIG } from '../utils/config.js';
import { personalizeEmail, generateVariants, generateSubjectLines } from '../ai/email-personalizer.js';
import { parseEmail, extractFirstName, extractCompanyFromEmail } from '../utils/email-parser.js';

const browserAPI = typeof chrome !== 'undefined' && chrome.runtime ? chrome : browser;

// Initialize on install
browserAPI.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Initialize default config
    const config = await getConfig();
    if (!config.defaultStyle) {
      await setStorageValue(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    }
    
    console.log('Cold Email Warmer extension installed');
  } else if (details.reason === 'update') {
    console.log('Cold Email Warmer extension updated');
  }
});

// Handle messages from content scripts and popup
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const safeSendResponse = (data) => {
    try {
      sendResponse(data);
    } catch (e) {
      console.error('Error sending response:', e);
    }
  };
  
  (async () => {
    try {
      switch (message.action) {
        case 'personalizeEmail':
          // Personalize email
          const config = await getConfig();
          const personalized = await personalizeEmail(
            message.template,
            message.recipient,
            message.research || {},
            config.defaultStyle || 'professional'
          );
          
          // Save to history
          await saveToHistory(message.template, personalized, message.recipient);
          
          safeSendResponse({ 
            success: true, 
            personalized 
          });
          break;
        
        case 'generateVariants':
          const variants = await generateVariants(
            message.baseEmail,
            message.recipient,
            message.numVariants || 3
          );
          safeSendResponse({ success: true, variants });
          break;
        
        case 'generateSubjectLines':
          const subjects = await generateSubjectLines(
            message.emailBody || '',
            message.recipient,
            message.numSubjects || 5
          );
          safeSendResponse({ success: true, subjects });
          break;
        
        case 'getDefaultTemplate':
          const template = await getDefaultTemplate();
          safeSendResponse({ template });
          break;
        
        case 'getConfig':
          const cfg = await getConfig();
          safeSendResponse({ config: cfg });
          break;
        
        case 'saveConfig':
          await setStorageValue(STORAGE_KEYS.CONFIG, message.config);
          safeSendResponse({ success: true });
          break;
        
        case 'getHistory':
          const history = await getHistory();
          safeSendResponse({ history });
          break;
        
        default:
          safeSendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      safeSendResponse({ error: error.message || 'Unknown error' });
    }
  })();
  
  return true; // Keep message channel open for async response
});

// Get default template
async function getDefaultTemplate() {
  try {
    const response = await fetch(browserAPI.runtime.getURL('data/email-templates.json'));
    const templates = await response.json();
    return templates['cold-outreach'] || {
      name: 'Cold Outreach',
      subject: 'Quick question',
      body: "Hi [FirstName],\n\nI'd love to connect about [topic].\n\nBest,\n[YourName]"
    };
  } catch (error) {
    console.error('Error loading template:', error);
    return {
      name: 'Cold Outreach',
      subject: 'Quick question',
      body: "Hi [FirstName],\n\nI'd love to connect about [topic].\n\nBest,\n[YourName]"
    };
  }
}

// Get template by ID
async function getTemplateById(templateId) {
  try {
    const response = await fetch(browserAPI.runtime.getURL('data/email-templates.json'));
    const templates = await response.json();
    return templates[templateId] || await getDefaultTemplate();
  } catch (error) {
    console.error('Error loading template:', error);
    return await getDefaultTemplate();
  }
}

// History management
async function saveToHistory(original, personalized, recipient) {
  try {
    const result = await browserAPI.storage.local.get(STORAGE_KEYS.EMAIL_HISTORY);
    const history = result[STORAGE_KEYS.EMAIL_HISTORY] || [];
    
    const entry = {
      id: Date.now().toString(),
      original: original.substring(0, 500),
      personalized: personalized.substring(0, 1000),
      recipient: {
        name: recipient.name || '',
        email: recipient.email || '',
        company: recipient.company || ''
      },
      timestamp: Date.now()
    };
    
    history.unshift(entry);
    
    // Limit history size
    const config = await getConfig();
    const maxItems = config.maxHistoryItems || 100;
    if (history.length > maxItems) {
      history.splice(maxItems);
    }
    
    await browserAPI.storage.local.set({ [STORAGE_KEYS.EMAIL_HISTORY]: history });
  } catch (error) {
    console.error('Error saving to history:', error);
  }
}

async function getHistory() {
  try {
    const result = await browserAPI.storage.local.get(STORAGE_KEYS.EMAIL_HISTORY);
    return result[STORAGE_KEYS.EMAIL_HISTORY] || [];
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
}
