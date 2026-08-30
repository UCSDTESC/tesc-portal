import supabase from "@server/supabase";

export type AdminUserRow = {
  uuid: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  major: string | null;
  expected_grad: string | null;
  points: number;
  created_at: string;
  roles_summary: string;
  total_count: number;
};

export type AdminUserOrgRole = {
  user_org_role_uuid: string;
  org_uuid: number;
  org_name: string;
  role_id: number;
  role_name: string;
};

export type AdminUserDetail = {
  uuid: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  major: string | null;
  expected_grad: string | null;
  points: number;
  resume_link: string | null;
  resume_storage_path: string | null;
  resume_visible: boolean;
  created_at: string;
  roles: AdminUserOrgRole[];
  attended_count: number;
  rsvp_count: number;
};

export type RoleOption = {
  id: number;
  name: string;
};

export type OrgOption = {
  uuid: number;
  name: string;
};

export async function listUsersAdmin(search: string, page: number, pageSize: number) {
  const { data, error } = await supabase.rpc("admin_list_users", {
    p_search: search,
    p_limit: pageSize,
    p_offset: page * pageSize,
  });
  return { users: (data ?? []) as AdminUserRow[], error };
}

export async function listAllUsersAdmin(search = "") {
  const pageSize = 100;
  let page = 0;
  let all: AdminUserRow[] = [];
  let total = 0;

  while (true) {
    const { users, error } = await listUsersAdmin(search, page, pageSize);
    if (error) return { users: null, error };
    if (!users.length) break;
    total = users[0]?.total_count ?? users.length;
    all = all.concat(users);
    if (all.length >= total) break;
    page += 1;
  }

  return { users: all, error: null };
}

export async function getUserAdminDetail(userId: string) {
  const { data, error } = await supabase.rpc("admin_get_user", {
    p_user_uuid: userId,
  });
  return { user: (data ?? null) as AdminUserDetail | null, error };
}

export async function setUserOrgRole(userId: string, orgId: number, roleId: number) {
  const { error } = await supabase.rpc("admin_upsert_user_org_role", {
    p_user_uuid: userId,
    p_org_uuid: orgId,
    p_role_id: roleId,
  });
  return { error };
}

export async function removeUserOrgRole(userId: string, orgId: number) {
  const { error } = await supabase.rpc("admin_remove_user_org_role", {
    p_user_uuid: userId,
    p_org_uuid: orgId,
  });
  return { error };
}

export async function fetchRoleOptions() {
  const { data, error } = await supabase.from("roles").select("id, name").order("id");
  const roles = (data ?? []).map((row) => ({
    id: Number(row.id),
    name: String(row.name).trim(),
  }));
  return { roles, error };
}

export async function fetchOrgOptions() {
  const { data, error } = await supabase.from("orgs").select("uuid, name").order("name");
  const orgs = (data ?? []).map((row) => ({
    uuid: Number(row.uuid),
    name: String(row.name),
  }));
  return { orgs, error };
}
