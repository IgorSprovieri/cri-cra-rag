import { promises as fs } from "fs";
import pdf from "pdf-parse";

export type Argv =
  | {
      [x: string]: unknown;
      pdf: string;
      output: string;
      _: (string | number)[];
      $0: string;
    }
  | {
      [x: string]: unknown;
      pdf: string;
      output: string;
      _: (string | number)[];
      $0: string;
    };

export const pdfParser = async (argv: Argv) => {
  const buffer = await fs.readFile(argv.pdf);
  const pdfData = await pdf(buffer);

  return pdfData.text
    .replace(/\s+\n/g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .replace(/[ ]{2,}/g, " ");
};
