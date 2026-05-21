// ✅ CÓDIGO COMPLETO CORRIGIDO (LÓGICA AJUSTADA, LAYOUT PRESERVADO)

import { useEffect, useState, useMemo } from 'react';
import Select from 'react-select';   
import { useRouter } from 'next/router';
import { supabase } from '../../public/lib/supabase';
import { Fragment } from 'react';

export default function AdminDashboard() {

  

  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  const [pesquisaServico, setPesquisaServico] = useState('');

  const [servicoExpandido, setServicoExpandido] = useState(null);

  const [buscaRelatorio, setBuscaRelatorio] = useState('');

  const [pesquisaTecnico, setPesquisaTecnico] = useState('');

  

  const cadastrarTecnico = async (e) => {
  e.preventDefault();

  setStatusCadastro('⏳ Salvando...');

  try {

    let error;

    if (novoTecnico.id) {

      ({ error } = await supabase
        .from('perfis')
        .update({
          nome_completo: novoTecnico.nome,
          email: novoTecnico.email,
          telefone: novoTecnico.telefone
        })
        .eq('id', novoTecnico.id));

    } else {

      // CRIA USUÁRIO NO AUTH
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: novoTecnico.email,
          password: novoTecnico.senha
        });

      if (authError) throw authError;

      // PEGA ID DO AUTH
      const userId = authData.user.id;

      // INSERE NO PERFIS
      ({ error } = await supabase
        .from('perfis')
        .insert([
          {
            id: userId,
            nome_completo: novoTecnico.nome,
            email: novoTecnico.email,
            telefone: novoTecnico.telefone,
            tipo_perfil: 'tecnico'
          }
        ]));
    }

    if (error) throw error;

    setStatusCadastro(
      novoTecnico.id
        ? '✅ Técnico atualizado!'
        : '✅ Técnico cadastrado!'
    );

    setNovoTecnico({
      nome: '',
      email: '',
      telefone: '',
      senha: ''
    });

    fetchTecnicos();

  } catch (err) {
    console.error(err);
    setStatusCadastro('❌ ' + err.message);
  }
};

const salvarDiagnostico = async () => {
  try {
    const { error } = await supabase
      .from('servicos_tecnico')
      .update({
        peca_substituida: orcamentoData.diagnostico,
        prazo: orcamentoData.prazo,
        preco: Number(orcamentoData.valorTotal)
      })
      .eq('id', Number(orcamentoData.servicoId))

    if (error) throw error;

    alert('Diagnóstico salvo!');
    fetchDadosReais();

  } catch (err) {
    console.error(err);
    alert('Erro ao salvar diagnóstico');
  }
};


  const router = useRouter();

  const [pesquisaCliente, setPesquisaCliente] = useState('');

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  const [servicos, setServicos] = useState([]);

const faturamentoTotal = useMemo(() => {
  return (servicos || []).reduce(
    (acc, s) => acc + (Number(s.preco) || 0),
    0
  );
}, [servicos]);

