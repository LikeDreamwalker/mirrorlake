import * as vscode from "vscode";

export class WebViewManager {
  private mirrorLakePanel: vscode.WebviewPanel | undefined = undefined;

  constructor(private context: vscode.ExtensionContext) {}

  openColorInWebView(args: any): void {
    if (this.mirrorLakePanel) {
      this.mirrorLakePanel.reveal(vscode.ViewColumn.Beside);
      // Also send update if panel already exists
      this.mirrorLakePanel.webview.postMessage({
        type: "update",
        color: args.color,
      });
      return;
    }

    this.createWebViewPanel(args.color);
  }

  private createWebViewPanel(color: string): void {
    this.mirrorLakePanel = vscode.window.createWebviewPanel(
      "colorAgent",
      `MirrorLake Color: ${color}`,
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.mirrorLakePanel.webview.html = this.getWebViewContent(color);
    this.setupWebViewMessageHandling();
    this.setupWebViewDisposal();
  }

  private getWebViewContent(color: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>MirrorLake Color</title>
          <style>
            html, body { height: 100%; margin: 0; padding: 0; }
            iframe { width: 100vw; height: 100vh; border: none; }
          </style>
        </head>
        <body>
          <iframe
            id="mirrorlake-iframe"
            src="https://mirrorlake.ldwid.com?color=${encodeURIComponent(color)}"
            sandbox="allow-scripts allow-same-origin allow-forms"
          ></iframe>
          <script>
            window.vscodeApi = acquireVsCodeApi();
          </script>
          <script>
            // Listen for VSCode postMessage and forward to iframe
            window.addEventListener('message', (event) => {
              const iframe = document.getElementById('mirrorlake-iframe');
              if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(event.data, '*');
              }
            });
          </script>
          <script>
            window.addEventListener('message', (event) => {
              const data = event.data;
              if (data && data.type === "copy-to-clipboard") {
                // Forward to VS Code extension host
                window.vscodeApi?.postMessage(data);
              }
            });
          </script>
        </body>
      </html>
    `;
  }

  private setupWebViewMessageHandling(): void {
    if (!this.mirrorLakePanel) {
      return;
    }

    this.mirrorLakePanel.webview.onDidReceiveMessage((message) => {
      if (message.type === "copy-to-clipboard" && message.text) {
        vscode.env.clipboard.writeText(message.text);
        vscode.window.showInformationMessage(`Copied: ${message.text}`);
      }
    });
  }

  private setupWebViewDisposal(): void {
    if (!this.mirrorLakePanel) {
      return;
    }

    this.mirrorLakePanel.onDidDispose(
      () => {
        this.mirrorLakePanel = undefined;
      },
      null,
      this.context.subscriptions
    );
  }
}
