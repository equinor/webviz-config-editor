import "../plugin-preview.css";
import {ToggleOn} from "@mui/icons-material";
import {ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import {useYamlParser} from "@services/yaml-parser";

import React from "react";
import {monaco} from "react-monaco-editor";

import {PluginArgumentObject} from "@utils/yaml-parser";

import {useAppSelector} from "@redux/hooks";

import {EventSource} from "@shared-types/files";

type ComponentsProps = {
    name: string;
    value: PluginArgumentObject;
};

export const BooleanView: React.FC<ComponentsProps> = props => {
    const yamlParser = useYamlParser();

    const file = useAppSelector(state =>
        state.files.files.find(el => el.filePath === state.files.activeFile)
    );

    const isSelected =
        file?.selectedYamlObject &&
        "name" in file.selectedYamlObject &&
        "value" in file.selectedYamlObject &&
        file.selectedYamlObject["name"] === props.name;

    const handleClickEvent = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        yamlParser.updateSelection(
            new monaco.Selection(
                props.value.startLineNumber,
                0,
                props.value.endLineNumber,
                0
            ),
            EventSource.Preview
        );
    };

    return (
        <ListItem
            onClick={e => handleClickEvent(e)}
            secondaryAction={props.value.value}
            className={isSelected ? "Plugin--selected" : ""}
        >
            <ListItemAvatar>
                <ToggleOn />
            </ListItemAvatar>
            <ListItemText primary={props.name} secondary="" />
        </ListItem>
    );
};
