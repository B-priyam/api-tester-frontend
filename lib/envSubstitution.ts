const ENV_STORAGE_KEY = "voltapi-environments";

interface EnvVariable {
  key: string;
  value: string;
  enabled: boolean;
}

interface Environment {
  id: string;
  name: string;
  variables: EnvVariable[];
  isActive: boolean;
}

export function getActiveEnvVariables(): Record<string, string> {
  try {
    const stored = localStorage.getItem(ENV_STORAGE_KEY);
    if (!stored) return {};
    const envs: Environment[] = JSON.parse(stored);
    const active = envs.find((e) => e.isActive);
    if (!active) return {};
    const vars: Record<string, string> = {};
    active.variables
      .filter((v) => v.enabled && v.key)
      .forEach((v) => {
        vars[v.key] = v.value;
      });
    return vars;
  } catch {
    return {};
  }
}

export function substituteEnvVars(text: string): string {
  const vars = getActiveEnvVariables();
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in vars ? vars[key] : match;
  });
}
