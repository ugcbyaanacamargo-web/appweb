import { describe, expect, it } from 'vitest';
import { validateMissionEvidenceFiles } from './missionEvidence';

const image = (name: string, type: string, size: number) => ({ name, type, size });

describe('mission evidence validation', () => {
  it('accepts up to three supported images within 5 MB each', () => {
    expect(() => validateMissionEvidenceFiles([
      image('a.jpg', 'image/jpeg', 1_000_000),
      image('b.png', 'image/png', 2_000_000),
      image('c.webp', 'image/webp', 3_000_000)
    ])).not.toThrow();
  });

  it('rejects more than three files', () => {
    expect(() => validateMissionEvidenceFiles([
      image('1.jpg', 'image/jpeg', 1),
      image('2.jpg', 'image/jpeg', 1),
      image('3.jpg', 'image/jpeg', 1),
      image('4.jpg', 'image/jpeg', 1)
    ])).toThrow(/no máximo 3/i);
  });

  it('rejects files larger than 5 MB', () => {
    expect(() => validateMissionEvidenceFiles([
      image('big.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1)
    ])).toThrow(/5 MB/i);
  });

  it('rejects unsupported image formats', () => {
    expect(() => validateMissionEvidenceFiles([
      image('x.svg', 'image/svg+xml', 100)
    ])).toThrow(/formato/i);
  });
});
