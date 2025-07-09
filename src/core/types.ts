export interface HayaiConfig {
  version: string;
  docker: {
    network_name: string;
    compose_file: string;
    data_directory: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    file: string;
  };
  defaults: {
    port_range: {
      start: number;
      end: number;
    };
    volume_driver: string;
    restart_policy: string;
  };
}

// .hayaidb file structure interfaces
export interface HayaiDbConfig {
  version: string;
  project?: string;
  databases: Record<string, DatabaseSpec>;
  profiles?: Record<string, string[]>;
}

export interface DatabaseSpec {
  engine: string;
  port?: number;
  environment?: Record<string, string>;
  volumes?: string[];
  healthcheck?: {
    test?: string;
    interval?: string;
    timeout?: string;
    retries?: number;
  };
  admin_dashboard?: boolean;
  client_sdk?: boolean;
}

export interface DatabaseEngine {
  name: string;
  type: 'sql' | 'keyvalue' | 'widecolumn' | 'vector' | 'timeseries' | 'search' | 'graph' | 'embedded' | 'analytics';
  version: string;
  image: string;
  ports: number[];
  volumes: string[];
  environment: Record<string, string>;
  healthcheck?: {
    test: string;
    interval: string;
    timeout: string;
    retries: number;
  };
}

export interface DatabaseInstance {
  name: string;
  engine: string;
  port: number;
  volume: string;
  environment: Record<string, string>;
  status: 'running' | 'stopped' | 'error';
  created_at: string;
  connection_uri: string;
}

export interface DatabaseTemplate {
  name: string;
  engine: DatabaseEngine;
  admin_dashboard?: {
    enabled: boolean;
    port: number;
    image: string;
  };
  client_sdk?: {
    enabled: boolean;
    languages: string[];
  };
}

export interface PortAllocation {
  port: number;
  service: string;
  status: 'allocated' | 'free';
}

export interface DockerService {
  name: string;
  image: string;
  ports: string[];
  volumes: string[];
  environment: Record<string, string>;
  depends_on?: string[];
  healthcheck?: {
    test: string;
    interval: string;
    timeout: string;
    retries: number;
  };
  restart: string;
}

export interface ComposeFile {
  version: string;
  services: Record<string, DockerService>;
  volumes: Record<string, any>;
  networks: Record<string, any>;
}

export interface CLIOptions {
  config?: string;
  verbose?: boolean;
  quiet?: boolean;
  dryRun?: boolean;
}

export interface InitOptions extends CLIOptions {
  name: string;
  engine: string;
  port?: number;
  volume?: string;
  adminDashboard?: boolean;
  clientSdk?: boolean;
  language?: string;
  yes?: boolean;
}

export interface LogOptions extends CLIOptions {
  follow?: boolean;
  tail?: number;
  since?: string;
}

export interface SnapshotOptions extends CLIOptions {
  name: string;
  output?: string;
  compress?: boolean;
  format?: string;
}

export type CommandResult = {
  success: boolean;
  message: string;
  data?: any;
}; 