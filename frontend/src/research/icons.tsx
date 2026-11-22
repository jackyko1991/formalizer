/** Small line icons for the research workspace and its project panel (currentColor, 12 px). */
export function DownloadIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      <path d="M8 2v8m0 0L4.8 6.8M8 10l3.2-3.2M2.5 11v2.5h11V11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UploadIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      <path d="M8 10V2m0 0L4.8 5.2M8 2l3.2 3.2M2.5 11v2.5h11V11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EnlargeIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      <path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9 7M2.5 13.5 7 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
