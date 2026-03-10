const LEGACY_ROLE_MAP = {
  max: "admin",
  supermax: "superdev",
  superAdmin: "superdev",
};

export const normalizeRole = (role, isSuperdev = false) => {
  if (isSuperdev === true) return "superdev";
  if (!role) return null;
  return LEGACY_ROLE_MAP[role] || role;
};

export const hasAccess = (userOrRole, allowedRoles = []) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;

  const isRoleObject = typeof userOrRole === "object" && userOrRole !== null;
  const rawRole = isRoleObject ? userOrRole.role : userOrRole;
  const superdevClaim = isRoleObject ? userOrRole.superdev === true : false;
  const role = normalizeRole(rawRole, superdevClaim);

  if (!role) return false;
  if (role === "superdev") return true;

  const normalizedAllowed = allowedRoles.map((item) => normalizeRole(item));
  return normalizedAllowed.includes(role);
};
