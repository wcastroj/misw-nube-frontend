import { IsoWeekPipe } from './iso-week.pipe';

describe('IsoWeekPipe', () => {
  let pipe: IsoWeekPipe;

  beforeEach(() => {
    pipe = new IsoWeekPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform standard ISO week string (YYYY-Www) to friendly Spanish text', () => {
    expect(pipe.transform('2026-W42')).toBe('Semana 42, 2026');
    expect(pipe.transform('2025-W05')).toBe('Semana 5, 2025');
    expect(pipe.transform('2024-W01')).toBe('Semana 1, 2024');
  });

  it('should handle null, undefined, and empty string safely', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('should return original value or safe string for malformed input', () => {
    expect(pipe.transform('invalid-week')).toBe('invalid-week');
    expect(pipe.transform('2026-12')).toBe('2026-12');
  });
});
