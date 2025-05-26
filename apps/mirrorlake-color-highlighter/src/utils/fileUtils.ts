import type * as vscode from "vscode";
import { minimatch } from "minimatch";
import type { ConfigurationManager } from "../config/configurationManager";

export class FileUtils {
  static isSupportedFile(
    document: vscode.TextDocument,
    configManager: ConfigurationManager
  ): boolean {
    const globs = configManager.getSupportedFileGlobs();
    const fileName = document.fileName.split(/[/\\]/).pop() || "";
    return globs.some((glob) => minimatch(fileName, glob));
  }
}
