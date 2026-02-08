export function CalviaLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="12" fill="#003366" />
      <path
        d="M28.5 14C22.15 14 17 19.15 17 25.5C17 31.85 22.15 37 28.5 37C31.2 37 33.65 36.05 35.55 34.45"
        stroke="#A8D5BA"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="33" cy="17" r="2" fill="#A8D5BA" />
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
