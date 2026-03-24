"use client"; // Necessário para usar o roteador no Next.js (App Router)

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  // Função para lidar com o envio do formulário
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simulação de login: redireciona para a tela do Flux
    // Certifique-se de que a pasta 'flux' existe em /app
    router.push('/flux');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-lg shadow-lg p-8">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-white">
            Faça login na sua conta
          </h1>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Campo de E-mail */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Seu e-mail</label>
            <input
              required
              type="email"
              placeholder="seu-email@exemplo.com"
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Campo de Senha */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Senha</label>
            <input
              required
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Seleção de Perfil */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Tipo de Perfil
            </label>
            <select 
              required
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              defaultValue=""
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
            className="w-full bg-blue-600 hover:bg-blue-700 transition py-2 rounded-md text-white font-medium active:scale-[0.98]"
          >
            Entrar
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