import React from "react";

import {createGenericContext} from "@utils/generic-context";
import {PluginParser} from "@utils/plugin-parser";

import {useAppSelector} from "@redux/hooks";

import fs from "fs";

type Context = {
    pluginParser: PluginParser;
};

const [usePluginParserServiceContext, PluginParserServiceContextProvider] =
    createGenericContext<Context>();

export const PluginParserService: React.FC = props => {
    const pluginParser = React.useRef<PluginParser>(new PluginParser());

    const jsonSchemaPath = useAppSelector(
        state => state.preferences.pathToYamlSchemaFile
    );

    React.useEffect(() => {
        try {
            const fileContent = fs.readFileSync(jsonSchemaPath).toString();
            pluginParser.current.parse(JSON.parse(fileContent));
        } catch (e) {
            console.log(e);
        }
    }, [jsonSchemaPath]);

    return (
        <PluginParserServiceContextProvider
            value={{pluginParser: pluginParser.current}}
        >
            {props.children}
        </PluginParserServiceContextProvider>
    );
};

export const usePluginParser = (): Context => usePluginParserServiceContext();
