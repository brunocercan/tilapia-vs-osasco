import { describe, expect, it } from 'vitest';
import { sanitizePlayerName, PLAYER_NAME_MAX_LENGTH } from '../src/utils/sanitize';

describe('sanitizePlayerName (SPEC-TECNICA §7)', () => {
  it('mantém um nome normal', () => {
    expect(sanitizePlayerName('Bruno')).toBe('Bruno');
  });

  it('remove tags HTML', () => {
    expect(sanitizePlayerName('<b>Tilapia</b>')).toBe('Tilapia');
    expect(sanitizePlayerName('<script>alert(1)</script>Kiki')).toBe('alert(1) Kiki');
  });

  it('remove caracteres perigosos', () => {
    expect(sanitizePlayerName('Pedro"\'`\\{}')).toBe('Pedro'); // só caracteres perigosos
    expect(sanitizePlayerName('Ana<tag>Silva')).toBe('Ana Silva'); // tag vira espaço
    expect(sanitizePlayerName('a<b>c')).toBe('a c'); // <b> é tratada como tag real
  });

  it('limita a 16 caracteres', () => {
    expect(sanitizePlayerName('umNomeMuitoMuitoGrandeMesmo')).toHaveLength(PLAYER_NAME_MAX_LENGTH);
    expect(sanitizePlayerName('umNomeMuitoMuitoGrandeMesmo')).toBe('umNomeMuitoMuito');
  });

  it('normaliza espaços e apara pontas', () => {
    expect(sanitizePlayerName('  Tilápia   Maluca  ')).toBe('Tilápia Maluca');
  });

  it('pode resultar em vazio (quem decide o padrão é a UI)', () => {
    expect(sanitizePlayerName('<><><>')).toBe('');
  });
});
