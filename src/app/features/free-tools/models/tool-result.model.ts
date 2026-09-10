/**
 * tool-result.model.ts
 * Shared types for tool computation results and educational content.
 */

export interface ToolResult {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;   // primary result — shown larger, accented
  isError?: boolean;     // show in warning/error style (e.g. negative balance)
  description?: string;  // optional footnote below the value
}

export interface EducationalContent {
  howToUse: string[];
  formula?: string;        // formula string shown in code block
  formulaNote?: string;    // plain-English explanation of the formula
  pros: string[];
  cons: string[];
}
