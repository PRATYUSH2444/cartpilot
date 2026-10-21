export function parseDeviceInfo(userAgent?: string): string {
  if (!userAgent || typeof userAgent !== 'string') {
    return 'Web Browser';
  }

  const ua = userAgent.toLowerCase();

  let browser = 'Browser';
  if (ua.includes('edg/')) {
    browser = 'Edge';
  } else if (ua.includes('chrome') && !ua.includes('edg/')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  }

  let os = 'Unknown OS';
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('macintosh') || ua.includes('mac os')) {
    os = 'macOS';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }

  return `${browser} on ${os}`;
}
