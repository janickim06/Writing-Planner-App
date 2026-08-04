import { ui } from "@adamjanicki/ui";
import GoogleLoginButton from "src/components/GoogleLoginButton";
import Page from "src/components/Page";

export default function Login() {
  return (
    <Page title="Log in" vfx={{ gap: "m" }}>
      <ui.p
        vfx={{
          paddingX: "l",
          fontSize: "m",
          fontWeight: 5,
          color: "muted",
          textAlign: "center",
        }}
      >
        Sign in with Google.
      </ui.p>
      <GoogleLoginButton />
    </Page>
  );
}
