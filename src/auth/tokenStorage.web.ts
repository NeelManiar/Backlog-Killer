// Browser persistence lasts for this tab only. Production web requires CSP/XSS review;
// a future server/BFF may use HttpOnly cookies. Never claim JS storage is HttpOnly.
export const tokenStorage = {
  getItem: async (key: string) => sessionStorage.getItem(key),
  setItem: async (key: string, value: string) => {
    sessionStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    sessionStorage.removeItem(key);
  },
};
