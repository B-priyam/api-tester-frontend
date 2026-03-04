import { useState, useEffect } from "react";
import {
  FileCode,
  Plus,
  Trash2,
  Play,
  Square,
  Copy,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface MockRoute {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  responseBody: string;
  contentType: string;
  delay: number;
}

interface MockServer {
  id: string;
  name: string;
  port: number;
  active: boolean;
  routes: MockRoute[];
  createdAt: number;
}

const STORAGE_KEY = "voltapi-mock-servers";
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const methodColors: Record<string, string> = {
  GET: "text-[hsl(var(--method-get))]",
  POST: "text-[hsl(var(--method-post))]",
  PUT: "text-[hsl(var(--method-put))]",
  PATCH: "text-[hsl(var(--method-patch))]",
  DELETE: "text-[hsl(var(--method-delete))]",
};

function newRoute(): MockRoute {
  return {
    id: crypto.randomUUID(),
    method: "GET",
    path: "/api/example",
    statusCode: 200,
    responseBody: JSON.stringify({ message: "Hello from mock!" }, null, 2),
    contentType: "application/json",
    delay: 0,
  };
}

function newServer(): MockServer {
  return {
    id: crypto.randomUUID(),
    name: "My Mock Server",
    port: 3001,
    active: false,
    routes: [newRoute()],
    createdAt: Date.now(),
  };
}

export function MockServers() {
  const [servers, setServers] = useState<MockServer[]>([]);
  const [expandedServer, setExpandedServer] = useState<string | null>(null);
  const [editingRoute, setEditingRoute] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setServers(JSON.parse(saved));
    } catch {}
  }, []);

  const persist = (updated: MockServer[]) => {
    setServers(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addServer = () => {
    const s = newServer();
    persist([s, ...servers]);
    setExpandedServer(s.id);
    toast.success("Mock server created");
  };

  const deleteServer = (id: string) => {
    persist(servers.filter((s) => s.id !== id));
    if (expandedServer === id) setExpandedServer(null);
    toast.success("Server deleted");
  };

  const toggleActive = (id: string) => {
    persist(
      servers.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
    );
  };

  const updateServer = (id: string, updates: Partial<MockServer>) => {
    persist(servers.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const addRoute = (serverId: string) => {
    const route = newRoute();
    persist(
      servers.map((s) =>
        s.id === serverId ? { ...s, routes: [...s.routes, route] } : s,
      ),
    );
    setEditingRoute(route.id);
  };

  const updateRoute = (
    serverId: string,
    routeId: string,
    updates: Partial<MockRoute>,
  ) => {
    persist(
      servers.map((s) =>
        s.id === serverId
          ? {
              ...s,
              routes: s.routes.map((r) =>
                r.id === routeId ? { ...r, ...updates } : r,
              ),
            }
          : s,
      ),
    );
  };

  const deleteRoute = (serverId: string, routeId: string) => {
    persist(
      servers.map((s) =>
        s.id === serverId
          ? { ...s, routes: s.routes.filter((r) => r.id !== routeId) }
          : s,
      ),
    );
  };

  const duplicateRoute = (serverId: string, route: MockRoute) => {
    const dup = {
      ...route,
      id: crypto.randomUUID(),
      path: route.path + "-copy",
    };
    persist(
      servers.map((s) =>
        s.id === serverId ? { ...s, routes: [...s.routes, dup] } : s,
      ),
    );
    toast.success("Route duplicated");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-14 border-b border-border">
        <div className="flex items-center gap-2.5">
          <FileCode className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-foreground">Mock Servers</h1>
          <Badge variant="secondary" className="text-xs">
            {servers.length}
          </Badge>
        </div>
        <Button onClick={addServer} size="sm" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Server
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {servers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-20 h-20 rounded-2xl surface-2 flex items-center justify-center">
              <FileCode className="w-9 h-9 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">
                No Mock Servers
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Create one to define mock API endpoints
              </p>
            </div>
            <Button onClick={addServer} className="gap-2">
              <Plus className="w-4 h-4" /> Create Mock Server
            </Button>
          </div>
        ) : (
          servers.map((server) => {
            const isExpanded = expandedServer === server.id;
            return (
              <div
                key={server.id}
                className="rounded-xl border border-border surface-1 overflow-hidden"
              >
                {/* Server Header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() =>
                      setExpandedServer(isExpanded ? null : server.id)
                    }
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <Globe className="w-4 h-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <Input
                      value={server.name}
                      onChange={(e) =>
                        updateServer(server.id, { name: e.target.value })
                      }
                      className="h-7 text-sm font-medium bg-transparent border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <Badge
                    variant={server.active ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {server.active ? "Running" : "Stopped"}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleActive(server.id)}
                    >
                      {server.active ? (
                        <Square className="w-3.5 h-3.5 text-destructive" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-[hsl(var(--success))]" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => deleteServer(server.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Routes */}
                {isExpanded && (
                  <div className="border-t border-border">
                    <div className="px-4 py-2 flex items-center justify-between surface-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Routes ({server.routes.length})
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs gap-1"
                        onClick={() => addRoute(server.id)}
                      >
                        <Plus className="w-3 h-3" /> Add Route
                      </Button>
                    </div>

                    <div className="divide-y divide-border">
                      {server.routes.map((route) => {
                        const isEditing = editingRoute === route.id;
                        return (
                          <div key={route.id} className="px-4 py-3 space-y-3">
                            {/* Route summary row */}
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-xs font-bold ${methodColors[route.method] || "text-foreground"} w-14`}
                              >
                                {route.method}
                              </span>
                              {isEditing ? (
                                <Input
                                  value={route.path}
                                  onChange={(e) =>
                                    updateRoute(server.id, route.id, {
                                      path: e.target.value,
                                    })
                                  }
                                  className="h-7 text-sm flex-1 font-mono"
                                />
                              ) : (
                                <span className="text-sm font-mono text-foreground flex-1 truncate">
                                  {route.path}
                                </span>
                              )}
                              <Badge
                                variant="outline"
                                className="text-xs font-mono"
                              >
                                {route.statusCode}
                              </Badge>
                              {route.delay > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {route.delay}ms
                                </span>
                              )}
                              <div className="flex items-center gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    setEditingRoute(isEditing ? null : route.id)
                                  }
                                >
                                  {isEditing ? (
                                    <Check className="w-3 h-3 text-[hsl(var(--success))]" />
                                  ) : (
                                    <Edit2 className="w-3 h-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    duplicateRoute(server.id, route)
                                  }
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    deleteRoute(server.id, route.id)
                                  }
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            </div>

                            {/* Editing details */}
                            {isEditing && (
                              <div className="grid grid-cols-2 gap-3 pl-14">
                                <div>
                                  <Label className="text-xs text-muted-foreground">
                                    Method
                                  </Label>
                                  <Select
                                    value={route.method}
                                    onValueChange={(v) =>
                                      updateRoute(server.id, route.id, {
                                        method: v,
                                      })
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-sm mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {METHODS.map((m) => (
                                        <SelectItem key={m} value={m}>
                                          {m}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">
                                    Status Code
                                  </Label>
                                  <Input
                                    type="number"
                                    value={route.statusCode}
                                    onChange={(e) =>
                                      updateRoute(server.id, route.id, {
                                        statusCode: Number(e.target.value),
                                      })
                                    }
                                    className="h-8 text-sm mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">
                                    Content Type
                                  </Label>
                                  <Select
                                    value={route.contentType}
                                    onValueChange={(v) =>
                                      updateRoute(server.id, route.id, {
                                        contentType: v,
                                      })
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-sm mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="application/json">
                                        application/json
                                      </SelectItem>
                                      <SelectItem value="text/plain">
                                        text/plain
                                      </SelectItem>
                                      <SelectItem value="text/html">
                                        text/html
                                      </SelectItem>
                                      <SelectItem value="application/xml">
                                        application/xml
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">
                                    Delay (ms)
                                  </Label>
                                  <Input
                                    type="number"
                                    value={route.delay}
                                    onChange={(e) =>
                                      updateRoute(server.id, route.id, {
                                        delay: Number(e.target.value),
                                      })
                                    }
                                    className="h-8 text-sm mt-1"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Label className="text-xs text-muted-foreground">
                                    Response Body
                                  </Label>
                                  <textarea
                                    value={route.responseBody}
                                    onChange={(e) =>
                                      updateRoute(server.id, route.id, {
                                        responseBody: e.target.value,
                                      })
                                    }
                                    className="mt-1 w-full h-32 rounded-lg border border-border surface-2 p-3 text-sm font-mono text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {server.routes.length === 0 && (
                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                          No routes defined. Add one to start mocking.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
