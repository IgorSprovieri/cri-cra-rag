import "dotenv/config";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { promises as fs } from "fs";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import { EnsembleRetriever } from "langchain/retrievers/ensemble";

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Document } from "langchain/document";
import { ExtractedData } from "../@types";
import { pdfParser } from "./pdfParser";

export type PdfRagByTerminal = {
  retrievalQuery: string;
  whoIAis: String;
  fieldsToExtract: string[];
};

export const pdfRagByTerminal = async ({
  retrievalQuery,
  whoIAis,
  fieldsToExtract,
}: PdfRagByTerminal) => {
  const argv = await yargs(hideBin(process.argv))
    .option("pdf", {
      alias: "p",
      type: "string",
      demandOption: true,
    })
    .option("output", {
      alias: "o",
      type: "string",
      demandOption: true,
    })
    .parse();

  console.log("📄 Input PDF:", argv.pdf);
  console.log("📦 Output JSON:", argv.output);

  try {
    /* ============================
       1. PDF PARSING
    ============================ */

    console.log("🔍 Parsing PDF...");

    const normalizedText = await pdfParser(argv);

    console.log("✅ PDF parsed. Characters:", normalizedText.length);

    /* ============================
       2. PRIORITY CONTEXT (INÍCIO DO DOC)
    ============================ */

    const firstPagesText = normalizedText.slice(0, 15000);

    /* ============================
       3. CHUNKING
    ============================ */

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
      separators: ["\n\n", "\n", ".", ";", ","],
    });

    const chunks = await splitter.createDocuments([normalizedText]);
    console.log("🧩 Chunks created:", chunks.length);

    /* ============================
       4. RETRIEVERS
    ============================ */

    console.log("🧠 Initializing retrievers...");

    const embeddings = new HuggingFaceTransformersEmbeddings({
      modelName: "Xenova/paraphrase-multilingual-mpnet-base-v2",
    });

    const vectorStore = await MemoryVectorStore.fromDocuments(
      chunks,
      embeddings
    );

    const vectorRetriever = vectorStore.asRetriever(6);
    const bm25Retriever = await BM25Retriever.fromDocuments(chunks, { k: 6 });

    const ensembleRetriever = new EnsembleRetriever({
      retrievers: [bm25Retriever, vectorRetriever],
      weights: [0.7, 0.3],
    });

    console.log("✅ Hybrid retriever ready");

    /* ============================
       5. RETRIEVAL QUERY
    ============================ */

    const retrievedDocs = await ensembleRetriever.invoke(retrievalQuery);

    console.log("🔍 Retrieved chunks:");
    retrievedDocs.forEach((doc, i) => {
      console.log(`--- Chunk ${i + 1} ---`);
      console.log(doc.pageContent.slice(0, 300));
    });

    const retrievedContext = retrievedDocs
      .map((doc: Document) => doc.pageContent)
      .join("\n\n");

    /* ============================
       6. FINAL CONTEXT
    ============================ */

    const context = `
TRECHO INICIAL DO DOCUMENTO:
${firstPagesText}

TRECHOS RECUPERADOS POR BUSCA:
${retrievedContext}
`;

    /* ============================
       7. LLM
    ============================ */

    const llm = new ChatOpenAI({
      modelName: "mistralai/mistral-7b-instruct-v0.2",
      temperature: 0,
      openAIApiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      },
    });

    const promptTemplate = PromptTemplate.fromTemplate(`
${whoIAis}

REGRAS OBRIGATÓRIAS:
- Extraia APENAS informações literalmente presentes no texto.
- NÃO faça inferências.
- NÃO invente dados.
- Se não encontrar claramente, retorne null.
- Retorne APENAS JSON válido, sem texto adicional.

CONTEXTO:
---
${context}
---

Retorne JSON com as chaves:
${fieldsToExtract.map((fieldToExtract) => `- ${fieldToExtract}\n`)}
`);

    /* ============================
       8. RAG CHAIN
    ============================ */

    const ragChain = promptTemplate.pipe(llm).pipe(new StringOutputParser());

    console.log("🤖 Running RAG...");

    const rawResponse = await ragChain.invoke({
      context,
    });

    console.log("🧾 Raw LLM output:", rawResponse);

    /* ============================
       9. SAFE JSON PARSE
    ============================ */

    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("❌ JSON não encontrado na resposta do modelo");
    }

    const extractedData: ExtractedData = JSON.parse(jsonMatch[0]);

    /* ============================
       10. POST-VALIDATION
    ============================ */

    if (
      extractedData.cnpj_devedor &&
      !/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/.test(extractedData.cnpj_devedor)
    ) {
      extractedData.cnpj_devedor = null;
    }

    /* ============================
       11. SAVE OUTPUT
    ============================ */

    await fs.writeFile(
      argv.output,
      JSON.stringify(extractedData, null, 2),
      "utf-8"
    );

    console.log("✅ Extraction completed successfully");
  } catch (error) {
    console.error("❌ Extraction failed:", error);
    process.exit(1);
  }
};
