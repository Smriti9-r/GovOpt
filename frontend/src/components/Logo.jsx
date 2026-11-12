
/**
 * GovOpt Logo Component
 *
 * SVG logo: Himalayan mountain silhouette + rising data graph line
 * representing resource planning and optimisation for Uttarakhand.
 *
 * Props:
 *  collapsed  — boolean: show icon-only (no wordmark)
 *  size       — 'sm' | 'md' | 'lg' | 'xl' (controls icon size)
 *  standalone — boolean: for use on login/auth pages (larger layout)
 *  className  — extra classes on the wrapper
 */
export default function Logo({
  collapsed = false,
  size = 'md',
  standalone = false,
  className = '',
}) {
  const iconSizes = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  }
  const iconPx = iconSizes[size] ?? iconSizes.md

  const textScale = {
    sm: { title: 'text-lg',  sub: 'text-[8px]' },
    md: { title: 'text-xl',  sub: 'text-[9px]'  },
    lg: { title: 'text-2xl', sub: 'text-[10px]' },
    xl: { title: 'text-3xl', sub: 'text-xs'     },
  }
  const ts = textScale[size] ?? textScale.md

  return (
    <div className={`flex items-center gap-3 ${className}`}>

      {/* Icon mark */}
      <svg
        width={iconPx}
        height={iconPx}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="GovOpt logo mark"
        className="shrink-0"
      >
        {/* Rounded square background */}
        <rect width="48" height="48" rx="12" fill="#172554" />

        {/* Mountain silhouette — three peaks */}
        <path
          d="M4 40 L14 22 L19 29 L26 14 L33 24 L38 18 L44 40 Z"
          fill="#1e3a8a"
        />

        {/* Snow cap — tallest peak */}
        <path
          d="M26 14 L23 20 L29 20 Z"
          fill="white"
          opacity="0.85"
        />

        {/* Snow cap — right peak */}
        <path
          d="M38 18 L36 23 L40 23 Z"
          fill="white"
          opacity="0.5"
        />

        {/* Rising data graph line crossing the landscape */}
        <polyline
          points="6,37 12,32 18,34 24,26 30,22 36,18 44,13"
          stroke="#DC2626"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Data nodes on the graph line */}
        <circle cx="12" cy="32" r="2.2" fill="#DC2626" />
        <circle cx="24" cy="26" r="2.2" fill="#DC2626" />
        <circle cx="36" cy="18" r="2.2" fill="#DC2626" />

        {/* Terminal node — bright white dot at top-right */}
        <circle cx="44" cy="13" r="2.5" fill="white" />
      </svg>

      {/* Wordmark — hidden when collapsed */}
      {!collapsed && (
        <div className="min-w-0">
          <p className={`font-extrabold leading-none tracking-wide text-white ${ts.title}`}>
            GovOpt
          </p>
          {!standalone && (
            <p className={`mt-0.5 font-semibold uppercase tracking-[2px] text-blue-200/60 ${ts.sub}`}>
              Uttarakhand · Resource Planning
            </p>
          )}
          {standalone && (
            <p className={`mt-1 font-medium leading-tight text-blue-200/70 ${ts.sub} max-w-[180px]`}>
              Smart Resource Planning for Uttarakhand
            </p>
          )}
        </div>
      )}
    </div>
  )
}
