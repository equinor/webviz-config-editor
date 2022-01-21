import {
    BrowserWindow,
    Menu,
    MenuItemConstructorOptions,
    app,
    dialog,
} from "electron";

import * as path from "path";

import {clearRecentDocuments, getRecentDocuments, openFile} from "./commands";

export const createMenu = () => {
    const isMac = process.platform === "darwin";

    const listOfRecentDocuments = getRecentDocuments();
    const recentDocuments = listOfRecentDocuments.map(doc => ({
        label: path.basename(doc),
        click() {
            const window = BrowserWindow.getFocusedWindow();
            if (window) {
                window.webContents.send("file-opened", [doc]);
            }
        },
    }));
    recentDocuments.push({
        label: "Clear Recent",
        click() {
            clearRecentDocuments();
        },
    });

    const template = [
        // { role: 'appMenu' }
        ...(isMac
            ? [
                  {
                      label: app.name,
                      submenu: [
                          {role: "about"},
                          {type: "separator"},
                          {role: "services"},
                          {type: "separator"},
                          {role: "hide"},
                          {role: "hideOthers"},
                          {role: "unhide"},
                          {type: "separator"},
                          {role: "quit"},
                      ],
                  },
              ]
            : []),
        // { role: 'fileMenu' }
        {
            label: "File",
            submenu: [
                {
                    label: "New File",
                    accelerator: "CmdOrCtrl+N",
                    click() {
                        const window = BrowserWindow.getFocusedWindow();
                        if (window) {
                            window.webContents.send("new-file");
                        }
                    },
                },
                {
                    label: "Open File...",
                    accelerator: "CmdOrCtrl+O",
                    click() {
                        openFile();
                    },
                },
                {
                    label: "Open Recent",
                    submenu: recentDocuments,
                },
                {
                    label: "Save",
                    accelerator: "CmdOrCtrl+S",
                    click() {
                        const window = BrowserWindow.getFocusedWindow();
                        if (window) {
                            window.webContents.send("save-file");
                        }
                    },
                },
                {
                    label: "Save as...",
                    accelerator: "CmdOrCtrl+Shift+S",
                    click() {
                        dialog
                            .showSaveDialog({
                                title: "Save file as...",
                                properties: [
                                    "createDirectory",
                                    "showOverwriteConfirmation",
                                ],
                                filters: [
                                    {
                                        name: "Webviz Config Files",
                                        extensions: ["yml", "yaml"],
                                    },
                                ],
                            })
                            .then((fileObj: any) => {
                                if (!fileObj.canceled && fileObj.filePath) {
                                    const window =
                                        BrowserWindow.getFocusedWindow();
                                    if (window) {
                                        window.webContents.send("save-file-as");
                                    }
                                }
                            })
                            .catch(err => {
                                console.error(err);
                            });
                    },
                },
                isMac ? {role: "close"} : {role: "quit"},
            ],
        },
        // { role: 'editMenu' }
        {
            label: "Edit",
            submenu: [
                {role: "cut"},
                {role: "copy"},
                {role: "paste"},
                ...(isMac
                    ? [
                          {role: "pasteAndMatchStyle"},
                          {role: "delete"},
                          {role: "selectAll"},
                          {type: "separator"},
                          {
                              label: "Speech",
                              submenu: [
                                  {role: "startSpeaking"},
                                  {role: "stopSpeaking"},
                              ],
                          },
                      ]
                    : [
                          {role: "delete"},
                          {type: "separator"},
                          {role: "selectAll"},
                      ]),
            ],
        },
        // { role: 'viewMenu' }
        {
            label: "View",
            submenu: [
                {role: "reload"},
                {role: "forceReload"},
                {role: "toggleDevTools"},
                {type: "separator"},
                {role: "resetZoom"},
                {role: "zoomIn"},
                {role: "zoomOut"},
                {type: "separator"},
                {role: "togglefullscreen"},
            ],
        },
        // { role: 'windowMenu' }
        {
            label: "Window",
            submenu: [
                {role: "minimize"},
                {role: "zoom"},
                ...(isMac
                    ? [
                          {type: "separator"},
                          {role: "front"},
                          {type: "separator"},
                          {role: "window"},
                      ]
                    : [{role: "close"}]),
            ],
        },
        {
            role: "help",
            submenu: [
                {
                    label: "Learn More",
                    click: async () => {
                        /* eslint-disable global-require */
                        const {shell} = require("electron");
                        await shell.openExternal(
                            "https://equinor.github.io/webviz-subsurface"
                        );
                    },
                },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(
        template as Array<MenuItemConstructorOptions>
    );
    Menu.setApplicationMenu(menu);
};
