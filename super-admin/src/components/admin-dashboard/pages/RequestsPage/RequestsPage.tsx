import React from 'react';
import { Icons } from '../../icons';
import { Badge, EmptyState, LoadingSpinner } from '../../shared';
import { storeDomainLabel } from '../../utils';

interface RequestsPageProps {
  requests: any[];
  loading: boolean;
  approvingId: string | null;
  rejectingId: string | null;
  deletingId: string | null;
  onRefresh: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}

export const RequestsPage: React.FC<RequestsPageProps> = ({
  requests, loading, approvingId, rejectingId, deletingId,
  onRefresh, onApprove, onReject, onDelete
}) => {
  const pending = requests.filter(r => r.status === 'pending').length;
  const approved = requests.filter(r => r.status === 'approved').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;

  return (
    <>
      <header className="page-header">
        <div>
          <h2>Signup Requests</h2>
          <p className="header-sub">{pending} pending · {approved} approved · {rejected} rejected</p>
        </div>
        <button className="btn-ghost-sm" onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icons.Refresh /> Refresh
        </button>
      </header>

      {loading ? <LoadingSpinner message="Loading requests…" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {requests.length === 0 && <EmptyState message="No signup requests yet." />}
          {requests.map(req => (
            <div key={req.id} className={`request-card status-${req.status}`}>
              <div className="req-main">
                <div className="store-avatar req">{req.name[0]}</div>
                <div className="req-info">
                  <h4>{req.name}</h4>
                  <div className="req-meta">
                    <span><Icons.User /> {req.owner_name}</span>
                    <span><Icons.Mail /> {req.owner_email}</span>
                    {req.phone && <span><Icons.Phone /> {req.phone}</span>}
                    {req.category && <span><Icons.Tag /> {req.category}</span>}
                    <span className="muted"><Icons.Globe /> {storeDomainLabel(req.slug)}</span>
                    <span className="muted"><Icons.Calendar /> {new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="req-actions">
                <Badge type={req.status === 'pending' ? 'warn' : req.status === 'approved' ? 'success' : 'danger'}>
                  {req.status.toUpperCase()}
                </Badge>
                {req.status === 'pending' && (
                  <>
                    <button className="btn-sm-green" onClick={() => onApprove(req.id)} disabled={approvingId === req.id}>
                      {approvingId === req.id ? '…' : <><Icons.Check /> Approve &amp; Provision</>}
                    </button>
                    <button className="btn-sm-orange" onClick={() => onReject(req.id, req.name)} disabled={rejectingId === req.id}>
                      {rejectingId === req.id ? '…' : <><Icons.X /> Reject</>}
                    </button>
                  </>
                )}
                <button
                  className="btn-danger-sm icon-only"
                  onClick={() => onDelete(req.id, req.name)}
                  disabled={deletingId === req.id}
                  title="Delete request"
                >
                  {deletingId === req.id ? '…' : <Icons.Trash />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
