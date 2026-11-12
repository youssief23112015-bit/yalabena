import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpenText,
  Ticket,
  MessageCircle,
  Search,
  X,
  ChevronDown,
  Plus,
  Mail,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import {
  supportApi,
  type TicketStatus,
  type TicketPriority,
} from "@/api/support";
import { kbApi, type KbCategory, type KbArticle } from "@/api/kb";
import { usersApi } from "@/api/users";
import { hasAnyRole } from "@/lib/rbac";

const STAFF_ROLES = ["super_admin", "hr", "branch_manager"];

const TICKET_CATEGORIES: string[] = [
  "Technical",
  "Billing & Payments",
  "Account & Profile",
  "Courses & Groups",
  "Access & Login",
  "Other",
];

const PRIORITY_OPTIONS: TicketPriority[] = ["low", "medium", "high", "urgent"];

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const STATUS_CLASSES: Record<TicketStatus, string> = {
  open: "border-blue-200 bg-blue-50 text-blue-700",
  in_progress: "border-amber-200 bg-amber-50 text-amber-700",
  resolved: "border-green-200 bg-green-50 text-green-700",
};

const PRIORITY_CLASSES: Record<TicketPriority, string> = {
  low: "border-gray-200 bg-gray-50 text-gray-600",
  medium: "border-blue-200 bg-blue-50 text-blue-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  urgent: "border-red-200 bg-red-50 text-red-700",
};

const DEFAULT_CATEGORIES: KbCategory[] = [
  { id: "getting-started", name: "Getting Started", sort_order: 0 },
  { id: "students", name: "Students & Enrollment", sort_order: 1 },
  { id: "courses", name: "Courses & Classes", sort_order: 2 },
  { id: "account", name: "Account & Settings", sort_order: 3 },
  { id: "payments", name: "Payments & Billing", sort_order: 4 },
  { id: "technical", name: "Technical Issues", sort_order: 5 },
];

