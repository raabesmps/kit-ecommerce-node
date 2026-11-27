import { randomInt } from 'node:crypto';

/*
 * GERADOR DE SENHA
 * Melhorias em relação ao código da aula:
 * - usa crypto.randomInt (criptograficamente seguro) em vez de Math.random;
 * - se nenhum tipo de caractere estiver ligado, avisa com um erro claro
 *   (na aula a senha saía "undefinedundefined...");
 * - garante pelo menos 1 caractere de cada tipo ligado;
 * - calcula a força da senha (entropia em bits).
 */

export const CHARSETS = Object.freeze({
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  special: '!@#$%^&*()-_=+[]{};:,.?',
});

/** Devolve os conjuntos de caracteres ligados na configuração. */
export function permittedCharsets(options) {
  const sets = Object.keys(CHARSETS).filter((key) => options[key]).map((key) => CHARSETS[key]);
  if (sets.length === 0) {
    throw new Error('Ligue pelo menos um tipo de caractere no .env (UPPERCASE_LETTERS, LOWERCASE_LETTERS, NUMBERS ou SPECIAL_CHARACTERS).');
  }
  return sets;
}

/** Embaralha com Fisher-Yates usando aleatoriedade segura. */
function shuffle(chars, random) {
  for (let i = chars.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars;
}

/**
 * Gera uma senha.
 * @param {{ length: number, uppercase: boolean, lowercase: boolean, numbers: boolean, special: boolean }} options
 * @param {(max: number) => number} [random] gerador de inteiros em [0, max) (injetável nos testes)
 */
export function generatePassword(options, random = randomInt) {
  const sets = permittedCharsets(options);
  if (options.length < sets.length) {
    throw new Error(`Com ${sets.length} tipos de caractere ligados, a senha precisa ter pelo menos ${sets.length} caracteres.`);
  }

  const pool = sets.join('');
  const pickFrom = (set) => set[random(set.length)];

  const chars = sets.map(pickFrom); // 1 de cada tipo ligado
  while (chars.length < options.length) chars.push(pickFrom(pool));
  return shuffle(chars, random).join('');
}

/** Força estimada: log2(tamanho do alfabeto) × comprimento. */
export function passwordStrength(options) {
  const poolSize = permittedCharsets(options).join('').length;
  const bits = Math.round(options.length * Math.log2(poolSize));
  const level = bits >= 100 ? 'muito forte' : bits >= 75 ? 'forte' : bits >= 50 ? 'razoável' : 'fraca';
  return { bits, level };
}
