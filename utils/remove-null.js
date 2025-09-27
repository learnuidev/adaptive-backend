/* eslint-disable no-unused-vars */
export const removeNull = (obj) => {
  // eslint-disable-next-line no-unused-vars
  return Object.fromEntries(
    Object.entries(obj).filter(([key, v]) => {
      if (typeof v === "boolean" || typeof v === "number") {
        return true;
      }
      return Boolean(v);
    })
  );
};

export default removeNull;
