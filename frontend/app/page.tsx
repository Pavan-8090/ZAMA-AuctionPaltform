/* Home page: shows connect button and SwapForm */
"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SwapForm from "../components/SwapForm";

export default function Home() {
  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h2>Private Whale-Safe Swapper</h2>
        <ConnectButton />
      </div>
      <p className="muted">
        Privacy-first DEX router that hides trade size using FHE so whales can swap without MEV.
      </p>
      <SwapForm />
    </div>
  );
}

