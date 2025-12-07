// Device information utilities
export interface DeviceInfo {
  ip_address?: string;
  device_name: string;
  device_os: string;
  user_agent: string;
}

// Get device OS information
export function getDeviceOS(): string {
  const userAgent = navigator.userAgent;
  
  // Mobile devices
  if (/Android/i.test(userAgent)) {
    return 'Android';
  }
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return 'iOS';
  }
  
  // Desktop operating systems
  if (/Windows NT/i.test(userAgent)) {
    const version = userAgent.match(/Windows NT (\d+\.\d+)/);
    if (version) {
      const versionNumber = parseFloat(version[1]);
      if (versionNumber >= 10.0) return 'Windows 11/10';
      if (versionNumber >= 6.3) return 'Windows 8.1';
      if (versionNumber >= 6.2) return 'Windows 8';
      if (versionNumber >= 6.1) return 'Windows 7';
      return 'Windows';
    }
    return 'Windows';
  }
  if (/Mac OS X/i.test(userAgent)) {
    return 'macOS';
  }
  if (/Linux/i.test(userAgent)) {
    return 'Linux';
  }
  if (/CrOS/i.test(userAgent)) {
    return 'Chrome OS';
  }
  
  return 'Unknown OS';
}

// Get device name/type
export function getDeviceName(): string {
  const userAgent = navigator.userAgent;
  
  // Mobile devices
  if (/iPhone/i.test(userAgent)) {
    return 'iPhone';
  }
  if (/iPad/i.test(userAgent)) {
    return 'iPad';
  }
  if (/iPod/i.test(userAgent)) {
    return 'iPod';
  }
  if (/Android/i.test(userAgent)) {
    // Try to get specific Android device info
    const androidMatch = userAgent.match(/Android[^;]*;[^)]*\)/);
    if (androidMatch) {
      return androidMatch[0].replace('Android', 'Android Device').replace(/[;)]/g, '');
    }
    return 'Android Device';
  }
  
  // Desktop browsers
  if (/Chrome/i.test(userAgent)) {
    return 'Chrome Browser';
  }
  if (/Firefox/i.test(userAgent)) {
    return 'Firefox Browser';
  }
  if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    return 'Safari Browser';
  }
  if (/Edge/i.test(userAgent)) {
    return 'Edge Browser';
  }
  
  return 'Desktop Computer';
}

// Get user's IP address (using external service)
export async function getUserIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'Unknown IP';
  } catch (error) {
    console.warn('Could not fetch IP address:', error);
    return 'Unknown IP';
  }
}

// Get complete device information
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const ip_address = await getUserIP();
  const device_name = getDeviceName();
  const device_os = getDeviceOS();
  const user_agent = navigator.userAgent;
  
  return {
    ip_address,
    device_name,
    device_os,
    user_agent
  };
}

// Store device info in user's profile
export async function updateUserDeviceInfo() {
  const deviceInfo = await getDeviceInfo();
  
  try {
    const { error } = await import('../lib/supabase').then(({ supabase }) =>
      supabase.auth.updateUser({
        data: {
          device_info: deviceInfo,
          last_device_update: new Date().toISOString()
        }
      })
    );
    
    if (error) {
      console.error('Error updating device info:', error);
    }
  } catch (error) {
    console.error('Error updating device info:', error);
  }
}