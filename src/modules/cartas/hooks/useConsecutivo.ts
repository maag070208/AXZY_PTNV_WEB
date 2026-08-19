import { useCallback, useEffect, useState } from "react";
import { cartasApi } from "@core/api/cartas.api";

interface State {
  counter: number;
  prefijo: string;
  siguiente: string;
}

const initial: State = {
  counter: 0,
  prefijo: "F-MMTO-",
  siguiente: "F-MMTO-0001",
};

export const useConsecutivo = () => {
  const [state, setState] = useState<State>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    cartasApi
      .getConsecutivo()
      .then((data) => {
        if (cancelled) return;
        setState({
          counter: data.contador,
          prefijo: data.prefijo,
          siguiente: data.siguiente,
        });
      })
      .catch(() => {
        /* fallback to local defaults if API is down */
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const peek = useCallback(async (): Promise<string> => {
    try {
      const res = await cartasApi.peekConsecutivo();
      return res.siguiente;
    } catch {
      return state.siguiente;
    }
  }, [state.siguiente]);

  const consume = useCallback(async (): Promise<string> => {
    // The "consume" semantics: the next consecutivo will be used on save.
    // We just refresh the state from the server's "siguiente".
    try {
      const data = await cartasApi.getConsecutivo();
      setState({
        counter: data.contador,
        prefijo: data.prefijo,
        siguiente: data.siguiente,
      });
      return data.siguiente;
    } catch {
      return state.siguiente;
    }
  }, [state.siguiente]);

  const reset = useCallback(async (): Promise<void> => {
    try {
      await cartasApi.resetConsecutivo();
      setState(initial);
    } catch {
      /* noop */
    }
  }, []);

  return {
    counter: state.counter,
    prefijo: state.prefijo,
    siguiente: state.siguiente,
    loading,
    peek,
    consume,
    reset,
  };
};