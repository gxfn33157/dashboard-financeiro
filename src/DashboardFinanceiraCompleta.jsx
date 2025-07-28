// IMPORTS
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Legend,
  LabelList
} from "recharts";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const COLORS = ["#38bdf8", "#818cf8", "#f472b6", "#facc15", "#4ade80", "#f87171"];
const BANK_COLORS = {
  Flash: "#f472b6",
  Santander: "#ef4444",
  Nubank: "#8b5cf6",
  "99Pay": "#facc15"
};

const BANK_LOGOS = {
  Flash: "💳",
  Santander: "🏦",
  Nubank: "💜",
  "99Pay": "💰"
};

const PLANILHA_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQLaOmmhnI-3lDtmSZOMiLu-j0qsJEBU38w2hS60k_636PNRjjKAfFchUmqJbT2unXBCc2FOZmAmo_g/pub?gid=1943682131&single=true&output=csv";

function parseValor(str) {
  const num = parseFloat(str.replace(/[^0-9,-]+/g, '').replace(".", "").replace(",", "."));
  return isNaN(num) ? 0 : num;
}

function formatMes(data) {
  const match = data.match(/\d{2}\/\d{2}\/\d{4}/);
  if (!match) return null;
  const [dia, mes, ano] = match[0].split("/");
  const nomes = ["", "Jan.", "Fev.", "Mar.", "Abr.", "Mai.", "Jun.", "Jul.", "Ago.", "Set.", "Out.", "Nov.", "Dez."];
  return nomes[parseInt(mes)] || mes;
}

