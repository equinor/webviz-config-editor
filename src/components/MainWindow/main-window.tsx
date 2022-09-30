import {Edit, PlayArrow, Settings} from "@mui/icons-material";
import {Paper, Tab, Tabs, Tooltip, useTheme} from "@mui/material";

import React from "react";

import {Editor} from "@components/Editor";
import {LivePreview} from "@components/LivePreview/live-preview";
import {Play} from "@components/Play";
import {Preferences} from "@components/Preferences/preferences";
import {ResizablePanels} from "@components/ResizablePanels";
import {ThemeSwitch} from "@components/ThemeSwitch";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setCurrentPage} from "@redux/reducers/ui";

import {Pages} from "@shared-types/ui";

import { useMainProcessDataProvider } from "@components/MainProcessDataProvider/main-process-data-provider";
import { useYamlParser } from "@services/yaml-parser";
import { openFile } from "@redux/thunks";

import path from "path";

import "./main-window.css";

export const MainWindow: React.FC = () => {
    const currentPage = useAppSelector(state => state.ui.currentPage);
    const dispatch = useAppDispatch();
    const theme = useTheme();
    const yamlParser = useYamlParser();
    const mainProcessData = useMainProcessDataProvider();

    const mainWindowRef = React.useRef<HTMLDivElement | null>(null);
    const files = useAppSelector(state => state.files);

    React.useEffect(() => {
        if (!files || files.activeFile === "") {
            document.title = "Webviz Config Editor";
            return;
        }
        document.title = `${path.basename(
            files.activeFile
        )} - Webviz Config Editor`;
    }, [files]);

    React.useEffect(() => {
        if (mainProcessData.filePathArg) {
            openFile(mainProcessData.filePathArg, dispatch, yamlParser);
        }
    }, [mainProcessData.filePathArg, yamlParser, dispatch]);

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
