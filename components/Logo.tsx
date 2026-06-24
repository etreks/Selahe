export function Logo({ size = 24 }: { size?: number }) {
  // The burst/asterisk mark from the Selahe header.
  const lines = Array.from({ length: 12 });
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Selahe"
    >
      {lines.map((_, i) => {
        const angle = (i * 360) / lines.length;
        return (
          <line
            key={i}
            x1="12"
            y1="12"
            x2="12"
            y2="2.5"
            stroke="#1a1a1a"
            strokeWidth="1.6"
            strokeLinecap="round"
            transform={`rotate(${angle} 12 12)`}
          />
        );
      })}
    </svg>
  );
}
