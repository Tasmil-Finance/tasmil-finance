interface ComingSoonOverlayProps {
  title?: string;
  description?: string;
  className?: string;
}

export function ComingSoonOverlay({
  title = "Coming Soon",
  description = "This feature is under development",
  className = "",
}: ComingSoonOverlayProps) {
  return (
    <div
      className={`absolute inset-0 backdrop-blur-lg flex items-center justify-center z-50 ${className}`}
    >
      <div className="text-center px-8 py-6">
        <h2 className="text-4xl md:text-6xl font-bold mb-4">{title}</h2>
        <p className="text-lg md:text-xl">{description}</p>
      </div>
    </div>
  );
}
