import { useCallback, useMemo, useRef, useState } from 'react';
import { NotificationsContext } from './notifications-context';
import { ToastContainer } from '../components/ui/ToastContainer';
import { ErrorModal } from '../components/ui/ErrorModal';

const TOAST_VISIBLE_MS = 3500;
const TOAST_EXIT_MS = 280;

export function NotificationsProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [errorModal, setErrorModal] = useState(null);
  const nextIdRef = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((current) =>
      current.map((toast) =>
        toast.id === id ? { ...toast, leaving: true } : toast
      )
    );

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_EXIT_MS);
  }, []);

  const notifySuccess = useCallback(
    ({ icon = 'check', message }) => {
      const id = ++nextIdRef.current;
      setToasts((current) => [...current, { id, icon, message }]);
      window.setTimeout(() => dismissToast(id), TOAST_VISIBLE_MS);
    },
    [dismissToast]
  );

  const notifyError = useCallback(({ title, message }) => {
    setErrorModal({ title, message });
  }, []);

  const closeError = useCallback(() => {
    setErrorModal(null);
  }, []);

  const value = useMemo(
    () => ({ notifySuccess, notifyError }),
    [notifySuccess, notifyError]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <ErrorModal
        open={Boolean(errorModal)}
        title={errorModal?.title}
        message={errorModal?.message}
        onClose={closeError}
      />
    </NotificationsContext.Provider>
  );
}
