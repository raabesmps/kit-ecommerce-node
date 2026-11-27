/*
 * REGISTRO DE FERRAMENTAS
 * O menu principal é montado a partir desta lista.
 * Para criar uma ferramenta nova: crie src/tools/<nome>/index.js exportando
 * { id, name, description, run(context) } e acrescente uma linha aqui.
 */
import qrcode from './qrcode/index.js';
import password from './password/index.js';
import pix from './pix/index.js';

export const TOOLS = Object.freeze([qrcode, password, pix]);
