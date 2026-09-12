import { useState, useEffect } from 'react';
import { api } from '../../lib/axios';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface StockCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: any | null;
}

export function StockCheckModal({ isOpen, onClose, workOrder }: StockCheckModalProps) {
  const [stockInfo, setStockInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Create Transfer State
  const [isCreatingTransfer, setIsCreatingTransfer] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [sourceLocation, setSourceLocation] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && workOrder) {
      checkStock();
      setTransferSuccess(false);
      setTransferError('');
      setSourceLocation('');
    }
  }, [isOpen, workOrder]);

  const checkStock = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await api.get(`/work-orders/${workOrder.id}/stock-check`);
      setStockInfo(res.data.data);
      
      // If there's a shortage, fetch locations so we can show a transfer form
      if (res.data.data.shortage > 0) {
        const locRes = await api.get('/locations');
        // Filter out the destination location (the work order's location)
        setLocations(locRes.data.data.filter((l: any) => l.id !== workOrder.location_id));
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch stock information.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTransfer = async () => {
    if (!sourceLocation) {
      setTransferError('Please select a source location.');
      return;
    }
    
    try {
      setIsCreatingTransfer(true);
      setTransferError('');
      
      await api.post('/transfers', {
        item_id: workOrder.item_id,
        source_location_id: sourceLocation,
        destination_location_id: workOrder.location_id,
        quantity: stockInfo.shortage
      });
      
      setTransferSuccess(true);
      // Re-check stock after a short delay (or immediately, though transfer is only REQUESTED)
    } catch (err: any) {
      setTransferError(err.response?.data?.error?.message || 'Failed to request transfer.');
    } finally {
      setIsCreatingTransfer(false);
    }
  };

  if (!workOrder) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock Check">
      <div className="space-y-4">
        <div className="bg-surface border border-border p-4 rounded-md">
          <h3 className="font-medium text-text-primary mb-2">Work Order Details</h3>
          <p className="text-sm text-text-secondary">Order: {workOrder.id.split('-')[0]}</p>
          <p className="text-sm text-text-secondary">Item: {workOrder.item?.name}</p>
          <p className="text-sm text-text-secondary">Location: {workOrder.location?.name}</p>
        </div>

        {isLoading ? (
          <p className="text-sm text-text-secondary">Checking stock levels...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : stockInfo ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface p-3 rounded-md border border-border text-center">
                <p className="text-xs text-text-secondary uppercase">Required</p>
                <p className="text-xl font-bold text-text-primary">{stockInfo.requiredQuantity}</p>
              </div>
              <div className="bg-surface p-3 rounded-md border border-border text-center">
                <p className="text-xs text-text-secondary uppercase">Available</p>
                <p className="text-xl font-bold text-text-primary">{stockInfo.availableQuantity}</p>
              </div>
              <div className={`p-3 rounded-md border text-center ${stockInfo.shortage > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                <p className={`text-xs uppercase ${stockInfo.shortage > 0 ? 'text-red-500' : 'text-green-500'}`}>Shortage</p>
                <p className={`text-xl font-bold ${stockInfo.shortage > 0 ? 'text-red-500' : 'text-green-500'}`}>{stockInfo.shortage}</p>
              </div>
            </div>

            {stockInfo.shortage > 0 && !transferSuccess && (
              <div className="mt-6 pt-4 border-t border-border">
                <h4 className="font-medium text-text-primary mb-2 text-sm">Action Required: Stock Shortage</h4>
                <p className="text-sm text-text-secondary mb-4">
                  There is insufficient stock to complete this work order. You can request an internal transfer to fulfill the shortage.
                </p>
                
                {transferError && <p className="text-sm text-red-500 mb-2">{transferError}</p>}
                
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-text-secondary mb-1">Source Location</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={sourceLocation}
                      onChange={(e) => setSourceLocation(e.target.value)}
                    >
                      <option value="">Select a source...</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={handleCreateTransfer} 
                    isLoading={isCreatingTransfer}
                    disabled={!sourceLocation}
                  >
                    Request Transfer
                  </Button>
                </div>
              </div>
            )}

            {transferSuccess && (
              <div className="mt-6 pt-4 border-t border-border">
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                  <p className="text-sm text-green-500 font-medium">Transfer requested successfully!</p>
                  <p className="text-xs text-green-500/80 mt-1">
                    A request for {stockInfo.shortage} units has been submitted.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="pt-4 flex justify-end border-t border-border mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
