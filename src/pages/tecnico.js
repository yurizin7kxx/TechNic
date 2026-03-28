import { useState } from 'react';
import { supabase } from '../../public/lib/supabase';

export default function TelaTecnico() {
  const [status, setStatus] = useState('pendente');
  const [relatorio, setRelatorio] = useState('');
  const [loading, setLoading] = useState(false);

  // Função para salvar no banco de dados
  const salvarProgresso = async (novoStatus) => {
    setLoading(true);
    try {
      // Exemplo: Atualizando um serviço específico (precisa do ID do serviço)
      const { error } = await supabase
        .from('servicos')
        .update({ 
          status: novoStatus, 
          relatorio_tecnico: relatorio,
          data_atualizacao: new Date() 
        })
        .eq('id', 'ID_DO_SERVICO_AQUI'); // Você pegaria esse ID de uma lista

      if (error) throw error;
      
      setStatus(novoStatus);
      alert(`Status atualizado para: ${novoStatus}`);
    } catch (error) {
      alert('Erro ao atualizar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Painel do Técnico - TechNic</h1>

      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 max-w-2xl">
        <label className="block mb-2 text-sm font-medium">Relatório Técnico:</label>
        <textarea
          className="w-full bg-slate-700 border border-slate-600 rounded p-3 mb-6 h-32 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Descreva o problema ou a solução..."
          value={relatorio}
          onChange={(e) => setRelatorio(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Botão: Em Processo */}
          <button
            onClick={() => salvarProgresso('em_processo')}
            disabled={loading}
            className={`py-2 rounded font-bold transition ${status === 'em_processo' ? 'bg-yellow-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
          >
            Em Processo
          </button>

          {/* Botão: Problema Identificado */}
          <button
            onClick={() => salvarProgresso('identificado')}
            disabled={loading}
            className={`py-2 rounded font-bold transition ${status === 'identificado' ? 'bg-orange-600' : 'bg-orange-500 hover:bg-orange-600'}`}
          >
            Identificado
          </button>

          {/* Botão: Resolvido */}
          <button
            onClick={() => salvarProgresso('resolvido')}
            disabled={loading}
            className={`py-2 rounded font-bold transition ${status === 'resolvido' ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            Resolvido
          </button>
        </div>
      </div>
    </div>
  );
}