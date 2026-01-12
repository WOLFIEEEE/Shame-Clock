// Content script for Cold Email Warmer
import { detectEmailClient, getEmailClientAdapter } from '../utils/email-client-detector.js';
import { parseEmail, extractFirstName, extractCompanyFromEmail } from '../utils/email-parser.js';

const browserAPI = typeof chrome !== 'undefined' && chrome.runtime ? chrome : browser;

// State
let emailClient = null;
let adapter = null;
let warmerButton = null;
let isInitialized = false;

/**
 * Initialize email warmer
 */
async function initializeEmailWarmer() {
  if (isInitialized) {
    return;
  }
  
  // Detect email client
  emailClient = detectEmailClient();
  if (!emailClient) {
    return;
  }
  
  adapter = getEmailClientAdapter(emailClient);
  
  // Wait for compose window
  waitForComposeWindow();
  
  isInitialized = true;
}

/**
 * Wait for compose window to appear
 */
function waitForComposeWindow() {
  const checkInterval = setInterval(() => {
    const composeWindow = adapter.findComposeWindow();
    if (composeWindow && !warmerButton) {
      injectWarmerButton();
      clearInterval(checkInterval);
    } else if (!composeWindow && warmerButton) {
      // Compose window closed, remove button
      if (warmerButton.parentNode) {
        warmerButton.remove();
      }
      warmerButton = null;
    }
  }, 1000);
  
  // Also check immediately
  const composeWindow = adapter.findComposeWindow();
  if (composeWindow) {
    injectWarmerButton();
  }
}

/**
 * Inject warmer button into email composer
 */
function injectWarmerButton() {
  if (warmerButton) {
    return; // Already injected
  }
  
  // Find insertion point based on email client
  let insertionPoint = null;
  
  if (emailClient === 'gmail') {
    // Gmail: Find toolbar area
    insertionPoint = document.querySelector('.aDh') ||
                    document.querySelector('[role="toolbar"]') ||
                    document.querySelector('.gU');
  } else if (emailClient === 'outlook') {
    // Outlook: Find toolbar
    insertionPoint = document.querySelector('.ms-ComposeHeader-actions') ||
                    document.querySelector('[role="toolbar"]');
  }
  
  if (!insertionPoint) {
    // Fallback: Create floating button
    createFloatingButton();
    return;
  }
  
  // Create button
  warmerButton = document.createElement('button');
  warmerButton.className = 'email-warmer-btn';
  warmerButton.innerHTML = '🔥 Warm Email';
  warmerButton.title = 'Personalize this email';
  
  // Style button
  warmerButton.style.cssText = `
    margin-left: 8px;
    padding: 8px 16px;
    background: #ffc107;
    color: #000;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  `;
  
  warmerButton.addEventListener('mouseenter', () => {
    warmerButton.style.background = '#ffb300';
  });
  
  warmerButton.addEventListener('mouseleave', () => {
    warmerButton.style.background = '#ffc107';
  });
  
  warmerButton.addEventListener('click', handleWarmEmailClick);
  
  insertionPoint.appendChild(warmerButton);
}

/**
 * Create floating button (fallback)
 */
