import { createStore } from "@adamjanicki/store";
import { useCallback } from "react";

export type Alert = {
  message: string;
  type: "success" | "error" | "info" | "warning";
};

export type AlertStore = {
  alert?: Alert;
  visible: boolean;
  timeout?: number;
};

const useAlertBase = createStore<AlertStore>({
  init: { visible: false },
});

export default function useAlert() {
  const [alertStore, setAlertStore] = useAlertBase();

  const setAlert = useCallback(
    (alert: Alert) => {
      setAlertStore((state) => {
        if (state.timeout) window.clearTimeout(state.timeout);
        const timeout = window.setTimeout(() => {
          setAlertStore((prev) => ({ ...prev, visible: false }));
        }, 5000);
        return { alert, visible: true, timeout };
      });
    },
    [setAlertStore]
  );

  const { alert, visible } = alertStore;
  return [{ alert, visible }, setAlert] as const;
}
