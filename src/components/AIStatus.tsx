import React, { useEffect, useState } from 'react';

// Small, non-intrusive AI server status indicator
// - Green: reachable
// - Red: unreachable
// - Gray: not configured

const AIStatus: React.FC<{ className?: string } > = ({ className }) => {
  const base = import.meta.env.VITE_AI_SERVER_URL || '';
  const [ok, setOk] = useState<boolean | null>(null); // null = unknown/not configured
  const [checking, setChecking] = useState(false);

  const check = async () => {
    if (!base) { setOk(null); return; }
    setChecking(true);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(`${base}/health`, { signal: ctrl.signal });
      clearTimeout(t);
      setOk(res.ok);
    } catch {
      setOk(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
    const id = setInterval(check, 30000); // refresh every 30s
    return () => clearInterval(id);
  }, [base]);

  const color = !base ? 'bg-gray-400' : ok ? 'bg-green-500' : 'bg-red-500';
  const label = !base ? 'AI: N/A' : ok ? 'AI: OK' : 'AI: Down';
  const title = !base
    ? 'AI server URL not configured (set VITE_AI_SERVER_URL)'
    : ok
      ? 'AI server reachable'
      : 'AI server not reachable';

  return (
    <button
      onClick={check}
      title={title + (checking ? ' (checking...)' : '')}
      className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs border ${className || ''} ` + (
        ok === false ? 'border-red-300 text-red-700 dark:text-red-300' : !base ? 'border-gray-300 text-gray-700 dark:text-gray-300' : 'border-green-300 text-green-700 dark:text-green-300'
      )}
    >
      <span className={`inline-block w-2 h-2 rounded-full ${color}`}></span>
      <span>{label}</span>
    </button>
  );
};

export default AIStatus;
