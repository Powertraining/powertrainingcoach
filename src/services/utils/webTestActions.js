import { useEffect } from "react";

function getBrowserWindow() {
    return typeof window === "undefined" ? null : window;
}

function getSearchParam(name) {
    const browserWindow = getBrowserWindow();

    if (!browserWindow?.location?.search) {
        return "";
    }

    return new URLSearchParams(browserWindow.location.search).get(name) || "";
}

export function isPagesPhonePreview() {
    const browserWindow = getBrowserWindow();

    if (!browserWindow) {
        return false;
    }

    const previewMode = getSearchParam("preview") || getSearchParam("viewport");
    const phonePreview = getSearchParam("phonePreview");

    return (
        Boolean(browserWindow.__PAGES_PHONE_PREVIEW__) ||
        previewMode === "phone" ||
        phonePreview === "true"
    );
}

export function useWebTestActions(screenId, title, actions = [], enabled = true) {
    useEffect(() => {
        const browserWindow = getBrowserWindow();

        if (!browserWindow || !screenId) {
            return undefined;
        }

        const normalizedActions = enabled
            ? actions
                .filter((action) => action?.label && typeof action.onPress === "function")
                .map((action) => ({
                    label: action.label,
                    onPress: action.onPress,
                }))
            : [];

        browserWindow.__POWERTRAINING_WEB_TEST_ACTIONS__ = {
            ...(browserWindow.__POWERTRAINING_WEB_TEST_ACTIONS__ || {}),
            [screenId]: {
                title,
                actions: normalizedActions,
            },
        };

        browserWindow.dispatchEvent?.(
            new CustomEvent("powertraining:web-test-actions", {
                detail: {
                    screenId,
                    title,
                    actions: normalizedActions,
                },
            })
        );

        if (isPagesPhonePreview()) {
            browserWindow.dispatchEvent?.(
                new CustomEvent("pages-preview-test-actions", {
                    detail: { sourceId: screenId, title, actions: normalizedActions },
                })
            );
        }

        return () => {
            const registry = browserWindow.__POWERTRAINING_WEB_TEST_ACTIONS__;

            if (registry?.[screenId]?.actions === normalizedActions) {
                delete registry[screenId];
            }

            if (isPagesPhonePreview()) {
                browserWindow.dispatchEvent?.(
                    new CustomEvent("pages-preview-test-actions", {
                        detail: { sourceId: screenId, title, actions: [] },
                    })
                );
            }
        };
    }, [screenId, title, actions, enabled]);
}
