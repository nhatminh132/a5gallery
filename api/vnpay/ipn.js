import { sortObject, hmacSHA512, buildQuery } from './utils.js';
import { createClient } from '@supabase/supabase-js';

function ok(message = 'success') {
  return { RspCode: '00', Message: message };
}
function err(code, message) {
  return { RspCode: code, Message: message };
}

export default async function handler(req, res) {
  try {
    const params = { ...(req.method === 'POST' ? req.body : req.query) };
    const receivedHash = params['vnp_SecureHash'];
    const receivedHashType = params['vnp_SecureHashType'];

    if (!receivedHash) {
      return res.status(200).json(err('97', 'Missing hash'));
    }

    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];

    const sorted = sortObject(params);
    const signData = buildQuery(sorted);
    const computedHash = hmacSHA512(process.env.VNPAY_HASH_SECRET, signData);

    if (computedHash !== receivedHash) {
      return res.status(200).json(err('97', 'Checksum failed'));
    }

    const responseCode = params['vnp_ResponseCode'];
    const txnRef = params['vnp_TxnRef'] || '';

    // Extract userId from our order id format
    const userId = txnRef.split('-')[0];

    if (responseCode === '00' && userId) {
      // Update Supabase profile
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const { error } = await supabase
        .from('profiles')
        .update({ no_ads: true, paid_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('[vnpay/ipn] supabase update error', error);
        return res.status(200).json(err('99', 'Database error'));
      }

      return res.status(200).json(ok());
    }

    return res.status(200).json(err('24', 'Payment not successful'));
  } catch (e) {
    console.error('[vnpay/ipn] error', e);
    return res.status(200).json(err('99', 'Unknown error'));
  }
}
