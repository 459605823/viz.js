export type KeyOf<T extends object> = Extract<keyof T, string>;

export type DeepPartial<T> = {
  [K in keyof T]?: DeepPartial<T[K]>;
};
