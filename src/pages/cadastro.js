import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router'; // Ajustado para a pasta pages
import { supabase } from '../../public/lib/supabase'; // Caminho correto: volta uma pasta e entra em lib

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    perfil: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // PASSO A: Criar o usuário no Auth do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
      });

      if (authError) throw authError;

      // PASSO B: Salvar os dados complementares na tabela 'perfis'
      if (authData?.user) {
        const { error: dbError } = await supabase
          .from('perfis')
          .insert([
            {
              id: authData.user.id, // Vincula o ID da autenticação ao perfil
              nome_completo: formData.nome,
              email: formData.email,
              telefone: formData.telefone,
              tipo_perfil: formData.perfil, // Salva se é 'cliente', 'tecnico' ou 'admin'
            },
          ]);

        if (dbError) throw dbError;

        alert('Cadastro realizado com sucesso! Agora faça login.');
        router.push('/login'); // Redireciona para o login para validar o perfil
      }
    } catch (error) {
      alert('Erro no cadastro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans">
      <div className="w-full max-w-md bg-slate-800 rounded-lg shadow-lg p-8 border border-slate-700">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-white">Crie sua conta TechNic</h1>
          <p className="text-gray-400 text-sm mt-1">Preencha os dados abaixo</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Nome Completo</label>
            <input
              required
              name="nome"
              type="text"
              onChange={handleChange}
              placeholder="Digite seu nome"
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">E-mail</label>
            <input
              required
              name="email"
              type="email"
              onChange={handleChange}
              placeholder="seu-email@exemplo.com"
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Senha</label>
            <input
              required
              name="senha"
              type="password"
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Telefone</label>
            <input
              required
              name="telefone"
              type="tel"
              onChange={handleChange}
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Tipo de Perfil</label>
            <select 
              required
              name="perfil"
              onChange={handleChange}
              defaultValue=""
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
            className="w-full bg-blue-600 hover:bg-blue-700 transition py-2 rounded-md text-white font-medium mt-6 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Criando conta...' : 'Finalizar Cadastro'}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-6">
          Já tem uma conta? <Link href="/login" className="text-blue-500 hover:underline">Faça login</Link>
        </p>
      </div>
    </div>
  );
}