
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, User, Lock, AlertCircle } from 'lucide-react';

interface AuthPageProps {
  onAuthenticated: (userData: { username: string; password: string }) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // API Key integrada diretamente no código
  const INTEGRATED_API_KEY = 'AIzaSyBLo81cEdUiGte5SbcTnZ0SCGvGzMXGvJA';

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulação de autenticação com credenciais padrão
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Validação de credenciais (demo - em produção usar backend real)
      const validCredentials = [
        { username: 'admin', password: 'aeternum2024' },
        { username: 'usuario', password: 'eru123456' },
        { username: 'developer', password: 'quantum789' }
      ];

      const isValid = validCredentials.some(
        cred => cred.username === username && cred.password === password
      );

      if (!isValid) {
        throw new Error('Credenciais inválidas');
      }

      // Armazenar credenciais e API Key
      localStorage.setItem('aeternum_user', JSON.stringify({ 
        username, 
        apiKey: INTEGRATED_API_KEY,
        loginTime: new Date().toISOString()
      }));
      
      onAuthenticated({ username, password });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
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
              Aplicativo Interface Aeternum
            </CardTitle>
            <CardDescription>
              Sistema ERU • Acesso Autorizado
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Usuário
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite seu usuário"
                className="quantum-border bg-background/50"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua senha"
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
              onClick={handleLogin}
              disabled={isLoading || !username.trim() || !password.trim()}
              className="w-full"
              variant="quantum"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Autenticando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">Credenciais de Teste:</p>
              <div className="text-xs space-y-1">
                <p><strong>admin</strong> / aeternum2024</p>
                <p><strong>usuario</strong> / eru123456</p>
                <p><strong>developer</strong> / quantum789</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
