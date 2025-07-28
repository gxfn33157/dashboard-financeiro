export function Progress({ value }) {
  return (
    <div className="relative w-full bg-gray-700 rounded h-4">
      <div className="bg-green-500 h-4 rounded" style={{ width: `${value}%` }}></div>
    </div>
  );
}
