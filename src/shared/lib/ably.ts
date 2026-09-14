import { useEffect, useRef } from "react";
import * as Ably from "ably";

let ablyClient: Ably.Realtime | null = null;

const getAblyClient = (): Ably.Realtime => {
  if (!ablyClient) {
    const key = import.meta.env.VITE_ABLY_API_KEY;
    if (!key) throw new Error("Falta VITE_ABLY_API_KEY en la configuración del frontend");
    ablyClient = new Ably.Realtime({ key });
  }
  return ablyClient;
};

export const useAblyChannel = (
  channelName: string | undefined,
  subscriptions: Record<string, (data: unknown) => void>
) => {
  const handlersRef = useRef(subscriptions);
  handlersRef.current = subscriptions;

  useEffect(() => {
    if (!channelName) return;
    const client = getAblyClient();
    const channel = client.channels.get(channelName);

    const events = Object.keys(handlersRef.current);
    const listeners = events.map((event) => {
      const listener = (message: Ably.Message) => {
        handlersRef.current[event]?.(message.data);
      };
      channel.subscribe(event, listener);
      return { event, listener };
    });

    return () => {
      listeners.forEach(({ event, listener }) =>
        channel.unsubscribe(event, listener)
      );
    };
  }, [channelName]);
};