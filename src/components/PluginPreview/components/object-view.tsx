import "../plugin-preview.css";
import {DataObject} from "@mui/icons-material";
import {List, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import {useYamlParser} from "@services/yaml-parser";

import React from "react";
import {monaco} from "react-monaco-editor";

import {PluginArgumentObject} from "@utils/yaml-parser";

import {useAppSelector} from "@redux/hooks";

import {isNumber} from "lodash";

import {ArrayPluginArgumentObject, ArrayView} from "./array-view";
import {BooleanView} from "./boolean-view";
import {IntegerView} from "./integer-view";
import {StringView} from "./string-view";

export type ObjectPluginArgumentObject = Omit<PluginArgumentObject, "value"> & {
    value: PluginArgumentObject[];
};

type ComponentsProps = {
    name: string;
    value: ObjectPluginArgumentObject;
};

export const ObjectView: React.FC<ComponentsProps> = props => {
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
                    <DataObject />
                </ListItemAvatar>
                <ListItemText primary={props.name} secondary="" />
            </ListItem>
            <List component="div" disablePadding sx={{pl: 4}}>
                {props.value.value.map(el => {
                    if (el.value.constructor === Object) {
                        return (
                            <ObjectView
                                name={el.name}
                                value={el as ObjectPluginArgumentObject}
                            />
                        );
                    }
                    if (el.value.constructor === Array) {
                        if (
                            el.value.length > 0 &&
                            el.value[0].constructor === Object
                        ) {
                            return (
                                <ObjectView
                                    name={el.name}
                                    value={el as ObjectPluginArgumentObject}
                                />
                            );
                        }
                        return (
                            <ArrayView
                                name={el.name}
                                value={el as ArrayPluginArgumentObject}
                            />
                        );
                    }
                    if (el.value.constructor === Boolean) {
                        return <BooleanView name={el.name} value={el} />;
                    }
                    if (el.value.constructor === String) {
                        return <StringView name={el.name} value={el} />;
                    }
                    if (isNumber(el.value)) {
                        return <IntegerView name={el.name} value={el} />;
                    }
                    return <></>;
                })}
            </List>
        </>
    );
};
