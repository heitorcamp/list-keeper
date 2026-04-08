"use client";

import { ProcessosItens } from "./components/SelecionarDefeitos";
import { ListaDefeitos } from "./data/listDefeitos";

const Page = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 px-3 py-3 text-slate-950 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-7xl items-start justify-center sm:min-h-[calc(100vh-3rem)] sm:items-center">
        <div className="w-full rounded-[26px] bg-[#f7f7f5] p-3 shadow-[0_25px_60px_rgba(15,23,42,0.28)] sm:rounded-[34px] sm:p-7">
          <ProcessosItens processos={ListaDefeitos} />
        </div>
      </div>
    </main>
  );
};

export default Page;
