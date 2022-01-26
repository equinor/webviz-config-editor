import {BrowserWindow, app, dialog} from "electron";

import {
    FileExplorerOptions,
    FileOptions,
} from "@shared-types/file-explorer-options";

import {execSync} from "child_process";
import * as fs from "fs";
import * as path from "path";
import {Options, PythonShell, PythonShellError} from "python-shell";
import * as which from "which";

import {createMenu} from "./menu";

export const openFile = () => {
    dialog
        .showOpenDialog({
            properties: ["openFile"],
            filters: [
                {
                    name: "Webviz Config Files",
                    extensions: ["yml", "yaml"],
                },
            ],
        })
        .then((fileObj: Electron.OpenDialogReturnValue) => {
            const window = BrowserWindow.getFocusedWindow();
            if (!fileObj.canceled && window) {
                window.webContents.send("file-opened", fileObj.filePaths);
                fileObj.filePaths.forEach((filePath: string) => {
                    addRecentDocument(filePath);
                });
            }
        })
        .catch(err => {
            console.error(err);
        });
};

export const checkIfPythonInterpreter = (pythonInterpreter: string) => {
    let message: string = "";
    try {
        if (fs.existsSync(pythonInterpreter)) {
            try {
                fs.accessSync(pythonInterpreter as string, fs.constants.X_OK);
                try {
                    const regExp = new RegExp(
                        "\\[('[a-zA-Z0-9\\.\\-_/\\\\]{0,}'(, )?)+\\]"
                    );
                    const response = execSync(
                        `${
                            pythonInterpreter as string
                        } -c "import sys; print(sys.path)"`
                    ).toString();
                    if (!regExp.test(response)) {
                        throw Error("Invalid Python interpreter");
                    }
                    return {
                        success: true,
                        message,
                    };
                } catch (error) {
                    message = "Invalid Python interpreter.";
                }
            } catch (error) {
                message = "File is not executable.";
            }
        } else {
            message = "File does not exist.";
        }
    } catch (error) {
        message = "Invalid file path.";
    }
    return {
        success: false,
        message,
    };
};

export const findPythonInterpreters = (): {
    options: string[];
    success: boolean;
} => {
    let options: string[] = [];
    let success = true;
    try {
        which.default(
            "python",
            {all: true},
            (
                err: Error | null,
                resolvedPaths: string | readonly string[] | undefined
            ) => {
                if (err) {
                    which.default(
                        "python3",
                        {all: true},
                        (
                            error: Error | null,
                            resolvedPaths2:
                                | string
                                | readonly string[]
                                | undefined
                        ) => {
                            if (error) {
                                options = [];
                                success = false;
                            } else if (resolvedPaths2 === undefined) {
                                options = [];
                            } else if (resolvedPaths2.constructor === Array) {
                                options = resolvedPaths2;
                            } else if (resolvedPaths2.constructor === String) {
                                options = [resolvedPaths2 as string];
                            }
                        }
                    );
                } else if (resolvedPaths === undefined) {
                    options = [];
                } else if (resolvedPaths.constructor === Array) {
                    options = resolvedPaths;
                } else if (resolvedPaths.constructor === String) {
                    options = [resolvedPaths as string];
                }
            }
        );
    } catch (err) {
        try {
            which.default(
                "python3",
                {all: true},
                (
                    error: Error | null,
                    resolvedPaths: string | readonly string[] | undefined
                ) => {
                    if (error) {
                        success = false;
                    }
                    if (resolvedPaths === undefined) {
                        options = [];
                    } else if (resolvedPaths.constructor === Array) {
                        options = resolvedPaths;
                    } else if (resolvedPaths.constructor === String) {
                        options = [resolvedPaths as string];
                    }
                }
            );
        } catch (error) {
            success = false;
        }
    }

    return {
        options,
        success,
    };
};

export const findWebvizThemes = (
    pythonPath: string,
    event: Electron.IpcMainEvent
) => {
    let themes: string[] = [];
    let success = false;
    const opts: Options = {
        mode: "json",
        pythonPath,
    };
    PythonShell.run(
        path.resolve(app.getAppPath(), "python", "webviz_themes.py"),
        opts,
        (err?: PythonShellError, output?: any[]) => {
            if (output && output.length > 0 && "themes" in output[0]) {
                themes = output[0]["themes"];
                success = true;
            } else {
                success = false;
            }
            event.reply("webviz-themes", {themes, success});
        }
    );
};

export const selectFileDialog = (
    event: Electron.IpcMainInvokeEvent,
    options: FileExplorerOptions
) => {
    const browserWindow = BrowserWindow.fromId(event.sender.id);
    let dialogOptions: Electron.OpenDialogSyncOptions = {};
    if (options.isDirectoryExplorer) {
        dialogOptions.properties = ["openDirectory"];
    } else {
        if (options.allowMultiple) {
            dialogOptions.properties = ["multiSelections"];
        }
        if (options.filter) {
            dialogOptions.filters = options.filter;
        }
    }

    dialogOptions.properties?.push("createDirectory");

    if (options.defaultPath) {
        dialogOptions.defaultPath = options.defaultPath;
    }

    if (browserWindow) {
        return dialog.showOpenDialogSync(browserWindow, dialogOptions);
    }
    return dialog.showOpenDialogSync(dialogOptions);
};

/**
 * prompts to select a file using the native dialogs
 */

export const saveFileDialog = (
    event: Electron.IpcMainInvokeEvent,
    options: FileOptions
) => {
    const browserWindow = BrowserWindow.fromId(event.sender.id);
    let dialogOptions: Electron.SaveDialogSyncOptions = {};
    if (options.filter) {
        dialogOptions.filters = options.filter;
    }

    dialogOptions.properties?.push("createDirectory");

    if (options.defaultPath) {
        dialogOptions.defaultPath = options.defaultPath;
    }

    if (options.title) {
        dialogOptions.title = options.title;
    }

    if (browserWindow) {
        return dialog.showSaveDialogSync(browserWindow, dialogOptions);
    }
    return dialog.showSaveDialogSync(dialogOptions);
};

const getUserDataDir = (): string => {
    return app.getPath("userData");
};

export const addRecentDocument = (filePath: string) => {
    const files = getRecentDocuments();
    if (files.includes(filePath)) {
        return;
    }
    if (files.length >= 5) {
        files.shift();
    }
    files.unshift(filePath);
    const recentDocumentsFile = path.join(
        getUserDataDir(),
        ".recent-documents"
    );
    fs.appendFileSync(recentDocumentsFile, `${filePath}\n`);
    createMenu();
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
        window.webContents.send("update-recent-documents", files);
    }
};

export const getRecentDocuments = (): string[] => {
    const recentDocumentsFile = path.join(
        getUserDataDir(),
        ".recent-documents"
    );
    if (!fs.existsSync(recentDocumentsFile)) {
        return [];
    }
    const content = fs.readFileSync(recentDocumentsFile);
    return content
        .toString()
        .split("\n")
        .filter(el => fs.existsSync(el));
};

export const clearRecentDocuments = () => {
    const recentDocumentsFile = path.join(
        getUserDataDir(),
        ".recent-documents"
    );
    fs.writeFileSync(recentDocumentsFile, "");
    createMenu();
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
        window.webContents.send("update-recent-documents", []);
    }
};
