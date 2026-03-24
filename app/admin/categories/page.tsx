import { HiOutlineRectangleStack } from "react-icons/hi2";
import { AdminAddCategoryForm } from "@/components/admin-add-category-form";
import { AdminCategoryList } from "@/components/admin-category-list";
import { getCategories } from "@/lib/db/catalog";

export default function AdminCategoriesPage() {
  const categories = getCategories();

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 border-b border-base-300 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HiOutlineRectangleStack className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-base-content">
              Categories
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-base-content/60">
              Taxonomy powers browse filters and search. Deleting a category
              requires no child categories and no products assigned.
            </p>
          </div>
        </div>
      </header>

      <AdminAddCategoryForm categories={categories} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content/50">
          Current tree
        </h2>
        {categories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-base-300 bg-base-200/20 px-4 py-10 text-center text-sm text-base-content/55">
            No categories yet — create the first node above.
          </p>
        ) : (
          <AdminCategoryList categories={categories} />
        )}
      </section>
    </div>
  );
}
