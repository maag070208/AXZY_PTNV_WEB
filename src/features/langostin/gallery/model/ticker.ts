type FrameListener = (frame: number) => void;

const listeners = new Set<FrameListener>();
let timer: number | null = null;
let frame = 0;
let interval = 140;

/**
 * Un solo reloj para todas las fichas de la galería: con 36 animaciones
 * animadas al mismo tiempo, un `setInterval` por cuadro multiplica el trabajo
 * del navegador. Aquí el cuadro es global y todas se redibujan en fase.
 */
const tick = (): void => {
  frame += 1;
  listeners.forEach((listener) => listener(frame));
};

const ensureTimer = (): void => {
  if (timer === null && listeners.size > 0) {
    timer = window.setInterval(tick, interval);
  }
};

const stopTimer = (): void => {
  if (timer !== null && listeners.size === 0) {
    window.clearInterval(timer);
    timer = null;
  }
};

/** Se suscribe al cuadro global; devuelve la función para cancelar. */
export const subscribeFrames = (listener: FrameListener): (() => void) => {
  listeners.add(listener);
  ensureTimer();
  return () => {
    listeners.delete(listener);
    stopTimer();
  };
};

/** Cambia la velocidad (ms por cuadro) de todas las Pictures suscritas. */
export const setFrameSpeed = (ms: number): void => {
  interval = ms;
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
  ensureTimer();
};
