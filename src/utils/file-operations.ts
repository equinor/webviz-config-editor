import fs from "fs";

export const getFileContent = (filePath: string): string => {
    try {
        return fs.readFileSync(filePath).toString();
    } catch (e) {
        return "";
    }
};
