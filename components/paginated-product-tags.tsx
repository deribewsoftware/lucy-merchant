"use client";

import { Tag } from "lucide-react";
import { PaginatedClientList } from "@/components/paginated-client-list";

export function PaginatedProductTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;

  return (
    <PaginatedClientList
      items={tags}
      pageSize={24}
      resetKey={tags.join("\0")}
      summaryClassName="mb-2 text-xs text-muted-foreground"
      summarySuffix="tags"
      barClassName="mt-3"
    >
      {(pageTags) => (
        <div className="flex flex-wrap gap-2">
          {pageTags.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground sm:text-sm"
            >
              <Tag className="h-3 w-3 shrink-0 opacity-70" />
              {t}
            </span>
          ))}
        </div>
      )}
    </PaginatedClientList>
  );
}
