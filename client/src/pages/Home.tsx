import { ui } from "@adamjanicki/ui";
import Page from "src/components/Page";

export default function Home() {
  return (
    <Page title="Home">
      <ui.p
        vfx={{
          paddingX: "l",
          fontSize: "m",
          fontWeight: 5,
          color: "muted",
          textAlign: "center",
        }}
      >
        You should run <ui.code>setup.py</ui.code> to auto-rename a bunch of
        strings.
        <ui.br />
        You can search for <ui.code>skeleton</ui.code> in your editor to find
        all places where you should make your own changes if you really want to
        do it manually
      </ui.p>
    </Page>
  );
}