const gastosPecas = useMemo(() => {
  return (servicos || []).reduce(
    (acc, s) => acc + (Number(s.valor_pecas) || 0),
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
    .reduce((acc, s) => acc + (Number(s.preco) || 0), 0);
}, [servicos]);
  
  const [abaAtiva, setAbaAtiva] = useState('geral');

  const [tecnicos, setTecnicos] = useState([]);
  const [novoTecnico, setNovoTecnico] = useState({
  nome: '',
  email: '',
  telefone: '',
  senha: ''
});
  const [statusCadastro, setStatusCadastro] = useState('');

  const [clientes, setClientes] = useState([]);

 const clientesOptions = useMemo(() =>
  clientes.map(c => ({
    value: c.id,
    label: c.nome,
    cliente: c
  })),
  [clientes]
);

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

  useEffect(() => {
  carregarDadosIniciais();
}, []);

async function carregarDadosIniciais() {
  try {
    await Promise.all([
      fetchClientes(),
      fetchTecnicos(),
      fetchDadosReais()
    ]);
  } catch (err) {
    console.error(err);
  }
}

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
      router.push('');
      return;
    }

    setUserProfile(profile);
    setLoading(false);
  }

  async function fetchDadosReais() {

  const { data, error } = await supabase
    .from('servicos_tecnico')
    .select('*')
    .order('tempo', { ascending: false });

  console.log(data);

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

    let error;

    // EDITAR CLIENTE
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

      // ✅ CRIA USUÁRIO NO AUTH
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: novoCliente.email,
          password: novoCliente.senha
        });

      if (authError) throw authError;

      // ✅ PEGA ID DO AUTH
      const userId = authData.user.id;

      // ✅ INSERE NA TABELA CLIENTES
      ({ error } = await supabase
        .from('clientes')
        .insert([
          {
            id: userId,
            nome: novoCliente.nome,
            cpf_cnpj: novoCliente.cpf_cnpj,
            email: novoCliente.email,
            telefone: novoCliente.telefone,
            endereco: novoCliente.endereco,
            senha: novoCliente.senha
          }
        ]));

      if (error) throw error;

      // ✅ INSERE EM PERFIS
      const { error: perfilError } = await supabase
  .from('perfis')
  .insert([
    {
      id: userId,
      nome_completo: novoCliente.nome,
      email: novoCliente.email,
      telefone: novoCliente.telefone,
      tipo_perfil: 'cliente'
    }
  ]);

      if (perfilError) throw perfilError;
    }

    if (error) throw error;

    setStatusCliente(
      novoCliente.id
        ? '✅ Cliente atualizado!'
        : '✅ Cliente cadastrado!'
    );

    // LIMPA FORMULÁRIO
    setNovoCliente({
      nome: '',
      cpf_cnpj: '',
      email: '',
      telefone: '',
      senha: '',
      endereco: ''
    });

    // ATUALIZA LISTA
    await fetchClientes();

    // VAI PRA LISTA
    setAbaAtiva('clientesall');

  } catch (err) {
    console.error(err);
    setStatusCliente('❌ ' + err.message);
  }
}

  async function deletarCliente(id) {
  if (!confirm('Excluir cliente?')) return;

  await supabase
    .from('servicos_tecnico')
    .delete()
    .eq('cliente_id', id);

  await supabase
    .from('perfis')
    .delete()
    .eq('id', id);

  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  alert('Cliente excluído!');
  fetchClientes();
}


  async function excluirTecnico(id) {
    if (confirm('Excluir técnico?')) {
      await supabase.from('perfis').delete().eq('id', id);
      fetchTecnicos();
    }
  }

  function editarServico(servico) {

  const cliente = clientes.find(
    (c) => String(c.id) === String(servico.cliente_id)
  );

  setClienteSelecionado(
    cliente
      ? {
          value: cliente.id,
          label: cliente.nome
        }
      : null
  );

  setServicoEditando({
    ...servico
  });

  setModalAberto(true);
}

  const abrirModalNovo = () => {
    setServicoEditando({ equipamento: '', cliente: '', cliente_id: '', cpf_cnpj: '', endereco: '', status: 'Em Análise', preco: 0, valor_pecas: 0, telefone: '' });
    setModalAberto(true);
  };

  async function salvarServico(e) {
  e.preventDefault();

    console.log('SERVICO:', servicoEditando);

  const payload = {
  ...servicoEditando,
  cliente_id: servicoEditando.cliente_id,
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

    alert('✅ Serviço salvo!');
    setModalAberto(false);
    fetchDadosReais();

  } catch (err) {
    console.error('ERRO AO SALVAR:', err);
    alert('❌ Erro: ' + err.message);
  }
}

 async function excluirServico(id) {

  if (!confirm('Excluir serviço?')) return;

  try {

    const { data, error } = await supabase
      .from('servicos_tecnico')
      .delete()
      .eq('id', Number(id))
      .select();

    console.log('DELETE:', data);
    console.log('ERROR:', error);

    if (error) throw error;

    setServicos((prev) =>
      prev.filter((s) => String(s.id) !== String(id))
    );

    alert('✅ Excluído');

  } catch (err) {
    console.error(err);
    alert(err.message);
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

if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      CARREGANDO...
    </div>
  );
}

