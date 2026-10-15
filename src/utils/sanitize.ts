/**
 * Sanitização do nome do jogador (SPEC-TECNICA §7 / SPEC-JOGO §11):
 * remove HTML/tags e caracteres perigosos, limita a 16 caracteres.
 */
export const PLAYER_NAME_MAX_LENGTH = 16;

export function sanitizePlayerName(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, ' ') // remove tags HTML
    .replace(/[<>"'&`\\{}]/g, '') // remove caracteres perigosos
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, PLAYER_NAME_MAX_LENGTH);
}
