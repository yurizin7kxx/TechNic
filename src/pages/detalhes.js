import Link from 'next/link';

export default function DetalhesOSPage() {
  // Dados fictícios de uma O.S. específica
  const os = {
    id: 'OS1024',
    status: 'Em Manutenção',
    cliente: 'Yuri Silva',
    contato: '(11) 98765-4321',
    equipamento: 'Notebook Dell XPS 13',
    defeito_relatado: 'Superaquecimento e desligamento repentino.',
    data_abertura: '25/05/2024 às 14:30',
    tecnico: 'Marcos Oliveira',
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <nav className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
        <Link href="/dashboard-tecnico" className="text-sm text-blue-400 hover:underline">← Voltar à Lista</Link>
        <span className="text-sm font-mono text-gray-500">TechNic ID: {os.id}</span>
      </nav>

      <main className="p-6 md:p-10 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-bold">{os.equipamento}</h1>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
                {os.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><strong className="text-gray-400">Cliente:</strong> {os.cliente}</p>
              <p><strong className="text-gray-400">Contato:</strong> {os.contato}</p>
              <p><strong className="text-gray-400">Abertura:</strong> {os.data_abertura}</p>
              <p><strong className="text-gray-400">Técnico:</strong> {os.tecnico || 'Não atribuído'}</p>
            </div>
            
            <div className="mt-6 p-4 bg-slate-700 rounded-md border border-slate-600">
              <p className="text-xs text-gray-400 mb-1">Defeito Relatado:</p>
              <p className="text-sm italic text-gray-200">"{os.defeito_relatado}"</p>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h2 className="text-lg font-semibold mb-4">Laudo Técnico / Evolução</h2>
            <textarea rows="4" placeholder="Adicionar nova observação técnica..." className="w-full px-4 py-2.5 rounded-md bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-4"></textarea>
            <div className="flex justify-end">
                <button className="bg-gray-600 hover:bg-gray-700 text-sm px-4 py-2 rounded-md font-medium">
                    Salvar Observação
                </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit space-y-4">
          <h3 className="font-semibold text-gray-300">Ações</h3>
          <button className="w-full bg-yellow-600 hover:bg-yellow-700 py-2 rounded-md text-sm font-medium">Aprovar Orçamento</button>
          <button className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-md text-sm font-medium">Marcar como Concluído</button>
          <button className="w-full bg-red-600/20 text-red-400 border border-red-600/50 hover:bg-red-600/30 py-2 rounded-md text-sm font-medium">Gerar NF-e</button>
        </div>
      </main>
    </div>
  );
}