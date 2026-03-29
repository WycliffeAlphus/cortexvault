"use client";

import { useState, useEffect, useCallback } from "react";
import { getStoredWallet, setStoredWallet } from "@/lib/store";

export interface WalletState {
  wallet: string | null;
  connecting: boolean;
  error: string | null;
  connect: (fallbackInput?: string) => Promise<string | null>;
  disconnect: () => void;
}

export function useWallet(): WalletState {
  const [wallet, setWallet] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredWallet();
    if (stored) setWallet(stored);
  }, []);

  const connect = useCallback(async (fallbackInput?: string): Promise<string | null> => {
    setConnecting(true);
    setError(null);
    try {
      const eth = (typeof window !== "undefined" && (window as Window & { ethereum?: { request: (a: unknown) => Promise<string[]> } }).ethereum);
      if (eth) {
        const accounts = await eth.request({ method: "eth_requestAccounts" });
        const addr = accounts[0];
        setStoredWallet(addr);
        setWallet(addr);
        return addr;
      }
      // MetaMask not installed — use typed address or random demo address
      const addr = fallbackInput?.trim() || `0xDemo${Math.random().toString(16).slice(2, 10)}`;
      setStoredWallet(addr);
      setWallet(addr);
      return addr;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(msg);
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (typeof window !== "undefined") localStorage.removeItem("nv:wallet");
    setWallet(null);
  }, []);

  return { wallet, connecting, error, connect, disconnect };
}
