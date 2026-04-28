import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Crumb {
  href?: string;
  label: string;
}

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-start justify-between gap-4">
        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center text-xs text-slate-500 mb-1.5">
              {breadcrumbs.map((c, i) => (
                <span key={i} className="flex items-center">
                  {c.href ? (
                    <Link href={c.href} className="hover:text-slate-700">
                      {c.label}
                    </Link>
                  ) : (
                    <span>{c.label}</span>
                  )}
                  {i < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3 mx-1" />}
                </span>
              ))}
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {description && (
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}
