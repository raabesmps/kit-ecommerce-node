import chalk from 'chalk';

/* Temas do @inquirer/prompts com os textos de ajuda em português. */

const TRANSLATIONS = { navigate: 'navegar', select: 'escolher' };

export const selectTheme = {
  style: {
    keysHelpTip: (keys) =>
      keys.map(([key, action]) => `${chalk.bold(key)} ${chalk.dim(TRANSLATIONS[action] ?? action)}`).join(chalk.dim(' • ')),
  },
};

export const confirmTheme = {
  keywords: {
    yes: 'Sim',
    no: 'Não',
    error: ({ yes, no }) => `Responda "${yes}" ou "${no}"`,
  },
};
