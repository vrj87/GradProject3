export function ProductImage({
  src,
  alt,
  className = ""
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden bg-[var(--color-canvas)] ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full min-h-10 w-full items-center justify-center px-1 text-center text-[10px] text-[var(--color-muted)]">
          No photo
        </div>
      )}
    </div>
  );
}
