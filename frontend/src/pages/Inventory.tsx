import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';

export default function Inventory() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/inventory');
      setInventory(res.data.data);
    } catch (error) {
      console.error('Failed to fetch inventory', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAdjustModal = (record: any) => {
    setSelectedRecord(record);
    setAdjustQuantity(0);
    setAdjustReason('');
    setIsModalOpen(true);
  };

  const handleAdjust = async () => {
    if (!selectedRecord) return;
    try {
      setIsAdjusting(true);
      await api.patch(`/inventory/${selectedRecord.id}`, {
        quantity_change: adjustQuantity,
        reason: adjustReason,
        idempotency_key: crypto.randomUUID(), // Prevent double submission
      });
      setIsModalOpen(false);
      fetchInventory();
    } catch (error) {
      console.error('Adjustment failed', error);
      alert('Failed to adjust stock. See console.');
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-text-primary">Inventory Management</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-surface shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-background">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Item</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Location</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">SKU</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Physical</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Reserved</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Available</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-4 text-center text-text-secondary">Loading...</td></tr>
              ) : inventory.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-4 text-center text-text-secondary">No inventory found</td></tr>
              ) : (
                inventory.map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{row.item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{row.location.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{row.item.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right">{row.physical_quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-warning text-right">{row.reserved_quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-success text-right font-bold">{row.available_quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {(user?.role === 'ADMIN' || user?.role === 'OPERATIONS') && (
                        <Button variant="outline" size="sm" onClick={() => openAdjustModal(row)}>
                          Adjust
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adjust Stock">
        {selectedRecord && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Item: {selectedRecord.item.name}</p>
              <p className="text-sm text-text-secondary">Location: {selectedRecord.location.name}</p>
              <p className="text-sm text-text-secondary">Current Physical: {selectedRecord.physical_quantity}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Quantity Change (+/-)
              </label>
              <Input 
                type="number" 
                value={adjustQuantity} 
                onChange={(e) => setAdjustQuantity(Number(e.target.value))} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Reason / Note
              </label>
              <Input 
                type="text" 
                value={adjustReason} 
                onChange={(e) => setAdjustReason(e.target.value)} 
                placeholder="E.g., damaged goods, stock count"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-border mt-6">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAdjust} isLoading={isAdjusting}>
                Confirm Adjustment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
