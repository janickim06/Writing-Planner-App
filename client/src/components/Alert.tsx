import { Alert as UIAlert, Animated, Icon } from "@adamjanicki/ui";
import {
  checkCircle,
  infoCircle,
  warningCircle,
  xCircle,
} from "@adamjanicki/ui/icons";
import useAlert from "src/hooks/useAlert";

const TYPE_TO_ICON = {
  success: checkCircle,
  error: xCircle,
  warning: warningCircle,
  info: infoCircle,
} as const;

export default function Alert() {
  const [{ alert, visible }] = useAlert();

  const shouldShow = Boolean(alert) && visible;

  return (
    <Animated
      visible={shouldShow}
      vfx={{ pos: "fixed", z: "max" }}
      from={{ opacity: 0, bottom: 16 }}
      to={{ opacity: 1, bottom: 32 }}
      style={{ left: "50%", transform: "translateX(-50%)" }}
    >
      {!alert ? null : (
        <UIAlert
          type={alert.type}
          vfx={{ axis: "x", align: "center", gap: "s", width: "max" }}
        >
          <Icon size="s" icon={TYPE_TO_ICON[alert.type]} />
          {alert.message}
        </UIAlert>
      )}
    </Animated>
  );
}
