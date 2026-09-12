import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-text-primary">Mini CRP</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-text-secondary">
              Logged in as {user?.name} ({user?.role})
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-border rounded-lg h-96 flex items-center justify-center">
            <h2 className="text-2xl text-text-secondary">Dashboard Content Placeholder</h2>
          </div>
        </div>
      </main>
    </div>
  );
}