if (!userProfile) {
  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      CARREGANDO PERFIL...
    </div>
  );
}

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
            { id: 'clientesall', label: 'Base de Clientes', icon: '📁', color: 'blue' },
            { id: 'orcamentos', label: 'Gerar Orçamento', icon: '📝', color: 'blue' },
            { id: 'tecnicos', label: 'Gestão de Técnicos', icon: '👥', color: 'indigo' },
            { id: 'tecnicosall', label: 'Base dos Técnicos', icon: '🧑‍🔧', color: 'indigo' },
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
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">
  Dashboard / {({
    geral: 'Visão Geral',
    servicos: 'Todos os Serviços',
    clientes: 'Gestão de Clientes',
    clientesall: 'Todos os Clientes',
    orcamentos: 'Gerar Orçamento',
    tecnicos: 'Gestão de Técnicos',
    tecnicosall: 'Todos os Técnicos',
    relatorios: 'Relatórios Técnicos',
    finalizados: 'Finalizados'
  })[abaAtiva]}
</h2>
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
                  <p className="text-[9px] text-slate-600 font-bold italic uppercase tracking-widest underline decoration-red-500/30">Lendo coluna: vaor_pecas</p>
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

    {/* FORMULÁRIO */}
    <div className="max-w-3xl mx-auto bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl">
      <h3 className="text-3xl font-black text-white tracking-tighter italic mb-8 uppercase">
        {novoCliente.id ? 'Editar Cliente' : 'Novo Cliente'}
      </h3>

      <form onSubmit={cadastrarCliente} className="space-y-6">

        {/* LINHA 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* NOME */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Nome Completo
            </label>

            <input
              type="text"
              className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold"
              value={novoCliente.nome}
              onChange={(e) =>
                setNovoCliente({
                  ...novoCliente,
                  nome: e.target.value
                })
              }
              required
            />
          </div>

          {/* CPF / CNPJ */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
              CPF / CNPJ
            </label>

            <input
              type="text"
              className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold"
              value={novoCliente.cpf_cnpj || ''}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, '');

                if (v.length <= 11) {
                  v = v
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d{1,2})/, '$1-$2');
                } else {
                  v = v
                    .replace(/^(\d{2})(\d)/, '$1.$2')
                    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                    .replace(/\.(\d{3})(\d)/, '.$1/$2')
                    .replace(/(\d{4})(\d)/, '$1-$2');
                }

                setNovoCliente((prev) => ({
                  ...prev,
                  cpf_cnpj: v
                }));
              }}
              maxLength={18}
              required
            />
          </div>

        </div>

        {/* LINHA 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* EMAIL */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
              E-mail
            </label>

            <input
              type="email"
              className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold"
              value={novoCliente.email}
              onChange={(e) =>
                setNovoCliente({
                  ...novoCliente,
                  email: e.target.value
                })
              }
            />
          </div>

          {/* TELEFONE */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Telefone
            </label>

            <input
              type="text"
              className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold"
              value={novoCliente.telefone || ''}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, '');

                v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
                v = v.replace(/(\d{5})(\d)/, '$1-$2');

                setNovoCliente((prev) => ({
                  ...prev,
                  telefone: v
                }));
              }}
              maxLength={15}
              required
            />
          </div>

        </div>

        {/* LINHA 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* SENHA */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Senha
            </label>

            <input
              type="password"
              className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold"
              value={novoCliente.senha || ''}
              onChange={(e) =>
                setNovoCliente({
                  ...novoCliente,
                  senha: e.target.value
                })
              }
              placeholder="Digite a senha"
              required={!novoCliente.id}
            />
          </div>
        </div>

        {/* ENDEREÇO */}
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
            Endereço Completo
          </label>

          <input
            type="text"
            className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-600 font-bold"
            value={novoCliente.endereco}
            onChange={(e) =>
              setNovoCliente({
                ...novoCliente,
                endereco: e.target.value
              })
            }
            required
          />
        </div>

        {/* BOTÕES */}
        <div className="flex gap-4">

          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-xs transition-all"
          >
            {novoCliente.id ? 'Atualizar Cliente' : 'Salvar Cliente'}
          </button>

          {novoCliente.id && (
            <button
              type="button"
              onClick={() =>
                setNovoCliente({
                  nome: '',
                  cpf_cnpj: '',
                  email: '',
                  telefone: '',
                  senha: '',
                  endereco: ''
                })
              }
              className="px-8 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl uppercase text-[10px]"
            >
              Cancelar
            </button>
          )}

        </div>

      </form>

      {/* STATUS */}
      {statusCliente && (
        <div
          className={`mt-8 p-4 rounded-2xl text-center text-xs font-black uppercase ${
            statusCliente.includes('✅')
              ? 'bg-green-500/10 text-green-500'
              : 'bg-red-500/10 text-red-500'
          }`}
        >
          {statusCliente}
        </div>
      )}

    </div>
  </div>
)}


