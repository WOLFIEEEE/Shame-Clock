// UI helper utilities for better user experience

/**
 * Show loading spinner
 * @param {HTMLElement} container - Container to show spinner in
 * @param {string} message - Optional loading message
 * @returns {HTMLElement} - Spinner element
 */
export function showLoading(container, message = 'Loading...') {
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  spinner.innerHTML = `
    <div class="spinner"></div>
    <p class="loading-message">${escapeHtml(message)}</p>
  `;
  container.innerHTML = '';
  container.appendChild(spinner);
  return spinner;
}

/**
 * Hide loading spinner
 * @param {HTMLElement} container - Container with spinner
 */
export function hideLoading(container) {
  const spinner = container.querySelector('.loading-spinner');
  if (spinner) {
    spinner.remove();
  }
}

/**
 * Show success message
 * @param {string} message - Success message
 * @param {number} duration - Duration in ms
 */
export function showSuccess(message, duration = 3000) {
  showToast(message, 'success', duration);
}

/**
 * Show error message
 * @param {string} message - Error message
 * @param {number} duration - Duration in ms
 */
export function showError(message, duration = 5000) {
  showToast(message, 'error', duration);
}

/**
 * Show info message
 * @param {string} message - Info message
 * @param {number} duration - Duration in ms
 */
export function showInfo(message, duration = 4000) {
  showToast(message, 'info', duration);
}

/**
 * Show toast notification
 * @param {string} message - Message to show
 * @param {string} type - Type: success, error, info, warning
 * @param {number} duration - Duration in ms
 */
export function showToast(message, type = 'info', duration = 3000) {
  // Remove existing toast
  const existing = document.querySelector('.ui-toast');
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.className = `ui-toast ui-toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  const icon = getToastIcon(type);
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close" aria-label="Close">×</button>
  `;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);

  // Close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    removeToast(toast);
  });

  // Auto-remove
  setTimeout(() => removeToast(toast), duration);
}

/**
 * Remove toast
 * @param {HTMLElement} toast - Toast element
 */
function removeToast(toast) {
  toast.classList.remove('show');
  setTimeout(() => toast.remove(), 300);
}

/**
 * Get icon for toast type
 * @param {string} type - Toast type
 * @returns {string} - Icon emoji/character
 */
function getToastIcon(type) {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'warning': return '⚠';
    case 'info': return 'ℹ';
    default: return 'ℹ';
  }
}

/**
 * Create tooltip element
 * @param {string} text - Tooltip text
 * @param {HTMLElement} target - Target element
 * @param {string} position - Position: top, bottom, left, right
 * @returns {HTMLElement} - Tooltip element
 */
export function createTooltip(text, target, position = 'top') {
  const tooltip = document.createElement('div');
  tooltip.className = `ui-tooltip ui-tooltip-${position}`;
  tooltip.textContent = text;
  tooltip.setAttribute('role', 'tooltip');
  
  document.body.appendChild(tooltip);
  
  // Position tooltip
  const rect = target.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  switch (position) {
    case 'top':
      tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltipRect.width / 2)}px`;
      tooltip.style.top = `${rect.top - tooltipRect.height - 8}px`;
      break;
    case 'bottom':
      tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltipRect.width / 2)}px`;
      tooltip.style.top = `${rect.bottom + 8}px`;
      break;
    case 'left':
      tooltip.style.left = `${rect.left - tooltipRect.width - 8}px`;
      tooltip.style.top = `${rect.top + (rect.height / 2) - (tooltipRect.height / 2)}px`;
      break;
    case 'right':
      tooltip.style.left = `${rect.right + 8}px`;
      tooltip.style.top = `${rect.top + (rect.height / 2) - (tooltipRect.height / 2)}px`;
      break;
  }
  
  return tooltip;
}

/**
 * Add tooltip to element
 * @param {HTMLElement} element - Element to add tooltip to
 * @param {string} text - Tooltip text
 * @param {string} position - Position
 */
