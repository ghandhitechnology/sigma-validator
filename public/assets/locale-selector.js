(() => {
  const STORAGE_KEY = 'sigmaLocale';
  const SUPPORTED = new Set(['ko', 'en']);

  function getSavedLocale() {
    try {
      const locale = localStorage.getItem(STORAGE_KEY);
      return SUPPORTED.has(locale) ? locale : null;
    } catch {
      return null;
    }
  }

  function saveLocale(locale) {
    if (!SUPPORTED.has(locale)) return false;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
      return true;
    } catch {
      return false;
    }
  }

  window.SigmaLocale = { getSavedLocale, saveLocale };

  if (document.documentElement.dataset.localeSelector === 'root') {
    const locale = getSavedLocale();
    if (locale) location.replace(`/${locale}/`);
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('[data-locale]');
    if (link) saveLocale(link.dataset.locale);
  });
})();
