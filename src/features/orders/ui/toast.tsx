type ToastType = 'info' | 'success' | 'error';

export function showToast(message: string, type: ToastType = 'info') {
  const id = `oc-toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const el = document.createElement('div');
  el.id = id;
  el.textContent = message;
  el.style.position = 'fixed';
  el.style.right = '16px';
  el.style.top = '16px';
  el.style.zIndex = '9999';
  el.style.padding = '8px 12px';
  el.style.borderRadius = '6px';
  el.style.color = '#fff';
  el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
  el.style.transition = 'opacity 200ms';
  el.style.opacity = '0';
  switch (type) {
    case 'success':
      el.style.background = '#28a745';
      break;
    case 'error':
      el.style.background = '#dc3545';
      break;
    default:
      el.style.background = '#333';
  }
  document.body.appendChild(el);
  requestAnimationFrame(() => (el.style.opacity = '1'));
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

export default showToast;
