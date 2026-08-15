/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

export type Children = React.ReactNode | React.ReactNode[];

export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

export type ItemType = "folder" | "text" | "graph";

export type GraphNode = {
  id: string;
  name: string;
  x: number;
  y: number;
};

export type Item = {
  _id: string;
  ownerId: string;
  type: ItemType;
  name: string;
  parentId: string | null;
  content?: string;
  nodes?: GraphNode[];
  createdAt: string;
  updatedAt: string;
};
