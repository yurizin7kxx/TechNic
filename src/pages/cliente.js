import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../public/lib/supabase';
import { MessageCircle, CheckCircle2, Clock, Calendar, User, HardDrive, ArrowLeft } from 'lucide-react'; // Sugestão: use lucide-react para ícones

export default function DetalhesOSPage() {
  const [os, setOs] = useState(null);
  const [loading, setLoading] = useState(true);
  const osId = 'OS1024';

  useEffect(() => {
    async function carregarDadosOS() {
      setLoading(true);
      try {
        const { data } = await supabase.from('servicos').select('*').eq('codigo_os', osId).single();
        
        if (data) {
          setOs(data);
        } else {
          // Mock data para preview
          setOs({
            aparelho: 'Notebook Dell XPS 13',
            cliente_nome: 'Yuri Silva',
            status: 'Aguardando_Aprovacao',
            valor_total: 450.00,
            problema_identificado: 'Superaquecimento e desligamento repentino.',
            tecnico: 'Marcos Oliveira',
            data_entrada: '2024-05-25T14:30:00',
            pecas_usadas: ['Pasta Térmica Silver', 'Limpeza Interna'],
            historico_logs: [
              { data: '25/05/2024 14:30', msg: 'Aparelho recebido na recepção.' },
              { data: '26/05/2024 09:00', msg: 'Iniciada análise técnica de hardware.' }
            ],
            fotos_url: []
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregarDadosOS();
  }, [osId]);

  const aprovarOrcamento = async () => {
    const { error } = await supabase.from('servicos').update({ status: 'Aprovado_Pelo_Cliente' }).eq('codigo_os', osId);
    if (!error) {
      alert("Orçamento aprovado com sucesso!");
      setOs(prev => ({ ...prev, status: 'Aprovado_Pelo_Cliente' }));
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0b0f1a] flex flex-col items-center justify-center text-white">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-medium tracking-widest text-slate-400">CARREGANDO ORÇAMENTO</p>
    </div>
  );

  const isAguardando = os.status === 'Aguardando_Aprovacao';

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-200 font-sans pb-20">
      {/* Header Estilizado */}
      <nav className="bg-[#111827]/80 backdrop-blur-md border-b border-white/5 p-4 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/login" className="group flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-all">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold">Sair do Portal</span>
          </Link>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">TechNic ID</span>
            <span className="text-sm font-mono text-blue-400 font-bold">#{osId}</span>
          </div>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lado Esquerdo - Detalhes (8 colunas) */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-[#161e2d] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
            {/* Top Bar do Card */}
            <div className="p-6 md:p-10 border-b border-white/5 bg-gradient-to-br from-[#1e293b] to-[#161e2d]">
              <div className="flex flex-wrap justify-between items-start gap-6">
                <div className="space-y-2">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${isAguardando ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                    {isAguardando ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                    {os.status?.replace(/_/g, ' ')}
                  </div>
                  <h1 className="text-4xl font-black text-white tracking-tight leading-none">{os.aparelho}</h1>
                </div>
                
                <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/5 min-w-[200px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total do Orçamento</p>
                  <p className="text-4xl font-black text-emerald-400 font-mono">
                    <span className="text-lg mr-1 font-normal text-emerald-600">R$</span>
                    {os.valor_total?.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Grid de Infos Rápidas */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><User size={18} /></div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Cliente</p>
                    <p className="text-sm font-semibold">{os.cliente_nome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Calendar size={18} /></div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Entrada</p>
                    <p className="text-sm font-semibold">{new Date(os.data_entrada).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400"><HardDrive size={18} /></div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Especialista</p>
                    <p className="text-sm font-semibold">{os.tecnico}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnóstico */}
            <div className="p-6 md:p-10 space-y-8">
              <div>
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  Diagnóstico Técnico
                </h3>
                <p className="text-lg text-slate-300 leading-relaxed italic font-serif border-l-4 border-slate-700 pl-6">
                  "{os.problema_identificado}"
                </p>
              </div>

              {os.pecas_usadas?.length > 0 && (
                <div>
                  <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Peças e Insumos</h3>
                  <div className="flex flex-wrap gap-2">
                    {os.pecas_usadas.map((peca, i) => (
                      <div key={i} className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-white/5 text-xs font-medium text-slate-400">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        {peca}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Galeria - Melhorada */}
          <div className="bg-[#161e2d] p-8 rounded-3xl border border-white/5 shadow-xl">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              📸 Evidências do Aparelho
            </h3>
            {os.fotos_url?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {os.fotos_url.map((path, i) => (
                  <div key={i} className="group relative aspect-square bg-slate-900 rounded-2xl overflow-hidden border border-white/5 cursor-zoom-in">
                    <img src={path} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Evidência" />
                    <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center text-slate-600 italic text-sm font-mono">
                Nenhuma foto anexada pelo técnico.
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito - Sidebar (4 colunas) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card de Aprovação Principal */}
          <div className="bg-gradient-to-b from-[#1e293b] to-[#161e2d] p-8 rounded-3xl border border-white/10 shadow-2xl sticky top-24">
            <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-6 text-center">Decisão do Cliente</h3>
            
            {isAguardando ? (
              <div className="space-y-4">
                <button 
                  onClick={aprovarOrcamento}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-5 rounded-2xl font-black transition-all shadow-xl shadow-orange-900/20 uppercase text-sm tracking-tighter active:scale-95"
                >
                  Autorizar Conserto
                </button>
                <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                  Ao aprovar, você concorda com o valor e as peças listadas acima.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20 flex flex-col items-center gap-3">
                <CheckCircle2 size={32} className="text-emerald-500" />
                <span className="text-emerald-500 font-black uppercase tracking-widest text-xs">Serviço Aprovado</span>
                <p className="text-[10px] text-slate-400 text-center">O técnico já foi notificado e está trabalhando no seu aparelho.</p>
              </div>
            )}

            <div className="h-[1px] bg-white/5 my-8" />

            <button className="w-full bg-[#128c7e] hover:bg-[#075e54] text-white py-4 rounded-2xl font-bold transition flex items-center justify-center gap-3 text-sm shadow-lg shadow-emerald-950/20">
              <MessageCircle size={20} />
              Falar com Técnico
            </button>
          </div>

          {/* Timeline de Evolução */}
          <div className="bg-[#161e2d] p-8 rounded-3xl border border-white/5 shadow-xl">
            <h3 className="text-white font-black text-[10px] uppercase tracking-widest mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Linha do Tempo
            </h3>
            <div className="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:h-[85%] before:w-[2px] before:bg-white/5">
              {os.historico_logs?.map((log, i) => (
                <div key={i} className="relative pl-8 group">
                  <div className="absolute left-0 top-1 w-4 h-4 bg-[#161e2d] border-2 border-blue-500 rounded-full z-10 transition-transform group-hover:scale-125" />
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold mb-1">{log.data}</p>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">{log.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}