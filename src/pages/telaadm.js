import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../public/lib/supabase'; // Certifique-se que o caminho está correto

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Dados fictícios para a tabela
  const ordensServico = [
    { id: 'OS1024', equipamento: 'Notebook Dell XPS', status: 'Em Manutenção', data: '25/05/2024' },
    { id: 'OS1025', equipamento: 'iPhone 13 Pro', status: 'Aguardando Peça', data: '26/05/2024' },
    { id: 'OS1020', equipamento: 'MacBook Air M1', status: 'Concluído', data: '20/05/2024' },
  ];

  const statusCores = {
    'Em Manutenção': 'bg-blue-500/20 text-blue-300',
    'Aguardando Peça': 'bg-yellow-500/20 text-yellow-300',
    'Concluído': 'bg-green-500/20 text-green-300',
  };

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      // 1. Pega o usuário logado no Auth
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // 2. Busca o perfil na tabela 'perfis'
      const { data: profile, error } = await supabase
        .from('perfis')
        .select('tipo_perfil, nome_completo')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        router.push('/login');
        return;
      }

      // 3. BLOQUEIO: Se não for tecnico ou admin, expulsa da página
      if (profile.tipo_perfil !== 'tecnico' && profile.tipo_perfil !== 'admin') {
        alert('Acesso restrito a técnicos e administradores.');
        router.push('/login'); // Ou para uma tela de "Acesso Negado"
        return;
      }

      setUserProfile(profile);
      setLoading(false);
    } catch (error) {
      router.push('/login');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white">Verificando permissões...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <nav className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-400">TechNic {' > '} Painel Técnico</h1>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Logado como: {userProfile?.nome_completo} ({userProfile?.tipo_perfil})</span>
          <button 
            onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
            className="text-sm text-red-400 hover:underline"
          >
            Sair
          </button>
        </div>
      </nav>

      <main className="p-6 md:p-10 space-y-8">
        {/* Resto do seu código da tabela permanece igual aqui... */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-lg font-semibold mb-6 text-blue-300">Gestão de Ordens de Serviço (Modo {userProfile?.tipo_perfil})</h2>
          <div className="space-y-4">
            {ordensServico.map((os) => (
              <div key={os.id} className="bg-slate-700/50 p-4 rounded-lg flex justify-between items-center border border-slate-600">
                <div>
                  <p className="font-medium">{os.equipamento}</p>
                  <p className="text-xs text-gray-400">ID: {os.id} | Status: {os.status}</p>
                </div>
                <button className="text-xs bg-slate-600 px-3 py-1 rounded hover:bg-slate-500">Editar O.S.</button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}