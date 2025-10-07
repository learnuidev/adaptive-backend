import { describe, it, expect, beforeEach } from 'vitest';

// Import the functions we need to test
import { 
  buildFilterConditions,
  buildStandardCondition,
  buildMetadataCondition,
  escapeColumnName,
  escapeValue,
  escapeArrayValue
} from '../src/adaptive-research/get-live-users-by-website-id.js';

describe('Filter Building Functions', () => {
  describe('buildFilterConditions', () => {
    it('should return empty string for no filters', () => {
      const result = buildFilterConditions([]);
      expect(result).toBe('');
    });

    it('should return empty string for undefined filters', () => {
      const result = buildFilterConditions();
      expect(result).toBe('');
    });

    it('should build conditions for standard attributes', () => {
      const filters = [
        { key: 'country', operator: 'eq', value: 'US' },
        { key: 'browser_name', operator: 'contains', value: 'Chrome' }
      ];
      const result = buildFilterConditions(filters);
      expect(result).toBe("country = 'US' AND like(browser_name, '%Chrome%')");
    });

    it('should build conditions for metadata attributes', () => {
      const filters = [
        { key: 'metadata.plan', operator: 'eq', value: 'premium' },
        { key: 'metadata.userRole', operator: 'in', value: ['admin', 'moderator'] }
      ];
      const result = buildFilterConditions(filters);
      expect(result).toBe("mapContains(metadata, 'plan') AND metadata['plan'] = 'premium' AND mapContains(metadata, 'userRole') AND metadata['userRole'] IN ('admin', 'moderator')");
    });

    it('should handle mixed standard and metadata filters', () => {
      const filters = [
        { key: 'country', operator: 'eq', value: 'US' },
        { key: 'metadata.plan', operator: 'ne', value: 'free' }
      ];
      const result = buildFilterConditions(filters);
      expect(result).toBe("country = 'US' AND NOT mapContains(metadata, 'plan') OR metadata['plan'] != 'free'");
    });
  });

  describe('buildStandardCondition', () => {
    it('should handle equality operator', () => {
      const result = buildStandardCondition('country', 'eq', 'US');
      expect(result).toBe("country = 'US'");
    });

    it('should handle not equal operator', () => {
      const result = buildStandardCondition('browser_name', 'ne', 'Safari');
      expect(result).toBe("browser_name != 'Safari'");
    });

    it('should handle contains operator', () => {
      const result = buildStandardCondition('href', 'contains', '/dashboard');
      expect(result).toBe("like(href, '%/dashboard%')");
    });

    it('should handle startsWith operator', () => {
      const result = buildStandardCondition('href', 'startsWith', 'https://');
      expect(result).toBe("like(href, 'https://%')");
    });

    it('should handle endsWith operator', () => {
      const result = buildStandardCondition('href', 'endsWith', '.pdf');
      expect(result).toBe("like(href, '%.pdf')");
    });

    it('should handle greater than operator', () => {
      const result = buildStandardCondition('event_count', 'gt', 5);
      expect(result).toBe('event_count > 5');
    });

    it('should handle in operator with array', () => {
      const result = buildStandardCondition('country', 'in', ['US', 'CA', 'MX']);
      expect(result).toBe("country IN ('US', 'CA', 'MX')");
    });

    it('should handle numeric values', () => {
      const result = buildStandardCondition('session_duration_minutes', 'gte', 30);
      expect(result).toBe('session_duration_minutes >= 30');
    });

    it('should handle boolean values', () => {
      const result = buildStandardCondition('is_active', 'eq', true);
      expect(result).toBe('is_active = 1');
    });
  });

  describe('buildMetadataCondition', () => {
    it('should handle metadata equality', () => {
      const result = buildMetadataCondition('plan', 'eq', 'premium');
      expect(result).toBe("mapContains(metadata, 'plan') AND metadata['plan'] = 'premium'");
    });

    it('should handle metadata contains', () => {
      const result = buildMetadataCondition('campaign', 'contains', 'summer');
      expect(result).toBe("mapContains(metadata, 'campaign') AND like(metadata['campaign'], '%summer%')");
    });

    it('should handle metadata numeric comparison', () => {
      const result = buildMetadataCondition('score', 'gt', 80);
      expect(result).toBe("mapContains(metadata, 'score') AND toFloat64OrNull(metadata['score']) > 80");
    });

    it('should handle metadata in operator', () => {
      const result = buildMetadataCondition('category', 'in', ['tech', 'finance']);
      expect(result).toBe("mapContains(metadata, 'category') AND metadata['category'] IN ('tech', 'finance')");
    });
  });

  describe('escapeColumnName', () => {
    it('should accept valid column names', () => {
      expect(escapeColumnName('country')).toBe('country');
      expect(escapeColumnName('visitor_id')).toBe('visitor_id');
      expect(escapeColumnName('last_activity')).toBe('last_activity');
    });

    it('should reject invalid column names', () => {
      expect(() => escapeColumnName('invalid-column')).toThrow('Invalid column name: invalid-column');
      expect(() => escapeColumnName('123column')).toThrow('Invalid column name: 123column');
      expect(() => escapeColumnName('column; DROP TABLE')).toThrow('Invalid column name: column; DROP TABLE');
    });
  });

  describe('escapeValue', () => {
    it('should escape strings properly', () => {
      expect(escapeValue('hello')).toBe("'hello'");
      expect(escapeValue("O'Reilly")).toBe("'O\\'Reilly'");
      expect(escapeValue("test's test")).toBe("'test\\'s test'");
    });

    it('should handle numbers', () => {
      expect(escapeValue(42)).toBe('42');
      expect(escapeValue(3.14)).toBe('3.14');
    });

    it('should handle booleans', () => {
      expect(escapeValue(true)).toBe('1');
      expect(escapeValue(false)).toBe('0');
    });

    it('should reject unsupported types', () => {
      expect(() => escapeValue({})).toThrow('Unsupported value type: object');
      expect(() => escapeValue(null)).toThrow('Unsupported value type: object');
    });
  });

  describe('escapeArrayValue', () => {
    it('should escape arrays properly', () => {
      const result = escapeArrayValue(['US', 'CA', 'MX']);
      expect(result).toBe("'US', 'CA', 'MX'");
    });

    it('should handle mixed string arrays', () => {
      const result = escapeArrayValue(["O'Reilly", "test's"]);
      expect(result).toBe("'O\\'Reilly', 'test\\'s'");
    });

    it('should handle numeric arrays', () => {
      const result = escapeArrayValue([1, 2, 3]);
      expect(result).toBe('1, 2, 3');
    });

    it('should reject non-arrays', () => {
      expect(() => escapeArrayValue('not an array')).toThrow('Value must be an array for IN/NIN operations');
      expect(() => escapeArrayValue(123)).toThrow('Value must be an array for IN/NIN operations');
    });
  });
});

