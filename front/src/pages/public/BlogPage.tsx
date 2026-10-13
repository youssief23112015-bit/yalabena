import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarDays, Eye, Search } from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { fetchPublishedBlogs } from "@/api/public";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 9;

export default function BlogPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["public-blogs", page, search],
    queryFn: () =>
      fetchPublishedBlogs({ page, limit: PAGE_SIZE, search: search || undefined }),
  });

  const posts = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 0;

  const formatDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString() : "";

  return (
    <PublicLayout>
      <title>{t("public.seo.blogTitle", "Blog — Speak Up Academy")}</title>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold">{t("public.blogPage.title", "Our Blog")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("public.blogPage.subtitle", "Tips, news and stories from Speak Up Academy.")}
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("public.blogPage.search", "Search articles...")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            {t("public.blogPage.empty", "No articles found.")}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.id} className="flex flex-col justify-between transition-shadow hover:shadow-lg">
                {post.featured_image && (
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="h-40 w-full rounded-t-lg object-cover"
                  />
                )}
                <CardContent className="p-6">
                  <h2 className="line-clamp-2 text-xl font-semibold">
                    <Link to={`/blog/${post.slug}`} className="hover:text-primary">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {post.excerpt || post.content}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    {post.published_at && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(post.published_at)}
                      </span>
                    )}
                    {typeof post.view_count === "number" && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {post.view_count}
                      </span>
                    )}
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link to={`/blog/${post.slug}`}>
                      {t("public.blogPage.readMore", "Read More")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t("public.blogPage.prev", "Previous")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("public.blogPage.next", "Next")}
            </Button>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}