import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Search,
  Trash2,
  Play,
  Clock,
  ArrowRight,
  BarChart3,
  X,
  Filter,
} from "lucide-react";
import type { HttpMethod } from "./RequestBuilder";
import type { SavedRequest } from "./Collections";

export interface HistoryEntry {
  id: string;
  method: HttpMethod;
  url: string;
  status: number;
  statusText: string;
  responseTime: number;
  timestamp: number;
  headers: SavedRequest["headers"];
  params: SavedRequest["params"];
  bodyContent: string;
  bodyType: string;
  authType: string;
  authToken: string;
}

const HISTORY_KEY = "voltapi-history";
const MAX_HISTORY = 200;

const methodColors: Record<string, string> = {
  GET: "text-emerald-400",
  POST: "text-amber-400",
  PUT: "text-blue-400",
  PATCH: "text-purple-400",
  DELETE: "text-red-400",
  OPTIONS: "text-cyan-400",
  HEAD: "text-gray-400",
};

const statusColor = (status: number) => {
  if (status === 0) return "text-destructive";
  if (status < 300) return "text-emerald-400";
  if (status < 400) return "text-amber-400";
  return "text-destructive";
};

export function saveToHistory(entry: Omit<HistoryEntry, "id">) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    const newEntry: HistoryEntry = {
      ...entry,
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    history.unshift(newEntry);
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

interface RequestHistoryProps {
  onLoadRequest: (req: SavedRequest) => void;
  onLoadToLoadTest: (req: SavedRequest) => void;
}

export function RequestHistory({
  onLoadRequest,
  onLoadToLoadTest,
}: RequestHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const loadHistory = () => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      setHistory(raw ? JSON.parse(raw) : []);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = history.filter((h) => {
    const matchesSearch =
      !search ||
      h.url.toLowerCase().includes(search.toLowerCase()) ||
      h.method.toLowerCase().includes(search.toLowerCase());
    const matchesMethod = methodFilter === "all" || h.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  const removeEntry = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const toSavedRequest = (h: HistoryEntry): SavedRequest => ({
    id: h.id,
    name: `${h.method} ${tryPathname(h.url)}`,
    method: h.method,
    url: h.url,
    headers: h.headers,
    params: h.params,
    bodyContent: h.bodyContent,
    bodyType: h.bodyType,
    authType: h.authType,
    authToken: h.authToken,
    createdAt: h.timestamp,
    updatedAt: h.timestamp,
  });

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString();
  };

  const groupByDate = (entries: HistoryEntry[]) => {
    const groups: Record<string, HistoryEntry[]> = {};
    entries.forEach((e) => {
      const d = new Date(e.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let label: string;
      if (d.toDateString() === today.toDateString()) label = "Today";
      else if (d.toDateString() === yesterday.toDateString())
        label = "Yesterday";
      else
        label = d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });

      if (!groups[label]) groups[label] = [];
      groups[label].push(e);
    });
    return groups;
  };

  const grouped = groupByDate(filtered);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-14 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">
            Request History
          </h1>
          <span className="text-xs text-muted-foreground ml-1">
            ({history.length})
          </span>
        </div>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="px-6 py-3 border-b border-border space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-9 pr-3 py-2 rounded-lg surface-2 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
              showFilters || methodFilter !== "all"
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border surface-2 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["all", "GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethodFilter(m)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      methodFilter === m
                        ? "bg-primary/15 text-primary"
                        : "surface-2 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "all" ? "All" : m}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-16 h-16 rounded-2xl surface-2 flex items-center justify-center">
              <History className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              {history.length === 0
                ? "No requests yet"
                : "No matching requests"}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {Object.entries(grouped).map(([label, entries]) => (
              <div key={label}>
                <div className="text-xs font-medium text-muted-foreground px-2 mb-2">
                  {label}
                </div>
                <div className="space-y-1">
                  {entries.map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl surface-2 border border-transparent hover:border-border transition-all"
                    >
                      <span
                        className={`text-[11px] font-bold font-mono w-14 shrink-0 ${methodColors[entry.method] || "text-muted-foreground"}`}
                      >
                        {entry.method}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-mono truncate">
                          {tryPathname(entry.url)}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {entry.url}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-xs font-bold font-mono ${statusColor(entry.status)}`}
                        >
                          {entry.status || "ERR"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {entry.responseTime}ms
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(entry.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onLoadRequest(toSavedRequest(entry))}
                          className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Load in API Builder"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            onLoadToLoadTest(toSavedRequest(entry))
                          }
                          className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Load in Load Testing"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function tryPathname(url: string) {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}
