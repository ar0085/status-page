import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { UserRole } from "../../types";
import type { TeamMember, TeamMemberInvite } from "../../types";
import { useOrganization } from "../../hooks/useOrganization";

export default function TeamManagement() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState<TeamMemberInvite>({
    email: "",
    role: UserRole.MEMBER,
  });

  // Fetch team members
  const {
    data: teamData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => api.getTeamMembers(),
  });

  // Fetch current user profile
  const { data: currentUser } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api.getMyProfile(),
  });

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: (data: TeamMemberInvite) => api.inviteTeamMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setShowInviteForm(false);
      setInviteData({ email: "", role: UserRole.MEMBER });
    },
    onError: (error) => {
      console.error("Failed to invite member:", error);
    },
  });

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: number; role: UserRole }) =>
      api.updateTeamMember(memberId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: (error) => {
      console.error("Failed to update member role:", error);
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: number) => api.removeTeamMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: (error) => {
      console.error("Failed to remove member:", error);
    },
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate(inviteData);
  };

  const handleRoleChange = (memberId: number, newRole: UserRole) => {
    if (
      window.confirm(
        `Are you sure you want to change this member's role to ${newRole}?`
      )
    ) {
      updateRoleMutation.mutate({ memberId, role: newRole });
    }
  };

  const handleRemoveMember = (member: TeamMember) => {
    if (
      window.confirm(
        `Are you sure you want to remove ${member.email} from the organization?`
      )
    ) {
      removeMemberMutation.mutate(member.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleBadgeColor = (role: UserRole) => {
    return role === UserRole.ADMIN
      ? "bg-purple-100 text-purple-800"
      : "bg-blue-100 text-blue-800";
  };

  const isCurrentUserAdmin = currentUser?.role === UserRole.ADMIN;
  const isOnlyAdmin =
    teamData?.members.filter((m) => m.role === UserRole.ADMIN).length === 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Failed to load team members. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-2">
            Manage members and permissions for {organization?.name}
          </p>
        </div>
        {isCurrentUserAdmin && (
          <button
            onClick={() => setShowInviteForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Invite Member
          </button>
        )}
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Invite New Member</h2>
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={inviteData.email}
                onChange={(e) =>
                  setInviteData({ ...inviteData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="member@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={inviteData.role}
                onChange={(e) =>
                  setInviteData({
                    ...inviteData,
                    role: e.target.value as UserRole,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={UserRole.MEMBER}>Member</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={inviteMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {inviteMutation.isPending ? "Inviting..." : "Send Invite"}
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team Members List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Team Members ({teamData?.total_count || 0})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                {isCurrentUserAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamData?.members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {member.email}
                        {member.id === currentUser?.id && (
                          <span className="ml-2 text-xs text-gray-500">
                            (You)
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isCurrentUserAdmin && member.id !== currentUser?.id ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(
                            member.id,
                            e.target.value as UserRole
                          )
                        }
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                        disabled={updateRoleMutation.isPending}
                      >
                        <option value={UserRole.MEMBER}>Member</option>
                        <option value={UserRole.ADMIN}>Admin</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                          member.role
                        )}`}
                      >
                        {member.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.is_pending
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {member.is_pending ? "Pending" : "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(member.created_at)}
                  </td>
                  {isCurrentUserAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {member.id !== currentUser?.id && (
                        <button
                          onClick={() => handleRemoveMember(member)}
                          disabled={
                            removeMemberMutation.isPending ||
                            (member.role === UserRole.ADMIN && isOnlyAdmin)
                          }
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Remove
                        </button>
                      )}
                      {member.id === currentUser?.id &&
                        member.role === UserRole.ADMIN &&
                        isOnlyAdmin && (
                          <span className="text-gray-400 text-xs">
                            Last admin
                          </span>
                        )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Descriptions */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Role Permissions</h3>
        <div className="space-y-2">
          <div>
            <span className="font-medium text-purple-800">Admin:</span>
            <span className="text-gray-700 ml-2">
              Full access to all features, can manage team members, services,
              incidents, and maintenance
            </span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Member:</span>
            <span className="text-gray-700 ml-2">
              Can view and manage services, incidents, and maintenance but
              cannot manage team members
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
