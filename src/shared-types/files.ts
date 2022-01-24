import {YamlMetaObject, YamlObject} from "@utils/yaml-parser";

import {PropertyNavigationType} from "@shared-types/navigation";

import {
    SelectionDirection,
    editor,
} from "monaco-editor/esm/vs/editor/editor.api";

export type File = {
    filePath: string; // Also used as identifier
    associatedWithFile: boolean;
    editorValue: string;
    editorViewState: editor.ICodeEditorViewState | null;
    unsavedChanges: boolean;
    selection: Selection;
    navigationItems: PropertyNavigationType;
    yamlObjects: YamlObject[];
    selectedYamlObject: YamlMetaObject | undefined;
    updateSource: UpdateSource;
    currentPageId: string;
    title: string;
};

export enum UpdateSource {
    Editor = "EDITOR",
    Preview = "PREVIEW",
    Plugin = "PLUGIN",
}

export type Selection = {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    direction: SelectionDirection;
};

export type FilesState = {
    files: File[];
    activeFile: string;
};
