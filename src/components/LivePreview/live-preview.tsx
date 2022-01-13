import "./live-preview.css";
import {Edit as EditIcon, Visibility} from "@mui/icons-material";
import {
    Paper,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
    useTheme,
} from "@mui/material";

import React from "react";

import {LayoutObject, YamlLayoutObjectType} from "@utils/yaml-parser";

// import { MenuWrapper } from "../MenuWrapper";
import {PluginVisualizer} from "@components/PluginVisualizer";

import {FilesStore} from "@stores";
import {UpdateSource} from "@stores/files-store";

import {PropertyNavigationType} from "@shared-types/navigation";

type LivePreviewProps = {};

type MenuReturnProps = {
    url: string;
};

export enum PreviewMode {
    Edit = "EDIT",
    View = "VIEW",
}

export type SelectedNavigationItem = {
    type: Omit<
        YamlLayoutObjectType,
        YamlLayoutObjectType.Plugin | YamlLayoutObjectType.PlainText
    >;
    number: number;
};

export const LivePreview: React.FC<LivePreviewProps> = props => {
    const [navigationItems, setNavigationItems] =
        React.useState<PropertyNavigationType>([]);
    const [title, setTitle] = React.useState<string>("");
    const [mode, setMode] = React.useState<PreviewMode>(PreviewMode.View);
    const [currentPageContent, setCurrentPageContent] = React.useState<
        LayoutObject[]
    >([]);
    const store = FilesStore.useStore();
    const [selectedNavigationItem, setSelectedNavigationItem] =
        React.useState<SelectedNavigationItem | null>(null);
    const theme = useTheme();

    React.useEffect(() => {
        if (store.state.updateSource !== FilesStore.UpdateSource.Editor) {
            return;
        }
        if (store.state.currentYamlObjects.length === 0) {
            setNavigationItems([]);
            setCurrentPageContent([]);
            setTitle("");
            return;
        }

        setTitle(store.state.title);
        setNavigationItems(store.state.navigationItems);
    }, [
        store.state.currentYamlObjects,
        store.state.updateSource,
        store.state.title,
        store.state.navigationItems,
    ]);

    React.useEffect(() => {
        if (store.state.updateSource === UpdateSource.Plugin) {
            return;
        }
        const object: LayoutObject | undefined = store.state
            .selectedYamlObject as LayoutObject | undefined;
        setCurrentPageContent((object?.children as LayoutObject[]) || []);
    }, [store.state.currentPageId, store.state.updateSource]);

    React.useEffect(() => {
        if (
            store.state.selectedYamlObject &&
            "type" in store.state.selectedYamlObject &&
            "number" in store.state.selectedYamlObject &&
            (store.state.selectedYamlObject["type"] ===
                YamlLayoutObjectType.Section ||
                store.state.selectedYamlObject["type"] ===
                    YamlLayoutObjectType.Group ||
                store.state.selectedYamlObject["type"] ===
                    YamlLayoutObjectType.Page)
        ) {
            setSelectedNavigationItem({
                type: store.state.selectedYamlObject["type"],
                number: store.state.selectedYamlObject["number"],
            });
        } else {
            setSelectedNavigationItem(null);
        }
    }, [store.state.selectedYamlObject]);

    return (
        <div className="LivePreview">
            <Paper
                square
                className="LivePreview__Title"
                style={{backgroundColor: theme.palette.background.paper}}
            >
                <Stack
                    spacing={4}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Typography variant="subtitle1">
                        {title || <em>No title defined yet</em>}
                    </Typography>
                    <ToggleButtonGroup
                        value={mode}
                        exclusive
                        onChange={() => {}}
                        aria-label="preview mode"
                    >
                        <ToggleButton
                            value={PreviewMode.Edit}
                            aria-label="edit mode"
                            disabled
                        >
                            <Tooltip
                                title="This feature is coming soon."
                                style={{pointerEvents: "auto"}}
                            >
                                <EditIcon />
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton
                            value={PreviewMode.View}
                            aria-label="view mode"
                        >
                            <Visibility />
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
            </Paper>
            <div className="LivePreview__Content">
                <div className="LivePreview__Menu" />
                <div className="LivePreview__Page">
                    {currentPageContent.map((plugin: LayoutObject) => (
                        <PluginVisualizer
                            key={plugin.id}
                            pluginData={plugin}
                            mode={mode}
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    /*
    <MenuWrapper
                        setProps={(props) =>
                            store.dispatch({
                                type: FilesStore.StoreActions.SetCurrentPage,
                                payload: { pageId: props.url, source: FilesStore.UpdateSource.Preview },
                            })
                        }
                        selectedItem={selectedNavigationItem}
                        navigationItems={navigationItems}
                        menuBarPosition="left"
                        inline={true}
                    />
    */
};
