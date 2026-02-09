export function CalviaLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Calvia App logo"
    >
      <rect width="48" height="48" rx="10.5" fill="#003366" />
      <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="9.75" stroke="#A8D5BA" strokeWidth="0.2" strokeOpacity="0.15" />
      <path
        d="M28 13.5C22.2 13.5 17.5 18.2 17.5 24C17.5 29.8 22.2 34.5 28 34.5C30.6 34.5 32.95 33.55 34.75 32"
        stroke="#A8D5BA"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle cx="32.5" cy="15.5" r="1.7" fill="#A8D5BA" />
      <circle cx="32.5" cy="15.5" r="0.75" fill="#003366" />
    </svg>
  );
}

export function CalviaWordmark() {
  return (
    <span className="text-heading-sm tracking-tight text-ocean-500 font-semibold">
      Calvia
    </span>
  );
}
