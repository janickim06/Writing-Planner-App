import { Spinner, useNavigate } from "@adamjanicki/ui";
import { useEffect } from "react";
import GoogleLoginButton from "src/components/GoogleLoginButton";
import useUser from "src/hooks/useUser";

export default function Landing() {
  const [{ status }] = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Orchard";
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      navigate("/app/", { historyMode: "replace" });
    }
  }, [status, navigate]);

  if (status !== "unauthenticated") {
    return (
      <div className="landing">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="landing">
      <h1 className="landing-title">Orchard</h1>
      <p className="landing-description">
        Writing a story, planning a D&D campaign or just want to draw cool maps? Use Orchard for all your world-building needs!
      </p>
      <GoogleLoginButton />
    </div>
  );
}
