import chalk from 'chalk';
import { input, select } from '@inquirer/prompts';
import { normalizeLink, saveToFile, toTerminal } from './service.js';
import { selectTheme } from '../../ui/theme.js';

/** Camada de interface do gerador de QR Code. */
export default {
  id: 'qrcode',
  name: '🔳 QR Code de link',
  description: 'Gera o QR Code de um link no terminal ou em imagem',

  async run({ config }) {
    const link = await input({
      message: 'Link para o QR Code:',
      validate: (value) => {
        try {
          normalizeLink(value);
          return true;
        } catch (err) {
          return err.message;
        }
      },
    });
    const url = normalizeLink(link);

    const output = await select({
      message: 'Como você quer o QR Code?',
      theme: selectTheme,
      choices: [
        { name: 'No terminal (normal)', value: 'terminal' },
        { name: 'No terminal (pequeno)', value: 'terminal-small' },
        { name: 'Imagem PNG', value: 'png' },
        { name: 'Imagem SVG', value: 'svg' },
      ],
    });

    if (output.startsWith('terminal')) {
      console.log(chalk.green(`\n  QR Code de ${url}\n`));
      console.log(await toTerminal(url, { small: output === 'terminal-small' }));
      return;
    }

    const file = await saveToFile(url, { dir: config.qrcode.outputDir, format: output });
    console.log(chalk.green(`\n  ✅ QR Code salvo em ${chalk.bold(file)}\n`));
  },
};
