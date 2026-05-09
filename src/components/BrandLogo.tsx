import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  sizeClassName?: string;
  className?: string;
  fallbackClassName?: string;
};

export function BrandLogo({
  sizeClassName = "h-10 w-10",
  className,
  fallbackClassName,
}: BrandLogoProps) {
  const [loadFailed, setLoadFailed] = useState(false);

  if (loadFailed) {
    return (
      <div className={cn(sizeClassName, "rounded-xl border border-dashed border-border bg-muted flex items-center justify-center", fallbackClassName)}>
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="Dayawan logo"
      onError={() => setLoadFailed(true)}
      className={cn(sizeClassName, "rounded-xl object-cover border border-border bg-background", className)}
    />
  );
}
