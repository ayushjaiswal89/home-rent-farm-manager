"use client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FarmRecord, HomeExpense, Lang, RentRecord } from "../../lib/types";
import { STRINGS } from "../../lib/i18n";
import { fmt, fmtNum } from "../../lib/utils";
import { FormCard, KpiBox, SectionHeader } from "../common/UI";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


interface ReportsSectionProps {
  home: HomeExpense[];
  rent: RentRecord[];
  farm: FarmRecord[];
  lang: Lang;
}

export function ReportsSection({ home, rent, farm, lang }: ReportsSectionProps) {
  const t = STRINGS[lang];

  const [range, setRange] = useState("year");
  const [cropFilter, setCropFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const year = today.slice(0, 4);

  const homeFiltered = home.filter(h => {

    if(range==="today" && h.date!==today)
        return false;

    if(range==="month" && !h.date.startsWith(month))
        return false;

    if(range==="year" && !h.date.startsWith(year))
        return false;

    if(categoryFilter!=="all" &&
        h.category!==categoryFilter)
        return false;

    return true;
});

 const rentFiltered = rent.filter(r => {

    if(range==="today" && r.date!==today)
        return false;

    if(range==="month" && !r.date.startsWith(month))
        return false;

    if(range==="year" && !r.date.startsWith(year))
        return false;

    if(tenantFilter!=="all" &&
        r.tenant!==tenantFilter)
        return false;

    return true;
});

  const farmFiltered = farm.filter(f => {

    if(range==="today" && f.date!==today)
        return false;

    if(range==="month" && !f.date.startsWith(month))
        return false;

    if(range==="year" && !f.date.startsWith(year))
        return false;

    if(cropFilter!=="all" &&
        f.crop!==cropFilter)
        return false;

    return true;
});

  

  const homeTotal = useMemo(
    () => homeFiltered.reduce((sum, item) => sum + item.amount, 0),
    [homeFiltered]
  );
  const rentTotal = useMemo(() => rentFiltered.filter(item => item.status === "Received").reduce((sum, item) => sum + item.total, 0), [rentFiltered]);
  const farmExpense = useMemo(() => farmFiltered.filter(item => item.type === "Expense").reduce((sum, item) => sum + item.amount, 0), [farmFiltered]);
  const farmSale = useMemo(() => farmFiltered.filter(item => item.type === "Sale").reduce((sum, item) => sum + item.amount, 0), [farmFiltered]);
  const farmProfit = useMemo(() => farmSale - farmExpense, [farmSale, farmExpense]);
  const netBalance = useMemo(() => rentTotal + farmProfit - homeTotal, [rentTotal, farmProfit, homeTotal]);
  const totalIncome = useMemo(() => rentTotal + farmSale, [rentTotal, farmSale]);
  const farmPct = useMemo(() => (totalIncome > 0 ? Math.round((farmSale / totalIncome) * 100) : 0), [farmSale, totalIncome]);
  const rentPct = useMemo(() => (totalIncome > 0 ? Math.round((rentTotal / totalIncome) * 100) : 0), [rentTotal, totalIncome]);
  const cropSet = useMemo(
    () => [...new Set(farmFiltered.map(item => item.crop))],
    [farmFiltered]
  );
  const cropList = useMemo(
  () => [...new Set(farm.map(f => f.crop))],
  [farm]
);

const tenantList = useMemo(
  () => [...new Set(rent.map(r => r.tenant))],
  [rent]
);

const categoryList = useMemo(
  () => [...new Set(home.map(h => h.category))],
  [home]
);
  const insights = useMemo(() => [
    rentTotal > homeTotal ? `✅ ${lang === "hi" ? "किराया" : "Rent"} ${fmt(rentTotal)} ${lang === "hi" ? "घर के खर्च से अधिक है।" : "is higher than home expense."}` : `⚠️ ${lang === "hi" ? "घर का खर्च किराये से अधिक है।" : "Home expense exceeds rent."}`,
    farmProfit >= 0 ? `🌾 ${lang === "hi" ? "खेती में" : "Farm has"} ${fmt(farmProfit)} ${lang === "hi" ? "का लाभ है।" : "profit."}` : `📉 ${lang === "hi" ? "खेती में" : "Farm has"} ${fmt(Math.abs(farmProfit))} ${lang === "hi" ? "का नुकसान है।" : "loss."}`,
    `📅 ${lang === "hi" ? "ट्रैक किए गए फसल" : "Tracked crops"}: ${cropSet.length}`,
    `💼 ${lang === "hi" ? "कुल लेनदेन" : "Total transactions"}: ${fmtNum(homeFiltered.length + rentFiltered.length + farmFiltered.length)}`,
  ], [cropSet.length, farmProfit, homeFiltered.length, lang, rentFiltered.length, rentTotal]);

  const recentActivities = useMemo(() => {
      const activities = [
        ...homeFiltered.map(item => ({
          date: item.date,
          title: "Home Expense",
          subtitle: item.category,
          amount: -item.amount,
          color: "text-red-400",
          icon: "🏠",
        })),

        ...rentFiltered.map(item => ({
          date: item.date,
          title: "Rent",
          subtitle: item.tenant,
          amount:
            item.status === "Received"
              ? item.total
              : 0,
          color:
            item.status === "Received"
              ? "text-green-400"
              : "text-yellow-400",
          icon: "🏡",
        })),

        ...farmFiltered.map(item => ({
          date: item.date,
          title: item.type,
          subtitle: item.crop,
          amount:
            item.type === "Sale"
              ? item.amount
              : -item.amount,
          color:
            item.type === "Sale"
              ? "text-green-400"
              : "text-red-400",
          icon: "🌾",
        })),
      ];

      return activities
        .sort(
          (a, b) =>
            new Date(b.date).getTime() -
            new Date(a.date).getTime()
        )
        .slice(0, 8);

    }, [homeFiltered, rentFiltered, farmFiltered]);

    const chartData = useMemo(() => {

  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  return months.map((monthName, index) => {

    const monthNo = String(index + 1).padStart(2, "0");

    const rentIncome = rentFiltered
      .filter(
        r =>
          r.status === "Received" &&
          r.date.split("-")[1] === monthNo
      )
      .reduce((sum, r) => sum + r.total, 0);

    const farmIncome = farmFiltered
      .filter(
        f =>
          f.type === "Sale" &&
          f.date.split("-")[1] === monthNo
      )
      .reduce((sum, f) => sum + f.amount, 0);

    const homeExpense = homeFiltered
      .filter(
        h =>
          h.date.split("-")[1] === monthNo
      )
      .reduce((sum, h) => sum + h.amount, 0);

    return {
      month: monthName,
      rent: rentIncome,
      farm: farmIncome,
      home: homeExpense,
    };

  });

}, [homeFiltered, rentFiltered, farmFiltered]);


    
  const downloadPDF = () => {
    const doc = new jsPDF();
    <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-black font-black text-sm">SK</div>
             
      </div>  

    doc.setTextColor(0);

    doc.setFontSize(11);

    doc.text(
      `Owner : Ayush Jaiswal`,
      14,
      38
    );

    doc.text(
      `Generated : ${new Date().toLocaleString()}`,
      14,
      45
    );

    doc.text(
      `Report : ${range.toUpperCase()}`,
      14,
      52
    );
    const money = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

    doc.setFontSize(22);
    doc.text("SMART KHAATA", 14, 15);

    doc.setFontSize(13);
    doc.text("Financial Report", 14, 24);


    doc.setFontSize(11);
    doc.text(`Generated : ${new Date().toLocaleString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [["Item", "Amount"]],
      body: [
        ["Home Expense", money(homeTotal)],
        ["Rent Income", money(rentTotal)],
        ["Farm Sale", money(farmSale)],
        ["Farm Expense", money(farmExpense)],
        ["Farm Profit", money(farmProfit)],
        ["Net Balance", money(netBalance)],
      ],
      headStyles: {
        fillColor: [34, 197, 94],
      },
      styles: {
        fontSize: 11,
        cellPadding: 4,
      },
    });


    doc.save("Smart-Khaata-Report.pdf");
  };

  const downloadExcel = () => {
    const money = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

    const data = [
      {
        Item: "Home Expense",
        Amount: money(homeTotal),
      },
      {
        Item: "Rent Income",
        Amount: money(rentTotal),
      },
      {
        Item: "Farm Sale",
        Amount: money(farmSale),
      },
      {
        Item: "Farm Expense",
        Amount: money(farmExpense),
      },
      {
        Item: "Farm Profit",
        Amount: money(farmProfit),
      },
      {
        Item: "Net Balance",
        Amount: money(netBalance),
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Report"
    );

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(file, "Smart-Khaata-Report.xlsx");
  };


  const printReport = () => {
    const reportWindow = window.open("", "_blank");

    if (!reportWindow) return;

    reportWindow.document.write(`
    <html>
      <head>
        <title>Smart Khaata Report</title>
        <style>
          body{
            font-family: Arial, sans-serif;
            padding:30px;
          }

          h1{
            text-align:center;
            color:#16a34a;
          }

          table{
            width:100%;
            border-collapse:collapse;
            margin-top:20px;
          }

          th,td{
            border:1px solid #ccc;
            padding:10px;
            text-align:left;
          }

          th{
            background:#16a34a;
            color:white;
          }

          .amount{
            text-align:right;
          }
        </style>
      </head>

      <body>

        <h1>Smart Khaata Report</h1>

        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Range:</strong> ${range}</p>

        <table>
          <tr>
            <th>Item</th>
            <th>Amount</th>
          </tr>

          <tr>
            <td>Home Expense</td>
            <td class="amount">${fmt(homeTotal)}</td>
          </tr>

          <tr>
            <td>Rent Income</td>
            <td class="amount">${fmt(rentTotal)}</td>
          </tr>

          <tr>
            <td>Farm Sale</td>
            <td class="amount">${fmt(farmSale)}</td>
          </tr>

          <tr>
            <td>Farm Expense</td>
            <td class="amount">${fmt(farmExpense)}</td>
          </tr>

          <tr>
            <td>Farm Profit</td>
            <td class="amount">${fmt(farmProfit)}</td>
          </tr>

          <tr>
            <td><strong>Net Balance</strong></td>
            <td class="amount"><strong>${fmt(netBalance)}</strong></td>
          </tr>

        </table>

      </body>
    </html>
  `);

    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };
  return (
  <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
      <SectionHeader title={t.reportsTitle} sub={t.reportsSub} />



     <div className="flex flex-wrap justify-center md:justify-end gap-2 mb-5">

        <button
          onClick={downloadPDF}
          className=" flex-1 sm:flex-none px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white"
        >
          PDF
        </button>

        <button
          onClick={downloadExcel}
          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
        >
          Excel
        </button>

        <button
          onClick={printReport}
          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
        >
          Print
        </button>

      </div>





      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        

        <button
          onClick={() => setRange("today")}
          className={`w-full flex-1 sm:flex-none px-4 py-2 rounded-lg ${range === "today"
              ? "bg-green-500 text-white"
              : "bg-[var(--sk-card)]"
            }`}
        >
          Today
        </button>

        <button
          onClick={() => setRange("month")}
          className={`w-full px-4 py-2 rounded-lg ${range === "month"
              ? "bg-green-500 text-white"
              : "bg-[var(--sk-card)]"
            }`}
        >
          This Month
        </button>

        <button
          onClick={() => setRange("year")}
          className={`w-full flex-1 sm:flex-none px-4 py-2 rounded-lg ${range === "year"
              ? "bg-green-500 text-white"
              : "bg-[var(--sk-card)]"
            }`}
        >
          This Year
        </button>

        <select
    className="w-full px-3 py-2 rounded-lg bg-[var(--sk-card)]"
    value={cropFilter}
    onChange={(e)=>setCropFilter(e.target.value)}
>
    <option value="all">All Crops</option>

    {cropList.map(crop=>(
        <option key={crop} value={crop}>
            {crop}
        </option>
    ))}

</select>


<select
    className="w-full px-3 py-2 rounded-lg bg-[var(--sk-card)]"
    value={tenantFilter}
    onChange={(e)=>setTenantFilter(e.target.value)}
>
    <option value="all">All Tenant</option>

    {tenantList.map(tenant=>(
        <option key={tenant} value={tenant}>
            {tenant}
        </option>
    ))}

</select>


<select
    className="w-full px-3 py-2 rounded-lg bg-[var(--sk-card)]"
    value={categoryFilter}
    onChange={(e)=>setCategoryFilter(e.target.value)}
>
    <option value="all">All Category</option>

    {categoryList.map(category=>(
        <option key={category} value={category}>
            {category}
        </option>
    ))}

</select>

      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FormCard>
          <div className="text-[var(--sk-faint)] text-xs mb-1">{t.homeSpend}</div>
          <div className="text-[10px] sm:text-xs font-mono text-red-400">{fmt(homeTotal)}</div>
        </FormCard>
        <FormCard>
          <div className="text-[var(--sk-faint)] text-xs mb-1">{t.rentIncome}</div>
          <div className="text-[10px] sm:text-xs font-mono text-blue-400">{fmt(rentTotal)}</div>
        </FormCard>
        <FormCard>
          <div className="text-[var(--sk-faint)] text-xs mb-1">{t.farmProfitLabel}</div>
          <div className={`text-[10px] sm:text-xs font-mono ${farmProfit >= 0 ? "text-teal-400" : "text-red-400"}`}>{fmt(farmProfit)}</div>
        </FormCard>
        <FormCard>
          <div className="text-[var(--sk-faint)] text-xs mb-1">{t.netBalance}</div>
          <div className={`text-[10px] sm:text-xs font-mono ${netBalance >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(netBalance)}</div>
        </FormCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <FormCard>
          <div className="text-xs text-[var(--sk-faint)] mb-2">{t.monthlyChart}</div>
          <div className="h-56 sm:h-64 lg:h-72 w-full">
    <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--sk-grid)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={value => `₹${value / 1000}K`} width={36} />
              <Tooltip formatter={(value: number) => [fmt(value), ""]} contentStyle={{ background: "var(--sk-card2)", border: "1px solid var(--sk-border2)", borderRadius: 10, fontSize: 11 }} />
              <Bar dataKey="rent" fill="#60a5fa" radius={[3, 3, 0, 0]} />
              <Bar dataKey="farm" fill="#4ade80" radius={[3, 3, 0, 0]} />
              <Bar dataKey="home" fill="#f87171" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </FormCard>

        <FormCard>
          <div className="text-xs text-[var(--sk-faint)] mb-2">{t.netBreakdown}</div>
          <div className="space-y-3 overflow-x-auto">
            {[
              { label: t.rentIncome, value: rentTotal, color: "text-blue-400" },
              { label: t.farmProfitLabel, value: farmProfit, color: farmProfit >= 0 ? "text-teal-400" : "text-red-400" },
              { label: t.homeSpend, value: -homeTotal, color: "text-red-400" },
            ].map(item => (
              <div key={item.label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm border-b border-white/5 pb-2">
                <span className="text-[var(--sk-muted)]">{item.label}</span>
                <span className={`font-bold font-mono ${item.color}`}>{fmt(item.value)}</span>
              </div>
            ))}
          </div>
          <div className="h-52 sm:h-60 lg:h-72 w-full">
    <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[{ name: "Farm", value: farmPct }, { name: "Rent", value: rentPct }]} cx="50%" cy="50%" innerRadius={28} outerRadius={45} dataKey="value">
                <Cell fill="#4ade80" />
                <Cell fill="#60a5fa" />
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, ""]} contentStyle={{ background: "var(--sk-card2)", border: "none", borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          </div>
          <div className="flex gap-4 justify-center mt-1 text-xs text-[var(--sk-faint)]">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />{t.farmProfitLabel} {farmPct}%</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />{t.rentIncome} {rentPct}%</div>
          </div>
        </FormCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <FormCard>
          <div className="text-xs text-[var(--sk-faint)] mb-2">{t.quickStats}</div>
          <div className="space-y-2">
            {[
              { label: t.tenantsLabel, value: fmtNum(rentFiltered.length) },
              { label: t.cropsLabel, value: fmtNum(cropSet.length) },
              { label: t.expensesLabel, value: fmtNum(homeFiltered.length + farmFiltered.filter(f => f.type === "Expense").length) },
              { label: t.txLabel, value: fmtNum(homeFiltered.length + rentFiltered.length + farmFiltered.length) },
            ].map(item => (
              <div key={item.label} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-[var(--sk-muted)] text-sm">{item.label}</span>
                <strong className="text-white font-mono">{item.value}</strong>
              </div>
            ))}
          </div>
        </FormCard>

        <FormCard>
          <div className="text-xs text-[var(--sk-faint)] mb-2">{t.insightsLabel}</div>
          <ul className="space-y-2.5">
            {insights.map((insight, index) => (
              <li key={index} className="text-xs sm:text-sm leading-6 break-words text-[var(--sk-muted)] flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </FormCard>
      </div>

      <FormCard>
  <div className="text-xs text-[var(--sk-faint)] mb-3">
    Recent Activities
  </div>

  <div className="space-y-2">
    {recentActivities.map((item, index) => (
      <div
        key={index}
        className="flex justify-between border-b border-white/5 pb-2"
      >
        <div>
          <div className="font-medium">
            {item.icon} {item.title}
          </div>
          <div className="text-xs text-[var(--sk-muted)]">
            {item.subtitle}
          </div>
        </div>

<div className={`${item.color} font-bold text-right sm:text-left`}>
            {fmt(item.amount)}
        </div>
      </div>
    ))}
  </div>
</FormCard>
    </div>
  );
}
