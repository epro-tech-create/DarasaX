export function InstitutionIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 180" className={className} aria-hidden fill="none">
      <rect x="20" y="120" width="240" height="12" rx="6" fill="#E3F2FD" />
      <path d="M70 120 V58 H210 V120" stroke="#1E88E5" strokeWidth="4" />
      <rect x="88" y="74" width="28" height="22" rx="4" fill="#4FC3F7" opacity="0.7" />
      <rect x="126" y="74" width="28" height="22" rx="4" fill="#4FC3F7" opacity="0.7" />
      <rect x="164" y="74" width="28" height="22" rx="4" fill="#4FC3F7" opacity="0.7" />
      <rect x="118" y="98" width="44" height="22" rx="4" fill="#1565C0" />
      <path d="M70 58 L140 28 L210 58" stroke="#1565C0" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="48" cy="108" r="18" fill="#BBDEFB" />
      <circle cx="48" cy="92" r="10" fill="#90CAF9" />
      <rect x="36" y="112" width="24" height="28" rx="8" fill="#1E88E5" />
      <circle cx="232" cy="108" r="18" fill="#E1F5FE" />
      <circle cx="232" cy="92" r="10" fill="#4FC3F7" />
      <rect x="220" y="112" width="24" height="28" rx="8" fill="#1565C0" />
    </svg>
  );
}

export function YearIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 180" className={className} aria-hidden fill="none">
      <rect x="70" y="40" width="140" height="110" rx="16" fill="#E3F2FD" />
      <rect x="88" y="58" width="104" height="12" rx="6" fill="#1E88E5" />
      <rect x="88" y="82" width="72" height="10" rx="5" fill="#90CAF9" />
      <rect x="88" y="102" width="88" height="10" rx="5" fill="#90CAF9" />
      <rect x="88" y="122" width="56" height="10" rx="5" fill="#4FC3F7" />
      <circle cx="210" cy="52" r="28" fill="#1565C0" />
      <path
        d="M200 52h20M210 42v20"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M46 128c18-28 42-28 60 0"
        stroke="#4FC3F7"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="52" cy="96" r="14" fill="#BBDEFB" />
      <rect x="40" y="110" width="24" height="30" rx="10" fill="#1E88E5" />
    </svg>
  );
}

export function SemesterIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 180" className={className} aria-hidden fill="none">
      <rect x="78" y="36" width="124" height="108" rx="14" fill="#E3F2FD" />
      <rect x="94" y="52" width="92" height="14" rx="7" fill="#1E88E5" />
      <g fill="#90CAF9">
        <circle cx="108" cy="88" r="6" />
        <circle cx="132" cy="88" r="6" />
        <circle cx="156" cy="88" r="6" />
        <circle cx="180" cy="88" r="6" />
        <circle cx="108" cy="112" r="6" />
        <circle cx="132" cy="112" r="6" />
        <circle cx="156" cy="112" r="6" />
        <circle cx="180" cy="112" r="6" fill="#4FC3F7" />
      </g>
      <rect x="40" y="70" width="28" height="70" rx="10" fill="#1565C0" />
      <circle cx="54" cy="58" r="12" fill="#BBDEFB" />
      <rect x="212" y="70" width="28" height="70" rx="10" fill="#1E88E5" />
      <circle cx="226" cy="58" r="12" fill="#4FC3F7" />
    </svg>
  );
}
