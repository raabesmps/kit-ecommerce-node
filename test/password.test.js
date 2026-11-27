import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHARSETS, generatePassword, passwordStrength } from '../src/tools/password/service.js';

const ALL = { length: 16, uppercase: true, lowercase: true, numbers: true, special: true };
const has = (password, set) => [...password].some((c) => set.includes(c));

test('gera senha com o tamanho configurado', () => {
  for (const length of [4, 12, 64]) assert.equal(generatePassword({ ...ALL, length }).length, length);
});

test('tem pelo menos um caractere de cada tipo ligado', () => {
  for (let i = 0; i < 200; i++) {
    const password = generatePassword({ ...ALL, length: 4 });
    assert.ok(has(password, CHARSETS.uppercase), password);
    assert.ok(has(password, CHARSETS.lowercase), password);
    assert.ok(has(password, CHARSETS.numbers), password);
    assert.ok(has(password, CHARSETS.special), password);
  }
});

test('só usa os tipos ligados (config da aula: números e símbolos)', () => {
  const options = { length: 12, uppercase: false, lowercase: false, numbers: true, special: true };
  for (let i = 0; i < 100; i++) {
    const password = generatePassword(options);
    assert.ok(!has(password, CHARSETS.uppercase + CHARSETS.lowercase), password);
  }
});

test('com tudo desligado dá erro claro (na aula saía "undefined...")', () => {
  assert.throws(
    () => generatePassword({ length: 12, uppercase: false, lowercase: false, numbers: false, special: false }),
    /Ligue pelo menos um tipo/,
  );
});

test('senhas seguidas são diferentes', () => {
  const set = new Set(Array.from({ length: 50 }, () => generatePassword(ALL)));
  assert.equal(set.size, 50);
});

test('o gerador aleatório é injetável (resultado previsível nos testes)', () => {
  const zero = () => 0;
  assert.equal(generatePassword({ length: 4, uppercase: false, lowercase: false, numbers: true, special: false }, zero), '0000');
});

test('mede a força da senha', () => {
  assert.equal(passwordStrength(ALL).level, 'muito forte');
  assert.equal(passwordStrength({ length: 6, uppercase: false, lowercase: false, numbers: true, special: false }).level, 'fraca');
});
