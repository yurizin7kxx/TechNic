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
  XCircle,
  CalendarDays,
  BadgeCheck,
  TimerReset,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

export default function DetalhesOSPage() {
  const [os, setOs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enviandoAceite, setEnviandoAceite] = useState(false);
  const [enviandoRecusa, setEnviandoRecusa] = useState(false);
  const coresStatus = {
  Em_Analise: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Aguardando_Aprovacao: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Em_Manutencao: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Pronto_Aguardando_Retirada: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Finalizado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Recusado: 'bg-red-500/10 text-red-400 border-red-500/20'
};

  async function carregarDadosOS() {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: cliente } = await supabase
        .from('clientes')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!cliente) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('servicos_tecnico')
        .select('*')
        .eq('cliente_id', cliente.id)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        let logsFormatados = [];

        if (Array.isArray(data.historico_logs)) {
          logsFormatados = data.historico_logs;
        } else if (data.historico_logs) {
          logsFormatados = [String(data.historico_logs)];
        }

        const { data: perfil } = await supabase
          .from('perfis')
          .select('nome_completo')
          .eq('id', user.id)
          .single();

        setOs({
          id: data.id,
          aparelho: data.equipamento || "Dispositivo",
          cliente_nome: perfil?.nome_completo || user.email,
          status: data.status,
          valor_total: Number(data.preco) || 0,
          problema_identificado: data.descricao,
          tecnico: "Equipe TechNic",
          data_entrada: data.tempo,

          previsao_entrega: data.previsao_entrega,
          garantia: data.garantia || '90 dias',

          pecas_usadas: data.peca_substituida
            ? data.peca_substituida.split(', ')
            : [],
          historico_logs: logsFormatados,
          fotos_url: Array.isArray(data.fotos_url)
            ? data.fotos_url
            : [],
          aceite_cliente: data.aceite_cliente || false
        });
      }

    } catch (err) {
      console.error(err);
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

      toast.warning('✅ Orçamento aprovado!');
      carregarDadosOS();

    } catch (error) {
      toast.warning(error.message);
    } finally {
      setEnviandoAceite(false);
    }
  };

  const recusarOrcamento = async () => {
    if (!os?.id) return;

    const confirmou = confirm(
      'Deseja realmente recusar este orçamento?'
    );

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

      toast.warning('⚠️ Orçamento recusado.');
      carregarDadosOS();

    } catch (error) {
      toast.warning(error.message);
    } finally {
      setEnviandoRecusa(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!os) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="max-w-md bg-slate-900/50 border border-white/5 p-10 rounded-[40px] text-center">
          <Smartphone className="mx-auto text-blue-500 mb-5" />
          <h2 className="text-2xl font-bold text-white mb-6">
            Nenhuma OS ativa
          </h2>

          <Link
            href="/"
            className="bg-white text-black px-8 py-4 rounded-2xl font-bold"
          >
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 pb-24">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">

          <Link
            href="/"
            className="p-2 hover:bg-white/5 rounded-full"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </Link>

          <div className="text-right">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">
              Status Atual
            </p>

            <div className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-widest ${
  coresStatus[os.status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
}`}>
  {os.status?.replace(/_/g, ' ')}
</div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ESQUERDA */}
          <div className="lg:col-span-8 space-y-8">

            {/* HERO */}
            <div className="relative overflow-hidden rounded-[48px] bg-slate-900 border border-white/5 p-8 md:p-12 shadow-2xl">

              <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/10 blur-[120px]" />

              <div className="relative z-10 space-y-8">

                <div>
                  <h2 className="text-blue-500 font-mono text-[11px] uppercase tracking-[0.5em] mb-4">
                    Relatório do Dispositivo
                  </h2>

                  <h1 className="text-5xl md:text-6xl font-black text-white leading-[0.9] tracking-tighter">
                    {os.aparelho}
                  </h1>
                </div>

                <div className="flex flex-wrap gap-4">

                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
                    <User size={16} className="text-blue-400" />
                    <span className="text-sm">
                      {os.cliente_nome}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <ShieldCheck size={16} />
                    <span className="text-sm font-bold">
                      {os.aceite_cliente
                        ? 'Autorizado'
                        : 'Aguardando Aprovação'}
                    </span>
                  </div>

                </div>

                {/* INFORMAÇÕES EXTRAS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <div className="bg-white/5 border border-white/5 rounded-3xl p-5">
                    <CalendarDays className="text-blue-500 mb-3" size={20} />
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                      Entrada
                    </p>
                    <p className="text-sm text-white font-bold">
                      {os.data_entrada
  ? new Date(os.data_entrada).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  : 'Hoje'}
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-3xl p-5">
                    <TimerReset className="text-blue-500 mb-3" size={20} />
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                      Previsão
                    </p>
                    <p className="text-sm text-white font-bold">
  {os.previsao_entrega
    ? new Date(os.previsao_entrega).toLocaleString('pt-BR')
    : 'Não definida'}
</p>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-3xl p-5">
                    <BadgeCheck className="text-blue-500 mb-3" size={20} />
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                      Garantia
                    </p>
                    <p className="text-sm text-white font-bold">
  {os.garantia || 'Sem garantia'}
</p>
                  </div>

                </div>

              </div>
            </div>

            {/* CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              <div className="bg-slate-900/50 p-10 rounded-[40px] border border-white/5">
                <Wrench className="text-blue-500 mb-6" size={24} />

                <h3 className="text-white font-bold text-lg mb-4">
                  Laudo Técnico
                </h3>

                <p className="text-slate-400 italic leading-relaxed">
                  "{os.problema_identificado || 'Em análise...'}"
                </p>
              </div>

              <div className="bg-slate-900/50 p-10 rounded-[40px] border border-white/5">
                <CheckCircle2
                  className="text-emerald-500 mb-6"
                  size={24}
                />

                <h3 className="text-white font-bold text-lg mb-4">
                  Lista de Reparos
                </h3>

                <div className="space-y-4">

                  {os.pecas_usadas.length > 0 ? (
                    os.pecas_usadas.map((peca, i) => (
                      <div
                        key={i}
                        className="bg-white/5 rounded-2xl p-4 border border-white/5"
                      >
                        <p className="text-white text-sm font-semibold">
                          {peca}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          Garantia inclusa de 90 dias
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      Mão de obra inclusa.
                    </p>
                  )}

                </div>
              </div>
            </div>

            {/* GALERIA */}
            {os.fotos_url.length > 0 && (
              <div className="bg-slate-900/50 p-10 rounded-[40px] border border-white/5">

                <h3 className="text-white font-bold text-lg mb-8 flex items-center gap-3">
                  <ImageIcon size={20} className="text-blue-500" />
                  Evidências do Reparo
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

                  {os.fotos_url.map((path, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-3xl overflow-hidden border border-white/5"
                    >
                      <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/os-fotos/${path}`}
                        className="w-full h-full object-cover"
                        alt="Foto do reparo"
                      />
                    </div>
                  ))}

                </div>
              </div>
            )}
          </div>

          {/* DIREITA */}
          <div className="lg:col-span-4 space-y-6">

            {/* ORÇAMENTO */}
            <div className="bg-slate-900 p-8 rounded-[40px] border border-white/10">

              <span className="text-[10px] uppercase tracking-widest text-slate-500 block mb-2">
                Total do orçamento
              </span>

              <div className="flex items-end gap-1 mb-6">
                <span className="text-white/50">R$</span>

                <span className="text-5xl font-black text-white tracking-tighter">
                  {os.valor_total.toFixed(2)}
                </span>
              </div>

              <div className="bg-white/5 rounded-2xl border border-white/5 p-4 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <CreditCard size={18} className="text-blue-400" />
                  PIX • Cartão • Dinheiro
                </div>
              </div>

              {!os.aceite_cliente &&
              os.status !== 'Recusado' &&
              os.status !== 'Finalizado' ? (

                <div className="space-y-4">

                  <button
                    onClick={confirmarAceite}
                    disabled={enviandoAceite}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
                  >
                    {enviandoAceite
                      ? 'Processando...'
                      : 'Aprovar Agora'}
                  </button>

                  <button
                    onClick={recusarOrcamento}
                    disabled={enviandoRecusa}
                    className="w-full border border-red-500/20 text-red-500 py-4 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em]"
                  >
                    {enviandoRecusa
                      ? 'Cancelando...'
                      : 'Não aceito o serviço'}
                  </button>

                </div>

              ) : (

                <div className="w-full py-4 rounded-3xl text-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-widest font-black">
                  {os.status === 'Finalizado'
                    ? 'Serviço Concluído'
                    : os.status === 'Recusado'
                    ? 'Orçamento Recusado'
                    : 'Orçamento Aprovado'}
                </div>

              )}

            </div>

            {/* CONTATO */}
            <div className="bg-blue-600 p-8 rounded-[40px] text-white">

              <h3 className="font-bold mb-1">
                Dúvidas?
              </h3>

              <p className="text-blue-100 text-xs opacity-80 mb-6">
                Fale com o técnico responsável.
              </p>

              <button className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                <MessageCircle size={18} />
                Chamar no Whats
              </button>

            </div>

            {/* EVOLUÇÃO */}
            <div className="bg-slate-900/50 p-8 rounded-[40px] border border-white/5">

              <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-8 flex items-center justify-between">
                Evolução
                <Clock size={14} />
              </h3>

              <div className="space-y-8">

                {os.historico_logs.length > 0 ? (
                  [...os.historico_logs].reverse().map((log, i) => (

                    <div key={i} className="flex gap-4 relative">

                      {i !== os.historico_logs.length - 1 && (
                        <div className="absolute left-[9px] top-6 w-[1px] h-full bg-white/10" />
                      )}

                      <div className="w-[18px] h-[18px] rounded-full border-2 border-blue-500 bg-[#020617] flex items-center justify-center shrink-0 z-10">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-300">
                          {log}
                        </p>

                        <p className="text-[10px] text-slate-500 mt-1">
                          Atualizado recentemente
                        </p>
                      </div>

                    </div>

                  ))
                ) : (
                  <p className="text-xs text-slate-600">
                    Sem registros.
                  </p>
                )}

              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}