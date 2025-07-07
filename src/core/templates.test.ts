import { describe, it, expect } from '@jest/globals';
import { DatabaseTemplates, getTemplate, getAllTemplates, getEnginesByType } from './templates';

describe('Database Templates', () => {
  describe('getAllTemplates', () => {
    it('should return all available templates', () => {
      const templates = getAllTemplates();
      
      expect(templates).toBeDefined();
      expect(templates.size).toBeGreaterThan(0);
      expect(templates.size).toBe(18); // Current number of supported databases
    });
  });

  describe('getTemplate', () => {
    it('should return PostgreSQL template', () => {
      const template = getTemplate('postgresql');
      
      expect(template).toBeDefined();
      expect(template?.name).toBe('PostgreSQL');
      expect(template?.engine.type).toBe('sql');
      expect(template?.engine.image).toBe('postgres:16-alpine');
      expect(template?.engine.ports).toContain(5432);
    });

    it('should return Redis template', () => {
      const template = getTemplate('redis');
      
      expect(template).toBeDefined();
      expect(template?.name).toBe('Redis');
      expect(template?.engine.type).toBe('keyvalue');
      expect(template?.engine.image).toBe('redis:7.0-alpine');
      expect(template?.engine.ports).toContain(6379);
    });

    it('should return undefined for non-existent template', () => {
      const template = getTemplate('nonexistent');
      
      expect(template).toBeUndefined();
    });
  });

  describe('getEnginesByType', () => {
    it('should return SQL engines', () => {
      const engines = getEnginesByType('sql');
      
      expect(engines).toBeDefined();
      expect(engines).toContain('postgresql');
      expect(engines).toContain('mariadb');
      expect(engines.length).toBeGreaterThan(0);
    });

    it('should return Time Series engines', () => {
      const engines = getEnginesByType('timeseries');
      
      expect(engines).toBeDefined();
      expect(engines).toContain('influxdb');
      expect(engines).toContain('timescaledb');
      expect(engines).toContain('questdb');
      expect(engines).toContain('victoriametrics');
      expect(engines).toContain('horaedb');
      expect(engines.length).toBe(5); // Current number of time series databases
    });

    it('should return empty array for non-existent type', () => {
      const engines = getEnginesByType('nonexistent');
      
      expect(engines).toBeDefined();
      expect(engines).toHaveLength(0);
    });
  });

  describe('Database Categories', () => {
    it('should have correct database categorization', () => {
      const sqlEngines = getEnginesByType('sql');
      const keyValueEngines = getEnginesByType('keyvalue');
      const wideColumnEngines = getEnginesByType('widecolumn');
      const vectorEngines = getEnginesByType('vector');
      const timeSeriesEngines = getEnginesByType('timeseries');
      
      expect(sqlEngines).toEqual(expect.arrayContaining(['postgresql', 'mariadb']));
      expect(keyValueEngines).toEqual(expect.arrayContaining(['redis']));
      expect(wideColumnEngines).toEqual(expect.arrayContaining(['cassandra']));
      expect(vectorEngines).toEqual(expect.arrayContaining(['qdrant', 'weaviate', 'milvus']));
      expect(timeSeriesEngines).toEqual(expect.arrayContaining(['influxdb', 'timescaledb', 'questdb']));
    });
  });

  describe('Template Validation', () => {
    it('should have valid template structure for all databases', () => {
      const templates = getAllTemplates();
      
      for (const [key, template] of templates) {
        expect(template).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.engine).toBeDefined();
        expect(template.engine.name).toBe(key);
        expect(template.engine.type).toBeDefined();
        expect(template.engine.version).toBeDefined();
        expect(template.engine.image).toBeDefined();
        expect(Array.isArray(template.engine.ports)).toBe(true);
        expect(Array.isArray(template.engine.volumes)).toBe(true);
        expect(typeof template.engine.environment).toBe('object');
      }
    });
  });
}); 