/**
 * Users Management Tab
 * View, create, edit, and manage users
 */

import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Users,
  Shield,
  Truck,
  User,
  RefreshCw,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { usersApi } from "@/lib/api";
import type { User as UserType, UserRole } from "@shared/api";
import { cn } from "@/lib/utils";

interface AdminTabProps {
  onNavigate?: (tab: string, id?: string) => void;
}

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
  customer: { label: "Customer", icon: User, color: "bg-blue-100 text-blue-700" },
  admin: { label: "Admin", icon: Shield, color: "bg-purple-100 text-purple-700" },
  staff: { label: "Staff", icon: Users, color: "bg-green-100 text-green-700" },
  delivery: { label: "Driver", icon: Truck, color: "bg-orange-100 text-orange-700" },
};

export function UsersTab({ onNavigate }: AdminTabProps) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    customers: number;
    admins: number;
    staff: number;
    delivery: number;
    active: number;
    verified: number;
    newThisMonth: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editModal, setEditModal] = useState<UserType | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const params: { role?: string } = {};
    if (roleFilter !== "all") params.role = roleFilter;

    const [usersRes, statsRes] = await Promise.all([
      usersApi.getAll(params),
      usersApi.getStats(),
    ]);

    if (usersRes.success && usersRes.data) setUsers(usersRes.data);
    if (statsRes.success && statsRes.data) setStats(statsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [roleFilter]);

  const handleToggleActive = async (user: UserType) => {
    setUpdating(user.id);
    await usersApi.toggleActive(user.id, !user.isActive);
    await fetchData();
    setUpdating(null);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setUpdating(userId);
    await usersApi.delete(userId);
    await fetchData();
    setUpdating(null);
  };

  const handleCreateUser = async (userData: {
    email: string;
    mobile: string;
    password: string;
    firstName: string;
    familyName: string;
    emirate: string;
    role: string;
  }) => {
    const response = await usersApi.create(userData);
    if (response.success) {
      await fetchData();
      setCreateModal(false);
    }
  };

  const handleUpdateUser = async (userId: string, userData: Partial<UserType>) => {
    const response = await usersApi.update(userId, userData);
    if (response.success) {
      await fetchData();
      setEditModal(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(query) ||
      user.familyName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.mobile.includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Users Management</h3>
          <p className="text-sm text-slate-500">
            {stats?.total || 0} total users • {stats?.active || 0} active
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(ROLE_CONFIG).map(([role, config]) => {
            const count = stats[role as keyof typeof stats] || 0;
            const Icon = config.icon;
            return (
              <div key={role} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{config.label}s</p>
                    <p className="text-2xl font-bold text-slate-900">{count}</p>
                  </div>
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setRoleFilter("all")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                roleFilter === "all"
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              All
            </button>
            {Object.entries(ROLE_CONFIG).map(([role, config]) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role as UserRole)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  roleFilter === role
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {config.label}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Emirate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((user) => {
                  const roleConfig = ROLE_CONFIG[user.role];
                  const RoleIcon = roleConfig.icon;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-slate-600">
                              {user.firstName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {user.firstName} {user.familyName}
                            </p>
                            <p className="text-xs text-slate-500">{user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-900">{user.email}</p>
                        <p className="text-xs text-slate-500">{user.mobile}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                          roleConfig.color
                        )}>
                          <RoleIcon className="w-3 h-3" />
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {user.emirate}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium w-fit",
                            user.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          )}>
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                          {user.isVerified && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium w-fit">
                              Verified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditModal(user)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            disabled={updating === user.id}
                            className={cn(
                              "p-2 rounded-lg",
                              user.isActive
                                ? "text-slate-500 hover:text-orange-600 hover:bg-orange-50"
                                : "text-slate-500 hover:text-green-600 hover:bg-green-50"
                            )}
                            title={user.isActive ? "Deactivate" : "Activate"}
                          >
                            {user.isActive ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={updating === user.id}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {createModal && (
        <UserFormModal
          onClose={() => setCreateModal(false)}
          onSave={handleCreateUser}
        />
      )}

      {/* Edit User Modal */}
      {editModal && (
        <UserFormModal
          user={editModal}
          onClose={() => setEditModal(null)}
          onSave={(data) => handleUpdateUser(editModal.id, data)}
        />
      )}
    </div>
  );
}

function UserFormModal({
  user,
  onClose,
  onSave,
}: {
  user?: UserType;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    familyName: user?.familyName || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    emirate: user?.emirate || "Dubai",
    role: user?.role || "customer",
    password: "",
    isActive: user?.isActive ?? true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const data = user
      ? {
          firstName: formData.firstName,
          familyName: formData.familyName,
          email: formData.email,
          mobile: formData.mobile,
          emirate: formData.emirate,
          role: formData.role,
          isActive: formData.isActive,
        }
      : formData;

    await onSave(data);
    setSubmitting(false);
  };

  const emirates = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Fujairah", "Ras Al Khaimah", "Umm Al Quwain"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {user ? "Edit User" : "Create User"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Family Name *
              </label>
              <input
                type="text"
                value={formData.familyName}
                onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mobile *
            </label>
            <input
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              required
              placeholder="+971501234567"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Emirate *
              </label>
              <select
                value={formData.emirate}
                onChange={(e) => setFormData({ ...formData, emirate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                {emirates.map((emirate) => (
                  <option key={emirate} value={emirate}>
                    {emirate}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                  <option key={role} value={role}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                Account is active
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-slate-300 rounded-lg font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "Saving..." : user ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
