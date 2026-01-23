import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, Store, ClipboardList, Shield, Plus, Search, 
  Check, X, Eye, Trash2, Edit, Loader2 
} from "lucide-react";
import { format } from "date-fns";
import { AdminRestaurantForm } from "@/components/admin/AdminRestaurantForm";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { AdminRestaurantList } from "@/components/admin/AdminRestaurantList";

interface RestaurantRequest {
  id: string;
  status: "pending" | "approved" | "rejected";
  submission_data: {
    name?: string;
    address?: string;
    cuisine_type?: string;
    halal_status?: string;
    price_range?: string;
    description?: string;
    phone?: string;
    website_url?: string;
  };
  admin_notes: string | null;
  user_id: string;
  created_at: string;
  reviewed_at: string | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersResult, restaurantsResult, requestsResult] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("restaurants").select("id", { count: "exact", head: true }),
        supabase.from("restaurant_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      return {
        totalUsers: usersResult.count || 0,
        totalRestaurants: restaurantsResult.count || 0,
        pendingRequests: requestsResult.count || 0,
      };
    },
  });

  // Fetch requests
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["admin-requests", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("restaurant_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter as "pending" | "approved" | "rejected");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RestaurantRequest[];
    },
  });

  // Approve request mutation
  const approveRequestMutation = useMutation({
    mutationFn: async ({ requestId, adminNotes }: { requestId: string; adminNotes?: string }) => {
      // Get the request details
      const { data: request, error: fetchError } = await supabase
        .from("restaurant_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (fetchError) throw fetchError;

      const submissionData = request.submission_data as RestaurantRequest["submission_data"];

      // Create the restaurant
      const { error: insertError } = await supabase.from("restaurants").insert({
        name: submissionData.name || "Unnamed Restaurant",
        address: submissionData.address || "",
        cuisine_type: submissionData.cuisine_type || "Other",
        halal_status: (submissionData.halal_status as "Full Halal" | "Partial Halal") || "Full Halal",
        price_range: (submissionData.price_range as "$" | "$$" | "$$$" | "$$$$") || "$$",
        description: submissionData.description || null,
        phone: submissionData.phone || null,
        website_url: submissionData.website_url || null,
        lat: 40.7128, // Default to NYC, should be geocoded
        lng: -74.0060,
        created_by: request.user_id,
      });

      if (insertError) throw insertError;

      // Update request status
      const { error: updateError } = await supabase
        .from("restaurant_requests")
        .update({
          status: "approved",
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Request approved and restaurant created!");
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Reject request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async ({ requestId, adminNotes }: { requestId: string; adminNotes: string }) => {
      const { error } = await supabase
        .from("restaurant_requests")
        .update({
          status: "rejected",
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
      case "approved":
        return "bg-green-500/10 text-green-600 border-green-500/30";
      case "rejected":
        return "bg-red-500/10 text-red-600 border-red-500/30";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage users, restaurants, and review pending requests.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalUsers}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalRestaurants}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.pendingRequests}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different management sections */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Requests
              {stats?.pendingRequests ? (
                <Badge variant="secondary" className="ml-1 bg-yellow-500/20 text-yellow-600">
                  {stats.pendingRequests}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="gap-2">
              <Store className="h-4 w-4" />
              Restaurants
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Restaurant
            </TabsTrigger>
          </TabsList>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Restaurant Requests</CardTitle>
                    <CardDescription>
                      Review and approve or reject restaurant submissions.
                    </CardDescription>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : requests && requests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Restaurant</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.submission_data?.name || "Unnamed"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div>{request.submission_data?.cuisine_type}</div>
                            <div className="text-xs">{request.submission_data?.address}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(request.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusBadgeColor(request.status)}>
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/admin/request/${request.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {request.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => approveRequestMutation.mutate({ requestId: request.id })}
                                    disabled={approveRequestMutation.isPending}
                                  >
                                    {approveRequestMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Reject Request</DialogTitle>
                                        <DialogDescription>
                                          Please provide a reason for rejecting this request.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <form
                                        onSubmit={(e) => {
                                          e.preventDefault();
                                          const formData = new FormData(e.currentTarget);
                                          const notes = formData.get("notes") as string;
                                          rejectRequestMutation.mutate({
                                            requestId: request.id,
                                            adminNotes: notes,
                                          });
                                        }}
                                      >
                                        <Textarea
                                          name="notes"
                                          placeholder="Reason for rejection..."
                                          className="mb-4"
                                          required
                                        />
                                        <DialogFooter>
                                          <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={rejectRequestMutation.isPending}
                                          >
                                            {rejectRequestMutation.isPending ? (
                                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : null}
                                            Reject Request
                                          </Button>
                                        </DialogFooter>
                                      </form>
                                    </DialogContent>
                                  </Dialog>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No requests found.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants">
            <AdminRestaurantList />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <AdminUserManagement />
          </TabsContent>

          {/* Create Restaurant Tab */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Add New Restaurant</CardTitle>
                <CardDescription>
                  Create a restaurant directly without needing approval.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminRestaurantForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
