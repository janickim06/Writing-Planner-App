import { useNavigate } from "@adamjanicki/ui";
import { useEffect, useRef } from "react";
import useAlert from "src/hooks/useAlert";
import useUser from "src/hooks/useUser";
import { post } from "src/util";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string }
          ) => void;
        };
      };
    };
  }
}

export default function GoogleLoginButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [, { login }] = useUser();
  const [, setAlert] = useAlert();
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        const { data, error } = await post("/api/auth/google", {
          credential: response.credential,
        });
        if (error || !data) {
          setAlert({ type: "error", message: "Google sign-in failed." });
          return;
        }
        login(data);
        navigate("/");
      },
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
    });
  }, [login, navigate, setAlert]);

  return <div ref={buttonRef} />;
}
