"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../public/lib/supabase';
import { useRouter } from 'next/navigation';

export default function TechDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");

  // Simulação de busca de dados do perfil
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('perfis').select('nome_completo').eq('id', user.id).single();
        if (data) setUserName(data.nome_completo.split(' ')[0]);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Top Navigation Bar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
            <span className="text-xl font-bold tracking-tighter text-white uppercase">Tech<span className="text-blue-500">Nic</span></span>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-slate-400">Status: <span className="text-emerald-400 animate-pulse">Online</span></span>
            <button 
              onClick={handleLogout}
              className="px-4 py-1.5 rounded-full border border-slate-700 hover:bg-slate-800 transition text-sm font-semibold"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {/* Header Section */}
        <header className="mb-10">
          <h1 className="text-4xl font-black text-white mb-2">Bem-vindo, {userName}.</h1>
          <p className="text-slate-400 uppercase tracking-[0.2em] text-xs font-bold">Terminal Central de Operações</p>
        </header>

        {/* Grid de Cards Tecnológicos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card de Status de Rede (Referência a 5G/Telecom) */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Network Slicing</h3>
              <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div>
            </div>
            <div className="text-3xl font-mono font-bold text-white italic">5G_ACTIVE</div>
            <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[85%] group-hover:shadow-[0_0_10px_#3b82f6] transition-all"></div>
            </div>
          </div>

          {/* Card de Tráfego/Segurança */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:border-cyan-500/50 transition-all">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Traffic Monitor</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">1.2s</span>
              <span className="text-emerald-400 text-sm font-bold">Latency OK</span>
            </div>
            <p className="text-slate-500 text-sm mt-2">Segurança viária integrada via CTB v2.0</p>
          </div>

          {/* Card de Experimentos (Referência à tela Flux) */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-xl transition-transform hover:scale-[1.02] cursor-pointer"
               onClick={() => router.push('/flux')}>
            <div className="relative z-10">
              <h3 className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-4">Laboratório Flux</h3>
              <p className="text-2xl font-bold text-white mb-4">Acesse Experimentos Visuais</p>
              <span className="text-white/80 text-sm flex items-center gap-2">
                Entrar no Lab →
              </span>
            </div>
            {/* Decoração de fundo */}
            <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-white/10 rounded-full blur-3xl"></div>
          </div>

        </div>

        {/* Seção de Logs / Atividade */}
        <section className="mt-10 bg-slate-900/20 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
            Logs do Sistema
          </h2>
          <div className="space-y-4 font-mono text-sm">
            <div className="flex gap-4 border-l-2 border-slate-700 pl-4 py-1">
              <span className="text-slate-600">11:05:42</span>
              <span className="text-blue-400 font-bold">[AUTH]</span>
              <span className="text-slate-400">Sessão iniciada com sucesso.</span>
            </div>
            <div className="flex gap-4 border-l-2 border-slate-700 pl-4 py-1">
              <span className="text-slate-600">11:05:40</span>
              <span className="text-emerald-400 font-bold">[DB]</span>
              <span className="text-slate-400">Handshake completo com Supabase_Node_01.</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}