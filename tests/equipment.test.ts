import { describe, expect, it } from 'vitest';
import { EquipmentSystem } from '../src/systems/EquipmentSystem';
import { StatusEffectSystem } from '../src/systems/StatusEffectSystem';
import { PassiveSystem } from '../src/systems/PassiveSystem';
import { rollAttack } from '../src/systems/CombatSystem';
import { StatusEffectType } from '../src/entities/StatusEffect';
import { EQUIPMENTS, EQUIPMENT_BY_ID } from '../src/data/equipment';
import { RandomService } from '../src/services/RandomService';
import { CHARACTERS } from '../src/data/characters';
import { createPlayerFighter } from '../src/entities/fighterFactory';

function equip(id: string) {
  const def = EQUIPMENT_BY_ID.get(id);
  if (!def) throw new Error(`Equipamento ${id} não encontrado`);
  return def;
}

function kiki() {
  return createPlayerFighter(CHARACTERS[0]);
}

describe('Catálogo de equipamentos (SPEC-JOGO §4/§14)', () => {
  it('possui os 18 equipamentos da especificação', () => {
    expect(EQUIPMENTS).toHaveLength(18);
  });

  it('sorteia 2 opções distintas de recompensa', () => {
    const options = EquipmentSystem.rollOptions(new RandomService());
    expect(options).toHaveLength(2);
    expect(options[0].id).not.toBe(options[1].id);
    for (const option of options) {
      expect(EQUIPMENTS).toContain(option);
    }
  });
});

describe('EquipmentSystem — aplicação e regras do §5', () => {
  it('aplica modificadores percentuais multiplicativos (Tadalinha)', () => {
    const fighter = kiki();
    EquipmentSystem.apply(fighter, equip('tadalinha'));
    expect(fighter.stats.attackSpeed).toBeCloseTo(1.0 * 1.05, 3);
  });

  it('aplica chances como pontos percentuais aditivos (Óculos Escuros)', () => {
    const fighter = kiki(); // esquiva base 5
    EquipmentSystem.apply(fighter, equip('oculos-escuros'));
    expect(fighter.stats.dodgeChance).toBe(13);
  });

  it('respeita os tetos globais: esquiva 50%, crítico 60%, vel. ataque +100%', () => {
    const fighter = kiki();
    for (let i = 0; i < 10; i++) {
      EquipmentSystem.apply(fighter, equip('tadalinha'));
      fighter.equipped.shift(); // ignora limite de slots para o teste de teto
    }
    expect(fighter.stats.attackSpeed).toBeLessThanOrEqual(fighter.baseStats.attackSpeed * 2);

    fighter.stats.dodgeChance = 80;
    fighter.stats.critChance = 80;
    EquipmentSystem.clampGlobalCaps(fighter);
    expect(fighter.stats.dodgeChance).toBe(50);
    expect(fighter.stats.critChance).toBe(60);
  });

  it('Marmita Premium não acumula consigo mesma', () => {
    const fighter = kiki();
    expect(EquipmentSystem.apply(fighter, equip('marmita-premium'))).not.toBeNull();
    expect(EquipmentSystem.apply(fighter, equip('marmita-premium'))).toBeNull();
    expect(fighter.equipped).toHaveLength(1);
  });

  it('respeita o limite de 2 slots por personagem', () => {
    const fighter = kiki();
    EquipmentSystem.apply(fighter, equip('tadalinha'));
    EquipmentSystem.apply(fighter, equip('queijo'));
    expect(EquipmentSystem.apply(fighter, equip('olympus-burguer'))).toBeNull();
    expect(fighter.equipped).toHaveLength(2);
  });
});