function createFloatingButton() {
  warmerButton = document.createElement('button');
  warmerButton.className = 'email-warmer-btn email-warmer-floating';
  warmerButton.innerHTML = '🔥 Warm';
  warmerButton.title = 'Personalize this email';
  
  warmerButton.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 10000;
    padding: 12px 20px;
    background: #ffc107;
    color: #000;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.2s;
  `;
  
  warmerButton.addEventListener('mouseenter', () => {
    warmerButton.style.background = '#ffb300';
    warmerButton.style.transform = 'scale(1.05)';
  });
  
  warmerButton.addEventListener('mouseleave', () => {
    warmerButton.style.background = '#ffc107';
    warmerButton.style.transform = 'scale(1)';
  });
  
  warmerButton.addEventListener('click', handleWarmEmailClick);
  
  document.body.appendChild(warmerButton);
}

/**
 * Handle warm email button click
 */
async function handleWarmEmailClick() {
  try {
    // Extract recipient info from email composer
    const recipient = adapter.extractRecipient();
    if (!recipient || !recipient.email) {
      showMessage('Please enter a recipient email first', 'error');
      return;
    }
  
    // Parse recipient with smart detection
    const parsed = parseEmail(recipient.email);
    const firstName = extractFirstName(parsed.name || recipient.name);
    
    // Smart company detection from email domain
    const company = await smartDetectCompany(parsed.email, recipient);
    
    // Extract job title from email body or subject if available
    const jobTitle = await smartDetectJobTitle();
    
    // Extract existing email body for context
    const existingBody = adapter.findBodyField()?.textContent || 
                        adapter.findBodyField()?.innerText || '';
    
    const recipientInfo = {
      email: parsed.email,
      name: parsed.name || recipient.name,
      firstName: firstName,
      company: company,
      jobTitle: jobTitle,
      existingBody: existingBody // For context-aware personalization
    };
    
    // Show personalization UI with auto-filled info
    showPersonalizationUI(recipientInfo);
  } catch (error) {
    console.error('Error warming email:', error);
    showMessage('Failed to personalize email', 'error');
  }
}

/**
 * Smart company detection
 */
async function smartDetectCompany(email, recipient) {
  // If company already provided, use it
  if (recipient.company) {
    return recipient.company;
  }
  
  // Extract from email domain
  const domain = email.split('@')[1];
  if (!domain) return '';
  
  // Remove common TLDs and format
  const domainParts = domain.split('.');
  if (domainParts.length > 0) {
    const companyName = domainParts[0];
    // Capitalize and format
    return companyName.charAt(0).toUpperCase() + companyName.slice(1).replace(/[._-]/g, ' ');
  }
  
  return '';
}

/**
 * Smart job title detection
 */
async function smartDetectJobTitle() {
  // Try to extract from email body or subject
  const bodyField = adapter.findBodyField();
  const subjectField = adapter.findSubjectField();
  
  const text = (bodyField?.textContent || bodyField?.innerText || '') + 
               ' ' + (subjectField?.value || subjectField?.textContent || '');
  
  // Look for common job title patterns
  const titlePatterns = [
    /\b(CEO|CTO|CFO|CMO|VP|Director|Manager|Lead|Senior|Junior|Head of|Chief)\s+[A-Z][a-z]+/gi,
    /\b[A-Z][a-z]+\s+(Engineer|Developer|Designer|Analyst|Specialist|Coordinator|Executive)/gi
  ];
  
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match.length > 0) {
      return match[0].trim();
    }
  }
  
  return '';
}

/**
 * Show personalization UI
 */
function showPersonalizationUI(recipientInfo) {
  // Remove existing UI
  const existing = document.getElementById('email-warmer-ui');
  if (existing) {
    existing.remove();
  }
  
  // Create UI overlay
  const overlay = document.createElement('div');
  overlay.id = 'email-warmer-ui';
  overlay.className = 'email-warmer-overlay';
  
  overlay.innerHTML = `
    <div class="email-warmer-content">
      <div class="email-warmer-header">
        <h3>🔥 Warm Email</h3>
        <button class="email-warmer-close">×</button>
      </div>
      <div class="email-warmer-body">
        <div class="recipient-info">
          <div class="info-header">📧 Auto-detected Recipient Info:</div>
          <div><strong>Name:</strong> ${escapeHtml(recipientInfo.name || recipientInfo.email)}</div>
          <div><strong>Email:</strong> ${escapeHtml(recipientInfo.email)}</div>
          ${recipientInfo.company ? `<div><strong>Company:</strong> ${escapeHtml(recipientInfo.company)}</div>` : '<div><strong>Company:</strong> <span style="color: #999;">(detected from email domain)</span></div>'}
          ${recipientInfo.jobTitle ? `<div><strong>Job Title:</strong> ${escapeHtml(recipientInfo.jobTitle)}</div>` : ''}
          <div class="info-note">💡 All info auto-detected from your email composer</div>
        </div>
        <div class="warmer-actions">
          <button class="btn btn-primary" id="warm-email-btn">Personalize Email</button>
          <button class="btn btn-secondary" id="generate-subjects-btn">Generate Subject Lines</button>
        </div>
        <div id="warmer-result" class="warmer-result-section" style="display: none;">
          <div class="preview-header">
            <div class="result-label">Preview Personalized Email:</div>
            <div class="preview-hint">Edit below before inserting</div>
          </div>
          <div class="preview-comparison">
            <div class="preview-side">
              <div class="preview-label">Current Email:</div>
              <div id="current-email-preview" class="email-preview current"></div>
            </div>
            <div class="preview-side">
              <div class="preview-label">Personalized Email:</div>
              <div id="warmer-output" class="warmer-output editable" contenteditable="true" spellcheck="true"></div>
            </div>
          </div>
          <div class="result-actions">
            <button class="btn btn-small btn-secondary" id="copy-warmed-btn">Copy</button>
            <button class="btn btn-small btn-primary" id="insert-warmed-btn">Insert into Email</button>
            <button class="btn btn-small btn-secondary" id="view-variants-btn">View Variants</button>
            <button class="btn btn-small btn-secondary" id="undo-btn" style="display: none;">Undo</button>
          </div>
        </div>
        <div id="variants-section" style="display: none;">
          <div class="variants-list" id="variants-list"></div>
        </div>
        <div id="subjects-section" style="display: none;">
          <div class="subjects-list" id="subjects-list"></div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Store recipient info
  overlay.dataset.recipient = JSON.stringify(recipientInfo);
  
  // Event listeners
  overlay.querySelector('.email-warmer-close').addEventListener('click', () => {
    overlay.remove();
  });
  
  overlay.querySelector('#warm-email-btn').addEventListener('click', () => {
    warmEmail(recipientInfo, overlay);
  });
  
  overlay.querySelector('#generate-subjects-btn').addEventListener('click', () => {
    generateSubjects(recipientInfo, overlay);
  });
  
  overlay.querySelector('#copy-warmed-btn').addEventListener('click', () => {
    copyWarmedEmail(overlay);
  });
  
  overlay.querySelector('#insert-warmed-btn').addEventListener('click', () => {
    insertWarmedEmail(overlay);
  });
  
  overlay.querySelector('#undo-btn').addEventListener('click', () => {
    undoPersonalization(overlay);
  });
  
  overlay.querySelector('#view-variants-btn').addEventListener('click', () => {
    showVariants(recipientInfo, overlay);
  });
  
  // Close on Escape
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
  
  // Close on outside click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
}

