/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

export type Children = React.ReactNode | React.ReactNode[];

export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

export type ItemType = "folder" | "text";

export type Item = {
  _id: string;
  ownerId: string;
  type: ItemType;
  name: string;
  parentId: string | null;
  content?: string;
  createdAt: string;
  updatedAt: string;
};