describe('Gatilhos de equipamento', () => {
  it('RetardPocket: SLOW reduz vel. de ataque em 20% e reverte ao expirar', () => {
    const fighter = kiki();
    const def = equip('retardpocket');
    const onHit = def.onHitEffects?.[0];
    expect(onHit?.kind).toBe('STATUS');

    const before = fighter.stats.attackSpeed;
    if (onHit?.kind === 'STATUS') {
      StatusEffectSystem.addEffect(fighter, { ...onHit.effect });
      expect(fighter.stats.attackSpeed).toBeCloseTo(before * 0.8, 5);
      new StatusEffectSystem().update([fighter], 2.5); // expira
      expect(fighter.stats.attackSpeed).toBeCloseTo(before, 5);
    }
  });

  it('Teclado Mecânico: a cada 10 ataques o próximo recebe +50%', () => {
    const fighter = kiki();
    EquipmentSystem.apply(fighter, equip('teclado-mecanico'));
    const system = new EquipmentSystem();

    const bonuses: number[] = [];
    for (let attack = 1; attack <= 21; attack++) {
      bonuses.push(system.rollAttackBonusPercent(fighter));
    }
    expect(bonuses[10]).toBe(50); // 11º ataque
    expect(bonuses[20]).toBe(50); // 21º ataque
    expect(bonuses.filter((b) => b === 0)).toHaveLength(19);
  });

  it('Teclado Mecânico: o bônus aumenta o dano do ataque', () => {
    const rng = new RandomService(() => 0.99); // sem esquiva/crítico
    const normal = rollAttack(kiki().stats, kiki().stats, rng, 0);
    const boosted = rollAttack(kiki().stats, kiki().stats, rng, 50);
    expect(boosted.damage).toBeGreaterThan(normal.damage);
  });

  it('Corotinho: abaixo de 30% HP ganha +5% vel. de ataque por 5s, cooldown 15s', () => {
    const fighter = kiki();
    EquipmentSystem.apply(fighter, equip('corotinho'));
    const system = new EquipmentSystem();
    fighter.hp = fighter.stats.maxHp * 0.2;

    const before = fighter.stats.attackSpeed;
    system.update([fighter], 0.016);
    expect(fighter.stats.attackSpeed).toBeCloseTo(before * 1.05, 5);
    expect(fighter.hasStatus(StatusEffectType.Frenzy)).toBe(true);

    // Dentro do cooldown, não reaplica
    system.update([fighter], 0.016);
    const count = fighter.statusEffects.filter((e) => e.type === StatusEffectType.Frenzy).length;
    expect(count).toBe(1);

    // Ao expirar o buff, a velocidade volta
    new StatusEffectSystem().update([fighter], 6);
    expect(fighter.stats.attackSpeed).toBeCloseTo(before, 5);
  });

  it('Marmita de Ontem: cura 15% ao cair abaixo de 50%, uma vez por batalha', () => {
    const fighter = kiki();
    EquipmentSystem.apply(fighter, equip('marmita-ontem'));
    const system = new EquipmentSystem();

    fighter.hp = Math.floor(fighter.stats.maxHp * 0.4);
    const hpBefore = fighter.hp;
    system.update([fighter], 0.016);
    const expectedHeal = Math.round(fighter.stats.maxHp * 0.15);
    expect(fighter.hp).toBe(hpBefore + expectedHeal);

    // Segunda queda na mesma batalha: não cura de novo
    fighter.hp = Math.floor(fighter.stats.maxHp * 0.3);
    system.update([fighter], 0.016);
    expect(fighter.hp).toBe(Math.floor(fighter.stats.maxHp * 0.3));
  });

  it('Copão de Refri: cura 3 HP ao derrotar um inimigo, sem passar do máximo', () => {
    const fighter = kiki();
    EquipmentSystem.apply(fighter, equip('copao-refri'));
    const system = new EquipmentSystem();

    fighter.hp = fighter.stats.maxHp - 2;
    system.onEnemyKilled(fighter);
    expect(fighter.hp).toBe(fighter.stats.maxHp); // limitado ao máximo
  });

  it('Queijo: regeneração passa de +2 para +4 HP/s abaixo de 40% de HP', () => {
    const fighter = kiki();
    EquipmentSystem.apply(fighter, equip('queijo'));
    const passives = new PassiveSystem();

    fighter.hp = fighter.stats.maxHp; // acima de 40%
    passives.update([fighter], 1.0);
    expect(fighter.hp).toBeLessThanOrEqual(fighter.stats.maxHp); // cheio: nada a curar

    fighter.hp = 20; // abaixo de 40%
    passives.update([fighter], 1.0);
    expect(fighter.hp).toBe(24); // +4/s
  });
});
