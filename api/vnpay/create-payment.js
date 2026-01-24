import { sortObject, hmacSHA512, buildQuery, getClientIp } from './utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secret = process.env.VNPAY_HASH_SECRET;
    const apiUrl = process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = process.env.VNPAY_RETURN_URL || `${req.headers['origin'] || ''}/api/vnpay/return`;

    const amountVND = 5000; // one-time price
    const amount = amountVND * 100; // per VNPay spec
    const now = new Date();
    const createDate = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14); // YYYYMMDDHHmmss
    const orderId = `${userId}-${Date.now()}`; // encode userId for IPN mapping

    const ipAddr = getClientIp(req) || '0.0.0.0';

    const vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: amount.toString(),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `No-ads lifetime for user ${userId}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const sorted = sortObject(vnp_Params);
    const signData = buildQuery(sorted);
    const secureHash = hmacSHA512(secret, signData);

    const paymentUrl = `${apiUrl}?${signData}&vnp_SecureHash=${secureHash}`;

    return res.status(200).json({ url: paymentUrl });
  } catch (e) {
    console.error('[vnpay/create-payment] error', e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
