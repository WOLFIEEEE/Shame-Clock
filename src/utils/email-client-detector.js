// Email client detection utilities
/**
 * Detect current email client
 * @returns {string} Client identifier ('gmail', 'outlook', 'generic')
 */
export function detectEmailClient() {
  const hostname = window.location.hostname;
  
  if (hostname.includes('mail.google.com')) {
    return 'gmail';
  } else if (hostname.includes('outlook.') || hostname.includes('office.com') || hostname.includes('office365.com')) {
    return 'outlook';
  }
  
  return 'generic';
}

/**
 * Check if email client is supported
 * @param {string} client - Client identifier
 * @returns {boolean}
 */
export function isClientSupported(client) {
  const supported = ['gmail', 'outlook', 'generic'];
  return supported.includes(client);
}

/**
 * Get email client adapter
 * @param {string} client - Client identifier
 * @returns {Object} Client adapter
 */
export function getEmailClientAdapter(client) {
  switch (client) {
    case 'gmail':
      return gmailAdapter;
    case 'outlook':
      return outlookAdapter;
    default:
      return genericAdapter;
  }
}

// Gmail adapter
const gmailAdapter = {
  findComposeWindow() {
    // Look for Gmail compose window
    const composeWindow = document.querySelector('[role="dialog"]') ||
                         document.querySelector('.aYF') ||
                         document.querySelector('[aria-label*="Compose"]');
    return composeWindow;
  },
  
  findToField() {
    const toField = document.querySelector('[name="to"]') ||
                   document.querySelector('[aria-label*="To"]') ||
                   document.querySelector('input[type="email"]');
    return toField;
  },
  
  findSubjectField() {
    const subjectField = document.querySelector('[name="subjectbox"]') ||
                        document.querySelector('[name="subject"]') ||
                        document.querySelector('[aria-label*="Subject"]');
    return subjectField;
  },
  
  findBodyField() {
    const bodyField = document.querySelector('[role="textbox"][aria-label*="Message"]') ||
                     document.querySelector('[contenteditable="true"][aria-label*="Message"]') ||
                     document.querySelector('.Am.Al.editable');
    return bodyField;
  },
  
  extractRecipient() {
    const toField = this.findToField();
    if (!toField) return null;
    
    const email = toField.value || toField.textContent;
    if (!email) return null;
    
    // Try to extract name from email or field
    const nameMatch = email.match(/^([^<]+)<(.+)>$/);
    if (nameMatch) {
      return {
        name: nameMatch[1].trim(),
        email: nameMatch[2].trim()
      };
    }
    
    return {
      email: email.trim(),
      name: email.split('@')[0] // Fallback to email username
    };
  },
  
  insertText(text, field) {
    if (!field) return false;
    
    try {
      // For contenteditable divs
      if (field.contentEditable === 'true' || field.isContentEditable) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Trigger input event
        field.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      
      // For input/textarea
      if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
        const start = field.selectionStart || 0;
        const end = field.selectionEnd || 0;
        const value = field.value;
        field.value = value.substring(0, start) + text + value.substring(end);
        field.selectionStart = field.selectionEnd = start + text.length;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    } catch (error) {
      console.error('Error inserting text:', error);
      return false;
    }
    
    return false;
  }
};

// Outlook adapter
const outlookAdapter = {
  findComposeWindow() {
    const composeWindow = document.querySelector('[role="dialog"]') ||
                         document.querySelector('.ms-ComposeHeader') ||
                         document.querySelector('[aria-label*="New message"]');
    return composeWindow;
  },
  
  findToField() {
    const toField = document.querySelector('[aria-label*="To"]') ||
                   document.querySelector('input[type="email"]') ||
                   document.querySelector('[role="textbox"][aria-label*="To"]');
    return toField;
  },
  
  findSubjectField() {
    const subjectField = document.querySelector('[aria-label*="Subject"]') ||
                        document.querySelector('[name="subject"]') ||
                        document.querySelector('input[placeholder*="Subject"]');
    return subjectField;
  },
  
  findBodyField() {
    const bodyField = document.querySelector('[role="textbox"][aria-label*="Message"]') ||
                     document.querySelector('[contenteditable="true"][aria-label*="Message"]') ||
                     document.querySelector('.ms-Editor-contentEditable');
    return bodyField;
  },
  
  extractRecipient() {
    const toField = this.findToField();
    if (!toField) return null;
    
    const email = toField.value || toField.textContent;
    if (!email) return null;
    
    return {
      email: email.trim(),
      name: email.split('@')[0]
    };
  },
  
  insertText(text, field) {
    return gmailAdapter.insertText(text, field);
  }
};

// Generic adapter (for any email composer)
const genericAdapter = {
  findComposeWindow() {
    // Try common selectors
    return document.querySelector('[role="dialog"]') ||
           document.querySelector('form') ||
           document.body;
  },
  
  findToField() {
    return document.querySelector('input[type="email"]') ||
           document.querySelector('[name*="to"]') ||
           document.querySelector('[name*="recipient"]');
  },
  
  findSubjectField() {
    return document.querySelector('[name*="subject"]') ||
           document.querySelector('input[placeholder*="Subject"]');
  },
  
  findBodyField() {
    return document.querySelector('textarea[name*="body"]') ||
           document.querySelector('textarea[name*="message"]') ||
           document.querySelector('[contenteditable="true"]');
  },
  
  extractRecipient() {
    const toField = this.findToField();
    if (!toField) return null;
    
    return {
      email: (toField.value || toField.textContent || '').trim(),
      name: ''
    };
  },
  
  insertText(text, field) {
    return gmailAdapter.insertText(text, field);
  }
};

