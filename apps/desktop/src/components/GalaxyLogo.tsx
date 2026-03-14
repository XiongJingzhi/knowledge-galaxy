export function GalaxyLogo() {
  return (
    <svg
      className="galaxy-logo"
      viewBox="0 0 160 160"
      role="img"
      aria-label="知识星系标识"
    >
      <defs>
        <linearGradient id="galaxy-core" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <circle cx="80" cy="80" r="10" fill="url(#galaxy-core)" />
      <circle cx="80" cy="80" r="24" fill="none" stroke="rgba(248, 250, 252, 0.22)" strokeWidth="2" />
      <ellipse
        cx="80"
        cy="80"
        rx="56"
        ry="24"
        fill="none"
        stroke="rgba(248, 250, 252, 0.18)"
        strokeWidth="2"
      />
      <ellipse
        cx="80"
        cy="80"
        rx="56"
        ry="24"
        fill="none"
        stroke="rgba(249, 115, 22, 0.34)"
        strokeWidth="2"
        transform="rotate(-32 80 80)"
      />
      <ellipse
        cx="80"
        cy="80"
        rx="56"
        ry="24"
        fill="none"
        stroke="rgba(56, 189, 248, 0.3)"
        strokeWidth="2"
        transform="rotate(34 80 80)"
      />
      <circle cx="130" cy="67" r="6" fill="#fb923c" />
      <circle cx="42" cy="105" r="5" fill="#38bdf8" />
      <circle cx="92" cy="28" r="4" fill="#f8fafc" />
    </svg>
  );
}
