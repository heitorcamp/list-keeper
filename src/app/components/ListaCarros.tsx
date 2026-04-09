'use client';

import { Fragment, useState } from "react";
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

  const exportToExcel = async () => {
    if (!registros.length) {
      window.alert("Não há registros do dia para exportar.");
      return;
    }

    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Keeper";
    workbook.created = new Date();

    const worksheetRegistros = workbook.addWorksheet("Registros");
    worksheetRegistros.columns = [
      { header: "Sequencia", key: "sequencia", width: 14 },
      { header: "Seguranca", key: "seguranca", width: 14 },
      { header: "VIN", key: "vin", width: 18 },
      { header: "Item", key: "item", width: 18 },
      { header: "Defeito", key: "defeito", width: 22 },
      { header: "Detalhes", key: "detalhes", width: 32 },
      { header: "HMC TL", key: "hmcTl", width: 14 },
      { header: "HMC TM", key: "hmcTm", width: 14 },
      { header: "Processo", key: "processo", width: 20 },
      { header: "Hora", key: "hora", width: 18 },
    ];

    registros.forEach((registro) => {
      worksheetRegistros.addRow({
        sequencia: registro.sequencia,
        seguranca: registro.seguranca ? "Sim" : "Nao",
        vin: registro.vin,
        item: registro.item,
        defeito: registro.defeito,
        detalhes: registro.detalhes,
        hmcTl: registro.hmcTl,
        hmcTm: registro.hmcTm,
        processo: registro.processo,
        hora: formatDateTime(registro.createdAt),
      });
    });

    styleHeaderRow(worksheetRegistros);

    const worksheetPareto = workbook.addWorksheet("Pareto");
    worksheetPareto.columns = [
      { header: "Item / Defeito", key: "label", width: 28 },
      { header: "Ocorrencias", key: "count", width: 14 },
      { header: "% do total", key: "percent", width: 14 },
      { header: "% acumulado", key: "cumulativePercent", width: 16 },
    ];

    pareto.forEach((row) => {
      worksheetPareto.addRow({
        label: row.label,
        count: row.count,
        percent: row.percent / 100,
        cumulativePercent: row.cumulativePercent / 100,
      });
    });

    styleHeaderRow(worksheetPareto);
    worksheetPareto.getColumn("percent").numFmt = "0%";
    worksheetPareto.getColumn("cumulativePercent").numFmt = "0%";

    if (pareto.length) {
      const chartDataUrl = createParetoChartDataUrl(pareto);
      const imageId = workbook.addImage({
        base64: chartDataUrl,
        extension: "png",
      });

      worksheetPareto.addImage(imageId, {
        tl: { col: 5, row: 1 },
        ext: { width: 760, height: 420 },
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const file = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(file, `lista_keeper_${buildFileStamp(new Date())}.xlsx`);
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

      <div className="hidden overflow-x-auto rounded-[22px] border border-slate-300 sm:block">
        <table className="min-w-[860px] w-full border-collapse text-center">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <HeaderCell>SEQ</HeaderCell>
              <HeaderCell>SEG.</HeaderCell>
              <HeaderCell>VIN</HeaderCell>
              <HeaderCell>ITEM</HeaderCell>
              <HeaderCell>DEFEITO</HeaderCell>
              <HeaderCell>DET.</HeaderCell>
              <HeaderCell>TL</HeaderCell>
              <HeaderCell>TM</HeaderCell>
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
                    <tr
                      className={`border-t ${
                        registro.seguranca
                          ? "border-rose-300 bg-rose-50"
                          : "border-slate-300"
                      }`}
                    >
                      <BodyCell className="text-sm font-semibold text-slate-900">
                        {registro.sequencia}
                      </BodyCell>
                      <BodyCell>
                        {registro.seguranca ? (
                          <span className="inline-flex rounded-full bg-rose-500 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                            Sim
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </BodyCell>
                      <BodyCell>
                        <InlineInput
                          value={registro.vin}
                          placeholder="ABC123456"
                          className="max-w-[110px]"
                          maxLength={9}
                          onChange={(valor) =>
                            onUpdateField(registro.id, "vin", normalizeVin(valor))
                          }
                        />
                      </BodyCell>
                      <BodyCell className="max-w-[84px] whitespace-normal text-sm font-medium leading-tight text-slate-900">
                        {registro.item}
                      </BodyCell>
                      <BodyCell className="max-w-[100px] whitespace-normal text-sm font-medium leading-tight text-slate-900">
                        {registro.defeito}
                      </BodyCell>
                      <BodyCell>
                        <button
                          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                            registro.seguranca
                              ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                          onClick={() => toggleDetalhes(registro.id)}
                        >
                          {registro.detalhes ? "Editar" : "Detalhes"}
                        </button>
                      </BodyCell>
                      <BodyCell>
                        <InlineInput
                          value={registro.hmcTl}
                          placeholder="0000"
                          compact
                          maxLength={4}
                          inputMode="numeric"
                          onChange={(valor) =>
                            onUpdateField(
                              registro.id,
                              "hmcTl",
                              valor.replace(/\D/g, "").slice(0, 4),
                            )
                          }
                        />
                      </BodyCell>
                      <BodyCell>
                        <InlineInput
                          value={registro.hmcTm}
                          placeholder="0000"
                          compact
                          maxLength={4}
                          inputMode="numeric"
                          onChange={(valor) =>
                            onUpdateField(
                              registro.id,
                              "hmcTm",
                              valor.replace(/\D/g, "").slice(0, 4),
                            )
                          }
                        />
                      </BodyCell>
                      <BodyCell>
                        <InlineInput
                          value={registro.processo}
                          placeholder="00AA"
                          className="max-w-[84px]"
                          maxLength={4}
                          onChange={(valor) =>
                            onUpdateField(
                              registro.id,
                              "processo",
                              normalizeProcesso(valor),
                            )
                          }
                        />
                      </BodyCell>
                      <BodyCell className="text-xs text-slate-600">
                        {formatShortTime(registro.createdAt)}
                      </BodyCell>
                    </tr>
                    {detalhesAbertos && (
                      <tr
                        className={`border-t ${
                          registro.seguranca
                            ? "border-rose-200 bg-rose-100/60"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <td colSpan={10} className="px-3 py-3">
                          <textarea
                            className="min-h-20 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
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
                  colSpan={10}
                  className="px-4 py-10 text-center text-base text-slate-500"
                >
                  Nenhum registro foi salvo hoje.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:hidden">
        {registros.length ? (
          registros.map((registro) => {
            const detalhesAbertos = openDetalhesIds.includes(registro.id);

            return (
              <article
                key={registro.id}
                className={`rounded-[22px] border p-4 ${
                  registro.seguranca
                    ? "border-rose-300 bg-rose-50"
                    : "border-slate-300 bg-slate-50"
                }`}
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-900">
                      SEQ {registro.sequencia}
                    </span>
                    <span className="rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-600">
                      {formatShortTime(registro.createdAt)}
                    </span>
                  </div>
                  <button
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      registro.seguranca
                        ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                    onClick={() => toggleDetalhes(registro.id)}
                  >
                    {detalhesAbertos || registro.detalhes ? "Editar detalhes" : "Detalhes"}
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <MobileStaticRow label="ITEM" value={registro.item} />
                  <MobileStaticRow label="DEFEITO" value={registro.defeito} />
                  <MobileInputRow
                    label="VIN"
                    value={registro.vin}
                    placeholder="AAA 123456"
                    maxLength={9}
                    onChange={(valor) =>
                      onUpdateField(registro.id, "vin", normalizeVin(valor))
                    }
                  />
                  <MobileInputRow
                    label="PROCESSO"
                    value={registro.processo}
                    placeholder="06RH"
                    compact
                    maxLength={4}
                    onChange={(valor) =>
                      onUpdateField(registro.id, "processo", normalizeProcesso(valor))
                    }
                  />
                  <MobileInputRow
                    label="HMC TL"
                    value={registro.hmcTl}
                    placeholder="0000"
                    compact
                    maxLength={4}
                    inputMode="numeric"
                    onChange={(valor) =>
                      onUpdateField(
                        registro.id,
                        "hmcTl",
                        valor.replace(/\D/g, "").slice(0, 4),
                      )
                    }
                  />
                  <MobileInputRow
                    label="HMC TM"
                    value={registro.hmcTm}
                    placeholder="0000"
                    compact
                    maxLength={4}
                    inputMode="numeric"
                    onChange={(valor) =>
                      onUpdateField(
                        registro.id,
                        "hmcTm",
                        valor.replace(/\D/g, "").slice(0, 4),
                      )
                    }
                  />
                </div>

                {(detalhesAbertos || registro.detalhes) && (
                  <div className="mt-3">
                    <textarea
                      className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      value={registro.detalhes}
                      onChange={(event) =>
                        onUpdateField(registro.id, "detalhes", event.target.value)
                      }
                      placeholder="Descreva melhor o defeito."
                    />
                  </div>
                )}
              </article>
            );
          })
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
        <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Pareto do dia</h3>
              <p className="text-sm text-slate-500">
                Barras por ocorrência e linha de acumulado.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-600">
              {registros.length} registros
            </span>
          </div>
          <ParetoChart pareto={pareto} />
          <div className="mt-4 grid gap-2">
            {pareto.map((row) => (
              <div
                key={row.label}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-700"
              >
                <strong>{row.label}</strong>
                <span>
                  {row.count} ocorrências | {row.percent}% do total |{" "}
                  {row.cumulativePercent}% acumulado
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
};

type ParetoChartProps = {
  pareto: ParetoRow[];
};

const ParetoChart = ({ pareto }: ParetoChartProps) => {
  const width = 980;
  const height = 430;
  const margin = { top: 34, right: 60, bottom: 122, left: 62 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const barAreaWidth = chartWidth / pareto.length;
  const maxCount = Math.max(...pareto.map((row) => row.count), 1);
  const tickCount = Math.min(Math.max(maxCount, 2), 5);

  const yTicks = Array.from({ length: tickCount + 1 }, (_, index) => {
    const value = Math.round((maxCount / tickCount) * index);
    const y = margin.top + chartHeight - (value / maxCount) * chartHeight;
    return { value, y };
  });

  const linePoints = pareto
    .map((row, index) => {
      const x = margin.left + index * barAreaWidth + barAreaWidth / 2;
      const y =
        margin.top + chartHeight - (row.cumulativePercent / 100) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="overflow-x-auto rounded-[22px] border border-slate-200 bg-white p-3">
      <svg
        className="min-w-[820px] w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Gráfico de Pareto"
      >
        <defs>
          <linearGradient id="pareto-bar" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>

        <rect width={width} height={height} rx="18" fill="#ffffff" />

        {yTicks.map((tick, index) => (
          <g key={`tick-${index}-${tick.value}`}>
            <line
              x1={margin.left}
              y1={tick.y}
              x2={width - margin.right}
              y2={tick.y}
              stroke="#e2e8f0"
              strokeDasharray="5 6"
            />
            <text
              x={margin.left - 12}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="12"
              fill="#64748b"
            >
              {tick.value}
            </text>
          </g>
        ))}

        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={margin.top + chartHeight}
          stroke="#94a3b8"
        />
        <line
          x1={margin.left}
          y1={margin.top + chartHeight}
          x2={width - margin.right}
          y2={margin.top + chartHeight}
          stroke="#94a3b8"
        />

        <text x={margin.left} y={18} fontSize="14" fontWeight="700" fill="#0f172a">
          Ocorrências por item e defeito
        </text>

        {pareto.map((row, index) => {
          const x = margin.left + index * barAreaWidth + 14;
          const barWidth = Math.max(barAreaWidth - 28, 34);
          const barHeight = (row.count / maxCount) * chartHeight;
          const y = margin.top + chartHeight - barHeight;
          const labelLines = splitChartLabel(row.label);
          const labelCenterX = x + barWidth / 2;

          return (
            <g key={row.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="12"
                fill="url(#pareto-bar)"
              />
              <text
                x={labelCenterX}
                y={y - 8}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill="#0f172a"
              >
                {row.count}
              </text>
              {labelLines.map((line, lineIndex) => (
                <text
                  key={`${row.label}-${lineIndex}`}
                  x={labelCenterX}
                  y={margin.top + chartHeight + 22 + lineIndex * 15}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#475569"
                >
                  {line}
                </text>
              ))}
              <text
                x={labelCenterX}
                y={margin.top + chartHeight + 58}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#1d4ed8"
              >
                {row.percent}%
              </text>
            </g>
          );
        })}

        <polyline
          points={linePoints}
          fill="none"
          stroke="#f97316"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {pareto.map((row, index) => {
          const x = margin.left + index * barAreaWidth + barAreaWidth / 2;
          const y =
            margin.top + chartHeight - (row.cumulativePercent / 100) * chartHeight;

          return (
            <g key={`${row.label}-line`}>
              <circle cx={x} cy={y} r="5" fill="#f97316" />
              <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#ea580c"
              >
                {row.cumulativePercent}%
              </text>
            </g>
          );
        })}

        <g transform={`translate(${width - margin.right - 180} ${22})`}>
          <rect x="0" y="0" width="180" height="36" rx="12" fill="#f8fafc" />
          <rect x="12" y="10" width="18" height="10" rx="5" fill="url(#pareto-bar)" />
          <text x="38" y="19" fontSize="12" fill="#334155">
            Ocorrências
          </text>
          <line x1="110" y1="15" x2="130" y2="15" stroke="#f97316" strokeWidth="3" />
          <circle cx="120" cy="15" r="4" fill="#f97316" />
          <text x="138" y="19" fontSize="12" fill="#334155">
            Acumulado
          </text>
        </g>
      </svg>
    </div>
  );
};

type HeaderCellProps = {
  children: React.ReactNode;
};

const HeaderCell = ({ children }: HeaderCellProps) => (
  <th className="border-r border-slate-300 px-2 py-3 text-sm font-bold last:border-r-0 xl:px-3">
    {children}
  </th>
);

type BodyCellProps = {
  children: React.ReactNode;
  className?: string;
};

const BodyCell = ({ children, className = "" }: BodyCellProps) => (
  <td
    className={`border-r border-slate-300 px-2 py-2 align-middle last:border-r-0 xl:px-3 ${className}`}
  >
    {children}
  </td>
);

type InlineInputProps = {
  value: string;
  placeholder: string;
  className?: string;
  compact?: boolean;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (valor: string) => void;
};

const InlineInput = ({
  value,
  placeholder,
  className = "",
  compact = false,
  maxLength,
  inputMode,
  onChange,
}: InlineInputProps) => (
  <input
    className={`h-10 rounded-lg border border-slate-300 bg-emerald-50 px-2 text-center text-sm font-semibold text-slate-900 outline-none placeholder:text-emerald-700 ${
      compact ? "mx-auto w-full max-w-[76px]" : "w-full"
    } ${className}`}
    value={value}
    maxLength={maxLength}
    inputMode={inputMode}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
  />
);

type MobileStaticRowProps = {
  label: string;
  value: string;
  highlight?: boolean;
};

const MobileStaticRow = ({
  label,
  value,
  highlight = false,
}: MobileStaticRowProps) => (
  <div
    className={`rounded-2xl border px-4 py-3 ${
      highlight ? "border-rose-200 bg-rose-100/70" : "border-slate-200 bg-white"
    }`}
  >
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
  compact?: boolean;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (valor: string) => void;
};

const MobileInputRow = ({
  label,
  value,
  placeholder,
  compact = false,
  maxLength,
  inputMode,
  onChange,
}: MobileInputRowProps) => (
  <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
      {label}
    </span>
    <input
      className={`mt-2 h-12 rounded-xl border border-slate-300 bg-emerald-50 px-3 text-center text-base font-semibold text-slate-900 outline-none placeholder:text-emerald-700 ${
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

const styleHeaderRow = (worksheet: {
  getRow: (index: number) => {
    eachCell: (
      callback: (cell: {
        fill?: unknown;
        font?: unknown;
        border?: unknown;
        alignment?: unknown;
      }) => void,
    ) => void;
  };
}) => {
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "E2E8F0" },
    };
    cell.font = {
      bold: true,
      color: { argb: "1E293B" },
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: "CBD5E1" } },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
};

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

const createParetoChartDataUrl = (pareto: ParetoRow[]) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const context = canvas.getContext("2d");

  if (!context) {
    return "";
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const margin = { top: 80, right: 90, bottom: 190, left: 88 };
  const chartWidth = canvas.width - margin.left - margin.right;
  const chartHeight = canvas.height - margin.top - margin.bottom;
  const barAreaWidth = chartWidth / pareto.length;
  const maxCount = Math.max(...pareto.map((row) => row.count), 1);
  const tickCount = Math.min(Math.max(maxCount, 2), 5);

  context.fillStyle = "#0f172a";
  context.font = "bold 34px Segoe UI";
  context.fillText("Pareto do dia", margin.left, 42);
  context.font = "20px Segoe UI";
  context.fillStyle = "#64748b";
  context.fillText("Barras por ocorrência e linha de acumulado", margin.left, 70);

  for (let index = 0; index <= tickCount; index += 1) {
    const value = Math.round((maxCount / tickCount) * index);
    const y = margin.top + chartHeight - (value / maxCount) * chartHeight;

    context.strokeStyle = "#e2e8f0";
    context.lineWidth = 1;
    context.setLineDash([8, 8]);
    context.beginPath();
    context.moveTo(margin.left, y);
    context.lineTo(canvas.width - margin.right, y);
    context.stroke();

    context.setLineDash([]);
    context.font = "16px Segoe UI";
    context.fillStyle = "#64748b";
    context.textAlign = "right";
    context.fillText(String(value), margin.left - 14, y + 5);
  }

  context.strokeStyle = "#94a3b8";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(margin.left, margin.top);
  context.lineTo(margin.left, margin.top + chartHeight);
  context.lineTo(canvas.width - margin.right, margin.top + chartHeight);
  context.stroke();

  pareto.forEach((row, index) => {
    const x = margin.left + index * barAreaWidth + 20;
    const barWidth = Math.max(barAreaWidth - 40, 42);
    const barHeight = (row.count / maxCount) * chartHeight;
    const y = margin.top + chartHeight - barHeight;

    context.fillStyle = "#2563eb";
    roundRect(context, x, y, barWidth, barHeight, 14);
    context.fill();

    context.textAlign = "center";
    context.fillStyle = "#0f172a";
    context.font = "bold 18px Segoe UI";
    context.fillText(String(row.count), x + barWidth / 2, y - 10);

    context.fillStyle = "#475569";
    context.font = "15px Segoe UI";
    wrapCenteredText(
      context,
      row.label,
      x + barWidth / 2,
      margin.top + chartHeight + 28,
      barWidth + 24,
      18,
    );

    context.fillStyle = "#1d4ed8";
    context.font = "bold 15px Segoe UI";
    context.fillText(
      `${row.percent}%`,
      x + barWidth / 2,
      margin.top + chartHeight + 72,
    );
  });

  context.strokeStyle = "#f97316";
  context.lineWidth = 4;
  context.beginPath();
  pareto.forEach((row, index) => {
    const x = margin.left + index * barAreaWidth + barAreaWidth / 2;
    const y =
      margin.top + chartHeight - (row.cumulativePercent / 100) * chartHeight;

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.stroke();

  pareto.forEach((row, index) => {
    const x = margin.left + index * barAreaWidth + barAreaWidth / 2;
    const y =
      margin.top + chartHeight - (row.cumulativePercent / 100) * chartHeight;

    context.fillStyle = "#f97316";
    context.beginPath();
    context.arc(x, y, 6, 0, Math.PI * 2);
    context.fill();

    context.font = "bold 15px Segoe UI";
    context.fillText(`${row.cumulativePercent}%`, x, y - 14);
  });

  context.fillStyle = "#f8fafc";
  roundRect(context, canvas.width - 282, 22, 210, 48, 14);
  context.fill();

  context.fillStyle = "#2563eb";
  roundRect(context, canvas.width - 262, 38, 24, 12, 6);
  context.fill();
  context.fillStyle = "#334155";
  context.font = "15px Segoe UI";
  context.textAlign = "left";
  context.fillText("Ocorrências", canvas.width - 228, 49);
  context.strokeStyle = "#f97316";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(canvas.width - 128, 44);
  context.lineTo(canvas.width - 102, 44);
  context.stroke();
  context.fillStyle = "#f97316";
  context.beginPath();
  context.arc(canvas.width - 115, 44, 4, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#334155";
  context.fillText("Acumulado", canvas.width - 92, 49);

  return canvas.toDataURL("image/png");
};

const roundRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
};

const wrapCenteredText = (
  context: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
) => {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  lines.slice(0, 2).forEach((line, index) => {
    context.fillText(line, centerX, startY + index * lineHeight);
  });
};

const splitChartLabel = (label: string) => {
  const [item, defeito] = label.split(" / ");
  return defeito ? [item, defeito] : [label];
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
