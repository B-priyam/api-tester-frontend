import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Plus,
  Trash2,
  Copy,
  Check,
  Edit2,
  ChevronDown,
  Save,
  RotateCcw,
  Search,
  Eye,
  EyeOff,
  Download,
  Upload,
} from "lucide-react";

interface EnvVariable {
  id: string;
  key: string;
  value: string;
  secret: boolean;
  enabled: boolean;
}

interface Environment {
  id: string;
  name: string;
  color: string;
  variables: EnvVariable[];
  isActive: boolean;
}

const ENV_COLORS = [
  "hsl(142 71% 45%)", // green
  "hsl(38 92% 50%)", // amber
  "hsl(0 84% 60%)", // red
  "hsl(217 91% 60%)", // blue
  "hsl(280 67% 60%)", // purple
  "hsl(190 80% 45%)", // cyan
];

const STORAGE_KEY = "voltapi-environments";

function loadEnvironments(): Environment[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [
    {
      id: "dev",
      name: "Development",
      color: ENV_COLORS[0],
      isActive: true,
      variables: [
        {
          id: "1",
          key: "base_url",
          value: "http://localhost:3000",
          secret: false,
          enabled: true,
        },
        { id: "2", key: "api_key", value: "", secret: true, enabled: true },
      ],
    },
    {
      id: "staging",
      name: "Staging",
      color: ENV_COLORS[1],
      isActive: false,
      variables: [
        {
          id: "1",
          key: "base_url",
          value: "https://staging.api.example.com",
          secret: false,
          enabled: true,
        },
        { id: "2", key: "api_key", value: "", secret: true, enabled: true },
      ],
    },
    {
      id: "prod",
      name: "Production",
      color: ENV_COLORS[2],
      isActive: false,
      variables: [
        {
          id: "1",
          key: "base_url",
          value: "https://api.example.com",
          secret: false,
          enabled: true,
        },
        { id: "2", key: "api_key", value: "", secret: true, enabled: true },
      ],
    },
  ];
}

