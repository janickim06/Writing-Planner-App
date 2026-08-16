import {
  Button,
  Icon,
  Spinner,
  ui,
  useNavigate,
  usePathParams,
} from "@adamjanicki/ui";
import { logout as logoutIcon, plus } from "@adamjanicki/ui/icons";
import { useCallback, useEffect, useState } from "react";
import FileTree from "src/components/FileTree";
import GraphEditor from "src/components/GraphEditor";
import TextEditor from "src/components/TextEditor";
import useItems from "src/hooks/useItems";
import useUser from "src/hooks/useUser";
import type { ItemType } from "src/types";

const LAST_ITEM_KEY = "orchard:lastItemId";

export default function Dashboard() {
  const { itemId } = usePathParams();
  const navigate = useNavigate();
  const [{ items, loading }, { refresh, createItem }] = useItems();
  const [{ user }, { logout }] = useUser();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeItem = itemId
    ? items.find((item) => item._id === itemId)
    : undefined;

  useEffect(() => {
    if (activeItem && activeItem.type !== "folder") {
      window.localStorage.setItem(LAST_ITEM_KEY, activeItem._id);
    }
  }, [activeItem]);

  const guardedNavigate = useCallback(
    (to: string) => {
      if (dirty && !window.confirm("Discard unsaved changes?")) return;
      navigate(to);
    },
    [dirty, navigate]
  );

  const handleCreate = async (type: ItemType) => {
    if (type === "folder") {
      const name = window.prompt("Folder name", "New folder");
      if (!name) return;
      await createItem(name, "folder", selectedFolderId);
      return;
    }
    const created = await createItem(
      type === "graph" ? "Untitled graph" : "Untitled",
      type,
      selectedFolderId
    );
    if (created) guardedNavigate(`/app/${created._id}`);
  };

  const handleItemDeleted = (deletedId: string) => {
    if (window.localStorage.getItem(LAST_ITEM_KEY) === deletedId) {
      window.localStorage.removeItem(LAST_ITEM_KEY);
    }
    if (deletedId === itemId) navigate("/app/", { historyMode: "replace" });
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-header">Orchard</div>
        <div className="sidebar-actions">
          <Button
            vfx={{ axis: "x", align: "center", gap: "xs" }}
            size="small"
            onClick={() => handleCreate("text")}
          >
            <Icon size="xs" icon={plus} /> File
          </Button>
          <Button
            vfx={{ axis: "x", align: "center", gap: "xs" }}
            size="small"
            variant="secondary"
            onClick={() => handleCreate("graph")}
          >
            <Icon size="xs" icon={plus} /> Graph
          </Button>
          <Button
            vfx={{ axis: "x", align: "center", gap: "xs" }}
            size="small"
            variant="secondary"
            onClick={() => handleCreate("folder")}
          >
            <Icon size="xs" icon={plus} /> Folder
          </Button>
        </div>
        <div className="sidebar-tree">
          <FileTree
            activeItemId={itemId}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onOpenFile={(id) => guardedNavigate(`/app/${id}`)}
            onItemDeleted={handleItemDeleted}
          />
        </div>
        <div className="sidebar-footer">
          {user?.avatarUrl && (
            <img className="sidebar-avatar" src={user.avatarUrl} alt="" />
          )}
          <span className="sidebar-user-name">{user?.name}</span>
          <Button
            size="small"
            variant="secondary"
            aria-label="Log out"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
          >
            <Icon size="s" icon={logoutIcon} />
          </Button>
        </div>
      </aside>

      <main className="app-main">{renderMain()}</main>
    </div>
  );

  function renderMain() {
    if (loading && !items.length) {
      return (
        <div className="main-placeholder">
          <Spinner />
        </div>
      );
    }

    if (itemId) {
      if (!activeItem) {
        return (
          <div className="main-placeholder">
            <ui.p vfx={{ color: "muted" }}>That file doesn&apos;t exist.</ui.p>
          </div>
        );
      }
      if (activeItem.type === "folder") {
        return (
          <div className="main-placeholder">
            <ui.p vfx={{ color: "muted" }}>
              <strong>{activeItem.name}</strong> is a folder. Pick a file inside
              it to start writing.
            </ui.p>
          </div>
        );
      }
      if (activeItem.type === "graph") {
        return (
          <GraphEditor
            key={activeItem._id}
            item={activeItem}
            onDirtyChange={setDirty}
          />
        );
      }
      return (
        <TextEditor
          key={activeItem._id}
          item={activeItem}
          onDirtyChange={setDirty}
        />
      );
    }

    const lastId = window.localStorage.getItem(LAST_ITEM_KEY);
    const lastItem = lastId
      ? items.find((item) => item._id === lastId && item.type !== "folder")
      : undefined;

    return (
      <div className="main-placeholder">
        {lastItem ? (
          <>
            <ui.p vfx={{ color: "muted" }}>Jump back in</ui.p>
            <Button onClick={() => navigate(`/app/${lastItem._id}`)}>
              {lastItem.name}
            </Button>
          </>
        ) : (
          <ui.p vfx={{ color: "muted" }}>
            Select a file from the sidebar, or create one to get started.
          </ui.p>
        )}
      </div>
    );
  }
}
