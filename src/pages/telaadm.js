import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../public/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('geral');
  const [servicos, setServicos] = useState([]);

  const [tecnicos, setTecnicos] = useState([]);
  const [novoTecnico, setNovoTecnico] = useState({ nome: '', email: '', senha: '' });
  const [statusCadastro, setStatusCadastro] = useState('');

  // --- NOVO ESTADO PARA ORÇAMENTOS ---
  const [orcamentoData, setOrcamentoData] = useState({
    servicoId: '',
    diagnostico: '',
    prazo: '',
    valorTotal: 0
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (abaAtiva === 'tecnicos') {
      fetchTecnicos();
    }
  }, [abaAtiva]);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/login');

    const { data: profile } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile?.tipo_perfil !== 'admin') {
      alert('Acesso negado.');
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

  async function fetchTecnicos() {
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('tipo_perfil', 'tecnico')
      .order('nome_completo', { ascending: true });

    if (!error) setTecnicos(data);
  }

  // --- FUNÇÕES DE ORÇAMENTO ---
  async function salvarDiagnostico() {
    if (!orcamentoData.servicoId) return alert("Selecione um serviço primeiro!");
    try {
      const { error } = await supabase
        .from('servicos_tecnico')
        .update({ 
          diagnostico_tecnico: orcamentoData.diagnostico,
          status: 'Aguardando Aprovação',
          preço: orcamentoData.valorTotal
        })
        .eq('id', orcamentoData.servicoId);

      if (error) throw error;
      alert("✅ Diagnóstico salvo no sistema!");
      fetchDadosReais();
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    }
  }

  function enviarOrcamentoWhatsApp() {
    const servico = servicos.find(s => s.id === orcamentoData.servicoId);
    if (!servico) return alert("Selecione um serviço!");

    const mensagem = `*ORÇAMENTO TÉCNICO - ${servico.equipamento}*
---------------------------------------
*Cliente:* ${servico.cliente || 'Prezado(a)'}
*Diagnóstico:* ${orcamentoData.diagnostico}
*Prazo:* ${orcamentoData.prazo}
*Valor Total:* R$ ${Number(orcamentoData.valorTotal).toFixed(2)}
---------------------------------------
_Para aprovar este serviço, responda esta mensagem._`.trim();

    const fone = servico.telefone ? servico.telefone.replace(/\D/g, '') : '';
    const url = `https://api.whatsapp.com/send?phone=${fone}&text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  }

  async function cadastrarTecnico(e) {
    e.preventDefault();
    setStatusCadastro('⏳ Cadastrando...');
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: novoTecnico.email,
        password: novoTecnico.senha,
      });
      if (authError) throw authError;
      const { error: profileError } = await supabase
        .from('perfis')
        .insert([{ id: authData.user.id, nome_completo: novoTecnico.nome, email: novoTecnico.email, tipo_perfil: 'tecnico' }]);
      if (profileError) throw profileError;
      setStatusCadastro('✅ Sucesso!');
      setNovoTecnico({ nome: '', email: '', senha: '' });
      fetchTecnicos();
    } catch (error) {
      setStatusCadastro('❌ Erro: ' + error.message);
    }
  }

  const isFinalizado = (status) => {
    const s = status?.toLowerCase() || '';
    return s.includes('finalizado') || s.includes('resolvido');
  };

  const conv = (v) => Number(v) || 0;

  const faturamentoTotal = servicos
    .filter(s => isFinalizado(s.status))
    .reduce((acc, s) => acc + conv(s.preço), 0);
  
  const gastosPecas = servicos
    .filter(s => isFinalizado(s.status))
    .reduce((acc, s) => acc + conv(s.custo_pecas), 0);
  
  const lucroLiquido = faturamentoTotal - gastosPecas;

  const faturamentoSemanal = servicos
    .filter(s => isFinalizado(s.status) && s.tempo && (new Date() - new Date(s.tempo)) / (1000 * 60 * 60 * 24) <= 7)
    .reduce((acc, s) => acc + conv(s.preço), 0);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-mono tracking-tighter">CARREGANDO MASTER PANEL...</div>;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-8 border-b border-slate-800">
          <h1 className="text-blue-500 font-black text-2xl tracking-tighter italic">TECHNIC ADMIN</h1>
        </div>
        <nav className="flex-1 p-6 space-y-3">
          {[
            { id: 'geral', label: 'Visão Geral', icon: '📊' },
            { id: 'servicos', label: 'Todos os Serviços', icon: '🛠️' },
            { id: 'orcamentos', label: 'Gerar Orçamento', icon: '📝', color: 'blue' },
            { id: 'tecnicos', label: 'Gestão de Técnicos', icon: '👥', color: 'indigo' },
            { id: 'relatorios', label: 'Relatórios Técnicos', icon: '📋' },
            { id: 'finalizados', label: 'Finalizados', icon: '✅', color: 'green' }
          ].map((item) => (
            <button key={item.id} onClick={() => setAbaAtiva(item.id)} className={`w-full text-left px-4 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 ${abaAtiva === item.id ? (item.color === 'indigo' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/20' : item.color === 'green' ? 'bg-green-600' : 'bg-blue-600 shadow-lg shadow-blue-900/20') : 'hover:bg-slate-800 text-slate-400'}`}>
              <span className="text-xl">{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-800">
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="w-full bg-red-500/10 text-red-500 py-3 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all">Encerrar Sessão</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 p-6 border-b border-slate-900 flex justify-between items-center">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Dashboard / {abaAtiva}</h2>
          <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-slate-300 italic">{userProfile?.nome_completo}</span>
          </div>
        </header>

        <div className="p-10">
          {abaAtiva === 'geral' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[{ label: 'Total Geral', val: servicos.length, color: 'text-blue-500' }, { label: 'Em Aberto', val: servicos.filter(s => !isFinalizado(s.status)).length, color: 'text-yellow-500' }, { label: 'Finalizados', val: servicos.filter(s => isFinalizado(s.status)).length, color: 'text-green-500' }].map((card, i) => (
                  <div key={i} className="bg-slate-900 h-30 rounded-3xl border border-slate-800 flex flex-col items-center justify-center shadow-xl">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{card.label}</p>
                    <p className={`text-4xl font-black ${card.color} tracking-tighter`}>{card.val}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-900 h-65 p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col justify-between">
                  <div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Faturamento Bruto</p>
                    <p className="text-5xl font-black text-white tracking-tighter">R$ {faturamentoTotal.toFixed(2)}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-800 flex justify-between text-[10px] font-black uppercase">
                    <span className="text-slate-500">Recurso Semanal</span>
                    <span className="text-blue-400 text-sm">R$ {faturamentoSemanal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-slate-900 h-65 p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col justify-between">
                  <div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Custo com Peças</p>
                    <p className="text-5xl font-black text-red-500 tracking-tighter">R$ {gastosPecas.toFixed(2)}</p>
                  </div>
                  <p className="text-[9px] text-slate-600 font-bold italic uppercase tracking-widest underline decoration-red-500/30">Lendo coluna: custo_pecas</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-green-800 h-65 p-8 rounded-3xl shadow-2xl flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 text-white/10 text-9xl font-black italic group-hover:scale-110 transition-transform cursor-default">$</div>
                  <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-2">Lucro Líquido Real</p>
                  <p className="text-6xl font-black text-white tracking-tighter drop-shadow-md">R$ {lucroLiquido.toFixed(2)}</p>
                  <p className="mt-4 text-[10px] font-bold text-emerald-200 uppercase">Margem de lucro ativa ✅</p>
                </div>
              </div>
            </div>
          )}

          {/* ABA DE ORÇAMENTOS (NOVA) */}
          {abaAtiva === 'orcamentos' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl">
                <h3 className="text-3xl font-black text-white tracking-tighter italic mb-8 uppercase">Gerar Orçamento Oficial</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Selecionar Serviço Aberto</label>
                    <select 
                      className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold"
                      value={orcamentoData.servicoId}
                      onChange={(e) => {
                        const s = servicos.find(item => item.id === e.target.value);
                        setOrcamentoData({...orcamentoData, servicoId: e.target.value, valorTotal: s?.preço || 0});
                      }}
                    >
                      <option value="">Selecione um equipamento...</option>
                      {servicos.filter(s => !isFinalizado(s.status)).map(s => (
                        <option key={s.id} value={s.id}>{s.equipamento} - {s.cliente}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Prazo de Entrega (Dias)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 3 a 5 dias úteis"
                      className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold"
                      value={orcamentoData.prazo}
                      onChange={(e) => setOrcamentoData({...orcamentoData, prazo: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Valor do Orçamento (R$)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold"
                    value={orcamentoData.valorTotal}
                    onChange={(e) => setOrcamentoData({...orcamentoData, valorTotal: e.target.value})}
                  />
                </div>

                <div className="mt-6">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Diagnóstico Técnico</label>
                  <textarea 
                    className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold h-32"
                    placeholder="Descreva o defeito encontrado..."
                    value={orcamentoData.diagnostico}
                    onChange={(e) => setOrcamentoData({...orcamentoData, diagnostico: e.target.value})}
                  />
                </div>

                <div className="mt-8 flex gap-4">
                  <button onClick={enviarOrcamentoWhatsApp} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2">📱 Enviar via WhatsApp</button>
                  <button onClick={salvarDiagnostico} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-xs transition-all">Salvar Diagnóstico</button>
                </div>
              </div>
            </div>
          )}

          {abaAtiva === 'tecnicos' && (
            <div className="space-y-10">
              <div className="max-w-xl mx-auto bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl">
                <h3 className="text-3xl font-black text-white tracking-tighter italic mb-8 uppercase">Novo Técnico</h3>
                <form onSubmit={cadastrarTecnico} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nome</label>
                    <input type="text" className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-indigo-600 font-bold" value={novoTecnico.nome} onChange={(e) => setNovoTecnico({...novoTecnico, nome: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">E-mail</label>
                    <input type="email" className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-indigo-600 font-bold" value={novoTecnico.email} onChange={(e) => setNovoTecnico({...novoTecnico, email: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Senha</label>
                    <input type="password" className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-indigo-600 font-bold" value={novoTecnico.senha} onChange={(e) => setNovoTecnico({...novoTecnico, senha: e.target.value})} required />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-xs transition-all">Finalizar Cadastro</button>
                </form>
                {statusCadastro && <div className={`mt-8 p-4 rounded-2xl text-center text-xs font-black uppercase ${statusCadastro.includes('✅') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{statusCadastro}</div>}
              </div>

              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="font-black text-xl italic text-slate-200 uppercase">Equipe Técnica</h3>
                  <span className="text-[10px] font-black bg-slate-800 px-3 py-1 rounded-full text-slate-500 uppercase">{tecnicos.length} Técnicos</span>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase">
                    <tr><th className="p-6">Nome</th><th className="p-6">E-mail</th><th className="p-6 text-right">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {tecnicos.map(t => (
                      <tr key={t.id} className="hover:bg-slate-800/30 transition-all font-bold">
                        <td className="p-6 text-slate-200">{t.nome_completo}</td>
                        <td className="p-6 text-sm text-slate-400">{t.email}</td>
                        <td className="p-6 text-right"><span className="bg-green-500/10 text-green-500 text-[10px] font-black uppercase px-3 py-1 rounded-full">Ativo</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {abaAtiva === 'relatorios' && (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-800">
                <h3 className="font-black text-xl italic text-slate-200 uppercase">Detalhamento Financeiro por Serviço</h3>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase">
                  <tr>
                    <th className="p-6">Equipamento</th>
                    <th className="p-6">Mão de Obra (Preço)</th>
                    <th className="p-6">Custo Peças</th>
                    <th className="p-6 text-right">Lucro Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {servicos.filter(s => isFinalizado(s.status)).map(s => {
                    const preco = conv(s.preço);
                    const custo = conv(s.custo_pecas);
                    return (
                      <tr key={s.id} className="hover:bg-slate-800/30 font-bold">
                        <td className="p-6 text-slate-200">{s.equipamento}</td>
                        <td className="p-6 text-emerald-400">R$ {preco.toFixed(2)}</td>
                        <td className="p-6 text-red-400">R$ {custo.toFixed(2)}</td>
                        <td className="p-6 text-right text-blue-400">R$ {(preco - custo).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {(abaAtiva === 'servicos' || abaAtiva === 'finalizados') && (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <tr> <th className="p-6">Equipamento</th> <th className="p-6">Cliente</th> {abaAtiva === 'finalizados' ? <th className="p-6">Valor</th> : <th className="p-6">Status</th>} <th className="p-6 text-right">Data</th> </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {servicos.filter(s => abaAtiva === 'finalizados' ? isFinalizado(s.status) : true).map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-all font-bold">
                      <td className="p-6 text-slate-200">{s.equipamento}</td>
                      <td className="p-6 text-sm text-slate-400">{s.cliente || '---'}</td>
                      <td className="p-6">{abaAtiva === 'finalizados' ? <span className="text-emerald-400 font-mono">R$ {conv(s.preço).toFixed(2)}</span> : <span className={`px-3 py-1 rounded-full text-[10px] uppercase ${isFinalizado(s.status) ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{s.status}</span>}</td>
                      <td className="p-6 text-right text-xs text-slate-600">{s.tempo ? new Date(s.tempo).toLocaleDateString('pt-BR') : '---'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}