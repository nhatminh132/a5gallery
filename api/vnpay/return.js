import { sortObject, hmacSHA512, buildQuery } from './utils.js';

export default async function handler(req, res) {
  try {
    const isPost = req.method === 'POST';
    const params = { ...(isPost ? req.body : req.query) };

    const receivedHash = params['vnp_SecureHash'];
    if (!receivedHash) {
      return res.status(400).json({ success: false, error: 'Missing hash' });
    }

    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];
    const sorted = sortObject(params);
    const signData = buildQuery(sorted);
    const computedHash = hmacSHA512(process.env.VNPAY_HASH_SECRET, signData);

    if (computedHash !== receivedHash) {
      return res.status(200).json({ success: false, error: 'Checksum failed' });
    }

    const success = params['vnp_ResponseCode'] === '00';
    return res.status(200).json({ success, params });
  } catch (e) {
    console.error('[vnpay/return] error', e);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
