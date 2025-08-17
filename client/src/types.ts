import { z } from "zod";

export const insertMicroserviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  repository: z.string().min(1),
  branch: z.string().min(1),
  account: z.string().optional(),
  containerName: z.string().min(1),
  externalUrl: z.string().optional(),
  environmentVariables: z.record(z.string()).optional(),
  status: z.enum(["running", "stopped"]).default("stopped"),
});

export type InsertMicroservice = z.infer<typeof insertMicroserviceSchema>;

export interface Microservice {
  id: string;
  name: string;
  description: string | null;
  repository: string;
  branch: string;
  account: string | null;
  containerName: string;
  externalUrl: string | null;
  environmentVariables: Record<string, string>;
  status: "running" | "stopped";
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SystemLog {
  id: string;
  timestamp: string | null;
  level: "info" | "success" | "warning" | "error";
  message: string;
  serviceId: string | null;
}
