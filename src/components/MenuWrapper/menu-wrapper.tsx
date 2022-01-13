//import { Menu } from "@webviz/core-components";
//import { MenuProps } from "@webviz/core-components/dist/components/Menu/Menu";
import "./menu-wrapper.css";
import { SelectedNavigationItem } from "@components/LivePreview/live-preview";
import { useTheme } from "@mui/material";
import { YamlLayoutObjectType } from "@utils/yaml-parser";
import React from "react";

export const MenuWrapper: React.FC = (props) => {
    return null;
};

/*
type MenuWrapperProps = MenuProps & {
    selectedItem: SelectedNavigationItem | null;
};

export const MenuWrapper: React.FC<MenuWrapperProps> = (props) => {
    const menuWrapperRef = React.useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = React.useState<boolean>(true);
    const [width, setWidth] = React.useState<number>(0);

    const theme = useTheme();

    const [resizeOberserver, setResizeObserver] = React.useState<ResizeObserver | undefined>();

    const updateWidth = React.useCallback(
        (entries) => {
            for (const entry of entries) {
                if (entry.contentRect) {
                    setWidth(entry.contentRect.width);
                }
            }
        },
        [setWidth]
    );

    React.useEffect(() => {
        if (menuWrapperRef.current) {
            for (const element of menuWrapperRef.current.getElementsByClassName("MenuWrapper__SelectedItem")) {
                element.classList.remove("MenuWrapper__SelectedItem");
            }
            if (props.selectedItem) {
                if (props.selectedItem.type === YamlLayoutObjectType.Section) {
                    const section = menuWrapperRef.current.getElementsByClassName("Menu__Section")[
                        props.selectedItem.number
                    ] as HTMLElement | undefined;
                    if (section) {
                        section.classList.add("MenuWrapper__SelectedItem");
                    }
                } else if (props.selectedItem.type === YamlLayoutObjectType.Group) {
                    const group = menuWrapperRef.current.getElementsByClassName("Menu__Group")[
                        props.selectedItem.number
                    ] as HTMLElement | undefined;
                    if (group) {
                        group.classList.add("MenuWrapper__SelectedItem");
                    }
                } else if (props.selectedItem.type === YamlLayoutObjectType.Page) {
                    const page = menuWrapperRef.current.getElementsByClassName("Menu__Page")[
                        props.selectedItem.number
                    ] as HTMLElement | undefined;
                    if (page) {
                        page.classList.add("MenuWrapper__SelectedItem");
                    }
                }
            }
        }
    }, [props.selectedItem]);

    React.useEffect(() => {
        setResizeObserver(new ResizeObserver(updateWidth));
        return () => {
            if (resizeOberserver) {
                resizeOberserver.disconnect();
            }
        };
    }, []);

    React.useEffect(() => {
        if (!resizeOberserver) {
            return;
        }
        if (menuWrapperRef.current) {
            const menu = menuWrapperRef.current.getElementsByClassName("Menu__MenuDrawer")[0] as
                | HTMLElement
                | undefined;
            if (menu) {
                resizeOberserver.observe(menu, { box: "border-box" });
            }
        }
        return () => {
            if (menuWrapperRef.current) {
                resizeOberserver.unobserve(menuWrapperRef.current);
            }
        };
    }, [menuWrapperRef, resizeOberserver]);

    React.useEffect(() => {
        window.setTimeout(() => {
            if (menuWrapperRef.current) {
                const menu = menuWrapperRef.current.getElementsByClassName("Menu__MenuDrawer")[0] as
                    | HTMLElement
                    | undefined;
                if (menu) {
                    setWidth(menu.getBoundingClientRect().width);
                    const bodyMargins = { left: 0, top: 0, right: 0, bottom: 0 };
                    menu.style.position = "absolute";
                    menu.style.backgroundColor = theme.palette.background.paper;
                    menu.style.height = menuWrapperRef.current.getBoundingClientRect().height - 1 + "px";
                    menuWrapperRef.current.style.height =
                        menuWrapperRef.current.getBoundingClientRect().height - 1 + "px";
                    document.body.style.marginLeft = bodyMargins.left + "px";
                    document.body.style.marginTop = bodyMargins.top + "px";
                    document.body.style.marginRight = bodyMargins.right + "px";
                    document.body.style.marginBottom = bodyMargins.bottom + "px";
                    setVisible(true);
                }
                const pinButton = menuWrapperRef.current.getElementsByClassName("Menu__TopMenu")[0] as
                    | HTMLElement
                    | undefined;
                if (pinButton) {
                    pinButton.style.display = "none";
                }
            }
        }, 0);
    }, [menuWrapperRef]);

    React.useEffect(() => {
        if (menuWrapperRef.current) {
            const menu = menuWrapperRef.current.getElementsByClassName("Menu__MenuDrawer")[0] as
                | HTMLElement
                | undefined;
            if (menu) {
                menu.style.backgroundColor = theme.palette.background.paper;
                menu.style.color = theme.palette.getContrastText(theme.palette.background.paper);
                for (const link of menu.getElementsByTagName("a")) {
                    link.style.color = theme.palette.getContrastText(theme.palette.background.paper);
                }
            }
        }
    }, [theme.palette.mode]);

    return (
        <div
            ref={menuWrapperRef}
            className="MenuWrapper"
            style={{ width: width, visibility: visible ? "visible" : "hidden" }}
        >
            <Menu initiallyPinned={true} showFilterInput={false} {...props} />
        </div>
    );
};
*/
