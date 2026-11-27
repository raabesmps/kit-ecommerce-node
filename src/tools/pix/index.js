import chalk from 'chalk';
import { confirm, input } from '@inquirer/prompts';
import { createPixPayload, parseAmount } from './service.js';
import { parsePixKey } from './keys.js';
import { saveToFile, toTerminal } from '../qrcode/service.js';
import { confirmTheme } from '../../ui/theme.js';

/** Transforma uma função que lança erro em um validador do inquirer. */
const validator = (fn) => (value) => {
  try {
    fn(value);
    return true;
  } catch (err) {
    return err.message;
  }
};

/** A novidade do kit: cobrança Pix com copia e cola e QR Code. */
export default {
  id: 'pix',
  name: '💸 Cobrança Pix',
  description: 'Gera Pix copia e cola e QR Code (padrão BR Code do Banco Central)',

  async run({ config }) {
    const key = await input({ message: 'Chave Pix de quem recebe:', validate: validator(parsePixKey) });
    const name = await input({ message: 'Nome de quem recebe:', validate: (v) => (v.trim() ? true : 'Informe o nome.') });
    const city = await input({ message: 'Cidade:', validate: (v) => (v.trim() ? true : 'Informe a cidade.') });
    const amount = await input({ message: 'Valor (Enter = quem paga escolhe):', validate: validator(parseAmount) });
    const description = await input({ message: 'Descrição (opcional):' });
    const txid = await input({
      message: 'Identificador do pedido (opcional, só letras e números):',
      validate: (v) => (!v.trim() || /^[A-Za-z0-9]{1,25}$/.test(v.trim()) ? true : 'Só letras e números, até 25.'),
    });

    const pix = createPixPayload({ key, name, city, amount, description, txid });

    console.log(chalk.bold.green('\n  💸 Pix gerado'));
    console.log(chalk.dim(`  ${pix.key.label}: ${pix.key.key} · ${pix.name} · ${pix.city}`));
    console.log(chalk.dim(`  valor: ${pix.amount ? `R$ ${pix.amount.replace('.', ',')}` : 'livre'} · pedido: ${pix.txid}`));
    console.log(chalk.bold('\n  Copia e cola:'));
    console.log(`  ${chalk.cyan(pix.payload)}\n`);
    console.log(await toTerminal(pix.payload, { small: true }));
    console.log(chalk.yellow('  ⚠️  Confira o nome do recebedor no app do banco antes de pagar. Teste com um valor pequeno.\n'));

    if (await confirm({ message: 'Salvar o QR Code em PNG?', default: false, theme: confirmTheme })) {
      const file = await saveToFile(pix.payload, { dir: config.qrcode.outputDir, format: 'png', name: `pix-${pix.txid === '***' ? 'livre' : pix.txid}` });
      console.log(chalk.green(`\n  ✅ QR Code salvo em ${chalk.bold(file)}\n`));
    }
  },
};
