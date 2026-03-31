import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../public/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('geral');
  const [servicos, setServicos] = useState([]);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/login');

    const { data: profile } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile?.tipo_perfil !== 'admin') {
      alert('Acesso negado. Apenas administradores podem ver esta tela.');
      router.push('/login');
      return;
    }
    
    setUserProfile(profile);
    await fetchDadosReais();
    setLoading(false);
  }

  async function fetchDadosReais() {
    try {
      const { data, error } = await supabase
        .from('servicos_tecnico') 
        .select('*')
        .order('tempo', { ascending: false });

      if (error) throw error;
      setServicos(data || []);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error.message);
    }
  }

  const isFinalizado = (status) => {
    const s = status?.toLowerCase() || '';
    return s.includes('finalizado') || s.includes('resolvido');
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando Master Panel...</div>;

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans">
      
      {/* --- SIDEBAR ESQUERDA --- */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700 text-blue-400 font-bold text-xl uppercase tracking-wider">
          TechNic Admin
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setAbaAtiva('geral')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${abaAtiva === 'geral' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'}`}
          >
            📊 Visão Geral
          </button>
          
          <button 
            onClick={() => setAbaAtiva('servicos')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${abaAtiva === 'servicos' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'}`}
          >
            🛠️ Todos os Serviços
          </button>

          <button 
            onClick={() => setAbaAtiva('relatorios')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${abaAtiva === 'relatorios' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'}`}
          >
            📋 Relatórios Técnicos
          </button>

          <button 
            onClick={() => setAbaAtiva('finalizados')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${abaAtiva === 'finalizados' ? 'bg-green-600 text-white' : 'hover:bg-slate-700'}`}
          >
            ✅ Finalizados
          </button>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
            className="w-full bg-red-500/10 text-red-400 py-2 rounded hover:bg-red-500 hover:text-white transition"
          >
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-slate-800/50 backdrop-blur p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-medium">Dashboard / {abaAtiva.toUpperCase()}</h2>
          <div className="text-sm text-slate-400">Bem-vindo, {userProfile?.nome_completo}</div>
        </header>

        <div className="p-8">
          {/* VISÃO GERAL */}
          {abaAtiva === 'geral' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <p className="text-slate-400 text-sm">Total Geral</p>
                <p className="text-3xl font-bold text-blue-400">{servicos.length}</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <p className="text-slate-400 text-sm">Em Aberto</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {servicos.filter(s => !isFinalizado(s.status)).length}
                </p>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <p className="text-slate-400 text-sm">Finalizados</p>
                <p className="text-3xl font-bold text-green-400">
                  {servicos.filter(s => isFinalizado(s.status)).length}
                </p>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <p className="text-slate-400 text-sm">Faturamento</p>
                <p className="text-3xl font-bold text-emerald-400">
                  {/* ALTERAÇÃO: Faturamento agora soma a coluna 'preço' */}
                  R$ {servicos
                    .filter(s => isFinalizado(s.status))
                    .reduce((acc, s) => acc + (Number(s.preço) || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* TABELA DE TODOS OS SERVIÇOS */}
          {abaAtiva === 'servicos' && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-700/50 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="p-4">Equipamento</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {servicos.map(s => (
                    <tr key={s.id} className="hover:bg-slate-700/30 transition">
                      <td className="p-4 font-medium">{s.equipamento}</td>
                      <td className="p-4">{s.cliente || 'Sem nome'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs 
                          ${isFinalizado(s.status) ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TABELA DE FINALIZADOS */}
          {abaAtiva === 'finalizados' && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-700/50 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="p-4">Equipamento</th>
                    <th className="p-4">Preço</th>
                    <th className="p-4">Garantia</th>
                    <th className="p-4">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {servicos.filter(s => isFinalizado(s.status)).map(s => (
                    <tr key={s.id} className="hover:bg-green-500/5 transition">
                      <td className="p-4 font-medium text-green-400">{s.equipamento}</td>
                      {/* ALTERAÇÃO: Exibindo o valor da coluna 'preço' */}
                      <td className="p-4 font-bold text-emerald-400">R$ {Number(s.preço || 0).toFixed(2)}</td>
                      <td className="p-4 text-slate-300">{s.garantia || 'N/A'}</td>
                      <td className="p-4 text-slate-500 text-sm">
                        {s.tempo ? new Date(s.tempo).toLocaleDateString('pt-BR') : 'Recente'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Aba Relatórios */}
          {abaAtiva === 'relatorios' && (
             <div className="space-y-4">
               {servicos.filter(s => s.descricao).map(s => (
                 <div key={s.id} className="bg-slate-800 p-6 rounded-xl border-l-4 border-blue-500">
                    <h4 className="font-bold text-lg">{s.equipamento} - {s.cliente}</h4>
                    <p className="text-sm text-slate-400 mt-2">{s.descricao}</p>
                 </div>
               ))}
             </div>
          )}
        </div>
      </main>
    </div>
  );
}