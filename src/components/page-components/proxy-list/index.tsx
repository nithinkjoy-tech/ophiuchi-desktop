"use client";

import proxyListStore from "@/stores/proxy-list";
import ProxyListTable from "./table";

export default function ProxyListComponent() {
  const { proxyList } = proxyListStore();

  return <ProxyListTable />;
}
