import {ipcRenderer} from "electron";

import React from "react";

import {createGenericContext} from "@utils/generic-context";

import {MainProcessData} from "@shared-types/main-process-data";

import {openFile} from "@redux/thunks";
import { useAppDispatch } from "@redux/hooks";
import { useYamlParser } from "@services/yaml-parser";

const [useDataProvider, DataProvider] = createGenericContext<MainProcessData>();

export const MainProcessDataProvider: React.FC = ({children}) => {
    const [data, setData] = React.useState<MainProcessData>({
        version: "unknown",
        userDataDir: "",
        userHomeDir: "",
        appDir: "",
        isDev: false,
        filePathArg: null,
    });

    const dispatch = useAppDispatch();
    const yamlParser = useYamlParser();

    React.useEffect(() => {
        const mainProcessData = ipcRenderer.sendSync("get-app-data");
        if (mainProcessData.filePathArg) {
            openFile(mainProcessData.filePathArg, dispatch, yamlParser);
        }
        setData(mainProcessData);
    }, [dispatch, yamlParser]);

    return <DataProvider value={data}>{children}</DataProvider>;
};

export const useMainProcessDataProvider = (): MainProcessData =>
    useDataProvider();
