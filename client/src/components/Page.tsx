import { ui } from "@adamjanicki/ui";
import Box, { type BoxProps } from "@adamjanicki/ui/components/Box/Box";
import { classNames } from "@adamjanicki/ui/functions";
import { useEffect } from "react";
import type { Children } from "src/types";

type HeaderProps = React.ComponentProps<typeof ui.h1>;

type Props = Omit<BoxProps, "children"> & {
  children?: Children;
  title?: string;
  documentTitle?: string;
  headerProps?: Omit<HeaderProps, "children">;
};

export default function Page({
  children,
  title,
  vfx,
  documentTitle,
  headerProps,
  style,
  ...rest
}: Props) {
  useEffect(() => {
    const pageTitle = documentTitle ?? title;
    if (pageTitle) {
      document.title = pageTitle;
    }
  }, [documentTitle, title]);

  return (
    <Box
      {...rest}
      vfx={{
        axis: "y",
        align: "center",
        width: "full",
        paddingBottom: "xl",
        ...vfx,
      }}
      style={{ minHeight: "70vh", ...style }}
    >
      {title && (
        <ui.h1
          {...headerProps}
          vfx={{ textAlign: "center", ...headerProps?.vfx }}
          className={classNames("page-title-text", headerProps?.className)}
          style={{ whiteSpace: "wrap", wordBreak: "break-word" }}
        >
          {title}
        </ui.h1>
      )}
      {children}
    </Box>
  );
}
