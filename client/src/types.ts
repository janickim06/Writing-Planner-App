/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

export type Children = React.ReactNode | React.ReactNode[];

export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};
