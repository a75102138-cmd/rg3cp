"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

type Props = {
  imageUrl: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
};

/**
 * Couverture projet : affiche l’URL fournie ou un dégradé placeholder (pas la galerie Photo).
 */
export function ProjectCoverMedia({
  imageUrl,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
}: Props) {
  const src = imageUrl?.trim();

  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={cn("object-cover", className)}
        sizes={sizes}
        unoptimized
      />
    );
  }

  return (
    <div
      className={cn(
        "bg-gradient-to-br from-stone-800 via-stone-700 to-amber-950",
        className,
      )}
      aria-hidden
    />
  );
}
