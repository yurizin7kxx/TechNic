import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router'; // Ajustado para a pasta pages
import { supabase } from '../../public/lib/supabase'; // Caminho correto para src/lib/supabase

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
      // 1. Autenticação básica
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Busca o perfil real gravado no banco de dados
      const { data: profileData, error: profileError } = await supabase
        .from('perfis')
        .select('tipo_perfil')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      // 3. Valida se o que o usuário selecionou no "select" bate com o banco
      if (profileData.tipo_perfil !== perfil) {
        await supabase.auth.signOut();
        alert(`Acesso negado. Sua conta é de ${profileData.tipo_perfil}, não de ${perfil}.`);
        setLoading(false);
        return;
      }

      // 4. REDIRECIONAMENTO POR PERMISSÃO
      if (profileData.tipo_perfil === 'admin' || profileData.tipo_perfil === 'tecnico') {
        // Se for técnico ou admin, vai para a tela principal de gestão
        router.push('/telaadm'); 
      } else {
        // Se for cliente, vai para a tela de acompanhamento simples
        router.push('/cliente'); 
      }
      
    } catch (error) {
      alert('Erro ao entrar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-lg shadow-lg p-8 border border-slate-700">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-white">TechNic Login</h1>
          <p className="text-gray-400 text-sm mt-2">Entre com suas credenciais</p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Seu e-mail</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu-email@exemplo.com"
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Senha</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Tipo de Perfil</label>
            <select 
              required
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white cursor-pointer"
            >
              <option value="" disabled>Selecione seu perfil</option>
              <option value="cliente">Cliente</option>
              <option value="tecnico">Técnico</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 transition py-2 rounded-md text-white font-medium active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Validando...' : 'Entrar'}
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