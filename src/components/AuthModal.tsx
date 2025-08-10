'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface User {
  id: string;
  nickname: string;
  email?: string;
  balance: number;
  role: string;
  isAdmin: boolean;
  theme: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [loginData, setLoginData] = useState({ nickname: '', password: '' });
  const [registerData, setRegisterData] = useState({ nickname: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Вход выполнен успешно!');
        onAuthSuccess(data.user);
        setTimeout(() => {
          onClose();
          setLoginData({ nickname: '', password: '' });
        }, 1000);
      } else {
        setError(data.error || 'Ошибка входа');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: registerData.nickname,
          email: registerData.email,
          password: registerData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Регистрация успешна!');
        onAuthSuccess(data.user);
        setTimeout(() => {
          onClose();
          setRegisterData({ nickname: '', email: '', password: '', confirmPassword: '' });
        }, 1000);
      } else {
        setError(data.error || 'Ошибка регистрации');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-center">Клуб молосольных огурчиков🥒</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Никнейм"
                    value={loginData.nickname}
                    onChange={(e) => setLoginData({ ...loginData, nickname: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Пароль"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Вход...' : 'Войти'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Никнейм"
                    value={registerData.nickname}
                    onChange={(e) => setRegisterData({ ...registerData, nickname: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Email (необязательно)"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Пароль"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Подтвердите пароль"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <Button variant="outline" className="w-full mt-4" onClick={onClose}>
            Отмена
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}