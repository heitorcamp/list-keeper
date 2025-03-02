import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


type Props = {
  listaCarros: { vin: string; item: string; defeito: string }[];
  vin: string;
  onclick: () => void;
};

export const ListaCarros = ({ listaCarros, onclick }: Props) => {
  const [hmc, setHmc] = useState<{ [vin: number]: string }>({});

  // Carrega os dados do Local Storage ao montar o componente
  useEffect(() => {
    const storedHmc = localStorage.getItem("hmcData");
    if (storedHmc) {
      setHmc(JSON.parse(storedHmc)); // Converte de string para objeto
    }
  }, []);

  // Atualiza o Local Storage sempre que o estado mudar
  useEffect(() => {
    if (Object.keys(hmc).length > 0) { // Evita salvar um objeto vazio no início
      localStorage.setItem("hmcData", JSON.stringify(hmc));
    }
  }, [hmc]);

  const handleHmc = (vin: number) => {
    const newHmc = window.prompt("Add HMC:");
    if (newHmc) {
      setHmc((prev) => {
        const updatedHmc = { ...prev, [vin]: newHmc };
        localStorage.setItem("hmcData", JSON.stringify(updatedHmc)); // Salva imediatamente
        return updatedHmc;
      });
    }
  };

  const exportToExcel = (listaCarros: { vin: string; item: string; defeito: string }[], hmc: { [key: number]: string }) => {
    // Adicionar HMC aos dados da lista
    const listaComHmc = listaCarros.map((carro, key) => ({
      VIN: carro.vin,
      Item: carro.item,
      Defeito: carro.defeito,
      HMC: hmc[key] || "N/A", // Se não tiver HMC, coloca "N/A"
    }));
  
    // Criar um novo worksheet (planilha)
    const worksheet = XLSX.utils.json_to_sheet(listaComHmc);
  
    // Criar um novo workbook (arquivo Excel)
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lista de Defeitos");
  
    // Gerar o arquivo Excel e salvar
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
  
    saveAs(data, "lista_defeitos.xlsx");
  };
  

  return (
    <div>
      {listaCarros.length > 0 ? (
        <table className="table-auto text-black w-full border-collapse border border-gray-400">
          <thead>
            <tr>
              <th className="border border-gray-400 px-4 py-2">SEQ</th>
              <th className="border border-gray-400 px-4 py-2">VIN</th>
              <th className="border border-gray-400 px-4 py-2">Item</th>
              <th className="border border-gray-400 px-4 py-2">Defeito</th>
              <th className="border border-gray-400 px-4 py-2">HMC</th>
            </tr>
          </thead>
          <tbody>
            {listaCarros.map((item, key) => (
              <tr key={key}>
                <td className="border border-gray-400 px-4 py-2">{item.vin}</td>
                <td className="border border-gray-400 px-4 py-2">{<button className="bg-green-600 text-white px-2 py-1 rounded-md">add vin</button>}</td> 
                <td className="border border-gray-400 px-4 py-2">{item.item}</td>
                <td className="border border-gray-400 px-4 py-2">{item.defeito}</td>
                <td className="border border-gray-400 px-4 py-2">
                  {hmc[key] ? (
                    hmc[key]
                  ) : (
                    <button
                      onClick={() => handleHmc(key)}
                      className="bg-green-600 text-white px-2 py-1 rounded-md"
                    >
                      Add HMC
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-black">Nenhuma operação registrada.</p>
      )}
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded mt-4"
        onClick={onclick}
      >
        Voltar
      </button>
      <button
  className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded mt-4 ml-32"
  onClick={() => exportToExcel(listaCarros, hmc)}
>
  Exportar para Excel
</button>
    </div>
  );
};
