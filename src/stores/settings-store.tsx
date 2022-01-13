import {ipcRenderer} from "electron";

import React from "react";

import fs from "fs";
import path from "path";

import {createGenericContext} from "@utils/generic-context";
import {PluginParser} from "@utils/plugin-parser";
import {Settings, compressSettings} from "@utils/settings";

import {useNotifications} from "@components/Notifications";

import {LogEntry} from "@shared-types/log";
import {MainProcessData} from "@shared-types/main-process-data";
import {Setting} from "@shared-types/settings";

type ActionMap<
    M extends {
        [index: string]: {
            [key: string]:
                | string
                | number
                | Setting[]
                | object
                | null
                | boolean;
        };
    }
> = {
    [Key in keyof M]: M[Key] extends undefined
        ? {
              type: Key;
          }
        : {
              type: Key;
              payload: M[Key];
          };
};

const writeSettings = (settings: Setting[], settingsPath: string): boolean => {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings));
        return true;
    } catch (error) {
        return false;
    }
};

const readSettings = (settingsPath: string): Setting[] => {
    try {
        const fileContent = fs.readFileSync(settingsPath).toString();
        const settings = JSON.parse(fileContent);
        return settings;
    } catch (error) {
        return [];
    }
};

export enum StoreActions {
    SetSettings = "SET_SETTINGS",
    SetSetting = "SET_SETTING",
}

export type StoreState = {
    settings: Setting[];
    pluginParser: PluginParser;
    log: LogEntry[];
    settingsPath: string;
};

type Payload = {
    [StoreActions.SetSettings]: {
        settings: Setting[];
    };
    [StoreActions.SetSetting]: {
        id: string;
        value: string | number | boolean;
    };
};

export type Actions = ActionMap<Payload>[keyof ActionMap<Payload>];
const initialState: StoreState = {
    settings: compressSettings(Settings),
    pluginParser: new PluginParser(),
    log: [],
    settingsPath: "",
};

export const StoreReducerInit = (state: StoreState): StoreState => {
    const appData: MainProcessData = ipcRenderer.sendSync("get-app-data");
    const settings = readSettings(appData.userDataDir);
    const pluginParser = new PluginParser();
    const jsonSchemaPath = settings.find(el => el.id === "schema")?.value;
    if (jsonSchemaPath && typeof jsonSchemaPath === "string") {
        try {
            const fileContent = fs.readFileSync(jsonSchemaPath).toString();
            pluginParser.parse(JSON.parse(fileContent));
        } catch (e) {
            console.log(e);
        }
    }
    if (settings.length > 0) {
        return {
            settings,
            pluginParser,
            log: [],
            settingsPath: path.join(appData.userDataDir, ".settings"),
        };
    }
    return initialState;
};

export const StoreReducer = (
    state: StoreState,
    action: Actions
): StoreState => {
    if (action.type === StoreActions.SetSettings) {
        writeSettings(action.payload.settings, state.settingsPath);
        return {
            ...state,
            settings: action.payload.settings,
        };
    }
    if (action.type === StoreActions.SetSetting) {
        const newSettings = state.settings.map(setting => ({
            id: setting.id,
            value:
                setting.id === action.payload.id
                    ? action.payload.value
                    : setting.value,
        }));
        if (action.payload.id === "schema") {
            const jsonSchemaPath = action.payload.value;
            if (jsonSchemaPath && typeof jsonSchemaPath === "string") {
                try {
                    const fileContent = fs
                        .readFileSync(jsonSchemaPath)
                        .toString();
                    state.pluginParser.parse(JSON.parse(fileContent));
                } catch (e) {
                    console.log(e);
                }
            }
        }
        writeSettings(newSettings, state.settingsPath);
        return {
            ...state,
            settings: newSettings,
        };
    }
    return state;
};

type Context = {
    state: StoreState;
    dispatch: React.Dispatch<Actions>;
};

const [useStoreContext, StoreContextProvider] = createGenericContext<Context>();

export const StoreProvider: React.FC = ({children}) => {
    const [state, dispatch] = React.useReducer(
        StoreReducer,
        initialState,
        StoreReducerInit
    );

    const notifications = useNotifications();

    return (
        <StoreContextProvider value={{state, dispatch}}>
            {children}
        </StoreContextProvider>
    );
};

export const useStore = (): Context => useStoreContext();
