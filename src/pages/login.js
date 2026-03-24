"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../public/lib/supabase'; // Ajuste o caminho conforme seu projeto

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [perfil, setPerfil] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Autenticação básica (E-mail e Senha)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Verificar se o Tipo de Perfil selecionado condiz com o banco de dados
      const { data: profileData, error: profileError } = await supabase
        .from('perfis')
        .select('tipo_perfil')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      if (profileData.tipo_perfil !== perfil) {
        // Se o perfil estiver errado, desloga o usuário por segurança
        await supabase.auth.signOut();
        alert(`Acesso negado. Esta conta não está registrada como ${perfil}.`);
        setLoading(false);
        return;
      }

      // Se tudo estiver OK, redireciona para a tela do Flux
      router.push('/telaprincipal');
      
    } catch (error) {
      alert('Erro ao entrar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-lg shadow-lg p-8">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-white">
            Faça login na sua conta
          </h1>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          {/* Email */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Seu e-mail</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu-email@exemplo.com"
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Senha</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tipo de Perfil */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Tipo de Perfil
            </label>
            <select 
              required
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="" disabled>Selecione seu perfil</option>
              <option value="cliente">Cliente</option>
              <option value="tecnico">Técnico</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
              <input type="checkbox" className="accent-blue-600" />
              Lembre de mim
            </label>
            <a href="#" className="text-blue-500 hover:underline">Esquecer senha?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 transition py-2 rounded-md text-white font-medium active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-6">
          Não tem uma conta?{" "}
          <Link href="/cadastro" className="text-blue-500 hover:underline font-semibold">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}