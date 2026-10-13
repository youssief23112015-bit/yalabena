import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CalendarDays, Eye } from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { fetchBlogPostBySlug } from "@/api/public";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogPostPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ["public-blog", slug],
    queryFn: () => fetchBlogPostBySlug(slug as string),
    enabled: Boolean(slug),
    retry: false,
  });

  return (
    <PublicLayout>
      <title>{post?.title ?? t("public.seo.blogPostTitle", "Article — Speak Up Academy")}</title>
      {post?.meta_description && (
        <meta name="description" content={post.meta_description} />
      )}
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2 rtl:rotate-180" />
            {t("public.blogPost.back", "Back to Blog")}
          </Link>
        </Button>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-64" />
          </div>
        ) : isError || !post ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">
              {t("public.blogPost.notFound", "This article was not found or is no longer published.")}
            </p>
            <Button asChild className="mt-6">
              <Link to="/blog">{t("public.blogPost.browseAll", "Browse All Articles")}</Link>
            </Button>
          </div>
        ) : (
          <article>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              {post.title}
            </h1>
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {new Date(post.published_at).toLocaleDateString()}
                </span>
              )}
              {typeof post.view_count === "number" && (
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.view_count}
                </span>
              )}
              {post.author && (
                <span>
                  {[post.author.first_name, post.author.last_name].filter(Boolean).join(" ")}
                </span>
              )}
            </div>

            {post.featured_image && (
              <img
                src={post.featured_image}
                alt={post.title}
                className="mt-6 w-full rounded-lg object-cover"
              />
            )}

            <div className="mt-8 whitespace-pre-wrap leading-8">{post.content}</div>
          </article>
        )}
      </div>
    </PublicLayout>
  );
}