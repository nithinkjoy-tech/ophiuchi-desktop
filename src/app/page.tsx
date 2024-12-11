import ProxyListComponent from "@/components/page-components/proxy-list";
import dynamic from "next/dynamic";

function Home() {
  return (
    <div className="min-h-screen">
      <ProxyListComponent />
    </div>
  );
}

export default dynamic(() => Promise.resolve(Home), {
  ssr: false,
});
