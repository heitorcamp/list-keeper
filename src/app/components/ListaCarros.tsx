'use client';

import { Fragment, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  CampoEditavelRegistro,
  RegistroDefeito,
} from "../types/typeListaDefeitos";

type Props = {
  registros: RegistroDefeito[];
  onBack: () => void;
  onClearDay: () => void;
  onUpdateField: (
    id: string,
    campo: CampoEditavelRegistro,
    valor: string,
  ) => void;
};

type ParetoRow = {
  label: string;
  count: number;
  percent: number;
  cumulativePercent: number;
};

export const ListaCarros = ({
  registros,
  onBack,
  onClearDay,
  onUpdateField,
}: Props) => {
  const pareto = buildPareto(registros);
  const [openDetalhesIds, setOpenDetalhesIds] = useState<string[]>([]);

  const toggleDetalhes = (id: string) => {
    setOpenDetalhesIds((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((currentId) => currentId !== id)
        : [...currentIds, id],
    );
  };

  const exportToExcel = () => {
    if (!registros.length) {
      window.alert("Não há registros do dia para exportar.");
      return;
    }

    const worksheetRegistros = XLSX.utils.json_to_sheet(
      registros.map((registro) => ({
        Sequencia: registro.sequencia,
        VIN: registro.vin,
        Item: registro.item,
        Defeito: registro.defeito,
        Detalhes: registro.detalhes,
        "HMC TL": registro.hmcTl,
        "HMC TM": registro.hmcTm,
        Processo: registro.processo,
        Hora: formatDateTime(registro.createdAt),
      })),
    );

    const worksheetPareto = XLSX.utils.json_to_sheet(
      pareto.map((row) => ({
        Defeito: row.label,
        Ocorrencias: row.count,
        Percentual: `${row.percent}%`,
        "Percentual acumulado": `${row.cumulativePercent}%`,
      })),
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheetRegistros, "Registros");
    XLSX.utils.book_append_sheet(workbook, worksheetPareto, "Pareto");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(data, `lista_keeper_${buildFileStamp(new Date())}.xlsx`);
  };

  return (
    <section className="mx-auto w-full max-w-6xl rounded-[24px] bg-white p-4 shadow-[0_18px_50px_rgba(37,99,235,0.18)] sm:rounded-[30px] sm:p-6">
      <div className="mb-5 text-center sm:mb-6">
        <h2 className="text-3xl font-semibold text-blue-600 sm:text-4xl">
          Controle Keeper
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Preencha direto na linha o que estiver faltando.
        </p>
      </div>

      <div className="hidden overflow-x-auto rounded-[22px] border border-slate-300 md:block">
        <table className="min-w-[1180px] w-full border-collapse text-center">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <HeaderCell>SEQ</HeaderCell>
              <HeaderCell>VIN</HeaderCell>
              <HeaderCell>ITEM</HeaderCell>
              <HeaderCell>DEFEITO</HeaderCell>
              <HeaderCell>DETALHES</HeaderCell>
              <HeaderCell>HMC TL</HeaderCell>
              <HeaderCell>HMC TM</HeaderCell>
              <HeaderCell>PROCESSO</HeaderCell>
              <HeaderCell>HORA</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {registros.length ? (
              registros.map((registro) => {
                const detalhesAbertos = openDetalhesIds.includes(registro.id);

                return (
                  <Fragment key={registro.id}>
                    <tr className="border-t border-slate-300">
                      <BodyCell className="font-semibold text-slate-900">
                        {registro.sequencia}
                      </BodyCell>
                      <BodyCell>
                        <InlineInput
                          value={registro.vin}
                          placeholder="add vin"
                          onChange={(valor) => onUpdateField(registro.id, "vin", valor)}
                        />
                      </BodyCell>
                      <BodyCell className="font-medium text-slate-900">
                        {registro.item}
                      </BodyCell>
                      <BodyCell className="font-medium text-slate-900">
                        {registro.defeito}
                      </BodyCell>
                      <BodyCell>
                        <button
                          className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                          onClick={() => toggleDetalhes(registro.id)}
                        >
                          {registro.detalhes ? "Editar" : "Detalhes"}
                        </button>
                      </BodyCell>
                      <BodyCell>
                        <InlineInput
                          value={registro.hmcTl}
                          placeholder="add hmc tl"
                          onChange={(valor) => onUpdateField(registro.id, "hmcTl", valor)}
                        />
                      </BodyCell>
                      <BodyCell>
                        <InlineInput
                          value={registro.hmcTm}
                          placeholder="add hmc tm"
                          onChange={(valor) => onUpdateField(registro.id, "hmcTm", valor)}
                        />
                      </BodyCell>
                      <BodyCell>
                        <InlineInput
                          value={registro.processo}
                          placeholder="processo"
                          onChange={(valor) => onUpdateField(registro.id, "processo", valor)}
                        />
                      </BodyCell>
                      <BodyCell className="text-slate-600">
                        {formatShortTime(registro.createdAt)}
                      </BodyCell>
                    </tr>
                    {detalhesAbertos && (
                      <tr className="border-t border-slate-200 bg-slate-50">
                        <td colSpan={9} className="px-4 py-4">
                          <textarea
                            className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                            value={registro.detalhes}
                            onChange={(event) =>
                              onUpdateField(registro.id, "detalhes", event.target.value)
                            }
                            placeholder="Descreva melhor o defeito."
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-base text-slate-500"
                >
                  Nenhum registro foi salvo hoje.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {registros.length ? (
          registros.map((registro) => (
            <article
              key={registro.id}
              className="rounded-[22px] border border-slate-300 bg-slate-50 p-4"
            >
              <div className="grid gap-3">
                <MobileStaticRow label="SEQ" value={registro.sequencia} />
                <MobileInputRow
                  label="VIN"
                  value={registro.vin}
                  placeholder="add vin"
                  onChange={(valor) => onUpdateField(registro.id, "vin", valor)}
                />
                <MobileStaticRow label="ITEM" value={registro.item} />
                <MobileStaticRow label="DEFEITO" value={registro.defeito} />
                <MobileDetailsRow
                  isOpen={openDetalhesIds.includes(registro.id)}
                  value={registro.detalhes}
                  onToggle={() => toggleDetalhes(registro.id)}
                  onChange={(valor) => onUpdateField(registro.id, "detalhes", valor)}
                />
                <MobileInputRow
                  label="HMC TL"
                  value={registro.hmcTl}
                  placeholder="add hmc tl"
                  onChange={(valor) => onUpdateField(registro.id, "hmcTl", valor)}
                />
                <MobileInputRow
                  label="HMC TM"
                  value={registro.hmcTm}
                  placeholder="add hmc tm"
                  onChange={(valor) => onUpdateField(registro.id, "hmcTm", valor)}
                />
                <MobileInputRow
                  label="PROCESSO"
                  value={registro.processo}
                  placeholder="processo"
                  onChange={(valor) => onUpdateField(registro.id, "processo", valor)}
                />
                <MobileStaticRow
                  label="HORA"
                  value={formatShortTime(registro.createdAt)}
                />
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            Nenhum registro foi salvo hoje.
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          className="rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-500"
          onClick={onBack}
        >
          Voltar
        </button>
        <button
          className="rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-400"
          onClick={exportToExcel}
        >
          Exportar para Excel
        </button>
        <button
          className="rounded-xl bg-rose-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-rose-400"
          onClick={onClearDay}
        >
          Limpar Lista
        </button>
      </div>

      {pareto.length ? (
        <div className="mt-8 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Pareto do dia</h3>
            <span className="text-sm text-slate-500">{registros.length} registros</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {pareto.map((row) => (
              <div
                key={row.label}
                className="rounded-2xl border border-slate-200 bg-white p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-3 text-sm text-slate-900">
                  <strong>{row.label}</strong>
                  <span>{row.count} | {row.percent}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {row.percent}% do total | {row.cumulativePercent}% acumulado
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
};

type HeaderCellProps = {
  children: React.ReactNode;
};

const HeaderCell = ({ children }: HeaderCellProps) => (
  <th className="border-r border-slate-300 px-3 py-4 text-lg font-bold last:border-r-0">
    {children}
  </th>
);

type BodyCellProps = {
  children: React.ReactNode;
  className?: string;
};

const BodyCell = ({ children, className = "" }: BodyCellProps) => (
  <td className={`border-r border-slate-300 px-3 py-3 align-middle last:border-r-0 ${className}`}>
    {children}
  </td>
);

type InlineInputProps = {
  value: string;
  placeholder: string;
  onChange: (valor: string) => void;
};

const InlineInput = ({ value, placeholder, onChange }: InlineInputProps) => (
  <input
    className="h-12 w-full rounded-xl border border-slate-300 bg-emerald-50 px-3 text-center text-base font-semibold text-slate-900 outline-none placeholder:text-emerald-700"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
  />
);

type MobileStaticRowProps = {
  label: string;
  value: string;
};

const MobileStaticRow = ({ label, value }: MobileStaticRowProps) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
      {label}
    </p>
    <strong className="mt-2 block text-lg text-slate-950">{value || "-"}</strong>
  </div>
);

type MobileInputRowProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (valor: string) => void;
};

const MobileInputRow = ({
  label,
  value,
  placeholder,
  onChange,
}: MobileInputRowProps) => (
  <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
      {label}
    </span>
    <input
      className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-emerald-50 px-3 text-center text-base font-semibold text-slate-900 outline-none placeholder:text-emerald-700"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  </label>
);

type MobileDetailsRowProps = {
  isOpen: boolean;
  value: string;
  onToggle: () => void;
  onChange: (valor: string) => void;
};

const MobileDetailsRow = ({
  isOpen,
  value,
  onToggle,
  onChange,
}: MobileDetailsRowProps) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Detalhes
      </span>
      <button
        className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
        onClick={onToggle}
      >
        {isOpen || value ? "Editar" : "Abrir"}
      </button>
    </div>
    {(isOpen || value) && (
      <textarea
        className="mt-3 min-h-24 w-full rounded-xl border border-slate-300 bg-emerald-50 px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-emerald-700"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Descreva melhor o defeito."
      />
    )}
  </div>
);

const buildPareto = (registros: RegistroDefeito[]): ParetoRow[] => {
  const grouped = new Map<string, number>();

  registros.forEach((registro) => {
    const label = `${registro.item} / ${registro.defeito}`;
    grouped.set(label, (grouped.get(label) ?? 0) + 1);
  });

  const total = [...grouped.values()].reduce((sum, count) => sum + count, 0) || 1;
  let running = 0;

  return [...grouped.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([label, count]) => {
      running += count;
      return {
        label,
        count,
        percent: Math.round((count / total) * 100),
        cumulativePercent: Math.round((running / total) * 100),
      };
    });
};

const formatDateTime = (dateString: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(dateString));

const formatShortTime = (dateString: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));

const buildFileStamp = (date: Date) => {
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  const timePart = [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ].join("");

  return `${datePart}-${timePart}`;
};
