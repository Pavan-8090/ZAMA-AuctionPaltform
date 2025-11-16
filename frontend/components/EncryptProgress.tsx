/* Simple progress indicator during TFHE keygen/encryption */
"use client";
export default function EncryptProgress({ text }: { text: string }) {
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <strong>Encrypting...</strong>
      <div className="muted">{text}</div>
    </div>
  );
}

