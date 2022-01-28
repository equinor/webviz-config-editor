import "../plugin-preview.css";
import {DataArray} from "@mui/icons-material";
import {List, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import {useYamlParser} from "@services/yaml-parser";

import React from "react";
import {monaco} from "react-monaco-editor";

import {PluginArgumentObject} from "@utils/yaml-parser";

import {useAppSelector} from "@redux/hooks";

export type ArrayPluginArgumentObject = Omit<PluginArgumentObject, "value"> & {
    value: any[];
};

type ComponentsProps = {
    name: string;
    value: ArrayPluginArgumentObject;
};

export const ArrayView: React.FC<ComponentsProps> = props => {
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
        <>
            <ListItem
                onClick={e => handleClickEvent(e)}
                className={isSelected ? "Plugin--selected" : ""}
            >
                <ListItemAvatar>
                    <DataArray />
                </ListItemAvatar>
                <ListItemText primary={props.name} secondary="description" />
            </ListItem>
            <List component="div" disablePadding sx={{pl: 4}}>
                {props.value.value.map(el => {
                    return (
                        <ListItem>
                            <ListItemText primary={JSON.stringify(el)} />
                        </ListItem>
                    );
                })}
            </List>
        </>
    );
};