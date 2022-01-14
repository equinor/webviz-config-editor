import "./main-window.css";
import {Edit, PlayArrow, Settings} from "@mui/icons-material";
import {Paper, Tab, Tabs, Tooltip, useTheme} from "@mui/material";

import React from "react";

import path from "path";

import {ColorModeContext} from "@src/App";

import {Editor} from "@components/Editor";
import {LivePreview} from "@components/LivePreview/live-preview";
import {Play} from "@components/Play";
import {Preferences} from "@components/Preferences/preferences";
import {ResizablePanels} from "@components/ResizablePanels";
import {ThemeSwitch} from "@components/ThemeSwitch";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setCurrentPage} from "@redux/reducers/ui";

import {FilesStore} from "@stores";

import {Pages} from "@shared-types/ui";

export const MainWindow: React.FC = props => {
    const currentPage = useAppSelector(state => state.ui.currentPage);
    const dispatch = useAppDispatch();
    const theme = useTheme();
    const colorMode = React.useContext(ColorModeContext);
    const store = FilesStore.useStore();

    const mainWindowRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        const file = store.state.files.find(
            el => el.uuid === store.state.activeFileUuid
        );
        if (!file || file.editorModel.uri.toString() === "") {
            document.title = "Webviz Config Editor";
            return;
        }
        const filePath = file.editorModel.uri.path;
        document.title = `${path.basename(filePath)} - Webviz Config Editor`;
    }, [store.state.files, store.state.activeFileUuid]);

    return (
        <div
            className="MainWindow"
            ref={mainWindowRef}
            style={{backgroundColor: theme.palette.background.default}}
        >
            <div className="ContentWrapper">
                <Paper elevation={2} className="TabMenu" sx={{borderRadius: 0}}>
                    <Tabs
                        orientation="vertical"
                        value={currentPage}
                        color="inherit"
                        onChange={(
                            event: React.SyntheticEvent<Element, Event>,
                            newValue: string
                        ) => dispatch(setCurrentPage(newValue as Pages))}
                    >
                        <Tab
                            icon={
                                <Tooltip
                                    title="Config File Editor"
                                    placement="right"
                                    arrow
                                >
                                    <Edit color="inherit" />
                                </Tooltip>
                            }
                            value="editor"
                            className="MenuTab"
                        />
                        <Tab
                            icon={
                                <Tooltip
                                    title="Run Webviz Application"
                                    placement="right"
                                    arrow
                                >
                                    <PlayArrow color="inherit" />
                                </Tooltip>
                            }
                            value="play"
                            className="MenuTab"
                        />
                        <Tab
                            icon={
                                <Tooltip
                                    title="Preferences"
                                    placement="right"
                                    arrow
                                >
                                    <Settings color="inherit" />
                                </Tooltip>
                            }
                            value="preferences"
                            className="MenuTab"
                        />
                    </Tabs>
                    <div className="GlobalSettings">
                        <ThemeSwitch />
                    </div>
                </Paper>
                <div className="Content">
                    {currentPage === "editor" && (
                        <ResizablePanels
                            id="Editor-LivePreview"
                            direction="horizontal"
                        >
                            <Editor />
                            <LivePreview />
                        </ResizablePanels>
                    )}
                    {currentPage === "play" && <Play />}
                    {currentPage === "preferences" && <Preferences />}
                </div>
            </div>
            <div className="Toolbar" />
        </div>
    );
};
