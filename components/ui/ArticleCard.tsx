import Link from "next/link";
import { cn } from "@/lib/utils";

type ArticleCardProps = {
  title: string;
  summary?: string | null;
  category?: string | null;
  href?: string;
  featured?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export default function ArticleCard({
  title,
  summary,
  category,
  href,
  featured = false,
  className,
  children,
}: ArticleCardProps) {
  const body = (
    <>
      {category ? (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-hover">
          {category}
        </p>
      ) : null}
      <h3
        className={cn(
          "font-semibold text-foreground",
          featured ? "mt-1 text-xl" : "mt-1 text-base",
        )}
      >
        {title}
      </h3>
      {summary ? (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
          {summary}
        </p>
      ) : null}
      {children}
      {href ? (
        <p className="mt-3 text-sm font-medium text-accent">Read more →</p>
      ) : null}
    </>
  );

  const styles = cn(
    "rounded-2xl border border-border bg-card p-5 transition-colors",
    featured && "border-accent/25 bg-accent/5 sm:p-6",
    href && "hover:border-accent/35 hover:bg-card-hover",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cn(styles, "block")}>
        {body}
      </Link>
    );
  }

  return <article className={styles}>{body}</article>;
}