describe('Integration Tests', () => {
  describe('Complex filter combinations', () => {
    it('should handle multiple standard and metadata filters', () => {
      const filters = [
        { key: 'country', operator: 'eq', value: 'US' },
        { key: 'browser_name', operator: 'contains', value: 'Chrome' },
        { key: 'metadata.plan', operator: 'eq', value: 'premium' },
        { key: 'metadata.score', operator: 'gte', value: 75 },
        { key: 'session_duration_minutes', operator: 'gt', value: 10 }
      ];
      
      const result = buildFilterConditions(filters);
      
      // Check that all conditions are included
      expect(result).toContain("country = 'US'");
      expect(result).toContain("like(browser_name, '%Chrome%')");
      expect(result).toContain("mapContains(metadata, 'plan') AND metadata['plan'] = 'premium'");
      expect(result).toContain("mapContains(metadata, 'score') AND toFloat64OrNull(metadata['score']) >= 75");
      expect(result).toContain("session_duration_minutes > 10");
      
      // Check that conditions are joined with AND
      expect(result.split(' AND ').length).toBe(5);
    });

    it('should handle complex array filters', () => {
      const filters = [
        { key: 'country', operator: 'in', value: ['US', 'CA', 'MX'] },
        { key: 'metadata.category', operator: 'nin', value: ['spam', 'blocked'] },
        { key: 'browser_name', operator: 'ne', value: 'Internet Explorer' }
      ];
      
      const result = buildFilterConditions(filters);
      
      expect(result).toContain("country IN ('US', 'CA', 'MX')");
      expect(result).toContain("mapContains(metadata, 'category') AND metadata['category'] NOT IN ('spam', 'blocked')");
      expect(result).toContain("browser_name != 'Internet Explorer'");
    });
  });
});
