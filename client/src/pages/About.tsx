import { ui } from "@adamjanicki/ui";
import Page from "src/components/Page";

export default function About() {
  return (
    <Page title="About">
      <ui.p
        vfx={{
          paddingX: "l",
          fontSize: "m",
          fontWeight: 5,
          color: "muted",
          textAlign: "center",
        }}
      >
        This is a skeleton that can you can use to build a web app. It uses a
        React frontend, an express backend, and a MongoDB database. You can
        deploy it to Vercel for free. In your editor, search for{" "}
        <ui.code>skeleton</ui.code> to find all places where you should make
        your own changes.
      </ui.p>
    </Page>
  );
}
