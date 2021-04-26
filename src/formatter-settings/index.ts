// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
export class JavaFormatterSettingsEditorProvider implements vscode.CustomTextEditorProvider {

    public static readonly viewType = "java.formatterSettingsEditor";

    constructor(private readonly context: vscode.ExtensionContext) {
    }

    public async showFormatterSettingsEditor() {
        // Use a fake profile
        const defaultProfile: string = path.join(this.context.extensionPath, "webview-resources", "formatter.xml");
        const resource = vscode.Uri.file(defaultProfile);
        vscode.commands.executeCommand("vscode.openWith", resource, "java.formatterSettingsEditor");
    }

    public async resolveCustomTextEditor(_document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, _token: vscode.CancellationToken): Promise<void> {

        webviewPanel.webview.options = {
            enableScripts: true,
            enableCommandUris: true,
        };
        const resourceUri = this.context.asAbsolutePath("./out/assets/formatter-settings/index.html");
        fs.readFile(resourceUri, (err, data) => {
            if (err) {
                vscode.window.showErrorMessage("Fail to load the content of Java Formatter Settings Editor.");
                return;
            }
            webviewPanel.webview.html = data.toString();
        });
    }
}
