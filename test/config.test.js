import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readConfig } from '../src/config/env.js';

test('sem variáveis, usa padrões seguros', () => {
  const config = readConfig({});
  assert.equal(config.password.length, 16);
  assert.ok(config.password.uppercase && config.password.lowercase && config.password.numbers && config.password.special);
  assert.equal(config.qrcode.outputDir, 'qrcodes');
});

test('lê os valores do .env da aula', () => {
  const config = readConfig({
    UPPERCASE_LETTERS: 'false',
    LOWERCASE_LETTERS: 'false',
    NUMBERS: 'true',
    SPECIAL_CHARACTERS: 'true',
    PASSWORD_LENGTH: '12',
  });
  assert.deepEqual({ ...config.password }, { length: 12, uppercase: false, lowercase: false, numbers: true, special: true });
});

test('rejeita valores inválidos com mensagem clara', () => {
  assert.throws(() => readConfig({ PASSWORD_LENGTH: 'doze' }), /PASSWORD_LENGTH/);
  assert.throws(() => readConfig({ PASSWORD_LENGTH: '2' }), /entre 4 e 128/);
  assert.throws(() => readConfig({ NUMBERS: 'talvez' }), /NUMBERS precisa ser true ou false/);
});
