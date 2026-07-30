import { ui } from "@adamjanicki/ui";
import { useEffect, useState } from "react";
import Page from "src/components/Page";
import useAlert from "src/hooks/useAlert";
import { get } from "src/util";

export default function ApiTest() {
  const [, setAlert] = useAlert();
  const [apiResult, setApiResult] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const setup = async () => {
      const { data, error } = await get("/api/test");
      if (error) {
        setAlert({ type: "error", message: "Error fetching from API." });
        setError(true);
      } else {
        setAlert({ type: "success", message: "It works!" });
        setApiResult(JSON.stringify(data));
        setError(false);
      }
    };
    setup();
  }, [setAlert]);

  return (
    <Page title="API Test">
      <ui.p
        vfx={{
          paddingX: "l",
          fontSize: "m",
          fontWeight: 5,
          color: "muted",
          textAlign: "center",
        }}
      >
        The API returned: <ui.code>{apiResult}</ui.code>
        <ui.br />
        <ui.br />
        {error
          ? "Looks like something is off. Did you setup your database correctly?"
          : "All clear!"}
      </ui.p>
    </Page>
  );
}
