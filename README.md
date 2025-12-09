# CRI's and CRA's pdf extractor

This project extract some values of CRI or CRA pdf, how:

- cnpj_devedor
- nome_devedor
- data_emissao

## Technologies

This project is working with RAG method, typescript and node.

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

3. Build the dist folder:

```
npm run build
```

4. Run the command below:

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
