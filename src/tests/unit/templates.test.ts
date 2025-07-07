import { describe, it, expect } from '@jest/globals';
import { DatabaseTemplates } from '../../core/templates.js';

describe('DatabaseTemplates - Basic Validation', () => {
  it('should return all 19 configured databases', () => {
    const templates = DatabaseTemplates.getAllTemplates();
    expect(templates.size).toBe(19);
  });

  it('should have valid structure for all templates', () => {
    const templates = DatabaseTemplates.getAllTemplates();
    
    templates.forEach((template, key) => {
      // Basic structure validation
      expect(template.name).toBeTruthy();
      expect(template.engine.name).toBe(key);
      expect(template.engine.type).toBeTruthy();
      expect(template.engine.image).toBeTruthy();
      expect(template.engine.ports).toBeInstanceOf(Array);
    });
  });

  it('should include all 6 time series databases', () => {
    const timeseriesEngines = DatabaseTemplates.getEnginesByType('timeseries');
    expect(timeseriesEngines).toHaveLength(6);
    expect(timeseriesEngines).toContain('influxdb2');
    expect(timeseriesEngines).toContain('influxdb3');
    expect(timeseriesEngines).toContain('timescaledb');
  });
}); 