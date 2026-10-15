import { describe, expect, it } from 'vitest';
import { createPlayerFighter } from '../src/entities/fighterFactory';
import { Fighter } from '../src/entities/Fighter';
import { PassiveSystem } from '../src/systems/PassiveSystem';
import { CombatSystem } from '../src/systems/CombatSystem';
import { MovementSystem } from '../src/systems/MovementSystem';
import { StatusEffectSystem } from '../src/systems/StatusEffectSystem';
import { StatusEffectType } from '../src/entities/StatusEffect';
import { RandomService } from '../src/services/RandomService';
import { CHARACTERS } from '../src/data/characters';
import { PERNILONGO, CAPIVARA_NERVOSA } from '../src/data/enemies';
import { BALANCE } from '../src/data/balance';

const charById = (id: string) => {
  const found = CHARACTERS.find((c) => c.id === id);
  if (!found) throw new Error(`Personagem ${id} não encontrado`);
  return found;
};

describe('Passivas dos personagens (SPEC-JOGO §3)', () => {
  it('Moscowitta (Kiki): 3% de chance de Veneno, 3 dano/s por 3s', () => {
    const kiki = createPlayerFighter(charById('kiki'));
    const veneno = kiki.onHitEffects.find((e) => e.kind === 'STATUS');
    expect(veneno).toBeDefined();
    expect(veneno?.chance).toBe(BALANCE.effects.moscowitta.chance); // 3
    if (veneno?.kind === 'STATUS') {
      expect(veneno.effect.type).toBe(StatusEffectType.Poison);
      expect(veneno.effect.duration).toBe(3);
      expect(veneno.effect.magnitude).toBe(3); // 3 dano por tick de 1s
    }
  });

  it('Cigarro (Veronezio): +5% de esquiva', () => {
    const veronezio = createPlayerFighter(charById('veronezio'));
    expect(veronezio.stats.dodgeChance).toBe(
      charById('veronezio').baseStats.dodgeChance + BALANCE.effects.cigarro.bonusDodgeChance,
    );
  });

  it('Marmita (Tombas): regenera +3 HP por segundo, sem ultrapassar o máximo', () => {
    const tombas = createPlayerFighter(charById('tombas'));
    tombas.hp = 50;
    const system = new PassiveSystem();

    system.update([tombas], 1.0); // 1s → acumula 3 → cura 3
    expect(tombas.hp).toBe(53);

    tombas.hp = tombas.stats.maxHp - 1;
    system.update([tombas], 1.0); // cura limitada ao máximo
    expect(tombas.hp).toBe(tombas.stats.maxHp);
  });

  it('Marmita: não cura personagem morto', () => {
    const tombas = createPlayerFighter(charById('tombas'));
    tombas.hp = 0;
    new PassiveSystem().update([tombas], 1.0);
    expect(tombas.hp).toBe(0);
  });

  it('Beckzito (Marcola): inimigo confuso mira nos próprios aliados', () => {
    const pernilongo = new Fighter(PERNILONGO, 'ENEMY', 'e-1');
    pernilongo.x = 500;
    const capivara = new Fighter(CAPIVARA_NERVOSA, 'ENEMY', 'e-2');
    capivara.x = 560;
    const player = createPlayerFighter(charById('kiki'));
    player.x = 100;

    StatusEffectSystem.addEffect(pernilongo, {
      type: StatusEffectType.Confusion,
      duration: 2,
      magnitude: 0,
    });

    new MovementSystem().update([pernilongo, capivara, player], 0.016, { minX: 16, maxX: 1000 });
    expect(pernilongo.targetId).toBe('e-2'); // aliado próximo, não o jogador
  });

  it('Beckzito: confusão expira após 2 segundos', () => {
    const pernilongo = new Fighter(PERNILONGO, 'ENEMY', 'e-1');
    StatusEffectSystem.addEffect(pernilongo, {
      type: StatusEffectType.Confusion,
      duration: BALANCE.effects.beckzito.duration,
      magnitude: 0,
    });
    new StatusEffectSystem().update([pernilongo], 2.5);
    expect(pernilongo.hasStatus(StatusEffectType.Confusion)).toBe(false);
  });

  it('Bomba Química (Mattioni): dano em área ao redor do alvo', () => {
    // Efeito com 100% de chance para teste determinístico
    const bombaCerta = new Fighter(
      charById('mattioni'),
      'PLAYER',
      'player-bomba',
      {
        onHitEffects: [
          { kind: 'AOE', chance: 100, damage: BALANCE.effects.bombaQuimica.damage, radiusPx: BALANCE.effects.bombaQuimica.radiusPx },
        ],
      },
    );
    bombaCerta.x = 100;

    const alvo = new Fighter(CAPIVARA_NERVOSA, 'ENEMY', 'e-1');
    alvo.x = 100 + bombaCerta.stats.range; // exatamente no alcance
    const pertoDoAlvo = new Fighter(PERNILONGO, 'ENEMY', 'e-2');
    pertoDoAlvo.x = alvo.x + 30; // dentro do raio da bomba
    const longe = new Fighter(PERNILONGO, 'ENEMY', 'e-3');
    longe.x = alvo.x + 300; // fora do raio

    const fighters = [bombaCerta, alvo, pertoDoAlvo, longe];
    const movement = new MovementSystem();
    const combat = new CombatSystem(new RandomService(() => 0.99)); // sem crítico, sem esquiva

    movement.update(fighters, 0, { minX: 16, maxX: 2000 });
    combat.update(fighters, 0.001);

    expect(alvo.hp).toBeLessThan(alvo.stats.maxHp); // ataque normal + bomba
    expect(pertoDoAlvo.hp).toBe(pertoDoAlvo.stats.maxHp - BALANCE.effects.bombaQuimica.damage); // só a bomba
    expect(longe.hp).toBe(longe.stats.maxHp); // fora do raio: ileso
  });
});
