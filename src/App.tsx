/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MPLv2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import "./App.css";
import {ThemeProvider, createTheme, useMediaQuery} from "@mui/material";

import React from "react";

import {GetStartedDialog} from "@components/GetStartedDialog";
import {MainProcessDataProvider} from "@components/MainProcessDataProvider";
import {MainWindow} from "@components/MainWindow";
import {NotificationsProvider} from "@components/Notifications";
import {StoreProvider} from "@components/StoreProvider/store-provider";

import {useAppDispatch} from "@redux/hooks";
import {setTheme} from "@redux/reducers/ui";

import {Themes} from "@shared-types/ui";

export const ColorModeContext = React.createContext({
    toggleColorMode: () => {},
});

function App(): JSX.Element {
    const dispatch = useAppDispatch();
    const [mode, setMode] = React.useState<"light" | "dark">(
        useMediaQuery("(prefers-color-scheme: dark)") ? "dark" : "light"
    );
    const colorMode = React.useMemo(
        () => ({
            toggleColorMode: () => {
                setMode(prevMode => {
                    const newMode = prevMode === "light" ? "dark" : "light";
                    dispatch(setTheme(newMode as Themes));
                    return newMode;
                });
            },
        }),
        []
    );

    const theme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                },
            }),
        [mode]
    );

    return (
        <MainProcessDataProvider>
            <ColorModeContext.Provider value={colorMode}>
                <ThemeProvider theme={theme}>
                    <NotificationsProvider>
                        <StoreProvider>
                            <GetStartedDialog />
                            <MainWindow />
                        </StoreProvider>
                    </NotificationsProvider>
                </ThemeProvider>
            </ColorModeContext.Provider>
        </MainProcessDataProvider>
    );
}

export default App;
