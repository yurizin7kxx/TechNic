import { useState, useEffect } from 'react';
import { supabase } from '../../public/lib/supabase';

export default function PainelTecnicoEntrada() {
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [aparelho, setAparelho] = useState('');
  const [problema, setProblema] = useState('');
  const [valor, setValor] = useState('');
  const [loading, setLoading] = useState(false);

  // --- NOVOS ESTADOS ---
  const [pecas, setPecas] = useState([]); // Lista de peças usadas
  const [novaPeca, setNovaPeca] = useState('');
  const [historico, setHistorico] = useState([]); // Histórico de observações
  const [novaObs, setNovaObs] = useState('');
  const [fotos, setFotos] = useState([]); // Preview das fotos selecionadas
  const [arquivosFotos, setArquivosFotos] = useState([]); // Arquivos reais para upload

  useEffect(() => {
    async function carregarClientes() {
      const { data } = await supabase.from('usuarios').select('id, nome').eq('tipo', 'cliente');
      if (data) setClientes(data);
    }
    carregarClientes();
  }, []);

  // Funções de Gerenciamento Local
  const adicionarPeca = () => {
    if (novaPeca) {
      setPecas([...pecas, novaPeca]);
      setNovaPeca('');
    }
  };

  const adicionarObs = () => {
    if (novaObs) {
      const log = `${new Date().toLocaleTimeString('pt-BR')} - ${novaObs}`;
      setHistorico([log, ...historico]);
      setNovaObs('');
    }
  };

  const handleFotoChange = (e) => {
    const files = Array.from(e.target.files);
    setArquivosFotos([...arquivosFotos, ...files]);
    const URLs = files.map(file => URL.createObjectURL(file));
    setFotos([...fotos, ...URLs]);
  };

  const salvarNovaOS = async (statusFinal) => {
    if (!clienteSelecionado || !aparelho) return alert("Preencha os dados básicos!");

    setLoading(true);
    try {
      // 1. Upload das Fotos para o Storage (opcional se houver fotos)
      let linksFotos = [];
      for (const file of arquivosFotos) {
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage.from('os-fotos').upload(fileName, file);
        if (data) linksFotos.push(data.path);
      }

      // 2. Salvar no Banco
      const { error } = await supabase
        .from('servicos')
        .insert([{ 
          cliente_id: clienteSelecionado,
          aparelho,
          problema_identificado: problema,
          valor_total: parseFloat(valor) || 0,
          status: statusFinal,
          pecas_usadas: pecas, // Salva como array JSON
          historico_logs: historico, // Salva como array JSON
          fotos_url: linksFotos,
          data_entrada: new Date()
        }]);

      if (error) throw error;
      alert("OS registrada com sucesso!");
      
      // Resetar estados
      setAparelho(''); setProblema(''); setValor(''); setPecas([]); setHistorico([]); setFotos([]);
    } catch (error) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: DADOS E PEÇAS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-800 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2">Identificação e Defeito</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Cliente</label>
                <select 
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 mt-1"
                  value={clienteSelecionado} onChange={(e) => setClienteSelecionado(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Aparelho</label>
                <input className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 mt-1" value={aparelho} onChange={(e) => setAparelho(e.target.value)} />
              </div>
            </div>
            <textarea className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 h-24 mt-2" placeholder="Problema relatado..." value={problema} onChange={(e) => setProblema(e.target.value)} />
          </div>

          {/* NOVO: FILTRO DE PEÇAS E COMPONENTES */}
          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-800 shadow-xl">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">🛠 Peças e Componentes</h3>
            <div className="flex gap-2 mb-4">
              <input 
                className="flex-1 bg-[#0f172a] border border-slate-700 rounded-lg p-2" 
                placeholder="Ex: Tela iPhone 13, Bateria..."
                value={novaPeca} onChange={(e) => setNovaPeca(e.target.value)}
              />
              <button onClick={adicionarPeca} className="bg-blue-600 px-4 rounded-lg">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {pecas.map((p, i) => (
                <span key={i} className="bg-slate-700 px-3 py-1 rounded-full text-sm border border-slate-600 flex gap-2">
                  {p} <button onClick={() => setPecas(pecas.filter((_, idx) => idx !== i))} className="text-red-400">x</button>
                </span>
              ))}
            </div>
          </div>

          {/* NOVO: UPLOAD DE FOTOS */}
          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-800 shadow-xl">
            <h3 className="text-white font-bold mb-4">📸 Evidências Visuais (Fotos)</h3>
            <input type="file" multiple accept="image/*" onChange={handleFotoChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"/>
            <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
              {fotos.map((src, i) => <img key={i} src={src} className="h-24 w-24 object-cover rounded-lg border-2 border-slate-700" />)}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: HISTÓRICO E VALOR */}
        <div className="space-y-6">
          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-800 shadow-xl">
            <h3 className="text-white font-bold mb-4">📜 Histórico de Observações</h3>
            <div className="flex gap-2 mb-4">
              <input className="flex-1 bg-[#0f172a] border border-slate-700 rounded-lg p-2 text-sm" placeholder="Nova nota..." value={novaObs} onChange={(e) => setNovaObs(e.target.value)} />
              <button onClick={adicionarObs} className="bg-slate-700 px-3 rounded-lg text-xs font-bold uppercase">Add</button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {historico.map((h, i) => (
                <p key={i} className="text-[11px] text-slate-400 bg-[#0f172a] p-2 rounded border-l-2 border-blue-500">{h}</p>
              ))}
            </div>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-800 shadow-2xl">
            <label className="block text-center text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Valor do Orçamento</label>
            <input 
              type="number" className="w-full bg-[#0f172a] border-2 border-emerald-900/30 rounded-lg p-4 text-3xl text-center font-bold text-emerald-400 outline-none mb-6"
              value={valor} onChange={(e) => setValor(e.target.value)}
            />
            <div className="space-y-3">
              <button onClick={() => salvarNovaOS('Aguardando_Aprovacao')} disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 py-4 rounded-lg font-bold">Enviar Orçamento</button>
              <button onClick={() => salvarNovaOS('Em_Manutencao')} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-lg font-bold">Iniciar Manutenção</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}