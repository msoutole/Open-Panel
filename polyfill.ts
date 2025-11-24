// Robust Polyfill for matchMedia and addListener to fix Recharts and other library compatibility issues
if (typeof window !== 'undefined') {
  const originalMatchMedia = window.matchMedia;

  // If matchMedia doesn't exist, provide a mock
  if (!originalMatchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // Deprecated but required by some libs
      removeListener: () => {}, // Deprecated but required by some libs
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  } else {
    // If it exists, wrap it to ensure addListener is present on the result
    window.matchMedia = (query) => {
      const mql = originalMatchMedia.call(window, query);
      
      // Fallback if native returns nothing (rare but possible in broken envs)
      if (!mql) {
         return {
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {}, 
            removeListener: () => {}, 
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
          };
      }

      // Some browsers or environments might return an object without addListener
      if (!mql.addListener) {
        mql.addListener = (listener: any) => mql.addEventListener('change', listener);
        mql.removeListener = (listener: any) => mql.removeEventListener('change', listener);
      }
      return mql;
    };
  }
}

export {};
