'use client';

import { useEffect, useState } from "react";
import {
  CampoEditavelRegistro,
  RegistroDefeito,
  typeListaDefeitos,
} from "../types/typeListaDefeitos";
import { ListaCarros } from "./ListaCarros";

type Props = {
  processos: typeListaDefeitos[];
};

type Etapa = "sequencia" | "item" | "defeito" | "registro" | "lista";

type DraftRegistro = {
  sequencia: string;
  item: string;
  defeito: string;
  seguranca: boolean;
  detalhes: string;
  vin: string;
  hmcTl: string;
  hmcTm: string;
  processo: string;
  createdAt: string;
};

const STORAGE_KEY = "listKeeper.registros.v3";

const createDraft = (): DraftRegistro => ({
  sequencia: "",
  item: "",
  defeito: "",
  seguranca: false,
  detalhes: "",
  vin: "",
  hmcTl: "",
  hmcTm: "",
  processo: "",
  createdAt: "",
});

export const ProcessosItens = ({ processos }: Props) => {
  const [etapa, setEtapa] = useState<Etapa>("sequencia");
  const [sequenciaInput, setSequenciaInput] = useState("");
  const [draft, setDraft] = useState<DraftRegistro>(createDraft);
  const [registros, setRegistros] = useState<RegistroDefeito[]>([]);
  const [showDetalhesDraft, setShowDetalhesDraft] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
      return;
    }

    try {
      const parsedData = JSON.parse(savedData) as Array<
        Partial<RegistroDefeito> & Pick<RegistroDefeito, "id" | "sequencia" | "item" | "defeito" | "createdAt" | "updatedAt">
      >;

      setRegistros(
        parsedData.map((registro) => ({
          id: registro.id,
          sequencia: registro.sequencia,
          item: registro.item,
          defeito: registro.defeito,
          seguranca: Boolean(registro.seguranca),
          detalhes: registro.detalhes ?? "",
          vin: registro.vin ?? "",
          hmcTl: registro.hmcTl ?? "",
          hmcTm: registro.hmcTm ?? "",
          processo: registro.processo ?? "",
          createdAt: registro.createdAt,
          updatedAt: registro.updatedAt,
        })),
      );
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
  }, [registros]);

  const processoSelecionado = processos.find((proc) => proc.item === draft.item);
  const registrosDoDia = getTodayRecords(registros);

  const avancarSequencia = () => {
    const sequencia = sequenciaInput.trim();

    if (!sequencia) {
      window.alert("Digite uma sequência válida.");
      return;
    }

    setDraft({
      ...createDraft(),
      sequencia,
    });
    setSequenciaInput("");
    setEtapa("item");
  };

  const selecionarItem = (item: string) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      item,
      defeito: "",
    }));
    setEtapa("defeito");
  };

  const selecionarDefeito = (defeito: string) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      defeito,
      seguranca: false,
      createdAt: new Date().toISOString(),
    }));
    setEtapa("registro");
  };

  const atualizarCampoDraft = (campo: CampoEditavelRegistro, valor: string) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [campo]: valor,
    }));
  };

  const salvarRegistro = () => {
    if (!draft.sequencia || !draft.item || !draft.defeito) {
      window.alert("Preencha sequência, item e defeito antes de salvar.");
      return;
    }

    const now = draft.createdAt || new Date().toISOString();
    const novoRegistro: RegistroDefeito = {
      id: crypto.randomUUID(),
      sequencia: draft.sequencia,
      item: draft.item,
      defeito: draft.defeito,
      seguranca: draft.seguranca,
      detalhes: draft.detalhes,
      vin: draft.vin,
      hmcTl: draft.hmcTl,
      hmcTm: draft.hmcTm,
      processo: draft.processo,
      createdAt: now,
      updatedAt: new Date().toISOString(),
    };

    setRegistros((currentList) => [novoRegistro, ...currentList]);
    setDraft(createDraft());
    setShowDetalhesDraft(false);
    setEtapa("lista");
  };

  const novoRegistro = () => {
    setDraft(createDraft());
    setShowDetalhesDraft(false);
    setEtapa("sequencia");
  };

  const handleAtualizarRegistro = (
    id: string,
    campo: CampoEditavelRegistro,
    valor: string,
  ) => {
    setRegistros((currentList) =>
      currentList.map((registro) =>
        registro.id === id
          ? {
              ...registro,
              [campo]: valor,
              updatedAt: new Date().toISOString(),
            }
          : registro,
      ),
    );
  };

  const handleLimparDia = () => {
    if (!registrosDoDia.length) {
      window.alert("Não há registros do dia para limpar.");
      return;
    }

    if (!window.confirm("Tem certeza que deseja limpar os registros de hoje?")) {
      return;
    }

    const todayKey = getLocalDateKey(new Date().toISOString());
    setRegistros((currentList) =>
      currentList.filter(
        (registro) => getLocalDateKey(registro.createdAt) !== todayKey,
      ),
    );
  };

  if (etapa === "lista") {
    return (
      <ListaCarros
        registros={registrosDoDia}
        onBack={novoRegistro}
        onClearDay={handleLimparDia}
        onUpdateField={handleAtualizarRegistro}
      />
    );
  }

  return (
    <section className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-4">
        <StatusCard
          label="1. Sequência"
          value={draft.sequencia || "Pendente"}
          active={etapa === "sequencia"}
          complete={Boolean(draft.sequencia)}
        />
        <StatusCard
          label="2. Item"
          value={draft.item || "Pendente"}
          active={etapa === "item"}
          complete={Boolean(draft.item)}
        />
        <StatusCard
          label="3. Defeito"
          value={draft.defeito || "Pendente"}
          active={etapa === "defeito"}
          complete={Boolean(draft.defeito)}
        />
        <StatusCard
          label="Hoje"
          value={`${registrosDoDia.length} registros`}
          active={false}
          complete={registrosDoDia.length > 0}
        />
      </div>

      {etapa === "sequencia" && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-4 sm:rounded-[28px] sm:p-6">
          <div className="mx-auto max-w-2xl space-y-4 sm:space-y-5">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                Digite a sequência
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
              <input
                className="h-16 rounded-3xl border border-slate-300 bg-slate-50 px-4 text-center text-3xl font-semibold text-slate-950 outline-none sm:h-20 sm:px-6 sm:text-4xl"
                placeholder="000"
                type="tel"
                value={sequenciaInput}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "");
                  setSequenciaInput(value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    avancarSequencia();
                  }
                }}
              />
              <button
                className="h-16 rounded-3xl bg-cyan-400 text-lg font-semibold text-slate-950 transition hover:bg-cyan-300 sm:h-20 sm:text-xl"
                onClick={avancarSequencia}
              >
                Continuar
              </button>
            </div>

            <button
              className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-200"
              onClick={() => setEtapa("lista")}
            >
              Ver lista do dia
            </button>
          </div>
        </section>
      )}

      {etapa === "item" && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-4 sm:rounded-[28px] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Sequência</p>
              <strong className="font-mono text-3xl text-slate-950 sm:text-4xl">
                {draft.sequencia}
              </strong>
            </div>
            <button
              className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              onClick={() => setEtapa("sequencia")}
            >
              Voltar
            </button>
          </div>

          <h2 className="mb-4 text-2xl font-semibold text-slate-950 sm:text-3xl">
            Escolha o item
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {processos.map((proc) => (
              <button
                key={proc.item}
                className="min-h-24 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-5 text-xl font-semibold text-slate-900 transition hover:border-cyan-300 hover:bg-cyan-50 sm:min-h-32 sm:rounded-[28px] sm:py-6 sm:text-2xl"
                onClick={() => selecionarItem(proc.item)}
              >
                {proc.item}
              </button>
            ))}
          </div>
        </section>
      )}

      {etapa === "defeito" && processoSelecionado && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-4 sm:rounded-[28px] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Item</p>
              <strong className="text-3xl text-slate-950 sm:text-4xl">
                {draft.item}
              </strong>
            </div>
            <button
              className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              onClick={() => setEtapa("item")}
            >
              Voltar
            </button>
          </div>

          <h2 className="mb-4 text-2xl font-semibold text-slate-950 sm:text-3xl">
            Escolha o defeito
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {processoSelecionado.defeito.map((defeito) => (
              <button
                key={`${draft.item}-${defeito}`}
                className="min-h-24 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-5 text-xl font-semibold text-slate-900 transition hover:border-emerald-300 hover:bg-emerald-50 sm:min-h-32 sm:rounded-[28px] sm:py-6 sm:text-2xl"
                onClick={() => selecionarDefeito(defeito)}
              >
                {defeito}
              </button>
            ))}
          </div>
        </section>
      )}

      {etapa === "registro" && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-4 sm:rounded-[28px] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                Linha criada
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Complete os campos direto na linha e depois salve.
              </p>
            </div>
            <button
              className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              onClick={() => setEtapa("defeito")}
            >
              Voltar
            </button>
          </div>

          <div className="hidden overflow-x-auto rounded-[22px] border border-slate-300 md:block">
            <table className="min-w-[900px] w-full border-collapse text-center">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <DraftHeader>SEQ</DraftHeader>
                  <DraftHeader>SEG.</DraftHeader>
                  <DraftHeader>VIN</DraftHeader>
                  <DraftHeader>ITEM</DraftHeader>
                  <DraftHeader>DEFEITO</DraftHeader>
                  <DraftHeader>HMC TL</DraftHeader>
                  <DraftHeader>HMC TM</DraftHeader>
                  <DraftHeader>PROCESSO</DraftHeader>
                  <DraftHeader>HORA</DraftHeader>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-300">
                  <DraftCell className="font-semibold text-slate-900">
                    {draft.sequencia}
                  </DraftCell>
                  <DraftCell>
                    <button
                      className={`h-12 rounded-xl px-3 text-sm font-semibold transition ${
                        draft.seguranca
                          ? "bg-rose-500 text-white hover:bg-rose-400"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                      onClick={() =>
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          seguranca: !currentDraft.seguranca,
                        }))
                      }
                    >
                      {draft.seguranca ? "Segurança" : "Normal"}
                    </button>
                  </DraftCell>
                  <DraftCell>
                    <CampoLinha
                      value={draft.vin}
                      placeholder="ABC123456"
                      compact
                      maxLength={9}
                      className="max-w-[128px]"
                      onChange={(valor) => atualizarCampoDraft("vin", normalizeVin(valor))}
                    />
                  </DraftCell>
                  <DraftCell className="max-w-[92px] whitespace-normal text-sm font-medium leading-tight text-slate-900">
                    {draft.item}
                  </DraftCell>
                  <DraftCell className="max-w-[110px] whitespace-normal text-sm font-medium leading-tight text-slate-900">
                    {draft.defeito}
                  </DraftCell>
                  <DraftCell>
                    <CampoLinha
                      value={draft.hmcTl}
                      placeholder="0000"
                      compact
                      maxLength={4}
                      inputMode="numeric"
                      onChange={(valor) =>
                        atualizarCampoDraft(
                          "hmcTl",
                          valor.replace(/\D/g, "").slice(0, 4),
                        )
                      }
                    />
                  </DraftCell>
                  <DraftCell>
                    <CampoLinha
                      value={draft.hmcTm}
                      placeholder="0000"
                      compact
                      maxLength={4}
                      inputMode="numeric"
                      onChange={(valor) =>
                        atualizarCampoDraft(
                          "hmcTm",
                          valor.replace(/\D/g, "").slice(0, 4),
                        )
                      }
                    />
                  </DraftCell>
                  <DraftCell>
                    <CampoLinha
                      value={draft.processo}
                      placeholder="00AA"
                      compact
                      maxLength={4}
                      onChange={(valor) =>
                        atualizarCampoDraft("processo", normalizeProcesso(valor))
                      }
                    />
                  </DraftCell>
                  <DraftCell className="text-slate-600">
                    {formatTime(draft.createdAt)}
                  </DraftCell>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            <MobileDraftCard label="SEQ" value={draft.sequencia} />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Item de segurança
                </p>
                <button
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    draft.seguranca
                      ? "bg-rose-500 text-white hover:bg-rose-400"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  onClick={() =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      seguranca: !currentDraft.seguranca,
                    }))
                  }
                >
                  {draft.seguranca ? "Sim" : "Não"}
                </button>
              </div>
            </div>
            <MobileDraftInput
              label="VIN"
              value={draft.vin}
              placeholder="ABC123456"
              maxLength={9}
              onChange={(valor) => atualizarCampoDraft("vin", normalizeVin(valor))}
            />
            <MobileDraftCard label="ITEM" value={draft.item} />
            <MobileDraftCard label="DEFEITO" value={draft.defeito} />
            <MobileDraftInput
              label="HMC TL"
              value={draft.hmcTl}
              placeholder="0000"
              compact
              maxLength={4}
              inputMode="numeric"
              onChange={(valor) =>
                atualizarCampoDraft("hmcTl", valor.replace(/\D/g, "").slice(0, 4))
              }
            />
            <MobileDraftInput
              label="HMC TM"
              value={draft.hmcTm}
              placeholder="0000"
              compact
              maxLength={4}
              inputMode="numeric"
              onChange={(valor) =>
                atualizarCampoDraft("hmcTm", valor.replace(/\D/g, "").slice(0, 4))
              }
            />
            <MobileDraftInput
              label="PROCESSO"
              value={draft.processo}
              placeholder="06RH"
              compact
              maxLength={4}
              onChange={(valor) =>
                atualizarCampoDraft("processo", normalizeProcesso(valor))
              }
            />
            <MobileDraftCard label="HORA" value={formatTime(draft.createdAt)} />
          </div>

          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              className="rounded-xl border border-slate-300 bg-slate-100 px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-200"
              onClick={() => setShowDetalhesDraft((current) => !current)}
            >
              {showDetalhesDraft || draft.detalhes ? "Fechar detalhes" : "Detalhes"}
            </button>
            <button
              className="rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-400"
              onClick={salvarRegistro}
            >
              Salvar registro
            </button>
            <button
              className="rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-500"
              onClick={() => setEtapa("lista")}
            >
              Ver lista do dia
            </button>
          </div>

          {(showDetalhesDraft || draft.detalhes) && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Detalhes do defeito
                </span>
                <textarea
                  className="mt-2 min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400"
                  value={draft.detalhes}
                  onChange={(event) =>
                    atualizarCampoDraft("detalhes", event.target.value)
                  }
                  placeholder="Descreva melhor o defeito, localização ou observação importante."
                />
              </label>
            </div>
          )}
        </section>
      )}
    </section>
  );
};

type StatusCardProps = {
  label: string;
  value: string;
  active: boolean;
  complete: boolean;
};

const StatusCard = ({
  label,
  value,
  active,
  complete,
}: StatusCardProps) => {
  const toneClass = active
    ? "border-cyan-300 bg-cyan-50"
    : complete
      ? "border-emerald-200 bg-emerald-50"
      : "border-slate-200 bg-white";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <strong className="mt-2 block text-lg text-slate-950">{value}</strong>
    </div>
  );
};

type CampoLinhaProps = {
  placeholder: string;
  value: string;
  className?: string;
  compact?: boolean;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (valor: string) => void;
};

const CampoLinha = ({
  placeholder,
  value,
  className = "",
  compact = false,
  maxLength,
  inputMode,
  onChange,
}: CampoLinhaProps) => (
  <input
    className={`h-12 rounded-xl border border-slate-300 bg-emerald-50 px-3 text-center text-base font-semibold text-slate-900 outline-none placeholder:text-emerald-700 ${
      compact ? "mx-auto w-full max-w-[110px]" : "w-full"
    } ${className}`}
    value={value}
    maxLength={maxLength}
    inputMode={inputMode}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
  />
);

type DraftHeaderProps = {
  children: React.ReactNode;
};

const DraftHeader = ({ children }: DraftHeaderProps) => (
  <th className="border-r border-slate-300 px-3 py-4 text-lg font-bold last:border-r-0">
    {children}
  </th>
);

type DraftCellProps = {
  children: React.ReactNode;
  className?: string;
};

const DraftCell = ({ children, className = "" }: DraftCellProps) => (
  <td className={`border-r border-slate-300 px-3 py-3 align-middle last:border-r-0 ${className}`}>
    {children}
  </td>
);

type MobileDraftCardProps = {
  label: string;
  value: string;
};

const MobileDraftCard = ({ label, value }: MobileDraftCardProps) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
      {label}
    </p>
    <strong className="mt-2 block text-lg text-slate-950">{value || "-"}</strong>
  </div>
);

type MobileDraftInputProps = {
  label: string;
  value: string;
  placeholder: string;
  compact?: boolean;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (valor: string) => void;
};

const MobileDraftInput = ({
  label,
  value,
  placeholder,
  compact = false,
  maxLength,
  inputMode,
  onChange,
}: MobileDraftInputProps) => (
  <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
      {label}
    </span>
    <input
      className={`mt-2 h-12 rounded-xl border border-slate-300 bg-white px-3 text-center text-base font-semibold text-slate-900 outline-none placeholder:text-slate-400 ${
        compact ? "w-full max-w-[110px]" : "w-full"
      }`}
      value={value}
      maxLength={maxLength}
      inputMode={inputMode}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  </label>
);

const getTodayRecords = (records: RegistroDefeito[]) => {
  const todayKey = getLocalDateKey(new Date().toISOString());
  return records.filter(
    (registro) => getLocalDateKey(registro.createdAt) === todayKey,
  );
};

const getLocalDateKey = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatTime = (dateString: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));

const normalizeProcesso = (valor: string) =>
  valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);

const normalizeVin = (valor: string) => {
  const cleaned = valor.toUpperCase().replace(/[^A-Z0-9]/g, "");
  let letters = "";
  let numbers = "";

  for (const char of cleaned) {
    if (/[A-Z]/.test(char) && letters.length < 3 && numbers.length === 0) {
      letters += char;
      continue;
    }

    if (/[0-9]/.test(char) && letters.length === 3 && numbers.length < 6) {
      numbers += char;
    }
  }

  return `${letters}${numbers}`;
};
