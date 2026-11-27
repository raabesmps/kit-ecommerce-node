/*
 * VALIDAÇÃO DE CHAVES PIX
 * Tipos aceitos: CPF, CNPJ (numérico ou alfanumérico), e-mail, telefone (+55) e chave aleatória (EVP).
 */

const onlyDigits = (s) => s.replace(/\D/g, '');

export function isValidCPF(value) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

/**
 * CNPJ numérico ou alfanumérico (Receita Federal, a partir de julho de 2026):
 * 12 caracteres [0-9A-Z] + 2 dígitos verificadores. Cada caractere vale (código ASCII - 48).
 */
export function isValidCNPJ(value) {
  const cnpj = String(value).toUpperCase().replace(/[.\-/\s]/g, '');
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const digit = (len) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + (cnpj.charCodeAt(i) - 48) * w, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return digit(12) === Number(cnpj[12]) && digit(13) === Number(cnpj[13]);
}

const EVP = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Descobre o tipo da chave e devolve no formato que vai no Pix.
 * @returns {{ type: 'cpf'|'cnpj'|'email'|'telefone'|'aleatoria', key: string, label: string }}
 */
export function parsePixKey(input) {
  const raw = String(input ?? '').trim();
  if (!raw) throw new Error('Digite a chave Pix.');

  if (EVP.test(raw)) return { type: 'aleatoria', key: raw.toLowerCase(), label: 'chave aleatória' };

  if (raw.includes('@')) {
    const email = raw.toLowerCase();
    if (!EMAIL.test(email) || email.length > 77) throw new Error('E-mail inválido para chave Pix.');
    return { type: 'email', key: email, label: 'e-mail' };
  }

  if (raw.startsWith('+')) {
    const phone = `+${onlyDigits(raw)}`;
    if (!/^\+55\d{10,11}$/.test(phone)) throw new Error('Telefone deve estar no formato +55 DDD número, ex.: +55 11 91234-5678.');
    return { type: 'telefone', key: phone, label: 'telefone' };
  }

  const compact = raw.toUpperCase().replace(/[.\-/\s]/g, '');
  if (/^\d{11}$/.test(compact)) {
    if (!isValidCPF(compact)) throw new Error('CPF inválido. Se for telefone, digite com +55 na frente.');
    return { type: 'cpf', key: compact, label: 'CPF' };
  }
  if (/^[0-9A-Z]{14}$/.test(compact)) {
    if (!isValidCNPJ(compact)) throw new Error('CNPJ inválido.');
    return { type: 'cnpj', key: compact, label: 'CNPJ' };
  }

  throw new Error('Não reconheci a chave. Use CPF, CNPJ, e-mail, telefone (+55...) ou chave aleatória.');
}
