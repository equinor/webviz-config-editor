import {BrowserWindow, ipcMain} from "electron";

import fs from "fs";

import {createMenu} from "./menu";

export class RecentFilesManager {
    private recentFiles: string[];
    constructor() {
        this.recentFiles = [];

        ipcMain.on("set-recent-files", (event, files: string[]) => {
            if (files) {
                this.recentFiles = [...files];
            } else this.recentFiles = [];
            createMenu();
            event.reply("recent-files-updated");
        });

        ipcMain.on("clear-recent-files", event => {
            this.recentFiles = [];
            createMenu();
            event.reply("recent-files-cleared");
        });
    }

    setRecentFiles(files: string[]) {
        files.forEach(file => {
            if (!this.recentFiles.includes(file)) {
                this.recentFiles.push(file);
            }
        });
    }

    getRecentFiles(): string[] {
        return this.recentFiles.filter((el: string) => fs.existsSync(el));
    }

    static clearRecentFiles() {
        const window = BrowserWindow.getFocusedWindow();
        if (window) {
            window.webContents.send("clear-recent-files");
        }
    }
}

export const RecentFiles = new RecentFilesManager();
