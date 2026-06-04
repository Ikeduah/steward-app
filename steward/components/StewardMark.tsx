export function StewardMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M45 19 C45 13 39 10 31 10 C20 10 14 16 14 23 C14 30 20 33 30 35 C40 37 45 40 45 45 C45 52 39 55 30 55"
        stroke="currentColor"
        strokeWidth="8.5"
        strokeLinecap="round"
      />
      <circle cx="45" cy="19" r="5" fill="currentColor" />
      <circle cx="30" cy="55" r="5" fill="currentColor" />
    </svg>
  );
}
