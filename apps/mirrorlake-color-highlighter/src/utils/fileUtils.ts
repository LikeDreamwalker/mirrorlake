import type * as vscode from "vscode";
import { minimatch } from "minimatch";
import type { ConfigurationManager } from "../config/configurationManager";

export class FileUtils {
  // Default language support mapping
  private static readonly DEFAULT_LANGUAGE_SUPPORT: Record<string, string[]> = {
    css: ["*.css"],
    scss: ["*.scss"],
    sass: ["*.sass"],
    less: ["*.less"],
    stylus: ["*.styl"],
    postcss: ["*.pcss"],
    html: ["*.html", "*.htm"],
    vue: ["*.vue"],
    javascript: ["*.js"],
    typescript: ["*.ts"],
    javascriptreact: ["*.jsx"],
    typescriptreact: ["*.tsx"],
  };

  // Default supported languages list
  private static readonly DEFAULT_SUPPORTED_LANGUAGES = Object.keys(
    FileUtils.DEFAULT_LANGUAGE_SUPPORT
  );

  static isSupportedFile(
    document: vscode.TextDocument,
    configManager: ConfigurationManager
  ): boolean {
    const fileName = document.fileName.split(/[/\\]/).pop() || "";
    const languageId = document.languageId;
    const isUnsavedFile =
      document.uri.scheme === "untitled" || fileName.startsWith("Untitled");

    // Get configuration
    const userLanguages = configManager.getSupportedLanguages();
    const supportedLanguages =
      userLanguages.length > 0
        ? userLanguages
        : this.DEFAULT_SUPPORTED_LANGUAGES;

    // For unsaved files, only check by language ID
    if (isUnsavedFile) {
      return supportedLanguages.includes(languageId);
    }

    // For saved files, check both language ID and file glob patterns
    const languageSupported = supportedLanguages.includes(languageId);
    const globSupported = this.isSupportedByFileGlob(fileName, configManager);

    return languageSupported || globSupported;
  }

  private static isSupportedByFileGlob(
    fileName: string,
    configManager: ConfigurationManager
  ): boolean {
    const userGlobs = configManager.getSupportedFileGlobs();
    const supportedGlobs =
      userGlobs.length > 0 ? userGlobs : this.getDefaultFileGlobs();

    return supportedGlobs.some((glob) => minimatch(fileName, glob));
  }

  private static getDefaultFileGlobs(): string[] {
    return Object.values(this.DEFAULT_LANGUAGE_SUPPORT).flat();
  }

  static getExtensionsForLanguage(languageId: string): string[] {
    return this.DEFAULT_LANGUAGE_SUPPORT[languageId] || [];
  }

  static getDefaultSupportedLanguages(): string[] {
    return this.DEFAULT_SUPPORTED_LANGUAGES;
  }

  static getDefaultSupportedGlobs(): string[] {
    return this.getDefaultFileGlobs();
  }

  static validateUserConfiguration(configManager: ConfigurationManager): {
    validLanguages: string[];
    invalidLanguages: string[];
    validGlobs: string[];
    invalidGlobs: string[];
  } {
    const userLanguages = configManager.getSupportedLanguages();
    const userGlobs = configManager.getSupportedFileGlobs();

    const validLanguages: string[] = [];
    const invalidLanguages: string[] = [];

    userLanguages.forEach((lang) => {
      if (typeof lang === "string" && lang.trim().length > 0) {
        validLanguages.push(lang.trim());
      } else {
        invalidLanguages.push(lang);
      }
    });

    const validGlobs: string[] = [];
    const invalidGlobs: string[] = [];

    userGlobs.forEach((glob) => {
      if (typeof glob === "string" && glob.trim().length > 0) {
        try {
          minimatch("test.txt", glob.trim());
          validGlobs.push(glob.trim());
        } catch (error) {
          invalidGlobs.push(glob);
        }
      } else {
        invalidGlobs.push(glob);
      }
    });

    return {
      validLanguages,
      invalidLanguages,
      validGlobs,
      invalidGlobs,
    };
  }
}
