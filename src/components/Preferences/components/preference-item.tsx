import "./preference-item.css";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    FormHelperText,
    Grid,
    MenuItem,
    Select,
    TextField,
} from "@mui/material";

import {ipcRenderer} from "electron";

import React from "react";

import * as path from "path";

import {SettingsStore} from "@stores";

import {FileExplorerOptions} from "@shared-types/file-explorer-options";
import {FileFilter, Setting, SettingMeta} from "@shared-types/settings";

enum PreferenceItemState {
    VALIDATING = 0,
    VALID,
    INVALID,
}

enum PreferenceItemLoadingState {
    LOADING = 0,
    LOADED,
    ERROR,
}

export const PreferenceItem: React.FC<SettingMeta> = props => {
    const store = SettingsStore.useStore();

    const [localValue, setLocalValue] = React.useState<
        string | number | boolean
    >("");
    const [tempValue, setTempValue] = React.useState<string | number | boolean>(
        ""
    );
    const [options, setOptions] = React.useState<string[]>([]);
    const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
    const [loadingState, setLoadingState] =
        React.useState<PreferenceItemLoadingState>(
            props.type === "pythonInterpreter"
                ? PreferenceItemLoadingState.LOADING
                : PreferenceItemLoadingState.LOADED
        );
    const [state, setState] = React.useState<{
        state: PreferenceItemState;
        message: string;
    }>({
        state: PreferenceItemState.VALID,
        message: "",
    });

    React.useEffect(() => {
        setLocalValue(
            store.state.settings.find((el: Setting) => el.id === props.id)
                ?.value || ""
        );
    }, []);

    React.useEffect(() => {
        setTempValue(localValue);
    }, [localValue]);

    React.useEffect(() => {
        if (props.type === "pythonInterpreter") {
            setLoadingState(PreferenceItemLoadingState.LOADING);
            ipcRenderer.send("find-python-interpreters");
            ipcRenderer.once("python-interpreters", (event, arg) => {
                if (arg.success) {
                    setLoadingState(PreferenceItemLoadingState.LOADED);
                } else {
                    setLoadingState(PreferenceItemLoadingState.ERROR);
                }
                setOptions(arg.options);
            });
        } else if (props.type === "theme") {
            setLoadingState(PreferenceItemLoadingState.LOADING);
            ipcRenderer.send(
                "get-webviz-themes",
                store.state.settings
                    .find(el => el.id === "python-interpreter")
                    ?.value.toString() || ""
            );
            ipcRenderer.once("webviz-themes", (event, arg) => {
                if (arg.success) {
                    setLoadingState(PreferenceItemLoadingState.LOADED);
                } else {
                    setLoadingState(PreferenceItemLoadingState.ERROR);
                }
                setOptions(arg.themes);
            });
        }
    }, [setOptions, setLoadingState, store.state.settings]);

    React.useEffect(() => {
        setState({state: PreferenceItemState.VALID, message: ""});
        if (props.type === "pythonInterpreter") {
            setState({state: PreferenceItemState.VALIDATING, message: ""});
            if (localValue === "") {
                return;
            }
            ipcRenderer.send("check-if-python-interpreter", localValue);
            ipcRenderer.once("python-interpreter-check", (event, arg) => {
                if (arg.success) {
                    setState({
                        state: PreferenceItemState.VALID,
                        message: "",
                    });
                    store.dispatch({
                        type: SettingsStore.StoreActions.SetSetting,
                        payload: {
                            id: props.id,
                            value: localValue as string | number | boolean,
                        },
                    });
                } else {
                    setState({
                        state: PreferenceItemState.INVALID,
                        message: arg.message,
                    });
                }
            });
        } else {
            store.dispatch({
                type: SettingsStore.StoreActions.SetSetting,
                payload: {
                    id: props.id,
                    value: localValue as string | number | boolean,
                },
            });
        }
    }, [localValue, props.id, props.type]);

    const handleValueChanged = (value: string | number | boolean) => {
        if (props.type === "pythonInterpreter") {
            if (value === "custom") {
                setDialogOpen(true);
                return;
            }
        }
        setLocalValue(value);
    };

    const openFileDialog = (filter: FileFilter[], defaultPath: string) => {
        const opts: FileExplorerOptions = {
            filter,
            defaultPath,
        };
        ipcRenderer.invoke("select-file", opts).then(files => {
            if (files) {
                if (props.type === "pythonInterpreter") {
                    setTempValue(files[0]);
                } else {
                    setLocalValue(files[0]);
                }
            }
        });
    };

    return (
        <div className="PreferenceItem">
            <span className="PreferenceTitle">{props.label}</span>
            <span className="PreferenceDescription">{props.description}</span>
            <div className="PreferenceValue">
                {props.type === "string" && (
                    <TextField
                        id={props.id}
                        type={props.type}
                        value={localValue as string}
                        error={state.state === PreferenceItemState.INVALID}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setLocalValue(e.target.value)
                        }
                    />
                )}
                {props.type === "pythonInterpreter" && (
                    <FormControl
                        error={state.state === PreferenceItemState.INVALID}
                    >
                        {loadingState ===
                            PreferenceItemLoadingState.LOADING && (
                            <CircularProgress />
                        )}
                        {loadingState === PreferenceItemLoadingState.LOADED && (
                            <>
                                <Select
                                    value={
                                        localValue as string | number | boolean
                                    }
                                    onChange={e =>
                                        handleValueChanged(e.target.value)
                                    }
                                    className="PreferenceInput"
                                    displayEmpty
                                    renderValue={(
                                        value: string | number | boolean
                                    ) =>
                                        value === "" ? (
                                            <i>Please select...</i>
                                        ) : (
                                            value
                                        )
                                    }
                                >
                                    {options.map(option => (
                                        <MenuItem value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                    {!options.includes(
                                        localValue as string
                                    ) && (
                                        <MenuItem value={localValue as string}>
                                            {localValue}
                                        </MenuItem>
                                    )}
                                    <MenuItem value="custom">
                                        Select from system...
                                    </MenuItem>
                                </Select>
                                {state.state ===
                                    PreferenceItemState.INVALID && (
                                    <FormHelperText>
                                        {state.message}
                                    </FormHelperText>
                                )}
                            </>
                        )}
                        <Dialog
                            open={dialogOpen}
                            onClose={() => setDialogOpen(false)}
                        >
                            <DialogTitle>
                                Path to Python Interpreter
                            </DialogTitle>
                            <DialogContent>
                                <DialogContentText>
                                    {props.description}
                                </DialogContentText>
                                <Grid
                                    container
                                    flexDirection="row"
                                    alignItems="center"
                                    spacing={2}
                                >
                                    <Grid item>
                                        <TextField
                                            margin="dense"
                                            type="text"
                                            aria-readonly
                                            value={tempValue}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <Button
                                            onClick={() =>
                                                openFileDialog(
                                                    [
                                                        {
                                                            name: "Python interpreter",
                                                            extensions: ["*"],
                                                        },
                                                    ],
                                                    path.dirname(
                                                        localValue as string
                                                    )
                                                )
                                            }
                                        >
                                            Change
                                        </Button>
                                    </Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        setDialogOpen(false);
                                        setLocalValue(tempValue);
                                    }}
                                >
                                    Save
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </FormControl>
                )}
                {props.type === "theme" && (
                    <>
                        {loadingState ===
                            PreferenceItemLoadingState.LOADING && (
                            <CircularProgress />
                        )}
                        {loadingState === PreferenceItemLoadingState.LOADED && (
                            <Select
                                value={localValue as string | number | boolean}
                                onChange={e =>
                                    handleValueChanged(e.target.value)
                                }
                                className="PreferenceInput"
                                displayEmpty
                            >
                                <MenuItem value="">
                                    <em>Default</em>
                                </MenuItem>
                                {options.map(option => (
                                    <MenuItem value={option}>{option}</MenuItem>
                                ))}
                            </Select>
                        )}
                    </>
                )}
                {props.type === "file" && (
                    <>
                        {loadingState ===
                            PreferenceItemLoadingState.LOADING && (
                            <CircularProgress />
                        )}
                        {loadingState === PreferenceItemLoadingState.LOADED && (
                            <>
                                <TextField
                                    aria-readonly
                                    className="PreferenceInput"
                                    hiddenLabel
                                    value={localValue}
                                    size="small"
                                />
                                <Button
                                    onClick={() =>
                                        openFileDialog(
                                            props.fileFilter || [],
                                            path.dirname(localValue as string)
                                        )
                                    }
                                >
                                    Select
                                </Button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
