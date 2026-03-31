import { useState, useEffect } from 'react';
import { supabase } from '../../public/lib/supabase';

export default function PainelTecnicoEntrada() {
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [aparelho, setAparelho] = useState('');
  const [problema, setProblema] = useState('');
  const [valor, setValor] = useState('');
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
        // Ajustado para ler da coluna 'preço' do seu banco
        setValor(data.preço?.toString() || '');
        setGarantia(data.garantia || '90 dias');
        setPecas(Array.isArray(data.pecas_usadas) ? data.pecas_usadas : []);
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
      // Sincroniza imediatamente com o banco
      const { error } = await supabase
        .from('servicos_tecnico')
        .update({ historico_logs: novoHistorico })
        .eq('cliente', clienteSelecionado)
        .eq('equipamento', aparelho)
        .neq('status', 'Finalizado');

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao salvar log:", error.message);
      alert("Erro ao sincronizar log com o banco de dados.");
    }
  };

  const handleFotoChange = (e) => {
    const files = Array.from(e.target.files);
    setArquivosFotos([...arquivosFotos, ...files]);
    const URLs = files.map(file => URL.createObjectURL(file));
    setFotos([...fotos, ...URLs]);
  };

  const salvarNovaOS = async (statusFinal) => {
    if (!clienteSelecionado || !aparelho) return alert("Preencha o cliente e o aparelho!");

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Você precisa estar logado.");

      let linksFotos = [];
      if (arquivosFotos.length > 0) {
        for (const file of arquivosFotos) {
          const fileName = `os/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
          const { data, error: uploadError } = await supabase.storage
            .from('os-fotos')
            .upload(fileName, file);
          
          if (data) linksFotos.push(data.path);
        }
      }

      // Limpeza de dados para evitar strings vazias ou nulas
      const historicoLimpo = historico.filter(h => h && h.trim() !== "");
      const pecasLimpas = pecas.filter(p => p && p.trim() !== "");

      const { error } = await supabase
        .from('servicos_tecnico')
        .upsert([{ 
          cliente: clienteSelecionado,
          tecnico: user.id,
          equipamento: aparelho,
          status: statusFinal,
          descricao: problema,
          // CORREÇÃO: Usando o nome exato da coluna no seu banco ('preço')
          preço: parseFloat(valor) || 0, 
          garantia: garantia,
          tempo: new Date(),
          pecas_usadas: pecasLimpas.length > 0 ? pecasLimpas : null,
          historico_logs: historicoLimpo.length > 0 ? historicoLimpo : null,
          fotos_url: linksFotos 
        }], { onConflict: 'cliente, equipamento' });

      if (error) throw error;
      
      alert(`✅ OS salva com sucesso!`);
      limparCampos();

    } catch (error) {
      alert('❌ Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-800 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2 flex items-center gap-2">
              📝 Entrada de Serviço
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Cliente</label>
                <select 
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 mt-1 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={clienteSelecionado} 
                  onChange={(e) => handleSelecionarCliente(e.target.value)}
                >
                  <option value="">Selecione o cliente...</option>
                  {clientes.map(c => {
                    const nomeParaExibir = c.nome_completo || c.email;
                    return (
                      <option key={c.id} value={nomeParaExibir}>
                        {nomeParaExibir}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Aparelho / Modelo</label>
                <input 
                  placeholder="Ex: Samsung S23 Ultra"
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 mt-1 text-white outline-none focus:ring-2 focus:ring-blue-500" 
                  value={aparelho} onChange={(e) => setAparelho(e.target.value)} 
                />
              </div>
            </div>
            <label className="text-xs text-slate-500 uppercase font-bold">Relato do Problema (Descrição)</label>
            <textarea 
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 h-24 mt-1 text-white outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="O que o cliente relatou?" 
              value={problema} onChange={(e) => setProblema(e.target.value)} 
            />
          </div>

          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-800">
            <h3 className="text-white font-bold mb-4">🛠 Peças Substituídas</h3>
            <div className="flex gap-2 mb-4">
              <input 
                className="flex-1 bg-[#0f172a] border border-slate-700 rounded-lg p-2 text-white outline-none" 
                placeholder="Nova peça..."
                value={novaPeca} onChange={(e) => setNovaPeca(e.target.value)}
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
            <h3 className="text-white font-bold mb-4">📸 Fotos do Aparelho</h3>
            <input 
              type="file" multiple accept="image/*" onChange={handleFotoChange} 
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white"
            />
          </div>
        </div>

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
              <button 
                type="button" 
                onClick={adicionarObs} 
                className="bg-slate-700 px-3 rounded-lg text-xs font-bold transition-colors hover:bg-slate-600"
              >
                ADD
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {historico.map((h, i) => (
                <p key={i} className="text-[11px] text-slate-400 bg-[#0f172a] p-2 rounded border-l-2 border-blue-500">{h}</p>
              ))}
            </div>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-xl border-2 border-emerald-500/20 shadow-2xl">
            <label className="block text-center text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Valor do Serviço (R$)</label>
            <input 
              type="number" 
              className="w-full bg-[#0f172a] border-2 border-emerald-900/30 rounded-lg p-4 text-3xl text-center font-bold text-emerald-400 outline-none mb-6"
              value={valor} onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
            />

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Tempo de Garantia</label>
              <select 
                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={garantia}
                onChange={(e) => setGarantia(e.target.value)}
              >
                <option value="Sem Garantia">Sem Garantia</option>
                <option value="30 dias">30 dias</option>
                <option value="90 dias">90 dias</option>
                <option value="6 meses">6 meses</option>
                <option value="1 ano">1 ano</option>
              </select>
            </div>
            
            <div className="space-y-3">
              <button type="button" onClick={() => salvarNovaOS('Fila_de_Espera')} disabled={loading} className="w-full bg-slate-600 hover:bg-slate-700 py-3 rounded-lg font-bold text-white transition-transform active:scale-95">
                {loading ? '...' : 'COLOCAR NA FILA'}
              </button>

              <button type="button" onClick={() => salvarNovaOS('Em_Manutencao')} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold text-white transition-transform active:scale-95">
                {loading ? '...' : 'INICIAR REPARO'}
              </button>

              <button type="button" onClick={() => salvarNovaOS('Finalizado')} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 py-4 rounded-lg font-bold text-white shadow-lg shadow-emerald-900/20 transition-transform active:scale-95">
                {loading ? 'Salvando...' : 'FINALIZAR SERVIÇO'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}