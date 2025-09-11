import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useElectricJokes } from '@/hooks/use-electric-jokes';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Smile, RefreshCw, Zap, ZapOff } from 'lucide-react';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { jokes, loading: jokesLoading, error: jokesError, connected, refresh } = useElectricJokes();
  const [generatingJoke, setGeneratingJoke] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
  };

  const generateJoke = async () => {
    setGeneratingJoke(true);
    setGenerateError(null);
    
    try {
      const response = await apiClient.generateJoke();
      if (response.success) {
        // The new joke will automatically appear via ElectricSQL sync
        console.log('Joke generated:', response.joke);
      }
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'Failed to generate joke');
    } finally {
      setGeneratingJoke(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Froemic Workspace</h1>
            <p className="text-muted-foreground">Welcome back, {user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm">
              {connected ? (
                <>
                  <Zap className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">Live sync</span>
                </>
              ) : (
                <>
                  <ZapOff className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">Disconnected</span>
                </>
              )}
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Joke Generator Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smile className="h-5 w-5" />
                Joke Generator
              </CardTitle>
              <CardDescription>
                Click the button below to generate a random joke using our Mastra workflow!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generateError && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md mb-4">
                  {generateError}
                </div>
              )}
              
              <Button 
                onClick={generateJoke}
                disabled={generatingJoke}
                size="lg"
              >
                {generatingJoke ? 'Generating...' : 'Tell me a joke!'}
              </Button>
            </CardContent>
          </Card>

          {/* Jokes List with Real-time Sync */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Your Jokes
                    {connected && <Zap className="h-4 w-4 text-green-500" />}
                  </CardTitle>
                  <CardDescription>
                    Live-synced jokes via ElectricSQL - new jokes appear automatically!
                  </CardDescription>
                </div>
                <Button
                  onClick={refresh}
                  variant="outline"
                  size="sm"
                  disabled={jokesLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${jokesLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {jokesError && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md mb-4">
                  Electric sync error: {jokesError}
                </div>
              )}

              {jokesLoading && jokes.length === 0 ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading your jokes...</p>
                </div>
              ) : jokes.length > 0 ? (
                <div className="space-y-4">
                  {jokes.map((joke) => (
                    <div 
                      key={joke.id}
                      className="p-4 bg-muted/50 rounded-lg border transition-all hover:bg-muted/70"
                    >
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(joke.created_at).toLocaleString()}
                      </p>
                      <p className="text-foreground">{joke.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Smile className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">No jokes yet!</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Tell me a joke!" above to generate your first joke.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}