import { useState, useEffect } from 'react';
import { supabase } from '../../public/lib/supabase';

export default function PainelTecnicoEntrada() {
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [aparelho, setAparelho] = useState('');
  const [problema, setProblema] = useState('');
  const [valor, setValor] = useState('');
  const [custoPecas, setCustoPecas] = useState(''); 
  const [garantia, setGarantia] = useState('90 dias'); 
  const [loading, setLoading] = useState(false);
  const [pecas, setPecas] = useState([]); 
  const [novaPeca, setNovaPeca] = useState('');
  const [historico, setHistorico] = useState([]); 
  const [novaObs, setNovaObs] = useState('');
  const [fotos, setFotos] = useState([]); 
  const [arquivosFotos, setArquivosFotos] = useState([]); 

  useEffect(() => {
    async function carregarClientes() {
      const { data, error } = await supabase
        .from('perfis')
        .select('id, nome_completo, email, tipo_perfil') 
        .eq('tipo_perfil', 'cliente') 
        .order('nome_completo', { ascending: true }); 
      
      if (error) {
        console.error("Erro ao buscar perfis:", error.message);
      } else {
        setClientes(data || []);
      }
    }
    carregarClientes();
  }, []);

  const handleSelecionarCliente = async (valorCliente) => {
    setClienteSelecionado(valorCliente);
    if (!valorCliente) {
      limparCampos(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('servicos_tecnico')
        .select('*')
        .eq('cliente', valorCliente)
        .neq('status', 'Finalizado') 
        .order('tempo', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setAparelho(data.equipamento || '');
        setProblema(data.descricao || '');
        setValor(data.preço?.toString() || '');
        setCustoPecas(data.valor_pecas?.toString() || '');
        setGarantia(data.garantia || '90 dias');
        
        if (data.peca_substituida) {
          setPecas(data.peca_substituida.split(', ').filter(p => p.trim() !== ''));
        } else {
          setPecas([]);
        }

        setHistorico(Array.isArray(data.historico_logs) ? data.historico_logs : []);
      } else {
        limparCampos(false); 
      }
    } catch (err) {
      console.error("Erro ao buscar OS ativa:", err);
    }
  };

  const limparCampos = (limparCliente = true) => {
    if (limparCliente) setClienteSelecionado('');
    setAparelho('');
    setProblema('');
    setValor('');
    setCustoPecas('');
    setGarantia('90 dias'); 
    setPecas([]);
    setHistorico([]);
    setFotos([]);
    setArquivosFotos([]);
  };

  const adicionarPeca = () => {
    if (novaPeca.trim()) {
      setPecas([...pecas, novaPeca]);
      setNovaPeca('');
    }
  };

  const adicionarObs = async () => {
    if (!novaObs.trim()) return;
    if (!clienteSelecionado || !aparelho) return alert("Selecione um cliente e aparelho primeiro!");

    const dataHora = new Date().toLocaleString('pt-BR');
    const novoLog = `${dataHora} - ${novaObs}`;
    const novoHistorico = [...historico, novoLog];

    setHistorico(novoHistorico);
    setNovaObs('');

    try {
      const { error } = await supabase
        .from('servicos_tecnico')
        .update({ historico_logs: novoHistorico })
        .eq('cliente', clienteSelecionado)
        .eq('equipamento', aparelho)
        .neq('status', 'Finalizado');

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao salvar log:", error.message);
    }
  };

  const handleFotoChange = (e) => {
    const files = Array.from(e.target.files);
    setArquivosFotos([...arquivosFotos, ...files]);
    const URLs = files.map(file => URL.createObjectURL(file));
    setFotos([...fotos, ...URLs]);
  };

  const salvarNovaOS = async (statusFinal) => {
    // --- VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS ---
    if (!clienteSelecionado) return alert("Selecione um Cliente!");
    if (!aparelho.trim()) return alert("Informe o Aparelho/Modelo!");
    if (!problema.trim()) return alert("Descreva o Problema!");
    if (!valor || parseFloat(valor) <= 0) return alert("Informe o Valor do Serviço!");
    if (!custoPecas || parseFloat(custoPecas) < 0) return alert("Informe o Custo das Peças (pode ser 0)!");
    if (pecas.length === 0) return alert("Adicione pelo menos uma peça (ou 'Nenhuma')!");

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Você precisa estar logado.");

      // Upload de fotos
      let linksFotos = [];
      if (arquivosFotos.length > 0) {
        for (const file of arquivosFotos) {
          const fileName = `os/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
          const { data, error: uploadError } = await supabase.storage
            .from('os-fotos')
            .upload(fileName, file);
          
          if (uploadError) console.error("Erro upload foto:", uploadError.message);
          if (data) linksFotos.push(data.path);
        }
      }

      const historicoLimpo = historico.filter(h => h && h.trim() !== "");
      const pecasLimpas = pecas.filter(p => p && p.trim() !== "");
      const pecasString = pecasLimpas.join(', ');

      // UPSERT - Atualiza se existir (cliente+equipamento) ou cria novo
      const { error } = await supabase
        .from('servicos_tecnico')
        .upsert([{ 
          cliente: clienteSelecionado,
          tecnico: user.id,
          equipamento: aparelho,
          status: statusFinal, // Status vem do botão clicado
          descricao: problema,
          preço: parseFloat(valor), 
          valor_pecas: parseFloat(custoPecas),
          peca_substituida: pecasString,
          garantia: garantia,
          tempo: new Date().toISOString(),
          historico_logs: historicoLimpo,
          fotos_url: linksFotos 
        }], { onConflict: 'cliente, equipamento' });

      if (error) throw error;
      
      alert(`✅ OS atualizada para: ${statusFinal.replace(/_/g, ' ')}`);
      
      // Se finalizar, limpa a tela. Se for apenas mudar status, pode manter ou limpar.
      if (statusFinal === 'Finalizado') {
        limparCampos();
      }

    } catch (error) {
      alert('❌ Erro ao processar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA DA ESQUERDA: DADOS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-800 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2 flex items-center gap-2">
              📝 Entrada de Serviço
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Cliente *</label>
                <select 
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 mt-1 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={clienteSelecionado} 
                  onChange={(e) => handleSelecionarCliente(e.target.value)}
                >
                  <option value="">Selecione o cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.nome_completo || c.email}>
                      {c.nome_completo || c.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Aparelho / Modelo *</label>
                <input 
                  placeholder="Ex: Samsung S23 Ultra"
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 mt-1 text-white outline-none focus:ring-2 focus:ring-blue-500" 
                  value={aparelho} onChange={(e) => setAparelho(e.target.value)} 
                />
              </div>
            </div>
            <label className="text-xs text-slate-500 uppercase font-bold">Relato do Problema *</label>
            <textarea 
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 h-24 mt-1 text-white outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="O que o cliente relatou?" 
              value={problema} onChange={(e) => setProblema(e.target.value)} 
            />
          </div>

          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-800">
            <h3 className="text-white font-bold mb-4">🛠 Peças (Obrigatório Adicionar)</h3>
            <div className="flex gap-2 mb-4">
              <input 
                className="flex-1 bg-[#0f172a] border border-slate-700 rounded-lg p-2 text-white outline-none" 
                placeholder="Ex: Tela LCD..."
                value={novaPeca} onChange={(e) => setNovaPeca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && adicionarPeca()}
              />
              <button type="button" onClick={adicionarPeca} className="bg-blue-600 hover:bg-blue-700 px-6 rounded-lg font-bold">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {pecas.map((p, i) => (
                <span key={i} className="bg-blue-900/30 px-3 py-1 rounded-full text-xs border border-blue-500/50 text-blue-200">
                  {p} <button type="button" onClick={() => setPecas(pecas.filter((_, idx) => idx !== i))} className="text-red-400 ml-1">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-800">
            <h3 className="text-white font-bold mb-4">📸 Fotos</h3>
            <input 
              type="file" multiple accept="image/*" onChange={handleFotoChange} 
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white"
            />
          </div>
        </div>

        {/* COLUNA DA DIREITA: FINANCEIRO E STATUS */}
        <div className="space-y-6">
          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-800 shadow-xl">
            <h3 className="text-white font-bold mb-4">📜 Logs Internos</h3>
            <div className="flex gap-2 mb-4">
              <input 
                className="flex-1 bg-[#0f172a] border border-slate-700 rounded-lg p-2 text-sm text-white" 
                placeholder="Nota técnica..." 
                value={novaObs} 
                onChange={(e) => setNovaObs(e.target.value)} 
              />
              <button type="button" onClick={adicionarObs} className="bg-slate-700 px-3 rounded-lg text-xs font-bold hover:bg-slate-600">ADD</button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {historico.map((h, i) => (
                <p key={i} className="text-[11px] text-slate-400 bg-[#0f172a] p-2 rounded border-l-2 border-blue-500">{h}</p>
              ))}
            </div>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-xl border-2 border-emerald-500/20 shadow-2xl">
            <label className="block text-center text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Valor do Serviço *</label>
            <input 
              type="number" 
              className="w-full bg-[#0f172a] border-2 border-emerald-900/30 rounded-lg p-4 text-3xl text-center font-bold text-emerald-400 outline-none mb-4"
              value={valor} onChange={(e) => setValor(e.target.value)}
            />

            <label className="block text-center text-[10px] font-bold text-red-400/60 mb-2 uppercase tracking-widest">Custo Peças *</label>
            <input 
              type="number" 
              className="w-full bg-[#0f172a] border border-red-900/20 rounded-lg p-2 text-xl text-center font-bold text-red-400 outline-none mb-6"
              value={custoPecas} onChange={(e) => setCustoPecas(e.target.value)}
            />

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Garantia</label>
              <select className="w-full bg-[#0f172a] p-3 rounded-lg text-white" value={garantia} onChange={(e) => setGarantia(e.target.value)}>
                <option value="Sem Garantia">Sem Garantia</option>
                <option value="90 dias">90 dias</option>
                <option value="1 ano">1 ano</option>
              </select>
            </div>
            
            <div className="space-y-3">
              <button 
                type="button" 
                onClick={() => salvarNovaOS('Fila_de_Espera')} 
                disabled={loading} 
                className="w-full bg-slate-600 hover:bg-slate-700 py-3 rounded-lg font-bold text-white transition-all active:scale-95"
              >
                {loading ? 'Processando...' : 'COLOCAR NA FILA'}
              </button>

              <button 
                type="button" 
                onClick={() => salvarNovaOS('Em_Manutencao')} 
                disabled={loading} 
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold text-white transition-all active:scale-95"
              >
                {loading ? 'Processando...' : 'INICIAR REPARO'}
              </button>

              <button 
                type="button" 
                onClick={() => salvarNovaOS('Finalizado')} 
                disabled={loading} 
                className="w-full bg-emerald-600 hover:bg-emerald-700 py-4 rounded-lg font-bold text-white shadow-lg transition-all active:scale-95"
              >
                {loading ? 'Finalizando...' : 'FINALIZAR SERVIÇO'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}