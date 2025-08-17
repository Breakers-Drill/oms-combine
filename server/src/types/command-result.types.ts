export interface CommandResult {
  success: boolean;
  output: string[];
  error?: string;
  exitCode: number;
  command: string;
  duration: number;
}

export interface CommandOptions {
  cwd?: string;
  env?: Record<string, string>;
  shell?: boolean;
  detached?: boolean;
  uid?: number;
  gid?: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
  serviceId?: string | null;
  command?: string;
  source: "git" | "docker" | "nginx" | "system";
}

export interface DetailedError {
  step: string;           // На каком этапе произошла ошибка
  command: string;        // Какая команда не выполнилась
  error: string;          // Текст ошибки
  recommendations: string[]; // Что нужно исправить
  nextAction?: string;    // Следующий шаг после исправления
}
