import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../public/lib/supabase';
import { 
  MessageCircle, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  Wrench, 
  ShieldCheck, 
  Smartphone, 
  Calendar, 
  User,
  Image as ImageIcon
} from 'lucide-react';

export default function DetalhesOSPage() {
  const [os, setOs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDadosOS() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { 
          setLoading(false); 
          return; 
        }

        // 1. Busca o perfil para ter o nome exato cadastrado
        const { data: perfil } = await supabase
          .from('perfis')
          .select('nome_completo')
          .eq('id', user.id)
          .single();

        const nomeParaBusca = perfil?.nome_completo?.trim();
        const emailParaBusca = user.email?.trim();

        // 2. Busca a OS na tabela 'servicos_tecnico'
        const { data, error } = await supabase
          .from('servicos_tecnico')
          .select('*')
          .or(`cliente.ilike.%${nomeParaBusca}%,cliente.ilike.%${emailParaBusca}%`)
          .neq('status', 'Finalizado') 
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (data) {
          // 3. Tratamento robusto para os Logs
          let logsFormatados = [];
          if (Array.isArray(data.historico_logs)) {
            logsFormatados = data.historico_logs;
          } else if (data.historico_logs) {
            logsFormatados = [String(data.historico_logs)];
          }

          setOs({
            id: data.id,
            aparelho: data.equipamento || "Dispositivo",
            cliente_nome: data.cliente,
            status: data.status,
            // ALTERAÇÃO: Mapeando a coluna 'preço' do Banco de Dados
            valor_total: Number(data.preço) || 0,
            problema_identificado: data.descricao,
            tecnico: "Equipe TechNic",
            data_entrada: data.tempo,
            pecas_usadas: Array.isArray(data.pecas_usadas) ? data.pecas_usadas : [],
            historico_logs: logsFormatados,
            fotos_url: Array.isArray(data.fotos_url) ? data.fotos_url : []
          });
        } else {
          setOs(null);
        }

        if (error) console.error("Erro na busca da OS:", error.message);
      } catch (err) {
        console.error("Erro inesperado:", err);
      } finally {
        setLoading(false);
      }
    }
    carregarDadosOS();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full animate-spin" />
        <div className="absolute top-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="mt-6 text-blue-500 font-mono text-[10px] tracking-[0.4em] uppercase animate-pulse">Sincronizando Dados</p>
    </div>
  );

  if (!os) return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 text-center">
      <div className="max-w-md p-12 rounded-[40px] bg-slate-900/50 border border-white/5 backdrop-blur-3xl shadow-2xl">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Smartphone className="text-blue-500" size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2 tracking-tight">Sem ordens ativas</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">Não encontramos manutenções em andamento vinculadas ao seu nome ou e-mail.</p>
        <Link href="/" className="inline-block bg-white text-black px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:bg-blue-500 hover:text-white active:scale-95">Voltar ao Início</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-blue-500/30 pb-24">
      <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors group">
            <ArrowLeft size={20} className="text-slate-400 group-hover:text-white transition-colors" />
          </Link>
          <div className="flex items-center gap-3">
             <div className="h-8 w-[1px] bg-white/10 mx-2" />
             <div className="text-right">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">Status OS</p>
                <p className="text-xs font-bold text-white uppercase">{os.status?.replace(/_/g, ' ')}</p>
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            {/* CARD HERO */}
            <div className="relative overflow-hidden rounded-[48px] bg-slate-900 border border-white/5 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32" />
              <div className="p-8 md:p-12 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-blue-500 font-mono text-[11px] font-bold uppercase tracking-[0.5em] mb-4">Relatório Detalhado</h2>
                      <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-[0.9]">{os.aparelho}</h1>
                    </div>
                    <div className="flex flex-wrap gap-6 text-sm font-medium">
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                        <User size={16} className="text-blue-400" />
                        <span className="text-slate-300">{os.cliente_nome}</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                        <ShieldCheck size={16} className="text-emerald-400" />
                        <span className="text-slate-300">Garantia Ativa</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-auto p-8 rounded-[32px] bg-blue-600 shadow-xl shadow-blue-600/20 flex flex-col items-center justify-center min-w-[220px]">
                    <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-2 opacity-80">Investimento Total</span>
                    <div className="flex items-baseline gap-1 text-white">
                      <span className="text-lg font-medium opacity-70">R$</span>
                      <span className="text-5xl font-black tracking-tighter">{os.valor_total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-2 w-full bg-white/5 relative">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_20px_#3b82f6] transition-all duration-1000" 
                  style={{ width: os.status === 'Pronto' ? '100%' : '65%' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-900/50 p-10 rounded-[40px] border border-white/5 backdrop-blur-sm">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-500">
                  <Wrench size={24} />
                </div>
                <h3 className="text-white font-bold text-lg mb-4">Parecer do Especialista</h3>
                <p className="text-slate-400 leading-relaxed italic text-base">
                  "{os.problema_identificado || "Análise técnica em andamento para este dispositivo."}"
                </p>
              </div>

              <div className="bg-slate-900/50 p-10 rounded-[40px] border border-white/5 backdrop-blur-sm">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-500">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-white font-bold text-lg mb-4">Peças & Serviços</h3>
                <div className="space-y-3">
                  {os.pecas_usadas.length > 0 ? os.pecas_usadas.map((peca, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-400">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      {peca}
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500">Mão de obra e diagnósticos inclusos.</p>
                  )}
                </div>
              </div>
            </div>

            {os.fotos_url.length > 0 && (
              <div className="bg-slate-900/50 p-10 rounded-[40px] border border-white/5 backdrop-blur-sm">
                <h3 className="text-white font-bold text-lg mb-8 flex items-center gap-3">
                  <ImageIcon size={20} className="text-blue-500" /> Registro Fotográfico
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {os.fotos_url.map((path, i) => (
                    <div key={i} className="aspect-square rounded-3xl bg-black overflow-hidden border border-white/5 group cursor-pointer">
                      <img 
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/os-fotos/${path}`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt="Evidência de reparo" 
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TIMELINE */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-blue-600 p-10 rounded-[48px] shadow-2xl shadow-blue-600/20 text-white group relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Precisa de ajuda?</h3>
                <p className="text-blue-100 text-sm mb-8 leading-relaxed opacity-80">Suporte direto com nosso especialista.</p>
                <button className="w-full bg-white text-blue-600 py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:shadow-lg active:scale-95">
                  <MessageCircle size={20} /> WhatsApp
                </button>
              </div>
            </div>

            <div className="bg-slate-900/50 p-10 rounded-[48px] border border-white/5 backdrop-blur-sm">
              <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-10 flex items-center justify-between">
                Timeline
                <Clock size={16} className="text-slate-500" />
              </h3>
              <div className="space-y-10">
                {os.historico_logs.length > 0 ? (
                  [...os.historico_logs].reverse().map((log, i) => (
                    <div key={i} className="flex gap-6 group relative">
                      {i !== os.historico_logs.length - 1 && (
                        <div className="absolute left-[11px] top-8 w-[2px] h-full bg-white/5" />
                      )}
                      <div className="w-6 h-6 rounded-full border-2 border-blue-500 bg-[#020617] flex items-center justify-center shrink-0 z-10">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-200">{log}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Evento Registrado</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto text-slate-700 mb-4" size={24} />
                    <p className="text-xs text-slate-600 font-bold uppercase">Sem registros recentes</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}