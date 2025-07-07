import { describe, it, expect } from '@jest/globals';
import { DatabaseTemplates } from '../../core/templates.js';

describe('DatabaseTemplates', () => {
  it('should have getTemplate method', () => {
    expect(typeof DatabaseTemplates.getTemplate).toBe('function');
  });

  it('should have getAllTemplates method', () => {
    expect(typeof DatabaseTemplates.getAllTemplates).toBe('function');
  });

  it('should return all templates', () => {
    const templates = DatabaseTemplates.getAllTemplates();
    expect(templates instanceof Map).toBe(true);
    expect(templates.size).toBeGreaterThan(0);
  });

  it('should return PostgreSQL template', () => {
    const template = DatabaseTemplates.getTemplate('postgresql');
    expect(template).toBeDefined();
    expect(template?.name).toBe('PostgreSQL');
    expect(template?.engine.name).toBe('postgresql');
  });

  it('should return MySQL template', () => {
    const template = DatabaseTemplates.getTemplate('mariadb');
    expect(template).toBeDefined();
    expect(template?.name).toBe('MariaDB');
    expect(template?.engine.name).toBe('mariadb');
  });

  it('should return undefined for non-existent template', () => {
    const template = DatabaseTemplates.getTemplate('nonexistent');
    expect(template).toBeUndefined();
  });

  it('should have all required template properties', () => {
    const template = DatabaseTemplates.getTemplate('postgresql');
    expect(template).toBeDefined();
    expect(template?.name).toBeDefined();
    expect(template?.engine).toBeDefined();
    expect(template?.engine.name).toBeDefined();
    expect(template?.engine.type).toBeDefined();
    expect(template?.engine.image).toBeDefined();
    expect(template?.engine.ports).toBeDefined();
    expect(template?.engine.environment).toBeDefined();
    expect(template?.engine.volumes).toBeDefined();
    expect(template?.engine.healthcheck).toBeDefined();
  });

  it('should include time series databases', () => {
    const influxTemplate = DatabaseTemplates.getTemplate('influxdb');
    const timescaleTemplate = DatabaseTemplates.getTemplate('timescaledb');
    
    expect(influxTemplate).toBeDefined();
    expect(influxTemplate?.engine.type).toBe('timeseries');
    
    expect(timescaleTemplate).toBeDefined();
    expect(timescaleTemplate?.engine.type).toBe('timeseries');
  });

  it('should have correct database types', () => {
    const availableTypes = DatabaseTemplates.getAvailableTypes();
    expect(availableTypes).toContain('sql');
    expect(availableTypes).toContain('keyvalue');
    expect(availableTypes).toContain('vector');
    expect(availableTypes).toContain('timeseries');
  });

  it('should return engines by type', () => {
    const sqlEngines = DatabaseTemplates.getEnginesByType('sql');
    expect(sqlEngines).toContain('postgresql');
    expect(sqlEngines).toContain('mariadb');
    
    const timeseriesEngines = DatabaseTemplates.getEnginesByType('timeseries');
    expect(timeseriesEngines).toContain('influxdb');
    expect(timeseriesEngines).toContain('timescaledb');
  });
}); 