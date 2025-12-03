import React from "react";

export function EmeraldBackground({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full relative">
      {/* Emerald Void */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 10%, #000000 40%, #072607 100%)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
