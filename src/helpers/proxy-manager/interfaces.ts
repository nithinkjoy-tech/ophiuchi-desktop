export type IProxyData = {
  nickname: string;
  hostname: string;
  port: number;
  createdAt: string;
};

export type IProxyGroupData = {
  id: string;
  name: string;
  isNoGroup: boolean; // true if this is the default group
  includedHosts: (string | IProxyData)[];
  createdAt: string;
  updatedAt: string;
};
