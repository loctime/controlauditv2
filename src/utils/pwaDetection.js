export const isPWAInstalled = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = window.navigator.standalone === true;
  window._pwaDebug = window._pwaDebug || [];
  window._pwaDebug.push('isStandalone:' + isStandalone + ' isIOS:' + isIOSStandalone);
  return isStandalone || isIOSStandalone;
};
export const isMobileDevice = () => {
  const result = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  window._pwaDebug = window._pwaDebug || [];
  window._pwaDebug.push('isMobile:' + result);
  return result;
};
export const isPWAMobile = () => isPWAInstalled() && isMobileDevice();
export const shouldEnableOffline = () => isPWAMobile();
