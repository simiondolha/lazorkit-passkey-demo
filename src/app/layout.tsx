import type { Metadata } from "next";
import "./globals.css";
import { LazorkitProviderWrapper } from "@/components/providers";

export const metadata: Metadata = {
  title: "LazorKit | Passkey Wallet Demo",
  description: "Passwordless Solana wallet with biometric authentication and gasless transactions.",
  keywords: ["Solana", "Passkey", "WebAuthn", "Gasless", "Smart Wallet", "LazorKit"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LazorkitProviderWrapper>{children}</LazorkitProviderWrapper>
      </body>
    </html>
  );
}
