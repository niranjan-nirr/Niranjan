// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as path from 'path';
import * as vscode from 'vscode';
import { openExternalLinkFromWebview, webviewCmdLinkHandler } from '../utils';
import { availableReleases, latestCompatibleAsset } from '../utils/adoptiumApi';
import { WEBVIEW_ID } from './constants';


export function installJDKCmdHandler(context: vscode.ExtensionContext, _operationId?: string) {
	InstallJdkPage.createOrShow(context.extensionPath);
}

export class InstallJdkViewSerializer implements vscode.WebviewPanelSerializer {
	constructor(private context: vscode.ExtensionContext) { }
	async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, _state: unknown) {
		InstallJdkPage.createOrShow(this.context.extensionPath, webviewPanel);
	}

}

class InstallJdkPage {
	public static instance: InstallJdkPage | undefined;
	private static readonly viewType = WEBVIEW_ID;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionPath: string, webviewPanel?: vscode.WebviewPanel) {
		// "smart" Beside
		const ate = vscode.window.activeTextEditor;
		const column = (ate === undefined || ate.viewColumn === vscode.ViewColumn.One) ?
			vscode.ViewColumn.Two :
			vscode.ViewColumn.One;

		if (InstallJdkPage.instance) {
			InstallJdkPage.instance._panel.reveal();
		} else {
			InstallJdkPage.instance = webviewPanel ?
				new InstallJdkPage(extensionPath, webviewPanel) :
				new InstallJdkPage(extensionPath, column);
		}
	}

	private constructor(extensionPath: string, column: vscode.ViewColumn);
	private constructor(extensionPath: string, webviewPanel: vscode.WebviewPanel);
	private constructor(extensionPath: string, columnOrwebviewPanel: vscode.ViewColumn | vscode.WebviewPanel) {
		this._extensionPath = extensionPath;
		if ((columnOrwebviewPanel as vscode.WebviewPanel).viewType) {
			this._panel = columnOrwebviewPanel as vscode.WebviewPanel;
		} else {
			this._panel = vscode.window.createWebviewPanel(InstallJdkPage.viewType, "Install New JDK", columnOrwebviewPanel as vscode.ViewColumn, {
				enableScripts: true,
				localResourceRoots: [
					vscode.Uri.file(path.join(this._extensionPath, 'out'))
				],
				enableCommandUris: true,
				retainContextWhenHidden: true
			});
		}

		this._panel.webview.html = this._getHtmlForWebview();

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(message => {
			switch (message.command) {
				case 'onWillFetchAvailableReleases':
					this.doFetchAvailableReleases();
					return;

				case 'onWillFetchAsset':
					this.doFetchAsset(message.payload);
					return;
				case 'onWillDownloadTemurinJDK':
					this.doDownloadTemurinJDK(message.payload);
					return;
				case 'onWillReloadWindow':
					this.doReloadWindow();

			}
		}, null, this._disposables);
	}

	private async doFetchAvailableReleases() {
		const releases = await availableReleases();
		this._panel.webview.postMessage({ command: "onDidFetchAvailableReleases", payload: releases });
	}

	private async doFetchAsset(payload: { majorVersion: number }) {
		const asset = await latestCompatibleAsset(payload?.majorVersion?.toString(), "hotspot");
		this._panel.webview.postMessage({ command: "onDidFetchAsset", payload: asset });
	}

	private async doDownloadTemurinJDK(payload: { url: string }) {
		await openExternalLinkFromWebview(InstallJdkPage.viewType, "Download", payload.url);
	}

	private async doReloadWindow() {
		await webviewCmdLinkHandler({
			webview: InstallJdkPage.viewType,
			identifier: "Reload Window",
			command: "workbench.action.reloadWindow"
		});
	}

	public dispose() {
		InstallJdkPage.instance = undefined;

		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _getHtmlForWebview() {
		const scriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'out', "assets", "install-jdk", "index.js"));

		// const scriptUri = this._panel.webview.asWebviewUri(scriptPathOnDisk);
		const scriptUri = (scriptPathOnDisk).with({ scheme: "vscode-resource" });

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
				<meta name="theme-color" content="#000000">
				<title>React App</title>
			</head>
			<body>
				<noscript>You need to enable JavaScript to run this app.</noscript>
				<div id="root"></div>
				
				<script nonce="${nonce}" src="${scriptUri}" type="module"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
