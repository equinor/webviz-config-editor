import "../plugin-preview.css";
import {Numbers} from "@mui/icons-material";
import {ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import {useYamlParser} from "@services/yaml-parser";

import React from "react";
import {monaco} from "react-monaco-editor";

import {PluginArgumentObject} from "@utils/yaml-parser";

import {useAppSelector} from "@redux/hooks";

type ComponentsProps = {
    name: string;
    value: PluginArgumentObject;
};

export const IntegerView: React.FC<ComponentsProps> = props => {
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
            )
        );
    };

    return (
        <ListItem
            onClick={e => handleClickEvent(e)}
            secondaryAction={props.value.value}
            className={isSelected ? "Plugin--selected" : ""}
        >
            <ListItemAvatar>
                <Numbers />
            </ListItemAvatar>
            <ListItemText primary={props.name} secondary="" />
        </ListItem>
    );
};
