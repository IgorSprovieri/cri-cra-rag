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
