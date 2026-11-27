# 🧰 Kit E-commerce Node

[![testes](https://github.com/raabesmps/kit-ecommerce-node/actions/workflows/test.yml/badge.svg)](https://github.com/raabesmps/kit-ecommerce-node/actions/workflows/test.yml)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22-339933?logo=node.js&logoColor=white)

Desafio de projeto da **Formação Node.js da [DIO](https://www.dio.me/)**: um **kit de utilidades para e-commerce** no terminal, organizado em camadas e pronto para receber novas ferramentas.

Enunciado original: [digitalinnovationone/formacao-nodejs › projeto-qrcode](https://github.com/digitalinnovationone/formacao-nodejs/tree/main/projeto-qrcode).

```
  🧰 Kit E-commerce Node
  utilidades para a sua loja · configuração do .env

? Escolha a ferramenta
❯ 🔳 QR Code de link
  🔑 Senha segura
  💸 Cobrança Pix
  🚪 Sair
Gera o QR Code de um link no terminal ou em imagem
↑↓ navegar • ⏎ escolher
```

## 🚀 Como rodar

Requisito: **Node.js 22 ou superior**.

```bash
git clone https://github.com/raabesmps/kit-ecommerce-node.git
cd kit-ecommerce-node
npm install
cp .env.example .env   # opcional: sem .env, o kit usa os padrões
npm start
```

## 🛠️ Ferramentas

### 🔳 QR Code de link
Digite um link (pode ser `minhaloja.com.br/produto/42`, o `https://` é completado sozinho) e escolha como quer o QR Code:
- no terminal, **normal** ou **pequeno** (como na aula);
- **imagem PNG ou SVG** de 512 px, salva na pasta `qrcodes/`, pronta para etiqueta, embalagem ou vitrine.

### 🔑 Senha segura
Gera senhas com as regras do `.env`, mostra a força estimada e permite gerar outra na hora.

```
   T2%T*Jl92}i{REwp
  Força: muito forte (~103 bits)
```

### 💸 Cobrança Pix (a novidade)
Gera um **Pix copia e cola** e o **QR Code** no padrão **BR Code** do Banco Central, para a loja cobrar um pedido:

- chave **CPF, CNPJ, e-mail, telefone ou aleatória**, com validação (dígitos verificadores de CPF e CNPJ, inclusive o **CNPJ alfanumérico** que vale desde julho de 2026);
- valor opcional (`49,90`, `1.234,56` ou `10.50`). Sem valor, quem paga escolhe;
- descrição e identificador do pedido (`txid`);
- QR Code no terminal e, se quiser, salvo em PNG.

```
  💸 Pix gerado
  e-mail: loja@exemplo.com.br · Loja do Piao · Sao Paulo
  valor: R$ 49,90 · pedido: PED1234

  Copia e cola:
  00020126560014br.gov.bcb.pix0119loja@exemplo.com.br0211Pedido 1234520400005303986540549.905802BR5912Loja do Piao6009Sao Paulo62110507PED12346304F7BE
```

O payload segue o formato EMV do *Manual de Padrões para Iniciação do Pix*: campos `ID + tamanho + valor` e o **CRC16-CCITT** no final. Um teste confere que o kit gera **exatamente** o exemplo oficial do manual (CRC `1D3D`).

> Esse é o Pix **estático**, o mesmo das plaquinhas de balcão: ele não confirma o pagamento sozinho. Confira o nome do recebedor no app do banco e teste com um valor pequeno.

## ⚙️ Configuração (`.env`)

| Variável | Padrão | O que faz |
|---|---|---|
| `PASSWORD_LENGTH` | `16` | tamanho da senha (4 a 128) |
| `UPPERCASE_LETTERS` | `true` | usar letras maiúsculas |
| `LOWERCASE_LETTERS` | `true` | usar letras minúsculas |
| `NUMBERS` | `true` | usar números |
| `SPECIAL_CHARACTERS` | `true` | usar símbolos |
| `QRCODE_OUTPUT_DIR` | `qrcodes` | pasta onde as imagens são salvas |

O `.env` é lido com o carregador **nativo** do Node (`process.loadEnvFile`) e validado: um valor errado gera uma mensagem clara (ex.: `PASSWORD_LENGTH precisa ser um número inteiro entre 4 e 128`). O repositório traz só o `.env.example`, e o `.env` de verdade fica fora do git.

## ✅ O que o desafio pede

- [x] Kit de utilidades para e-commerce em Node.js
- [x] Gerador de QR Code a partir de um link, no terminal (normal ou pequeno)
- [x] Gerador de senha configurado por variáveis de ambiente (`.env`)
- [x] Projeto com múltiplas dependências do npm
- [x] Arquitetura em camadas, escalável para novas features

## 🔧 Melhorias em relação ao código da aula

| No código da aula | Aqui |
|---|---|
| Senha com `Math.random()`, que **não é seguro** para senhas | `crypto.randomInt`, aleatoriedade criptográfica |
| 🐛 Com todos os tipos `false` no `.env`, a senha saía `undefinedundefined...` | Erro claro: "Ligue pelo menos um tipo de caractere" |
| A senha podia sair sem nenhum caractere de algum tipo ligado | Garante pelo menos 1 de cada tipo ligado |
| `.env` commitado no repositório | `.env.example` no git e `.env` no `.gitignore` |
| `.env` sem validação (`PASSWORD_LENGTH=abc` quebrava em silêncio) | Camada de configuração que valida e tem padrões seguros |
| Link do QR Code sem validação | Valida o link, completa o `https://` e recusa `javascript:`, `ftp:` etc. |
| Biblioteca `prompt` (sem versão nova desde 2022) | `@inquirer/prompts`: menus com setas, validação na hora, textos em português |
| `qrcode-terminal` (só terminal, sem versão desde 2016) | `qrcode`: terminal **e** imagem PNG/SVG |
| Menu com `if (select == 1)`: cada ferramenta nova exige mexer no `index.js` | **Registro de ferramentas**: o menu é montado a partir de uma lista |
| Uma ferramenta por execução | Menu em loop até escolher "Sair"; Ctrl+C sai sem erro |

## 🧱 Arquitetura em camadas

```
src/
├── index.js                # entrada: carrega o .env e mostra o menu
├── config/
│   └── env.js              # lê e valida o .env (ninguém mais lê process.env)
├── tools/
│   ├── index.js            # REGISTRO: lista de ferramentas do menu
│   ├── qrcode/
│   │   ├── index.js        # interface: perguntas e exibição
│   │   └── service.js      # regra: validar link, gerar QR no terminal ou arquivo
│   ├── password/
│   │   ├── index.js
│   │   └── service.js      # gerar senha e medir força
│   └── pix/
│       ├── index.js
│       ├── keys.js         # validar chaves (CPF, CNPJ, e-mail, telefone, EVP)
│       └── service.js      # montar o BR Code e o CRC16
└── ui/
    └── theme.js            # textos dos prompts em português
test/                       # 30 testes com node:test
```

Cada ferramenta tem duas camadas: **`service.js`** (regra de negócio, sem terminal, fácil de testar e reaproveitar numa API) e **`index.js`** (interface com o usuário).

### Como adicionar uma ferramenta nova

1. Crie `src/tools/minha-ferramenta/index.js`:
   ```js
   export default {
     id: 'minha-ferramenta',
     name: '✨ Minha ferramenta',
     description: 'O que ela faz',
     async run({ config }) {
       // ...
     },
   };
   ```
2. Registre em `src/tools/index.js`. Pronto, ela aparece no menu.

## 📦 Dependências

| Pacote | Para quê |
|---|---|
| [`@inquirer/prompts`](https://www.npmjs.com/package/@inquirer/prompts) | menus e perguntas interativas |
| [`qrcode`](https://www.npmjs.com/package/qrcode) | QR Code no terminal e em PNG/SVG |
| [`chalk`](https://www.npmjs.com/package/chalk) | cores no terminal |

Variáveis de ambiente, aleatoriedade segura e testes usam só módulos nativos do Node (`process.loadEnvFile`, `node:crypto`, `node:test`).

## 🧪 Testes

```bash
npm test
```

São 30 testes cobrindo:
- configuração: padrões, `.env` da aula e valores inválidos;
- senha: tamanho, tipos obrigatórios, erro com tudo desligado e força;
- QR Code: validação de link, terminal, PNG e SVG;
- Pix: payload idêntico ao manual do Banco Central, campos, valores, cortes de tamanho, CPF, CNPJ (numérico e alfanumérico), e-mail, telefone e chave aleatória.

O GitHub Actions roda tudo em Node 22 e 24 a cada push, junto com `npm audit`.

## 📄 Licença

[MIT](LICENSE)
