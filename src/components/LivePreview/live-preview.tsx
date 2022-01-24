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
import {useYamlParser} from "@services/yaml-parser";

import React from "react";

import {LayoutObject, YamlLayoutObjectType} from "@utils/yaml-parser";

import {PluginVisualizer} from "@components/PluginVisualizer";

import {useAppSelector} from "@redux/hooks";

import {PropertyNavigationType} from "@shared-types/navigation";
import {Menu} from "../Menu";

import "./live-preview.css";

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
    const [selectedNavigationItem, setSelectedNavigationItem] =
        React.useState<SelectedNavigationItem | null>(null);
    const theme = useTheme();

    const yamlParser = useYamlParser();
    const file = useAppSelector(state =>
        state.files.files.find(el => el.filePath === state.files.activeFile)
    );

    React.useEffect(() => {
        if (!file || file.yamlObjects.length === 0) {
            setNavigationItems([]);
            setCurrentPageContent([]);
            setTitle("");
            return;
        }

        setTitle(file.title);
        setNavigationItems(file.navigationItems);
    }, [file, file?.yamlObjects]);

    React.useEffect(() => {
        const object: LayoutObject | undefined = file?.selectedYamlObject as
            | LayoutObject
            | undefined;
        setCurrentPageContent((object?.children as LayoutObject[]) || []);
    }, [file?.currentPageId, file?.selectedYamlObject]);

    React.useEffect(() => {
        if (
            file?.selectedYamlObject &&
            "type" in file.selectedYamlObject &&
            "number" in file.selectedYamlObject &&
            (file.selectedYamlObject["type"] === YamlLayoutObjectType.Section ||
                file.selectedYamlObject["type"] ===
                    YamlLayoutObjectType.Group ||
                file.selectedYamlObject["type"] === YamlLayoutObjectType.Page)
        ) {
            setSelectedNavigationItem({
                type: file.selectedYamlObject["type"],
                number: file.selectedYamlObject["number"],
            });
        } else {
            setSelectedNavigationItem(null);
        }
    }, [file?.selectedYamlObject]);

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
                <div className="LivePreview__Menu">
                    <Menu
                        setProps={(id: string) => yamlParser.setCurrentPage(id)}
                        selectedItem={selectedNavigationItem}
                        navigationItems={navigationItems}
                    />
                </div>
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
};
