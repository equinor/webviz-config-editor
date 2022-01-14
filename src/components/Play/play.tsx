import "./play.css";
import {Error, OpenInBrowser} from "@mui/icons-material";
import {CircularProgress, Grid, Typography, useTheme} from "@mui/material";

import React from "react";

import * as path from "path";
import {Options, PythonShell} from "python-shell";

import {NotificationType, useNotifications} from "@components/Notifications";

import {FilesStore, SettingsStore} from "@stores";

// const { app } = require("@electron/remote");

export const Play: React.FC = () => {
    const store = SettingsStore.useStore();
    const fileStore = FilesStore.useStore();
    const notifications = useNotifications();
    const [hasError, setHasError] = React.useState<boolean>(false);
    const [loading, setLoading] = React.useState<boolean>(true);
    const interval = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const theme = useTheme();

    const buildWebviz = () => {
        const args = [
            "build",
            path.resolve(
                fileStore.state.files.find(
                    file => file.uuid === fileStore.state.activeFileUuid
                )?.editorModel.uri.path || ""
            ),
        ];
        const webvizTheme =
            store.state.settings.find(setting => setting.id === "theme")
                ?.value || "";
        if (webvizTheme !== "") {
            args.push("--theme", webvizTheme as string);
        }
        const options: Options = {
            mode: "text",
            pythonPath:
                store.state.settings
                    .find(el => el.id === "python-interpreter")
                    ?.value.toString() || "",
            args,
        };
        const pythonShell = new PythonShell(
            path.resolve("./", "python", "webviz_build.py"),
            options
        );
        pythonShell.on("message", chunk => {
            console.log(chunk);
        });
        pythonShell.on("error", error => {
            setHasError(true);
            notifications.appendNotification({
                type: NotificationType.ERROR,
                message: error.message,
            });
            console.log(error);
        });
        pythonShell.stdout.on("data", data => {
            console.log(data);
        });
        setHasError(false);
        if (interval.current) {
            clearInterval(interval.current);
        }
        interval.current = setInterval(() => {
            fetch("http://localhost:5000", {
                method: "GET",
            })
                .then(response => {
                    if (response.status === 200 || response.status === 401) {
                        setLoading(false);
                        if (interval.current) {
                            clearInterval(interval.current);
                        }
                    } else {
                        setLoading(true);
                        setHasError(true);
                    }
                })
                .catch(() => setLoading(true));
        }, 1000);
        return pythonShell;
    };

    React.useEffect(() => {
        const pythonInterpreter = store.state.settings.find(
            setting => setting.id === "python-interpreter"
        );
        if (!pythonInterpreter || pythonInterpreter.value === "") {
            setHasError(true);
            return;
        }
        const pythonShell = buildWebviz();

        return () => {
            if (interval.current) {
                clearInterval(interval.current);
            }
            if (pythonShell) {
                pythonShell.kill();
            }
        };
    }, []);

    return (
        <div className="Play">
            <Grid
                container
                direction="column"
                justifyContent="center"
                alignItems="center"
                spacing={2}
            >
                {hasError && (
                    <>
                        <Grid item>
                            <Error fontSize="large" color="action" />
                        </Grid>
                        <Grid item>
                            <Typography
                                variant="body1"
                                color={theme.palette.text.primary}
                            >
                                An error occurred.
                            </Typography>
                        </Grid>
                    </>
                )}
                {loading && (
                    <>
                        <Grid item>
                            <CircularProgress />
                        </Grid>
                        <Grid item>
                            <Typography
                                variant="body1"
                                color={theme.palette.text.primary}
                            >
                                Building the Webviz dashboard...
                            </Typography>
                        </Grid>
                    </>
                )}
                {!loading && !hasError && (
                    <>
                        <Grid item>
                            <OpenInBrowser fontSize="large" color="action" />
                        </Grid>
                        <Grid item>
                            <Typography
                                variant="body1"
                                color={theme.palette.text.primary}
                            >
                                Please wait for the browser window to open.
                            </Typography>
                        </Grid>
                    </>
                )}
            </Grid>
        </div>
    );
};
