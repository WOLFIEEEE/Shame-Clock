// UI helper utilities for better user experience

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show loading spinner
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
 */
export function hideLoading(container) {
  const spinner = container.querySelector('.loading-spinner');
  if (spinner) {
    spinner.remove();
  }
}

/**
 * Show success message
 */
export function showSuccess(message, duration = 3000) {
  showToast(message, 'success', duration);
}

/**
 * Show error message
 */
export function showError(message, duration = 5000) {
  showToast(message, 'error', duration);
}

/**
 * Show info message
 */
export function showInfo(message, duration = 4000) {
  showToast(message, 'info', duration);
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 3000) {
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

  setTimeout(() => toast.classList.add('show'), 10);

  toast.querySelector('.toast-close').addEventListener('click', () => {
    removeToast(toast);
  });

  setTimeout(() => removeToast(toast), duration);
}

/**
 * Remove toast
 */
function removeToast(toast) {
  toast.classList.remove('show');
  setTimeout(() => toast.remove(), 300);
}

/**
 * Get toast icon
 */
function getToastIcon(type) {
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  };
  return icons[type] || icons.info;
}

/**
 * Add tooltip to element
 */
export function addTooltip(element, text) {
  element.setAttribute('title', text);
  element.setAttribute('data-tooltip', text);
  return element;
}

/**
 * Create help icon with tooltip
 */
export function createHelpIcon(text) {
  const icon = document.createElement('span');
  icon.className = 'help-icon';
  icon.textContent = '?';
  icon.setAttribute('title', text);
  icon.setAttribute('data-tooltip', text);
  return icon;
}

/**
 * Create empty state message
 */
export function createEmptyState(message, icon = '📭') {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.innerHTML = `
    <div class="empty-icon">${icon}</div>
    <div class="empty-message">${escapeHtml(message)}</div>
  `;
  return empty;
}

