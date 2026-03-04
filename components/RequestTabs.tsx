import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Lock,
  Key,
  FileJson,
  Code,
  FileText,
  Upload,
  X,
  File as FileIcon,
} from "lucide-react";
import type { KeyValuePair, HttpMethod, FormDataEntry } from "./RequestBuilder";

interface RequestTabsProps {
  headers: KeyValuePair[];
  setHeaders: (h: KeyValuePair[]) => void;
  params: KeyValuePair[];
  setParams: (p: KeyValuePair[]) => void;
  bodyContent: string;
  setBodyContent: (b: string) => void;
  bodyType: string;
  setBodyType: (t: string) => void;
  authType: string;
  setAuthType: (t: string) => void;
  authToken: string;
  setAuthToken: (t: string) => void;
  method: HttpMethod;
  formDataEntries: FormDataEntry[] | any;
  setFormDataEntries: (entries: FormDataEntry[] | any) => void;
}

type TabId = "params" | "headers" | "body" | "auth";

const tabs: { id: TabId; label: string }[] = [
  { id: "params", label: "Params" },
  { id: "headers", label: "Headers" },
  { id: "body", label: "Body" },
  { id: "auth", label: "Auth" },
];

function KeyValueEditor({
  pairs,
  onChange,
}: {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
}) {
  const updatePair = (
    id: string,
    field: "key" | "value" | "enabled",
    val: string | boolean,
  ) => {
    onChange(pairs.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  };
  const addPair = () => {
    onChange([
      ...pairs,
      { key: "", value: "", enabled: true, id: Date.now().toString() },
    ]);
  };
  const removePair = (id: string) => {
    if (pairs.length <= 1) return;
    onChange(pairs.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-1.5">
      {pairs.map((pair, i) => (
        <motion.div
          key={pair.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          className="flex items-center gap-2"
        >
          <input
            type="checkbox"
            checked={pair.enabled}
            onChange={(e) => updatePair(pair.id, "enabled", e.target.checked)}
            className="w-3.5 h-3.5 rounded border-border accent-primary"
          />
          <input
            placeholder="Key"
            value={pair.key}
            onChange={(e) => updatePair(pair.id, "key", e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-md surface-2 border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <input
            placeholder="Value"
            value={pair.value}
            onChange={(e) => updatePair(pair.id, "value", e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-md surface-2 border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <button
            onClick={() => removePair(pair.id)}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      ))}
      <button
        onClick={addPair}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
      >
        <Plus className="w-3 h-3" />
        Add Row
      </button>
    </div>
  );
}

function FormDataEditor({
  entries,
  onChange,
}: {
  entries: FormDataEntry[];
  onChange: (entries: FormDataEntry[]) => void;
}) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [globalDragOver, setGlobalDragOver] = useState(false);

  const updateEntry = (id: string, field: keyof FormDataEntry, val: any) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, [field]: val } : e)));
  };

  const toggleType = (id: string) => {
    onChange(
      entries.map((e) =>
        e.id === id
          ? {
              ...e,
              type: e.type === "text" ? "file" : "text",
              value: "",
              files: undefined,
            }
          : e,
      ),
    );
  };

  const addFiles = (id: string, newFiles: File[]) => {
    onChange(
      entries.map((e) =>
        e.id === id ? { ...e, files: [...(e.files || []), ...newFiles] } : e,
      ),
    );
  };

  const handleFileChange = (id: string, fileList: FileList | null) => {
    if (!fileList) return;
    addFiles(id, Array.from(fileList));
  };

  const handleDrop = (id: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    setGlobalDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(id, Array.from(e.dataTransfer.files));
      // Auto-switch to file type if it was text
      const entry = entries.find((en) => en.id === id);
      if (entry && entry.type === "text") {
        onChange(
          entries.map((en) =>
            en.id === id
              ? {
                  ...en,
                  type: "file" as const,
                  value: "",
                  files: [
                    ...(en.files || []),
                    ...Array.from(e.dataTransfer.files),
                  ],
                }
              : en,
          ),
        );
        return;
      }
    }
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGlobalDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      // Add to a new file entry
      const newId = Date.now().toString();
      onChange([
        ...entries,
        {
          key: "file",
          value: "",
          type: "file",
          enabled: true,
          id: newId,
          files,
        },
      ]);
    }
  };

  const removeFile = (entryId: string, fileIndex: number) => {
    onChange(
      entries.map((e) =>
        e.id === entryId
          ? { ...e, files: (e.files || []).filter((_, i) => i !== fileIndex) }
          : e,
      ),
    );
  };

  const addEntry = () => {
    onChange([
      ...entries,
      {
        key: "",
        value: "",
        type: "text",
        enabled: true,
        id: Date.now().toString(),
      },
    ]);
  };

  const removeEntry = (id: string) => {
    if (entries.length <= 1) return;
    onChange(entries.filter((e) => e.id !== id));
  };

  return (
    <div
      className="space-y-2 relative"
      onDragOver={(e) => {
        e.preventDefault();
        setGlobalDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setGlobalDragOver(false);
      }}
      onDrop={handleGlobalDrop}
    >
      {/* Global drop zone overlay */}
      {globalDragOver && entries.every((e) => e.type !== "file") && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Upload className="w-8 h-8" />
            <span className="text-sm font-medium">
              Drop files to add a new entry
            </span>
          </div>
        </div>
      )}

      {entries.map((entry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          className="space-y-1.5"
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={entry.enabled}
              onChange={(e) =>
                updateEntry(entry.id, "enabled", e.target.checked)
              }
              className="w-3.5 h-3.5 rounded border-border accent-primary"
            />
            <input
              placeholder="Key"
              value={entry.key}
              onChange={(e) => updateEntry(entry.id, "key", e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-md surface-2 border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <button
              onClick={() => toggleType(entry.id)}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-colors ${
                entry.type === "file"
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "surface-2 text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {entry.type === "file" ? "File" : "Text"}
            </button>
            {entry.type === "text" ? (
              <input
                placeholder="Value"
                value={entry.value}
                onChange={(e) => updateEntry(entry.id, "value", e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-md surface-2 border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOverId(entry.id);
                }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(e) => handleDrop(entry.id, e)}
                onClick={() => fileInputRefs.current[entry.id]?.click()}
                className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md surface-2 border border-dashed text-sm cursor-pointer transition-all ${
                  dragOverId === entry.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {dragOverId === entry.id
                    ? "Drop files here"
                    : entry.files?.length
                      ? `${entry.files.length} file(s)`
                      : "Drop files or click to browse..."}
                </span>
                <input
                  ref={(el) => {
                    fileInputRefs.current[entry.id] = el;
                  }}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileChange(entry.id, e.target.files)}
                />
              </div>
            )}
            <button
              onClick={() => removeEntry(entry.id)}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Show selected files */}
          {entry.type === "file" && entry.files && entry.files.length > 0 && (
            <div className="ml-6 flex flex-wrap gap-1.5">
              {entry.files.map((file, fi) => (
                <span
                  key={fi}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md surface-2 border border-border text-[11px] text-foreground"
                >
                  <FileIcon className="w-3 h-3 text-muted-foreground" />
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <span className="text-muted-foreground">
                    ({(file.size / 1024).toFixed(1)}KB)
                  </span>
                  <button
                    onClick={() => removeFile(entry.id, fi)}
                    className="text-muted-foreground hover:text-destructive ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </motion.div>
      ))}
      <button
        onClick={addEntry}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
      >
        <Plus className="w-3 h-3" />
        Add Row
      </button>
    </div>
  );
}

const bodyTypes = [
  { id: "json", label: "JSON", icon: FileJson },
  { id: "raw", label: "Raw", icon: FileText },
  { id: "formdata", label: "Form Data", icon: Code },
];

const authTypes = [
  { id: "none", label: "No Auth" },
  { id: "bearer", label: "Bearer Token" },
  { id: "basic", label: "Basic Auth" },
  { id: "apikey", label: "API Key" },
];

export function RequestTabs(props: RequestTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("params");

  return (
    <div className="flex flex-col h-full">
      {/* Tab Headers */}
      <div className="flex items-center border-b border-border px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isDisabled =
            tab.id === "body" &&
            (props.method === "GET" || props.method === "HEAD");
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              disabled={isDisabled}
              className={`relative px-4 py-3 text-sm transition-colors ${
                isDisabled
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.id === "headers" &&
                props.headers.filter((h) => h.key).length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-medium">
                    {props.headers.filter((h) => h.key).length}
                  </span>
                )}
              {isActive && (
                <motion.div
                  layoutId="request-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === "params" && (
          <KeyValueEditor pairs={props.params} onChange={props.setParams} />
        )}

        {activeTab === "headers" && (
          <KeyValueEditor pairs={props.headers} onChange={props.setHeaders} />
        )}

        {activeTab === "body" && (
          <div className="space-y-3">
            <div className="flex gap-1.5">
              {bodyTypes.map((bt) => (
                <button
                  key={bt.id}
                  onClick={() => props.setBodyType(bt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    props.bodyType === bt.id
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground surface-2"
                  }`}
                >
                  <bt.icon className="w-3 h-3" />
                  {bt.label}
                </button>
              ))}
            </div>
            {props.bodyType === "formdata" ? (
              <FormDataEditor
                entries={props.formDataEntries}
                onChange={props.setFormDataEntries}
              />
            ) : (
              <textarea
                value={props.bodyContent}
                onChange={(e) => props.setBodyContent(e.target.value)}
                rows={12}
                spellCheck={false}
                className="w-full px-4 py-3 rounded-lg surface-2 border border-border font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none scrollbar-thin"
                placeholder='{\n  "key": "value"\n}'
              />
            )}
          </div>
        )}

        {activeTab === "auth" && (
          <div className="space-y-4">
            <div className="flex gap-1.5 flex-wrap">
              {authTypes.map((at) => (
                <button
                  key={at.id}
                  onClick={() => props.setAuthType(at.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    props.authType === at.id
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground surface-2"
                  }`}
                >
                  {at.label}
                </button>
              ))}
            </div>
            {props.authType !== "none" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  {props.authType === "bearer"
                    ? "Token"
                    : props.authType === "apikey"
                      ? "API Key"
                      : "Credentials"}
                </label>
                <input
                  type="password"
                  value={props.authToken}
                  onChange={(e) => props.setAuthToken(e.target.value)}
                  placeholder={
                    props.authType === "bearer"
                      ? "Enter bearer token..."
                      : "Enter key..."
                  }
                  className="w-full px-3 py-2 rounded-lg surface-2 border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
