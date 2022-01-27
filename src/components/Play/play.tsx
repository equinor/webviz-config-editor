import {Error, Terminal} from "@mui/icons-material";
import {
    CircularProgress,
    Grid,
    Paper,
    Typography,
    useTheme,
} from "@mui/material";

import React from "react";
import Iframe from "react-iframe";

import {useMainProcessDataProvider} from "@components/MainProcessDataProvider/main-process-data-provider";
import {NotificationType} from "@components/Notifications";
import {ResizablePanels} from "@components/ResizablePanels";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {addNotification} from "@redux/reducers/notifications";

import fs from "fs";
import * as path from "path";
import {Options, PythonShell} from "python-shell";

import "./play.css";

const formatConsoleLine = (line: string): JSX.Element => {
    const colorTable: {
        [key: string]: {color: string; backgroundColor: string};
    } = {
        "37;43m": {color: "#fff", backgroundColor: "#DEA900"},
    };
    /* eslint-disable no-control-regex */
    const regexp = /(\x1b[[0-9]{1,};?[0-9]{0,}m)([^\x1b]{0,})/g;

    const matches = line.matchAll(regexp);
    const output: JSX.Element[] = [];
    Array.from(matches).forEach(match => {
        if (match.length > 1) {
            const colorCode = match[1].replace("\x1b[", "");
            const colorExists = Object.keys(colorTable).find(
                el => el === colorCode
            );
            const color = colorExists
                ? colorTable[colorCode]
                : {color: "inherit", backgroundColor: "inherit"};
            output.push(
                <span
                    style={{
                        color: color.color,
                        backgroundColor: color.backgroundColor,
                    }}
                >
                    {match[2]}
                </span>
            );
        } else {
            output.push(<span>{match[2]}</span>);
        }
    });
    return <>{output}</>;
};

export const Play: React.FC = () => {
    const dispatch = useAppDispatch();
    const [consoleMessages, setConsoleMessages] = React.useState<string[]>([]);
    const [hasError, setHasError] = React.useState<boolean>(false);
    const [loading, setLoading] = React.useState<boolean>(true);
    const interval = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const [token, setToken] = React.useState<string>("");
    const [port, setPort] = React.useState<string>("5000");

    const mainProcess = useMainProcessDataProvider();

    const pythonInterpreterPath = useAppSelector(
        state => state.preferences.pathToPythonInterpreter
    );
    const webvizTheme = useAppSelector(state => state.preferences.webvizTheme);

    const theme = useTheme();

    const activeFilePath = useAppSelector(state => state.files.activeFile);

    const buildWebviz = () => {
        const args = [path.resolve(activeFilePath)];
        if (webvizTheme !== "") {
            args.push(webvizTheme as string);
        } else {
            args.push("default");
        }
        args.push(path.resolve(mainProcess.userDataDir, "token"));
        const options: Options = {
            mode: "text",
            pythonOptions: ["-u"],
            pythonPath: pythonInterpreterPath,
            args,
        };
        const pythonShell = new PythonShell(
            path.resolve("./", "python", "webviz_build.py"),
            options
        );
        pythonShell.on("message", chunk => {
            setConsoleMessages([...consoleMessages, chunk]);
        });
        pythonShell.on("error", error => {
            setHasError(true);
            dispatch(
                addNotification({
                    type: NotificationType.ERROR,
                    message: error.message,
                })
            );
            console.log(error);
        });
        setHasError(false);
        if (interval.current) {
            clearInterval(interval.current);
        }
        interval.current = setInterval(() => {
            try {
                const tokenAndPort = fs
                    .readFileSync(
                        path.resolve(mainProcess.userDataDir, "token")
                    )
                    .toString()
                    .split("\n");
                fetch(
                    `http://localhost:${tokenAndPort[1]}?ott=${tokenAndPort[0]}`,
                    {
                        method: "GET",
                    }
                )
                    .then(response => {
                        if (response.status === 200) {
                            setLoading(false);
                            if (interval.current) {
                                clearInterval(interval.current);
                            }
                            setToken(tokenAndPort[0]);
                            setPort(tokenAndPort[1]);
                            fs.unlinkSync(
                                path.resolve(mainProcess.userDataDir, "token")
                            );
                        } else {
                            setLoading(true);
                        }
                    })
                    .catch(() => setLoading(true));
            } catch (e) {
                console.log(e);
            }
        }, 1000);
        return pythonShell;
    };

    React.useEffect(() => {
        if (pythonInterpreterPath === "") {
            setHasError(true);
            setLoading(false);
            return;
        }
        const pythonShell = buildWebviz();

        return () => {
            if (interval.current) {
                clearInterval(interval.current);
            }
            if (pythonShell) {
                pythonShell.kill("SIGINT");
            }
        };
    }, []);

    return (
        <div className="Play">
            <ResizablePanels id="Play-Console" direction="vertical">
                <Grid
                    container
                    direction="column"
                    justifyContent="center"
                    alignItems="center"
                    spacing={2}
                    className="Playground"
                    style={{height: "100%"}}
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
                    {!hasError && loading && (
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
                        <div
                            style={{
                                backgroundColor: "#fff",
                                height: "100%",
                                width: "100%",
                            }}
                        >
                            <Iframe
                                url={`http://localhost:${port}?ott=${token}`}
                                width="100%"
                                height="100%"
                            />
                        </div>
                    )}
                </Grid>
                <div
                    className="Console"
                    style={{color: theme.palette.text.primary}}
                >
                    <Paper
                        elevation={1}
                        style={{padding: 16}}
                        sx={{borderRadius: 0}}
                    >
                        <Grid
                            container
                            columnSpacing={2}
                            spacing={5}
                            direction="row"
                            alignItems="center"
                        >
                            <Grid item>
                                <Terminal color="action" />
                            </Grid>
                            <Grid item>Terminal</Grid>
                        </Grid>
                    </Paper>
                    {consoleMessages.map(msg => (
                        <div className="ConsoleLine">
                            {formatConsoleLine(msg)}
                        </div>
                    ))}
                </div>
            </ResizablePanels>
        </div>
    );
};
