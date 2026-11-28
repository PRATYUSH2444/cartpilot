import React from 'react';

export const LivingBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Ambient subtle glow 1: Emerald top-right */}
      <div
        className="absolute -top-[10%] -right-[5%] w-[45vw] h-[45vw] rounded-full opacity-30 dark:opacity-20 blur-[100px] bg-emerald-500/15"
      />
      {/* Ambient subtle glow 2: Soft slate bottom-left */}
      <div
        className="absolute -bottom-[10%] -left-[5%] w-[50vw] h-[50vw] rounded-full opacity-25 dark:opacity-15 blur-[120px] bg-zinc-500/10"
      />
    </div>
  );
};
