VNPay serverless routes for Vercel:
- POST /api/vnpay/create-payment
- POST /api/vnpay/ipn
- GET/POST /api/vnpay/return

Env vars required:
- VNPAY_TMN_CODE
- VNPAY_HASH_SECRET
- VNPAY_API_URL (e.g., https://sandbox.vnpayment.vn/paymentv2/vpcpay.html)
- VNPAY_RETURN_URL (e.g., https://your-domain.com/api/vnpay/return)
- VITE_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
- SUPABASE_SERVICE_ROLE_KEY
