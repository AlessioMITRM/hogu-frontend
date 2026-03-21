import { useEffect, useRef } from 'react';

// ── Singleton DOM – creato UNA SOLA VOLTA, mai toccato da React ──────────────
// Vivendo direttamente in document.body, React non può mai smontarlo né
// ricreare i suoi nodi interni → le animazioni CSS girano in continuo
// indipendentemente dai re-render del componente genitore.
let overlayEl = null;
let activeCount = 0;
let stylesInjected = false;

function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes ls-spin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes ls-ping  { 0% { transform: scale(1); opacity: .6; } 100% { transform: scale(1.8); opacity: 0; } }
    @keyframes ls-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }

    #ls-overlay {
      position: fixed; inset: 0; z-index: 20000;
      display: flex; align-items: center; justify-content: center;
      background: white;
      transition: opacity 280ms ease, visibility 280ms ease;
    }
    #ls-overlay.ls-hidden  { opacity: 0; visibility: hidden;  pointer-events: none; }
    #ls-overlay.ls-visible { opacity: 1; visibility: visible; pointer-events: all;  }

    .ls-ping {
      position: absolute; inset: 0; border-radius: 50%;
      border: 4px solid rgba(104,180,155,.1);
      animation: ls-ping 1.5s ease-out infinite;
    }
    .ls-ring {
      position: absolute; inset: 0; border-radius: 50%;
      border: 4px solid transparent;
      border-top-color: #68B49B;
      border-bottom-color: rgba(104,180,155,.3);
      animation: ls-spin 1s linear infinite;
    }
    .ls-logo-wrap { animation: ls-spin 3s linear infinite; display: flex; }
    .ls-text {
      color: #68B49B; font-weight: 700; font-size: 1.125rem;
      letter-spacing: .2em; margin-top: 1.5rem;
      animation: ls-pulse 2s ease-in-out infinite;
      font-family: inherit; border: none; background: none;
    }
  `;
  document.head.appendChild(style);
}

function ensureOverlay() {
  if (overlayEl) return;

  injectStyles();

  overlayEl = document.createElement('div');
  overlayEl.id = 'ls-overlay';
  overlayEl.className = 'ls-hidden';
  overlayEl.innerHTML = `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="position:relative;width:6rem;height:6rem;display:flex;align-items:center;justify-content:center;">
        <div class="ls-ping"></div>
        <div class="ls-ring"></div>
        <div class="ls-logo-wrap">
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none"
               xmlns="http://www.w3.org/2000/svg"
               style="filter:drop-shadow(0 4px 6px rgba(0,0,0,.1))">
            <path d="M20 15V85M80 15V85M20 50H80"
                  stroke="#68B49B" stroke-width="12"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
      <p class="ls-text">CARICAMENTO</p>
    </div>
  `;
  document.body.appendChild(overlayEl);
}

function showOverlay() {
  ensureOverlay();
  overlayEl.classList.remove('ls-hidden');
  overlayEl.classList.add('ls-visible');
}

function hideOverlay() {
  if (!overlayEl) return;
  overlayEl.classList.remove('ls-visible');
  overlayEl.classList.add('ls-hidden');
}
// ─────────────────────────────────────────────────────────────────────────────

const LoadingScreen = ({ isLoading }) => {
  const savedScrollY = useRef(0);

  useEffect(() => {
    if (!isLoading) return;

    activeCount++;

    // Mostra overlay e blocca scroll solo al primo richiedente
    if (activeCount === 1) {
      savedScrollY.current = window.scrollY;
      document.documentElement.style.setProperty('overflow', 'hidden', 'important');
      document.body.style.setProperty('overflow', 'hidden', 'important');
      showOverlay();
    }

    return () => {
      activeCount = Math.max(0, activeCount - 1);

      // Nasconde overlay e sblocca scroll solo quando nessuno lo richiede più
      if (activeCount === 0) {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        hideOverlay();
      }
    };
  }, [isLoading]);

  // Il componente React non renderizza nulla nel proprio albero:
  // tutto vive direttamente in document.body, immune ai re-render
  return null;
};

export default LoadingScreen;