const DEFAULT_ARTICLES: KbArticle[] = [
  {
    id: "default-getting-started",
    category_id: "getting-started",
    title: "How to add students",
    body:
      "1. Go to Students → Add Student.\n2. Enter the student's full name, email, and CEFR level.\n3. Assign the student to a study group and save.\n4. The student receives login credentials automatically.",
    excerpt:
      "Step-by-step instructions for registering a new student in the system.",
    visibility: "staff",
    is_pinned: true,
    version: 1,
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "default-courses",
    category_id: "courses",
    title: "Managing courses",
    body:
      "1. Navigate to Courses in the sidebar.\n2. Use the course card to edit name, level, duration, and price.\n3. Assign materials and prerequisites if needed.\n4. Publish the course so groups can use it.",
    excerpt: "Create, edit, and publish courses for your academy.",
    visibility: "staff",
    is_pinned: true,
    version: 1,
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "default-account",
    category_id: "account",
    title: "Account settings",
    body:
      "1. Click your avatar in the top bar → Profile.\n2. Update your name, email, phone, and preferred language.\n3. Change your password under Security settings.\n4. Save your changes.",
    excerpt: "Manage your personal account and security preferences.",
    visibility: "public",
    is_pinned: false,
    version: 1,
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "default-groups",
    category_id: "courses",
    title: "Managing groups and sessions",
    body:
      "1. Go to Groups and click Create group.\n2. Select the course, assign a teacher, and pick the schedule.\n3. Open test slots so students can book placement tests.\n4. Enroll students and mark attendance from Sessions.",
    excerpt: "Create study groups and schedule class sessions.",
    visibility: "staff",
    is_pinned: false,
    version: 1,
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SupportPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? (user?.role ? [user.role] : []);
  const isStaff = hasAnyRole(roles, STAFF_ROLES);

  const [tab, setTab] = useState<"help" | "my-tickets" | "admin">("help");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<KbArticle | null>(
    null,
  );
  const [openSubmit, setOpenSubmit] = useState(false);
  const [openReply, setOpenReply] = useState(false);
  const [replyingTicketId, setReplyingTicketId] = useState<string | null>(
    null,
  );
  const [replyBody, setReplyBody] = useState("");
  const [adminStatusFilter, setAdminStatusFilter] = useState<
    TicketStatus | ""
  >("");

  const [assigningTicketId, setAssigningTicketId] = useState<string | null>(
    null,
  );
  const [assignTo, setAssignTo] = useState("");

  const [subject, setSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");

  const categoriesQuery = useQuery({
    queryKey: ["kb-categories"],
    queryFn: kbApi.categories,
  });
  const articlesQuery = useQuery({
    queryKey: ["kb-articles", search, categoryId],
    queryFn: () =>
      kbApi.articles({
        search: search.trim() || undefined,
        category_id: categoryId || undefined,
      }),
  });
  const myTicketsQuery = useQuery({
    queryKey: ["my-tickets"],
    queryFn: supportApi.getMyTickets,
  });
  const adminTicketsQuery = useQuery({
    queryKey: ["admin-tickets", adminStatusFilter],
    queryFn: () =>
      supportApi.getTickets({
        status: adminStatusFilter || undefined,
      }),
    enabled: isStaff,
  });
  const agentsQuery = useQuery({
    queryKey: ["support-agents"],
    queryFn: () => usersApi.findAll(),
    enabled: isStaff,
  });

  const categories = categoriesQuery.data ?? [];
  const articles = articlesQuery.data ?? [];
  const myTickets = myTicketsQuery.data ?? [];
  const adminTickets = adminTicketsQuery.data?.items ?? [];
  const agents = agentsQuery.data ?? [];

  const visibleCategories = useMemo(() => {
    return categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  }, [categories]);

  const visibleArticles = useMemo(() => {
    const source = articles.length > 0 ? articles : DEFAULT_ARTICLES;
    const term = search.toLowerCase();
    return source.filter((article) => {
      const matchCategory =
        !categoryId ||
        article.category_id === categoryId ||
        article.category?.id === categoryId;
      const matchText =
        !term ||
        article.title.toLowerCase().includes(term) ||
        (article.body || "").toLowerCase().includes(term) ||
        (article.excerpt || "").toLowerCase().includes(term);
      return matchCategory && matchText;
    });
  }, [articles, search, categoryId]);

  const createTicketMutation = useMutation({
    mutationFn: () =>
      supportApi.createTicket({
        subject,
        category: ticketCategory,
        message,
        priority,
      }),
    onSuccess: async () => {
      setSubject("");
      setTicketCategory("");
      setMessage("");
      setPriority("medium");
      setOpenSubmit(false);
      await queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      toast({
        title: "Ticket submitted",
        description:
          "Our support team will review your request and get back to you.",
      });
    },
    onError: (error: Error) =>
      toast({
        variant: "destructive",
        title: "Failed to submit ticket",
        description: error.message,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: TicketStatus;
    }) => supportApi.updateTicketStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      await queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      toast({ title: "Status updated" });
    },
    onError: (error: Error) =>
      toast({
        variant: "destructive",
        title: "Could not update status",
        description: error.message,
      }),
  });

  const replyMutation = useMutation({
    mutationFn: () =>
      supportApi.replyTicket(replyingTicketId as string, replyBody),
    onSuccess: async () => {
      setOpenReply(false);
      setReplyingTicketId(null);
      setReplyBody("");
      await queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      await queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      toast({ title: "Reply sent" });
    },
    onError: (error: Error) =>
      toast({
        variant: "destructive",
        title: "Failed to send reply",
        description: error.message,
      }),
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      supportApi.assignTicket(assigningTicketId as string, assignTo),
    onSuccess: async () => {
      setAssigningTicketId(null);
      setAssignTo("");
      await queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      await queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      toast({ title: "Ticket assigned" });
    },
    onError: (error: Error) =>
      toast({
        variant: "destructive",
        title: "Failed to assign ticket",
        description: error.message,
      }),
  });

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !ticketCategory.trim() || !message.trim()) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in subject, category and message.",
      });
      return;
    }
    createTicketMutation.mutate();
  };

  const nav = useMemo(
    () => [
      { key: "help" as const, label: "Help Center", icon: BookOpenText },
      { key: "my-tickets" as const, label: "My Tickets", icon: Ticket },
      ...(isStaff
        ? [
            {
              key: "admin" as const,
              label: "Admin Tickets",
              icon: MessageCircle,
            },
          ]
        : []),
    ],
    [isStaff],
  );

  const statusBadge = (status: TicketStatus) => (
    <Badge className={`px-2.5 py-1 ${STATUS_CLASSES[status]}`}>
      {STATUS_LABELS[status]}
    </Badge>
  );

  const priorityBadge = (priority: TicketPriority) => (
    <Badge className={`px-2.5 py-1 ${PRIORITY_CLASSES[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Help &amp; Support</h1>
          <p className="text-muted-foreground">
            Search the Help Center for self-service answers, or submit a support
            ticket if you need further assistance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {nav.map((item) => (
            <Button
              key={item.key}
              onClick={() => setTab(item.key)}
              variant={tab === item.key ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <Dialog open={openSubmit} onOpenChange={setOpenSubmit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit a Support Ticket</DialogTitle>
            <DialogDescription>
              Can't find an answer? Send us a message and our support team will
              get back to you.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTicket} className="space-y-4 mt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-sm text-muted-foreground">Subject</span>
                <Input
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Cannot access my group sessions"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm text-muted-foreground">
                  Category *
                </span>
                <select
                  required
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3"
                >
                  <option value="">Select a category</option>
                  {TICKET_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-sm text-muted-foreground">Priority</span>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as TicketPriority)
                }
                className="h-10 w-full rounded-md border bg-background px-3"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-muted-foreground">Message *</span>
              <textarea
                required
                minRows={5}
                className="block w-full rounded-md border bg-background p-3 text-sm"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue in detail…"
              />
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenSubmit(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTicketMutation.isPending}>
                {createTicketMutation.isPending ? "Submitting…" : "Submit ticket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
        <DialogClose>
          <X className="h-4 w-4" />
        </DialogClose>
      </Dialog>

      {isStaff && (
        <Dialog open={openReply} onOpenChange={setOpenReply}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reply to Ticket</DialogTitle>
              <DialogDescription>
                Your reply will be sent to the ticket requester.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                replyMutation.mutate();
              }}
              className="space-y-3 mt-4"
            >
              <label className="block space-y-1">
                <span className="text-sm text-muted-foreground">Reply</span>
                <textarea
                  required
                  minRows={4}
                  className="block w-full rounded-md border bg-background p-3 text-sm"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Type your response…"
                />
              </label>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenReply(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={replyMutation.isPending}>
                  {replyMutation.isPending ? "Sending…" : "Send reply"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
          <DialogClose>
            <X className="h-4 w-4" />
          </DialogClose>
        </Dialog>
      )}

      {tab === "help" && (
        <section>
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex w-full flex-1 gap-2">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search help articles…"
                    className="flex-1"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="h-9 rounded-md border bg-background px-3"
                  >
                    <option value="">All categories</option>
                    {visibleCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3">
                {visibleArticles.length === 0 ? (
                  <div className="col-span-full rounded-xl border bg-background p-6 text-center text-muted-foreground">
                    No help articles match your search.
                  </div>
                ) : (
                  visibleArticles.map((article) => (
                    <Card
                      key={article.id}
                      className="cursor-pointer hover:border-primary transition-border group"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <CardHeader
                        className="flex flex-row items-center justify-between gap-2 py-3"
                      >
                        <div>
                          <CardTitle className="text-sm font-semibold leading-tight">
                            {article.title}
                          </CardTitle>
                          {article.category && (
                            <p className="text-xs text-muted-foreground">
                              {article.category.name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {article.visibility}
                          </Badge>
                          <ChevronDown
                            className="h-4 w-4 opacity-50 group-hover:opacity-100"
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="py-3">
                        <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                          {article.excerpt || article.body}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{article.view_count ?? 0} views</span>
                          <span>v{article.version}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {selectedArticle && (
              <div className="md:col-span-4">
                <Card className="sticky top-6">
                  <CardHeader
                    className="flex flex-row items-center justify-between py-3"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedArticle(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="py-4">
                    <h2 className="text-lg font-bold mb-2">
                      {selectedArticle.title}
                    </h2>
                    <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
                      <span>{selectedArticle.category?.name || "General"}</span>
                      <Badge variant="outline" className="text-xs">
                        {selectedArticle.visibility}
                      </Badge>
                      <span>{formatDate(selectedArticle.updated_at)}</span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedArticle.body}
                    </div>
                  </CardContent>
                </Card>
                <div className="mt-4 rounded-xl border bg-background p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      SU
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Support Center</div>
                      <div className="text-xs text-muted-foreground">
                        Self-service help articles
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Still need help? Submit a ticket below.
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedArticle(null);
                      setOpenSubmit(true);
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "my-tickets" && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold">My Support Tickets</h2>
            <Button onClick={() => setOpenSubmit(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>

          {myTickets.length === 0 ? (
            <div className="rounded-xl border bg-background p-10 text-center text-muted-foreground">
              <Ticket className="mx-auto h-10 w-10 mb-3 opacity-40" />
              <h3 className="text-sm font-medium">No tickets yet</h3>
              <p className="text-xs">
                Submit your first support ticket and track its status here.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted text-muted-foreground">
                    <th className="p-3 text-left">Subject</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-left">Priority</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Created</th>
                    <th className="p-3 text-left">Replies</th>
                  </tr>
                </thead>
                <tbody>
                  {myTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b hover:bg-accent/50"
                    >
                      <td className="p-3">
                        <div className="font-medium">{ticket.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {ticket.user_email || ticket.user_name || ""}
                        </div>
                      </td>
                      <td className="p-3">{ticket.category}</td>
                      <td className="p-3">{priorityBadge(ticket.priority)}</td>
                      <td className="p-3">{statusBadge(ticket.status)}</td>
                      <td className="p-3">{formatDate(ticket.created_at)}</td>
                      <td className="p-3">{ticket.replies?.length ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "admin" && isStaff && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold">All Support Tickets</h2>
            <select
              value={adminStatusFilter}
              onChange={(e) =>
                setAdminStatusFilter(e.target.value as TicketStatus | "")
              }
              className="h-9 rounded-md border bg-background px-3 w-auto"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {adminTickets.length === 0 ? (
            <div className="rounded-xl border bg-background p-10 text-center text-muted-foreground">
              <AlertCircle className="mx-auto h-10 w-10 mb-3 opacity-40" />
              <h3 className="text-sm font-medium">No tickets found</h3>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted text-muted-foreground">
                    <th className="p-3 text-left">Subject</th>
                    <th className="p-3 text-left">Requester</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-left">Priority</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Assignee</th>
                    <th className="p-3 text-left">Created</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b hover:bg-accent/50"
                    >
                      <td className="p-3">
                        <div className="font-medium">{ticket.subject}</div>
                        {ticket.admin_reply && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Replied: {ticket.admin_reply}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-medium">
                          {ticket.user_name || ticket.user_email || "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ticket.user_email || ""}
                        </div>
                      </td>
                      <td className="p-3">{ticket.category}</td>
                      <td className="p-3">{priorityBadge(ticket.priority)}</td>
                      <td className="p-3">
                        <select
                          value={ticket.status}
                          onChange={(e) =>
                            updateStatusMutation.mutate({
                              id: ticket.id,
                              status: e.target.value as TicketStatus,
                            })
                          }
                          className="h-8 rounded-md border bg-background px-2 text-xs"
                        >
                          {Object.entries(STATUS_LABELS).map(
                            ([key, label]) => (
                              <option
                                key={key}
                                value={key as TicketStatus}
                              >
                                {label}
                              </option>
                            )
                          )}
                        </select>
                      </td>
                      <td className="p-3">{formatDate(ticket.created_at)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {ticket.assignee
                              ? `${ticket.assignee.first_name ?? ""} ${ticket.assignee.last_name ?? ""}`.trim() || "Unassigned"
                              : "Unassigned"
                            }
                          </Badge>
                          <select
                            value={ticket.assigned_to || ""}
                            onChange={(e) => {
                              setAssigningTicketId(ticket.id);
                              setAssignTo(e.target.value);
                              assignMutation.mutate();
                            }}
                            className="h-8 rounded-md border bg-background px-2 text-xs w-full md:w-auto"
                          >
                            <option value="">Unassign</option>
                            {agents.map((agent) => (
                              <option key={agent.id} value={agent.id}>
                                {agent.first_name} {agent.last_name} ({agent.email})
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="p-3">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setReplyingTicketId(ticket.id);
                            setReplyBody("");
                            setOpenReply(true);
                          }}
                        >
                          <Mail className="h-3 w-3 mr-1.5" />
                          Reply
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}





