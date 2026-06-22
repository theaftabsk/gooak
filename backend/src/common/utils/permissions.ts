export const ALL_PERMISSIONS = [
  {
    key: 'VIEW_SHOPS',
    label: 'View Stores',
    description: 'Can view the list of stores and active storefronts',
  },
  {
    key: 'VIEW_STATS',
    label: 'View Statistics',
    description: 'Can view dashboard metrics and overview stats',
  },
  {
    key: 'VIEW_REQUESTS',
    label: 'View Signup Requests',
    description: 'Can view incoming tenant signup requests',
  },
  {
    key: 'ONBOARD_SHOP',
    label: 'Provision Stores',
    description: 'Can create and provision new storefronts',
  },
  {
    key: 'MANAGE_REQUESTS',
    label: 'Manage Signups',
    description: 'Can approve, reject, or delete tenant requests',
  },
  {
    key: 'SEED_DEMO',
    label: 'Seed Demo Data',
    description: 'Can seed standard products and banners into stores',
  },
  {
    key: 'DELETE_SHOP',
    label: 'Delete Stores',
    description: 'Can permanently remove storefronts and all database items',
  },
  {
    key: 'MANAGE_TEAM',
    label: 'Manage Platform Team',
    description: 'Can add, edit permissions, or delete other administrators',
  },
];

export function hasPermission(
  admin: { permissions?: string[] },
  permission: string,
): boolean {
  return !!(admin.permissions && admin.permissions.includes(permission));
}
