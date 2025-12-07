export default function Switch({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`flex h-6 w-12 cursor-pointer items-center rounded-full p-1 transition ${
        checked ? "bg-cyan-700" : "bg-gray-300"
      }`}
    >
      <div
        className={`h-5 w-5 transform rounded-full bg-white shadow-md transition ${
          checked ? "-translate-x-0" : "-translate-x-5"
        }`}
      ></div>
    </div>
  );
}
