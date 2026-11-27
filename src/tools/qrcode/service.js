import QRCode from 'qrcode';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

/*
 * GERADOR DE QR CODE
 * Como na aula: gera o QR Code no terminal, no tamanho normal ou pequeno.
 * Melhorias: valida o link e também salva o QR Code como imagem (PNG ou SVG),
 * pronta para ir numa etiqueta, embalagem ou vitrine.
 */

/**
 * Valida e normaliza o link. Aceita "minhaloja.com.br" e completa com https://.
 * @returns {string} link normalizado
 */
export function normalizeLink(input) {
  const raw = String(input ?? '').trim();
  if (!raw) throw new Error('Digite um link.');
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;

  let url;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error(`"${raw}" não parece um link válido.`);
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Use um link http ou https.');
  if (!url.hostname.includes('.') && url.hostname !== 'localhost') throw new Error(`"${raw}" não parece um link válido.`);
  return url.href;
}

/** Desenha o QR Code com caracteres, para mostrar no terminal. */
export function toTerminal(text, { small = false } = {}) {
  return QRCode.toString(text, { type: 'terminal', small, errorCorrectionLevel: 'M' });
}

/** Nome de arquivo legível: "loja-exemplo-com-br-20261127-153000.png". */
export function buildFileName(text, format, now = new Date()) {
  let base;
  try {
    base = new URL(text).hostname;
  } catch {
    base = 'qrcode';
  }
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'qrcode';
  const stamp = now.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  return `${slug}-${stamp}.${format}`;
}

/**
 * Salva o QR Code como imagem.
 * @param {string} text conteúdo do QR Code
 * @param {{ dir: string, format?: 'png' | 'svg' }} options
 * @returns {Promise<string>} caminho absoluto do arquivo criado
 */
export async function saveToFile(text, { dir, format = 'png' }) {
  if (!['png', 'svg'].includes(format)) throw new Error(`Formato não suportado: ${format}`);
  await mkdir(dir, { recursive: true });
  const file = resolve(join(dir, buildFileName(text, format)));
  await QRCode.toFile(file, text, { type: format, errorCorrectionLevel: 'M', margin: 2, width: 512 });
  return file;
}
