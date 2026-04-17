import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "sm" | "md";
  priority?: boolean;
};

const heightClass = { sm: "h-8", md: "h-9" } as const;

export function BrandLogo({ className, size = "md", priority }: Props) {
  return (
    <Image
      src="/branding/g3c.jpg"
      alt="G3C"
      width={200}
      height={64}
      priority={priority}
      className={cn(
        heightClass[size],
        "w-auto max-w-[7rem] shrink-0 object-contain object-left",
        className,
      )}
    />
  );
}
