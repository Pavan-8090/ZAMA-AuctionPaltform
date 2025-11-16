/* Display public outcome after SwapExecuted */
"use client";
export default function ResultDisplay({ amountOut, price }: { amountOut: string; price: string }) {
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <strong>Swap Executed</strong>
      <div className="muted">Public amount out: {amountOut}</div>
      <div className="muted">Public price: {price}</div>
    </div>
  );
}

