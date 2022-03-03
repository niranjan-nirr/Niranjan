import * as cp from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";
import * as vscode from "vscode";
import { sendInfo } from "vscode-extension-telemetry-wrapper";
import { LSDaemon } from "./daemon";
const execFile = promisify(cp.execFile);

interface IJdtlsMetadata {
   pid?: string;
   jreHome?: string;
   workspace?: string;
}


export class ProcessWatcher {
   private workspace?: string;
   private pid?: string;
   private jreHome?: string;
   private lastHeartbeat?: string;
   private context: vscode.ExtensionContext
   constructor(private daemon: LSDaemon) {
      this.context = daemon.context;
   }

   public async start(): Promise<boolean> {
      const javaExt = vscode.extensions.getExtension("redhat.java");
      if (!javaExt) {
         return false;
      }
      // get embedded JRE Home
      let jreHome: string | undefined;
      try {
         const jreFolder = path.join(javaExt.extensionPath, "jre");
         const jreDistros = await fs.promises.readdir(jreFolder);
         if (jreDistros.length > 0) {
            jreHome = path.join(jreFolder, jreDistros[0]);
         }
      } catch (error) {
         console.error(error);
      }
      if (!jreHome) {
         return false;
      }
      this.jreHome = jreHome;

      const jdtlsmeta = await getPidAndWS(jreHome, this.context);
      this.pid = jdtlsmeta.pid;
      this.workspace = jdtlsmeta.workspace;

      return (this.pid !== undefined && this.workspace !== undefined);
   }

   public monitor() {
      const id = setInterval(() => {
         this.upTime().then(seconds => {
            this.lastHeartbeat = seconds;
         }).catch(_e => {
            clearInterval(id);
            this.onDidJdtlsCrash(this.lastHeartbeat);
         });
      }, 5000);
      // TBD: e.g. constantly monitor heap size and uptime
   }

   public async upTime(): Promise<string | undefined> {
      if (!this.jreHome || !this.pid) {
         throw new Error("unsupported");
      }

      const execRes = await execFile(path.join(this.jreHome, "bin", "jcmd"), [this.pid, "VM.uptime"]);
      const r = /\d+\.\d+ s/;
      return execRes.stdout.match(r)?.toString();
   }

   public async heapSize(): Promise<string> {
      if (!this.jreHome || !this.pid) {
         throw new Error("unsupported");
      }

      const execRes = await execFile(path.join(this.jreHome, "bin", "jcmd"), [this.pid, "GC.heap_info"]);
      const ryoung = /PSYoungGen\s+total \d+K, used \d+K/;
      const y = execRes.stdout.match(ryoung)?.toString();

      const rold = /ParOldGen\s+total \d+K, used \d+K/;
      const o = execRes.stdout.match(rold)?.toString();
      return [y, o].join(os.EOL);
   }

   private onDidJdtlsCrash(lastHeartbeat?: string) {
      sendInfo("", {
         name: "jdtls-last-heartbeat",
         message: lastHeartbeat!
      });
      const consentToCollectLogs = vscode.workspace.getConfiguration("java").get<boolean>("help.shareDiagnostics");
      if (!consentToCollectLogs) {
         vscode.window.showInformationMessage("Java Language Server is crashed. Do you want to share error logs with us for diagnostic purpose?", "Yes").then(choice => {
            if (choice) {
               vscode.workspace.getConfiguration("java").update("help.shareDiagnostics", true);
               this.daemon.logWatcher.sendErrorAndStackOnCrash();
            }
         });
      }
   }
}


function parseJdtlsJps(jdtlsJpsLine: string): IJdtlsMetadata {
   const spaceIdx = jdtlsJpsLine.indexOf(" ");
   const pid = jdtlsJpsLine.slice(0, spaceIdx);
   const cmd = jdtlsJpsLine.slice(spaceIdx + 1);
   const res = cmd.match(/-XX:HeapDumpPath=(.*(redhat.java|vscodesws_[0-9a-f]{5}))/);
   let workspace;
   if (res && res[1]) {
      workspace = res[1];
   }

   return {
      pid,
      workspace
   };
}


async function getPidAndWS(jreHome: string, context:vscode.ExtensionContext) {
   const jpsExecRes = await execFile(path.join(jreHome, "bin", "jps"), ["-v"]);
   const jdtlsLines = jpsExecRes.stdout.split(os.EOL).filter(line => line.includes("org.eclipse.jdt.ls.core"));
   let jdtlsJpsLine;
   if (context.storageUri) {
      jdtlsJpsLine = jdtlsLines.find(line => line.includes(path.dirname(context.storageUri!.fsPath)));
   } else {
      jdtlsJpsLine = jdtlsLines.find(line => line.includes("vscodesws_"));
   }

   return jdtlsJpsLine ? parseJdtlsJps(jdtlsJpsLine) : {};
}