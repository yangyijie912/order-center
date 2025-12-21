export type Role = 'admin' | 'operator' | 'viewer';

export type Action = 'delete' | 'refund' | 'ship';

export const rolePolicies: Record<Action, Role[]> = {
  delete: ['admin'],
  refund: ['admin'],
  ship: ['admin', 'operator'],
};

export function roleAllows(action: Action, role: Role) {
  return rolePolicies[action]?.includes(role);
}

const authRoles = { rolePolicies, roleAllows };

export default authRoles;
