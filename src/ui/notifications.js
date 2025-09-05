// Lightweight toast notifications for dark theme
// Usage: import { showToast } from '/src/ui/notifications.js'; showToast('Message','info');

const TOAST_CONTAINER_ID = 'agw-toast-container';

function ensureContainer() {
  let container = document.getElementById(TOAST_CONTAINER_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    container.style.position = 'fixed';
    container.style.zIndex = '4000';
    container.style.right = '12px';
    container.style.bottom = '12px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    container.style.pointerEvents = 'none';
    container.style.paddingBottom = 'env(safe-area-inset-bottom, 0)';
    document.body.appendChild(container);
  }
  return container;
}

function makeToastElement(message, type) {
  const el = document.createElement('div');
  el.className = `agw-toast agw-toast-${type || 'info'}`;
  el.textContent = String(message || '');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.style.background = 'rgba(17, 24, 39, 0.95)'; // #111827
  el.style.color = '#e5e7eb';
  el.style.border = '1px solid #374151';
  el.style.borderRadius = '10px';
  el.style.padding = '10px 12px';
  el.style.fontSize = '0.9rem';
  el.style.lineHeight = '1.3';
  el.style.whiteSpace = 'pre-line';
  el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.35)';
  el.style.maxWidth = '86vw';
  el.style.pointerEvents = 'auto';
  el.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
  el.style.transform = 'translateY(8px)';
  el.style.opacity = '0';

  // Accent stripe by type
  const stripe = document.createElement('span');
  stripe.style.position = 'absolute';
  stripe.style.left = '0';
  stripe.style.top = '0';
  stripe.style.bottom = '0';
  stripe.style.width = '3px';
  stripe.style.borderTopLeftRadius = '10px';
  stripe.style.borderBottomLeftRadius = '10px';
  stripe.style.background = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#22d3ee';
  stripe.style.display = 'inline-block';

  el.style.position = 'relative';
  el.prepend(stripe);

  requestAnimationFrame(() => {
    el.style.transform = 'translateY(0)';
    el.style.opacity = '1';
  });
  return el;
}

export function showToast(message, type = 'info', timeoutMs = 3000) {
  try {
    const container = ensureContainer();
    const toast = makeToastElement(message, type);
    container.appendChild(toast);
    const timeout = Math.max(1500, Number(timeoutMs) || 3000);
    const timer = setTimeout(() => {
      try {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(6px)';
        setTimeout(() => toast.remove(), 180);
      } catch (_) {}
    }, timeout);

    // Close on click
    toast.addEventListener('click', () => {
      clearTimeout(timer);
      try {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(6px)';
        setTimeout(() => toast.remove(), 120);
      } catch (_) {}
    });
  } catch (e) {
    // Fallback to native alert if something goes wrong
    try { window._nativeAlert ? window._nativeAlert(String(message)) : window.alert(String(message)); } catch (_) {}
  }
}

// Optional: expose globally for legacy
if (!window.showToast) {
  window.showToast = showToast;
}

