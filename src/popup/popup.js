// Popup UI logic for Cold Email Warmer
const browserAPI = typeof chrome !== 'undefined' && chrome.runtime ? chrome : browser;

// State
let currentPersonalized = '';
let currentRecipient = null;
let emailHistory = [];

// Personalize email
async function personalizeEmail() {
  const name = document.getElementById('recipient-name').value.trim();
  const email = document.getElementById('recipient-email').value.trim();
  const company = document.getElementById('recipient-company').value.trim();
  const title = document.getElementById('recipient-title').value.trim();
  
  if (!email) {
    showMessage('Please enter recipient email', 'error');
    return;
  }
  
  try {
    // Get selected template
    const templateId = document.getElementById('template-select').value;
    const templateResponse = await browserAPI.runtime.sendMessage({
      action: 'getTemplate',
      templateId: templateId
    });
    
    const template = templateResponse?.template || getDefaultTemplate();
    
    // Build recipient info
    const recipient = {
      name: name,
      email: email,
      company: company,
      jobTitle: title,
      firstName: name.split(' ')[0] || ''
    };
    
    currentRecipient = recipient;
    
    // Show loading
    const resultDiv = document.getElementById('personalize-result');
    const outputDiv = document.getElementById('personalize-output');
    outputDiv.textContent = 'Personalizing...';
    resultDiv.style.display = 'block';
    
    // Personalize
    const response = await browserAPI.runtime.sendMessage({
      action: 'personalizeEmail',
      template: template.body,
      recipient: recipient
    });
    
    if (response.success && response.personalized) {
      outputDiv.textContent = response.personalized;
      currentPersonalized = response.personalized;
      showMessage('Email personalized!', 'success');
      
      // Load history
      await loadHistory();
    } else {
      showMessage('Failed to personalize email', 'error');
      resultDiv.style.display = 'none';
    }
  } catch (error) {
    console.error('Error personalizing email:', error);
    showMessage('Failed to personalize email', 'error');
    document.getElementById('personalize-result').style.display = 'none';
  }
}

// Get default template
function getDefaultTemplate() {
  return {
    body: "Hi [FirstName],\n\nI'd love to connect about [topic].\n\nBest,\n[YourName]"
  };
}

// Copy personalized email
function copyPersonalized() {
  if (!currentPersonalized) {
    showMessage('No email to copy', 'error');
    return;
  }
  
  navigator.clipboard.writeText(currentPersonalized).then(() => {
    showMessage('Copied to clipboard!', 'success');
    const btn = document.getElementById('copy-personalized-btn');
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = 'Copy';
    }, 2000);
  }).catch(err => {
    showMessage('Failed to copy', 'error');
  });
}

// View variants
async function viewVariants() {
  if (!currentPersonalized || !currentRecipient) {
    showMessage('Please personalize an email first', 'error');
    return;
  }
  
  try {
    const response = await browserAPI.runtime.sendMessage({
      action: 'generateVariants',
      baseEmail: currentPersonalized,
      recipient: currentRecipient,
      numVariants: 3
    });
    
    if (response.success && response.variants) {
      showVariantsModal(response.variants);
    }
  } catch (error) {
    console.error('Error generating variants:', error);
    showMessage('Failed to generate variants', 'error');
  }
}

// Generate subject lines
async function generateSubjectLines() {
  if (!currentPersonalized || !currentRecipient) {
    showMessage('Please personalize an email first', 'error');
    return;
  }
  
  try {
    const response = await browserAPI.runtime.sendMessage({
      action: 'generateSubjectLines',
      emailBody: currentPersonalized,
      recipient: currentRecipient,
      numSubjects: 5
    });
    
    if (response.success && response.subjects) {
      showSubjectsModal(response.subjects);
    }
  } catch (error) {
    console.error('Error generating subjects:', error);
    showMessage('Failed to generate subject lines', 'error');
  }
}

// Show variants modal
function showVariantsModal(variants) {
  // Simple alert for now - could be enhanced with proper modal
  const variantsText = variants.map((v, i) => `\n\nVariant ${i + 1}:\n${v}`).join('\n\n---\n');
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Email Variants</h3>
        <button class="modal-close">×</button>
      </div>
      <div class="modal-body">
        ${variants.map((v, i) => `
          <div class="variant-item">
            <div class="variant-label">Variant ${i + 1}</div>
            <div class="variant-text">${escapeHtml(v)}</div>
            <button class="btn btn-small btn-primary" onclick="useVariant(${i})">Use This</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  window.useVariant = function(index) {
    currentPersonalized = variants[index];
    document.getElementById('personalize-output').textContent = variants[index];
    modal.remove();
    showMessage('Variant selected!', 'success');
  };
}

// Show subjects modal
function showSubjectsModal(subjects) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Subject Lines</h3>
        <button class="modal-close">×</button>
      </div>
      <div class="modal-body">
        ${subjects.map(s => `
          <div class="subject-item">
            <div class="subject-text">${escapeHtml(s)}</div>
            <button class="btn btn-small btn-primary" onclick="copySubject('${escapeHtml(s)}')">Copy</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  window.copySubject = function(subject) {
    navigator.clipboard.writeText(subject).then(() => {
      showMessage('Subject line copied!', 'success');
    });
  };
}

// Load history
async function loadHistory() {
  try {
    const response = await browserAPI.runtime.sendMessage({ action: 'getHistory' });
    emailHistory = response.history || [];
    
    const historySection = document.getElementById('history-section');
    const historyList = document.getElementById('history-list');
    
    if (emailHistory.length === 0) {
      historySection.style.display = 'none';
      return;
    }
    
    historySection.style.display = 'block';
    historyList.innerHTML = emailHistory.slice(0, 5).map(entry => {
      const date = new Date(entry.timestamp);
      return `
        <div class="history-item" onclick="useHistoryItem('${entry.id}')">
          <div class="history-header">
            <span>${date.toLocaleTimeString()}</span>
          </div>
          <div class="history-recipient">${escapeHtml(entry.recipient.name || entry.recipient.email)}</div>
          <div class="history-email">${escapeHtml(entry.personalized.substring(0, 80))}${entry.personalized.length > 80 ? '...' : ''}</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading history:', error);
  }
}

// Use history item
window.useHistoryItem = function(id) {
  const entry = emailHistory.find(e => e.id === id);
  if (entry) {
    document.getElementById('recipient-name').value = entry.recipient.name || '';
    document.getElementById('recipient-email').value = entry.recipient.email || '';
    document.getElementById('recipient-company').value = entry.recipient.company || '';
    document.getElementById('personalize-output').textContent = entry.personalized;
    document.getElementById('personalize-result').style.display = 'block';
    currentPersonalized = entry.personalized;
  }
};

// Utility functions
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
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 14px;
  `;
  msgDiv.textContent = message;
  document.body.appendChild(msgDiv);
  
  setTimeout(() => {
    msgDiv.remove();
  }, 3000);
}

// Event listeners
document.getElementById('personalize-btn').addEventListener('click', personalizeEmail);

document.getElementById('copy-personalized-btn').addEventListener('click', copyPersonalized);

document.getElementById('view-variants-btn').addEventListener('click', viewVariants);

document.getElementById('generate-subjects-btn').addEventListener('click', generateSubjectLines);

document.getElementById('settings-btn').addEventListener('click', () => {
  browserAPI.runtime.openOptionsPage();
});

document.getElementById('view-settings-btn').addEventListener('click', () => {
  browserAPI.runtime.openOptionsPage();
});

// Initialize
loadHistory();
