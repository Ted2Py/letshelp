/**
 * Facility Residents Management Page
 *
 * Allows facility administrators to add, view, and remove residents.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Trash2,
  Mail,
  ArrowLeft,
  Loader2,
  Search,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

export default function FacilityResidentsPage() {
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingResident, setAddingResident] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: "", type: "success" });
  const [newResident, setNewResident] = useState({
    name: "",
    email: "",
    preferredLanguage: "en",
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const loadResidents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/facility/residents");
      if (response.ok) {
        const data = await response.json();
        setResidents(data.residents || []);
      }
    } catch (error) {
      console.error("Failed to load residents:", error);
      showToast("Failed to load residents", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResidents();
  }, []);

  const handleAddResident = async () => {
    setAddingResident(true);
    try {
      const response = await fetch("/api/facility/residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newResident),
      });

      const data = await response.json();

      if (data.success) {
        showToast("Resident added successfully", "success");
        setShowAddDialog(false);
        setNewResident({ name: "", email: "", preferredLanguage: "en" });
        loadResidents();
      } else {
        showToast(data.error || "Failed to add resident", "error");
      }
    } catch (error) {
      showToast("Failed to add resident", "error");
    } finally {
      setAddingResident(false);
    }
  };

  const handleDeleteResident = async (id: string) => {
    if (!confirm("Are you sure you want to remove this resident?")) {
      return;
    }

    try {
      const response = await fetch(`/api/facility/residents?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        showToast("Resident removed", "success");
        loadResidents();
      } else {
        showToast(data.error || "Failed to remove resident", "error");
      }
    } catch (error) {
      showToast("Failed to remove resident", "error");
    }
  };

  const filteredResidents = residents.filter((r) =>
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg bg-white dark:bg-gray-800 border">
          {toast.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast({ show: false, message: "", type: "success" })}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/facility"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Manage Residents</h1>
          <div className="w-32" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search residents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {residents.length} resident{residents.length !== 1 ? "s" : ""}
              </div>
            </div>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resident
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Resident</DialogTitle>
                  <DialogDescription>
                    Enter the resident&apos;s information. They must have an account
                    first.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Name
                    </label>
                    <Input
                      value={newResident.name}
                      onChange={(e) =>
                        setNewResident({ ...newResident, name: e.target.value })
                      }
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={newResident.email}
                      onChange={(e) =>
                        setNewResident({ ...newResident, email: e.target.value })
                      }
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Preferred Language
                    </label>
                    <select
                      value={newResident.preferredLanguage}
                      onChange={(e) =>
                        setNewResident({
                          ...newResident,
                          preferredLanguage: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-md border bg-background"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddResident}
                    disabled={addingResident || !newResident.name || !newResident.email}
                  >
                    {addingResident ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Resident"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredResidents.length === 0 ? (
          <Card className="p-16 text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "No residents found" : "No residents yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Add residents to get started with LetsHelp"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Resident
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredResidents.map((resident) => (
              <Card key={resident.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {resident.name || "Unknown"}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {resident.email}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Language: {resident.preferredLanguage || "en"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined: {resident.createdAt
                        ? new Date(resident.createdAt).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteResident(resident.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
