export interface Microservice {
  id: string;                    // = имя директории
  name: string;                  // = имя директории  
  description?: string;          // из docker-compose.yaml или README
  repository: string;            // из git config
  branch: string;                // из git branch
  status: "running" | "stopped"; // из docker ps
  containers: ContainerInfo[];   // из docker ps
  ports: PortMapping[];          // из docker-compose.yaml
  environmentVariables: Record<string, string>; // из .env
  lastCommit?: GitCommitInfo;    // из git log
  createdAt: string;             // из git log --reverse
  updatedAt: string;             // из git log
  externalUrl?: string;          // из конфигурации
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: string[];
  createdAt: string;
}

export interface PortMapping {
  host: string;
  container: string;
  protocol: string;
}

export interface GitCommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface CreateMicroserviceDto {
  name: string;
  description?: string;
  repository: string;
  branch: string;
  environmentVariables: Record<string, string>;
  externalUrl?: string;
}

export interface UpdateMicroserviceDto {
  description?: string;
  environmentVariables?: Record<string, string>;
  externalUrl?: string;
}
