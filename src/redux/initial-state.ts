import electronStore from "@utils/electron-store";

import {PreferencesState} from "@shared-types/preferences";
import {Pages, UiState} from "@shared-types/ui";
import {UiCoachState} from "@shared-types/ui-coach";

const paneConfiguration = electronStore.get("ui.paneConfiguration");

const initialUiState: UiState = {
    currentPage: Pages.Editor,
    settings: {
        theme: electronStore.get("ui.settings.theme"),
    },
    paneConfiguration: Object.keys(paneConfiguration).map(key => ({
        name: key,
        sizes: paneConfiguration[key],
    })),
};

const initialPreferencesState: PreferencesState = {
    pathToPythonInterpreter: "",
    pathToYamlSchemaFile: "",
    webvizTheme: "",
};

const initialUiCoachState: UiCoachState = {
    initialConfigurationDone: false,
};

export default {
    ui: initialUiState,
    uiCoach: initialUiCoachState,
    preferences: initialPreferencesState,
};
