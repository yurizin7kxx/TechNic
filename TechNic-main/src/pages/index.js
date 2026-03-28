export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md bg-slate-800 rounded-lg shadow-lg p-8">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-white">
            Faça login na sua conta
              </h1>
        </div>

        <form className="space-y-5">
          
          {/* Email */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Seu e-mail
            </label>
            <input
              type="email"
              placeholder="haroldo15555555@gmail.com"
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Senha
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />+
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-300">
              <input type="checkbox" className="accent-blue-600" />
              Lembre de mim
            </label>

            <a href="#" className="text-blue-500 hover:underline">
              Esquecer senha?
            </a>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition py-2 rounded-md text-white font-medium"
          >
            Entrar
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-6">
          Não tem uma conta?{" "}
          <a href="#" className="text-blue-500 hover:underline">
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
}