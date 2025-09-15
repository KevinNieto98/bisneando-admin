// app/auth/reset/ui/auto-exchange.tsx
"use client";

import { exchangeRecoveryCode } from "@/app/auth/actions";
import { useEffect, useRef } from "react";

export function AutoExchange({ code }: { code: string }) {
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // auto-submit en cuanto renderiza
    ref.current?.requestSubmit();
  }, []);

  return (
    <form ref={ref} action={exchangeRecoveryCode} className="min-h-screen flex items-center justify-center">
      <input type="hidden" name="code" value={code} />
      <div className="rounded-xl bg-white p-6 shadow">
        Verificando enlace de recuperación…
      </div>
    </form>
  );
}
