import React from 'react';

export const LivingBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Blob 1: Top Left Subtle Sapphire Glow */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[65vw] h-[65vw] rounded-full opacity-70 animate-blob-drift-1"
        style={{ background: 'var(--m1)', filter: 'blur(60px)' }}
      />
      {/* Blob 2: Top Right Emerald Aurora */}
      <div
        className="absolute top-[5%] -right-[15%] w-[60vw] h-[60vw] rounded-full opacity-65 animate-blob-drift-2"
        style={{ background: 'var(--m2)', filter: 'blur(70px)' }}
      />
      {/* Blob 3: Bottom Centered Warm Amber Pulse */}
      <div
        className="absolute -bottom-[20%] left-[20%] w-[70vw] h-[60vw] rounded-full opacity-60 animate-blob-drift-3"
        style={{ background: 'var(--m3)', filter: 'blur(80px)' }}
      />
      {/* Subtle fine grid texture overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
    </div>
  );
};
