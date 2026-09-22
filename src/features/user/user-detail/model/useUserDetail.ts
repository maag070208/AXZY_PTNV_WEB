import { useEffect, useState } from "react";
import { usersApi, type User } from "@entities/user";

export const useUserDetail = (id?: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    setNotFound(false);
    usersApi
      .get(id)
      .then((u) => setUser(u))
      .catch((err: unknown) => {
        const status = (err as { status?: number })?.status;
        setNotFound(status === 404);
        setError(status !== 404);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return { user, loading, error, notFound };
};