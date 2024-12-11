import dynamic from "next/dynamic";

function SettingsPage() {
  return (
    <p>Settings?</p>
  );
}

export default dynamic(() => Promise.resolve(SettingsPage), {
  ssr: false,
});