{/* --- ABA TODOS OS CLIENTES --- */}
{abaAtiva === 'clientesall' && (
  <div className="space-y-6">

    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">

      <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase">
        Todos os Clientes
      </h3>

      <div className="flex items-center gap-4">

        {/* PESQUISA */}
        <input
          type="text"
          placeholder="Pesquisar cliente..."
          value={pesquisaCliente || ''}
          onChange={(e) => setPesquisaCliente(e.target.value)}
          className="bg-slate-900 border-2 border-slate-800 px-5 py-3 rounded-2xl text-white outline-none focus:border-blue-600 font-bold w-72"
        />

        {/* TOTAL */}
        <span className="bg-blue-600 text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap">
          {clientes.filter((c) =>
            c.nome?.toLowerCase().includes((pesquisaCliente || '').toLowerCase())
          ).length} clientes
        </span>

      </div>
    </div>

    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">

      <div className="overflow-x-auto">
        <table className="w-full text-left">

          <thead className="bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="p-6">Cliente</th>
              <th className="p-6">CPF / CNPJ</th>
              <th className="p-6">Telefone</th>
              <th className="p-6">E-mail</th>
              <th className="p-6">Senha</th>
              <th className="p-6 text-center">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {clientes
              .filter((c) =>
                c.nome?.toLowerCase().includes((pesquisaCliente || '').toLowerCase())
              )
              .map((c) => (
              <tr
                key={c.id}
                className="hover:bg-slate-800/30 transition-all font-bold"
              >
                <td className="p-6">
                  <div className="text-slate-200">
                    {c.nome}
                  </div>

                  <div className="text-[10px] text-slate-500 uppercase font-normal">
                    {c.endereco}
                  </div>
                </td>

                <td className="p-6 text-slate-400 font-mono">
                  {c.cpf_cnpj}
                </td>

                <td className="p-6 text-slate-400">
                  {c.telefone}
                </td>

                <td className="p-6 text-slate-400">
                  {c.email || '---'}
                </td>

                {/* SENHA */}
                <td className="p-6 text-slate-400 font-mono">
                  {c.senha || '---'}
                </td>

                <td className="p-6">
                  <div className="flex justify-center gap-3">

                    {/* EDITAR */}
                    <button
                      onClick={() => {
                        setNovoCliente(c);
                        setAbaAtiva('clientes');

                        window.scrollTo({
                          top: 0,
                          behavior: 'smooth'
                        });
                      }}
                      className="p-3 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-2xl transition-all"
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
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>

                    {/* EXCLUIR */}
                    <button
                      onClick={() => deletarCliente(c.id)}
                      className="p-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl transition-all"
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
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
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
                        const s = servicos.find(item => Number(item.id) === Number(e.target.value));
                        setOrcamentoData({...orcamentoData, servicoId: e.target.value, valorTotal: s?.preco || 0});
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

        {/* NOME */}
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
            Nome
          </label>

          <input 
            type="text" 
            className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-indigo-600 font-bold" 
            value={novoTecnico.nome} 
            onChange={(e) =>
              setNovoTecnico({
                ...novoTecnico,
                nome: e.target.value
              })
            } 
            required 
          />
        </div>

        {/* EMAIL */}
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
            E-mail
          </label>

          <input 
            type="email" 
            className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-indigo-600 font-bold" 
            value={novoTecnico.email} 
            onChange={(e) =>
              setNovoTecnico({
                ...novoTecnico,
                email: e.target.value
              })
            } 
            required 
          />
        </div>

        {/* TELEFONE */}
<div>
  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
    Telefone
  </label>

  <input
    type="text"
    placeholder="(88) 99999-9999"
    className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-indigo-600 font-bold"
    value={novoTecnico.telefone || ''}
    onChange={(e) => {

      let valor = e.target.value.replace(/\D/g, '');

      valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
      valor = valor.replace(/(\d{5})(\d)/, '$1-$2');

      setNovoTecnico({
        ...novoTecnico,
        telefone: valor
      });
    }}
    maxLength={15}
    required
  />
</div>

        {/* SENHA */}
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
            {novoTecnico.id
              ? 'Nova Senha (deixe em branco para manter)'
              : 'Senha'}
          </label>

          <input 
            type="password" 
            className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-indigo-600 font-bold" 
            value={novoTecnico.senha || ''} 
            onChange={(e) =>
              setNovoTecnico({
                ...novoTecnico,
                senha: e.target.value
              })
            } 
            required={!novoTecnico.id} 
          />
        </div>

        <div className="flex gap-4">

          {/* SALVAR */}
          <button
            type="submit"
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-xs transition-all"
          >
            {novoTecnico.id
              ? 'Atualizar Técnico'
              : 'Finalizar Cadastro'}
          </button>

          {/* CANCELAR */}
          <button
            type="button"
            onClick={() => {
              setNovoTecnico({
                nome: '',
                email: '',
                telefone: '',
                senha: ''
              });

              setStatusCadastro('');
            }}
            className="px-8 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl uppercase text-[10px] transition-all"
          >
            Cancelar
          </button>

        </div>
      </form>

      {statusCadastro && (
        <div
          className={`mt-8 p-4 rounded-2xl text-center text-xs font-black uppercase ${
            statusCadastro.includes('✅')
              ? 'bg-green-500/10 text-green-500'
              : 'bg-red-500/10 text-red-500'
          }`}
        >
          {statusCadastro}
        </div>
      )}
    </div>
  </div>
)}

{/* --- ABA TODOS OS TÉCNICOS --- */}
{abaAtiva === 'tecnicosall' && (
  <div className="space-y-6">

    {/* TOPO */}
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">

      <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase">
        Todos os Técnicos
      </h3>

      <div className="flex items-center gap-3">

        {/* PESQUISA */}
        <input
          type="text"
          placeholder="Pesquisar técnico..."
          value={pesquisaTecnico || ''}
          onChange={(e) => setPesquisaTecnico(e.target.value)}
          className="bg-slate-900 border-2 border-slate-800 px-4 py-3 rounded-2xl text-white outline-none focus:border-indigo-600 font-bold text-sm w-64"
        />

        {/* QUANTIDADE */}
        <span className="bg-indigo-600 text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap">
          {tecnicos.filter((t) =>
            (t.nome_completo || t.nome || '')
              .toLowerCase()
              .includes((pesquisaTecnico || '').toLowerCase())
          ).length} técnicos
        </span>

      </div>
    </div>

    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">

      <div className="overflow-x-auto">
        <table className="w-full text-left">

          <thead className="bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="p-6">Nome</th>
              <th className="p-6">E-mail</th>
              <th className="p-6">Telefone</th>
              <th className="p-6 text-center">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">

            {tecnicos
              .filter((t) =>
                (t.nome_completo || t.nome || '')
                  .toLowerCase()
                  .includes((pesquisaTecnico || '').toLowerCase())
              )
              .map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-800/30 transition-all font-bold"
                >
                  <td className="p-6 text-slate-200">
                    {t.nome_completo || t.nome}
                  </td>

                  <td className="p-6 text-slate-400">
                    {t.email}
                  </td>

                  {/* TELEFONE */}
                  <td className="p-6 text-slate-400">
                    {t.telefone || 'Não informado'}
                  </td>

                  <td className="p-6">
                    <div className="flex justify-center gap-3">

                      {/* EDITAR */}
                      <button
                        onClick={() => {
                          setNovoTecnico({
                            ...t,
                            nome: t.nome_completo || t.nome,
                            senha: ''
                          });

                          setAbaAtiva('tecnicos');

                          window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                          });
                        }}
                        className="p-3 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-500 hover:text-white rounded-2xl transition-all"
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
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>

                      {/* EXCLUIR */}
                      <button
                        onClick={() => excluirTecnico(t.id)}
                        className="p-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl transition-all"
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
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
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

 {abaAtiva === 'relatorios' && (
  <div className="space-y-6">
    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
      
      {/* HEADER PRINCIPAL COM BUSCA */}
      <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row md:justify-between md:items-center gap-6 bg-slate-800/20">
        <div>
          <h3 className="font-black text-2xl italic text-slate-100 uppercase tracking-tighter leading-none">
            Relatório de Serviços
          </h3>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mt-2">Histórico de Aparelhos e Soluções Aplicadas</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text"
              placeholder="BUSCAR CLIENTE OU APARELHO..."
              value={buscaRelatorio}
              onChange={(e) => setBuscaRelatorio(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-[10px] font-bold tracking-widest text-white rounded-2xl py-3 pl-12 pr-6 w-64 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-700"
            />
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl min-w-[120px]">
            <span className="text-[10px] font-black text-emerald-500 uppercase block leading-none mb-1 text-center">Total Concluído</span>
            <span className="text-xl font-black text-emerald-400 block leading-none text-center">
              {servicos.filter(s => isFinalizado(s.status)).length}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-800/50 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
              <th className="p-6 text-left w-[180px]">Aparelho</th>
              <th className="p-6 text-left w-[150px]">Cliente</th>
              <th className="p-6 text-left w-[150px]">Técnico</th>
              <th className="p-6 text-left">Problema & Solução</th>
              <th className="p-6 text-center w-[120px]">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {servicos
              .filter(s => isFinalizado(s.status))
              .filter(s => 
                s.cliente?.toLowerCase().includes(buscaRelatorio.toLowerCase()) || 
                s.equipamento?.toLowerCase().includes(buscaRelatorio.toLowerCase()) ||
                s.id?.toString().includes(buscaRelatorio)
              )
              .map(s => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors group">
                  
                  {/* COLUNA APARELHO */}
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-slate-100 text-sm font-black uppercase italic tracking-tight truncate">
                        {s.equipamento}
                      </span>
                      <span className="text-[9px] font-mono text-slate-600 uppercase mt-1">
                        Ref: {s.id?.toString().slice(-8)}
                      </span>
                    </div>
                  </td>

                  {/* COLUNA CLIENTE */}
                  <td className="p-6">
                    <span className="text-emerald-400 text-xs font-black uppercase tracking-widest truncate block">
                      {s.cliente || 'Consumidor'}
                    </span>
                  </td>

                  {/* COLUNA TÉCNICO */}
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                        {s.tecnico || 'Yuri'}
                      </span>
                    </div>
                  </td>

                  {/* COLUNA PROBLEMA & SOLUÇÃO */}
                  <td className="p-6">
                    <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-3 space-y-2">
                      <p className="text-[10px] text-slate-400 leading-tight">
                        <span className="text-amber-500/80 font-black mr-2 uppercase text-[8px]">Defeito:</span>
                        {/* AQUI LÊ A DESCRIÇÃO DO BD */}
                        {s.descricao || 'Não informado'}
                      </p>
                      <p className="text-[11px] text-slate-200 leading-tight font-medium">
                        <span className="text-emerald-500 font-black mr-2 uppercase text-[8px]">Peça/Reparo:</span>
                        {s.logs || s.nota_tecnica || 'Finalizado conforme padrão.'}
                      </p>
                    </div>
                  </td>

                  {/* COLUNA AÇÕES */}
                  <td className="p-6 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => editarServico(s)} className="w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 hover:text-white hover:bg-blue-600 rounded-lg transition-all border border-slate-700 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => excluirServico(s.id)} className="w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 hover:text-white hover:bg-red-600 rounded-lg transition-all border border-slate-700 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-center">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
          Controle de Ordens Finalizadas
        </p>
      </div>
    </div>
  </div>
)} 

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
                              {s.tecnico || 'Yuri'}
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
                  setServicoEditando({
                    ...servicoEditando,
                    equipamento: e.target.value
                  })
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
                noOptionsMessage={() => "Nenhum cliente encontrado"}
                value={clienteSelecionado}

  getOptionLabel={(option) => option.label}
  getOptionValue={(option) => String(option.value)}

                onChange={(selected) => {

  setClienteSelecionado(selected);

  const cliente = selected.cliente;

  setServicoEditando((prev) => ({
    ...prev,
    cliente_id: cliente.id,
    cliente: cliente.nome,
    telefone: cliente.telefone || '',
    cpf_cnpj: cliente.cpf_cnpj || '',
    endereco: cliente.endereco || ''
  }));

}}

                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    padding: '4px',
                    boxShadow: 'none',
                    '&:hover': { borderColor: '#3b82f6' }
                  }),

                  menu: (base) => ({
                    ...base,
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    zIndex: 9999
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
                    color: 'white'
                  }),

                  input: (base) => ({
                    ...base,
                    color: 'white'
                  }),

                  placeholder: (base) => ({
                    ...base,
                    color: '#64748b'
                  })
                }}
              />
            </div>
          </div>

          {/* LINHA 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* CPF / CNPJ */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                CPF / CNPJ
              </label>

              <input
                className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white font-bold outline-none focus:border-blue-600"
                value={servicoEditando.cpf_cnpj || ''}
                onChange={e => {
                  let value = e.target.value.replace(/\D/g, '');

                  // CPF
                  if (value.length <= 11) {
                    value = value
                      .replace(/^(\d{3})(\d)/, '$1.$2')
                      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
                      .replace(/\.(\d{3})(\d)/, '.$1-$2');
                  }

                  // CNPJ
                  else {
                    value = value
                      .replace(/^(\d{2})(\d)/, '$1.$2')
                      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                      .replace(/\.(\d{3})(\d)/, '.$1/$2')
                      .replace(/(\d{4})(\d)/, '$1-$2');
                  }

                  setServicoEditando({
                    ...servicoEditando,
                    cpf_cnpj: value
                  });
                }}
                required
              />
            </div>

            {/* ENDEREÇO */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                Endereço Completo
              </label>

              <input
                className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white font-bold outline-none focus:border-blue-600"
                value={servicoEditando.endereco || ''}
                onChange={e =>
                  setServicoEditando({
                    ...servicoEditando,
                    endereco: e.target.value
                  })
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
                value={servicoEditando.preco || ''}
                onChange={e =>
                  setServicoEditando({
                    ...servicoEditando,
                    preco: e.target.value
                  })
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
                value={servicoEditando.valor_pecas || ''}
                onChange={e =>
                  setServicoEditando({
                    ...servicoEditando,
                    valor_pecas: e.target.value
                  })
                }
              />
            </div>
          </div>

          {/* LINHA 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* TELEFONE */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                Telefone do Cliente
              </label>

              <input
                className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white font-bold outline-none focus:border-blue-600"
                value={servicoEditando.telefone || ''}
                onChange={e => {
                  let value = e.target.value.replace(/\D/g, '').slice(0, 11);

                  value = value
                    .replace(/^(\d{2})(\d)/g, '($1) $2')
                    .replace(/(\d)(\d{4})$/, '$1-$2');

                  setServicoEditando({
                    ...servicoEditando,
                    telefone: value
                  });
                }}
                required
              />
            </div>

            {/* STATUS */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                Status Atual
              </label>

              <select
                className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl text-white font-bold outline-none focus:border-blue-600"
                value={servicoEditando.status}
                onChange={e =>
                  setServicoEditando({
                    ...servicoEditando,
                    status: e.target.value  
                  })
                }
              >
                <option value="Em Análise">Em Análise</option>
                <option value="Aguardando Aprovação">Aguardando Aprovação</option>
                <option value="Em Manutenção">Em Manutenção</option>
                <option value="Pronto - Aguardando Retirada">
                  Pronto - Aguardando Retirada
                </option>
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
  </div>
  );
  }