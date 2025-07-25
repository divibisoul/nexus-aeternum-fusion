
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Key, Shield, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthPageProps {
  onAuthenticated: (apiKey: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setError('Por favor, insira uma API Key válida');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulação de validação de API Key
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Validação básica do formato da API Key
      if (apiKey.length < 32 || !apiKey.startsWith('aet_')) {
        throw new Error('Formato de API Key inválido');
      }

      // Armazenar no localStorage (em produção, usar Keystore seguro)
      localStorage.setItem('aeternum_api_key', apiKey);
      onAuthenticated(apiKey);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConnect();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="quantum-border bg-card/50 backdrop-blur-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary quantum-glow flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl quantum-text">
              Aeternum Interface
            </CardTitle>
            <CardDescription>
              Sistema de Autenticação ERU
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-sm font-medium flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Key / Token de Acesso
              </label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="aet_xxxxxxxxxxxxxxxxxx..."
                className="quantum-border bg-background/50"
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            <Button 
              onClick={handleConnect}
              disabled={isLoading || !apiKey.trim()}
              className="w-full"
              variant="quantum"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Validando...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Conectar
                </>
              )}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Não possui uma API Key?</p>
              <Button variant="link" size="sm" className="p-0 h-auto">
                Gerar Nova Chave
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
