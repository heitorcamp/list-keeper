'use client'

import { ProcessosItens } from "./components/SelecionarDefeitos";
import { ListaDefeitos } from "./data/listDefeitos";





const Page = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-500 to-indigo-600 flex justify-center items-center p-4 overflow-auto">
      <div className="w-full sm:max-w-md bg-white shadow-lg rounded-lg p-6 mx-auto">
        <h1 className="text-xl font-bold text-center text-blue-600 mb-4">
          Controle Keeper
        </h1>
        <ProcessosItens processos={ListaDefeitos} />
      </div>
    </div>
  );
};

export default Page;