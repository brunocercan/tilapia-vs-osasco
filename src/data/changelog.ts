/**
 * Changelog do jogo — atualize a cada versão, mais recente primeiro.
 * Exibido na tela inicial ("Ver novidades") — apenas as 5 primeiras
 * entradas aparecem, mas o histórico completo fica registrado aqui.
 */
export const CHANGELOG: readonly string[] = [
  'v1.6.2: tilápia pixel art como ícone da aba e favorito ★',
  'v1.6.1: segurança do rank — envio passa por validação no servidor (Edge Function); apikey não grava mais direto',
  'v1.6.0: modo infinito BASTANTE mais difícil — inimigos ganham +50% HP/dano por fase infinita',
  'v1.6.0: Mini-Kirk muito mais comum no infinito e podem vir vários juntos!',
  'v1.6.0: opção de pular a recompensa (slots cheios? manter itens atuais)',
  'v1.5.2: passivas de combate mais fortes — Veneno 17%, Confusão 16%, Esquiva +15%, Bomba 16%',
  'v1.5.1: no rank, run que entrou no modo infinito conta como vitória 🏆',
  'v1.5.0: Tombas nerfado — HP 110 e Marmita vira janela de regen (3s a cada 8s)',
  'v1.5.0: Kiki, Veronezio, Marcola e Mattioni com +15% em todos os stats',
  'v1.4.2: trilhas separadas — cada lane luta com a própria; lane vazia migra até o alvo',
  'v1.4.1: "Como Jogar" e "Novidades" com rolagem — botão Voltar sempre visível',
  'v1.4.0: MINI-KIRK ★ — sub-chefe surpresa no meio de qualquer fase (XP gorda!)',
  'v1.3.1: contador de PONTOS ao vivo no HUD da batalha (com multiplicador)',
  'v1.3.0: modo infinito ∞ — continue a run após as 3 fases, inimigos mais fortes a cada ciclo',
  'v1.3.0: substitua itens com slots cheios para manter acumulando',
  'v1.3.0: limite de score do ranking ampliado para 100.000',
  'v1.2.0: itens LENDÁRIOS ★ — chance ao subir de nível ou derrotar o boss',
  'v1.2.0: passivas dos personagens +~15% (jogo ainda estava difícil)',
  'v1.1.0: score só por inimigos derrotados × multiplicador de sobrevivência (+0,1/min vivo)',
  'v1.1.0: level up cura a vida total e renasce personagem morto',
  'v1.1.0: corrigido envio ao ranking (nome digitado não chegava ao jogo)',
  'v1.0.0-balance: HP +15-20% e passivas bufadas (jogo estava difícil)',
  'Ranking: campo de nome agora só na tela de resultado',
  'Removido easter egg a pedido',
  'Bosses e waves completos, Supabase online',
];
