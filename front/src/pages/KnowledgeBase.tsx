import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenText, FilePlus2, FolderPlus, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { kbApi, type KbArticle, type KbVisibility } from "@/api/kb";

const canManageRoles = ["super_admin", "hr", "branch_manager", "teacher"];
const canManageCategoryRoles = ["super_admin", "hr", "branch_manager"];
const visibilityOptions: KbVisibility[] = ["staff", "manager", "admin", "teacher", "public"];

export default function KnowledgeBasePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? (user?.role ? [user.role] : []);
  const canManage = roles.includes("super_admin") || roles.some((role) => canManageRoles.includes(role));
  const canManageCategories = roles.includes("super_admin") || roles.some((role) => canManageCategoryRoles.includes(role));
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selected, setSelected] = useState<KbArticle | null>(null);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [articleCategory, setArticleCategory] = useState("");
  const [visibility, setVisibility] = useState<KbVisibility>("staff");
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  const categoriesQuery = useQuery({ queryKey: ["kb-categories"], queryFn: kbApi.categories });
  const articlesQuery = useQuery({
    queryKey: ["kb-articles", search, categoryId],
    queryFn: () => kbApi.articles({ search: search.trim() || undefined, category_id: categoryId || undefined }),
  });
  const categories = categoriesQuery.data ?? [];
  const articles = articlesQuery.data ?? [];
  const selectedCategory = useMemo(() => categories.find((c) => c.id === categoryId), [categories, categoryId]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["kb-articles"] }),
      queryClient.invalidateQueries({ queryKey: ["kb-categories"] }),
    ]);
  };
  const categoryMutation = useMutation({
    mutationFn: () => kbApi.createCategory({ name: categoryName.trim(), description: categoryDescription.trim() || undefined }),
    onSuccess: async () => { setCategoryName(""); setCategoryDescription(""); setShowCategoryForm(false); await refresh(); toast({ title: "Category created" }); },
    onError: (error: Error) => toast({ variant: "destructive", title: "Could not create category", description: error.message }),
  });
  const articleMutation = useMutation({
    mutationFn: () => selected
      ? kbApi.updateArticle(selected.id, { title: title.trim(), body: body.trim(), visibility })
      : kbApi.createArticle({ category_id: articleCategory, title: title.trim(), body: body.trim(), visibility }),
    onSuccess: async () => { setShowArticleForm(false); setSelected(null); setTitle(""); setBody(""); await refresh(); toast({ title: selected ? "Article updated" : "Article created" }); },
    onError: (error: Error) => toast({ variant: "destructive", title: "Could not save article", description: error.message }),
  });

  const openCreateArticle = () => {
    setSelected(null); setTitle(""); setBody(""); setArticleCategory(categoryId || categories[0]?.id || ""); setVisibility("staff"); setShowArticleForm(true);
  };
  const openEditArticle = (article: KbArticle) => {
    setSelected(article); setTitle(article.title); setBody(article.body); setArticleCategory(article.category_id); setVisibility(article.visibility ?? "staff"); setShowArticleForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1><p className="mt-1 text-sm text-muted-foreground">Staff policies, procedures, onboarding notes, and training guides.</p></div>
        {canManage && <div className="flex flex-wrap gap-2">{canManageCategories && <Button variant="outline" onClick={() => setShowCategoryForm(true)}><FolderPlus className="mr-2 h-4 w-4" />New category</Button>}<Button onClick={openCreateArticle} disabled={categories.length === 0}><FilePlus2 className="mr-2 h-4 w-4" />New article</Button></div>}
      </div>

      <Card><CardContent className="flex flex-col gap-3 pt-4 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search article titles and content…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select aria-label="Filter by category" className="h-10 rounded-md border bg-background px-3 text-sm sm:w-64" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
      </CardContent></Card>

      {categoriesQuery.isLoading || articlesQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading knowledge base…</p> : null}
      {categoriesQuery.isError || articlesQuery.isError ? <Card><CardContent className="pt-6 text-sm text-destructive">Could not load the knowledge base. Check your access and backend connection, then refresh.</CardContent></Card> : null}
      {!categoriesQuery.isLoading && categories.length === 0 && <Card><CardContent className="py-10 text-center"><BookOpenText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><h2 className="font-semibold">No categories yet</h2><p className="mt-1 text-sm text-muted-foreground">Create a category before adding the first article.</p></CardContent></Card>}
      {!articlesQuery.isLoading && categories.length > 0 && articles.length === 0 && <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{search || categoryId ? "No articles match your filters." : "No articles have been published yet."}</CardContent></Card>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => <Card key={article.id} className="flex flex-col">
          <CardHeader className="pb-2"><div className="mb-2 flex flex-wrap gap-2">{article.is_pinned && <Badge variant="secondary">Pinned</Badge>}<Badge variant="outline">{article.visibility ?? "staff"}</Badge></div><CardTitle className="text-lg">{article.title}</CardTitle><p className="text-xs text-muted-foreground">{article.category?.name ?? categories.find((c) => c.id === article.category_id)?.name ?? "Uncategorized"} · v{article.version ?? 1} · {new Date(article.updated_at).toLocaleDateString()}</p></CardHeader>
          <CardContent className="flex flex-1 flex-col"><p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">{article.excerpt || article.body}</p><div className="mt-auto flex items-center justify-between gap-2 pt-4"><span className="text-xs text-muted-foreground">{article.view_count ?? 0} views</span><Button size="sm" variant="outline" onClick={() => openEditArticle(article)}>Read / edit</Button></div></CardContent>
        </Card>)}
      </div>

      {showCategoryForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={(e) => { e.preventDefault(); categoryMutation.mutate(); }} className="w-full max-w-lg space-y-4 rounded-xl bg-background p-6 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Create category</h2><Button type="button" variant="ghost" size="icon" onClick={() => setShowCategoryForm(false)}><X className="h-4 w-4" /></Button></div><label className="block space-y-1 text-sm"><span>Name *</span><Input required maxLength={150} value={categoryName} onChange={(e) => setCategoryName(e.target.value)} /></label><label className="block space-y-1 text-sm"><span>Description</span><textarea className="min-h-24 w-full rounded-md border bg-background p-3" value={categoryDescription} onChange={(e) => setCategoryDescription(e.target.value)} /></label><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowCategoryForm(false)}>Cancel</Button><Button type="submit" disabled={categoryMutation.isPending}>{categoryMutation.isPending ? "Saving…" : "Create category"}</Button></div></form></div>}

      {showArticleForm && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"><form onSubmit={(e) => { e.preventDefault(); articleMutation.mutate(); }} className="my-6 w-full max-w-3xl space-y-4 rounded-xl bg-background p-6 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{selected ? "Knowledge article" : "Create article"}</h2><Button type="button" variant="ghost" size="icon" onClick={() => { setShowArticleForm(false); setSelected(null); }}><X className="h-4 w-4" /></Button></div><label className="block space-y-1 text-sm"><span>Title *</span><Input required maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-1 text-sm"><span>Category *</span><select required disabled={!!selected} className="h-10 w-full rounded-md border bg-background px-3" value={articleCategory} onChange={(e) => setArticleCategory(e.target.value)}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="block space-y-1 text-sm"><span>Visibility</span><select className="h-10 w-full rounded-md border bg-background px-3" value={visibility} onChange={(e) => setVisibility(e.target.value as KbVisibility)}>{visibilityOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label></div><label className="block space-y-1 text-sm"><span>Article content *</span><textarea required className="min-h-64 w-full rounded-md border bg-background p-3 text-sm" value={body} onChange={(e) => setBody(e.target.value)} /></label><p className="text-xs text-muted-foreground">Edits are versioned by the backend. Existing article category cannot be changed from this form.</p><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setShowArticleForm(false); setSelected(null); }}>Close</Button>{canManage && <Button type="submit" disabled={articleMutation.isPending}>{articleMutation.isPending ? "Saving…" : selected ? "Save changes" : "Create article"}</Button>}</div></form></div>}
      {selectedCategory && <p className="text-xs text-muted-foreground">Viewing category: {selectedCategory.name}</p>}
    </div>
  );
}
