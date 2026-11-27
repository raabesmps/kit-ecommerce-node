import { parsePixKey } from './keys.js';

/*
 * PIX COPIA E COLA (BR Code estático)
 * Segue o padrão EMV-QRCPS do Manual de Padrões para Iniciação do Pix (Banco Central).
 * Cada campo é: ID (2 dígitos) + TAMANHO (2 dígitos) + VALOR.
 * No final vai um CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF) de tudo.
 */

/** Monta um campo EMV: id + tamanho com 2 dígitos + valor. */
export function field(id, value) {
  const v = String(value);
  if (v.length > 99) throw new Error(`Campo ${id} passou de 99 caracteres.`);
  return `${id}${String(v.length).padStart(2, '0')}${v}`;
}

/** CRC16-CCITT-FALSE, em 4 dígitos hexadecimais maiúsculos. */
export function crc16(payload) {
  let crc = 0xffff;
  for (const byte of Buffer.from(payload, 'utf8')) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Remove acentos e caracteres fora do padrão, e corta no tamanho máximo. */
export function sanitize(text, max) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 .,\-@/]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
    .trim();
}

/** Aceita "10", "10,5", "1.234,56" ou "10.50" e devolve "10.50". */
export function parseAmount(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return null;
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error(`Valor inválido: "${raw}". Use, por exemplo, 49,90.`);
  const cents = Math.round(Number(normalized) * 100);
  if (cents <= 0) throw new Error('O valor precisa ser maior que zero.');
  const amount = (cents / 100).toFixed(2);
  if (amount.length > 13) throw new Error('Valor alto demais para um Pix.');
  return amount;
}

/**
 * Gera o Pix copia e cola.
 * @param {{ key: string, name: string, city: string, amount?: string|number, description?: string, txid?: string }} data
 * @returns {{ payload: string, key: object, amount: string|null, name: string, city: string, txid: string }}
 */
export function createPixPayload({ key, name, city, amount, description, txid }) {
  const pixKey = parsePixKey(key);
  const merchantName = sanitize(name, 25);
  const merchantCity = sanitize(city, 15);
  if (!merchantName) throw new Error('Informe o nome de quem recebe.');
  if (!merchantCity) throw new Error('Informe a cidade de quem recebe.');

  const value = amount === undefined || amount === null || amount === '' ? null : parseAmount(amount);
  const id = txid ? String(txid).trim() : '***';
  if (id !== '***' && !/^[A-Za-z0-9]{1,25}$/.test(id)) throw new Error('O identificador (txid) aceita só letras e números, até 25.');

  // Campo 26: GUI do Pix + chave + descrição (o campo inteiro tem no máximo 99 caracteres).
  const gui = field('00', 'br.gov.bcb.pix') + field('01', pixKey.key);
  const room = 99 - gui.length - 4;
  const info = room > 0 ? sanitize(description, room) : '';
  const merchantAccount = gui + (info ? field('02', info) : '');

  const withoutCrc = [
    field('00', '01'),
    field('26', merchantAccount),
    field('52', '0000'),
    field('53', '986'),
    value ? field('54', value) : '',
    field('58', 'BR'),
    field('59', merchantName),
    field('60', merchantCity),
    field('62', field('05', id)),
    '6304',
  ].join('');

  return { payload: withoutCrc + crc16(withoutCrc), key: pixKey, amount: value, name: merchantName, city: merchantCity, txid: id };
}

/** Lê um payload campo a campo (usado nos testes e para conferir o que foi gerado). */
export function parsePayload(payload) {
  const fields = {};
  let i = 0;
  while (i < payload.length) {
    const id = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    fields[id] = payload.slice(i + 4, i + 4 + len);
    i += 4 + len;
  }
  return fields;
}
