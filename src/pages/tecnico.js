import { useState, useEffect } from 'react';
import Select from 'react-select';
import { supabase } from '../../public/lib/supabase';
import { toast } from 'sonner';

export default function PainelTecnicoEntrada() {
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState({});
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
  const [aceiteCliente, setAceiteCliente] = useState(false);
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [previsaoEntrega, setPrevisaoEntrega] = useState('');
  const [statusOS, setStatusOS] = useState('Em_Analise');

  async function carregarClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nome' , { ascending: true });

  if (error) {
    console.error('Erro ao buscar clientes:', error.message);
  } else {
    setClientes(data || []);
  }
}


useEffect(() => {
  carregarClientes();

  const channel = supabase
    .channel('clientes-update')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'clientes',
      },
      () => {
        carregarClientes();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  const handleSelecionarCliente = async (clienteId) => {
  if (!clienteId) {
    limparCampos(true);
    return;
  }

  try {
    const { data, error } = await supabase
  .from('servicos_tecnico')
  .select('*')
  .eq('cliente_id', clienteId)
  .order('tempo', { ascending: false })
  .limit(1)
  .maybeSingle();

    if (error) {
      console.error(error);
      return;
    }
const { data: clienteAtual } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .single();

    if (clienteAtual) {
      setCpfCnpj(clienteAtual.cpf_cnpj || '');
      setEndereco(clienteAtual.endereco || '');
      setTelefone(clienteAtual.telefone || '');
    }

    if (data) {

      setAparelho(data.equipamento || '');
      setProblema(data.descricao || '');
      setValor(data.preco?.toString() || '');
      setCustoPecas(data.valor_pecas?.toString() || '');
      setGarantia(data.garantia || '90 dias');
      setPrevisaoEntrega(data.previsao_entrega || '');
      setAceiteCliente(data.aceite_cliente || false);

    } else {

      limparCampos(false);

    }

  } catch (err) {

    console.error('Erro ao buscar OS ativa:', err);

  }
};

  const limparCampos = (limparCliente = true) => {
    if (limparCliente) setClienteSelecionado(null);
    setAparelho('');
    setProblema('');
    setValor('');
    setCustoPecas('');
    setGarantia('90 dias'); 
    setPecas([]);
    setHistorico([]);
    setFotos([]);
    setArquivosFotos([]);
    setAceiteCliente(false);
  };

  const adicionarPeca = () => {
    if (novaPeca.trim()) {
      setPecas([...pecas, novaPeca]);
      setNovaPeca('');
    }
  };

  const adicionarObs = async () => {
    if (!novaObs.trim()) return;
    if (!clienteSelecionado || !aparelho) return toast.warning("Selecione um cliente e aparelho primeiro!");

    const dataHora = new Date().toLocaleString('pt-BR');
    const novoLog = `${dataHora} - ${novaObs}`;
    const novoHistorico = [...historico, novoLog];

    setHistorico(novoHistorico);
    setNovaObs('');

    try {
      const { error } = await supabase
        .from('servicos_tecnico')
        .update({ historico_logs: novoHistorico })
        .eq('cliente_id', clienteSelecionado?.value) // Alterado para cliente_id
        .eq('equipamento', aparelho.trim()) // .trim() para evitar erro de restrição

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
    if (!clienteSelecionado?.value) return toast.warning("Selecione um Cliente!");
    if (!aparelho.trim()) return toast.warning("Informe o Aparelho/Modelo!");
    
    if (!aceiteCliente && (statusFinal === 'Em_Manutencao' || statusFinal === 'Finalizado')) {
        return toast.warning("O cliente precisa aceitar o orçamento antes de iniciar ou finalizar o serviço!");
    }

    if (!problema.trim()) return toast.warning("Descreva o Problema!");
    if (!valor || parseFloat(valor) <= 0) return toast.warning("Informe o Valor do Serviço!");
    if (!custoPecas || parseFloat(custoPecas) < 0) return toast.warning("Informe o Custo das Peças (pode ser 0)!");
    if (pecas.length === 0) return toast.warning("Adicione pelo menos uma peça (ou 'Nenhuma')!");

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
          
          if (uploadError) console.error("Erro upload foto:", uploadError.message);
          if (data) linksFotos.push(data.path);
        }
      }

      const historicoLimpo = historico.filter(h => h && h.trim() !== "");
      const pecasLimpas = pecas.filter(p => p && p.trim() !== "");
      const pecasString = pecasLimpas.join(', ');
      
      console.log(clienteSelecionado?.value);
      
      // MANTENDO SEU UPSERT: apenas garanti o trim() no equipamento
      const { error } = await supabase
        .from('servicos_tecnico')
        .upsert([{ 
          cliente_id: clienteSelecionado?.value || null, 

          cliente: clienteSelecionado?.cliente?.nome || '',

          tecnico: user.id,
          equipamento: aparelho.trim(), // Garante que ignore espaços extras
          status: statusOS,
          descricao: problema,
          preco: parseFloat(valor), 
          valor_pecas: parseFloat(custoPecas),
          peca_substituida: pecasString,
          garantia: garantia,
          aceite_cliente: aceiteCliente,
          previsao_entrega: previsaoEntrega || null,
          tempo: new Date().toISOString(),
          historico_logs: historicoLimpo,
          fotos_url: linksFotos 
        }], { onConflict: 'cliente_id, equipamento' });

      if (error) throw error;
      
      toast.warning(`✅ OS atualizada para: ${statusFinal.replace(/_/g, ' ')}`);
      
      if (statusFinal === 'Finalizado') {
        limparCampos();
      }

    } catch (error) {
      toast.warning('❌ Erro ao processar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-400 p-10 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
  
        {/* COLUNA DA ESQUERDA */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-800 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2 flex items-center gap-2">
              📝 Entrada de Serviço
            </h2>
            <div className="flex flex-col gap-2">
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Cliente</label>
                <Select
  placeholder="Selecione o cliente..."

  options={clientes.map(c => ({
    value: c.id,
    label: `${c.nome} || ${c.email}`,
    cliente: c
  }))}

  value={clienteSelecionado}

  onChange={(selected) => {
  setClienteSelecionado(selected || null);

  if (selected?.cliente) {
    setCpfCnpj(selected.cliente['cpf_cnpj'] || '');
    setEndereco(selected.cliente.endereco || '');
    setTelefone(selected.cliente.telefone || '');
  } else {
    setCpfCnpj('');
    setEndereco('');
    setTelefone('');
  }

  if (selected) {
    handleSelecionarCliente(selected.value);
  }
}}

  isClearable

  styles={{
    control: (base, state) => ({
      ...base,
      backgroundColor: '#0f172a',
      borderColor: state.isFocused ? '#3b82f6' : '#334155',
      borderWidth: '1px',
      borderRadius: '10px',
      minHeight: '48px',
      boxShadow: 'none',
      color: 'white',

      '&:hover': {
        borderColor: '#3b82f6',
      },
    }),

    menu: (base) => ({
      ...base,
      backgroundColor: '#08142b',
      border: '1px solid #334155',
      overflow: 'hidden',
      borderRadius: '10px',
      marginTop: '4px',
    }),

    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused
        ? '#2563eb'
        : '#08142b',
      color: 'white',
      cursor: 'pointer',
      padding: '12px',
    }),

    singleValue: (base) => ({
      ...base,
      color: 'white',
    }),

    input: (base) => ({
      ...base,
      color: 'white',
    }),

    placeholder: (base) => ({
      ...base,
      color: '#94a3b8',
    }),

    dropdownIndicator: (base) => ({
      ...base,
      color: '#94a3b8',
    }),

    indicatorSeparator: () => ({
      display: 'none',
    }),
  }}
/>

              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

  <div>
    <label className="text-xs text-slate-500 uppercase font-bold">
      CPF/CNPJ
    </label>

    <input
      type="text"
      value={cpfCnpj}
      readOnly
      className="w-full bg-[#0f172a] border border-slate-800 rounded-lg p-4 text-lg mt-1 text-white"
    />
  </div>

  <div>
    <label className="text-xs text-slate-500 uppercase font-bold">
      Telefone
    </label>

    <input
      type="text"
      value={telefone}
      readOnly
      className="w-full bg-[#0f172a] border border-slate-900 rounded-lg p-4 text-lg mt-1 text-white"
    />
  </div>

  <div className="md:col-span-2">
  <label className="text-xs text-slate-500 uppercase font-bold">
    Endereço
  </label>

    <input
      type="text"
      value={endereco}
      readOnly
      className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-4 text-lg mt-1 text-white"
    />
  </div>

</div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Aparelho / Modelo </label>
                <input 
                  placeholder="Ex: Samsung S23 Ultra"
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 mt-1 text-white outline-none focus:ring-2 focus:ring-blue-500" 
                  value={aparelho} onChange={(e) => setAparelho(e.target.value)} 
                />
              </div>
              
            </div>
            <label className="text-xs text-slate-500 uppercase font-bold">Relato do Problema</label>
            <textarea 
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 h-24 mt-1 text-white outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="O que o cliente relatou?" 
              value={problema} onChange={(e) => setProblema(e.target.value)} 
            />
          </div>

          <div className="mt-6">
  <label className="text-xs text-slate-500 uppercase font-bold">
    Peças Utilizadas
  </label>

  <textarea
    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 h-24 mt-1 text-white outline-none focus:ring-2 focus:ring-blue-500"
    placeholder="Ex: Tela OLED, Bateria, Flex Carga..."
    value={novaPeca}
    onChange={(e) => setNovaPeca(e.target.value)}
  />

  <button
    type="button"
    onClick={() => {
      if (novaPeca.trim()) {
        setPecas(
          novaPeca
            .split(',')
            .map(p => p.trim())
            .filter(p => p !== '')
        );

        setNovaPeca('');
      }
    }}
    className="mt-3 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold text-white transition-all"
  >
    SALVAR PEÇAS
  </button>

  <div className="flex flex-wrap gap-2 mt-4">
    {pecas.map((p, i) => (
      <span
        key={i}
        className="bg-blue-900/30 px-3 py-2 rounded-full text-xs border border-blue-500/50 text-blue-200"
      >
        {p}

        <button
          type="button"
          onClick={() =>
            setPecas(pecas.filter((_, idx) => idx !== i))
          }
          className="text-red-400 ml-2"
        >
          ×
        </button>
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

        {/* COLUNA DA DIREITA */}
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

          <div className={`bg-[#1e293b] p-6 rounded-xl border-2 transition-all duration-500 shadow-2xl ${aceiteCliente ? 'border-emerald-500' : 'border-slate-800'}`}>
            <label className="block text-center text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Valor do Serviço *</label>
            <input 
              type="number" 
              className={`w-full bg-[#0f172a] border-2 rounded-lg p-4 text-3xl text-center font-bold outline-none mb-4 transition-all ${aceiteCliente ? 'border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-400'}`}
              value={valor} onChange={(e) => setValor(e.target.value)}
            />

            <label className="block text-center text-[10px] font-bold text-red-400/60 mb-2 uppercase tracking-widest">Custo Peças *</label>
            <input 
              type="number" 
              className="w-full bg-[#0f172a] border border-red-900/20 rounded-lg p-2 text-xl text-center font-bold text-red-400 outline-none mb-6"
              value={custoPecas} onChange={(e) => setCustoPecas(e.target.value)}
            />

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Garantia</label>
              <select className="w-full bg-[#0f172a] p-3 rounded-lg text-white" value={garantia} onChange={(e) => setGarantia(e.target.value)}>
                <option value="Sem Garantia">Sem Garantia</option>
                <option value="90 dias">90 dias</option>
                <option value="1 ano">1 ano</option>
              </select>
            </div>

            <div className="mb-4">
  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">
    Previsão de Entrega
  </label>

  <input
    type="datetime-local"
    value={previsaoEntrega}
    onChange={(e) => setPrevisaoEntrega(e.target.value)}
    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>

            <div className="mb-4">
  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">
    Status da OS
  </label>

  <select
    value={statusOS}
    onChange={(e) => setStatusOS(e.target.value)}
    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="Em_Analise">
      Em Análise
    </option>

    <option value="Aguardando_Aprovacao">
      Aguardando Aprovação
    </option>

    <option value="Em_Manutencao">
      Em Manutenção
    </option>

    <option value="Pronto_Aguardando_Retirada">
      Pronto - Aguardando Retirada
    </option>

    <option value="Finalizado">
      Finalizado
    </option>
  </select>
</div>

            <div 
                className={`mb-6 p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${aceiteCliente ? 'bg-emerald-900/40 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] animate-pulse' : 'bg-slate-800 border-slate-700 opacity-50'}`}
            >
                <div className={`w-3 h-3 rounded-full ${aceiteCliente ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-slate-600'}`}></div>
                <span className={`text-xs font-black uppercase tracking-widest ${aceiteCliente ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {aceiteCliente ? 'ORÇAMENTO ACEITO' : 'AGUARDANDO CLIENTE'}
                </span>
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
                className={`w-full py-3 rounded-lg font-bold text-white transition-all active:scale-95 ${aceiteCliente ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-900/20 text-blue-500/50 cursor-not-allowed opacity-50'}`}
              >
                {loading ? 'Processando...' : 'INICIAR REPARO'}
              </button>

              <button 
                type="button" 
                onClick={() => salvarNovaOS('Finalizado')} 
                disabled={loading} 
                className={`w-full py-4 rounded-lg font-bold text-white shadow-lg transition-all active:scale-95 ${aceiteCliente ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-900/20 text-emerald-500/50 cursor-not-allowed opacity-50'}`}
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