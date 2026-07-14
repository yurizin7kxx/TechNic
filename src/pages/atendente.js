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
            { id: 'orcamentos', label: 'Gerar Orçamento', icon: '📝', color: 'blue' },
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
              orcamentos: 'Gerar Orçamento',
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
                      onClick={() => setAbaAtiva('orcamentos')}
                      className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 font-bold py-4 px-5 rounded-2xl flex items-center justify-between transition-all text-sm"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-lg">📝</span> Criar Orçamento
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
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nome Completo</label>
                      <input
                        type="text"
                        className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold"
                        value={novoCliente.nome}
                        onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">CPF / CNPJ</label>
                      <input
                        type="text"
                        className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold"
                        value={novoCliente.cpf_cnpj || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, '');
                          if (v.length <= 11) {
                            v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2');
                          } else {
                            v = v.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
                          }
                          setNovoCliente((prev) => ({ ...prev, cpf_cnpj: v }));
                        }}
                        maxLength={18}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">E-mail</label>
                      <input
                        type="email"
                        className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold"
                        value={novoCliente.email}
                        onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Telefone</label>
                      <input
                        type="text"
                        className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold"
                        value={novoCliente.telefone || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, '');
                          v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
                          v = v.replace(/(\d{5})(\d)/, '$1-$2');
                          setNovoCliente((prev) => ({ ...prev, telefone: v }));
                        }}
                        maxLength={15}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Senha de Acesso</label>
                      <input
                        type="password"
                        className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold"
                        value={novoCliente.senha || ''}
                        onChange={(e) => setNovoCliente({ ...novoCliente, senha: e.target.value })}
                        placeholder="Digite a senha"
                        required={!novoCliente.id}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Endereço Completo</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold"
                      value={novoCliente.endereco}
                      onChange={(e) => setNovoCliente({ ...novoCliente, endereco: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex gap-4">  
                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-xs transition-all">
                      {novoCliente.id ? 'Atualizar Cliente' : 'Salvar Cliente'}
                    </button>
                    {novoCliente.id && (
                      <button
                        type="button"
                        onClick={() => setNovoCliente({ nome: '', cpf_cnpj: '', email: '', telefone: '', senha: '', endereco: '' })}
                        className="px-8 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl uppercase text-[10px]"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ABA: BASE DE CLIENTES */}
          {abaAtiva === 'clientesall' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase">Base de Clientes</h3>
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou CPF..."
                  value={pesquisaCliente}
                  onChange={(e) => setPesquisaCliente(e.target.value)}
                  className="bg-slate-900 border-2 border-slate-800 p-3 px-6 rounded-2xl outline-none focus:border-blue-500 text-white font-bold w-full md:w-80"
                />
              </div>

              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-850 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                      <th className="p-6">Nome</th>
                      <th className="p-6">CPF/CNPJ</th>
                      <th className="p-6">Contato</th>
                      <th className="p-6">Endereço</th>
                      <th className="p-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {clientesFiltrados.map((cli) => (
                      <tr key={cli.id} className="hover:bg-slate-850/40 transition-all font-medium text-sm">
                        <td className="p-6 text-white font-bold">{cli.nome}</td>
                        <td className="p-6 text-slate-400">{cli.cpf_cnpj || '---'}</td>
                        <td className="p-6 text-slate-300">
                          <div>{cli.email}</div>
                          <div className="text-xs text-slate-500 font-semibold">{cli.telefone}</div>
                        </td>
                        <td className="p-6 text-slate-400 text-xs">{cli.endereco || '---'}</td>
                        <td className="p-6 text-right space-x-2">
                          <td className="p-4 text-center space-x-3 whitespace-nowrap">
  {/* BOTÃO EDITAR (CANETA) */}
  <button 
    onClick={() => {
      setNovoCliente(cli); // Ajuste a variável conforme o seu map
      setAbaAtiva('clientes');
    }} 
    className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 transition-all border border-blue-500/5 shadow-lg"
    title="Editar"
  >
    <Pencil className="w-5 h-5" />
  </button>

  {/* BOTÃO EXCLUIR (LIXEIRA) */}
  <button 
    onClick={() => deletarCliente(cli.id)} // Ajuste a função conforme seu código
    className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all border border-red-500/5 shadow-lg"
    title="Excluir"
  >
    <Trash2 className="w-5 h-5" />
  </button>
</td>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}