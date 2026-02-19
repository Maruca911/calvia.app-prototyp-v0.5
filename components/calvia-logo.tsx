export function CalviaLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Calvia.app logo"
    >
      <defs>
        <clipPath id="logo-circle">
          <circle cx="256" cy="256" r="256" />
        </clipPath>
        <linearGradient id="sun-grad" x1="70" y1="30" x2="470" y2="260" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF7402" />
          <stop offset="1" stopColor="#FFB74A" />
        </linearGradient>
        <linearGradient id="sea-grad" x1="40" y1="260" x2="470" y2="500" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#003EA0" />
          <stop offset="1" stopColor="#1D84E8" />
        </linearGradient>
      </defs>

      <g clipPath="url(#logo-circle)">
        <rect width="512" height="260" y="0" fill="url(#sun-grad)" />
        <rect width="512" height="280" y="232" fill="url(#sea-grad)" />
        <path
          d="M0 258C90 205 180 200 270 226C356 250 430 246 512 208V276C430 314 356 318 270 294C180 268 90 273 0 326V258Z"
          fill="#F4EEE8"
        />
        <path
          d="M0 308C98 258 190 255 280 279C365 301 439 296 512 265V332C439 362 365 367 280 344C190 320 98 323 0 372V308Z"
          fill="#0A4CB2"
          opacity="0.65"
        />
      </g>
    </svg>
  );
}

export function CalviaWordmark() {
  return (
    <span className="text-heading-sm tracking-tight text-ocean-500 font-semibold">
      CALVIA.APP
    </span>
  );
}
