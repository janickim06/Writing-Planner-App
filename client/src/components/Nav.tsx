import "src/components/nav.css";

import {
  Box,
  Link,
  TripleFade as Hamburger,
  ui,
  UnstyledLink,
} from "@adamjanicki/ui";
import { type ReactNode, useState } from "react";

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <ui.nav vfx={{ paddingY: "s", paddingX: "l" }}>
      <Box
        vfx={{ axis: "x", align: "center", justify: "between" }}
        className="bar-container"
      >
        <UnstyledLink
          className="nav-title"
          to="/"
          onClick={() => setOpen(false)}
        >
          React Skeleton
        </UnstyledLink>
        <Box className="mobile">
          <Hamburger open={open} onClick={() => setOpen((prev) => !prev)} />
        </Box>
      </Box>
      <Box
        className="desktop navlink-container"
        // force display to be open on mobile when hamburger is toggled
        style={open ? { display: "flex" } : undefined}
      >
        <Navlink to="/" onClick={() => setOpen(false)}>
          Home
        </Navlink>
        <Navlink to="/about/" onClick={() => setOpen(false)}>
          About
        </Navlink>
        <Navlink to="/api-test/" onClick={() => setOpen(false)}>
          API Test
        </Navlink>
      </Box>
    </ui.nav>
  );
}

type NavlinkProps = {
  to: string;
  children: ReactNode;
  onClick: () => void;
};

const Navlink = (props: NavlinkProps) => (
  <Link
    vfx={{ width: "full", fontWeight: 5, color: "default" }}
    style={{ whiteSpace: "nowrap" }}
    {...props}
  />
);
