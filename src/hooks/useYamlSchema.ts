import {useEffect, useState} from "react";

import {preprocessJsonSchema} from "@utils/json-schema-preprocessor";

import {NotificationType, useNotifications} from "@components/Notifications";

import {useAppSelector} from "@redux/hooks";

import {setDiagnosticsOptions} from "monaco-yaml";

export const useYamlSchema = (yaml: any) => {
    const [loaded, setLoaded] = useState<boolean>(false);
    const pathToYamlSchemaFile = useAppSelector(
        state => state.preferences.pathToYamlSchemaFile
    );
    const notifications = useNotifications();

    useEffect(() => {
        if (yaml && pathToYamlSchemaFile && pathToYamlSchemaFile !== "") {
            let jsonSchema: object;
            try {
                jsonSchema = preprocessJsonSchema(pathToYamlSchemaFile);
            } catch (e) {
                notifications.appendNotification({
                    type: NotificationType.ERROR,
                    message: "Invalid Webviz YAML schema selected.",
                    action: {
                        label: "Change",
                        action: () => {},
                    },
                });
                return;
            }

            setDiagnosticsOptions({
                validate: true,
                enableSchemaRequest: true,
                hover: true,
                completion: true,
                format: true,
                schemas: [
                    {
                        fileMatch: ["*"],
                        uri: `file://${pathToYamlSchemaFile}`, // id of the first schema
                        schema: jsonSchema || {},
                    },
                ],
            });
            setLoaded(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathToYamlSchemaFile]);

    return loaded;
};
