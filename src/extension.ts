// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { dispose as disposeTelemetryWrapper, initialize, instrumentOperation } from "vscode-extension-telemetry-wrapper";

import { initialize as initUtils } from "./utils";
import { initialize as initCommands } from "./commands";
import { initialize as initRecommendations } from "./recommendation";
import { initialize as initMisc, showReleaseNotesOnStart, HelpViewType } from "./misc";
import { initialize as initExp, getExpService } from "./exp";
import { showOverviewPageOnActivation } from "./overview";
import { validateJavaRuntime } from "./java-runtime";
// import { JavaGettingStartedViewSerializer } from "./getting-started";
import { scheduleAction } from "./utils/scheduler";

export async function activate(context: vscode.ExtensionContext) {
  initializeTelemetry(context);
  await instrumentOperation("activation", initializeExtension)(context);
}

async function initializeExtension(operationId: string, context: vscode.ExtensionContext) {
  initUtils(context);
  initCommands(context);
  initRecommendations(context);
  initMisc(context);
  initExp(context);

  // disable webview serializer because of https://github.com/microsoft/vscode/issues/80185
  // context.subscriptions.push(vscode.window.registerWebviewPanelSerializer("java.overview", new OverviewViewSerializer()));
  // context.subscriptions.push(vscode.window.registerWebviewPanelSerializer("java.runtime", new JavaRuntimeViewSerializer()));
  // context.subscriptions.push(vscode.window.registerWebviewPanelSerializer("java.gettingStarted", new JavaGettingStartedViewSerializer()));

  const config = vscode.workspace.getConfiguration("java.help");

  if (config.get("firstView") !== HelpViewType.None) {
    scheduleAction("showFirstView", true).then(() => {
      presentFirstView(context);
    });
  }

  if (config.get("showReleaseNotes")) {
    scheduleAction("showReleaseNotes").then(() => {
      showReleaseNotesOnStart(context);
    });
  }

  if (!await validateJavaRuntime()) {
    scheduleAction("showJdkState", true, true).then(() => {
      vscode.commands.executeCommand("java.runtime");
    });
  }
}

async function presentFirstView(context: vscode.ExtensionContext) {
  const presentExtensionGuideByDefault: boolean = await getExpService()?.isFlightEnabledAsync("presentExtensionGuideByDefault") || false;
  if (presentExtensionGuideByDefault) {
    showExtensionGuide(context);
    return;
  }

  const config = vscode.workspace.getConfiguration("java.help");
  const firstView = config.get("firstView");
  switch (firstView) {
    case HelpViewType.None:
      break;
    case HelpViewType.GettingStarted:  
      await showGettingStartedView(context);
      break;
    default:
      await showOverviewPageOnActivation(context);
    }
}

async function showExtensionGuide(context: vscode.ExtensionContext) {
  if (!!context.globalState.get("isExtensionGuidePresented")) {
    return;
  }

  await vscode.commands.executeCommand("java.extGuide");
  context.globalState.update("isExtensionGuidePresented", true);
}

async function showGettingStartedView(context: vscode.ExtensionContext, isForce: boolean = false) {
  if (!!context.globalState.get("isGettingStartedPresented")) {
    return;
  }

  await vscode.commands.executeCommand("java.gettingStarted");
  context.globalState.update("isGettingStartedPresented", true);
}

function initializeTelemetry(context: vscode.ExtensionContext) {
  const ext = vscode.extensions.getExtension("vscjava.vscode-java-pack");
  const packageInfo = ext ? ext.packageJSON : undefined;
  if (packageInfo) {
    if (packageInfo.aiKey) {
      initialize(packageInfo.id, packageInfo.version, packageInfo.aiKey, { firstParty: true });
    }
  }
}

export async function deactivate() {
  await disposeTelemetryWrapper();
}
