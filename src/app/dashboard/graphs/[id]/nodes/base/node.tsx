export function Node({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-muted/40 border backdrop-blur-md p-4 space-y-3 min-w-[340px]">
      <span className="text-md text-center font-medium flex flex-col gap-3">
        {title}
      </span>

      {children}
    </div>
  );
}
