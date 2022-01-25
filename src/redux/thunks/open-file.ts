import {Context} from "@services/yaml-parser";

import {addFile} from "@redux/reducers/files";
import {addNotification} from "@redux/reducers/notifications";
import {AppDispatch} from "@redux/store";

import {Notification, NotificationType} from "@shared-types/notifications";

import fs from "fs";

export function openFile(
    filePath: string,
    dispatch: AppDispatch,
    yamlParser: Context
) {
    try {
        const content = fs.readFileSync(filePath).toString();
        dispatch(addFile({filePath, fileContent: content}));
        yamlParser.parse(content);
    } catch (e) {
        const notification: Notification = {
            type: NotificationType.ERROR,
            message: `Could not open file '${filePath}'. ${e}`,
        };
        dispatch(addNotification(notification));
    }
}
