import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildFileName, normalizeLink, saveToFile, toTerminal } from '../src/tools/qrcode/service.js';

test('completa o link com https://', () => {
  assert.equal(normalizeLink('loja.exemplo.com.br/produto/42'), 'https://loja.exemplo.com.br/produto/42');
  assert.equal(normalizeLink('  http://loja.com  '), 'http://loja.com/');
});

test('rejeita o que não é link http(s)', () => {
  for (const bad of ['', '   ', 'oi', 'ftp://arquivos.com', 'javascript:alert(1)']) {
    assert.throws(() => normalizeLink(bad), undefined, bad);
  }
});

test('desenha o QR Code no terminal, normal e pequeno', async () => {
  const normal = await toTerminal('https://dio.me');
  const small = await toTerminal('https://dio.me', { small: true });
  assert.ok(normal.length > 0 && small.includes('▄'));
  assert.ok(small.split('\n').length < normal.split('\n').length);
});

test('monta um nome de arquivo legível', () => {
  const name = buildFileName('https://loja.exemplo.com.br/x', 'png', new Date('2026-11-27T15:30:00Z'));
  assert.equal(name, 'loja-exemplo-com-br-20261127-153000.png');
});

test('salva PNG e SVG', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'qr-'));
  try {
    const png = await saveToFile('https://dio.me', { dir, format: 'png' });
    const bytes = await readFile(png);
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');

    const svg = await saveToFile('https://dio.me', { dir, format: 'svg' });
    assert.match(await readFile(svg, 'utf8'), /<svg/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