export function addTooltip(element, text, position = 'top') {
  let tooltip = null;
  
  element.addEventListener('mouseenter', (e) => {
    tooltip = createTooltip(text, element, position);
  });
  
  element.addEventListener('mouseleave', () => {
    if (tooltip) {
      tooltip.remove();
      tooltip = null;
    }
  });
}

/**
 * Create help icon with tooltip
 * @param {string} helpText - Help text
 * @returns {HTMLElement} - Help icon element
 */
export function createHelpIcon(helpText) {
  const icon = document.createElement('span');
  icon.className = 'help-icon';
  icon.setAttribute('aria-label', helpText);
  icon.textContent = '?';
  icon.title = helpText;
  
  addTooltip(icon, helpText, 'right');
  
  return icon;
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {string} title - Dialog title
 * @returns {Promise<boolean>} - User's choice
 */
export function showConfirm(message, title = 'Confirm') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'ui-dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'ui-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-labelledby', 'dialog-title');
    dialog.setAttribute('aria-modal', 'true');
    
    dialog.innerHTML = `
      <div class="dialog-header">
        <h3 id="dialog-title">${escapeHtml(title)}</h3>
      </div>
      <div class="dialog-body">
        <p>${escapeHtml(message)}</p>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-secondary dialog-cancel">Cancel</button>
        <button class="btn btn-primary dialog-confirm">Confirm</button>
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Focus trap
    const focusable = dialog.querySelectorAll('button');
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];
    
    const handleTab = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };
    
    dialog.addEventListener('keydown', handleTab);
    
    const cleanup = () => {
      overlay.remove();
      dialog.removeEventListener('keydown', handleTab);
    };
    
    dialog.querySelector('.dialog-confirm').addEventListener('click', () => {
      cleanup();
      resolve(true);
    });
    
    dialog.querySelector('.dialog-cancel').addEventListener('click', () => {
      cleanup();
      resolve(false);
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(false);
      }
    });
    
    // Focus first button
    setTimeout(() => firstFocusable.focus(), 10);
  });
}

/**
 * Create empty state with guidance
 * @param {Object} options - Empty state options
 * @returns {HTMLElement} - Empty state element
 */
export function createEmptyState(options = {}) {
  const {
    icon = '📊',
    title = 'No data yet',
    message = 'Get started by visiting a tracked site.',
    actionText = null,
    actionCallback = null
  } = options;
  
  const emptyState = document.createElement('div');
  emptyState.className = 'empty-state-enhanced';
  
  let actionButton = '';
  if (actionText && actionCallback) {
    actionButton = `<button class="btn btn-primary empty-state-action">${escapeHtml(actionText)}</button>`;
  }
  
  emptyState.innerHTML = `
    <div class="empty-state-icon">${icon}</div>
    <h3 class="empty-state-title">${escapeHtml(title)}</h3>
    <p class="empty-state-message">${escapeHtml(message)}</p>
    ${actionButton}
  `;
  
  if (actionText && actionCallback) {
    emptyState.querySelector('.empty-state-action').addEventListener('click', actionCallback);
  }
  
  return emptyState;
}

/**
 * Show status indicator
 * @param {string} status - Status: active, paused, error
 * @param {HTMLElement} container - Container to show in
 */
export function showStatusIndicator(status, container) {
  const existing = container.querySelector('.status-indicator');
  if (existing) {
    existing.remove();
  }
  
  const indicator = document.createElement('div');
  indicator.className = `status-indicator status-${status}`;
  indicator.setAttribute('aria-label', `Status: ${status}`);
  
  const icons = {
    active: '🟢',
    paused: '🟡',
    error: '🔴',
    loading: '⏳'
  };
  
  const labels = {
    active: 'Tracking active',
    paused: 'Tracking paused',
    error: 'Error',
    loading: 'Loading...'
  };
  
  indicator.innerHTML = `
    <span class="status-dot">${icons[status] || '⚪'}</span>
    <span class="status-label">${labels[status] || status}</span>
  `;
  
  container.appendChild(indicator);
}

/**
 * Escape HTML
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
export function formatNumber(num) {
  return num.toLocaleString();
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard!');
    return true;
  } catch (error) {
    showError('Failed to copy to clipboard');
    return false;
  }
}

