import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  Save,
  FolderOpen,
  ChevronDown,
  Plus,
  X,
} from "lucide-react";
import { substituteEnvVars } from "@/lib/envSubstitution";
import { MethodSelector } from "./MethodSelector";
import { RequestTabs } from "./RequestTabs";
import { ResponseViewer } from "./ResponseViewer";
import type { SavedRequest, CollectionFolder } from "./Collections";
import { saveToHistory } from "./RequestHistory";

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
  id: string;
}

export interface FormDataEntry {
  key: string;
  value: string;
  type: "text" | "file";
  files?: File[];
  enabled: boolean;
  id: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

const STORAGE_KEY = "voltapi-collections";

interface RequestBuilderProps {
  initialRequest?: SavedRequest | null;
  onRequestLoaded?: () => void;
}

function SaveToCollectionButton({
  method,
  url,
  headers,
  params,
  bodyContent,
  bodyType,
  authType,
  authToken,
}: {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  bodyContent: string;
  bodyType: string;
  authType: string;
  authToken: string;
}) {
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<CollectionFolder[]>([]);
  const [requestName, setRequestName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadFolders = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setFolders(raw ? JSON.parse(raw) : []);
    } catch {
      setFolders([]);
    }
  };

  const handleOpen = () => {
    loadFolders();
    setRequestName(url ? `${method} ${new URL(url).pathname}` : "New Request");
    setSelectedFolder(null);
    setShowNewFolder(false);
    setSaved(false);
    setOpen(true);
  };

