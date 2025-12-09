# CRI's and CRA's pdf extractor

This project extract some values of CRI or CRA pdf, how:

- cnpj_devedor
- nome_devedor
- data_emissao

## Technologies

This project is working with RAG method, typescript and node.

## Important!

This project need a .env file with the enviroments below:

OPENROUTER_API_KEY=

You can get the OPENROUTER_API_KEY in [https://openrouter.ai/docs/api/reference/authentication](https://openrouter.ai/docs/api/reference/authentication)

## How to run

1. Clone the repo:

```
git clone https://github.com/IgorSprovieri/cri-cra-rag.git
```

2. Install dependencies:

```
cd cri-cra-rag
npm install
```

3. Create the .env file with the Open Router Api Key

echo "OPENROUTER_API_KEY=your_key_here" > .env

4. Build the dist folder:

```
npm run build
```

5. Run the command below:

```
npm run extract -- --pdf "YOUR PDF URL"  --output resultado.json
```

## Using the main script for others contexts

The main script is reuzable and it is in pdfRagByTerminal.ts. You can use for others contexts how the example below:

```
import "dotenv/config";

import { pdfRagByTerminal } from "./libs/pdfRagByTerminal";

async function main() {
  const retrievalQuery = `
CNPJ do Devedor
Nome do Devedor
Data de Emissão
Termo de Securitização
Emitido em
Devedor:
CNPJ:
`;

  const whoIAis =
    "Você é um assistente especializado em análise de documentos financeiros brasileiros.";

  const fieldsToExtract = ["cnpj_devedor", "nome_devedor", "data_emissao"];

  pdfRagByTerminal({ retrievalQuery, whoIAis, fieldsToExtract });
}

main();
```
