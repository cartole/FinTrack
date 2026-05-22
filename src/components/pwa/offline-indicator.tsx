"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-xs font-medium text-white" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.375rem)' }}>
      <WifiOff className="h-3.5 w-3.5" />
      Sin conexión — los cambios se guardarán localmente
    </div>
  );
}
