"use client";
import { TonConnectUIProvider } from "@tonconnect/ui-react";

export default function TonConnectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TonConnectUIProvider manifestUrl="https://raw.githubusercontent.com/ton-connect/demo-dapp-with-react/main/public/tonconnect-manifest.json">
      {children}
    </TonConnectUIProvider>
  );
}
