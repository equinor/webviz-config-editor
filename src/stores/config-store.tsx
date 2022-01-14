import {ipcRenderer} from "electron";

import React from "react";

import fs from "fs";
import path from "path";

import {createGenericContext} from "@utils/generic-context";

import {useNotifications} from "@components/Notifications";

import {LogEntry} from "@shared-types/log";
import {MainProcessData} from "@shared-types/main-process-data";
import {Config} from "@shared-types/view-config";

type ActionMap<
    M extends {
        [index: string]: {[key: string]: string | Config};
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

const writeConfig = (config: Config[], configPath: string): boolean => {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config));
        return true;
    } catch (error) {
        return false;
    }
};

const readConfig = (configPath: string): Config[] => {
    try {
        const fileContent = fs.readFileSync(configPath).toString();
        const config = JSON.parse(fileContent);
        return config;
    } catch (error) {
        return [];
    }
};

export enum StoreActions {
    SetConfig = "SET_CONFIG",
}

export type StoreState = {
    config: Config[];
    log: LogEntry[];
    configPath: string;
};

type Payload = {
    [StoreActions.SetConfig]: {
        config: Config;
    };
};

export type Actions = ActionMap<Payload>[keyof ActionMap<Payload>];
const initialState: StoreState = {
    config: [],
    log: [],
    configPath: "",
};

export const StoreReducerInit = (state: StoreState): StoreState => {
    const appData: MainProcessData = ipcRenderer.sendSync("get-app-data");
    const configPath = path.join(appData.userDataDir, ".config");
    console.log(appData);
    const config = readConfig(configPath);
    if (config.length > 0) {
        return {
            config,
            log: [],
            configPath,
        };
    }
    return state;
};

export const StoreReducer = (
    state: StoreState,
    action: Actions
): StoreState => {
    if (action.type === StoreActions.SetConfig) {
        let newConfig: Config[] = [];
        if (
            state.config.find(
                config => config.id === action.payload.config.id
            ) !== undefined
        ) {
            newConfig = state.config.map(config => ({
                id: config.id,
                config:
                    config.id === action.payload.config.id
                        ? action.payload.config.config
                        : config.config,
            }));
        } else {
            newConfig = state.config;
            newConfig.push(action.payload.config);
        }

        if (writeConfig(newConfig, state.configPath)) {
            return {
                ...state,
                config: newConfig,
            };
        }
        return state;
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
