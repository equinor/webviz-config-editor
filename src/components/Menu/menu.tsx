import {Paper, useTheme} from "@mui/material";

import React from "react";

import {SelectedNavigationItem} from "@components/LivePreview/live-preview";

import {
    GroupType,
    NavigationItemType,
    NavigationType,
    PageType,
    PropertyGroupType,
    PropertyNavigationType,
    PropertyPageType,
    PropertySectionType,
    SectionType,
} from "@shared-types/navigation";
import {YamlLayoutObjectType} from "../../utils/yaml-parser";

import {Group} from "./components/Group";
import {Page} from "./components/Page";
import {Section} from "./components/Section";
import "./menu.css";

type MenuProps = {
    navigationItems: PropertyNavigationType;
    selectedItem: SelectedNavigationItem | null;
    setProps: (id: string) => void;
};

const makeNavigationItemsWithAssignedIds = (
    navigationItems: PropertyNavigationType
): NavigationType => {
    const indices = {
        section: 0,
        group: 0,
        page: 0,
    };
    const recursivelyAssignUuids = (
        item: PropertyPageType | PropertyGroupType | PropertySectionType
    ): GroupType | PageType | SectionType => {
        if (item.type === "group") {
            return {
                ...item,
                type: "group",
                content: (item as PropertyGroupType).content.map(
                    el => recursivelyAssignUuids(el) as GroupType | PageType
                ),
                id: `group-${indices.group++}`,
            };
        }
        if (item.type === "page") {
            return {
                ...item,
                type: "page",
                id: `page-${indices.page++}`,
            };
        }
        return {
            ...item,
            type: "section",
            content: (item as PropertySectionType).content.map(
                el => recursivelyAssignUuids(el) as GroupType | PageType
            ),
            id: `section-${indices.section++}`,
        };
    };
    return navigationItems.map(
        (el: PropertySectionType | PropertyGroupType | PropertyPageType) =>
            recursivelyAssignUuids(el)
    ) as NavigationType;
};

const makeNavigation = (
    navigation: NavigationType,
    initiallyCollapsed: boolean,
    activePageId: string,
    onPageChange: (url: string) => void
): JSX.Element => {
    const recursivelyMakeNavigation = (
        items: NavigationItemType[],
        iconAtParentLevel?: boolean,
        level = 1
    ): JSX.Element => {
        const atLeastOneIconUsed = items.some(el => el.icon !== undefined);
        return (
            <>
                {items.map(item => {
                    if (item.type === "section") {
                        return (
                            <Section
                                key={item.id}
                                title={item.title}
                                icon={item.icon}
                                applyIconIndentation={atLeastOneIconUsed}
                            >
                                {recursivelyMakeNavigation(
                                    (item as SectionType).content,
                                    atLeastOneIconUsed
                                )}
                            </Section>
                        );
                    }
                    if (item.type === "group") {
                        return (
                            <Group
                                id={item.id}
                                key={item.id}
                                level={level}
                                title={item.title}
                                icon={item.icon}
                                forceOpen
                                applyIconIndentation={
                                    atLeastOneIconUsed ||
                                    iconAtParentLevel ||
                                    false
                                }
                                initiallyCollapsed={initiallyCollapsed}
                            >
                                {recursivelyMakeNavigation(
                                    (item as GroupType).content,
                                    atLeastOneIconUsed,
                                    level + 1
                                )}
                            </Group>
                        );
                    }
                    if (item.type === "page") {
                        return (
                            <Page
                                active={item.id === activePageId}
                                key={item.id}
                                level={level}
                                applyIconIndentation={
                                    atLeastOneIconUsed ||
                                    iconAtParentLevel ||
                                    false
                                }
                                {...(item as PageType)}
                                onClick={() =>
                                    onPageChange((item as PageType).href)
                                }
                            />
                        );
                    }
                    return null;
                })}
            </>
        );
    };
    return recursivelyMakeNavigation(navigation);
};

export const Menu: React.FC<MenuProps> = props => {
    const [activePageId, setActivePageId] = React.useState<string>("");
    const menuRef = React.useRef<HTMLDivElement | null>(null);

    const [navigationItemsWithAssignedIds, setNavigationsItemsWithAssignedIds] =
        React.useState<NavigationType>([]);

    React.useEffect(() => {
        setNavigationsItemsWithAssignedIds(
            makeNavigationItemsWithAssignedIds(props.navigationItems)
        );
    }, [props.navigationItems]);

    React.useEffect(() => {
        props.setProps(activePageId);
    }, [activePageId]);

    React.useEffect(() => {
        if (menuRef.current) {
            Array.from(
                menuRef.current.getElementsByClassName("Menu__SelectedItem")
            ).forEach((element: Element) => {
                element.classList.remove("Menu__SelectedItem");
            });
            if (props.selectedItem) {
                if (props.selectedItem.type === YamlLayoutObjectType.Section) {
                    const section = menuRef.current.getElementsByClassName(
                        "Menu__Section"
                    )[props.selectedItem.number] as HTMLElement | undefined;
                    if (section) {
                        section.classList.add("Menu__SelectedItem");
                    }
                } else if (
                    props.selectedItem.type === YamlLayoutObjectType.Group
                ) {
                    const group = menuRef.current.getElementsByClassName(
                        "Menu__Group"
                    )[props.selectedItem.number] as HTMLElement | undefined;
                    if (group) {
                        group.classList.add("Menu__SelectedItem");
                    }
                } else if (
                    props.selectedItem.type === YamlLayoutObjectType.Page
                ) {
                    const page = menuRef.current.getElementsByClassName(
                        "Menu__Page"
                    )[props.selectedItem.number] as HTMLElement | undefined;
                    if (page) {
                        page.classList.add("Menu__SelectedItem");
                    }
                }
            }
        }
    }, [props.selectedItem]);

    const theme = useTheme();

    return (
        <Paper elevation={1} className="Menu" ref={menuRef} square>
            {props.navigationItems.length > 0 &&
                makeNavigation(
                    navigationItemsWithAssignedIds,
                    false,
                    activePageId,
                    url => setActivePageId(url)
                )}
            {props.navigationItems.length === 0 && (
                <i>No navigation items...</i>
            )}
        </Paper>
    );
};
