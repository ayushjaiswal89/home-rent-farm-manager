"use client";

import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  FarmRecord,
  HomeExpense,
  Lang,
  RentRecord,
} from "../../lib/types";

import { fmt, fmtNum } from "../../lib/utils";
import { FormCard, SectionHeader } from "../common/UI";

interface ReportsSectionProps {
  home: HomeExpense[];
  rent: RentRecord[];
  farm: FarmRecord[];
  lang: Lang;
}

type ReportRange = "today" | "month" | "year" | "all";

const safeNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getToday = () => new Date().toISOString().slice(0, 10);

const getMonth = () => getToday().slice(0, 7);

const getYear = () => getToday().slice(0, 4);

const money = (value: number) =>
  `Rs. ${safeNumber(value).toLocaleString("en-IN")}`;

export function ReportsSection({
  home,
  rent,
  farm,
  lang,
}: ReportsSectionProps) {
  const isHindi = lang === "hi";

  /* ---------------------------------------------------------
     Language
  --------------------------------------------------------- */

  const L = {
    title: isHindi ? "रिपोर्ट" : "Reports",
    subtitle: isHindi
      ? "घर, किराया और खेती की वित्तीय रिपोर्ट"
      : "Financial overview of home, rent and farm",

    today: isHindi ? "आज" : "Today",
    month: isHindi ? "इस महीने" : "This Month",
    year: isHindi ? "इस साल" : "This Year",
    all: isHindi ? "सभी" : "All Time",

    pdf: "PDF",
    excel: "Excel",
    print: isHindi ? "प्रिंट" : "Print",

    home: isHindi ? "घर खर्च" : "Home Expense",
    rent: isHindi ? "किराया" : "Rent",
    received: isHindi ? "प्राप्त" : "Received",
    pending: isHindi ? "बाकी" : "Pending",
    farm: isHindi ? "खेती" : "Farm",
    sale: isHindi ? "बिक्री" : "Sale",
    expense: isHindi ? "खर्च" : "Expense",
    profit: isHindi ? "लाभ" : "Profit",
    income: isHindi ? "कुल आय" : "Total Income",
    totalExpense: isHindi ? "कुल खर्च" : "Total Expense",
    balance: isHindi ? "नेट बैलेंस" : "Net Balance",

    crops: isHindi ? "फसलें" : "Crops",
    tenants: isHindi ? "किरायेदार" : "Tenants",
    transactions: isHindi ? "लेनदेन" : "Transactions",
    rentPaid: isHindi ? "भुगतान किराया" : "Rent Paid",
    rentPending: isHindi ? "बाकी किराया" : "Rent Pending",

    filters: isHindi ? "फिल्टर" : "Filters",
    allCrops: isHindi ? "सभी फसलें" : "All Crops",
    allTenants: isHindi ? "सभी किरायेदार" : "All Tenants",
    allCategories: isHindi ? "सभी श्रेणियां" : "All Categories",

    monthlyTrend: isHindi
      ? "मासिक वित्तीय ट्रेंड"
      : "Monthly Financial Trend",

    incomeBreakdown: isHindi
      ? "आय का विवरण"
      : "Income Breakdown",

    expenseBreakdown: isHindi
      ? "खर्च का विवरण"
      : "Expense Breakdown",

    quickStats: isHindi ? "त्वरित जानकारी" : "Quick Stats",

    insights: isHindi ? "मुख्य जानकारी" : "Insights",

    recent: isHindi
      ? "हाल की गतिविधियां"
      : "Recent Activities",

    noData: isHindi
      ? "कोई डेटा उपलब्ध नहीं है"
      : "No data available",

    noActivities: isHindi
      ? "कोई गतिविधि नहीं मिली"
      : "No activities found",

    allPaymentsClear: isHindi
      ? "सभी चयनित किराया भुगतान पूरे हैं।"
      : "All selected rent payments are cleared.",

    rentHigher: isHindi
      ? "किराया घर के खर्च से अधिक है।"
      : "Rent is higher than home expense.",

    homeHigher: isHindi
      ? "घर का खर्च किराये से अधिक है।"
      : "Home expense is higher than rent.",

    farmProfit: isHindi
      ? "खेती में लाभ"
      : "Farm profit",

    farmLoss: isHindi
      ? "खेती में नुकसान"
      : "Farm loss",

    trackedCrops: isHindi
      ? "ट्रैक की गई फसलें"
      : "Tracked crops",

    generated: isHindi ? "बनाया गया" : "Generated",
    owner: isHindi ? "मालिक" : "Owner",
    period: isHindi ? "अवधि" : "Period",

    rentBilled: isHindi
      ? "किराया बिल"
      : "Rent Billed",

    farmSale: isHindi
      ? "खेती बिक्री"
      : "Farm Sale",

    farmExpense: isHindi
      ? "खेती खर्च"
      : "Farm Expense",

    report: isHindi
      ? "वित्तीय रिपोर्ट"
      : "Financial Report",

    date: isHindi ? "दिनांक" : "Date",
    tenant: isHindi ? "किरायेदार" : "Tenant",
    amount: isHindi ? "राशि" : "Amount",
    status: isHindi ? "स्थिति" : "Status",
    type: isHindi ? "प्रकार" : "Type",
    crop: isHindi ? "फसल" : "Crop",
  };

  /* ---------------------------------------------------------
     State
  --------------------------------------------------------- */

  const [range, setRange] =
    useState<ReportRange>("all");

  const [cropFilter, setCropFilter] =
    useState("all");

  const [tenantFilter, setTenantFilter] =
    useState("all");

  const [categoryFilter, setCategoryFilter] =
    useState("all");

  /* ---------------------------------------------------------
     Date helpers
  --------------------------------------------------------- */

  const today = getToday();
  const currentMonth = getMonth();
  const currentYear = getYear();

  const isInRange = (date: string) => {
    if (!date) return false;

    if (range === "all") return true;

    if (range === "today") {
      return date === today;
    }

    if (range === "month") {
      return date.startsWith(currentMonth);
    }

    if (range === "year") {
      return date.startsWith(currentYear);
    }

    return true;
  };

  /* ---------------------------------------------------------
     Filtered data
  --------------------------------------------------------- */

  const homeFiltered = useMemo(() => {
    return home.filter((item) => {
      if (!isInRange(item.date)) return false;

      if (
        categoryFilter !== "all" &&
        item.category !== categoryFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    home,
    range,
    categoryFilter,
    today,
    currentMonth,
    currentYear,
  ]);

  const rentFiltered = useMemo(() => {
    return rent.filter((item) => {
      if (!isInRange(item.date)) return false;

      if (
        tenantFilter !== "all" &&
        item.tenant !== tenantFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    rent,
    range,
    tenantFilter,
    today,
    currentMonth,
    currentYear,
  ]);

  const farmFiltered = useMemo(() => {
    return farm.filter((item) => {
      if (!isInRange(item.date)) return false;

      if (
        cropFilter !== "all" &&
        item.crop !== cropFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    farm,
    range,
    cropFilter,
    today,
    currentMonth,
    currentYear,
  ]);

  /* ---------------------------------------------------------
     Filter options
  --------------------------------------------------------- */

  const cropList = useMemo(
    () =>
      [...new Set(farm.map((item) => item.crop))]
        .filter(Boolean)
        .sort(),
    [farm]
  );

  const tenantList = useMemo(
    () =>
      [...new Set(rent.map((item) => item.tenant))]
        .filter(Boolean)
        .sort(),
    [rent]
  );

  const categoryList = useMemo(
    () =>
      [...new Set(home.map((item) => item.category))]
        .filter(Boolean)
        .sort(),
    [home]
  );

  /* ---------------------------------------------------------
     Calculations
  --------------------------------------------------------- */

  const homeTotal = useMemo(
    () =>
      homeFiltered.reduce(
        (sum, item) =>
          sum + safeNumber(item.amount),
        0
      ),
    [homeFiltered]
  );

  const rentBilled = useMemo(
    () =>
      rentFiltered.reduce(
        (sum, item) =>
          sum + safeNumber(item.total),
        0
      ),
    [rentFiltered]
  );

  const rentReceived = useMemo(
    () =>
      rentFiltered.reduce(
        (sum, item) =>
          sum + safeNumber(item.paidAmount),
        0
      ),
    [rentFiltered]
  );

  const rentPending = useMemo(
    () =>
      rentFiltered.reduce(
        (sum, item) =>
          sum + Math.max(
            0,
            safeNumber(item.remainingAmount)
          ),
        0
      ),
    [rentFiltered]
  );

  const farmSale = useMemo(
    () =>
      farmFiltered
        .filter((item) => item.type === "Sale")
        .reduce(
          (sum, item) =>
            sum + safeNumber(item.amount),
          0
        ),
    [farmFiltered]
  );

  const farmExpense = useMemo(
    () =>
      farmFiltered
        .filter((item) => item.type === "Expense")
        .reduce(
          (sum, item) =>
            sum + safeNumber(item.amount),
          0
        ),
    [farmFiltered]
  );

  const farmProfit =
    farmSale - farmExpense;

  const totalIncome =
    rentReceived + farmSale;

  const totalExpense =
    homeTotal + farmExpense;

  const netBalance =
    totalIncome - totalExpense;

  const totalTransactions =
    homeFiltered.length +
    rentFiltered.length +
    farmFiltered.length;

  const cropCount =
    new Set(
      farmFiltered.map((item) => item.crop)
    ).size;

  const receivedRentCount =
    rentFiltered.filter(
      (item) =>
        safeNumber(item.remainingAmount) <= 0
    ).length;

  const pendingRentCount =
    rentFiltered.filter(
      (item) =>
        safeNumber(item.remainingAmount) > 0
    ).length;

  /* ---------------------------------------------------------
     Percentages
  --------------------------------------------------------- */

  const rentIncomePct =
    totalIncome > 0
      ? Math.round(
        (rentReceived / totalIncome) * 100
      )
      : 0;

  const farmIncomePct =
    totalIncome > 0
      ? Math.round(
        (farmSale / totalIncome) * 100
      )
      : 0;

  /* ---------------------------------------------------------
     Monthly chart
  --------------------------------------------------------- */

  const chartData = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return months.map((monthName, index) => {
      const monthNo =
        String(index + 1).padStart(2, "0");

      const rentValue =
        rentFiltered
          .filter(
            (item) =>
              item.date.split("-")[1] === monthNo
          )
          .reduce(
            (sum, item) =>
              sum + safeNumber(item.paidAmount),
            0
          );

      const farmValue =
        farmFiltered
          .filter(
            (item) =>
              item.type === "Sale" &&
              item.date.split("-")[1] === monthNo
          )
          .reduce(
            (sum, item) =>
              sum + safeNumber(item.amount),
            0
          );

      const homeValue =
        homeFiltered
          .filter(
            (item) =>
              item.date.split("-")[1] === monthNo
          )
          .reduce(
            (sum, item) =>
              sum + safeNumber(item.amount),
            0
          );

      return {
        month: monthName,
        rent: rentValue,
        farm: farmValue,
        home: homeValue,
      };
    });
  }, [
    homeFiltered,
    rentFiltered,
    farmFiltered,
  ]);

  /* ---------------------------------------------------------
     Insights
  --------------------------------------------------------- */

  const insights = useMemo(() => {
    const list: string[] = [];

    if (rentReceived >= homeTotal) {
      list.push(
        `✓ ${L.rentHigher} ${fmt(
          rentReceived
        )}`
      );
    } else {
      list.push(
        `! ${L.homeHigher} ${fmt(
          homeTotal
        )}`
      );
    }

    if (farmProfit >= 0) {
      list.push(
        `✓ ${L.farmProfit}: ${fmt(
          farmProfit
        )}`
      );
    } else {
      list.push(
        `! ${L.farmLoss}: ${fmt(
          Math.abs(farmProfit)
        )}`
      );
    }

    if (rentPending > 0) {
      list.push(
        `! ${L.rentPending}: ${fmt(
          rentPending
        )}`
      );
    } else {
      list.push(`✓ ${L.allPaymentsClear}`);
    }

    list.push(
      `${L.trackedCrops}: ${cropCount} • ${L.transactions}: ${totalTransactions}`
    );

    return list;
  }, [
    rentReceived,
    homeTotal,
    farmProfit,
    rentPending,
    cropCount,
    totalTransactions,
    L,
  ]);

  /* ---------------------------------------------------------
     Recent activities
  --------------------------------------------------------- */

  const recentActivities = useMemo(() => {
    const activities = [
      ...homeFiltered.map((item) => ({
        id: `home-${item.id}`,
        date: item.date,
        title: L.home,
        subtitle: item.category,
        amount: -safeNumber(item.amount),
        color: "text-red-400",
        icon: "⌂",
      })),

      ...rentFiltered.map((item) => ({
        id: `rent-${item.id}`,
        date: item.date,
        title: L.rent,
        subtitle: item.tenant,
        amount: safeNumber(item.paidAmount),
        color:
          safeNumber(item.paidAmount) > 0
            ? "text-green-400"
            : "text-yellow-400",
        icon: "₹",
      })),

      ...farmFiltered.map((item) => ({
        id: `farm-${item.id}`,
        date: item.date,
        title:
          item.type === "Sale"
            ? L.sale
            : item.type === "Expense"
              ? L.expense
              : "Yield",
        subtitle: item.crop,
        amount:
          item.type === "Sale"
            ? safeNumber(item.amount)
            : item.type === "Expense"
              ? -safeNumber(item.amount)
              : 0,
        color:
          item.type === "Sale"
            ? "text-green-400"
            : "text-red-400",
        icon: "F",
      })),
    ];

    return activities
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
      .slice(0, 8);
  }, [
    homeFiltered,
    rentFiltered,
    farmFiltered,
    L,
  ]);

  /* ---------------------------------------------------------
     PDF
  --------------------------------------------------------- */

  const downloadPDF = () => {
    const doc = new jsPDF();

    const period =
      range === "today"
        ? L.today
        : range === "month"
          ? L.month
          : range === "year"
            ? L.year
            : L.all;

    doc.setTextColor(22, 163, 74);
    doc.setFontSize(21);
    doc.text("SMART KHAATA", 14, 18);

    doc.setTextColor(40);
    doc.setFontSize(12);
    doc.text(L.report, 14, 27);

    doc.setFontSize(9);
    doc.text(
      `${L.owner}: Ayush Jaiswal`,
      14,
      35
    );

    doc.text(
      `${L.period}: ${period}`,
      14,
      41
    );

    doc.text(
      `${L.generated}: ${new Date().toLocaleString(
        "en-IN"
      )}`,
      14,
      47
    );

    autoTable(doc, {
      startY: 54,
      head: [[
        isHindi ? "विवरण" : "Summary",
        L.amount,
      ]],
      body: [
        [L.home, money(homeTotal)],
        [L.rentBilled, money(rentBilled)],
        [L.received, money(rentReceived)],
        [L.pending, money(rentPending)],
        [L.farmSale, money(farmSale)],
        [L.farmExpense, money(farmExpense)],
        [L.profit, money(farmProfit)],
        [L.income, money(totalIncome)],
        [L.totalExpense, money(totalExpense)],
        [L.balance, money(netBalance)],
      ],
      headStyles: {
        fillColor: [22, 163, 74],
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
    });

    let nextY =
      ((doc as any).lastAutoTable?.finalY ||
        110) + 8;

    if (rentFiltered.length > 0) {
      autoTable(doc, {
        startY: nextY,
        head: [[
          L.date,
          L.tenant,
          L.amount,
          L.received,
          L.pending,
          L.status,
        ]],
        body: rentFiltered.map((item) => [
          item.date,
          item.tenant,
          money(item.total),
          money(item.paidAmount),
          money(item.remainingAmount),
          item.status,
        ]),
        headStyles: {
          fillColor: [59, 130, 246],
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.5,
        },
      });

      nextY =
        ((doc as any).lastAutoTable?.finalY ||
          nextY) + 8;
    }

    if (farmFiltered.length > 0) {
      autoTable(doc, {
        startY: nextY,
        head: [[
          L.date,
          L.type,
          L.crop,
          L.amount,
        ]],
        body: farmFiltered.map((item) => [
          item.date,
          item.type,
          item.crop,
          money(item.amount),
        ]),
        headStyles: {
          fillColor: [34, 197, 94],
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.5,
        },
      });
    }

    doc.save(
      "Smart-Khaata-Report.pdf"
    );
  };

  /* ---------------------------------------------------------
     Excel
  --------------------------------------------------------- */

  const downloadExcel = () => {
    const workbook =
      XLSX.utils.book_new();

    const summary = [
      {
        Item: L.home,
        Amount: homeTotal,
      },
      {
        Item: L.rentBilled,
        Amount: rentBilled,
      },
      {
        Item: L.received,
        Amount: rentReceived,
      },
      {
        Item: L.pending,
        Amount: rentPending,
      },
      {
        Item: L.farmSale,
        Amount: farmSale,
      },
      {
        Item: L.farmExpense,
        Amount: farmExpense,
      },
      {
        Item: L.profit,
        Amount: farmProfit,
      },
      {
        Item: L.income,
        Amount: totalIncome,
      },
      {
        Item: L.totalExpense,
        Amount: totalExpense,
      },
      {
        Item: L.balance,
        Amount: netBalance,
      },
    ];

    const homeData =
      homeFiltered.map((item) => ({
        Date: item.date,
        Category: item.category,
        Note: item.note,
        Amount: safeNumber(
          item.amount
        ),
      }));

    const rentData =
      rentFiltered.map((item) => ({
        Date: item.date,
        Tenant: item.tenant,
        Month: item.month,
        WhatsApp: item.whatsapp,
        Rent: safeNumber(item.amount),
        PreviousReading:
          safeNumber(item.prevReading),
        CurrentReading:
          safeNumber(item.currentReading),
        Units: safeNumber(item.units),
        RatePerUnit:
          safeNumber(item.ratePerUnit),
        LightBill:
          safeNumber(item.lightBill),
        TotalBill:
          safeNumber(item.total),
        PaidAmount:
          safeNumber(item.paidAmount),
        RemainingAmount:
          safeNumber(item.remainingAmount),
        Status: item.status,
        Note: item.note,
      }));

    const farmData =
      farmFiltered.map((item) => ({
        Date: item.date,
        Type: item.type,
        Crop: item.crop,
        ExpenseCategory:
          item.expenseCategory,
        Amount: safeNumber(item.amount),
        Quantity:
          safeNumber(item.quantity),
        Unit: item.unit,
        Price: safeNumber(item.price),
        Field: item.field || "",
        Area: safeNumber(item.area),
        AreaUnit: item.areaUnit || "",
        Worker: item.worker || "",
        Machine: item.machine || "",
        Season: item.season || "",
        Note: item.note,
      }));

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(summary),
      "Summary"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(homeData),
      "Home"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(rentData),
      "Rent"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(farmData),
      "Farm"
    );

    const buffer = XLSX.write(
      workbook,
      {
        bookType: "xlsx",
        type: "array",
      }
    );

    saveAs(
      new Blob([buffer], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "Smart-Khaata-Report.xlsx"
    );
  };

  /* ---------------------------------------------------------
     Print
  --------------------------------------------------------- */

  const printReport = () => {
    const win = window.open(
      "",
      "_blank"
    );

    if (!win) {
      alert(
        isHindi
          ? "कृपया popup की अनुमति दें।"
          : "Please allow pop-ups to print."
      );
      return;
    }

    const period =
      range === "today"
        ? L.today
        : range === "month"
          ? L.month
          : range === "year"
            ? L.year
            : L.all;

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Smart Khaata Report</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 28px;
            color: #222;
          }

          h1 {
            color: #16a34a;
            margin-bottom: 3px;
          }

          h2 {
            margin-top: 0;
            font-size: 17px;
          }

          .meta {
            line-height: 1.7;
            margin: 15px 0 20px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            border: 1px solid #ddd;
            padding: 8px;
          }

          th {
            background: #16a34a;
            color: white;
            text-align: left;
          }

          td:last-child {
            text-align: right;
          }

          .total {
            font-weight: bold;
            background: #f0fdf4;
          }

          @media print {
            body {
              padding: 10px;
            }
          }
        </style>
      </head>

      <body>

        <h1>SMART KHAATA</h1>
        <h2>${L.report}</h2>

        <div class="meta">
          <b>${L.owner}:</b> Ayush Jaiswal<br/>
          <b>${L.period}:</b> ${period}<br/>
          <b>${L.generated}:</b>
          ${new Date().toLocaleString("en-IN")}
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>${L.amount}</th>
            </tr>
          </thead>

          <tbody>

            <tr>
              <td>${L.home}</td>
              <td>${fmt(homeTotal)}</td>
            </tr>

            <tr>
              <td>${L.rentBilled}</td>
              <td>${fmt(rentBilled)}</td>
            </tr>

            <tr>
              <td>${L.received}</td>
              <td>${fmt(rentReceived)}</td>
            </tr>

            <tr>
              <td>${L.pending}</td>
              <td>${fmt(rentPending)}</td>
            </tr>

            <tr>
              <td>${L.farmSale}</td>
              <td>${fmt(farmSale)}</td>
            </tr>

            <tr>
              <td>${L.farmExpense}</td>
              <td>${fmt(farmExpense)}</td>
            </tr>

            <tr>
              <td>${L.profit}</td>
              <td>${fmt(farmProfit)}</td>
            </tr>

            <tr>
              <td>${L.income}</td>
              <td>${fmt(totalIncome)}</td>
            </tr>

            <tr>
              <td>${L.totalExpense}</td>
              <td>${fmt(totalExpense)}</td>
            </tr>

            <tr class="total">
              <td>${L.balance}</td>
              <td>${fmt(netBalance)}</td>
            </tr>

          </tbody>
        </table>

      </body>
      </html>
    `);

    win.document.close();
    win.focus();

    setTimeout(() => {
      win.print();
    }, 300);
  };

  /* ---------------------------------------------------------
     UI
  --------------------------------------------------------- */

  return (
    <div className="w-full max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

        <SectionHeader
          title={L.title}
          sub={L.subtitle}
        />

        {/* Export */}
        <div className="grid grid-cols-3 gap-2 sm:flex">
          <button
            onClick={downloadPDF}
            className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-semibold transition"
          >
            PDF
          </button>

          <button
            onClick={downloadExcel}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition"
          >
            Excel
          </button>

          <button
            onClick={printReport}
            className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold transition"
          >
            {L.print}
          </button>
        </div>
      </div>

      {/* Filters */}
      <FormCard>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[var(--sk-faint)]">
            {L.filters}
          </span>

          <button
            onClick={() => {
              setRange("all");
              setCropFilter("all");
              setTenantFilter("all");
              setCategoryFilter("all");
            }}
            className="text-[11px] text-green-400 hover:text-green-300"
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">

          {[
            ["today", L.today],
            ["month", L.month],
            ["year", L.year],
            ["all", L.all],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() =>
                setRange(
                  value as ReportRange
                )
              }
              className={`px-3 py-2 rounded-lg text-xs font-medium transition ${range === value
                ? "bg-green-500 text-white"
                : "bg-[var(--sk-card)] text-[var(--sk-muted)] hover:bg-green-500/10"
                }`}
            >
              {label}
            </button>
          ))}

          <select
            value={cropFilter}
            onChange={(e) =>
              setCropFilter(e.target.value)
            }
            className="px-2.5 py-2 rounded-lg text-xs bg-[var(--sk-card)] border border-[var(--sk-border)] outline-none"
          >
            <option value="all">
              {L.allCrops}
            </option>

            {cropList.map((crop) => (
              <option
                key={crop}
                value={crop}
              >
                {crop}
              </option>
            ))}
          </select>

          <select
            value={tenantFilter}
            onChange={(e) =>
              setTenantFilter(e.target.value)
            }
            className="px-2.5 py-2 rounded-lg text-xs bg-[var(--sk-card)] border border-[var(--sk-border)] outline-none"
          >
            <option value="all">
              {L.allTenants}
            </option>

            {tenantList.map(
              (tenant) => (
                <option
                  key={tenant}
                  value={tenant}
                >
                  {tenant}
                </option>
              )
            )}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(
                e.target.value
              )
            }
            className="px-2.5 py-2 rounded-lg text-xs bg-[var(--sk-card)] border border-[var(--sk-border)] outline-none"
          >
            <option value="all">
              {L.allCategories}
            </option>

            {categoryList.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              )
            )}
          </select>

        </div>
      </FormCard>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 mb-4">

        {[
          {
            label: L.home,
            value: homeTotal,
            color: "text-red-400",
          },
          {
            label: L.received,
            value: rentReceived,
            color: "text-blue-400",
          },
          {
            label: L.pending,
            value: rentPending,
            color: "text-yellow-400",
          },
          {
            label: L.profit,
            value: farmProfit,
            color:
              farmProfit >= 0
                ? "text-teal-400"
                : "text-red-400",
          },
          {
            label: L.income,
            value: totalIncome,
            color: "text-green-400",
          },
          {
            label: L.balance,
            value: netBalance,
            color:
              netBalance >= 0
                ? "text-green-400"
                : "text-red-400",
          },
        ].map((item) => (
          <FormCard key={item.label}>
            <div className="text-[10px] sm:text-xs text-[var(--sk-faint)] mb-1 truncate">
              {item.label}
            </div>

            <div
              className={`text-sm sm:text-base font-bold font-mono ${item.color}`}
            >
              {fmt(item.value)}
            </div>
          </FormCard>
        ))}

      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-3">

        {/* Monthly */}
        <FormCard>

          <div className="text-xs font-semibold text-[var(--sk-faint)] mb-2">
            {L.monthlyTrend}
          </div>

          <div className="h-52 sm:h-60">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={chartData}
                barGap={2}
                margin={{
                  top: 5,
                  right: 5,
                  left: -20,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--sk-grid)"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 9,
                    fill: "#64748b",
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fontSize: 9,
                    fill: "#64748b",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                  tickFormatter={(value) =>
                    `₹${Math.round(
                      Number(value) / 1000
                    )}K`
                  }
                />

                <Tooltip
                  formatter={(
                    value: number
                  ) => [
                      fmt(value),
                      "",
                    ]}
                  contentStyle={{
                    background:
                      "var(--sk-card2)",
                    border:
                      "1px solid var(--sk-border2)",
                    borderRadius: 8,
                    fontSize: 10,
                  }}
                />

                <Bar
                  dataKey="rent"
                  name={L.rent}
                  fill="#60a5fa"
                  radius={[2, 2, 0, 0]}
                />

                <Bar
                  dataKey="farm"
                  name={L.farm}
                  fill="#4ade80"
                  radius={[2, 2, 0, 0]}
                />

                <Bar
                  dataKey="home"
                  name={L.home}
                  fill="#f87171"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

          </div>

          <div className="flex justify-center gap-4 text-[10px] text-[var(--sk-faint)] mt-1">

            <span>
              <i className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1" />
              {L.rent}
            </span>

            <span>
              <i className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1" />
              {L.farm}
            </span>

            <span>
              <i className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />
              {L.home}
            </span>

          </div>

        </FormCard>

        {/* Income */}
        <FormCard>

          <div className="text-xs font-semibold text-[var(--sk-faint)] mb-2">
            {L.incomeBreakdown}
          </div>

          {totalIncome > 0 ? (
            <>
              <div className="h-52 sm:h-60">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>

                    <Pie
                      data={[
                        {
                          name: L.farm,
                          value: farmIncomePct,
                        },
                        {
                          name: L.rent,
                          value: rentIncomePct,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={78}
                      dataKey="value"
                    >
                      <Cell fill="#4ade80" />
                      <Cell fill="#60a5fa" />
                    </Pie>

                    <Tooltip
                      formatter={(
                        value: number
                      ) => [
                          `${value}%`,
                          "",
                        ]}
                    />

                  </PieChart>
                </ResponsiveContainer>

              </div>

              <div className="flex justify-center gap-5 text-[10px] text-[var(--sk-faint)]">

                <span>
                  <i className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1" />
                  {L.farm} {farmIncomePct}%
                </span>

                <span>
                  <i className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1" />
                  {L.rent} {rentIncomePct}%
                </span>

              </div>
            </>
          ) : (
            <div className="h-52 flex items-center justify-center text-xs text-[var(--sk-muted)]">
              {L.noData}
            </div>
          )}

        </FormCard>

      </div>

      {/* Stats + Expense */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-3">

        {/* Expense */}
        <FormCard>

          <div className="text-xs font-semibold text-[var(--sk-faint)] mb-3">
            {L.expenseBreakdown}
          </div>

          {totalExpense > 0 ? (
            <div className="space-y-3">

              {[
                {
                  label: L.home,
                  value: homeTotal,
                  color: "bg-red-400",
                },
                {
                  label: L.farmExpense,
                  value: farmExpense,
                  color: "bg-orange-400",
                },
              ].map((item) => {

                const percentage =
                  Math.round(
                    (item.value /
                      totalExpense) *
                    100
                  );

                return (
                  <div key={item.label}>

                    <div className="flex justify-between text-xs mb-1">

                      <span className="text-[var(--sk-muted)]">
                        {item.label}
                      </span>

                      <span className="font-mono font-semibold">
                        {fmt(item.value)}
                      </span>

                    </div>

                    <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/5 overflow-hidden">

                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                    <div className="text-[9px] text-[var(--sk-faint)] mt-1">
                      {percentage}%
                    </div>

                  </div>
                );
              })}

            </div>
          ) : (
            <div className="text-xs text-[var(--sk-muted)]">
              {L.noData}
            </div>
          )}

        </FormCard>

        {/* Quick stats */}
        <FormCard>

          <div className="text-xs font-semibold text-[var(--sk-faint)] mb-3">
            {L.quickStats}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

            {[
              {
                label: L.tenants,
                value: rentFiltered.length,
              },
              {
                label: L.crops,
                value: cropCount,
              },
              {
                label: L.rentPaid,
                value: receivedRentCount,
              },
              {
                label: L.rentPending,
                value: pendingRentCount,
              },
              {
                label: L.totalExpense,
                value:
                  homeFiltered.length +
                  farmFiltered.filter(
                    (item) =>
                      item.type === "Expense"
                  ).length,
              },
              {
                label: L.transactions,
                value: totalTransactions,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-[var(--sk-border)] bg-black/5 dark:bg-white/[0.02] px-3 py-2"
              >
                <div className="text-[9px] text-[var(--sk-faint)] truncate">
                  {item.label}
                </div>

                <div className="text-base font-bold font-mono mt-0.5">
                  {fmtNum(item.value)}
                </div>
              </div>
            ))}

          </div>

        </FormCard>

      </div>

      {/* Insights */}
      <FormCard>

        <div className="text-xs font-semibold text-[var(--sk-faint)] mb-2">
          {L.insights}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

          {insights.map(
            (insight, index) => (
              <div
                key={index}
                className="rounded-lg bg-black/5 dark:bg-white/[0.025] border border-[var(--sk-border)] px-3 py-2 text-xs text-[var(--sk-muted)]"
              >
                {insight}
              </div>
            )
          )}

        </div>

      </FormCard>

      {/* Recent Activities */}
      <FormCard>

        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-[var(--sk-faint)]">
            {L.recent}
          </div>

          <span className="text-[9px] text-[var(--sk-faint)]">
            {recentActivities.length}
          </span>
        </div>

        {recentActivities.length > 0 ? (
          <div className="divide-y divide-white/5">

            {recentActivities.map(
              (item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-2"
                >

                  <div className="flex items-center gap-2 min-w-0">

                    <div className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-xs shrink-0">
                      {item.icon}
                    </div>

                    <div className="min-w-0">

                      <div className="text-xs font-medium truncate">
                        {item.title}
                      </div>

                      <div className="text-[10px] text-[var(--sk-muted)] truncate">
                        {item.subtitle}
                      </div>

                      <div className="text-[9px] text-[var(--sk-faint)]">
                        {item.date}
                      </div>

                    </div>

                  </div>

                  <div
                    className={`${item.color} text-xs font-bold font-mono whitespace-nowrap`}
                  >
                    {item.amount >= 0
                      ? "+"
                      : ""}
                    {fmt(item.amount)}
                  </div>

                </div>
              )
            )}

          </div>
        ) : (
          <div className="py-7 text-center text-xs text-[var(--sk-muted)]">
            {L.noActivities}
          </div>
        )}

      </FormCard>

    </div>
  );
}