  const handleSave = () => {
    if (!selectedFolder || !requestName.trim()) return;
    const req: SavedRequest = {
      id: `req-${Date.now()}`,
      name: requestName,
      method,
      url,
      headers,
      params,
      bodyContent,
      bodyType,
      authType,
      authToken,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = folders.map((f) =>
      f.id === selectedFolder ? { ...f, requests: [...f.requests, req] } : f,
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setOpen(false), 600);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const folder: CollectionFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      requests: [],
      isOpen: true,
      createdAt: Date.now(),
    };
    const updated = [folder, ...folders];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setFolders(updated);
    setSelectedFolder(folder.id);
    setShowNewFolder(false);
    setNewFolderName("");
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg surface-2 border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
        title="Save to collection"
      >
        <Save className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 z-50 w-80 glass rounded-xl border border-border shadow-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Save Request
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                value={requestName}
                onChange={(e) => setRequestName(e.target.value)}
                placeholder="Request name..."
                className="w-full px-3 py-2 rounded-lg surface-2 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Select collection
                  </span>
                  <button
                    onClick={() => setShowNewFolder(!showNewFolder)}
                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> New
                  </button>
                </div>

                {showNewFolder && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateFolder();
                    }}
                    className="flex gap-1.5"
                  >
                    <input
                      autoFocus
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Collection name..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg surface-2 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="text-xs text-primary font-medium px-2"
                    >
                      Add
                    </button>
                  </form>
                )}

                <div className="max-h-36 overflow-y-auto scrollbar-thin space-y-1">
                  {folders.length === 0 && !showNewFolder && (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      No collections yet
                    </p>
                  )}
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFolder(f.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        selectedFolder === f.id
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "surface-2 text-foreground hover:bg-primary/5 border border-transparent"
                      }`}
                    >
                      <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{f.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {f.requests.length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={!selectedFolder || !requestName.trim() || saved}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                  saved
                    ? "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                {saved ? "✓ Saved!" : "Save"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RequestBuilder({
  initialRequest,
  onRequestLoaded,
}: RequestBuilderProps) {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);

  const [headers, setHeaders] = useState<KeyValuePair[]>([
    { key: "Content-Type", value: "application/json", enabled: true, id: "1" },
    { key: "", value: "", enabled: true, id: "2" },
  ]);
  const [params, setParams] = useState<KeyValuePair[]>([
    { key: "", value: "", enabled: true, id: "1" },
  ]);
  const [bodyContent, setBodyContent] = useState("{\n  \n}");
  const [bodyType, setBodyType] = useState<string>("json");
  const [authType, setAuthType] = useState<string>("none");
  const [authToken, setAuthToken] = useState("");
  const [formDataEntries, setFormDataEntries] = useState<FormDataEntry[]>([
    { key: "", value: "", type: "text", enabled: true, id: "fd1" },
  ]);

  useEffect(() => {
    if (initialRequest) {
      setMethod(initialRequest.method);
      setUrl(initialRequest.url);
      setHeaders(initialRequest.headers);
      setParams(initialRequest.params);
      setBodyContent(initialRequest.bodyContent);
      setBodyType(initialRequest.bodyType);
      setAuthType(initialRequest.authType);
      setAuthToken(initialRequest.authToken);
      setResponse(null);
      onRequestLoaded?.();
    }
  }, [initialRequest, onRequestLoaded]);

  const handleSend = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    const startTime = performance.now();

    try {
      const activeHeaders: Record<string, string> = {};
      headers
        .filter((h) => h.enabled && h.key)
        .forEach((h) => {
          activeHeaders[substituteEnvVars(h.key)] = substituteEnvVars(h.value);
        });

      const resolvedAuthToken = substituteEnvVars(authToken);
      if (authType === "bearer" && resolvedAuthToken) {
        activeHeaders["Authorization"] = `Bearer ${resolvedAuthToken}`;
      } else if (authType === "apikey" && resolvedAuthToken) {
        activeHeaders["X-API-Key"] = resolvedAuthToken;
      }

      let queryString = "";
      const activeParams = params.filter((p) => p.enabled && p.key);
      if (activeParams.length > 0) {
        queryString =
          "?" +
          activeParams
            .map(
              (p) =>
                `${encodeURIComponent(substituteEnvVars(p.key))}=${encodeURIComponent(substituteEnvVars(p.value))}`,
            )
            .join("&");
      }

      const fetchOptions: RequestInit = {
        method,
        headers: activeHeaders,
      };

      const resolvedUrl = substituteEnvVars(url);

      if (method !== "GET" && method !== "HEAD") {
        if (bodyType === "formdata") {
          const fd = new FormData();
          formDataEntries
            .filter((e) => e.enabled && e.key)
            .forEach((entry) => {
              if (entry.type === "file" && entry.files) {
                entry.files.forEach((file) =>
                  fd.append(substituteEnvVars(entry.key), file),
                );
              } else {
                fd.append(
                  substituteEnvVars(entry.key),
                  substituteEnvVars(entry.value),
                );
              }
            });
          fetchOptions.body = fd;
          delete activeHeaders["Content-Type"];
          fetchOptions.headers = activeHeaders;
        } else if (bodyType === "json" || bodyType === "raw") {
          fetchOptions.body = substituteEnvVars(bodyContent);
        }
      }

      const res = await fetch(resolvedUrl + queryString, fetchOptions);
      const endTime = performance.now();
      const text = await res.text();

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const apiResponse = {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: text,
        time: Math.round(endTime - startTime),
        size: new Blob([text]).size,
      };
      setResponse(apiResponse);

      saveToHistory({
        method,
        url,
        status: res.status,
        statusText: res.statusText,
        responseTime: apiResponse.time,
        timestamp: Date.now(),
        headers,
        params,
        bodyContent,
        bodyType,
        authType,
        authToken,
      });
    } catch (err: any) {
      const endTime = performance.now();
      const errResponse = {
        status: 0,
        statusText: "Network Error",
        headers: {},
        body: err.message || "Failed to connect",
        time: Math.round(endTime - startTime),
        size: 0,
      };
      setResponse(errResponse);

      saveToHistory({
        method,
        url,
        status: 0,
        statusText: "Network Error",
        responseTime: errResponse.time,
        timestamp: Date.now(),
        headers,
        params,
        bodyContent,
        bodyType,
        authType,
        authToken,
      });
    } finally {
      setLoading(false);
    }
  }, [
    url,
    method,
    headers,
    params,
    bodyContent,
    bodyType,
    authType,
    authToken,
    formDataEntries,
  ]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* URL Bar */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-2 p-4 border-b border-border"
      >
        <MethodSelector method={method} onChange={setMethod} />
        <div className="flex-1 relative">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Enter request URL..."
            className="w-full px-4 py-2.5 rounded-lg surface-2 border border-border text-foreground placeholder:text-muted-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={loading || !url.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all glow-primary"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send
        </button>
        <SaveToCollectionButton
          method={method}
          url={url}
          headers={headers}
          params={params}
          bodyContent={bodyContent}
          bodyType={bodyType}
          authType={authType}
          authToken={authToken}
        />
      </motion.div>

      {/* Split View */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Request Config */}
        <div className="flex-1 overflow-y-auto scrollbar-thin border-b lg:border-b-0 lg:border-r border-border">
          <RequestTabs
            headers={headers}
            setHeaders={setHeaders}
            params={params}
            setParams={setParams}
            bodyContent={bodyContent}
            setBodyContent={setBodyContent}
            bodyType={bodyType}
            setBodyType={setBodyType}
            authType={authType}
            setAuthType={setAuthType}
            authToken={authToken}
            setAuthToken={setAuthToken}
            method={method}
            formDataEntries={formDataEntries}
            setFormDataEntries={setFormDataEntries}
          />
        </div>

        {/* Response */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <ResponseViewer response={response} loading={loading} />
        </div>
      </div>
    </div>
  );
}
