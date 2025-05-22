"use client";

export function DetailItem({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`p-2 rounded-md bg-muted ${
        onClick ? "cursor-pointer hover:bg-muted/80" : ""
      }`}
      onClick={onClick}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-sm truncate">{value}</div>
      {onClick && (
        <div className="text-xs text-muted-foreground mt-1 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3 mr-1"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
          Click to copy
        </div>
      )}
    </div>
  );
}
