// ✅ CÓDIGO COMPLETO CORRIGIDO (LÓGICA AJUSTADA, LAYOUT PRESERVADO)

import { useEffect, useState, useMemo } from 'react';
import Select from 'react-select';
import { useRouter } from 'next/router';
import { supabase } from '../../public/lib/supabase';


export default function AdminDashboard() {

  

  const cadastrarTecnico = async (e) => {
  e.preventDefault();
  setStatusCadastro('⏳ Salvando...');

  try {
    if (novoTecnico.id) {
      const { error } = await supabase
        .from('perfis')
        .update({
          nome_completo: novoTecnico.nome,
          email: novoTecnico.email,
        })
        .eq('id', novoTecnico.id);

      if (error) throw error;

      setStatusCadastro('✅ Técnico atualizado!');
    } else {
      const { error } = await supabase
        .from('perfis')
        .insert([
          {
            nome_completo: novoTecnico.nome,
            email: novoTecnico.email,
            senha: novoTecnico.senha,
            tipo_perfil: 'tecnico'
          }
        ]);

      if (error) throw error;

      setStatusCadastro('✅ Técnico cadastrado!');
    }

    setNovoTecnico({ nome: '', email: '', senha: '' });
    fetchTecnicos();

  } catch (err) {
    console.error(err);
    setStatusCadastro('❌ Erro ao salvar técnico');
  }
};

const salvarDiagnostico = async () => {
  try {
    const { error } = await supabase
      .from('servicos_tecnico')
      .update({
        diagnostico: orcamentoData.diagnostico,
        prazo: orcamentoData.prazo,
        preço: Number(orcamentoData.valorTotal)
      })
      .eq('id', orcamentoData.servicoId);

    if (error) throw error;

    alert('Diagnóstico salvo!');
    fetchDadosReais();

  } catch (err) {
    console.error(err);
    alert('Erro ao salvar diagnóstico');
  }
};


  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  const [servicos, setServicos] = useState([]);

const faturamentoTotal = useMemo(() => {
  return (servicos || []).reduce(
    (acc, s) => acc + (Number(s.preço) || 0),
    0
  );
}, [servicos]);

const gastosPecas = useMemo(() => {
  return (servicos || []).reduce(
    (acc, s) => acc + (Number(s.custo_pecas) || 0),
    0
  );
}, [servicos]);

const lucroLiquido = faturamentoTotal - gastosPecas;

const faturamentoSemanal = useMemo(() => {
  return (servicos || [])
    .filter(s => {
      if (!s.tempo) return false;
      const data = new Date(s.tempo);
      const hoje = new Date();
      const diff = (hoje - data) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    })
    .reduce((acc, s) => acc + (Number(s.preço) || 0), 0);
}, [servicos]);
  
  const [abaAtiva, setAbaAtiva] = useState('geral');

  const [tecnicos, setTecnicos] = useState([]);
  const [novoTecnico, setNovoTecnico] = useState({ nome: '', email: '', senha: '' });
  const [statusCadastro, setStatusCadastro] = useState('');

  const [clientes, setClientes] = useState([]);

  const clientesOptions = useMemo(() =>
  clientes.map(c => ({
    value: c.id,
    label: c.nome_completo || c.nome || c.email || c.cliente?.email || `ID: ${c.id.substring(0,5)}`
  })),
  [clientes]);


  const [novoCliente, setNovoCliente] = useState({ nome: '', cpf_cnpj: '', email: '', telefone: '', endereco: '' });
  const [statusCliente, setStatusCliente] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [servicoEditando, setServicoEditando] = useState(null);

  const [orcamentoData, setOrcamentoData] = useState({
    servicoId: '',
    diagnostico: '',
    prazo: '',
    valorTotal: 0
  });

  useEffect(() => { checkAdmin(); }, []);

  useEffect(() => {
    if (abaAtiva === 'tecnicos') fetchTecnicos();
    if (abaAtiva === 'clientes') fetchClientes();
  }, [abaAtiva]);

  useEffect(() => {
  fetchClientes();
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
      alert('Acesso negado.');
      router.push('/login');
      return;
    }

    setUserProfile(profile);
    await fetchDadosReais();
    setLoading(false);
  }

  async function fetchDadosReais() {
    const { data } = await supabase
      .from('servicos_tecnico')
      .select('*')
      .order('tempo', { ascending: false });

    setServicos(data || []);
  }

  async function fetchTecnicos() {
    const { data } = await supabase
      .from('perfis')
      .select('*')
      .eq('tipo_perfil', 'tecnico');

    setTecnicos(data || []);
  }

  async function fetchClientes() {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('nome', { ascending: true });

    setClientes(data || []);
  }

  async function cadastrarCliente(e) {
    e.preventDefault();
    setStatusCliente('⏳ Salvando...');

    try {
      if (novoCliente.id) {
        await supabase.from('clientes').update(novoCliente).eq('id', novoCliente.id);
      } else {
        await supabase.from('clientes').insert([novoCliente]);
      }

      setStatusCliente('✅ Sucesso!');
      setNovoCliente({ nome: '', cpf_cnpj: '', email: '', telefone: '', endereco: '' });
      fetchClientes();
    } catch (error) {
      setStatusCliente('❌ ' + error.message);
    }
  }

  async function deletarCliente(id) {
    if (confirm('Excluir cliente?')) {
      await supabase.from('clientes').delete().eq('id', id);
      fetchClientes();
    }
  }

  async function excluirTecnico(id) {
    if (confirm('Excluir técnico?')) {
      await supabase.from('perfis').delete().eq('id', id);
      fetchTecnicos();
    }
  }

  function editarServico(servico) {
    setServicoEditando(servico);
    setModalAberto(true);
  }

  const abrirModalNovo = () => {
    setServicoEditando({ equipamento: '', cliente: '', cliente_id: '', cpf_cnpj: '', endereco: '', status: 'Em Análise', preço: 0, custo_pecas: 0, telefone: '' });
    setModalAberto(true);
  };

  async function salvarServico(e) {
  e.preventDefault();

  const payload = {
  ...servicoEditando,
  cliente_id: Number(servicoEditando.cliente_id),
  preço: Number(servicoEditando.preço),
  custo_pecas: Number(servicoEditando.custo_pecas)
};

  try {
    let error;

    if (servicoEditando.id) {
      ({ error } = await supabase
        .from('servicos_tecnico')
        .update(payload)
        .eq('id', servicoEditando.id));
    } else {
      ({ error } = await supabase
        .from('servicos_tecnico')
        .insert([payload]));
    }

    if (error) throw error;

    alert('✅ Serviço salvo!');
    setModalAberto(false);
    fetchDadosReais();

  } catch (err) {
    console.error('ERRO AO SALVAR:', err);
    alert('❌ Erro: ' + err.message);
  }
}

  async function excluirServico(id) {
    if (confirm('Excluir serviço?')) {
      await supabase.from('servicos_tecnico').delete().eq('id', id);
      fetchDadosReais();
    }
  }

  function enviarOrcamentoWhatsApp() {
    const id = Number(orcamentoData.servicoId);
    const servico = servicos.find(s => s.id === id);

    if (!servico) return alert('Selecione um serviço');

    const fone = servico.telefone?.replace(/\D/g, '');
    if (!fone) return alert('Sem telefone');

    const mensagem = `Orçamento para ${servico.equipamento} - R$ ${orcamentoData.valorTotal}`;

    window.open(`https://api.whatsapp.com/send?phone=${fone}&text=${encodeURIComponent(mensagem)}`);
  }

  const isFinalizado = (status) => {
    const s = status?.toLowerCase() || '';
    return s.includes('finalizado') || s.includes('resolvido');
  };

  const conv = (v) => Number(v) || 0;

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">CARREGANDO...</div>;

  // 🔥 AQUI ESTÁ SEU LAYOUT ORIGINAL (mantido)
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
            { id: 'clientes', label: 'Gestão de Clientes', icon: '👤', color: 'blue' }, // NOVO BOTÃO
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
          

          
          {/* --- NOVA ABA: GESTÃO DE CLIENTES --- */}
{abaAtiva === 'clientes' && (
  <div className="space-y-10">
    <div className="max-w-3xl mx-auto bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl">
      <h3 className="text-3xl font-black text-white tracking-tighter italic mb-8 uppercase">
        {novoCliente.id ? 'Editar Cliente' : 'Novo Cliente'}
      </h3>
      
      <form onSubmit={cadastrarCliente} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nome Completo</label>
            <input type="text" className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold" value={novoCliente.nome} onChange={(e) => setNovoCliente({...novoCliente, nome: e.target.value})} required />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">CPF / CNPJ</label>
            <input type="text" className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold" value={novoCliente.cpf_cnpj} onChange={(e) => setNovoCliente({...novoCliente, cpf_cnpj: e.target.value})} required />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">E-mail</label>
            <input type="email" className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold" value={novoCliente.email} onChange={(e) => setNovoCliente({...novoCliente, email: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Telefone</label>
            <input type="text" className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold" value={novoCliente.telefone} onChange={(e) => setNovoCliente({...novoCliente, telefone: e.target.value})} required />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Endereço Completo</label>
          <input type="text" className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold" value={novoCliente.endereco} onChange={(e) => setNovoCliente({...novoCliente, endereco: e.target.value})} required />
        </div>

        <div className="flex gap-4">
          <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-xs transition-all">
            {novoCliente.id ? 'Atualizar Cliente' : 'Salvar Cliente'}
          </button>
          
          {novoCliente.id && (
            <button 
              type="button" 
              onClick={() => setNovoCliente({ nome: '', cpf_cnpj: '', email: '', telefone: '', endereco: '' })}
              className="px-8 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl uppercase text-[10px] transition-all"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {statusCliente && <div className={`mt-8 p-4 rounded-2xl text-center text-xs font-black uppercase ${statusCliente.includes('✅') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{statusCliente}</div>}
    </div>

    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <h3 className="font-black text-xl italic text-slate-200 uppercase">Base de Clientes</h3>
        <span className="text-[10px] font-black bg-slate-800 px-3 py-1 rounded-full text-slate-500 uppercase">{clientes.length} Cadastrados</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase">
            <tr>
              <th className="p-6">Nome</th>
              <th className="p-6">Documento</th>
              <th className="p-6">Contato</th>
              <th className="p-6 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {clientes.map(c => (
              <tr key={c.id} className="hover:bg-slate-800/30 transition-all font-bold">
                <td className="p-6">
                  <div className="text-slate-200">{c.nome}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-normal">{c.endereco}</div>
                </td>
                <td className="p-6 text-sm text-slate-400 font-mono">{c.cpf_cnpj}</td>
                <td className="p-6 text-sm text-slate-400">{c.telefone}</td>
                <td className="p-6">
                  <div className="flex justify-center gap-3">
                    {/* BOTÃO EDITAR */}
                    <button 
                      onClick={() => {
                        setNovoCliente(c);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-xl transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

                    {/* BOTÃO EXCLUIR */}
                    <button 
                      onClick={() => deletarCliente(c.id)}
                      className="p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}
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

       {/* --- ABA: GESTÃO DE TÉCNICOS --- */}
{abaAtiva === 'tecnicos' && (
  <div className="space-y-10">
    <div className="max-w-xl mx-auto bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl">
      <h3 className="text-3xl font-black text-white tracking-tighter italic mb-8 uppercase">
        {novoTecnico.id ? 'Editar Técnico' : 'Novo Técnico'}
      </h3>
      
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
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
            {novoTecnico.id ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
          </label>
          <input type="password" className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-indigo-600 font-bold" value={novoTecnico.senha || ''} onChange={(e) => setNovoTecnico({...novoTecnico, senha: e.target.value})} required={!novoTecnico.id} />
        </div>

        <div className="flex gap-4">
          <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-xs transition-all">
            {novoTecnico.id ? 'Atualizar Técnico' : 'Finalizar Cadastro'}
          </button>
          
          {novoTecnico.id && (
            <button 
              type="button" 
              onClick={() => setNovoTecnico({ nome: '', email: '', senha: '' })}
              className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl uppercase text-[10px] transition-all"
            >
              Cancelar
            </button>
          )}
        </div>
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
          <tr>
            <th className="p-6">Nome</th>
            <th className="p-6">E-mail</th>
            <th className="p-6 text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {tecnicos.map(t => (
            <tr key={t.id} className="hover:bg-slate-800/30 transition-all font-bold">
              <td className="p-6 text-slate-200">{t.nome_completo || t.nome}</td>
              <td className="p-6 text-sm text-slate-400">{t.email}</td>
              <td className="p-6">
                <div className="flex justify-center gap-3">
                  {/* EDITAR */}
                  <button 
                    onClick={() => {
                      setNovoTecnico({ ...t, nome: t.nome_completo || t.nome, senha: '' });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-500 hover:text-white rounded-xl transition-all"
                    title="Editar Técnico"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>

                  {/* EXCLUIR */}
                  <button 
                    onClick={() => excluirTecnico(t.id)}
                    className="p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all"
                    title="Excluir Técnico"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

 {abaAtiva === 'relatorios' && (
  <div className="space-y-6">
    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <h3 className="font-black text-xl italic text-slate-200 uppercase tracking-tighter">
          Detalhamento Financeiro
        </h3>
        <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full uppercase">
          {servicos.filter(s => isFinalizado(s.status)).length} Serviços Finalizados
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase">
            <tr>
              <th className="p-6">Equipamento</th>
              <th className="p-6">Mão de Obra</th>
              <th className="p-6">Custo Peças</th>
              <th className="p-6">Lucro Líquido</th>
              <th className="p-6 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {servicos.filter(s => isFinalizado(s.status)).map(s => {
              const preco = conv(s.preço);
              const custo = conv(s.custo_pecas);
              const lucro = preco - custo;

              return (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-all font-bold">
                  <td className="p-6">
                    <div className="text-slate-200">{s.equipamento}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-normal font-mono">
                      ID: {s.id?.toString().slice(0,8)}
                    </div>
                  </td>
                  <td className="p-6 text-emerald-400">R$ {preco.toFixed(2)}</td>
                  <td className="p-6 text-red-400">R$ {custo.toFixed(2)}</td>
                  <td className={`p-6 ${lucro >= 0 ? 'text-blue-400' : 'text-orange-500'}`}>
                    R$ {lucro.toFixed(2)}
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-3">
                      {/* BOTÃO EDITAR */}
                      <button 
                        onClick={() => editarServico(s)}
                        className="p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-xl transition-all"
                        title="Editar Registro"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>

                      {/* BOTÃO EXCLUIR */}
                      <button 
                        onClick={() => excluirServico(s.id)}
                        className="p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all"
                        title="Excluir Registro"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="bg-slate-800/30 p-8 border-t border-slate-800 flex justify-end">
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Resultado Geral (Lucro Líquido)</p>
          <p className="text-3xl font-black text-white italic">
            R$ {servicos
              .filter(s => isFinalizado(s.status))
              .reduce((acc, s) => acc + (conv(s.preço) - conv(s.custo_pecas)), 0)
              .toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  </div>
)}

        {(abaAtiva === 'servicos' || abaAtiva === 'finalizados') && (
  <div className="space-y-6">
    {abaAtiva === 'servicos' && (
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Gerenciamento de Serviços</h3>
        <button onClick={abrirModalNovo} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40 text-white">
          + Novo Serviço
        </button>
      </div>
    )}
    
    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <tr> 
              <th className="p-6">Equipamento</th> 
              <th className="p-6">Cliente</th> 
              {abaAtiva === 'finalizados' ? <th className="p-6">Valor</th> : <th className="p-6">Status</th>} 
              <th className="p-6 text-center">Ações / Data</th> 
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {servicos.filter(s => abaAtiva === 'finalizados' ? isFinalizado(s.status) : true).map(s => (
              <tr key={s.id} className="hover:bg-slate-800/30 transition-all font-bold">
                <td className="p-6 text-slate-200">{s.equipamento}</td>
                <td className="p-6 text-sm text-slate-400">{s.cliente || '---'}</td>
                <td className="p-6">
                  {abaAtiva === 'finalizados' ? (
                    <span className="text-emerald-400 font-mono">R$ {conv(s.preço).toFixed(2)}</span>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase ${isFinalizado(s.status) ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {s.status}
                    </span>
                  )}
                </td>
                <td className="p-6">
                  <div className="flex justify-center items-center gap-3">
                    {/* EDITAR */}
                    <button onClick={() => editarServico(s)} className="p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg transition-all" title="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    {/* EXCLUIR */}
                    <button onClick={() => excluirServico(s.id)} className="p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition-all" title="Excluir">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    {abaAtiva === 'finalizados' && (
                       <span className="text-[10px] text-slate-600 ml-2 border-l border-slate-800 pl-3 uppercase">
                         {s.tempo ? new Date(s.tempo).toLocaleDateString('pt-BR') : '---'}
                       </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

{/* MODAL SERVIÇO */}
{modalAberto && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
    <div className="bg-slate-900 border-2 border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-10 overflow-y-auto max-h-[90vh]">
      <h3 className="text-3xl font-black text-white mb-8 tracking-tighter italic uppercase">
        {servicoEditando?.id ? 'Atualizar Registro' : 'Novo Registro de Entrada'}
      </h3>

      <form onSubmit={salvarServico} className="space-y-6 text-left">
        
        {/* LINHA 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
      Equipamento
    </label>
    <input
      className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white font-bold outline-none focus:border-blue-600"
      value={servicoEditando.equipamento || ''}
      onChange={e =>
        setServicoEditando({ ...servicoEditando, equipamento: e.target.value })
      }
      required
    />
  </div>

  <div>
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
      Cliente
    </label>

    <Select
  options={clientesOptions}
  placeholder="Buscar cliente..."
  noOptionsMessage={() => "Nenhum cliente encontrado"} // Mensagem caso não ache nada
  value={
    clientesOptions.find(opt => opt.value === servicoEditando.cliente_id) || null
  }
  onChange={(selected) =>
    setServicoEditando({
      ...servicoEditando,
      cliente_id: selected?.value || '' // Removi o Number() por segurança
    })
  }
  styles={{
    control: (base) => ({
      ...base,
      backgroundColor: '#0f172a', // Cor igual ao seu painel
      borderColor: '#1e293b',
      padding: '4px',
      boxShadow: 'none',
      '&:hover': { borderColor: '#3b82f6' }
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: '#0f172a',
      border: '1px solid #1e293b',
      zIndex: 9999 // Para o menu flutuar sobre tudo
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#2563eb'
        : state.isFocused
        ? '#1e293b'
        : 'transparent',
      color: 'white',
      padding: '12px',
      '&:active': { backgroundColor: '#2563eb' }
    }),
    singleValue: (base) => ({
      ...base,
      color: 'white' // Texto do cliente selecionado
    }),
    input: (base) => ({
      ...base,
      color: 'white' // Texto de quando você está digitando
    }),
    placeholder: (base) => ({
      ...base,
      color: '#64748b'
    })
  }}
/>
</div> {/* ✅ FECHA A DIV DO CLIENTE */}
</div> {/* ✅ fecha a GRID da LINHA 1 */}

{/* LINHA 2 */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
              CPF / CNPJ
            </label>
            <input
              className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white font-bold outline-none focus:border-blue-600"
              value={servicoEditando.cpf_cnpj || ''}
              onChange={e =>
                setServicoEditando({ ...servicoEditando, cpf_cnpj: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Endereço Completo
            </label>
            <input
              className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white font-bold outline-none focus:border-blue-600"
              value={servicoEditando.endereco || ''}
              onChange={e =>
                setServicoEditando({ ...servicoEditando, endereco: e.target.value })
              }
              required
            />
          </div>
        </div>

        {/* LINHA 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Preço Final (R$)
            </label>
            <input
              type="number"
              className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white font-bold outline-none focus:border-blue-600"
              value={servicoEditando.preço || ''}
              onChange={e =>
                setServicoEditando({ ...servicoEditando, preço: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Custo de Peças (R$)
            </label>
            <input
              type="number"
              className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white font-bold outline-none focus:border-blue-600"
              value={servicoEditando.custo_pecas || ''}
              onChange={e =>
                setServicoEditando({ ...servicoEditando, custo_pecas: e.target.value })
              }
            />
          </div>
        </div>

        {/* LINHA 4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Telefone do Cliente
            </label>
            <input
              className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white font-bold outline-none focus:border-blue-600"
              value={servicoEditando.telefone || ''}
              onChange={e =>
                setServicoEditando({ ...servicoEditando, telefone: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Status Atual
            </label>
            <select
              className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white font-bold outline-none focus:border-blue-600"
              value={servicoEditando.status}
              onChange={e =>
                setServicoEditando({ ...servicoEditando, status: e.target.value })
              }
            >
              <option value="Em Análise">Em Análise</option>
              <option value="Aguardando Aprovação">Aguardando Aprovação</option>
              <option value="Em Manutenção">Em Manutenção</option>
              <option value="Pronto - Aguardando Retirada">Pronto - Aguardando Retirada</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </div>
        </div>

        {/* BOTÕES */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-xs transition-all"
          >
            Confirmar e Salvar
          </button>

          <button
            type="button"
            onClick={() => setModalAberto(false)}
            className="px-8 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black py-5 rounded-2xl uppercase tracking-widest text-xs transition-all"
          >
            Cancelar
          </button>
        </div>

      </form>
    </div>
  </div>
)}
</div>
</main>
</div>);
}

