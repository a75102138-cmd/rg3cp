"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";

export type MultiSelectItem = { id: string; label: string };

type Props = {
  items: MultiSelectItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  placeholder: string;
  emptyMessage: string;
  /** Résumé quand au moins un élément : ex. (n) => `${n} zone(s)` */
  summary: (count: number) => string;
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
};

export function MultiSelectPopover({
  items,
  selected,
  onToggle,
  placeholder,
  emptyMessage,
  summary,
  invalid,
  disabled,
  id,
}: Props) {
  const count = selected.size;
  const label = count === 0 ? placeholder : summary(count);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-auto min-h-10 w-full justify-between gap-2 px-3 py-2 text-left font-normal sm:min-h-9 sm:py-0",
            invalid && "border-destructive ring-1 ring-destructive/30",
          )}
        >
          <span className="line-clamp-2 text-left text-sm leading-snug">{label}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[var(--radix-popover-trigger-width)] p-0",
          "max-w-[calc(100vw-1.5rem)]",
        )}
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={12}
      >
        <ScrollArea className="max-h-[min(240px,45vh)]">
          <div className="p-1">
            {!items.length ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">{emptyMessage}</p>
            ) : (
              items.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-muted/80"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={selected.has(item.id)}
                    onCheckedChange={() => onToggle(item.id)}
                  />
                  <span className="line-clamp-3 leading-snug">{item.label}</span>
                </label>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
