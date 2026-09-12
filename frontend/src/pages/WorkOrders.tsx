import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';

export default function WorkOrders() {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state for changing status
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

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

  const openStatusModal = (record: any) => {
    setSelectedRecord(record);
    setNewStatus(record.status);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedRecord || !newStatus) return;
    try {
      setIsUpdating(true);
      await api.patch(`/work-orders/${selectedRecord.id}/status`, {
        status: newStatus,
        idempotency_key: crypto.randomUUID(),
      });
      setIsModalOpen(false);
      fetchWorkOrders();
    } catch (error) {
      console.error('Update failed', error);
      alert('Failed to update status. See console.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLANNED': return <Badge variant="info">PLANNED</Badge>;
      case 'IN_PROGRESS': return <Badge variant="warning">IN_PROGRESS</Badge>;
      case 'COMPLETED': return <Badge variant="success">COMPLETED</Badge>;
      case 'CANCELLED': return <Badge variant="error">CANCELLED</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-text-primary">Work Orders</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-surface shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-background">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Order Number</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Item</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Location</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Quantity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-text-secondary">Loading...</td></tr>
              ) : workOrders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-text-secondary">No work orders found</td></tr>
              ) : (
                workOrders.map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{row.order_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{row.item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{row.location.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right">{row.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(row.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {(user?.role === 'ADMIN' || user?.role === 'OPERATIONS') && (
                        <Button variant="outline" size="sm" onClick={() => openStatusModal(row)}>
                          Update
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Update Work Order Status">
        {selectedRecord && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Order: {selectedRecord.order_number}</p>
              <p className="text-sm text-text-secondary">Item: {selectedRecord.item.name}</p>
              <p className="text-sm text-text-secondary">Quantity: {selectedRecord.quantity}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                New Status
              </label>
              <select 
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={newStatus} 
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="PLANNED">PLANNED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-border mt-6">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleUpdateStatus} isLoading={isUpdating}>
                Update
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
