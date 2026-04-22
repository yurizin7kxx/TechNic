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
  User,
  Image as ImageIcon,
  ThumbsUp,
  AlertCircle,
  XCircle
} from 'lucide-react';

export default function DetalhesOSPage() {
  const [os, setOs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enviandoAceite, setEnviandoAceite] = useState(false);
  const [enviandoRecusa, setEnviandoRecusa] = useState(false);

  async function carregarDadosOS() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { 
        setLoading(false); 
        return; 
      }

      // BUSCA OTIMIZADA: Usando o ID do usuário logado diretamente na coluna cliente_id
      const { data, error } = await supabase
        .from('servicos_tecnico')
        .select('*')
        .eq('cliente_id', user.id) // Busca exata pelo ID
        .neq('status', 'Finalizado') 
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        let logsFormatados = [];
        if (Array.isArray(data.historico_logs)) {
          logsFormatados = data.historico_logs;
        } else if (data.historico_logs) {
          logsFormatados = [String(data.historico_logs)];
        }

        // Buscamos o nome do perfil apenas para exibição visual na tela
        const { data: perfil } = await supabase
          .from('perfis')
          .select('nome_completo')
          .eq('id', user.id)
          .single();

        setOs({
          id: data.id,
          aparelho: data.equipamento || "Dispositivo",
          cliente_nome: perfil?.nome_completo || user.email, // Exibe o nome do perfil
          status: data.status,
          valor_total: Number(data.preço) || 0,
          problema_identificado: data.descricao,
          tecnico: "Equipe TechNic",
          data_entrada: data.tempo,
          pecas_usadas: data.peca_substituida ? data.peca_substituida.split(', ') : [],
          historico_logs: logsFormatados,
          fotos_url: Array.isArray(data.fotos_url) ? data.fotos_url : [],
          aceite_cliente: data.aceite_cliente || false
        });
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDadosOS();
  }, []);

  const confirmarAceite = async () => {
    if (!os?.id) return;
    setEnviandoAceite(true);
    try {
      const { error } = await supabase
        .from('servicos_tecnico')
        .update({ aceite_cliente: true })
        .eq('id', os.id);

      if (error) throw error;
      alert("✅ Orçamento aprovado! Iniciaremos o serviço.");
      carregarDadosOS();
    } catch (error) {
      alert("Erro: " + error.message);
    } finally {
      setEnviandoAceite(false);
    }
  };

  const recusarOrcamento = async () => {
    if (!os?.id) return;
    const confirmou = confirm("Deseja realmente recusar este orçamento? O técnico será notificado.");
    if (!confirmou) return;

    setEnviandoRecusa(true);
    try {
      const { error } = await supabase
        .from('servicos_tecnico')
        .update({ 
            aceite_cliente: false,
            status: 'Recusado'
        })
        .eq('id', os.id);

      if (error) throw error;
      alert("⚠️ Orçamento recusado. Entre em contato para combinar a retirada.");
      carregarDadosOS();
    } catch (error) {
      alert("Erro: " + error.message);
    } finally {
      setEnviandoRecusa(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!os) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-center">
      <div className="max-w-md p-12 rounded-[40px] bg-slate-900/50 border border-white/5 backdrop-blur-3xl">
        <Smartphone className="text-blue-500 mx-auto mb-6" size={32} />
        <h2 className="text-2xl font-bold text-white mb-8">Sem ordens ativas</h2>
        <Link href="/" className="bg-white text-black px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all">Voltar</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans pb-24">
      {/* ... (resto do seu HTML/JSX permanece igual) ... */}
      <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-400" />
          </Link>
          <div className="text-right">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Status</p>
            <p className="text-xs font-bold text-white uppercase">{os.status?.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="relative overflow-hidden rounded-[48px] bg-slate-900 border border-white/5 p-8 md:p-12 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32" />
              <div className="relative z-10 space-y-6">
                <div>
                  <h2 className="text-blue-500 font-mono text-[11px] font-bold uppercase tracking-[0.5em] mb-4">Relatório de Dispositivo</h2>
                  <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-[0.9]">{os.aparelho}</h1>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                    <User size={16} className="text-blue-400" />
                    <span>{os.cliente_nome}</span>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${os.status === 'Recusado' ? 'bg-red-500/10 border-red-500/20 text-red-400' : os.aceite_cliente ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                    {os.status === 'Recusado' ? <XCircle size={16} /> : os.aceite_cliente ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
                    <span className="font-bold">
                        {os.status === 'Recusado' ? 'Recusado' : os.aceite_cliente ? 'Autorizado' : 'Aguardando Aprovação'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-900/50 p-10 rounded-[40px] border border-white/5">
                <Wrench size={24} className="text-blue-500 mb-6" />
                <h3 className="text-white font-bold text-lg mb-4">Laudo Técnico</h3>
                <p className="text-slate-400 leading-relaxed italic">"{os.problema_identificado || "Em análise..."}"</p>
              </div>

              <div className="bg-slate-900/50 p-10 rounded-[40px] border border-white/5">
                <CheckCircle2 size={24} className="text-emerald-500 mb-6" />
                <h3 className="text-white font-bold text-lg mb-4">Lista de Reparos</h3>
                <div className="space-y-3">
                  {os.pecas_usadas.length > 0 ? os.pecas_usadas.map((peca, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-400">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> {peca}
                    </div>
                  )) : <p className="text-sm text-slate-500">Mão de obra inclusa.</p>}
                </div>
              </div>
            </div>

            {os.fotos_url.length > 0 && (
              <div className="bg-slate-900/50 p-10 rounded-[40px] border border-white/5">
                <h3 className="text-white font-bold text-lg mb-8 flex items-center gap-3">
                  <ImageIcon size={20} className="text-blue-500" /> Galeria de Evidências
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {os.fotos_url.map((path, i) => (
                    <div key={i} className="aspect-square rounded-3xl bg-black overflow-hidden border border-white/5">
                      <img 
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/os-fotos/${path}`} 
                        className="w-full h-full object-cover" 
                        alt="Reparo"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 p-8 rounded-[40px] border border-white/10 shadow-xl">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Total do Orçamento</span>
                <div className="flex items-baseline gap-1 text-white mb-6">
                   <span className="text-lg font-medium opacity-50">R$</span>
                   <span className="text-5xl font-black tracking-tighter">{os.valor_total.toFixed(2)}</span>
                </div>

                {!os.aceite_cliente && os.status !== 'Recusado' ? (
                  <div className="space-y-4">
                    <button 
                      onClick={confirmarAceite}
                      disabled={enviandoAceite || enviandoRecusa}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                    >
                      {enviandoAceite ? 'Processando...' : <><ThumbsUp size={18} /> Aprovar Agora</>}
                    </button>

                    <button 
                      onClick={recusarOrcamento}
                      disabled={enviandoAceite || enviandoRecusa}
                      className="w-full bg-transparent border border-red-500/20 hover:border-red-500/50 text-red-500 py-4 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                    >
                      {enviandoRecusa ? 'Cancelando...' : 'Não aceito o serviço'}
                    </button>
                  </div>
                ) : (
                  <div className={`w-full py-4 rounded-3xl text-center text-[10px] font-black uppercase tracking-widest border ${os.status === 'Recusado' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                    {os.status === 'Recusado' ? 'Orçamento Recusado' : 'Orçamento Aprovado'}
                  </div>
                )}
            </div>

            <div className="bg-blue-600 p-8 rounded-[40px] shadow-xl shadow-blue-600/10 text-white">
              <h3 className="font-bold mb-1">Dúvidas?</h3>
              <p className="text-blue-100 text-xs mb-6 opacity-80">Fale com o técnico responsável.</p>
              <button className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-50 transition-all">
                <MessageCircle size={18} /> Chamar no Whats
              </button>
            </div>

            <div className="bg-slate-900/50 p-8 rounded-[40px] border border-white/5">
              <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-8 flex items-center justify-between">
                Evolução <Clock size={14} />
              </h3>
              <div className="space-y-8">
                {os.historico_logs.length > 0 ? (
                  [...os.historico_logs].reverse().map((log, i) => (
                    <div key={i} className="flex gap-4 relative">
                      {i !== os.historico_logs.length - 1 && <div className="absolute left-[9px] top-6 w-[1px] h-full bg-white/10" />}
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-blue-500 bg-[#020617] flex items-center justify-center shrink-0 z-10">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-300">{log}</p>
                      </div>
                    </div>
                  ))
                ) : <p className="text-xs text-slate-600">Sem registros.</p>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}