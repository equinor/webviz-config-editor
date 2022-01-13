import { editor, Selection } from "monaco-editor";

export type File = {
    uuid: string;
    editorModel: editor.IModel;
    editorViewState: editor.ICodeEditorViewState | null;
    unsavedChanges: boolean;
    selection: Selection;
};
