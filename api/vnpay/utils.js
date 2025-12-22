import crypto from 'crypto';

export function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const k of keys) {
    sorted[k] = obj[k];
  }
  return sorted;
}

export function hmacSHA512(secret, data) {
  return crypto.createHmac('sha512', secret).update(data, 'utf-8').digest('hex');
}

export function buildQuery(params) {
  return new URLSearchParams(params).toString();
}

export function getClientIp(req) {
  try {
    return (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim();
  } catch {
    return '0.0.0.0';
  }
}
