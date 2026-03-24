"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../public/lib/supabase'; // Ajuste o caminho conforme sua pasta lib

export default function RegisterPage() {
  const router = useRouter();
  
  // 1. Estado para capturar todos os inputs
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    perfil: ''
  });

  const [loading, setLoading] = useState(false);

  // 2. Função para atualizar os dados conforme o usuário digita
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 3. Função principal de envio
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // PASSO A: Criar o usuário no sistema de Autenticação
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
      });

      if (authError) throw authError;

      // PASSO B: Se o usuário foi criado, salvar os dados extras na tabela 'perfis'
      if (authData?.user) {
        const { error: dbError } = await supabase
          .from('perfis') // Nome da sua tabela no banco
          .insert([
            {
              id: authData.user.id, // Relaciona com o ID do Auth
              nome_completo: formData.nome,
              email: formData.email,
              telefone: formData.telefone,
              tipo_perfil: formData.perfil,
            },
          ]);

        if (dbError) throw dbError;

        alert('Cadastro realizado com sucesso!');
        router.push('/telaprincipal'); // Redireciona para o login
      }
    } catch (error) {
      alert('Erro no processo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-lg shadow-lg p-8">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-white">Crie sua conta</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Nome Completo</label>
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
            <label className="block text-sm text-gray-300 mb-2">E-mail</label>
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
            <label className="block text-sm text-gray-300 mb-2">Senha</label>
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
            <label className="block text-sm text-gray-300 mb-2">Telefone</label>
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
            <label className="block text-sm text-gray-300 mb-2">Tipo de Perfil</label>
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
            {loading ? 'Processando...' : 'Finalizar Cadastro'}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-6">
          Já tem uma conta? <Link href="/login" className="text-blue-500 hover:underline">Faça login</Link>
        </p>
      </div>
    </div>
  );
}