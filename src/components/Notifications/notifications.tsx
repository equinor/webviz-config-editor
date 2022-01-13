import { Close } from "@mui/icons-material";
import { Snackbar, Button, IconButton, Alert, AlertColor } from "@mui/material";
import { createGenericContext } from "@utils/generic-context";
import React from "react";

export enum NotificationType {
    ERROR = 0,
    WARNING,
    INFORMATION,
    SUCCESS,
}

const notificationTypeMap: { [key: number]: AlertColor } = {
    [NotificationType.ERROR]: "error",
    [NotificationType.WARNING]: "warning",
    [NotificationType.INFORMATION]: "info",
    [NotificationType.SUCCESS]: "success",
};

export type NotificationAction = {
    label: string;
    action: () => void;
};

export type Notification = {
    type: NotificationType;
    message: string;
    action?: NotificationAction;
};

type Context = {
    appendNotification: (notification: Notification) => void;
};

const [useNotificationContext, NotificationContextProvider] = createGenericContext<Context>();

export const NotificationsProvider: React.FC = (props) => {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [open, setOpen] = React.useState(false);

    const appendNotification = React.useCallback(
        (notification: Notification) => {
            setNotifications([...notifications, notification]);
            setOpen(true);
        },
        [notifications, setNotifications]
    );

    const handleClose = (_: Event | React.SyntheticEvent<any, Event>, reason?: string) => {
        if (reason === "clickaway") {
            return;
        }

        setOpen(false);
    };

    const lastNotification = notifications[notifications.length - 1];
    const close = (
        <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
            <Close fontSize="small" />
        </IconButton>
    );
    const action =
        lastNotification && lastNotification.action ? (
            <>
                <Button color="secondary" size="small" onClick={lastNotification.action.action}>
                    {lastNotification.action.label}
                </Button>
                {close}
            </>
        ) : (
            close
        );

    return (
        <NotificationContextProvider value={{ appendNotification }}>
            {props.children}
            {lastNotification && (
                <Snackbar
                    autoHideDuration={6000}
                    open={open}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    onClose={handleClose}
                >
                    <Alert severity={notificationTypeMap[lastNotification.type]}>
                        {lastNotification.message}
                        {action}
                    </Alert>
                </Snackbar>
            )}
        </NotificationContextProvider>
    );
};

export const useNotifications = (): Context => useNotificationContext();
