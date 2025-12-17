'use client';

import React, { useEffect, useState } from 'react';
import { ToastProvider } from 'beaver-ui';

export default function ToastClientProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{children}</>;

  return <ToastProvider>{children}</ToastProvider>;
}
