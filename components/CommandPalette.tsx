import { useEffect, useState, useMemo } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Zap,
  FolderOpen,
  History,
  BarChart3,
  Settings,
  Users,
  Globe,
  FileCode,
  Play,
  Search,
  ArrowRight,
} from "lucide-react";
import type { SavedRequest, CollectionFolder } from "./Collections";

const METHOD_COLORS: Record<string, string> = {
  GET: "text-emerald-400",
  POST: "text-amber-400",
  PUT: "text-blue-400",
  PATCH: "text-purple-400",
  DELETE: "text-red-400",
};

interface CommandPaletteProps {
  onNavigate: (tab: string) => void;
  onLoadRequest?: (req: SavedRequest) => void;
  onLoadToLoadTest?: (req: SavedRequest) => void;
}

export function CommandPalette({
  onNavigate,
  onLoadRequest,
  onLoadToLoadTest,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const collections: CollectionFolder[] = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("voltapi-collections") || "[]");
    } catch {
      return [];
    }
  }, [open]);

  const allRequests = useMemo(
    () =>
      collections.flatMap((c) =>
        c.requests.map((r) => ({ ...r, folderName: c.name })),
      ),
    [collections],
  );

  const navItems = [
    { id: "api", label: "API Testing", icon: Zap },
    { id: "collections", label: "Collections", icon: FolderOpen },
    { id: "history", label: "History", icon: History },
    { id: "loadtest", label: "Load Testing", icon: BarChart3 },
    { id: "environments", label: "Environments", icon: Globe },
    { id: "mocks", label: "Mock Servers", icon: FileCode },
    { id: "team", label: "Team", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search requests, collections, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {allRequests.length > 0 && (
          <CommandGroup heading="Saved Requests">
            {allRequests.map((req) => (
              <CommandItem
                key={req.id}
                onSelect={() => {
                  onLoadRequest?.(req);
                  setOpen(false);
                }}
                className="flex items-center gap-2"
              >
                <span
                  className={`font-mono text-xs font-bold ${METHOD_COLORS[req.method] || "text-muted-foreground"}`}
                >
                  {req.method}
                </span>
                <span className="flex-1 truncate">{req.name}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {req.folderName}
                </span>
                <Play className="w-3 h-3 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {collections.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Collections">
              {collections.map((c) => (
                <CommandItem
                  key={c.id}
                  onSelect={() => {
                    onNavigate("collections");
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <FolderOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.requests.length} requests
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={() => {
                onNavigate(item.id);
                setOpen(false);
              }}
              className="flex items-center gap-2"
            >
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <span className="flex-1">{item.label}</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => {
              onNavigate("api");
              setOpen(false);
            }}
          >
            <Zap className="w-4 h-4 text-primary mr-2" />
            New Request
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
