/**
 * Utility functions for working with cookies in the browser
 */

/**
 * Get all cookies as an object
 */
export const getCookies = (): Record<string, string> => {
  return document.cookie.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=').map(decodeURIComponent);
    return { ...cookies, [name]: value };
  }, {});
};

/**
 * Get a specific cookie by name
 */
export const getCookie = (name: string): string | undefined => {
  const cookies = getCookies();
  return cookies[name];
};

/**
 * Check if third-party cookies are enabled
 */
export const checkThirdPartyCookiesEnabled = async (): Promise<boolean> => {
  // This is a basic check - not 100% reliable
  try {
    const testIframe = document.createElement('iframe');
    testIframe.style.display = 'none';
    document.body.appendChild(testIframe);
    
    testIframe.contentWindow?.document.cookie = 'cookieTest=1; path=/';
    const cookieEnabled = testIframe.contentWindow?.document.cookie.indexOf('cookieTest=') !== -1;
    
    document.body.removeChild(testIframe);
    return !!cookieEnabled;
  } catch (e) {
    console.error('Error checking third-party cookies:', e);
    return false;
  }
};

/**
 * Get detailed cookie info for debugging
 */
export const getCookieDebugInfo = (): {
  allCookies: string;
  parsedCookies: Record<string, string>;
  hasRefreshToken: boolean;
} => {
  const allCookies = document.cookie;
  const parsedCookies = getCookies();
  const hasRefreshToken = 'refreshToken' in parsedCookies;
  
  return {
    allCookies,
    parsedCookies,
    hasRefreshToken
  };
};