// Store original email for undo
let originalEmailBody = '';

/**
 * Warm email
 */
async function warmEmail(recipientInfo, overlay) {
  try {
    const btn = overlay.querySelector('#warm-email-btn');
    btn.textContent = 'Personalizing...';
    btn.disabled = true;
    
    // Save original email body for undo
    const bodyField = adapter.findBodyField();
    originalEmailBody = bodyField?.textContent || bodyField?.innerText || '';
    
    // Show current email preview
    const currentPreview = overlay.querySelector('#current-email-preview');
    if (currentPreview) {
      currentPreview.textContent = originalEmailBody || '(empty)';
    }
    
    // Get email template (use existing body as template if it exists)
    let template;
    if (originalEmailBody.trim().length > 20) {
      // Use existing email as template for context-aware personalization
      template = { body: originalEmailBody };
    } else {
      // Use default template
      const response = await browserAPI.runtime.sendMessage({
        action: 'getDefaultTemplate'
      });
      template = response?.template || getDefaultTemplate();
    }
    
    // Personalize with context
    const personalizedResponse = await browserAPI.runtime.sendMessage({
      action: 'personalizeEmail',
      template: template.body,
      recipient: recipientInfo,
      context: {
        existingBody: originalEmailBody,
        subject: adapter.findSubjectField()?.value || ''
      }
    });
    
    if (personalizedResponse && personalizedResponse.personalized) {
      const output = overlay.querySelector('#warmer-output');
      output.textContent = personalizedResponse.personalized;
      
      const resultDiv = overlay.querySelector('#warmer-result');
      resultDiv.style.display = 'block';
      
      // Store for insertion (will be updated when user edits)
      overlay.dataset.personalizedEmail = personalizedResponse.personalized;
      overlay.dataset.originalEmail = originalEmailBody;
      
      // Show undo button if there was existing content
      const undoBtn = overlay.querySelector('#undo-btn');
      if (undoBtn && originalEmailBody.trim().length > 0) {
        undoBtn.style.display = 'inline-block';
      }
      
      // Update stored email when user edits
      output.addEventListener('input', () => {
        overlay.dataset.personalizedEmail = output.textContent;
      });
      
      showMessage('Email personalized! Edit if needed, then click Insert.', 'success');
    } else {
      showMessage('Failed to personalize email', 'error');
    }
  } catch (error) {
    console.error('Error warming email:', error);
    showMessage('Failed to personalize email', 'error');
  } finally {
    const btn = overlay.querySelector('#warm-email-btn');
    btn.textContent = 'Personalize Email';
    btn.disabled = false;
  }
}

/**
 * Generate subject lines
 */
async function generateSubjects(recipientInfo, overlay) {
  try {
    const btn = overlay.querySelector('#generate-subjects-btn');
    btn.textContent = 'Generating...';
    btn.disabled = true;
    
    const response = await browserAPI.runtime.sendMessage({
      action: 'generateSubjectLines',
      recipient: recipientInfo
    });
    
    if (response && response.subjects) {
      const subjectsList = overlay.querySelector('#subjects-list');
      subjectsList.innerHTML = response.subjects.map((subject, index) => `
        <div class="subject-item">
          <div class="subject-text">${escapeHtml(subject)}</div>
          <button class="btn btn-small btn-primary" onclick="insertSubject('${escapeHtml(subject)}')">Use</button>
        </div>
      `).join('');
      
      overlay.querySelector('#subjects-section').style.display = 'block';
      showMessage('Subject lines generated!', 'success');
    }
  } catch (error) {
    console.error('Error generating subjects:', error);
    showMessage('Failed to generate subject lines', 'error');
  } finally {
    const btn = overlay.querySelector('#generate-subjects-btn');
    btn.textContent = 'Generate Subject Lines';
    btn.disabled = false;
  }
}

