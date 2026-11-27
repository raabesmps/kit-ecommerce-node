import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { crc16, createPixPayload, field, parseAmount, parsePayload, sanitize } from '../src/tools/pix/service.js';
import { isValidCNPJ, isValidCPF, parsePixKey } from '../src/tools/pix/keys.js';

// Exemplo do Manual de Padrões para Iniciação do Pix (Banco Central).
const MANUAL_EXAMPLE =
  '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D';

describe('BR Code', () => {
  test('CRC16 bate com o exemplo do manual do Banco Central', () => {
    assert.equal(crc16(MANUAL_EXAMPLE.slice(0, -4)), '1D3D');
  });

  test('gera exatamente o payload do exemplo do manual', () => {
    const { payload } = createPixPayload({
      key: '123e4567-e12b-12d1-a456-426655440000',
      name: 'Fulano de Tal',
      city: 'BRASILIA',
    });
    assert.equal(payload, MANUAL_EXAMPLE);
  });

  test('monta campos EMV com tamanho de 2 dígitos', () => {
    assert.equal(field('58', 'BR'), '5802BR');
    assert.throws(() => field('26', 'x'.repeat(100)));
  });

  test('inclui valor, descrição e identificador do pedido', () => {
    const { payload } = createPixPayload({
      key: 'loja@exemplo.com.br',
      name: 'Loja do Pião',
      city: 'São Paulo',
      amount: '49,90',
      description: 'Pedido 1234',
      txid: 'PED1234',
    });
    const fields = parsePayload(payload);
    assert.equal(fields['54'], '49.90');
    assert.equal(fields['59'], 'Loja do Piao');
    assert.equal(fields['60'], 'Sao Paulo');
    assert.deepEqual(parsePayload(fields['26']), { '00': 'br.gov.bcb.pix', '01': 'loja@exemplo.com.br', '02': 'Pedido 1234' });
    assert.equal(parsePayload(fields['62'])['05'], 'PED1234');
    assert.equal(fields['63'], crc16(payload.slice(0, -4)));
  });

  test('sem valor, o campo 54 não aparece (quem paga escolhe)', () => {
    const { payload } = createPixPayload({ key: 'loja@exemplo.com.br', name: 'Loja', city: 'Recife' });
    assert.equal(parsePayload(payload)['54'], undefined);
  });

  test('corta nome em 25 e cidade em 15 caracteres', () => {
    const r = createPixPayload({ key: 'a@b.co', name: 'Nome Muito Comprido De Uma Loja Grande', city: 'Cidade Com Nome Comprido' });
    assert.ok(r.name.length <= 25);
    assert.ok(r.city.length <= 15);
  });

  test('descrição longa é cortada para o campo 26 caber em 99', () => {
    const { payload } = createPixPayload({ key: 'a@b.co', name: 'Loja', city: 'Recife', description: 'x'.repeat(200) });
    assert.ok(parsePayload(payload)['26'].length <= 99);
  });

  test('rejeita identificador inválido', () => {
    assert.throws(() => createPixPayload({ key: 'a@b.co', name: 'L', city: 'C', txid: 'pedido #1' }), /txid/);
  });
});

describe('valor', () => {
  test('aceita formatos brasileiros e internacionais', () => {
    assert.equal(parseAmount('10'), '10.00');
    assert.equal(parseAmount('10,5'), '10.50');
    assert.equal(parseAmount('1.234,56'), '1234.56');
    assert.equal(parseAmount('10.50'), '10.50');
    assert.equal(parseAmount(''), null);
  });

  test('rejeita valor inválido, zero ou negativo', () => {
    for (const bad of ['abc', '0', '-5', '10,999']) assert.throws(() => parseAmount(bad), undefined, bad);
  });
});

describe('chaves Pix', () => {
  test('valida CPF', () => {
    assert.equal(isValidCPF('529.982.247-25'), true);
    assert.equal(isValidCPF('529.982.247-24'), false);
    assert.equal(isValidCPF('111.111.111-11'), false);
  });

  test('valida CNPJ numérico e alfanumérico', () => {
    assert.equal(isValidCNPJ('11.222.333/0001-81'), true);
    assert.equal(isValidCNPJ('12.ABC.345/01DE-35'), true); // exemplo da Receita Federal
    assert.equal(isValidCNPJ('11.222.333/0001-82'), false);
  });

  test('reconhece cada tipo de chave e normaliza', () => {
    assert.deepEqual(parsePixKey('529.982.247-25'), { type: 'cpf', key: '52998224725', label: 'CPF' });
    assert.equal(parsePixKey('12.abc.345/01de-35').key, '12ABC34501DE35');
    assert.equal(parsePixKey('Loja@Exemplo.com').key, 'loja@exemplo.com');
    assert.equal(parsePixKey('+55 (11) 91234-5678').key, '+5511912345678');
    assert.equal(parsePixKey('123E4567-E12B-12D1-A456-426655440000').type, 'aleatoria');
  });

  test('explica o erro quando a chave é inválida', () => {
    assert.throws(() => parsePixKey(''), /Digite a chave/);
    assert.throws(() => parsePixKey('123'), /Não reconheci/);
    assert.throws(() => parsePixKey('11912345678'), /CPF inválido. Se for telefone/);
    assert.throws(() => parsePixKey('+1 555 123 4567'), /\+55/);
  });
});

test('limpa acentos e símbolos', () => {
  assert.equal(sanitize('  Pião & Cia  ', 25), 'Piao Cia');
});