export function Environments() {
  const [environments, setEnvironments] =
    useState<Environment[]>(loadEnvironments);
  const [selectedEnvId, setSelectedEnvId] = useState<string>(
    () =>
      loadEnvironments().find((e) => e.isActive)?.id ||
      loadEnvironments()[0]?.id ||
      "",
  );
  const [search, setSearch] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(
    new Set(),
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(environments));
  }, [environments]);

  const selectedEnv = environments.find((e) => e.id === selectedEnvId);

  const setActiveEnv = (id: string) => {
    setEnvironments((envs) =>
      envs.map((e) => ({ ...e, isActive: e.id === id })),
    );
  };

  const addEnvironment = () => {
    const newEnv: Environment = {
      id: Date.now().toString(),
      name: "New Environment",
      color: ENV_COLORS[environments.length % ENV_COLORS.length],
      isActive: false,
      variables: [
        { id: "1", key: "", value: "", secret: false, enabled: true },
      ],
    };
    setEnvironments([...environments, newEnv]);
    setSelectedEnvId(newEnv.id);
    setEditingName(newEnv.id);
  };

  const deleteEnvironment = (id: string) => {
    if (environments.length <= 1) return;
    const remaining = environments.filter((e) => e.id !== id);
    if (selectedEnvId === id) setSelectedEnvId(remaining[0].id);
    if (remaining.every((e) => !e.isActive)) remaining[0].isActive = true;
    setEnvironments(remaining);
  };

  const duplicateEnvironment = (id: string) => {
    const source = environments.find((e) => e.id === id);
    if (!source) return;
    const newEnv: Environment = {
      ...JSON.parse(JSON.stringify(source)),
      id: Date.now().toString(),
      name: `${source.name} (Copy)`,
      isActive: false,
    };
    setEnvironments([...environments, newEnv]);
    setSelectedEnvId(newEnv.id);
  };

  const updateVariable = (
    envId: string,
    varId: string,
    field: keyof EnvVariable,
    val: any,
  ) => {
    setEnvironments((envs) =>
      envs.map((e) =>
        e.id === envId
          ? {
              ...e,
              variables: e.variables.map((v) =>
                v.id === varId ? { ...v, [field]: val } : v,
              ),
            }
          : e,
      ),
    );
  };

  const addVariable = (envId: string) => {
    setEnvironments((envs) =>
      envs.map((e) =>
        e.id === envId
          ? {
              ...e,
              variables: [
                ...e.variables,
                {
                  id: Date.now().toString(),
                  key: "",
                  value: "",
                  secret: false,
                  enabled: true,
                },
              ],
            }
          : e,
      ),
    );
  };

  const removeVariable = (envId: string, varId: string) => {
    setEnvironments((envs) =>
      envs.map((e) =>
        e.id === envId
          ? { ...e, variables: e.variables.filter((v) => v.id !== varId) }
          : e,
      ),
    );
  };

  const copyReference = (key: string) => {
    navigator.clipboard.writeText(`{{${key}}}`);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleSecret = (varId: string) => {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      next.has(varId) ? next.delete(varId) : next.add(varId);
      return next;
    });
  };

  const exportEnvs = () => {
    const blob = new Blob([JSON.stringify(environments, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voltapi-environments.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importEnvs = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (Array.isArray(data)) setEnvironments(data);
        } catch {}
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const filteredVars = selectedEnv?.variables.filter(
    (v) =>
      !search ||
      v.key.toLowerCase().includes(search.toLowerCase()) ||
      v.value.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-14 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Globe className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">
            Environments
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={importEnvs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground surface-2 border border-border transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Import
          </button>
          <button
            onClick={exportEnvs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground surface-2 border border-border transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Env List Sidebar */}
        <div className="w-60 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <button
              onClick={addEnvironment}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Environment
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
            {environments.map((env) => (
              <button
                key={env.id}
                onClick={() => setSelectedEnvId(env.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  selectedEnvId === env.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: env.color }}
                />
                {editingName === env.id ? (
                  <input
                    autoFocus
                    value={env.name}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      setEnvironments((envs) =>
                        envs.map((en) =>
                          en.id === env.id
                            ? { ...en, name: e.target.value }
                            : en,
                        ),
                      )
                    }
                    onBlur={() => setEditingName(null)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingName(null)}
                    className="flex-1 bg-transparent border-b border-primary text-sm text-foreground outline-none"
                  />
                ) : (
                  <span className="flex-1 truncate text-left">{env.name}</span>
                )}
                {env.isActive && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/20 text-primary uppercase tracking-wider">
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Env Detail */}
        {selectedEnv && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Env Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedEnv.color }}
                />
                <h2 className="font-semibold text-foreground">
                  {selectedEnv.name}
                </h2>
                <button
                  onClick={() => setEditingName(selectedEnv.id)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {!selectedEnv.isActive && (
                  <button
                    onClick={() => setActiveEnv(selectedEnv.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Set Active
                  </button>
                )}
                <button
                  onClick={() => duplicateEnvironment(selectedEnv.id)}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteEnvironment(selectedEnv.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  placeholder="Filter variables..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg surface-2 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Variable table header */}
            <div className="flex items-center gap-2 px-6 py-2 border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              <div className="w-6" />
              <div className="flex-1">Variable</div>
              <div className="flex-[2]">Value</div>
              <div className="w-20 text-center">Secret</div>
              <div className="w-24 text-center">Reference</div>
              <div className="w-8" />
            </div>

            {/* Variables */}
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-1 scrollbar-thin">
              <AnimatePresence>
                {filteredVars?.map((v, i) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={v.enabled}
                      onChange={(e) =>
                        updateVariable(
                          selectedEnv.id,
                          v.id,
                          "enabled",
                          e.target.checked,
                        )
                      }
                      className="w-3.5 h-3.5 rounded border-border accent-primary"
                    />
                    <input
                      placeholder="VARIABLE_NAME"
                      value={v.key}
                      onChange={(e) =>
                        updateVariable(
                          selectedEnv.id,
                          v.id,
                          "key",
                          e.target.value,
                        )
                      }
                      className="flex-1 px-3 py-1.5 rounded-md surface-2 border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    <div className="flex-[2] relative">
                      <input
                        type={
                          v.secret && !revealedSecrets.has(v.id)
                            ? "password"
                            : "text"
                        }
                        placeholder="value"
                        value={v.value}
                        onChange={(e) =>
                          updateVariable(
                            selectedEnv.id,
                            v.id,
                            "value",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-md surface-2 border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 pr-8"
                      />
                      {v.secret && (
                        <button
                          onClick={() => toggleSecret(v.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {revealedSecrets.has(v.id) ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="w-20 flex justify-center">
                      <button
                        onClick={() =>
                          updateVariable(
                            selectedEnv.id,
                            v.id,
                            "secret",
                            !v.secret,
                          )
                        }
                        className={`w-8 h-5 rounded-full transition-colors relative ${
                          v.secret ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-background shadow transition-transform ${
                            v.secret ? "left-3.5" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="w-24 flex justify-center">
                      {v.key && (
                        <button
                          onClick={() => copyReference(v.key)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono text-muted-foreground hover:text-primary surface-2 border border-border transition-colors"
                        >
                          {copiedId === v.key ? (
                            <Check className="w-3 h-3 text-primary" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          {`{{${v.key.slice(0, 8)}}}`}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => removeVariable(selectedEnv.id, v.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <button
                onClick={() => addVariable(selectedEnv.id)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-3"
              >
                <Plus className="w-3 h-3" />
                Add Variable
              </button>
            </div>

            {/* Usage hint */}
            <div className="px-6 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Use{" "}
                <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px]">
                  {"{{variable_name}}"}
                </code>{" "}
                in your request URLs, headers, or body to reference variables
                from the active environment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