function formatReal(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DashboardFinanceiraCompleta() {
  const [linhas, setLinhas] = useState([]);
  const [erro, setErro] = useState(null);
  const saldoInicial = 645.81;

  useEffect(() => {
    fetch(PLANILHA_CSV_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar CSV");
        return res.text();
      })
      .then((csv) => {
        const linhasBrutas = csv.split("\n").slice(3);
        const dados = [];

        for (let l of linhasBrutas) {
          const partes = l.split(",").map(p => p.trim());
          if (partes.length >= 10 && partes[8].includes("R$") && partes[9]?.match(/\d{1,3}"?/)) {
            partes[8] = partes[8] + "," + partes[9];
            partes.splice(9, 1);
          }
          if (partes.length >= 12 && partes[4] && partes[8]) {
            dados.push(partes);
          }
        }

        setLinhas(dados);
      })
      .catch((err) => setErro(err.message));
  }, []);

  const totais = useMemo(() => {
    let renda = 0, despesa = 0;
    const porSubgrupo = {};
    const porBanco = {};
    const porMes = {};

    linhas.forEach((linha) => {
      const tipo = linha[4]?.trim();
      const subgrupo = linha[5]?.trim();
      const banco = linha[7]?.trim();
      const valor = parseValor(linha[8]);
      const mes = formatMes(linha[2]);

      if (tipo === "Renda") renda += valor;
      else if (tipo === "Despesas" || tipo === "Despesa") despesa += valor;

      if (tipo === "Despesas" || tipo === "Despesa") {
        porSubgrupo[subgrupo] = (porSubgrupo[subgrupo] || 0) + valor;
        porBanco[banco] = (porBanco[banco] || 0) + valor;
      }

      if (mes) {
        porMes[mes] = porMes[mes] || { mes, Renda: 0, Despesas: 0 };
        if (tipo === "Renda") porMes[mes].Renda += valor;
        if (tipo === "Despesas" || tipo === "Despesa") porMes[mes].Despesas += valor;
      }
    });

    const totalGeral = {
      mes: "Total Geral",
      Renda: renda,
      Despesas: despesa
    };

    return {
      renda,
      despesa,
      saldo: saldoInicial + renda - despesa,
      porSubgrupo: Object.entries(porSubgrupo).map(([name, value]) => ({ name, value })),
      porFormaPagamento: Object.entries(porBanco).map(([name, value]) => ({ name, value })),
      porMes: [...Object.values(porMes), totalGeral]
    };
  }, [linhas]);

  return (
    <div className="min-h-screen bg-[#1E1E2F] text-white p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Dashboard Financeira</h1>
      {erro && <div className="text-red-500 text-center mb-4">Erro: {erro}</div>}
      <div className="text-sm text-gray-400 mb-4 text-center">
        {linhas.length > 0
          ? `${linhas.length} registros carregados da planilha.`
          : "Carregando dados da planilha..."}
      </div>

      <Tabs defaultValue="visao" className="w-full">
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="visao">Visão Geral</TabsTrigger>
          <TabsTrigger value="subgrupo">Subgrupos & Pagamentos</TabsTrigger>
          <TabsTrigger value="contas">Contas</TabsTrigger>
          <TabsTrigger value="economia">Economia</TabsTrigger>
          <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
        </TabsList>

        <TabsContent value="visao">
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Visão Geral</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={totais.porMes} margin={{ top: 10, bottom: 40 }}>
                <XAxis dataKey="mes" tick={{ fill: "#fff" }} />
                <YAxis hide />
                <Tooltip formatter={(value) => formatReal(value)} />
                <Legend />
                <Bar dataKey="Renda" fill="#4ade80">
                  <LabelList dataKey="Renda" position="top" formatter={(value) => formatReal(value)} />
                </Bar>
                <Bar dataKey="Despesas" fill="#f87171">
                  <LabelList dataKey="Despesas" position="top" formatter={(value) => formatReal(value)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-2">💡 Assistente Financeiro</h3>
              {totais.saldo >= 0 ? (
                <p className="text-green-400">Parabéns! Seu saldo está positivo. Mantenha os bons hábitos de economia.</p>
              ) : (
                <p className="text-red-400">Atenção: seu saldo está negativo. Reveja seus gastos com alimentação, lazer e compras parceladas.</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="subgrupo">
          <div className="p-4">
            <h3 className="text-xl font-bold mb-4">Subgrupos & Formas de Pagamento</h3>
            <div className="flex flex-col md:flex-row gap-6">
              <Card className="bg-gray-800 p-4 flex-1">
                <h4 className="font-semibold mb-2">💼 Por Subgrupo</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={totais.porSubgrupo} dataKey="value" nameKey="name" outerRadius={100} label={({ name, value }) => `${name}: ${formatReal(value)}`}>
                      {totais.porSubgrupo.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatReal(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
              <Card className="bg-gray-800 p-4 flex-1">
                <h4 className="font-semibold mb-2">💳 Por Forma de Pagamento</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={totais.porFormaPagamento} dataKey="value" nameKey="name" outerRadius={100} label={({ name, value }) => `${name}: ${formatReal(value)}`}>
                      {totais.porFormaPagamento.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatReal(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contas">
          <div className="p-4">
            <h3 className="text-lg font-bold mb-4">Contas</h3>
            {totais.porFormaPagamento.map((item) => (
              <div key={item.name} className="mb-4">
                <span className="font-medium" style={{ color: BANK_COLORS[item.name] || "#ccc" }}>
                  {BANK_LOGOS[item.name] || "🏦"} {item.name}
                </span>: {formatReal(item.value)}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="economia">
          <div className="p-4">
            <h3 className="text-xl font-bold mb-4">💸 Economia</h3>
            <Card className="bg-gray-800 p-4 mb-4">
              <p className="text-green-400 font-semibold">💰 Saldo Atual: {formatReal(totais.saldo)}</p>
              <p className="text-blue-400">📥 Total de Renda: {formatReal(totais.renda)}</p>
              <p className="text-red-400">📤 Total de Despesas: {formatReal(totais.despesa)}</p>
            </Card>
            <Card className="bg-gray-900 p-4">
              <h4 className="text-lg font-bold mb-2">🔎 Dica de Economia</h4>
              <p className="text-gray-300">
                {totais.despesa > totais.renda
                  ? "Você está gastando mais do que ganha. Tente identificar despesas não essenciais e estabeleça um teto de gastos mensais."
                  : "Continue assim! Que tal começar um fundo de emergência com 10% da sua renda mensal?"}
              </p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="objetivos">
          <div className="p-4">
            <h3 className="text-xl font-bold mb-4">🎯 Objetivos</h3>
            <Card className="bg-gray-800 p-4 mb-4">
              <h4 className="font-semibold mb-2">Reserva de Emergência</h4>
              <div className="relative w-full bg-gray-700 rounded h-4">
                <div className="bg-green-500 h-4 rounded" style={{ width: "75%" }}></div>
              </div>
              <p className="text-green-400 mt-1">75% alcançado</p>
            </Card>
            <Card className="bg-gray-800 p-4 mb-4">
              <h4 className="font-semibold mb-2">Viagem</h4>
              <div className="relative w-full bg-gray-700 rounded h-4">
                <div className="bg-green-500 h-4 rounded" style={{ width: "40%" }}></div>
              </div>
              <p className="text-green-400 mt-1">40% alcançado</p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
