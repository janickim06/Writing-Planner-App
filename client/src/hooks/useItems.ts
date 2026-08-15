import { createStore } from "@adamjanicki/store";
import { useCallback } from "react";
import type { Item, ItemType } from "src/types";
import { del, get, patch, post } from "src/util";

type ItemStore = {
  items: Item[];
  loading: boolean;
};

const useItemsBase = createStore<ItemStore>({
  init: { items: [], loading: true },
});

export default function useItems() {
  const [{ items, loading }, setStore] = useItemsBase();

  const refresh = useCallback(async () => {
    const { data, error } = await get("/api/items");
    setStore({ items: error || !data ? [] : data, loading: false });
  }, [setStore]);

  const createItem = useCallback(
    async (name: string, type: ItemType, parentId: string | null) => {
      const { data, error } = await post("/api/items", {
        name,
        type,
        parentId,
      });
      if (error || !data) return undefined;
      await refresh();
      return data as Item;
    },
    [refresh]
  );

  const updateItem = useCallback(
    async (
      id: string,
      updates: Partial<Pick<Item, "name" | "content" | "parentId" | "nodes">>
    ) => {
      const { data, error } = await patch(`/api/items/${id}`, updates);
      if (error || !data) return undefined;
      await refresh();
      return data as Item;
    },
    [refresh]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const { error } = await del(`/api/items/${id}`);
      if (error) return false;
      await refresh();
      return true;
    },
    [refresh]
  );

  return [
    { items, loading },
    { refresh, createItem, updateItem, deleteItem },
  ] as const;
}
