import supabase from "@server/supabase";
import { isOrgLeaderAssignableRole } from "@lib/roles";

export type OrgMemberRow = {
  uuid: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  major: string | null;
  expected_grad: string | null;
  points: number;
  role_id: number;
  role_name: string;
  total_count: number;
};

export type OrgRoleOption = {
  id: number;
  name: string;
};

export async function listOrgMembers(
  orgId: number,
  search: string,
  page: number,
  pageSize: number,
) {
  const { data, error } = await supabase.rpc("org_leader_list_members", {
    p_org_uuid: orgId,
    p_search: search,
    p_limit: pageSize,
    p_offset: page * pageSize,
  });
  return { members: (data ?? []) as OrgMemberRow[], error };
}

export async function assignOrgRoleByEmail(orgId: number, email: string, roleId: number) {
  const { error } = await supabase.rpc("org_leader_assign_role_by_email", {
    p_org_uuid: orgId,
    p_email: email.trim(),
    p_role_id: roleId,
  });
  return { error };
}

export async function removeOrgMemberByEmail(orgId: number, email: string) {
  const { error } = await supabase.rpc("org_leader_remove_member_by_email", {
    p_org_uuid: orgId,
    p_email: email.trim(),
  });
  return { error };
}

export async function fetchOrgLeaderRoleOptions() {
  const { data, error } = await supabase.from("roles").select("id, name").order("id");
  const roles = (data ?? [])
    .map((row) => ({
      id: Number(row.id),
      name: String(row.name).trim(),
    }))
    .filter((row) => isOrgLeaderAssignableRole(row.name));
  return { roles, error };
}
