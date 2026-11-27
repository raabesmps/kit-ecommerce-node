#!/usr/bin/env node
import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import { loadEnvFile, readConfig } from './config/env.js';
import { TOOLS } from './tools/index.js';
import { selectTheme } from './ui/theme.js';

/** Ctrl+C dentro de um prompt: sai sem mostrar erro. */
const isExit = (err) => err?.name === 'ExitPromptError';

async function main() {
  const hasEnv = loadEnvFile();
  const config = readConfig();

  console.log(chalk.bold.magenta('\n  🧰 Kit E-commerce Node'));
  console.log(chalk.dim(`  utilidades para a sua loja · ${hasEnv ? 'configuração do .env' : 'sem .env, usando os padrões'}\n`));

  while (true) {
    const choice = await select({
      message: 'Escolha a ferramenta',
      theme: selectTheme,
      choices: [
        ...TOOLS.map((tool) => ({ name: tool.name, value: tool.id, description: tool.description })),
        { name: '🚪 Sair', value: 'exit' },
      ],
    });
    if (choice === 'exit') break;

    const tool = TOOLS.find((t) => t.id === choice);
    try {
      await tool.run({ config });
    } catch (err) {
      if (isExit(err)) break;
      console.log(chalk.red(`\n  ✖ ${err.message}\n`));
    }
  }
  console.log(chalk.dim('\n  Até a próxima! 👋\n'));
}

main().catch((err) => {
  if (isExit(err)) return console.log(chalk.dim('\n  Até a próxima! 👋\n'));
  console.error(chalk.red(`\n  ✖ ${err.message}\n`));
  process.exitCode = 1;
});