/**
 * Show variants
 */
async function showVariants(recipientInfo, overlay) {
  try {
    const response = await browserAPI.runtime.sendMessage({
      action: 'generateVariants',
      recipient: recipientInfo,
      baseEmail: overlay.dataset.personalizedEmail
    });
    
    if (response && response.variants) {
      const variantsList = overlay.querySelector('#variants-list');
      variantsList.innerHTML = response.variants.map((variant, index) => `
        <div class="variant-item">
          <div class="variant-label">Variant ${index + 1}</div>
          <div class="variant-text">${escapeHtml(variant)}</div>
          <button class="btn btn-small btn-primary" onclick="useVariant(${index})">Use This</button>
        </div>
      `).join('');
      
      overlay.querySelector('#variants-section').style.display = 'block';
    }
  } catch (error) {
    console.error('Error generating variants:', error);
    showMessage('Failed to generate variants', 'error');
  }
}

/**
 * Insert warmed email (uses edited version if user made changes)
 */
function insertWarmedEmail(overlay) {
  // Get the current content from the editable div (may have been edited)
  const output = overlay.querySelector('#warmer-output');
  const email = output.textContent || overlay.dataset.personalizedEmail;
  
  if (!email || email.trim().length === 0) {
    showMessage('No email to insert', 'error');
    return;
  }
  
  const bodyField = adapter.findBodyField();
  if (!bodyField) {
    showMessage('Could not find email body field', 'error');
    return;
  }
  
  // Replace entire body with personalized version
  try {
    if (bodyField.contentEditable === 'true' || bodyField.isContentEditable) {
      bodyField.textContent = email;
      bodyField.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (bodyField.tagName === 'TEXTAREA' || bodyField.tagName === 'INPUT') {
      bodyField.value = email;
      bodyField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    showMessage('Email inserted!', 'success');
    overlay.remove();
  } catch (error) {
    console.error('Error inserting email:', error);
    showMessage('Failed to insert email', 'error');
  }
}

/**
 * Undo personalization (restore original email)
 */
function undoPersonalization(overlay) {
  const original = overlay.dataset.originalEmail || '';
  const bodyField = adapter.findBodyField();
  
  if (!bodyField) {
    showMessage('Could not find email body field', 'error');
    return;
  }
  
  try {
    if (bodyField.contentEditable === 'true' || bodyField.isContentEditable) {
      bodyField.textContent = original;
      bodyField.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (bodyField.tagName === 'TEXTAREA' || bodyField.tagName === 'INPUT') {
      bodyField.value = original;
      bodyField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    showMessage('Original email restored', 'success');
    overlay.remove();
  } catch (error) {
    console.error('Error undoing:', error);
    showMessage('Failed to undo', 'error');
  }
}

/**
 * Copy warmed email
 */
function copyWarmedEmail(overlay) {
  const email = overlay.dataset.personalizedEmail;
  if (!email) {
    showMessage('No email to copy', 'error');
    return;
  }
  
  navigator.clipboard.writeText(email).then(() => {
    showMessage('Copied to clipboard!', 'success');
  }).catch(err => {
    showMessage('Failed to copy', 'error');
  });
}

/**
 * Get default template
 */
function getDefaultTemplate() {
  return {
    body: "Hi [FirstName],\n\nI noticed you work at [Company]. I'd love to connect about [topic].\n\nWould you be open to a quick call?\n\nBest,\n[YourName]"
  };
}

/**
 * Utility functions
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showMessage(message, type = 'info') {
  const msgDiv = document.createElement('div');
  msgDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    z-index: 10001;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 14px;
  `;
  msgDiv.textContent = message;
  document.body.appendChild(msgDiv);
  
  setTimeout(() => {
    msgDiv.remove();
  }, 3000);
}

// Global functions for onclick handlers
window.insertSubject = function(subject) {
  const subjectField = adapter.findSubjectField();
  if (subjectField) {
    adapter.insertText(subject, subjectField);
    showMessage('Subject line inserted!', 'success');
  }
};

window.useVariant = function(index) {
  // This will be handled by the overlay
  const overlay = document.getElementById('email-warmer-ui');
  if (overlay) {
    const variants = JSON.parse(overlay.dataset.variants || '[]');
    if (variants[index]) {
      overlay.dataset.personalizedEmail = variants[index];
      const output = overlay.querySelector('#warmer-output');
      output.textContent = variants[index];
      showMessage('Variant selected!', 'success');
    }
  }
};

// Initialize
initializeEmailWarmer();

// Re-initialize on navigation (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    isInitialized = false;
    warmerButton = null;
    setTimeout(initializeEmailWarmer, 1000);
  }
}).observe(document, { subtree: true, childList: true });
