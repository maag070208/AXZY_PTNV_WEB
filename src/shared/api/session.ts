let getToken: () => string | null = () => null;
let onUnauthorized: () => void = () => {};

export const setSessionHooks = (
  tokenGetter: () => string | null,
  unauthorizedHandler: () => void
) => {
  getToken = tokenGetter;
  onUnauthorized = unauthorizedHandler;
};

export const getSessionToken = () => getToken();

export const handleUnauthorized = () => onUnauthorized();