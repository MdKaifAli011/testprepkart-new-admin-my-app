"use client";
import React from "react";
import { FaLock } from "react-icons/fa";
import {
  usePermissions,
  getPermissionMessage,
} from "../../hooks/usePermissions";

/**
 * Permission-based button component
 * Disables button if user doesn't have permission
 */
export const PermissionButton = ({
  action,
  onClick,
  children,
  className = "",
  disabled = false,
  title = "",
  ...props
}) => {
  const { canCreate, canEdit, canDelete, canReorder, role } = usePermissions();

  const hasPermission = () => {
    switch (action) {
      case "create":
        return canCreate;
      case "edit":
        return canEdit;
      case "delete":
        return canDelete;
      case "reorder":
      case "toggle":
        return canReorder;
      default:
        return true;
    }
  };

  const permission = hasPermission();
  const permissionMessage = getPermissionMessage(action, role);
  const isDisabled = disabled || !permission;

  if (!permission) {
    return (
      <button
        disabled
        title={title || permissionMessage}
        className={`${className} bg-gray-100 text-gray-400 cursor-not-allowed flex items-center gap-2`}
        {...props}
      >
        <FaLock className="text-sm" />
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={className}
      title={title}
      {...props}
    >
      {children}
    </button>
  );
};

