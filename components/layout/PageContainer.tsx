import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
  /** Extra-wide layouts for dense dashboards (analytics / calendar) */
  wide?: boolean;
};

/** Standard horizontal padding and max-width for dashboard pages */
export default function PageContainer({
  children,
  className,
  wide = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6 py-8 lg:px-10 lg:py-10",
        wide ? "max-w-[1440px]" : "max-w-7xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
