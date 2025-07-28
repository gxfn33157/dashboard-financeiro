export function Card({ children, className }) {
  return <div className={`rounded-xl border bg-white/5 p-4 ${className}`}>{children}</div>;
}
export function CardContent({ children }) {
  return <div className="mt-2">{children}</div>;
}
