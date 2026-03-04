import { useState, useEffect } from "react";
import {
  Settings,
  Monitor,
  Code,
  Globe,
  Shield,
  Bell,
  Palette,
  Save,
  RotateCcw,
  Clock,
  Zap,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AppSettings {
  general: {
    timeout: number;
    maxRedirects: number;
    followRedirects: boolean;
    sslVerification: boolean;
    autoSaveRequests: boolean;
    maxHistoryItems: number;
  };
  editor: {
    fontSize: number;
    wordWrap: boolean;
    lineNumbers: boolean;
    autoFormat: boolean;
    syntaxHighlighting: boolean;
    indentSize: number;
  };
  proxy: {
    enabled: boolean;
    host: string;
    port: string;
    auth: boolean;
    username: string;
    password: string;
  };
  notifications: {
    showResponseTime: boolean;
    showStatusNotifications: boolean;
    soundEnabled: boolean;
    errorAlerts: boolean;
  };
}

const defaultSettings: AppSettings = {
  general: {
    timeout: 30000,
    maxRedirects: 5,
    followRedirects: true,
    sslVerification: true,
    autoSaveRequests: true,
    maxHistoryItems: 200,
  },
  editor: {
    fontSize: 13,
    wordWrap: true,
    lineNumbers: true,
    autoFormat: true,
    syntaxHighlighting: true,
    indentSize: 2,
  },
  proxy: {
    enabled: false,
    host: "",
    port: "",
    auth: false,
    username: "",
    password: "",
  },
  notifications: {
    showResponseTime: true,
    showStatusNotifications: true,
    soundEnabled: false,
    errorAlerts: true,
  },
};

const STORAGE_KEY = "voltapi-settings";

const sections = [
  { id: "general", label: "General", icon: Zap },
  { id: "editor", label: "Editor", icon: Code },
  { id: "proxy", label: "Proxy", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [activeSection, setActiveSection] = useState("general");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSettings(JSON.parse(saved));
    } catch {}
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast.success("Settings saved");
  };

  const reset = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Settings reset to defaults");
  };

  const update = <K extends keyof AppSettings>(
    section: K,
    key: keyof AppSettings[K],
    value: any,
  ) => {
    setSettings((s) => ({
      ...s,
      [section]: { ...s[section], [key]: value },
    }));
  };

  const SettingRow = ({
    label,
    description,
    children,
  }: {
    label: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Section Nav */}
      <div className="w-48 border-r border-border p-4 space-y-1">
        <div className="flex items-center gap-2 px-2 pb-4">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Settings</h2>
        </div>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSection === s.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <s.icon className="w-4 h-4" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 max-w-2xl">
        {activeSection === "general" && (
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              General
            </h3>
            <SettingRow
              label="Request Timeout (ms)"
              description="Max wait time for API responses"
            >
              <Input
                type="number"
                value={settings.general.timeout}
                onChange={(e) =>
                  update("general", "timeout", Number(e.target.value))
                }
                className="w-28 h-8 text-sm"
              />
            </SettingRow>
            <SettingRow
              label="Max Redirects"
              description="Maximum number of HTTP redirects to follow"
            >
              <Input
                type="number"
                value={settings.general.maxRedirects}
                onChange={(e) =>
                  update("general", "maxRedirects", Number(e.target.value))
                }
                className="w-20 h-8 text-sm"
              />
            </SettingRow>
            <SettingRow
              label="Follow Redirects"
              description="Automatically follow HTTP redirects"
            >
              <Switch
                checked={settings.general.followRedirects}
                onCheckedChange={(v) => update("general", "followRedirects", v)}
              />
            </SettingRow>
            <SettingRow
              label="SSL Verification"
              description="Verify SSL certificates on requests"
            >
              <Switch
                checked={settings.general.sslVerification}
                onCheckedChange={(v) => update("general", "sslVerification", v)}
              />
            </SettingRow>
            <SettingRow
              label="Auto-Save Requests"
              description="Automatically save sent requests to history"
            >
              <Switch
                checked={settings.general.autoSaveRequests}
                onCheckedChange={(v) =>
                  update("general", "autoSaveRequests", v)
                }
              />
            </SettingRow>
            <SettingRow
              label="Max History Items"
              description="Maximum number of history entries to keep"
            >
              <Input
                type="number"
                value={settings.general.maxHistoryItems}
                onChange={(e) =>
                  update("general", "maxHistoryItems", Number(e.target.value))
                }
                className="w-20 h-8 text-sm"
              />
            </SettingRow>
          </div>
        )}

        {activeSection === "editor" && (
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Editor
            </h3>
            <SettingRow
              label="Font Size"
              description="Code editor font size in pixels"
            >
              <Input
                type="number"
                value={settings.editor.fontSize}
                onChange={(e) =>
                  update("editor", "fontSize", Number(e.target.value))
                }
                className="w-20 h-8 text-sm"
              />
            </SettingRow>
            <SettingRow label="Word Wrap">
              <Switch
                checked={settings.editor.wordWrap}
                onCheckedChange={(v) => update("editor", "wordWrap", v)}
              />
            </SettingRow>
            <SettingRow label="Line Numbers">
              <Switch
                checked={settings.editor.lineNumbers}
                onCheckedChange={(v) => update("editor", "lineNumbers", v)}
              />
            </SettingRow>
            <SettingRow
              label="Auto Format"
              description="Format JSON/XML automatically"
            >
              <Switch
                checked={settings.editor.autoFormat}
                onCheckedChange={(v) => update("editor", "autoFormat", v)}
              />
            </SettingRow>
            <SettingRow label="Syntax Highlighting">
              <Switch
                checked={settings.editor.syntaxHighlighting}
                onCheckedChange={(v) =>
                  update("editor", "syntaxHighlighting", v)
                }
              />
            </SettingRow>
            <SettingRow label="Indent Size">
              <Select
                value={String(settings.editor.indentSize)}
                onValueChange={(v) => update("editor", "indentSize", Number(v))}
              >
                <SelectTrigger className="w-20 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </div>
        )}

        {activeSection === "proxy" && (
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Proxy
            </h3>
            <SettingRow
              label="Enable Proxy"
              description="Route requests through a proxy server"
            >
              <Switch
                checked={settings.proxy.enabled}
                onCheckedChange={(v) => update("proxy", "enabled", v)}
              />
            </SettingRow>
            {settings.proxy.enabled && (
              <>
                <SettingRow label="Host">
                  <Input
                    value={settings.proxy.host}
                    onChange={(e) => update("proxy", "host", e.target.value)}
                    placeholder="127.0.0.1"
                    className="w-40 h-8 text-sm"
                  />
                </SettingRow>
                <SettingRow label="Port">
                  <Input
                    value={settings.proxy.port}
                    onChange={(e) => update("proxy", "port", e.target.value)}
                    placeholder="8080"
                    className="w-24 h-8 text-sm"
                  />
                </SettingRow>
                <SettingRow label="Proxy Authentication">
                  <Switch
                    checked={settings.proxy.auth}
                    onCheckedChange={(v) => update("proxy", "auth", v)}
                  />
                </SettingRow>
                {settings.proxy.auth && (
                  <>
                    <SettingRow label="Username">
                      <Input
                        value={settings.proxy.username}
                        onChange={(e) =>
                          update("proxy", "username", e.target.value)
                        }
                        className="w-40 h-8 text-sm"
                      />
                    </SettingRow>
                    <SettingRow label="Password">
                      <Input
                        type="password"
                        value={settings.proxy.password}
                        onChange={(e) =>
                          update("proxy", "password", e.target.value)
                        }
                        className="w-40 h-8 text-sm"
                      />
                    </SettingRow>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {activeSection === "notifications" && (
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Notifications
            </h3>
            <SettingRow
              label="Show Response Time"
              description="Display response time in notifications"
            >
              <Switch
                checked={settings.notifications.showResponseTime}
                onCheckedChange={(v) =>
                  update("notifications", "showResponseTime", v)
                }
              />
            </SettingRow>
            <SettingRow
              label="Status Notifications"
              description="Show toast on request completion"
            >
              <Switch
                checked={settings.notifications.showStatusNotifications}
                onCheckedChange={(v) =>
                  update("notifications", "showStatusNotifications", v)
                }
              />
            </SettingRow>
            <SettingRow label="Sound Effects">
              <Switch
                checked={settings.notifications.soundEnabled}
                onCheckedChange={(v) =>
                  update("notifications", "soundEnabled", v)
                }
              />
            </SettingRow>
            <SettingRow
              label="Error Alerts"
              description="Show prominent alerts on request errors"
            >
              <Switch
                checked={settings.notifications.errorAlerts}
                onCheckedChange={(v) =>
                  update("notifications", "errorAlerts", v)
                }
              />
            </SettingRow>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 mt-8 pt-4 border-t border-border">
          <Button onClick={save} className="gap-2">
            <Save className="w-4 h-4" /> Save Settings
          </Button>
          <Button variant="outline" onClick={reset} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}
