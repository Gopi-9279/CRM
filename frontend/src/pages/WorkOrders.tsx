import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { CreateWorkOrderModal } from '../components/work-orders/CreateWorkOrderModal';
import { StockCheckModal } from '../components/work-orders/StockCheckModal';

export default function WorkOrders() {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStockCheckOpen, setIsStockCheckOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Status update state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/work-orders');
      setWorkOrders(res.data.data);
    } catch (error) {
      console.error('Failed to fetch work orders', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openStockCheck = (record: any) => {
    setSelectedRecord(record);
    setIsStockCheckOpen(true);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      await api.patch(`/work-orders/${id}/status`, {
        status: newStatus,
        idempotency_key: crypto.randomUUID(),
      });
      fetchWorkOrders();
    } catch (error: any) {
      console.error('Update failed', error);
      alert(error.response?.data?.error?.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLANNED': return <Badge variant="info">PLANNED</Badge>;
      case 'IN_PROGRESS': return <Badge variant="warning">IN_PROGRESS</Badge>;
      case 'COMPLETED': return <Badge variant="success">COMPLETED</Badge>;
      case 'CANCELLED': return <Badge variant="error">CANCELLED</Badge>;
      case 'ASSIGNED': return <Badge variant="info">ASSIGNED</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const renderActionButtons = (row: any) => {
    const isAssignee = user?.id === row.assigned_user_id;
    const canUpdate = user?.role === 'ADMIN' || (user?.role === 'OPERATIONS' && isAssignee);
    const isUpdating = updatingId === row.id;

    return (
      <div className="flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => openStockCheck(row)}>
          Stock Check
        </Button>

        {canUpdate && row.status === 'ASSIGNED' && (
          <Button 
            variant="primary" 
            size="sm" 
            isLoading={isUpdating}
            onClick={() => updateStatus(row.id, 'IN_PROGRESS')}
          >
            Start Work
          </Button>
        )}

        {canUpdate && row.status === 'IN_PROGRESS' && (
          <Button 
            variant="primary" 
            size="sm" 
            isLoading={isUpdating}
            onClick={() => updateStatus(row.id, 'COMPLETED')}
          >
            Complete
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-text-primary">Work Orders</h1>
          {user?.role === 'ADMIN' && (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              Create Work Order
            </Button>
          )}
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-surface shadow overflow-hidden sm:rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-background">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Item</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Location</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Assigned To</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Quantity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-4 text-center text-text-secondary">Loading...</td></tr>
              ) : workOrders.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-4 text-center text-text-secondary">No work orders found</td></tr>
              ) : (
                workOrders.map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{row.id.split('-')[0]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{row.item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{row.location.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{row.assigned_user?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right">{row.required_quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(row.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {renderActionButtons(row)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <CreateWorkOrderModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={fetchWorkOrders}
      />

      <StockCheckModal
        isOpen={isStockCheckOpen}
        onClose={() => setIsStockCheckOpen(false)}
        workOrder={selectedRecord}
      />
    </div>
  );
}
