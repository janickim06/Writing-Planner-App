import { createStore } from "@adamjanicki/store";
import { useCallback, useEffect } from "react";
import type { User } from "src/types";
import { get, post } from "src/util";

type UserStore = {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
};

const useUserBase = createStore<UserStore>({
  init: { user: null, status: "loading" },
});

let fetchStarted = false;

export default function useUser() {
  const [userStore, setUserStore] = useUserBase();

  useEffect(() => {
    if (fetchStarted) return;
    fetchStarted = true;
    const fetchUser = async () => {
      const { data, error } = await get("/api/auth/me");
      setUserStore(
        error || !data
          ? { user: null, status: "unauthenticated" }
          : { user: data, status: "authenticated" }
      );
    };
    fetchUser();
  }, [setUserStore]);

  const login = useCallback(
    (user: User) => setUserStore({ user, status: "authenticated" }),
    [setUserStore]
  );

  const logout = useCallback(async () => {
    await post("/api/auth/logout");
    setUserStore({ user: null, status: "unauthenticated" });
  }, [setUserStore]);

  return [userStore, { login, logout }] as const;
}
