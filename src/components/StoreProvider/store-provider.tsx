import { FilesStore, SettingsStore, ConfigStore } from "@stores";
import React from "react";

export const StoreProvider: React.FC = (props) => {
    return (
        <FilesStore.StoreProvider>
            <SettingsStore.StoreProvider>
                <ConfigStore.StoreProvider>{props.children}</ConfigStore.StoreProvider>
            </SettingsStore.StoreProvider>
        </FilesStore.StoreProvider>
    );
};
