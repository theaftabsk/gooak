export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string; // 'owner' | 'admin' | 'staff'
  status: 'Active' | 'Disabled' | 'Pending Invite';
  created_at: string;
  last_login?: string;
  phone?: string;
}

export interface AuditLog {
  id: string;
  time: string;
  user: string;
  action: string;
  ip: string;
  device: string;
  status: 'Success' | 'Failed';
}

export interface RolePermissionConfig {
  products: 'write' | 'read' | 'none';
  orders: 'write' | 'read' | 'none';
  payments: 'write' | 'read' | 'none';
  staff: 'write' | 'read' | 'none';
}
