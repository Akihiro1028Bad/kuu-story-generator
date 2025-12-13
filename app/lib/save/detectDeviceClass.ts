export type DeviceClass = 'desktop' | 'mobile'

export function detectDeviceClass(): DeviceClass {
  if (typeof navigator === 'undefined') return 'desktop'
  
  const ua = navigator.userAgent
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
}

