import * as net from 'net';
import { getConfig } from './config.js';
import { PortAllocation } from './types.js';

export class PortManager {
  private static instance: PortManager;
  private allocatedPorts: Map<number, string> = new Map();
  private portRange: { start: number; end: number } = { start: 5000, end: 6000 };

  private constructor() {}

  public static getInstance(): PortManager {
    if (!PortManager.instance) {
      PortManager.instance = new PortManager();
    }
    return PortManager.instance;
  }

  public async initialize(): Promise<void> {
    const config = await getConfig();
    this.portRange = config.defaults.port_range;
  }

  public async allocatePort(serviceName: string, preferredPort?: number): Promise<number> {
    await this.initialize();

    // If a preferred port is specified and available, use it
    if (preferredPort && await this.isPortAvailable(preferredPort)) {
      if (!this.allocatedPorts.has(preferredPort)) {
        this.allocatedPorts.set(preferredPort, serviceName);
        return preferredPort;
      }
    }

    // Find the next available port in the range
    for (let port = this.portRange.start; port <= this.portRange.end; port++) {
      if (!this.allocatedPorts.has(port) && await this.isPortAvailable(port)) {
        this.allocatedPorts.set(port, serviceName);
        return port;
      }
    }

    throw new Error(`No available ports in range ${this.portRange.start}-${this.portRange.end}`);
  }

  public deallocatePort(port: number): void {
    this.allocatedPorts.delete(port);
  }

  public getPortAllocations(): PortAllocation[] {
    const allocations: PortAllocation[] = [];
    
    for (const [port, service] of this.allocatedPorts.entries()) {
      allocations.push({
        port,
        service,
        status: 'allocated',
      });
    }

    return allocations;
  }

  public isPortAllocated(port: number): boolean {
    return this.allocatedPorts.has(port);
  }

  public getServiceByPort(port: number): string | undefined {
    return this.allocatedPorts.get(port);
  }

  public getPortByService(serviceName: string): number | undefined {
    for (const [port, service] of this.allocatedPorts.entries()) {
      if (service === serviceName) {
        return port;
      }
    }
    return undefined;
  }

  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });
      
      server.on('error', () => {
        resolve(false);
      });
    });
  }

  public async findAvailablePortsInRange(count: number): Promise<number[]> {
    await this.initialize();
    const availablePorts: number[] = [];
    
    for (let port = this.portRange.start; port <= this.portRange.end && availablePorts.length < count; port++) {
      if (!this.allocatedPorts.has(port) && await this.isPortAvailable(port)) {
        availablePorts.push(port);
      }
    }
    
    return availablePorts;
  }

  public async resetAllocations(): Promise<void> {
    this.allocatedPorts.clear();
  }

  public getPortRangeInfo(): { start: number; end: number; total: number; allocated: number; available: number } {
    const total = this.portRange.end - this.portRange.start + 1;
    const allocated = this.allocatedPorts.size;
    const available = total - allocated;
    
    return {
      start: this.portRange.start,
      end: this.portRange.end,
      total,
      allocated,
      available,
    };
  }
}

// Convenience functions for global access
export const allocatePort = async (serviceName: string, preferredPort?: number): Promise<number> => {
  const manager = PortManager.getInstance();
  return await manager.allocatePort(serviceName, preferredPort);
};

export const deallocatePort = (port: number): void => {
  const manager = PortManager.getInstance();
  manager.deallocatePort(port);
};

export const getPortAllocations = (): PortAllocation[] => {
  const manager = PortManager.getInstance();
  return manager.getPortAllocations();
};

export const isPortAllocated = (port: number): boolean => {
  const manager = PortManager.getInstance();
  return manager.isPortAllocated(port);
};

export const getServiceByPort = (port: number): string | undefined => {
  const manager = PortManager.getInstance();
  return manager.getServiceByPort(port);
};

export const getPortByService = (serviceName: string): number | undefined => {
  const manager = PortManager.getInstance();
  return manager.getPortByService(serviceName);
}; 