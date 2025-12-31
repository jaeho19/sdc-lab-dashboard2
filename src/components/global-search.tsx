"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, User, FileText, MessageSquare } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { globalSearch, type SearchResult } from "@/lib/actions/search";

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Keyboard shortcut (Cmd/Ctrl + K)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search with debounce
  React.useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchResults = await globalSearch(query);
        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(href);
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "member":
        return <User className="h-4 w-4" />;
      case "project":
        return <FileText className="h-4 w-4" />;
      case "mentoring":
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getGroupTitle = (type: SearchResult["type"]) => {
    switch (type) {
      case "member":
        return "연구원";
      case "project":
        return "연구 프로젝트";
      case "mentoring":
        return "멘토링";
    }
  };

  // Group results by type
  const groupedResults = React.useMemo(() => {
    const groups: Record<SearchResult["type"], SearchResult[]> = {
      member: [],
      project: [],
      mentoring: [],
    };

    for (const result of results) {
      groups[result.type].push(result);
    }

    return groups;
  }, [results]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
      >
        <Search className="h-5 w-5" />
        <span className="sr-only">검색</span>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="연구원, 프로젝트, 멘토링 검색..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              검색 중...
            </div>
          )}

          {!isLoading && query.length >= 2 && results.length === 0 && (
            <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
          )}

          {!isLoading && query.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              2글자 이상 입력하세요
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <>
              {(["member", "project", "mentoring"] as const).map((type) => {
                const items = groupedResults[type];
                if (items.length === 0) return null;

                return (
                  <CommandGroup key={type} heading={getGroupTitle(type)}>
                    {items.map((result) => (
                      <CommandItem
                        key={`${result.type}-${result.id}`}
                        value={`${result.title} ${result.subtitle || ""}`}
                        onSelect={() => handleSelect(result.href)}
                      >
                        {getIcon(result.type)}
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          {result.subtitle && (
                            <span className="text-xs text-muted-foreground">
                              {result.subtitle}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </>
          )}
        </CommandList>
        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
          <span className="ml-2">로 검색창 열기</span>
        </div>
      </CommandDialog>
    </>
  );
}
