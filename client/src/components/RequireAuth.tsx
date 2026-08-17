import { Spinner, useNavigate } from "@adamjanicki/ui";
import { useEffect } from "react";
import useUser from "src/hooks/useUser";
import type { Children } from "src/types";

export default function RequireAuth({ children }: { children: Children }) {
  const [{ status }] = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "unauthenticated") {
      navigate("/", { historyMode: "replace" });
    }
  }, [status, navigate]);

  if (status !== "authenticated") {
    return (
      <div className="landing">
        <Spinner />
      </div>
    );
  }
  return <>{children}</>;
}
