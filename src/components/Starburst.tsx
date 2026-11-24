import type { CSSProperties, ReactNode } from 'react';

/** 24-point starburst badge used for discounts ("-25%"). */
export function Starburst({ size, fontSize, style, children }: { size: number; fontSize: number; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className="starburst" style={{ width: size, height: size, fontSize, ...style }}>
      <span>{children}</span>
    </div>
  );
}
