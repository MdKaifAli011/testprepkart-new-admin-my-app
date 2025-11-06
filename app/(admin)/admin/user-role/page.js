"use client";
import React, { useState, useEffect } from "react";
import MainLayout from "../../layouts/MainLayout";
import {
  FaUsers,
  FaShieldAlt,
  FaCheck,
  FaTimes,
  FaEdit,
  FaTrash,
  FaUserShield,
  FaUserEdit,
  FaUserCheck,
  FaEye,
  FaLock,
} from "react-icons/fa";
import api from "@/lib/api";

const UserRolePage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(true);

  // Define roles with color classes
  const roles = [
    { value: "admin", label: "Admin", icon: FaShieldAlt, colorClass: "text-red-600", bgClass: "bg-red-50" },
    {
      value: "super_moderator",
      label: "Super Moderator",
      icon: FaUserShield,
      colorClass: "text-purple-600",
      bgClass: "bg-purple-50",
    },
    {
      value: "moderator",
      label: "Moderator",
      icon: FaUserEdit,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-50",
    },
    { value: "editor", label: "Editor", icon: FaUserCheck, colorClass: "text-green-600", bgClass: "bg-green-50" },
    { value: "viewer", label: "Viewer", icon: FaEye, colorClass: "text-gray-600", bgClass: "bg-gray-50" },
  ];

  // Permission matrix
  const permissionMatrix = [
    {
      action: "GET (List/Detail)",
      description: "View and list resources",
      roles: ["admin", "super_moderator", "moderator", "editor", "viewer"],
    },
    {
      action: "POST (Create)",
      description: "Create new resources",
      roles: ["admin", "super_moderator", "moderator"],
    },
    {
      action: "PUT/PATCH (Update)",
      description: "Update and reorder resources",
      roles: ["admin", "super_moderator", "moderator", "editor"],
    },
    {
      action: "DELETE",
      description: "Delete resources",
      roles: ["admin", "super_moderator", "moderator"],
    },
    {
      action: "User/Role Management",
      description: "Manage users and roles",
      roles: ["admin"],
    },
  ];

  // Fetch users (mock data for now - replace with actual API call)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual API endpoint
        // const response = await api.get("/user");
        // setUsers(response.data.data || []);

        // Mock data for demonstration
        const mockUsers = [
          {
            _id: "1",
            name: "John Doe",
            email: "john@example.com",
            role: "admin",
            createdAt: new Date().toISOString(),
          },
          {
            _id: "2",
            name: "Jane Smith",
            email: "jane@example.com",
            role: "moderator",
            createdAt: new Date().toISOString(),
          },
          {
            _id: "3",
            name: "Bob Johnson",
            email: "bob@example.com",
            role: "editor",
            createdAt: new Date().toISOString(),
          },
          {
            _id: "4",
            name: "Alice Williams",
            email: "alice@example.com",
            role: "viewer",
            createdAt: new Date().toISOString(),
          },
        ];

        setUsers(mockUsers);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle role update
  const handleRoleUpdate = async (userId, newRole) => {
    try {
      // TODO: Replace with actual API call
      // await api.put(`/user/${userId}/role`, { role: newRole });

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      );

      setEditingUser(null);
      setSelectedRole("");
    } catch (err) {
      console.error("Error updating role:", err);
      setError("Failed to update user role");
    }
  };

  // Get role info
  const getRoleInfo = (roleValue) => {
    return roles.find((r) => r.value === roleValue) || roles[4]; // Default to viewer
  };

  // Check if action is allowed for role
  const hasPermission = (action, role) => {
    const matrixItem = permissionMatrix.find((m) => m.action === action);
    return matrixItem?.roles.includes(role) || false;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <FaUsers className="text-blue-600" />
                User Role Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage user roles and permissions
              </p>
            </div>
            <button
              onClick={() => setShowPermissionMatrix(!showPermissionMatrix)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              {showPermissionMatrix ? "Hide" : "Show"} Permission Matrix
            </button>
          </div>
        </div>

        {/* Permission Matrix */}
        {showPermissionMatrix && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaLock className="text-gray-600" />
                Permission Matrix
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Overview of permissions for each role
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                    {roles.map((role) => (
                      <th
                        key={role.value}
                        className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <role.icon
                            className={`${role.colorClass} text-base`}
                          />
                          <span className="text-[10px]">{role.label}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {permissionMatrix.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.action}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {item.description}
                        </div>
                      </td>
                      {roles.map((role) => {
                        const hasAccess = hasPermission(item.action, role.value);
                        return (
                          <td
                            key={role.value}
                            className="px-4 py-4 text-center"
                          >
                            {hasAccess ? (
                              <div className="flex justify-center">
                                <div className="p-1.5 bg-green-100 rounded-full">
                                  <FaCheck className="text-green-600 text-xs" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <div className="p-1.5 bg-gray-100 rounded-full">
                                  <FaTimes className="text-gray-400 text-xs" />
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FaUsers className="text-gray-600" />
              Users ({users.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage user roles and permissions
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-sm text-gray-600 mt-4">Loading users...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <FaUsers className="text-gray-400 text-4xl mx-auto mb-4" />
              <p className="text-sm text-gray-600">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => {
                    const roleInfo = getRoleInfo(user.role);
                    const RoleIcon = roleInfo.icon;
                    const isEditing = editingUser === user._id;

                    return (
                      <tr
                        key={user._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <select
                              value={selectedRole || user.role}
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex items-center gap-2">
                              <RoleIcon
                                className={`${roleInfo.colorClass} text-base`}
                              />
                              <span className="text-sm font-medium text-gray-900">
                                {roleInfo.label}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  handleRoleUpdate(user._id, selectedRole || user.role);
                                }}
                                className="p-2 bg-green-50 text-green-600 rounded-lg transition-colors hover:bg-green-100"
                                title="Save"
                              >
                                <FaCheck className="text-sm" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUser(null);
                                  setSelectedRole("");
                                }}
                                className="p-2 bg-gray-50 text-gray-600 rounded-lg transition-colors hover:bg-gray-100"
                                title="Cancel"
                              >
                                <FaTimes className="text-sm" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingUser(user._id);
                                setSelectedRole(user.role);
                              }}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg transition-colors hover:bg-blue-100"
                              title="Edit Role"
                            >
                              <FaEdit className="text-sm" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Role Descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => {
            const RoleIcon = role.icon;
            const permissions = permissionMatrix.filter((p) =>
              p.roles.includes(role.value)
            );

            return (
              <div
                key={role.value}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`p-2 ${role.bgClass} rounded-lg`}
                  >
                    <RoleIcon
                      className={`${role.colorClass} text-lg`}
                    />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {role.label}
                  </h3>
                </div>
                <div className="space-y-2">
                  {permissions.map((perm, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <FaCheck className="text-green-600 text-xs" />
                      <span>{perm.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};

export default UserRolePage;
