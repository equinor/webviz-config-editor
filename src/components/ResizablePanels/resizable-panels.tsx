import "./resizable-panels.css";
import useSize from "@react-hook/size";

import React from "react";

import {ConfigStore} from "@stores";

type ResizablePanelsProps = {
    id: string;
    direction: "horizontal" | "vertical";
    children: React.ReactNode[];
};

type Point = {
    x: number;
    y: number;
};

export const ResizablePanels: React.FC<ResizablePanelsProps> = props => {
    const [isDragging, setIsDragging] = React.useState<boolean>();
    const [currentIndex, setCurrentIndex] = React.useState<number>(0);
    const [initialPosition, setInitialPosition] = React.useState<Point>({
        x: 0,
        y: 0,
    });
    const [sizes, setSizes] = React.useState<number[]>([]);
    const resizablePanelsRef = React.useRef<HTMLDivElement | null>(null);
    const resizablePanelRefs = React.useRef<(HTMLDivElement | null)[]>([]);

    const [totalWidth, totalHeight] = useSize(resizablePanelsRef);
    const store = ConfigStore.useStore();

    React.useEffect(() => {
        const storedSizes = store.state.config.find(el => el.id === props.id)
            ?.config as number[] | undefined;
        if (storedSizes && storedSizes.length === props.children.length) {
            setSizes(storedSizes as number[]);
            return;
        }
        const panelSizes: number[] = [];
        for (let i = 0; i < props.children.length; i++) {
            sizes.push(100 / props.children.length);
        }
        setSizes(panelSizes);
        resizablePanelRefs.current = resizablePanelRefs.current.slice(
            0,
            props.children.length
        );
    }, [props.children.length, store.state.config, props.id]);

    const startResize = React.useCallback(
        (
            event: React.MouseEvent<HTMLDivElement, MouseEvent>,
            index: number
        ) => {
            window.addEventListener("selectstart", e => e.preventDefault());
            setCurrentIndex(index);
            setInitialPosition({x: event.clientX, y: event.clientY});
            setIsDragging(true);
        },
        [setCurrentIndex, setIsDragging, setInitialPosition]
    );

    React.useEffect(() => {
        let resize: ((e: MouseEvent) => void) | undefined;
        if (props.direction === "horizontal") {
            resize = (event: MouseEvent) => {
                if (!isDragging) {
                    return;
                }
                const totalSize =
                    resizablePanelsRef.current?.getBoundingClientRect().width ||
                    0;
                const firstElement = resizablePanelRefs.current[currentIndex];
                const secondElement =
                    resizablePanelRefs.current[currentIndex + 1];
                if (firstElement && secondElement) {
                    const newSizes = sizes.map((size, index) => {
                        if (index === currentIndex) {
                            const newSize =
                                event.clientX -
                                firstElement.getBoundingClientRect().left;
                            return (newSize / totalSize) * 100;
                        }
                        if (index === currentIndex + 1) {
                            const newSize =
                                secondElement.getBoundingClientRect().right -
                                event.clientX;
                            return (newSize / totalSize) * 100;
                        }
                        return size;
                    }) as number[];
                    setSizes(newSizes);
                }
            };
        } else if (props.direction === "vertical") {
            resize = (event: MouseEvent) => {
                if (!isDragging) {
                    return;
                }
                const totalSize =
                    resizablePanelsRef.current?.getBoundingClientRect()
                        .height || 0;
                const firstElement = resizablePanelRefs.current[currentIndex];
                const secondElement =
                    resizablePanelRefs.current[currentIndex + 1];
                if (firstElement && secondElement) {
                    const newSizes = sizes.map((size, index) => {
                        if (index === currentIndex) {
                            const newSize =
                                event.clientY -
                                firstElement.getBoundingClientRect().top;
                            return (newSize / totalSize) * 100;
                        }
                        if (index === currentIndex + 1) {
                            const newSize =
                                secondElement.getBoundingClientRect().bottom -
                                event.clientY;
                            return (newSize / totalSize) * 100;
                        }
                        return size;
                    }) as number[];
                    setSizes(newSizes);
                }
            };
        }

        if (!resize) {
            return;
        }

        const stopResize = (event: MouseEvent) => {
            window.removeEventListener("selectstart", e => e.preventDefault());
            setIsDragging(false);
            store.dispatch({
                type: ConfigStore.StoreActions.SetConfig,
                payload: {config: {id: props.id, config: sizes}},
            });
        };
        document.addEventListener("mousemove", resize);
        document.addEventListener("mouseup", stopResize);

        return () => {
            if (resize) {
                document.removeEventListener("mousemove", resize);
            }
            document.removeEventListener("mouseup", stopResize);
        };
    }, [
        isDragging,
        setIsDragging,
        sizes,
        setSizes,
        props.direction,
        currentIndex,
        props.id,
        store,
    ]);

    return (
        <div
            className={`ResizablePanelsWrapper${
                props.direction === "horizontal" ? "Horizontal" : "Vertical"
            }`}
            ref={resizablePanelsRef}
        >
            <div
                className={`ResizablePanelsOverlay${
                    props.direction === "horizontal" ? "Horizontal" : "Vertical"
                }`}
                style={{
                    width: totalWidth,
                    height: totalHeight,
                    display: isDragging ? "block" : "none",
                }}
            />
            {props.children.map((el: React.ReactNode, index: number) => (
                /* eslint-disable react/no-array-index-key */
                <React.Fragment key={`resizable-panel-${index}`}>
                    <div
                        className="ResizablePanel"
                        /* eslint-disable no-return-assign */
                        ref={element =>
                            (resizablePanelRefs.current[index] = element)
                        }
                        style={
                            props.direction === "horizontal"
                                ? {width: `calc(${sizes[index]}% - 3px)`}
                                : {height: `calc(${sizes[index]}% - 3px)`}
                        }
                    >
                        {el}
                    </div>
                    {index < props.children.length - 1 && (
                        <div
                            className={`ResizeDragBar ResizeDragBar__${
                                props.direction
                            }${isDragging ? " ResizeDragBar--active" : ""}`}
                            onMouseDown={e => startResize(e, index)}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
