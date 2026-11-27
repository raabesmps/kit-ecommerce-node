/*
 * CONFIGURAÇÃO
 * Lê o .env (se existir) com o carregador nativo do Node (process.loadEnvFile)
 * e transforma as variáveis em um objeto validado, com valores padrão seguros.
 * Nenhum outro módulo lê process.env diretamente: todos recebem a config daqui.
 */

const DEFAULTS = Object.freeze({
  PASSWORD_LENGTH: '16',
  UPPERCASE_LETTERS: 'true',
  LOWERCASE_LETTERS: 'true',
  NUMBERS: 'true',
  SPECIAL_CHARACTERS: 'true',
  QRCODE_OUTPUT_DIR: 'qrcodes',
});

export function loadEnvFile(path = '.env') {
  try {
    process.loadEnvFile(path);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false; // sem .env: seguimos com os padrões
    throw err;
  }
}

function parseBoolean(name, value) {
  const v = String(value).trim().toLowerCase();
  if (['true', '1', 'sim', 'yes'].includes(v)) return true;
  if (['false', '0', 'nao', 'não', 'no'].includes(v)) return false;
  throw new Error(`${name} precisa ser true ou false (veio "${value}").`);
}

function parseLength(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 4 || n > 128) {
    throw new Error(`PASSWORD_LENGTH precisa ser um número inteiro entre 4 e 128 (veio "${value}").`);
  }
  return n;
}

/** Monta a configuração a partir de um objeto de ambiente (process.env por padrão). */
export function readConfig(env = process.env) {
  const get = (key) => (env[key] === undefined || env[key] === '' ? DEFAULTS[key] : env[key]);

  return Object.freeze({
    password: Object.freeze({
      length: parseLength(get('PASSWORD_LENGTH')),
      uppercase: parseBoolean('UPPERCASE_LETTERS', get('UPPERCASE_LETTERS')),
      lowercase: parseBoolean('LOWERCASE_LETTERS', get('LOWERCASE_LETTERS')),
      numbers: parseBoolean('NUMBERS', get('NUMBERS')),
      special: parseBoolean('SPECIAL_CHARACTERS', get('SPECIAL_CHARACTERS')),
    }),
    qrcode: Object.freeze({
      outputDir: get('QRCODE_OUTPUT_DIR'),
    }),
  });
}
