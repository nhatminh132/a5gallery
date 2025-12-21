import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function NoAdsButton() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const openPopup = () => {
    const displayName = profile?.full_name || user?.email || 'Guest';
    const data = `Support Me hehehe. VPBank/Momo/Shopee Pay: 0784648244`;
    const qr = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data)}&size=220x220`;

    const w = 420, h = 560;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const popup = window.open('', 'noads_popup', `width=${w},height=${h},left=${left},top=${top}`);
    if (!popup) {
      alert('Popup blocked. Please allow popups for this site.');
      return;
    }

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Support A5 Gallery</title>
          <style>
            body { background:#000; color:#fff; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'; margin:0; padding:16px; }
            .card { border:1px solid #fff; border-radius:12px; padding:16px; box-shadow:0 0 20px rgba(255,255,255,0.8); }
            .title { font-size:18px; font-weight:700; margin:0 0 8px 0; }
            .muted { color:rgba(255,255,255,0.7); font-size:13px; margin-bottom:12px; }
            .qr { width:100%; height:auto; border:1px solid #fff; border-radius:8px; box-shadow:0 0 12px rgba(255,255,255,0.8); background:#000; display:block; margin:0 auto 12px auto; }
            .row { display:flex; gap:8px; justify-content:center; }
            .btn { background:#000; color:#fff; border:1px solid #fff; padding:8px 12px; border-radius:8px; cursor:pointer; box-shadow:0 0 12px rgba(255,255,255,0.9); }
            .code { word-break:break-all; border:1px solid #fff; border-radius:8px; padding:8px; font-size:12px; color:rgba(255,255,255,0.75); }
          </style>
        </head>
        <body>
          <div class="card">
            <h1 class="title">Đồ nết 5 cá</h1>
            <div class="muted">Account: Lê Phước Nhật Minh</div>
            <img class="qr" src="/donate.jpg" alt="QR" />
            <div class="code">${data}</div>
            <div class="row" style="margin-top:10px;">
              <button class="btn" onclick="window.print()">Print</button>
              <button class="btn" onclick="navigator.clipboard.writeText('${data.replace(/'/g, "&#39;")}').then(()=>alert('Copied')).catch(()=>{})">Copy text</button>
            </div>
          </div>
        </body>
      </html>
    `;

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  };

  return (
    <button
      onClick={openPopup}
      disabled={loading}
      className="px-4 py-2 rounded border border-white text-white bg-black hover:shadow-[0_0_12px_rgba(255,255,255,0.9)] disabled:opacity-50"
    >
      Remove ads forever – 5000 VND
    </button>
  );
}
