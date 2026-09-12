import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { CreateCustomerOrderModal } from '../components/orders/CreateCustomerOrderModal';
import { CustomerOrderDetailsModal } from '../components/orders/CustomerOrderDetailsModal';

export default function CustomerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/customer-orders');
      setOrders(res.data.data);
    } catch (error) {
      console.error('Failed to fetch customer orders', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDetailsModal = (id: string) => {
    setSelectedOrderId(id);
    setIsDetailsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="warning">PENDING</Badge>;
      case 'CONFIRMED': return <Badge variant="info">CONFIRMED</Badge>;
      case 'PROCESSING': return <Badge variant="warning">PROCESSING</Badge>;
      case 'SHIPPED': return <Badge variant="info">SHIPPED</Badge>;
      case 'DELIVERED': return <Badge variant="success">DELIVERED</Badge>;
      case 'CANCELLED': return <Badge variant="error">CANCELLED</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const canCreateOrder = user?.role === 'ADMIN' || user?.role === 'SALES' || user?.role === 'OPERATIONS';

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-text-primary">Customer Orders</h1>
          {canCreateOrder && (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              Create Order
            </Button>
          )}
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-surface shadow overflow-hidden sm:rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-background">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Order Reference</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Internal ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Created By</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-text-secondary">Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-text-secondary">No customer orders found</td></tr>
              ) : (
                orders.map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{row.customer_reference}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{row.id.split('-')[0]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{row.creator?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="outline" size="sm" onClick={() => openDetailsModal(row.id)}>
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <CreateCustomerOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchOrders}
      />

      <CustomerOrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        orderId={selectedOrderId}
        onUpdate={fetchOrders}
      />
    </div>
  );
}
