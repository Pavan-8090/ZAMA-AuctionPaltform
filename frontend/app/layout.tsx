/* App layout: provides RainbowKit/Wagmi providers */
import "./globals.css";
import { WagmiProvider, createConfig, http } from "wagmi";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { mainnet, localhost } from "viem/chains";
import { ReactNode } from "react";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337);
const selectedChain = chainId === 1 ? mainnet : localhost;

const config = getDefaultConfig({
  appName: "Private Whale-Safe Swapper",
  projectId: "pws-local",
  chains: [selectedChain],
  transports: {
    [selectedChain.id]: http()
  },
  ssr: true
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config}>
          <RainbowKitProvider>
            {children}
          </RainbowKitProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}

