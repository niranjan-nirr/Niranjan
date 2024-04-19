import { TextDocument, workspace, window, Selection } from "vscode";

export interface Inspection {
    document?: TextDocument;
    problem: {
        /**
         * short description of the problem
         */
        description: string;
        position: {
            /**
             * real line number to the start of the document, will change
             */
            line: number;
            /**
             * relative line number to the start of the symbol(method/class), won't change
             */
            relativeLine: number;
            /**
             * code of the first line of the problematic code block
             */
            code: string;
        };
        /**
         * symbol name of the problematic code block, e.g. method name/class name, keywork, etc.
         */
        symbol: string;
    }
    solution: string;
    severity: string;
}

export namespace Inspection {
    export function fix(inspection: Inspection, source: string) {
        //TODO: implement me
    }

    export function highlight(inspection: Inspection) {
        inspection.document && void workspace.openTextDocument(inspection.document.uri).then(document => {
            void window.showTextDocument(document).then(editor => {
                const range = document.lineAt(inspection.problem.position.line).range;
                editor.selection = new Selection(range.start, range.end);
                editor.revealRange(range);
            });
        });
    }
}