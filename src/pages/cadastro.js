import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-lg shadow-lg p-8">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-white">
            Crie sua conta
          </h1>
        </div>

        <form className="space-y-4">
          {/* Nome Completo */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Nome Completo</label>
            <input
              type="text"
              placeholder="Digite seu nome"
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">E-mail</label>
            <input
              type="email"
              placeholder="seu-email@exemplo.com"
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Telefone</label>
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tipo de Perfil (Agora abaixo de Telefone) */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Tipo de Perfil
            </label>
            <select 
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
              defaultValue=""
            >
              <option value="" disabled>Selecione seu perfil</option>
              <option value="cliente">Cliente</option>
              <option value="tecnico">Técnico</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition py-2 rounded-md text-white font-medium mt-6 active:scale-[0.98]"
          >
            Cadastrar
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-6">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-blue-500 hover:underline font-semibold">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}