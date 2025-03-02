
import { useEffect, useState } from "react";
import { typeListaDefeitos } from "../types/typeListaDefeitos";
import { ListaCarros } from "./ListaCarros";


type Props = {
  processos: typeListaDefeitos[];
};

export const ProcessosItens = ({ processos }: Props) => {
  const [viewProcesso, setViewProcesso] = useState(false);
  const [showDefeito, setShowOperacao] = useState(false);
  const [showList, setShowList] = useState(false);
  const [vinAtual, setVinAtual] = useState("");
  const [processoAtual, setProcessoAtual] = useState(0);
  const [listaCarros, setListaCarros] = useState <{vin: string, item: string, defeito:string}[]>([]);

  // Carregar do LocalStorage ao montar o componente
  useEffect(() => {
    const savedData = localStorage.getItem("listaCarros");
    if (savedData) {
      setListaCarros(JSON.parse(savedData));
    }
  }, []);

  // Salvar no LocalStorage sempre que a lista mudar
  useEffect(() => {
    localStorage.setItem("listaCarros", JSON.stringify(listaCarros));
  }, [listaCarros]);

  const handleSequencia = () => {
    if (vinAtual && vinAtual.length === 3) {
      setViewProcesso(true);
    } else {
      alert("Digite uma sequência válida");
    }
  };

  const handleProcesso = (index: number) => {
    setProcessoAtual(index);
    setShowOperacao(true);
    setViewProcesso(false);
  };

  const addOperacao = (def: typeListaDefeitos, index: number) => {
    setListaCarros((prevListaCarros) => [
      ...prevListaCarros,
      { vin: vinAtual, item: def.item, defeito: def.defeito[index] },
    ]);
    setShowOperacao(false);
    setShowList(true);
  };

  const handleVoltar = () => {
    setShowList(false);
    setVinAtual("");
  };

  const handleLimparLista = () => {
    if (window.confirm("Tem certeza que deseja limpar toda a lista?")) {
      setListaCarros([]);
      localStorage.removeItem("listaCarros"); // Remove do LocalStorage
      localStorage.removeItem("hmcData");
    }
  };

  const mostrarLista = () => {
    setShowList(true);
  };

  return (
    <div className="flex items-center justify-center flex-col">
      {!viewProcesso && !showDefeito && !showList && (
        <div className="">
          <input
            className="text-black p-2 m-2 border border-gray-500"
            placeholder="Digite a sequência"
            type="tel"
            value={vinAtual}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ""); // Remove caracteres não numéricos
              setVinAtual(value);
            }}
          />
          <button
            className="bg-blue-700 rounded-md p-1"
            onClick={handleSequencia}
          >
            Add sequência
          </button>
          <button
            className="bg-green-400 rounded-md p-1"
            onClick={mostrarLista}
          >
            Mostrar Lista
          </button>
        </div>
      )}
      {viewProcesso && (
        <div className="grid grid-cols-2 gap-4">
          {processos.map((proc, index) => (
            <button
              key={index}
              className="bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600 transition"
              onClick={() => handleProcesso(index)}
            >
              {proc.item}
            </button>
          ))}
        </div>
      )}
      {showDefeito && (
        <div className="grid grid-cols-2 gap-4">
           {processos[processoAtual].defeito.map((def, index) => (
         <button
          key={index}
          className="bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600 transition"
          onClick={() => addOperacao(processos[processoAtual], index)}
          >
           {def}
         </button>
))}
          
        </div>
      )}
      {showList && (
        <ListaCarros
          vin={vinAtual}
          listaCarros={listaCarros}
          onclick={handleVoltar}
        />
      )}
      {showList && (
        <button
          className="bg-red-500 text-white py-1 px-2 rounded mt-10"
          onClick={handleLimparLista}
        >
          Limpar Lista
        </button>
      )}
    </div>
  );
};
