'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../public/lib/supabase';
import { 
  ClipboardList, Smartphone, Wrench, 
  RefreshCcw, User, UserPlus, X, 
  DollarSign, ShieldCheck, Search
} from 'lucide-react';

export default function DashboardAtendimento() {
  const [abaAtiva, setAbaAtiva] = useState('os'); 
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [osSelecionada, setOsSelecionada] = useState(null);
  
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [novoCliente, setNovoCliente] = useState({ nome_com: '', email: '', telefone: '' });

  // Busca Ordens de Serviço
  const fetchOrdens = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('servicos_tecnico')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) console.error("❌ Erro OS:", error.message);
    else setOrdens(data || []);
    setLoading(false);
  }, []);

  // Busca apenas quem tem tipo_perfil = 'cliente'
  const fetchClientes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('perfis') 
      .select('id, nome_com, email, telefone, tipo_perfil')
      .eq('tipo_perfil', 'cliente')
      .order('nome_com', { ascending: true });
    
    if (error) {
      console.error("❌ Erro na conexão com Clientes:", error.message);
    } else {
      setClientes(data || []);
    }
    setLoading(false);
  }, []);

  // Cadastro de Cliente
  const handleCadastrarCliente = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    // Garante que os dados estão limpos e com o tipo correto
    const dadosParaEnviar = { 
      nome_com: novoCliente.nome_com.trim(), 
      email: novoCliente.email.trim().toLowerCase(), 
      telefone: novoCliente.telefone.trim(), 
      tipo_perfil: 'cliente' 
    };

    const { error } = await supabase
      .from('perfis')
      .insert([dadosParaEnviar]);

    if (error) {
      console.error("❌ Erro ao cadastrar:", error.message);
      alert("Erro ao cadastrar: " + error.message);
    } else {
      setMostrarModalCliente(false);
      setNovoCliente({ nome_com: '', email: '', telefone: '' });
      await fetchClientes(); // Atualiza a lista
      alert("Cliente cadastrado com sucesso!");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrdens();
    fetchClientes();
  }, [fetchOrdens, fetchClientes]);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6 text-2xl font-black flex items-center gap-2 border-b border-slate-800">
          <div className="bg-blue-500 p-1.5 rounded-lg text-white shadow-lg shadow-blue-500/20">
            <Wrench size={20} />
          </div>
          <span>Tech<span className="text-blue-400">Master</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 text-sm font-medium">
          <p className="text-slate-500 text-[10px] uppercase tracking-widest ml-2 mb-2">Principal</p>
          <button 
            onClick={() => setAbaAtiva('os')} 
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${abaAtiva === 'os' ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <ClipboardList size={18} /> Ordens de Serviço
          </button>
          <button 
            onClick={() => setAbaAtiva('clientes')} 
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${abaAtiva === 'clientes' ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <User size={18} /> Clientes
          </button>
          
          <div className="pt-4 mt-4 border-t border-slate-800">
            <p className="text-slate-500 text-[10px] uppercase tracking-widest ml-2 mb-2">Administração</p>
            <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition text-slate-400">
              <DollarSign size={18} /> Financeiro
            </button>
            <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition text-slate-400">
              <ShieldCheck size={18} /> Garantias
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b flex items-center justify-between px-8 shadow-sm z-10">
          <h1 className="text-xl font-black uppercase tracking-tight">
            {abaAtiva === 'os' ? 'Painel de Serviços' : 'Gestão de Clientes'}
          </h1>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={abaAtiva === 'os' ? fetchOrdens : fetchClientes} 
              disabled={loading}
              className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 border border-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            {abaAtiva === 'clientes' && (
              <button onClick={() => setMostrarModalCliente(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95">
                <UserPlus size={18} /> Novo Cliente
              </button>
            )}
          </div>
        </header>

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-auto p-8">
          {abaAtiva === 'os' ? (
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-8 space-y-4">
                {ordens.length > 0 ? ordens.map((os) => (
                  <div 
                    key={os.id} 
                    onClick={() => setOsSelecionada(os)} 
                    className={`group p-5 bg-white rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all hover:shadow-md ${osSelecionada?.id === os.id ? 'border-blue-500 ring-4 ring-blue-50' : 'border-white shadow-sm'}`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`p-3 rounded-xl ${osSelecionada?.id === os.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Smartphone size={24} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight">{os.equipamento}</h3>
                        <p className="text-sm text-slate-500 font-medium">{os.cliente}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider ${os.status === 'Finalizado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {os.status}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">Ticket #{os.id}</p>
                    </div>
                  </div>
                )) : (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-medium">
                    Nenhuma ordem de serviço registrada.
                  </div>
                )}
              </div>

              <div className="hidden lg:block col-span-4">
                {osSelecionada ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 sticky top-4 shadow-xl shadow-slate-200/50">
                    <h2 className="text-2xl font-black text-slate-900 mb-6">Detalhes</h2>
                    <div className="space-y-5">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Relato Técnico</label>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed mt-2 italic">"{osSelecionada.descricao}"</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Mão de Obra</label>
                          <p className="text-blue-600 font-bold text-lg">R$ {osSelecionada.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Técnico</label>
                          <p className="text-slate-800 font-bold text-sm truncate">{osSelecionada.tecnico || 'Aguardando'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-300 text-slate-400 space-y-3">
                    <Search size={32} className="opacity-20" />
                    <p className="font-bold uppercase text-[10px] tracking-widest">Selecione uma OS</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 border-b">
                  <tr>
                    <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Informações</th>
                    <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">E-mail</th>
                    <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Telefone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientes.length > 0 ? clientes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">
                            {c.nome_com?.charAt(0).toUpperCase() || 'C'}
                          </div>
                          <span className="font-bold text-slate-800 uppercase text-xs">{c.nome_com}</span>
                        </div>
                      </td>
                      <td className="p-5 text-slate-500 text-sm font-medium italic">{c.email}</td>
                      <td className="p-5">
                        <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-600 text-[11px] font-bold">
                          {c.telefone || '(00) 00000-0000'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3" className="p-12 text-center text-slate-400 italic font-medium">Nenhum cliente encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Cadastro de Cliente */}
      {mostrarModalCliente && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b flex justify-between items-center bg-white">
              <div>
                <h2 className="text-2xl font-black uppercase text-slate-900">Cadastro</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Novo Perfil de Cliente</p>
              </div>
              <button onClick={() => setMostrarModalCliente(false)} className="text-slate-300 hover:text-slate-900 transition-colors p-2 bg-slate-50 rounded-full"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleCadastrarCliente} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 ml-1">Nome Completo</label>
                  <input required value={novoCliente.nome_com} onChange={e => setNovoCliente({...novoCliente, nome_com: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium" type="text" placeholder="Ex: João Silva" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 ml-1">E-mail Principal</label>
                  <input required value={novoCliente.email} onChange={e => setNovoCliente({...novoCliente, email: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium" type="email" placeholder="cliente@servico.com" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 ml-1">WhatsApp / Telefone</label>
                  <input value={novoCliente.telefone} onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium" type="text" placeholder="(00) 00000-0000" />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-blue-600 text-white rounded-[20px] font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 uppercase text-xs tracking-[2px] disabled:bg-slate-300 active:scale-[0.98]"
              >
                {loading ? 'Processando...' : 'Finalizar Cadastro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}