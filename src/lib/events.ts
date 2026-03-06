import type { AppErrorType } from '../components/ErrorPopup';

export const triggerAppError = (type: AppErrorType) => {
    window.dispatchEvent(new CustomEvent('app-api-error', { detail: type }));
};

export const triggerAuthModal = () => {
    window.dispatchEvent(new CustomEvent('open-auth-modal'));
};

export const triggerOpenSettings = () => {
    window.dispatchEvent(new CustomEvent('open-settings'));
};
