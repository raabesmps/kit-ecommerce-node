import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import { generatePassword, passwordStrength } from './service.js';
import { confirmTheme } from '../../ui/theme.js';

const LEVEL_COLOR = { fraca: chalk.red, razoável: chalk.yellow, forte: chalk.green, 'muito forte': chalk.greenBright };

/** Camada de interface do gerador de senha: pergunta, chama o serviço e mostra. */
export default {
  id: 'password',
  name: '🔑 Senha segura',
  description: 'Gera uma senha com as regras do .env',

  async run({ config }) {
    const options = config.password;
    const enabled = [
      options.uppercase && 'maiúsculas',
      options.lowercase && 'minúsculas',
      options.numbers && 'números',
      options.special && 'símbolos',
    ].filter(Boolean);

    console.log(chalk.dim(`  ${options.length} caracteres · ${enabled.join(', ') || 'nenhum tipo ligado'}  (ajuste no .env)`));

    const { bits, level } = passwordStrength(options);
    do {
      const password = generatePassword(options);
      console.log(`\n  ${chalk.bgBlack.whiteBright.bold(` ${password} `)}`);
      console.log(`  Força: ${LEVEL_COLOR[level](level)} ${chalk.dim(`(~${bits} bits)`)}\n`);
    } while (await confirm({ message: 'Gerar outra?', default: false, theme: confirmTheme }));
  },
};
