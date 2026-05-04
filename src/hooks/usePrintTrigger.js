import { useEffect } from 'react';

export const PRINT_DELAY_MS = 50;

export default function usePrintTrigger(printState, setPrintState, resetValue) {
  useEffect(() => {
    if (!printState) return;
    const t = setTimeout(() => {
      window.print();
      setPrintState(resetValue);
    }, PRINT_DELAY_MS);
    return () => clearTimeout(t);
  }, [printState, setPrintState, resetValue]);
}
