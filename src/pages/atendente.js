import { useEffect, useState, useMemo } from 'react';
import Select from 'react-select'; 
import { useRouter } from 'next/router';
import { supabase } from '../../public/lib/supabase';
import { Fragment } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { Pencil, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Estados de Controle e Carregamento
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('geral');

  // Estados de Dados
  const [servicos, setServicos] = useState([]);
  const [clientes, setClientes] = useState([]);

  const [servicoExpandido, setServicoExpandido] = useState(null);

  // Estados de Filtros e Buscas
  const [pesquisaCliente, setPesquisaCliente] = useState('');
  const [pesquisaServico, setPesquisaServico] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [buscaRelatorio, setBuscaRelatorio] = useState('');

  // Estados de Formulários e Modais
  const [novoCliente, setNovoCliente] = useState({ 
    nome: '', 
    cpf_cnpj: '', 
    email: '', 
    telefone: '', 
    endereco: '',
    senha: '' 
  });
  const [statusCliente, setStatusCliente] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [servicoEditando, setServicoEditando] = useState(null);
  const [orcamentoData, setOrcamentoData] = useState({
    servicoId: '',
    diagnostico: '',
    prazo: '',
    valorTotal: 0
  });

  const conv = (valor) => {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
  };

  // Validação de Acesso
  useEffect(() => { 
    checkAdmin(); 
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return router.push('/login');

    // Sincroniza o perfil do usuário logado
    await supabase
      .from('perfis')
      .update({
        nome_completo: user.user_metadata?.nome || user.user_metadata?.full_name,
        email: user.email
      })
      .eq('id', user.id);

    // Busca o perfil atualizado do banco de dados
    const { data: profile } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', user.id)
      .single();

    // Permite acesso apenas para 'admin' ou 'atendente'
    const perfisPermitidos = ['admin', 'atendente'];
    
    if (!profile || !perfisPermitidos.includes(profile.tipo_perfil)) {
      toast.warning('Acesso negado. Você não tem permissão para acessar esta área.');
      router.push('/login');
      return;
    }

    setUserProfile(profile);
    setLoading(false);
  }

  // Carregamento Inicial de Dados
  useEffect(() => {
    if (userProfile) {
      carregarDadosIniciais();
    }
  }, [userProfile]);

  async function carregarDadosIniciais() {
    try {
      await Promise.all([
        fetchClientes(),
        fetchDadosReais()
      ]);
    } catch (err) {
      console.error(err);
    }
  }

  // Realtime para Serviços
  useEffect(() => {
    const channel = supabase
      .channel('realtime-servicos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'servicos_tecnico',
        },
        () => {
          fetchDadosReais();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Vincula Cliente Selecionado ao criar/editar Serviço
  useEffect(() => {
    if (!clienteSelecionado) return;

    const cliente = clientes.find(
      (c) => String(c.id) === String(clienteSelecionado.value)
    );

    if (!cliente) return;

    setServicoEditando((prev) => ({
      ...prev,
      cliente_id: cliente.id,
      cliente: cliente.nome || '',
      telefone: cliente.telefone || '',
      cpf_cnpj: cliente.cpf_cnpj || '',
      endereco: cliente.endereco || ''
    }));
  }, [clienteSelecionado, clientes]);

  // Busca Clientes no DB
  async function fetchClientes() {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('nome', { ascending: true });

    setClientes(data || []);
  }

  function abrirModalNovo() {
    setServicoEditando({
      cliente_id: '',
      cliente: '',
      cpf_cnpj: '',
      telefone: '',
      endereco: '',
      equipamento: '',
      descricao: '',
      preco: 0,
      valor_pecas: 0,
      peca_substituida: '',
      tecnico: userProfile?.nome_completo || '',
      status: 'Em_Analise',
      tempo: new Date().toISOString()
    });

    setClienteSelecionado(null);
    setModalAberto(true);
  }

  function editarServico(servico) {
    setServicoEditando(servico);
    setClienteSelecionado(
      servico.cliente_id ? { value: servico.cliente_id, label: servico.cliente } : null
    );
    setModalAberto(true);
  }

  // Busca Serviços no DB
  async function fetchDadosReais() {
    const { data, error } = await supabase
      .from('servicos_tecnico')
      .select('*')
      .order('tempo', { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setServicos(data || []);
  }

  // Memos e Computados
  const clientesOptions = useMemo(() =>
    clientes.map(c => ({
      value: c.id,
      label: c.nome,
      cliente: c
    })),
    [clientes]
  );

  const isFinalizado = (status) => {
    const s = status?.toLowerCase() || '';
    return s.includes('finalizado') || s.includes('resolvido');
  };

  // Cadastro e Edição de Clientes
  async function cadastrarCliente(e) {
    e.preventDefault();
    setStatusCliente('⏳ Salvando...');

    try {
      let error;

      if (novoCliente.id) {
        ({ error } = await supabase
          .from('clientes')
          .update({
            nome: novoCliente.nome,
            cpf_cnpj: novoCliente.cpf_cnpj,
            email: novoCliente.email,
            telefone: novoCliente.telefone,
            endereco: novoCliente.endereco
          })
          .eq('id', novoCliente.id));
      } else {
        // Cria usuário no Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: novoCliente.email,
          password: novoCliente.senha
        });

        if (authError) throw authError;
        const userId = authData.user.id;

        // Insere na Tabela Clientes
        ({ error } = await supabase
          .from('clientes')
          .insert([{
            id: userId,
            nome: novoCliente.nome,
            cpf_cnpj: novoCliente.cpf_cnpj,
            email: novoCliente.email,
            telefone: novoCliente.telefone,
            endereco: novoCliente.endereco,
            senha: novoCliente.senha
          }]));

        if (error) throw error;

        // Insere em Perfis
        const { error: perfilError } = await supabase
          .from('perfis')
          .insert([{
            id: userId,
            nome_completo: novoCliente.nome,
            email: novoCliente.email,
            telefone: novoCliente.telefone,
            tipo_perfil: 'cliente'
          }]);

        if (perfilError) throw perfilError;
      }

      if (error) throw error;

      toast.success(novoCliente.id ? 'Cliente atualizado!' : 'Cliente cadastrado!');
      setNovoCliente({ nome: '', cpf_cnpj: '', email: '', telefone: '', senha: '', endereco: '' });
      await fetchClientes();
      setAbaAtiva('clientesall');
    } catch (err) {
      console.error(err);
      toast.error('Erro: ' + err.message);
    } finally {
      setStatusCliente('');
    }
  }

  // Deletar Cliente
  async function deletarCliente(id) {
    const confirmou = await Swal.fire({
      title: 'Excluir cliente?',
      text: 'Todos os serviços desse cliente também serão removidos.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#fff',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#334155',
    });

    if (!confirmou.isConfirmed) return;

    await supabase.from('servicos_tecnico').delete().eq('cliente_id', id);
    await supabase.from('perfis').delete().eq('id', id);
    const { error } = await supabase.from('clientes').delete().eq('id', id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Cliente excluído!');
    fetchClientes();
  }

  // Salvar Serviço (Adicionar/Editar)
  async function salvarServico(e) {
    e.preventDefault();
    const payload = {
      ...servicoEditando,
      preco: Number(servicoEditando.preco),
      valor_pecas: Number(servicoEditando.valor_pecas)
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

      toast.success('Serviço salvo!');
      setModalAberto(false);
      fetchDadosReais();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar serviço');
    }
  }

  // Deletar Serviço
  async function excluirServico(id) {
    const result = await Swal.fire({
      title: 'Excluir serviço?',
      text: 'Esta ação não poderá ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#fff',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#334155',
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase
        .from('servicos_tecnico')
        .delete()
        .eq('id', Number(id));

      if (error) throw error;

      setServicos((prev) => prev.filter((s) => String(s.id) !== String(id)));
      toast.success('Serviço excluído!');
    } catch (err) {
      toast.error(err.message);
    }
  }

  // WhatsApp Orçamento
  function enviarOrcamentoWhatsApp() {
    const id = Number(orcamentoData.servicoId);
    const servico = servicos.find(s => s.id === id);

    if (!servico) return toast.warning('Selecione um serviço');

    const fone = servico.telefone?.replace(/\D/g, '');
    if (!fone) return toast.warning('Sem telefone cadastrado');

    const mensagem = `Olá, aqui é da TechNic! Segue orçamento do seu equipamento ${servico.equipamento}: R$ ${orcamentoData.valorTotal}. Fone: ${servico.telefone}`;
    window.open(`https://api.whatsapp.com/send?phone=${fone}&text=${encodeURIComponent(mensagem)}`);
  }

  // Filtragem de clientes na lista
  const clientesFiltrados = useMemo(() => {
    return clientes.filter(c => 
      c.nome?.toLowerCase().includes(pesquisaCliente.toLowerCase()) ||
      c.cpf_cnpj?.includes(pesquisaCliente)
    );
  }, [clientes, pesquisaCliente]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-bold tracking-widest text-xs text-slate-400 uppercase">Verificando Credenciais...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-8 border-b border-slate-800">
          <h1 className="text-blue-500 font-black text-2xl tracking-tighter italic">TECHNIC</h1>
        </div>
        <nav className="flex-1 p-6 space-y-3">
          {[
            { id: 'geral', label: 'Visão Geral', icon: '📊' },
            { id: 'servicos', label: 'Todos os Serviços', icon: '🛠️' },
            { id: 'clientes', label: 'Gestão de Clientes', icon: '👤', color: 'blue' },
            { id: 'clientesall', label: 'Base de Clientes', icon: '📁', color: 'blue' },
            { id: 'relatorios', label: 'Relatórios Técnicos', icon: '📋' },
            { id: 'finalizados', label: 'Finalizados', icon: '✅', color: 'green' }
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setAbaAtiva(item.id)} 
              className={`w-full text-left px-4 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 ${
                abaAtiva === item.id 
                  ? (item.color === 'green' ? 'bg-green-600' : 'bg-blue-600 shadow-lg shadow-blue-900/20') 
                  : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <span className="text-xl">{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-800">
          <button 
            onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} 
            className="w-full bg-red-500/10 text-red-500 py-3 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all"
          >
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* PAINEL PRINCIPAL */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 p-6 border-b border-slate-900 flex justify-between items-center">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">
            Dashboard / {({
              geral: 'Visão Geral',
              servicos: 'Todos os Serviços',
              clientes: 'Gestão de Clientes',
              clientesall: 'Todos os Clientes',
              relatorios: 'Relatórios Técnicos',
              finalizados: 'Finalizados'
            })[abaAtiva]}
          </h2>
          <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-slate-300 italic">{userProfile?.nome_completo} (Atendente)</span>
          </div>
        </header>

        <div className="p-10">
          {/* ABA: VISÃO GERAL */}
          {abaAtiva === 'geral' && (
            <div className="space-y-8">
              {/* CARDS DE CONTAGEM */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Geral', val: servicos.length, color: 'text-blue-500' }, 
                  { label: 'Em Aberto', val: servicos.filter(s => !isFinalizado(s.status)).length, color: 'text-yellow-500' }, 
                  { label: 'Finalizados', val: servicos.filter(s => isFinalizado(s.status)).length, color: 'text-green-500' }
                ].map((card, i) => (
                  <div key={i} className="bg-slate-900 h-32 rounded-3xl border border-slate-800 flex flex-col items-center justify-center shadow-xl">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{card.label}</p>
                    <p className={`text-4xl font-black ${card.color} tracking-tighter`}>{card.val}</p>
                  </div>
                ))}
              </div>

              {/* GRID: ATALHOS E LISTA DE RECENTES */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* COLUNA 1: ATALHOS RÁPIDOS */}
                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-white text-lg font-black tracking-tight mb-2 uppercase">Ações Rápidas</h3>
                    <p className="text-slate-500 text-xs font-semibold mb-6">Atalhos para as tarefas mais comuns do seu dia a dia.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={() => setAbaAtiva('clientes')}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-5 rounded-2xl flex items-center justify-between transition-all shadow-lg text-sm"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-lg">👤</span> Novo Cliente
                      </span>
                      <span className="text-xs">➡️</span>
                    </button>

                    <button 
                      onClick={() => setAbaAtiva('relatorios')}
                      className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 font-bold py-4 px-5 rounded-2xl flex items-center justify-between transition-all text-sm"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-lg">📋</span> Relatórios Técnicos
                      </span>
                      <span className="text-xs">➡️</span>
                    </button>

                    <button 
                      onClick={() => {
                        setNovoCliente({ nome: '', cpf_cnpj: '', email: '', telefone: '', senha: '', endereco: '' });
                        setAbaAtiva('clientesall');
                        toast.info('Use a barra de pesquisa para filtrar um cliente');
                      }}
                      className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 font-bold py-4 px-5 rounded-2xl flex items-center justify-between transition-all text-sm"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-lg">📁</span> Consultar Base
                      </span>
                      <span className="text-xs">➡️</span>
                    </button>
                  </div>
                </div>

                {/* COLUNA 2 e 3: LISTA DE SERVIÇOS EM ABERTO */}
                <div className="lg:col-span-2 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-white text-lg font-black tracking-tight uppercase">Serviços Pendentes</h3>
                      <p className="text-slate-500 text-xs font-semibold">Os 4 serviços mais recentes que necessitam de atenção.</p>
                    </div>
                    <button 
                      onClick={() => setAbaAtiva('servicos')}
                      className="text-xs text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider"
                    >
                      Ver todos
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    {servicos.filter(s => !isFinalizado(s.status)).length === 0 ? (
                      <div className="text-center py-10 text-slate-500 font-medium text-sm">
                        🎉 Nenhum serviço pendente no momento!
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                            <th className="pb-3">Equipamento</th>
                            <th className="pb-3">Cliente</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3 text-right">Preço</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {servicos
                            .filter(s => !isFinalizado(s.status))
                            .slice(0, 4)
                            .map((serv) => (
                              <tr key={serv.id} className="hover:bg-slate-850/20 transition-all font-semibold text-xs">
                                <td className="py-4 text-white font-bold">{serv.equipamento || 'Não especificado'}</td>
                                <td className="py-4 text-slate-300">{serv.cliente || 'Sem Nome'}</td>
                                <td className="py-4">
                                  <span className="px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-bold">
                                    {serv.status || 'Aberto'}
                                  </span>
                                </td>
                                <td className="py-4 text-right text-slate-300">
                                  {serv.preco ? `R$ ${Number(serv.preco).toFixed(2)}` : 'R$ 0,00'}
                                </td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ABA: GERENCIAMENTO DE SERVIÇOS & FINALIZADOS */}
          {(abaAtiva === 'servicos' || abaAtiva === 'finalizados') && (
            <div className="space-y-6">

              {/* TOPO */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">

                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                  Gerenciamento de Serviços
                </h3>

                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">

                  {/* PESQUISA */}
                  <input
                    type="text"
                    placeholder="Pesquisar serviço..."
                    value={pesquisaServico}
                    onChange={(e) => setPesquisaServico(e.target.value)}
                    className="bg-slate-900 border border-slate-700 focus:border-blue-500 outline-none px-5 py-3 rounded-xl text-sm text-white placeholder:text-slate-500 w-full sm:w-72 transition-all"
                  />

                  {/* BOTÃO */}
                  <button
                    onClick={abrirModalNovo}
                    className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40 text-white whitespace-nowrap"
                  >
                    + Novo Serviço
                  </button>

                </div>
              </div>

              {/* TABELA */}
              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">

                  <table className="w-full text-left border-collapse">

                    <thead className="bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="p-6">Equipamento</th>
                        <th className="p-6">Cliente</th>

                        {abaAtiva === 'finalizados' ? (
                          <th className="p-6">Valor</th>
                        ) : (
                          <th className="p-6">Status</th>
                        )}

                        <th className="p-6 text-center">Ações / Data</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">

                      {servicos
                        .filter((s) =>
                          abaAtiva === 'finalizados'
                            ? isFinalizado(s.status)
                            : true
                        )

                        .filter((s) => {
                          const termo = pesquisaServico.toLowerCase()

                          return (
                            s.equipamento?.toLowerCase().includes(termo) ||
                            s.cliente?.toLowerCase().includes(termo) ||
                            s.status?.toLowerCase().includes(termo) ||
                            s.tecnico?.toLowerCase().includes(termo)
                          )
                        })

                        .map((s) => (
                          <Fragment key={s.id}>

                            {/* LINHA PRINCIPAL */}
                            <tr
                              className={`hover:bg-slate-800/30 transition-all font-bold ${
                                servicoExpandido === s.id ? 'bg-slate-800/60' : ''
                              }`}
                            >

                              <td className="p-6 text-slate-200">
                                <div className="flex items-center gap-3">

                                  <button
                                    onClick={() =>
                                      setServicoExpandido(
                                        servicoExpandido === s.id ? null : s.id
                                      )
                                    }
                                    className={`p-2 rounded-lg transition-all ${
                                      servicoExpandido === s.id
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-800 text-slate-500'
                                    }`}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d={
                                          servicoExpandido === s.id
                                            ? 'M5 15l7-7 7 7'
                                            : 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                        }
                                      />
                                    </svg>
                                  </button>

                                  <span>{s.equipamento}</span>
                                </div>
                              </td>

                              <td className="p-6 text-sm text-slate-400">
                                {s.cliente || '---'}
                              </td>

                              <td className="p-6">
                                {abaAtiva === 'finalizados' ? (
                                  <span className="text-emerald-400 font-mono">
                                    R$ {conv(s.preco).toFixed(2)}
                                  </span>
                                ) : (
                                  <span
                                    className={`px-3 py-1 rounded-full text-[10px] uppercase ${
                                      isFinalizado(s.status)
                                        ? 'bg-green-500/10 text-green-500'
                                        : 'bg-yellow-500/10 text-yellow-500'
                                    }`}
                                  >
                                    {s.status}
                                  </span>
                                )}
                              </td>

                              {/* AÇÕES */}
                              <td className="p-6">
                                <div className="flex justify-center items-center gap-4">

                                  {/* EDITAR */}
                                  <button
                                    onClick={() => editarServico(s)}
                                    className="group w-12 h-12 flex items-center justify-center rounded-2xl bg-blue-900/30 hover:bg-blue-600 transition-all duration-300 shadow-lg"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-5 w-5 text-blue-400 group-hover:text-white transition-all"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15.232 5.232l3.536 3.536M9 11l6.232-6.232a2.5 2.5 0 113.536 3.536L12.536 14.536a4 4 0 01-1.414.95L7 17l1.514-4.122A4 4 0 019.95 11z"
                                      />
                                    </svg>
                                  </button>

                                  {/* EXCLUIR */}
                                  <button
                                    onClick={() => excluirServico(s.id)}
                                    className="group w-12 h-12 flex items-center justify-center rounded-2xl bg-red-900/30 hover:bg-red-600 transition-all duration-300 shadow-lg"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-5 w-5 text-red-400 group-hover:text-white transition-all"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7L5 7M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
                                      />
                                    </svg>
                                  </button>

                                </div>
                              </td>
                            </tr>

                            {/* DETALHES */}
                            {servicoExpandido === s.id && (
                              <tr className="bg-slate-950/80">
                                <td
                                  colSpan={4}
                                  className="p-8 border-x-2 border-emerald-500/30"
                                >

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                                    <div>
                                      <span className="text-[10px] font-black text-slate-500 uppercase block mb-2">
                                        Defeito
                                      </span>

                                      <p className="text-sm text-slate-300 italic">
                                        {s.descricao || 'Sem descrição cadastrada'}
                                      </p>
                                    </div>

                                    <div>
                                      <span className="text-[10px] font-black text-slate-500 uppercase block mb-2">
                                        Solução
                                      </span>

                                      <p className="text-sm text-emerald-400 font-medium">
                                        {s.peca_substituida ||
                                          'Nenhuma nota registrada.'}
                                      </p>
                                    </div>

                                    <div className="text-right">
                                      <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                                        Técnico
                                      </span>

                                      <span className="text-blue-400 font-black uppercase text-xs">
                                        {s.tecnico || 'Nenhum'}
                                      </span>

                                      <div className="text-[9px] text-slate-600 mt-2 font-mono">
                                        {s.tempo
                                          ? new Date(s.tempo).toLocaleString('pt-BR')
                                          : 'Data não disponível'}
                                      </div>
                                    </div>

                                  </div>

                                </td>
                              </tr>
                            )}

                          </Fragment>
                        ))}

                    </tbody>

                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ABA: GESTÃO DE CLIENTES */}
          {abaAtiva === 'clientes' && (
            <div className="space-y-10">
              <div className="max-w-3xl mx-auto bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl">
                <h3 className="text-3xl font-black text-white tracking-tighter italic mb-8 uppercase">
                  {novoCliente.id ? 'Editar Cliente' : 'Novo Cliente'}
                </h3>
                <form onSubmit={cadastrarCliente} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-2">Nome Completo</label>
                      <input 
                        type="text" 
                        required 
                        value={novoCliente.nome} 
                        onChange={(e) => setNovoCliente({...novoCliente, nome: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-2">CPF / CNPJ</label>
                      <input 
                        type="text" 
                        value={novoCliente.cpf_cnpj} 
                        onChange={(e) => setNovoCliente({...novoCliente, cpf_cnpj: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-2">E-mail</label>
                      <input 
                        type="email" 
                        required 
                        value={novoCliente.email} 
                        onChange={(e) => setNovoCliente({...novoCliente, email: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-2">Telefone</label>
                      <input 
                        type="text" 
                        value={novoCliente.telefone} 
                        onChange={(e) => setNovoCliente({...novoCliente, telefone: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    {!novoCliente.id && (
                      <div>
                        <label className="text-xs font-bold text-slate-400 block mb-2">Senha Acesso Inicial</label>
                        <input 
                          type="password" 
                          required 
                          value={novoCliente.senha} 
                          onChange={(e) => setNovoCliente({...novoCliente, senha: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                        />
                      </div>
                    )}
                    <div className={novoCliente.id ? "md:col-span-2" : ""}>
                      <label className="text-xs font-bold text-slate-400 block mb-2">Endereço Completo</label>
                      <input 
                        type="text" 
                        value={novoCliente.endereco} 
                        onChange={(e) => setNovoCliente({...novoCliente, endereco: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="submit" 
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-900/40"
                    >
                      {novoCliente.id ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                    </button>
                    {novoCliente.id && (
                      <button 
                        type="button" 
                        onClick={() => setNovoCliente({ nome: '', cpf_cnpj: '', email: '', telefone: '', senha: '', endereco: '' })}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-6 py-4 rounded-xl text-xs uppercase"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                  {statusCliente && <p className="text-xs text-center text-blue-400 font-bold">{statusCliente}</p>}
                </form>
              </div>
            </div>
          )}

          {/* ABA: BASE DE CLIENTES (TODOS OS CLIENTES) */}
          {abaAtiva === 'clientesall' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Base de Clientes</h3>
                <input 
                  type="text" 
                  placeholder="Buscar cliente..." 
                  value={pesquisaCliente}
                  onChange={(e) => setPesquisaCliente(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                      <th className="p-6">Nome</th>
                      <th className="p-6">Contato</th>
                      <th className="p-6">CPF/CNPJ</th>
                      <th className="p-6 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {clientesFiltrados.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition-all font-bold text-sm">
                        <td className="p-6 text-white">{c.nome}</td>
                        <td className="p-6 text-slate-400">
                          <div>{c.email}</div>
                          <div className="text-xs text-slate-500">{c.telefone}</div>
                        </td>
                        <td className="p-6 text-slate-400 font-mono text-xs">{c.cpf_cnpj || '---'}</td>
                        <td className="p-6 text-center">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => { setNovoCliente(c); setAbaAtiva('clientes'); }}
                              className="p-2 rounded-lg bg-blue-900/30 text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                            >
                              <Pencil size={16} />
                            </button>
                            <button 
                              onClick={() => deletarCliente(c.id)}
                              className="p-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-600 hover:text-white transition-all"
                            >
                              <Trash2 size={16} />
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

          {/* ABA: RELATÓRIOS TÉCNICOS */}
          {abaAtiva === 'relatorios' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Relatórios Técnicos</h3>
                <input 
                  type="text" 
                  placeholder="Filtrar relatórios..." 
                  value={buscaRelatorio}
                  onChange={(e) => setBuscaRelatorio(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl p-6">
                <div className="space-y-4">
                  {servicos
                    .filter(s => 
                      s.equipamento?.toLowerCase().includes(buscaRelatorio.toLowerCase()) ||
                      s.cliente?.toLowerCase().includes(buscaRelatorio.toLowerCase()) ||
                      s.tecnico?.toLowerCase().includes(buscaRelatorio.toLowerCase())
                    )
                    .map((s) => (
                      <div key={s.id} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-white text-lg">{s.equipamento}</h4>
                            <p className="text-xs text-slate-400">Cliente: <span className="text-slate-200">{s.cliente || 'Não identificado'}</span></p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 uppercase">
                            Técnico: {s.tecnico || 'Não atribuído'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                          <div>
                            <span className="text-slate-500 font-bold uppercase block mb-1">Diagnóstico / Defeito:</span>
                            <p className="text-slate-300 italic">{s.descricao || 'Nenhuma informação.'}</p>
                          </div>
                          <div>
                            <span className="text-slate-500 font-bold uppercase block mb-1">Solução Aplicada / Peça:</span>
                            <p className="text-slate-300 italic">{s.peca_substituida || 'Nenhuma informação.'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL DE CRIAÇÃO/EDIÇÃO DE SERVIÇO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-white uppercase italic">
              {servicoEditando?.id ? 'Editar Serviço' : 'Novo Serviço'}
            </h3>

            <form onSubmit={salvarServico} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Cliente Vinculado</label>
                <Select
                  options={clientesOptions}
                  value={clienteSelecionado}
                  onChange={(val) => setClienteSelecionado(val)}
                  placeholder="Selecione o cliente..."
                  className="text-black text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Equipamento</label>
                  <input
                    type="text"
                    required
                    value={servicoEditando?.equipamento || ''}
                    onChange={(e) => setServicoEditando({ ...servicoEditando, equipamento: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Status</label>
                  <select
                    value={servicoEditando?.status || 'Em_Analise'}
                    onChange={(e) => setServicoEditando({ ...servicoEditando, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                  >
                    <option value="Em_Analise">Em Análise</option>
                    <option value="Aguardando_Aprovacao">Aguardando Aprovação</option>
                    <option value="Em_Manutencao">Em Manutenção</option>
                    <option value="Finalizado">Finalizado / Resolvido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Descrição do Defeito</label>
                <textarea
                  rows="3"
                  value={servicoEditando?.descricao || ''}
                  onChange={(e) => setServicoEditando({ ...servicoEditando, descricao: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Valor Mão de Obra (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={servicoEditando?.preco || 0}
                    onChange={(e) => setServicoEditando({ ...servicoEditando, preco: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Valor Peças (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={servicoEditando?.valor_pecas || 0}
                    onChange={(e) => setServicoEditando({ ...servicoEditando, valor_pecas: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Peça Substituída / Solução</label>
                <input
                  type="text"
                  value={servicoEditando?.peca_substituida || ''}
                  onChange={(e) => setServicoEditando({ ...servicoEditando, peca_substituida: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl uppercase text-xs tracking-widest transition-all"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-6 py-3 rounded-xl uppercase text-xs"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}