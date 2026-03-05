import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  FolderOpen,
  History,
  BarChart3,
  Settings,
  Users,
  Search,
  Plus,
  ChevronDown,
  Globe,
  FileCode,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "api", label: "API Testing", icon: Zap },
  { id: "collections", label: "Collections", icon: FolderOpen },
  { id: "history", label: "History", icon: History },
  { id: "loadtest", label: "Load Testing", icon: BarChart3 },
  { id: "environments", label: "Environments", icon: Globe },
  { id: "mocks", label: "Mock Servers", icon: FileCode },
];

const bottomItems = [
  { id: "team", label: "Team", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

function SidebarButton({
  icon: Icon,
  label,
  isActive,
  collapsed,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const btn = (
    <button
      onClick={onClick}
      className={`${collapsed ? "w-2/3" : "w-full"} flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 relative ${
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
      } ${collapsed ? "justify-center" : ""}`}
    >
      <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-primary" : ""}`} />
      {!collapsed && <span>{label}</span>}
      {isActive && (
        <motion.div
          layoutId="sidebar-indicator"
          className="absolute left-0 w-0.5 h-5 bg-primary rounded-r-full"
        />
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={5}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return btn;
}

export function AppSidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={100}>
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`flex flex-col h-screen border-r border-border bg-sidebar transition-all duration-300 ${
          collapsed ? "w-20" : "w-60"
        }`}
      >
        {/* Logo Part*/}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            {!collapsed && (
              <span className="font-bold text-foreground tracking-tight text-lg">
                Volt<span className="text-primary">API</span>
              </span>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
              >
                {collapsed ? (
                  <PanelLeftOpen className="w-5 h-5" />
                ) : (
                  <PanelLeftClose className="w-5 h-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* New Request */}
        {!collapsed ? (
          <div className="px-3 pt-3">
            <button
              onClick={() => onTabChange("api")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <Plus className="w-5 h-5" />
              New Request
            </button>
          </div>
        ) : (
          <div className="px-2 pt-3 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onTabChange("api")}
                  className="w-2/3 flex items-center justify-center p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                New Request
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Search */}
        {!collapsed ? (
          <div className="px-3 pt-2">
            <button
              onClick={() => {
                document.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", metaKey: true }),
                );
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg surface-2 text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Search... ⌘K</span>
            </button>
          </div>
        ) : (
          <div className="px-2 pt-2 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    document.dispatchEvent(
                      new KeyboardEvent("keydown", { key: "k", metaKey: true }),
                    );
                  }}
                  className="w-2/3 flex items-center justify-center p-2 rounded-lg surface-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Search ⌘K
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Nav Items */}
        <nav
          className={`flex-1 w-full flex ${collapsed ? "items-center" : ""} flex-col px-2 gap-2 pt-4 space-y-0.5 overflow-y-auto scrollbar-thin`}
        >
          {navItems.map((item) => (
            <SidebarButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeTab === item.id}
              collapsed={collapsed}
              onClick={() => onTabChange(item.id)}
            />
          ))}
        </nav>

        {/* Bottom Items */}
        <div className="px-2 pb-3 space-y-0.5 border-t border-border pt-2 flex items-center flex-col">
          {!collapsed && <ThemeToggle collapsed={collapsed} />}
          {collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center py-1">
                  <ThemeToggle collapsed={collapsed} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Toggle theme
              </TooltipContent>
            </Tooltip>
          )}
          {bottomItems.map((item) => (
            <SidebarButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
              onClick={() => onTabChange(item.id)}
            />
          ))}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
