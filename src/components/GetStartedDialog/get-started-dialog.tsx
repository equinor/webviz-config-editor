import "./get-started-dialog.css";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MobileStepper from "@mui/material/MobileStepper";
import Typography from "@mui/material/Typography";
import {useTheme} from "@mui/material/styles";

import React from "react";

import {Settings} from "@utils/settings";

import {PreferenceItem} from "@components/Preferences/components/preference-item";

import {ConfigStore, SettingsStore} from "@stores";

import {SettingMeta} from "@shared-types/settings";

const getSettingsFlat = (): SettingMeta[] => {
    let settings: SettingMeta[] = [];
    Object.keys(Settings).forEach(category => {
        settings = settings.concat(
            Settings[category].filter(el => el.needsInitialization)
        );
    });
    return settings;
};

export const GetStartedDialog: React.FC = () => {
    const settingsStore = SettingsStore.useStore();
    const configStore = ConfigStore.useStore();
    const [activeStep, setActiveStep] = React.useState(0);
    const theme = useTheme();

    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        const initialized = configStore.state.config.find(
            el => el.id === "initialized"
        )?.config;
        if (!initialized) {
            setOpen(true);
        }
    }, []);

    const handleClose = () => {
        setOpen(false);
        if (activeStep === getSettingsFlat().length + 1) {
            configStore.dispatch({
                type: ConfigStore.StoreActions.SetConfig,
                payload: {
                    config: {
                        id: "initialized",
                        config: true,
                    },
                },
            });
        }
    };

    const isCurrentSettingValid = (): boolean => {
        const settings = getSettingsFlat();
        const currentSetting = settings[activeStep - 1];
        return (
            settingsStore.state.settings.find(el => el.id === currentSetting.id)
                ?.value !== ""
        );
    };

    const handleNext = () => {
        setActiveStep(prevActiveStep => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep(prevActiveStep => prevActiveStep - 1);
    };

    const makeStep = (step: number): React.ReactNode => {
        const settings = getSettingsFlat();
        if (step === 0) {
            return (
                <div style={{textAlign: "center"}}>
                    <img
                        src="./wce-icon.png"
                        alt=""
                        style={{height: 100, marginBottom: 16}}
                    />
                    <Typography gutterBottom variant="h6">
                        Welcome to
                    </Typography>
                    <Typography gutterBottom variant="h4">
                        Webviz Config Editor
                    </Typography>
                    <Typography gutterBottom variant="body2">
                        Get quickly started by setting some preferences.
                    </Typography>
                </div>
            );
        }
        if (step === settings.length + 1) {
            return (
                <div style={{textAlign: "center"}}>
                    <div className="wrapper">
                        <svg
                            className="checkmark"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 52 52"
                        >
                            <circle
                                className="checkmark__circle"
                                cx="26"
                                cy="26"
                                r="25"
                                fill="none"
                            />
                            <path
                                className="checkmark__check"
                                fill="none"
                                d="M14.1 27.2l7.1 7.2 16.7-16.8"
                            />
                        </svg>
                    </div>
                    <Typography gutterBottom variant="body2">
                        You are all set!
                    </Typography>
                </div>
            );
        }
        return (
            <PreferenceItem
                key={settings[step - 1].id}
                {...settings[step - 1]}
            />
        );
    };

    return (
        <div>
            <Dialog
                onClose={handleClose}
                aria-labelledby="customized-dialog-title"
                open={open}
            >
                <DialogTitle sx={{m: 0, p: 2, border: 0}}>
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{
                            position: "absolute",
                            right: 8,
                            top: 8,
                            color: el => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>{makeStep(activeStep)}</DialogContent>
                <DialogActions>
                    {activeStep === 0 && (
                        <>
                            <Button size="small" onClick={handleClose}>
                                I&apos;ll do it later
                            </Button>
                            <Button size="small" onClick={handleNext}>
                                Set preferences now
                                {theme.direction === "rtl" ? (
                                    <KeyboardArrowLeft />
                                ) : (
                                    <KeyboardArrowRight />
                                )}
                            </Button>
                        </>
                    )}
                    {activeStep === getSettingsFlat().length + 1 && (
                        <>
                            <Button size="small" onClick={handleClose}>
                                Perfect
                            </Button>
                        </>
                    )}
                    {activeStep > 0 && activeStep <= getSettingsFlat().length && (
                        <MobileStepper
                            variant="progress"
                            steps={getSettingsFlat().length + 2}
                            position="static"
                            activeStep={activeStep}
                            sx={{maxWidth: 400, flexGrow: 1}}
                            nextButton={
                                <Button
                                    size="small"
                                    onClick={handleNext}
                                    disabled={
                                        activeStep === 5 ||
                                        !isCurrentSettingValid()
                                    }
                                >
                                    Next
                                    {theme.direction === "rtl" ? (
                                        <KeyboardArrowLeft />
                                    ) : (
                                        <KeyboardArrowRight />
                                    )}
                                </Button>
                            }
                            backButton={
                                <Button
                                    size="small"
                                    onClick={handleBack}
                                    disabled={activeStep === 0}
                                >
                                    {theme.direction === "rtl" ? (
                                        <KeyboardArrowRight />
                                    ) : (
                                        <KeyboardArrowLeft />
                                    )}
                                    Back
                                </Button>
                            }
                        />
                    )}
                </DialogActions>
            </Dialog>
        </div>
    );
};
