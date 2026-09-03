"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "alalei-product-studio-v1";
const SETTINGS_KEY = "alalei-product-studio-settings-v1";
const MARKET_STORAGE_KEY = "alalei-product-studio-markets-v1";
const CATALOG_MIGRATION_KEY = "alalei-product-catalog-2026-09-v1";

const STATUS = {
  idea: { label: "想法池", color: "#777268" },
  drawing: { label: "绘制中", color: "#cb6f4e" },
  proofing: { label: "打样中", color: "#a273b0" },
  producing: { label: "生产中", color: "#497e86" },
  ready: { label: "已完成生产", color: "#4f765b" },
  paused: { label: "暂缓", color: "#a29c91" },
};

const CATEGORIES = ["配饰", "纸品", "印章", "版画", "贴纸", "服装", "其他"];

const CATALOG_STAGE = {
  existing: { label: "已有成品", color: "#4f765b" },
  new: { label: "本轮新品", color: "#d56f51" },
  candidate: { label: "候补 / 后续", color: "#8b765d" },
  creative: { label: "创作记录", color: "#557c84" },
};

const LAUNCH_PRIORITY = {
  keep: "继续售卖",
  must: "9/25 必做",
  recommended: "本轮推荐",
  optional: "有时间再做",
  later: "暂缓",
  nonSku: "不算 SKU",
};

function catalogItem(id, series, name, category, catalogStage, launchPriority, artNeeded, artPlan, notes, aliases = []) {
  const priority = launchPriority === "must" ? 5 : launchPriority === "recommended" ? 4 : launchPriority === "keep" ? 3 : launchPriority === "optional" ? 2 : 1;
  return {
    id: `catalog-${id}`,
    name,
    series,
    category,
    catalogStage,
    launchPriority,
    status: catalogStage === "existing" ? "ready" : catalogStage === "candidate" ? "paused" : catalogStage === "creative" ? "drawing" : "idea",
    priority,
    artNeeded,
    artDone: catalogStage === "existing" ? artNeeded : 0,
    artPlan,
    designHours: 0,
    hoursDone: 0,
    productionDays: 0,
    unitCost: 0,
    fixedCost: 0,
    price: 0,
    plannedQty: 0,
    stock: 0,
    selfMade: false,
    deadline: "2026-09-25",
    notes,
    aliases,
  };
}

const CATALOG_IMPORT = [
  catalogItem("onsen-riso", "温泉", "温泉大图 Riso", "纸品", "existing", "keep", 0, "已有温泉大图", "销量表现可以，继续卖。"),
  catalogItem("onsen-badge-1", "温泉", "温泉吧唧①", "配饰", "existing", "keep", 0, "已有衍生图", "已有成品，继续卖。"),
  catalogItem("onsen-badge-2", "温泉", "温泉吧唧②", "配饰", "existing", "keep", 0, "已有衍生图", "已有成品，继续卖。"),
  catalogItem("onsen-badge-3", "温泉", "温泉吧唧③", "配饰", "existing", "keep", 0, "已有衍生图", "已有成品，继续卖。"),
  catalogItem("onsen-key-tag", "温泉", "温泉旅馆钥匙牌", "配饰", "new", "must", 0, "已有角色转线稿 / 符号", "明天先画版式；木质激光雕刻。"),
  catalogItem("moon-onsen-memo", "温泉", "月见温泉便签", "纸品", "new", "recommended", 1, "月亮＋泡汤角色", "有中秋限定感，之后也能继续卖。"),
  catalogItem("milk-charm-3d", "温泉", "3D 牛奶挂件", "配饰", "candidate", "later", 0, "已有牛奶元素；主要工作是建模", "候补项目，这轮暂缓。"),
  catalogItem("circus-riso", "马戏团", "马戏团 Riso", "纸品", "existing", "keep", 0, "已有图稿", "已有成品，继续卖。"),
  catalogItem("circus-sticker-1", "马戏团", "马戏团贴纸①", "贴纸", "existing", "keep", 0, "已有图稿", "已有成品，继续卖。"),
  catalogItem("circus-pastel-sticker", "马戏团", "色粉手绘贴纸②", "贴纸", "new", "must", 1, "全新色粉手绘", "可融入月亮和四叶草。"),
  catalogItem("circus-paper-pack", "马戏团", "Circus Paper Pack", "纸品", "new", "recommended", 0, "复用 Riso＋新色粉图", "门票、节目单、演员证等。"),
  catalogItem("circus-stamp", "马戏团", "马戏团印章", "印章", "new", "recommended", 0, "从已有角色提炼线稿", "ADMIT ONE / Lucky Circus。"),
  catalogItem("angel-sticker", "天使合唱团", "天使全切贴纸", "贴纸", "existing", "keep", 0, "已有图稿", "系列基础，继续卖。"),
  catalogItem("lucky-angel-omamori", "天使合唱团", "幸运天使御守", "配饰", "new", "must", 0, "复用现有天使", "加入四叶草元素。"),
  catalogItem("moonlight-hymn", "天使合唱团", "Moonlight Hymn 圣歌便签", "纸品", "new", "recommended", 1, "月亮＋唱歌天使", "新图可同时服务其他 SKU。"),
  catalogItem("angel-ex-libris", "天使合唱团", "EX LIBRIS 藏书票", "版画", "new", "recommended", 1, "天使＋书＋乐谱", "建议画成版画感。"),
  catalogItem("angel-paper-pack", "天使合唱团", "合唱团 Paper Pack", "纸品", "candidate", "optional", 0, "复用圣歌便签和藏书票新图", "圣歌纸、成员证、祝福卡；有时间再做。"),
  catalogItem("mini-hymnal", "天使合唱团", "Mini Hymnal", "纸品", "candidate", "later", 0, "以后复用上述图稿", "后续项目，这轮不增加工作量。"),
  catalogItem("dessert-riso", "甜品", "冰沙 Riso", "纸品", "existing", "keep", 0, "已有图稿", "甜品系列起点，继续卖。", ["刨冰 RISO 海报套装"]),
  catalogItem("dessert-sticker", "甜品", "冰沙贴纸", "贴纸", "existing", "keep", 0, "已有图稿", "已有成品，继续卖。"),
  catalogItem("dessert-memo", "甜品", "冰沙便签", "纸品", "new", "must", 0, "直接复用冰沙图", "排版为主，可以较快完成。"),
  catalogItem("moon-dessert-sticker", "甜品", "月见甜品贴纸", "贴纸", "new", "recommended", 1, "新甜品柄图；布丁 / 圣代二选一", "本轮推荐新品。"),
  catalogItem("dessert-journal-pages", "甜品", "甜品手帐内页", "纸品", "new", "recommended", 0, "复用冰沙＋月见甜品图", "以排版工作为主。"),
  catalogItem("dessert-tape", "甜品", "甜品胶带", "纸品", "candidate", "later", 0, "等待甜品图稿积累", "后续再做，暂时不赶 MOQ 和打样。"),
  catalogItem("penguin-diary", "企鹅生活", "生活记录漫画", "其他", "creative", "nonSku", 0, "随日常持续绘制", "暂时不商品化；不计入 SKU、成本和利润。"),
];

const SAMPLE_PRODUCTS = [
  {
    id: "p-omamori",
    name: "中秋四叶草御守",
    series: "中世纪",
    category: "配饰",
    status: "drawing",
    priority: 5,
    artNeeded: 2,
    artDone: 1,
    designHours: 8,
    hoursDone: 3,
    productionDays: 12,
    unitCost: 8,
    fixedCost: 220,
    price: 35,
    plannedQty: 50,
    stock: 0,
    selfMade: false,
    deadline: "2026-09-25",
    notes: "先完成正反两面柄图，再确认流苏与包装配色。",
  },
  {
    id: "p-passport",
    name: "旅途护照本",
    series: "中世纪",
    category: "纸品",
    status: "idea",
    priority: 4,
    artNeeded: 3,
    artDone: 0,
    designHours: 12,
    hoursDone: 0,
    productionDays: 15,
    unitCost: 18,
    fixedCost: 300,
    price: 69,
    plannedQty: 30,
    stock: 0,
    selfMade: false,
    deadline: "2026-09-25",
    notes: "成熟品类定制，控制首批数量并优先验证封面图案。",
  },
  {
    id: "p-stamp",
    name: "中世纪旅行印章组",
    series: "中世纪",
    category: "印章",
    status: "drawing",
    priority: 5,
    artNeeded: 6,
    artDone: 2,
    designHours: 14,
    hoursDone: 5,
    productionDays: 10,
    unitCost: 22,
    fixedCost: 180,
    price: 89,
    plannedQty: 24,
    stock: 0,
    selfMade: false,
    deadline: "2026-09-22",
    notes: "六枚图章：月亮、骑士、四叶草、鸟、钥匙、城堡。",
  },
  {
    id: "p-onsen",
    name: "温泉手帐贴纸包",
    series: "温泉",
    category: "贴纸",
    status: "proofing",
    priority: 4,
    artNeeded: 10,
    artDone: 8,
    designHours: 10,
    hoursDone: 8,
    productionDays: 5,
    unitCost: 5,
    fixedCost: 80,
    price: 28,
    plannedQty: 60,
    stock: 0,
    selfMade: true,
    deadline: "2026-09-16",
    notes: "泡温泉、浴衣、冰牛奶、打瞌睡等十枚小图。",
  },
  {
    id: "p-etching",
    name: "《白骑士之旅》铜版画",
    series: "白骑士之旅",
    category: "版画",
    status: "ready",
    priority: 3,
    artNeeded: 1,
    artDone: 1,
    designHours: 12,
    hoursDone: 12,
    productionDays: 1,
    unitCost: 35,
    fixedCost: 120,
    price: 239,
    plannedQty: 12,
    stock: 8,
    selfMade: true,
    deadline: "2026-09-10",
    notes: "已完成版，可按需少量印制，适合作为高客单核心商品。",
  },
  {
    id: "p-riso",
    name: "刨冰 RISO 海报套装",
    series: "甜品",
    category: "纸品",
    status: "paused",
    priority: 1,
    artNeeded: 1,
    artDone: 1,
    designHours: 6,
    hoursDone: 6,
    productionDays: 4,
    unitCost: 12,
    fixedCost: 60,
    price: 38,
    plannedQty: 20,
    stock: 11,
    selfMade: false,
    deadline: "2026-09-25",
    notes: "复购表现偏弱，暂缓追加库存，优先消化现有数量。",
  },
];

const EMPTY_PRODUCT = {
  name: "",
  series: "",
  category: "其他",
  catalogStage: "new",
  launchPriority: "recommended",
  status: "idea",
  priority: 3,
  artNeeded: 1,
  artDone: 0,
  artPlan: "",
  designHours: 4,
  hoursDone: 0,
  productionDays: 7,
  unitCost: 0,
  fixedCost: 0,
  price: 0,
  plannedQty: 20,
  stock: 0,
  restockThreshold: 5,
  restockTarget: 20,
  selfMade: false,
  deadline: "2026-09-25",
  notes: "",
};

const EMPTY_MARKET = {
  name: "",
  city: "",
  startDate: "2026-09-01",
  endDate: "2026-09-01",
  status: "planning",
  orders: 0,
  syncInventory: true,
  inventoryDeductions: {},
  sales: [],
  expenses: [
    { id: "expense-booth", category: "摊位费", label: "摊位费", amount: 0, kind: "direct", useCount: 1 },
  ],
  notes: "",
};

const EXPENSE_CATEGORIES = ["摊位费", "交通", "住宿", "运输", "展陈物料", "宣传", "包装", "支付手续费", "其他"];

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function productSeries(product) {
  const series = typeof product?.series === "string" ? product.series.trim() : "";
  return series || "未分类";
}

function productCatalogStage(product) {
  if (product?.catalogStage && CATALOG_STAGE[product.catalogStage]) return product.catalogStage;
  if (product?.status === "ready" || number(product?.stock) > 0) return "existing";
  if (product?.status === "paused") return "candidate";
  return "new";
}

function isSkuProduct(product) {
  return productCatalogStage(product) !== "creative";
}

function hasFinancialData(product) {
  return number(product?.price) > 0;
}

function getReservedInventory(markets = [], excludeMarketId = "") {
  return markets
    .filter((market) => market.status !== "closed" && market.id !== excludeMarketId)
    .reduce((result, market) => {
      for (const row of market.sales || []) {
        const reservedFromStock = Math.max(0, number(row.broughtQty) - number(row.newQty));
        result[row.productId] = (result[row.productId] || 0) + reservedFromStock;
      }
      return result;
    }, {});
}

function getInventoryState(product, reservations = {}) {
  const total = number(product?.stock);
  const reserved = number(reservations[product?.id]);
  const remaining = total - reserved;
  return {
    total,
    reserved,
    available: Math.max(0, remaining),
    shortage: Math.max(0, -remaining),
  };
}

function normalizeProduct(product) {
  const catalogStage = productCatalogStage(product);
  return {
    ...product,
    series: typeof product.series === "string" ? product.series : "",
    catalogStage,
    launchPriority: product.launchPriority || (catalogStage === "existing" ? "keep" : catalogStage === "candidate" ? "later" : "recommended"),
    artPlan: typeof product.artPlan === "string" ? product.artPlan : "",
    restockThreshold: product.restockThreshold == null ? 5 : number(product.restockThreshold),
    restockTarget: product.restockTarget == null ? Math.max(number(product.plannedQty), number(product.stock), 20) : number(product.restockTarget),
  };
}

function mergeCatalogProducts(products) {
  const merged = products.map(normalizeProduct);
  let added = 0;
  for (const catalogProduct of CATALOG_IMPORT) {
    const names = [catalogProduct.name, ...(catalogProduct.aliases || [])].map((name) => name.toLocaleLowerCase("zh-CN"));
    const existingIndex = merged.findIndex((product) => product.id === catalogProduct.id || names.includes(product.name.trim().toLocaleLowerCase("zh-CN")));
    const { aliases, ...catalogFields } = catalogProduct;
    if (existingIndex >= 0) {
      const current = merged[existingIndex];
      merged[existingIndex] = {
        ...current,
        series: current.series || catalogFields.series,
        catalogStage: catalogFields.catalogStage,
        launchPriority: catalogFields.launchPriority,
        artPlan: current.artPlan || catalogFields.artPlan,
        notes: current.notes || catalogFields.notes,
      };
    } else {
      merged.push(catalogFields);
      added += 1;
    }
  }
  return { products: merged, added };
}

function money(value) {
  const amount = number(value);
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function daysUntil(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateString}T00:00:00`);
  return Math.ceil((target - today) / 86400000);
}

function getMarketMetrics(market) {
  const revenue = (market.sales || []).reduce((sum, row) => sum + (row.revenueOverride === "" || row.revenueOverride == null ? number(row.soldQty) * number(row.eventPrice) : number(row.revenueOverride)), 0);
  const cogs = (market.sales || []).reduce((sum, row) => sum + number(row.soldQty) * number(row.unitCost), 0);
  const giftLossCost = (market.sales || []).reduce((sum, row) => sum + number(row.giftQty) * number(row.unitCost), 0);
  const producedInvestment = (market.sales || []).reduce((sum, row) => sum + number(row.newQty) * number(row.unitCost), 0);
  const displayCosts = (market.expenses || []).filter((e) => e.category === "展陈物料" || e.category === "共用展陈").reduce((sum, e) => sum + number(e.amount), 0);
  const directCosts = (market.expenses || []).reduce((sum, e) => sum + number(e.amount), 0);
  const cashInvestment = directCosts + producedInvestment;
  const cashResult = revenue - cashInvestment;
  const operatingProfit = revenue - cogs - giftLossCost - directCosts;
  const margin = revenue > 0 ? operatingProfit / revenue : 0;
  const brought = (market.sales || []).reduce((sum, row) => sum + number(row.broughtQty), 0);
  const sold = (market.sales || []).reduce((sum, row) => sum + number(row.soldQty), 0);
  const gifts = (market.sales || []).reduce((sum, row) => sum + number(row.giftQty), 0);
  const sellThrough = brought > 0 ? sold / brought : 0;
  const averageOrder = number(market.orders) > 0 ? revenue / number(market.orders) : 0;
  return { revenue, cogs, giftLossCost, producedInvestment, displayCosts, directCosts, cashInvestment, cashResult, operatingProfit, margin, brought, sold, gifts, sellThrough, averageOrder };
}

function getMetrics(product, dailyHours = 2) {
  const contribution = product.price - product.unitCost;
  const revenue = product.price * product.plannedQty;
  const totalCost = product.fixedCost + product.unitCost * product.plannedQty;
  const profit = revenue - totalCost;
  const breakEvenUnits = product.price > 0 ? Math.ceil(totalCost / product.price) : null;
  const breakEvenSales = breakEvenUnits === null ? null : breakEvenUnits * product.price;
  const margin = product.price > 0 ? contribution / product.price : 0;
  const remainingHours = Math.max(0, product.designHours - product.hoursDone);
  const neededDays = Math.ceil(remainingHours / Math.max(0.25, dailyHours)) + (product.status === "ready" ? 0 : product.productionDays);
  const daysLeft = daysUntil(product.deadline);
  const buffer = daysLeft - neededDays;
  const schedulePending = product.status !== "ready" && product.status !== "paused" && number(product.designHours) === 0 && number(product.productionDays) === 0;
  let risk = "safe";
  if (product.status === "paused") risk = "paused";
  else if (schedulePending) risk = "pending";
  else if (product.status !== "ready" && buffer < 0) risk = "late";
  else if (product.status !== "ready" && buffer <= 3) risk = "tight";
  const artProgress = product.artNeeded > 0 ? Math.min(1, product.artDone / product.artNeeded) : 1;
  const hourProgress = product.designHours > 0 ? Math.min(1, product.hoursDone / product.designHours) : 1;
  const progress = product.status === "ready" ? 1 : (artProgress + hourProgress) / 2;
  return { contribution, breakEvenUnits, breakEvenSales, revenue, totalCost, profit, margin, remainingHours, neededDays, daysLeft, buffer, risk, progress, schedulePending };
}

function Icon({ name, size = 18 }) {
  const paths = {
    plus: <><path d="M12 5v14M5 12h14" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    box: <><path d="m21 8-9 5-9-5 9-5 9 5Z" /><path d="m3 8 9 5 9-5M12 13v9" /><path d="m21 8v9l-9 5-9-5V8" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    receipt: <><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3Z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></>,
    upload: <><path d="M12 16V4m0 0 4 4m-4-4L8 8M5 20h14" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    spark: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" /><path d="m18.5 14 .7 2.3 2.3.7-2.3.8-.7 2.2-.8-2.2-2.2-.8 2.2-.7.8-2.3Z" /></>,
    edit: <><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /><path d="m14 7 3 3" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
    arrow: <><path d="M5 12h14m-5-5 5 5-5 5" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function StatCard({ eyebrow, value, note, tone, children }) {
  return (
    <article className={`stat-card ${tone || ""}`}>
      <div className="stat-top"><span>{eyebrow}</span>{children}</div>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

function RiskBadge({ risk, buffer, daysLeft }) {
  const klass = risk;
  if (risk === "paused") return <span className="risk paused">已暂缓</span>;
  if (risk === "pending") return <span className="risk pending">排期待补<em>填写绘制与生产时间</em></span>;
  const scheduleText = buffer < 0
    ? `预计延期 ${Math.abs(buffer)} 天`
    : buffer <= 3
      ? `仅余 ${buffer} 天缓冲`
      : `富余 ${buffer} 天`;
  const deadlineText = daysLeft < 0
    ? `截止已过 ${Math.abs(daysLeft)} 天`
    : daysLeft === 0
      ? "今天截止"
      : `距截止 ${daysLeft} 天`;
  return <span className={`risk ${klass}`}>{scheduleText}<em>{deadlineText}</em></span>;
}

function CatalogBadge({ product }) {
  const stage = CATALOG_STAGE[productCatalogStage(product)];
  const priority = LAUNCH_PRIORITY[product.launchPriority];
  return <span className="catalog-badges"><i style={{ "--catalog": stage.color }}>{stage.label}</i>{priority && <em>{priority}</em>}</span>;
}

function ProgressRing({ value }) {
  const progress = Math.round(value * 100);
  return <div className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` }}><span>{progress}%</span></div>;
}

function ProductRow({ product, dailyHours, reservations, onEdit, onDuplicate, onDelete }) {
  const metrics = getMetrics(product, dailyHours);
  const inventory = getInventoryState(product, reservations);
  const [menu, setMenu] = useState(false);
  return (
    <div className={`product-row catalog-${productCatalogStage(product)} status-${product.status}`}>
      <div className="product-main">
        <ProgressRing value={metrics.progress} />
        <div>
          <div className="name-line">
            <button className="product-name" onClick={() => onEdit(product)}>{product.name}</button>
            <span className={`status-dot ${product.status === "ready" ? "complete-status" : ""}`} style={{ "--status": STATUS[product.status].color }}>{STATUS[product.status].label}</span>
          </div>
          <div className="product-meta">
            <CatalogBadge product={product} /><span className="series-label">{productSeries(product)}</span><span>·</span><span>{product.category}</span><span>·</span><span>{product.artNeeded ? `${product.artDone}/${product.artNeeded} 个柄图` : "复用已有图稿"}</span>
          </div>
        </div>
      </div>
      <div className={`product-number inventory-number ${inventory.reserved > 0 ? "reserved" : ""}`}><small>可用库存</small><b>{inventory.available} 件</b>{inventory.reserved > 0 && <em>集市占用 {inventory.reserved} 件</em>}</div>
      <div className="product-number"><small>投入成本</small><b>{!isSkuProduct(product) ? "不计入" : hasFinancialData(product) ? money(metrics.totalCost) : "待补"}</b></div>
      <div className="product-number"><small>售价 / 毛利率</small><b>{!isSkuProduct(product) ? "不计入" : hasFinancialData(product) ? <>{money(product.price)} <i>{Math.round(metrics.margin * 100)}%</i></> : "待补"}</b></div>
      <div className="product-number"><small>现金回本</small><b>{!isSkuProduct(product) ? "不计入" : !hasFinancialData(product) ? "待补" : metrics.breakEvenUnits === null ? "—" : `${metrics.breakEvenUnits} 件`}</b></div>
      <div className="product-risk"><RiskBadge risk={metrics.risk} buffer={metrics.buffer} daysLeft={metrics.daysLeft} /></div>
      <div className="row-actions">
        <button className="icon-btn" aria-label="更多操作" onClick={() => setMenu(!menu)}><Icon name="more" /></button>
        {menu && <div className="row-menu">
          <button onClick={() => { onEdit(product); setMenu(false); }}><Icon name="edit" />编辑</button>
          <button onClick={() => { onDuplicate(product); setMenu(false); }}><Icon name="copy" />复制</button>
          <button className="danger" onClick={() => { onDelete(product); setMenu(false); }}><Icon name="trash" />删除</button>
        </div>}
      </div>
    </div>
  );
}

function ProductCard({ product, dailyHours, reservations, onEdit }) {
  const m = getMetrics(product, dailyHours);
  const inventory = getInventoryState(product, reservations);
  return (
    <button className={`mobile-product catalog-${productCatalogStage(product)} status-${product.status}`} onClick={() => onEdit(product)}>
      <div className="mobile-card-head">
        <div><CatalogBadge product={product} /><span className="mini-category">{productSeries(product)} / {product.category}</span><h3>{product.name}</h3></div>
        <ProgressRing value={m.progress} />
      </div>
      <div className="mobile-card-numbers">
        <span className={inventory.reserved > 0 ? "reserved" : ""}><small>可用库存</small><b>{inventory.available} 件</b>{inventory.reserved > 0 && <em>集市占用 {inventory.reserved}</em>}</span>
        <span><small>售价</small><b>{!isSkuProduct(product) ? "不计入" : hasFinancialData(product) ? money(product.price) : "待补"}</b></span>
        <span><small>预计利润</small><b>{!isSkuProduct(product) ? "不计入" : hasFinancialData(product) ? money(m.profit) : "待补"}</b></span>
        <span><small>现金回本</small><b>{!isSkuProduct(product) ? "不计入" : !hasFinancialData(product) ? "待补" : m.breakEvenUnits === null ? "—" : `${m.breakEvenUnits} 件`}</b></span>
      </div>
      <div className="mobile-card-foot"><span className={product.status === "ready" ? "complete-status" : ""} style={{ color: STATUS[product.status].color }}>{product.status === "ready" && "✓ "}{STATUS[product.status].label}</span><RiskBadge risk={m.risk} buffer={m.buffer} daysLeft={m.daysLeft} /></div>
    </button>
  );
}

function ProductEditor({ product, seriesOptions = [], onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(() => ({ ...EMPTY_PRODUCT, ...(product || {}) }));
  const isNew = !product?.id;
  const update = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));
  const metrics = getMetrics(draft, 2);
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    onSave({ ...draft, id: draft.id || `p-${Date.now()}`, name: draft.name.trim(), series: (draft.series || "").trim() });
  };
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="editor" role="dialog" aria-modal="true" aria-label={isNew ? "添加产品" : "编辑产品"}>
        <header className="editor-head">
          <div><span className="section-kicker">{isNew ? "NEW PRODUCT" : "PRODUCT DETAILS"}</span><h2>{isNew ? "添加一个产品想法" : "编辑产品"}</h2></div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭"><Icon name="close" /></button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="field wide"><label>产品名称</label><input autoFocus value={draft.name} onChange={(e) => update("name", e.target.value)} placeholder="例如：月亮护照本" required /></div>
          <div className="form-grid">
            <div className="field"><label>所属系列</label><input list="product-series-options" value={draft.series || ""} onChange={(e) => update("series", e.target.value)} placeholder="例如：温泉" /><datalist id="product-series-options">{seriesOptions.map((series) => <option value={series} key={series} />)}</datalist></div>
            <div className="field"><label>品类</label><select value={draft.category} onChange={(e) => update("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="field"><label>产品阶段</label><select value={draft.catalogStage} onChange={(e) => update("catalogStage", e.target.value)}>{Object.entries(CATALOG_STAGE).map(([key, value]) => <option value={key} key={key}>{value.label}</option>)}</select></div>
            <div className="field"><label>本轮定位</label><select value={draft.launchPriority} onChange={(e) => update("launchPriority", e.target.value)}>{Object.entries(LAUNCH_PRIORITY).map(([key, value]) => <option value={key} key={key}>{value}</option>)}</select></div>
            <div className="field"><label>制作状态</label><select value={draft.status} onChange={(e) => update("status", e.target.value)}>{Object.entries(STATUS).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}</select></div>
            <div className="field"><label>优先级</label><select value={draft.priority} onChange={(e) => update("priority", number(e.target.value))}>{[5, 4, 3, 2, 1].map((p) => <option key={p} value={p}>{"★".repeat(p)}{p === 5 ? " 最高" : ""}</option>)}</select></div>
            <div className="field"><label>完成期限</label><input type="date" value={draft.deadline} onChange={(e) => update("deadline", e.target.value)} /></div>
          </div>

          <div className="form-section-title"><span>图稿与时间</span><i /></div>
          <div className="field wide"><label>图稿方案</label><input value={draft.artPlan || ""} onChange={(e) => update("artPlan", e.target.value)} placeholder="例如：复用现有天使＋四叶草" /></div>
          <div className="form-grid three">
            <NumberField label="所需柄图" value={draft.artNeeded} onChange={(v) => update("artNeeded", v)} suffix="个" />
            <NumberField label="已完成柄图" value={draft.artDone} onChange={(v) => update("artDone", v)} suffix="个" />
            <NumberField label="总绘制时间" value={draft.designHours} onChange={(v) => update("designHours", v)} suffix="小时" step="0.5" />
            <NumberField label="已投入时间" value={draft.hoursDone} onChange={(v) => update("hoursDone", v)} suffix="小时" step="0.5" />
            <NumberField label="生产等待" value={draft.productionDays} onChange={(v) => update("productionDays", v)} suffix="天" />
            <div className="field toggle-field"><label>制作方式</label><button type="button" className={`toggle ${draft.selfMade ? "on" : ""}`} onClick={() => update("selfMade", !draft.selfMade)}><span />{draft.selfMade ? "可独立制作" : "厂家生产"}</button></div>
          </div>

          <div className="form-section-title"><span>成本与售价</span><i /></div>
          <div className="form-grid three">
            <NumberField label="单件成本" value={draft.unitCost} onChange={(v) => update("unitCost", v)} prefix="¥" step="0.01" />
            <NumberField label="固定成本" value={draft.fixedCost} onChange={(v) => update("fixedCost", v)} prefix="¥" step="0.01" />
            <NumberField label="预计售价" value={draft.price} onChange={(v) => update("price", v)} prefix="¥" step="0.01" />
            <NumberField label="首批数量" value={draft.plannedQty} onChange={(v) => update("plannedQty", v)} suffix="件" />
            <NumberField label="现有总库存" value={draft.stock} onChange={(v) => update("stock", v)} suffix="件" />
            <NumberField label="补货提醒线" value={draft.restockThreshold ?? 5} onChange={(v) => update("restockThreshold", v)} suffix="件" />
            <NumberField label="补货目标库存" value={draft.restockTarget ?? draft.plannedQty} onChange={(v) => update("restockTarget", v)} suffix="件" />
          </div>
          <div className={`live-calc ${metrics.profit < 0 ? "negative" : ""}`}>
            <span><small>首批投入</small><b>{money(metrics.totalCost)}</b></span>
            <span><small>预计利润</small><b>{money(metrics.profit)}</b></span>
            <span><small>现金回本</small><b>{metrics.breakEvenUnits === null ? "请先填写售价" : `${metrics.breakEvenUnits} 件 · ${money(metrics.breakEvenSales)}`}</b></span>
          </div>
          <div className="field wide"><label>备注 / 下一步</label><textarea rows="3" value={draft.notes} onChange={(e) => update("notes", e.target.value)} placeholder="记录待确认的工艺、厂家反馈或下一步动作" /></div>
          <footer className="editor-actions">
            {!isNew && <button type="button" className="text-danger" onClick={() => onDelete(product)}>删除产品</button>}
            <div><button type="button" className="secondary-btn" onClick={onClose}>取消</button><button type="submit" className="primary-btn">保存产品</button></div>
          </footer>
        </form>
      </section>
    </div>
  );
}

function NumberField({ label, value, onChange, prefix, suffix, step = "1" }) {
  return <div className="field"><label>{label}</label><div className="affix-input">{prefix && <span>{prefix}</span>}<input type="number" inputMode={step === "1" ? "numeric" : "decimal"} min="0" step={step} value={value} onFocus={(e) => e.target.select()} onChange={(e) => onChange(e.target.value === "" ? "" : number(e.target.value))} />{suffix && <span>{suffix}</span>}</div></div>;
}

function Dashboard({ products, dailyHours, onOpenProduct, onNavigate }) {
  const skuProducts = useMemo(() => products.filter(isSkuProduct), [products]);
  const data = useMemo(() => skuProducts.map((p) => ({ product: p, ...getMetrics(p, dailyHours) })), [skuProducts, dailyHours]);
  const active = data.filter((d) => !["ready", "paused"].includes(d.product.status));
  const seriesCount = new Set(products.map(productSeries).filter((series) => series !== "未分类")).size;
  const totalBudget = active.reduce((sum, d) => sum + d.totalCost, 0);
  const projectedProfit = data.reduce((sum, d) => sum + d.profit, 0);
  const late = active.filter((d) => d.risk === "late");
  const pendingSchedule = active.filter((d) => d.risk === "pending");
  const completed = data.filter((d) => d.product.status === "ready").length;
  const best = [...data].filter((d) => d.profit > 0).sort((a, b) => b.profit - a.profit)[0];
  const next = [...active].sort((a, b) => {
    const riskScore = { pending: 4, late: 3, tight: 2, safe: 1 };
    return (riskScore[b.risk] - riskScore[a.risk]) || (b.product.priority - a.product.priority) || (a.daysLeft - b.daysLeft);
  })[0];
  return <section className="view">
    <div className="view-title-row">
      <div className="title-block"><div className="issue-line"><span>VOL. 01</span><i /><em>PRODUCT DESK</em></div><span className="section-kicker">OVERVIEW / 编辑台总览</span><h1>把想法，变成<br /><u>能卖的产品。</u></h1><p>先看整体是否可做，再决定今天画什么。</p></div>
      <div className="title-actions"><div className="margin-note"><span>EDITOR'S NOTE</span><p>先完成最可能变成实物的那个。</p></div><button className="primary-btn desktop-cta" onClick={() => onOpenProduct(null)}><Icon name="plus" />添加产品</button></div>
    </div>
    <div className="stats-grid">
      <StatCard eyebrow="进行中产品" value={`${active.length} 个`} note={seriesCount ? `分属 ${seriesCount} 个系列 · ${completed} 个已完成` : `尚未建立系列 · ${completed} 个已完成`} tone="paper"><span className="stat-mark">01</span></StatCard>
      <StatCard eyebrow="预计首批投入" value={money(totalBudget)} note="包含固定成本与首批制作" tone="sand"><span className="stat-mark">02</span></StatCard>
      <StatCard eyebrow="全产品预计利润" value={money(projectedProfit)} note="按计划数量全部售出计算" tone="sage"><span className="stat-mark">03</span></StatCard>
      <StatCard eyebrow="时间风险" value={late.length ? `${late.length} 个需调整` : pendingSchedule.length ? `${pendingSchedule.length} 个待补排期` : "排期正常"} note={late.length ? "剩余时间少于制作所需时间" : pendingSchedule.length ? "先填写绘制时间和生产等待" : "当前项目均有时间余量"} tone={late.length ? "coral" : "blue"}><span className="stat-mark">04</span></StatCard>
    </div>
    <div className="dashboard-grid">
      <article className="panel focus-panel">
        <div className="panel-head"><div><span className="section-kicker">TODAY'S FOCUS</span><h2>今天先做这件事</h2></div><Icon name="spark" size={23} /></div>
        {next ? <>
          <button className="focus-product" onClick={() => onOpenProduct(next.product)}>
            <div className="focus-index">{String(products.indexOf(next.product) + 1).padStart(2, "0")}</div>
            <div className="focus-copy"><span>{productSeries(next.product)} / {next.product.category} · 优先级 {next.product.priority}</span><h3>{next.product.name}</h3><p>{next.product.notes || "继续推进柄图与打样。"}</p></div>
            <Icon name="arrow" />
          </button>
          <div className="focus-foot"><RiskBadge risk={next.risk} buffer={next.buffer} daysLeft={next.daysLeft} /><span>剩余图稿 {Math.max(0, next.product.artNeeded - next.product.artDone)} 个</span><span>剩余绘制 {next.remainingHours} 小时</span></div>
        </> : <div className="empty-small"><p>所有产品都已完成或暂缓。</p><button onClick={() => onOpenProduct(null)}>添加下一个想法</button></div>}
      </article>
      <article className="panel insight-panel">
        <div className="panel-head"><div><span className="section-kicker">PRODUCT SIGNAL</span><h2>商品信号</h2></div></div>
        {best ? <div className="signal-body">
          <div className="signal-label">预计利润最高</div>
          <h3>{best.product.name}</h3>
          <div className="signal-profit">{money(best.profit)}<span> / 首批</span></div>
          <div className="margin-track"><i style={{ width: `${Math.max(0, Math.min(100, best.margin * 100))}%` }} /></div>
          <p>单件贡献毛利 {money(best.contribution)}，售出 {best.breakEvenUnits || 0} 件可收回首批全部现金投入。</p>
        </div> : <div className="empty-small"><p>填写售价和成本后，这里会给出判断。</p></div>}
      </article>
    </div>
    <article className="panel snapshot-panel">
      <div className="panel-head"><div><span className="section-kicker">PIPELINE</span><h2>开发进度</h2></div><button className="link-btn" onClick={() => onNavigate("products")}>查看全部 <Icon name="arrow" size={15} /></button></div>
      <div className="pipeline">
        {Object.entries(STATUS).filter(([key]) => key !== "paused").map(([key, item]) => {
          const count = skuProducts.filter((p) => p.status === key).length;
          return <div className="pipeline-item" key={key}><span style={{ "--status": item.color }} /><b>{count}</b><small>{item.label}</small></div>;
        })}
      </div>
    </article>
  </section>;
}

function DevelopmentTabs({ current, onNavigate }) {
  return <div className="development-tabs"><button className={current === "skus" ? "active" : ""} onClick={() => onNavigate("skus")}>全部 SKU</button><button className={current === "products" ? "active" : ""} onClick={() => onNavigate("products")}>开发池</button><button className={current === "restock" ? "active" : ""} onClick={() => onNavigate("restock")}>补货池</button><button className={current === "planner" ? "active" : ""} onClick={() => onNavigate("planner")}>时间规划</button></div>;
}

function SeriesBoard({ products, seriesNames, reservations, onOpenProduct, onMoveSeries }) {
  const [draggedId, setDraggedId] = useState("");
  const [dropTarget, setDropTarget] = useState("");
  const [newSeries, setNewSeries] = useState("");
  const [temporarySeries, setTemporarySeries] = useState([]);
  const columns = [...new Set([...seriesNames.filter((name) => name !== "未分类"), ...temporarySeries, "未分类"])];
  const createSeries = (event) => {
    event.preventDefault();
    const name = newSeries.trim();
    if (!name || name === "未分类") return;
    if (!columns.includes(name)) setTemporarySeries((list) => [...list, name]);
    setNewSeries("");
  };
  const dropProduct = (event, series) => {
    event.preventDefault();
    const productId = event.dataTransfer.getData("text/plain") || draggedId;
    if (productId) onMoveSeries(productId, series);
    setDraggedId("");
    setDropTarget("");
  };
  return <div className="series-board-wrap">
    <div className="series-board-tools">
      <div><b>拖动产品卡片进行分类</b><span>移动后自动保存；手机上可使用卡片内的系列下拉框。</span></div>
      <form onSubmit={createSeries}><input value={newSeries} onChange={(event) => setNewSeries(event.target.value)} placeholder="新系列名称" aria-label="新系列名称" /><button type="submit">＋ 新建系列</button></form>
    </div>
    <div className="series-board">
      {columns.map((series) => {
        const items = products.filter((product) => productSeries(product) === series);
        return <section className={`series-column ${dropTarget === series ? "drop-ready" : ""}`} key={series} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropTarget(series); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDropTarget(""); }} onDrop={(event) => dropProduct(event, series)}>
          <header><div><span>SERIES</span><h2>{series}</h2></div><b>{items.filter(isSkuProduct).length} SKU</b></header>
          <div className="series-column-list">
            {items.map((product) => {
              const inventory = getInventoryState(product, reservations);
              return <article className={`sku-drag-card status-${product.status} ${draggedId === product.id ? "dragging" : ""}`} draggable key={product.id} onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", product.id); setDraggedId(product.id); }} onDragEnd={() => { setDraggedId(""); setDropTarget(""); }}>
              <div className="sku-drag-head"><span className="drag-handle" aria-hidden="true">⋮⋮</span><button type="button" onClick={() => onOpenProduct(product)}>{product.name}</button></div>
              <CatalogBadge product={product} /><p>{product.category} · {isSkuProduct(product) ? `可用 ${inventory.available} 件${inventory.reserved > 0 ? ` · 集市占用 ${inventory.reserved}` : ""}` : "不计入商品统计"}</p>
              <div className="sku-drag-foot"><span className={product.status === "ready" ? "complete-status" : ""} style={{ "--status": STATUS[product.status].color }}>{product.status === "ready" && "✓ "}{STATUS[product.status].label}</span><label>移动到<select value={productSeries(product)} onChange={(event) => onMoveSeries(product.id, event.target.value)}>{columns.map((name) => <option value={name} key={name}>{name}</option>)}</select></label></div>
            </article>})}
            {!items.length && <div className="series-drop-empty">拖动 SKU 到这里</div>}
          </div>
        </section>;
      })}
    </div>
  </div>;
}

function ProductList({ products, markets, dailyHours, onOpenProduct, onDuplicate, onDelete, onMoveSeries, onNavigate }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("priority");
  const [series, setSeries] = useState("all");
  const [catalogFilter, setCatalogFilter] = useState("all");
  const [mode, setMode] = useState("list");
  const developmentProducts = useMemo(() => products.filter((product) => product.status !== "ready"), [products]);
  const skuProducts = useMemo(() => developmentProducts.filter(isSkuProduct), [developmentProducts]);
  const reservations = useMemo(() => getReservedInventory(markets), [markets]);
  const stageCounts = useMemo(() => Object.fromEntries(Object.keys(CATALOG_STAGE).map((key) => [key, developmentProducts.filter((product) => productCatalogStage(product) === key).length])), [developmentProducts]);
  const seriesStats = useMemo(() => {
    const grouped = skuProducts.reduce((result, product) => {
      const name = productSeries(product);
      if (!result[name]) result[name] = [];
      result[name].push(product);
      return result;
    }, {});
    return Object.entries(grouped).map(([name, items]) => ({
      name,
      skuCount: items.length,
      available: items.reduce((sum, product) => sum + getInventoryState(product, reservations).available, 0),
      reserved: items.reduce((sum, product) => sum + getInventoryState(product, reservations).reserved, 0),
      profit: items.reduce((sum, product) => sum + getMetrics(product, dailyHours).profit, 0),
    })).sort((a, b) => a.name === "未分类" ? 1 : b.name === "未分类" ? -1 : a.name.localeCompare(b.name, "zh-CN"));
  }, [skuProducts, reservations, dailyHours]);
  const baseFiltered = useMemo(() => {
    const list = developmentProducts.filter((p) => {
      const m = getMetrics(p, dailyHours);
      const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase()) || p.category.includes(query) || productSeries(p).toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || p.status === status;
      const matchesCatalog = catalogFilter === "all" || productCatalogStage(p) === catalogFilter;
      const matchesSpecial = filter === "all" || (filter === "self" && p.selfMade) || (filter === "factory" && !p.selfMade) || (filter === "risk" && ["late", "tight"].includes(m.risk)) || (filter === "profitable" && m.profit > 0);
      return matchesQuery && matchesStatus && matchesCatalog && matchesSpecial;
    });
    return list.sort((a, b) => {
      if (sort === "priority") return b.priority - a.priority;
      if (sort === "deadline") return a.deadline.localeCompare(b.deadline);
      if (sort === "profit") return getMetrics(b, dailyHours).profit - getMetrics(a, dailyHours).profit;
      if (sort === "progress") return getMetrics(b, dailyHours).progress - getMetrics(a, dailyHours).progress;
      return 0;
    });
  }, [developmentProducts, query, status, catalogFilter, filter, sort, dailyHours]);
  const filtered = useMemo(() => series === "all" ? baseFiltered : baseFiltered.filter((product) => productSeries(product) === series), [baseFiltered, series]);
  const shownCount = mode === "board" ? baseFiltered.length : filtered.length;
  return <section className="view">
    <div className="view-title-row compact"><div className="title-block"><div className="issue-line"><span>IN DEVELOPMENT</span><i /><em>{String(skuProducts.length).padStart(2, "0")} SKU</em></div><span className="section-kicker">PRODUCT DEVELOPMENT / 产品档案</span><h1>产品开发池</h1><p>当前显示 {shownCount} 条记录 · 标记为“已完成生产”后自动移入补货池</p></div><button className="primary-btn desktop-cta" onClick={() => onOpenProduct(null)}><Icon name="plus" />添加产品</button></div>
    <div className="product-view-row"><DevelopmentTabs current="products" onNavigate={onNavigate} /><div className="product-view-switch" aria-label="产品池查看方式"><button className={mode === "list" ? "active" : ""} onClick={() => setMode("list")}>列表</button><button className={mode === "board" ? "active" : ""} onClick={() => { setMode("board"); setSeries("all"); }}>拖动分类</button></div></div>
    <div className="catalog-stage-tabs" aria-label="按产品阶段筛选">
      <button className={catalogFilter === "all" ? "active" : ""} onClick={() => { setCatalogFilter("all"); setSeries("all"); }}><span>全部记录</span><b>{developmentProducts.length}</b></button>
      {Object.entries(CATALOG_STAGE).map(([key, value]) => <button className={catalogFilter === key ? `active stage-${key}` : `stage-${key}`} onClick={() => { setCatalogFilter(key); setSeries("all"); }} key={key}><span>{value.label}</span><b>{stageCounts[key]}</b></button>)}
    </div>
    {mode === "list" && <div className="series-overview" aria-label="按系列查看 SKU">
      <button className={`series-card series-card-all ${series === "all" ? "active" : ""}`} onClick={() => setSeries("all")} aria-pressed={series === "all"}>
        <span>全部系列</span><b>{skuProducts.length}<small> SKU</small></b><em>{seriesStats.filter((item) => item.name !== "未分类").length} 个系列</em>
      </button>
      {seriesStats.map((item) => <button className={`series-card ${series === item.name ? "active" : ""}`} key={item.name} onClick={() => setSeries(item.name)} aria-pressed={series === item.name}>
        <span>{item.name}</span><b>{item.skuCount}<small> SKU</small></b><em>可用 {item.available} 件{item.reserved > 0 ? ` · 集市占用 ${item.reserved}` : ""} · 预计利润 {money(item.profit)}</em>
      </button>)}
    </div>}
    <div className="filter-bar">
      <div className="search-box"><Icon name="search" size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索产品、系列或品类" /></div>
      <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">全部状态</option>{Object.entries(STATUS).filter(([key]) => key !== "ready").map(([key, val]) => <option value={key} key={key}>{val.label}</option>)}</select>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">全部制作方式</option><option value="self">可独立制作</option><option value="factory">厂家生产</option><option value="risk">只看时间风险</option><option value="profitable">只看预计盈利</option></select>
      <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="priority">按优先级</option><option value="deadline">按截止时间</option><option value="profit">按预计利润</option><option value="progress">按完成进度</option></select>
    </div>
    {mode === "list" ? <><div className="product-table">
      <div className="product-table-head"><span>产品 / 进度</span><span>可用库存</span><span>投入成本</span><span>售价 / 毛利率</span><span>现金回本</span><span>排期</span><span /></div>
      {filtered.map((p) => <ProductRow key={p.id} product={p} dailyHours={dailyHours} reservations={reservations} onEdit={onOpenProduct} onDuplicate={onDuplicate} onDelete={onDelete} />)}
      {!filtered.length && <div className="empty-list"><span>没有找到符合条件的产品</span><button onClick={() => { setQuery(""); setStatus("all"); setSeries("all"); setCatalogFilter("all"); setFilter("all"); }}>清除筛选</button></div>}
    </div>
    <div className="mobile-product-list">{filtered.map((p) => <ProductCard key={p.id} product={p} dailyHours={dailyHours} reservations={reservations} onEdit={onOpenProduct} />)}</div></> : <SeriesBoard products={baseFiltered} seriesNames={seriesStats.map((item) => item.name)} reservations={reservations} onOpenProduct={onOpenProduct} onMoveSeries={onMoveSeries} />}
  </section>;
}

function AllSkuCatalog({ products, markets, onOpenProduct, onNavigate }) {
  const [query, setQuery] = useState("");
  const [pool, setPool] = useState("all");
  const [series, setSeries] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("series");
  const reservations = useMemo(() => getReservedInventory(markets), [markets]);
  const skuProducts = useMemo(() => products.filter(isSkuProduct), [products]);
  const seriesOptions = useMemo(() => [...new Set(skuProducts.map(productSeries))].sort((a, b) => a.localeCompare(b, "zh-CN")), [skuProducts]);
  const filtered = useMemo(() => skuProducts.filter((product) => {
    const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase()) || productSeries(product).toLowerCase().includes(query.toLowerCase()) || product.category.includes(query);
    const matchesPool = pool === "all" || (pool === "restock" && product.status === "ready") || (pool === "development" && product.status !== "ready");
    return matchesQuery && matchesPool && (series === "all" || productSeries(product) === series) && (status === "all" || product.status === status);
  }).sort((a, b) => {
    if (sort === "stock") return getInventoryState(a, reservations).available - getInventoryState(b, reservations).available;
    if (sort === "status") return STATUS[a.status].label.localeCompare(STATUS[b.status].label, "zh-CN");
    return productSeries(a).localeCompare(productSeries(b), "zh-CN") || a.name.localeCompare(b.name, "zh-CN");
  }), [skuProducts, query, pool, series, status, sort, reservations]);
  const matureCount = skuProducts.filter((product) => product.status === "ready").length;
  const availableTotal = skuProducts.reduce((sum, product) => sum + getInventoryState(product, reservations).available, 0);
  const reservedTotal = skuProducts.reduce((sum, product) => sum + getInventoryState(product, reservations).reserved, 0);
  return <section className="view sku-index-view">
    <div className="view-title-row compact"><div className="title-block"><div className="issue-line"><span>MASTER INDEX</span><i /><em>{String(skuProducts.length).padStart(2, "0")} SKU</em></div><span className="section-kicker">ALL PRODUCTS / 总商品目录</span><h1>全部 SKU</h1><p>开发中与已完成生产的商品都保留在这里；每个 SKU 仍然只有一条数据。</p></div></div>
    <DevelopmentTabs current="skus" onNavigate={onNavigate} />
    <div className="sku-index-summary">
      <article><small>全部商品</small><strong>{skuProducts.length}</strong><span>不含“不算 SKU”的创作记录</span></article>
      <article><small>开发池</small><strong>{skuProducts.length - matureCount}</strong><span>想法、绘制、打样与生产中</span></article>
      <article><small>补货池</small><strong>{matureCount}</strong><span>已经完成生产的成熟商品</span></article>
      <article><small>可用 / 占用</small><strong>{availableTotal}<em> / {reservedTotal} 件</em></strong><span>占用来自计划中的集市</span></article>
    </div>
    <div className="sku-index-toolbar">
      <div className="search-box"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索 SKU、系列或品类" /></div>
      <select value={pool} onChange={(event) => setPool(event.target.value)}><option value="all">全部池</option><option value="development">开发池</option><option value="restock">补货池</option></select>
      <select value={series} onChange={(event) => setSeries(event.target.value)}><option value="all">全部系列</option>{seriesOptions.map((item) => <option value={item} key={item}>{item}</option>)}</select>
      <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">全部状态</option>{Object.entries(STATUS).map(([key, item]) => <option value={key} key={key}>{item.label}</option>)}</select>
      <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="series">按系列</option><option value="status">按状态</option><option value="stock">按可用库存</option></select>
    </div>
    <div className="sku-master-table">
      <div className="sku-master-head"><span>SKU</span><span>所在池 / 状态</span><span>系列 / 品类</span><span>可用库存</span><span>单件成本</span><span>售价</span><span /></div>
      {filtered.map((product) => {
        const inventory = getInventoryState(product, reservations);
        const isMature = product.status === "ready";
        return <article className={`sku-master-row ${isMature ? "mature" : "development"}`} key={product.id}>
          <div className="sku-master-name"><small>{String(skuProducts.indexOf(product) + 1).padStart(3, "0")}</small><button onClick={() => onOpenProduct(product)}>{product.name}</button></div>
          <div className="sku-master-state"><b className={isMature ? "restock" : "development"}>{isMature ? "补货池" : "开发池"}</b><span style={{ "--status": STATUS[product.status].color }}>{isMature && "✓ "}{STATUS[product.status].label}</span></div>
          <div className="sku-master-series"><b>{productSeries(product)}</b><span>{product.category}</span></div>
          <div className={`sku-master-stock ${inventory.reserved > 0 ? "reserved" : ""}`}><b>{inventory.available} 件</b><span>总数 {inventory.total}{inventory.reserved > 0 ? ` · 占用 ${inventory.reserved}` : ""}</span></div>
          <div className="sku-master-money"><small>成本</small><b>{money(product.unitCost)}</b></div>
          <div className="sku-master-money"><small>售价</small><b>{hasFinancialData(product) ? money(product.price) : "待补"}</b></div>
          <button className="sku-master-edit" onClick={() => onOpenProduct(product)}><Icon name="edit" size={14} /><span>编辑</span></button>
        </article>;
      })}
      {!filtered.length && <div className="restock-empty"><b>没有符合条件的 SKU</b><span>可以清除搜索词，或切换系列和状态筛选。</span></div>}
    </div>
  </section>;
}

function RestockPool({ products, markets, onOpenProduct, onNavigate }) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");
  const reservations = useMemo(() => getReservedInventory(markets), [markets]);
  const matureProducts = useMemo(() => products
    .filter((product) => product.status === "ready" && isSkuProduct(product))
    .map((product) => {
      const inventory = getInventoryState(product, reservations);
      const threshold = number(product.restockThreshold ?? 5);
      const target = Math.max(threshold, number(product.restockTarget ?? product.plannedQty));
      const suggestedQty = Math.max(0, target - inventory.available);
      return { product, inventory, threshold, target, suggestedQty, needsRestock: inventory.available <= threshold };
    })
    .sort((a, b) => Number(b.needsRestock) - Number(a.needsRestock) || a.inventory.available - b.inventory.available || a.product.name.localeCompare(b.product.name, "zh-CN")), [products, reservations]);
  const visible = matureProducts.filter((item) => {
    const matchesQuery = item.product.name.toLowerCase().includes(query.toLowerCase()) || productSeries(item.product).toLowerCase().includes(query.toLowerCase()) || item.product.category.includes(query);
    const matchesScope = scope === "all" || (scope === "needs" && item.needsRestock) || (scope === "healthy" && !item.needsRestock);
    return matchesQuery && matchesScope;
  });
  const needsCount = matureProducts.filter((item) => item.needsRestock).length;
  const availableTotal = matureProducts.reduce((sum, item) => sum + item.inventory.available, 0);
  const reservedTotal = matureProducts.reduce((sum, item) => sum + item.inventory.reserved, 0);
  const suggestedCost = matureProducts.reduce((sum, item) => sum + item.suggestedQty * number(item.product.unitCost), 0);
  return <section className="view restock-view">
    <div className="view-title-row compact"><div className="title-block"><div className="issue-line"><span>REORDER DESK</span><i /><em>{String(matureProducts.length).padStart(2, "0")} MATURE SKU</em></div><span className="section-kicker">RESTOCK POOL / 成熟商品管理</span><h1>补货池</h1><p>已完成设计与生产的商品集中在这里，按可用库存判断下一批补货。</p></div></div>
    <DevelopmentTabs current="restock" onNavigate={onNavigate} />
    <div className="restock-summary">
      <article><small>成熟商品</small><strong>{matureProducts.length}<em> SKU</em></strong><span>制作状态为“已完成生产”</span></article>
      <article className={needsCount > 0 ? "alert" : ""}><small>达到补货线</small><strong>{needsCount}<em> 个</em></strong><span>{needsCount ? "优先检查低库存商品" : "当前库存都在提醒线以上"}</span></article>
      <article><small>当前可用</small><strong>{availableTotal}<em> 件</em></strong><span>{reservedTotal > 0 ? `另有 ${reservedTotal} 件被集市占用` : "暂无集市占用"}</span></article>
      <article><small>建议补货成本</small><strong>{money(suggestedCost)}</strong><span>补到每个商品的目标库存</span></article>
    </div>
    <div className="restock-toolbar">
      <div className="search-box"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索成熟商品或系列" /></div>
      <div className="restock-segment"><button className={scope === "all" ? "active" : ""} onClick={() => setScope("all")}>全部 {matureProducts.length}</button><button className={scope === "needs" ? "active" : ""} onClick={() => setScope("needs")}>待补货 {needsCount}</button><button className={scope === "healthy" ? "active" : ""} onClick={() => setScope("healthy")}>库存正常 {matureProducts.length - needsCount}</button></div>
    </div>
    <div className="restock-grid">
      {visible.map((item) => {
        const stockProgress = item.target > 0 ? Math.min(100, (item.inventory.available / item.target) * 100) : 100;
        return <article className={`restock-card ${item.needsRestock ? "needs" : "healthy"}`} key={item.product.id}>
          <header><span>✓ 已完成生产</span><em>{item.needsRestock ? item.inventory.available === 0 ? "缺货" : "待补货" : "库存正常"}</em></header>
          <div className="restock-identity"><small>{productSeries(item.product)} / {item.product.category}</small><h2>{item.product.name}</h2></div>
          <div className="restock-level"><div><span>可用 {item.inventory.available} 件</span><b>目标 {item.target} 件</b></div><div><i style={{ width: `${stockProgress}%` }} /></div></div>
          <div className="restock-numbers"><span><small>总库存</small><b>{item.inventory.total} 件</b></span><span><small>集市占用</small><b>{item.inventory.reserved} 件</b></span><span><small>提醒线</small><b>{item.threshold} 件</b></span></div>
          <footer><div><small>建议补货</small><b>{item.suggestedQty} 件 · {money(item.suggestedQty * number(item.product.unitCost))}</b></div><button onClick={() => onOpenProduct(item.product)}>更新库存</button></footer>
        </article>;
      })}
      {!visible.length && <div className="restock-empty"><b>{matureProducts.length ? "没有符合筛选的成熟商品" : "补货池还是空的"}</b><span>{matureProducts.length ? "换一个筛选条件试试。" : "在产品编辑中把制作状态改成“已完成生产”，商品就会自动移到这里。"}</span></div>}
    </div>
  </section>;
}

function Planner({ products, dailyHours, setDailyHours, globalDeadline, setGlobalDeadline, onOpenProduct, onNavigate }) {
  const [horizon, setHorizon] = useState(7);
  const active = useMemo(() => products.filter(isSkuProduct).map((p) => ({ product: p, ...getMetrics(p, dailyHours) })).filter((d) => !["ready", "paused"].includes(d.product.status)).sort((a, b) => {
    const r = { pending: 4, late: 3, tight: 2, safe: 1 };
    return (r[b.risk] - r[a.risk]) || b.product.priority - a.product.priority || a.daysLeft - b.daysLeft;
  }), [products, dailyHours]);
  const capacity = dailyHours * horizon;
  let remainingCapacity = capacity;
  const allocations = active.map((item) => {
    const assigned = Math.min(item.remainingHours, remainingCapacity);
    remainingCapacity = Math.max(0, remainingCapacity - assigned);
    return { ...item, assigned };
  });
  const remainingWork = active.reduce((s, d) => s + d.remainingHours, 0);
  const globalDays = daysUntil(globalDeadline);
  const productionReserve = active.length ? Math.max(...active.map((d) => d.product.productionDays)) : 0;
  const drawingCapacity = Math.max(0, (globalDays - productionReserve) * dailyHours);
  return <section className="view">
    <div className="view-title-row compact"><div className="title-block"><div className="issue-line"><span>CALENDAR</span><i /><em>2H / DAY</em></div><span className="section-kicker">TIME PLAN / 制作日程</span><h1>时间规划</h1><p>按每天可投入时间自动判断风险，并把精力留给更值得做的产品。</p></div></div>
    <DevelopmentTabs current="planner" onNavigate={onNavigate} />
    <div className="planner-settings panel">
      <div className="setting-group"><label>每天可投入</label><div className="stepper"><button onClick={() => setDailyHours(Math.max(.5, dailyHours - .5))}>−</button><b>{dailyHours}</b><span>小时</span><button onClick={() => setDailyHours(Math.min(12, dailyHours + .5))}>＋</button></div></div>
      <div className="setting-group"><label>总目标日期</label><input type="date" value={globalDeadline} onChange={(e) => setGlobalDeadline(e.target.value)} /></div>
      <div className="setting-summary"><span>距目标还有</span><strong>{globalDays} 天</strong><small>扣除最长生产等待后，预计可画 {Math.round(drawingCapacity)} 小时</small></div>
    </div>
    <div className="planner-grid">
      <article className="panel schedule-panel">
        <div className="panel-head"><div><span className="section-kicker">AUTO PLAN</span><h2>优先工作清单</h2></div><div className="segment"><button className={horizon === 7 ? "active" : ""} onClick={() => setHorizon(7)}>本周</button><button className={horizon === 14 ? "active" : ""} onClick={() => setHorizon(14)}>两周</button></div></div>
        <div className="capacity-line"><span>可用 {capacity} 小时</span><div><i style={{ width: `${Math.min(100, (Math.min(capacity, remainingWork) / Math.max(1, capacity)) * 100)}%` }} /></div><b>{Math.min(capacity, remainingWork)} 小时已分配</b></div>
        <div className="allocation-list">
          {allocations.map((item, index) => <button className="allocation" key={item.product.id} onClick={() => onOpenProduct(item.product)}>
            <span className="allocation-order">{String(index + 1).padStart(2, "0")}</span>
            <div className="allocation-copy"><div><h3>{item.product.name}</h3><RiskBadge risk={item.risk} buffer={item.buffer} daysLeft={item.daysLeft} /></div><p>{item.assigned > 0 ? `安排 ${item.assigned} 小时 · 余 ${Math.max(0, item.remainingHours - item.assigned)} 小时待排` : `本阶段容量不足 · 尚需 ${item.remainingHours} 小时`}</p></div>
            <div className="allocation-bar"><i style={{ width: `${item.remainingHours ? (item.assigned / item.remainingHours) * 100 : 100}%` }} /></div>
          </button>)}
          {!allocations.length && <div className="empty-small"><p>当前没有需要排期的产品。</p></div>}
        </div>
      </article>
      <aside className="panel deadline-panel">
        <div className="panel-head"><div><span className="section-kicker">DEADLINES</span><h2>生产节点</h2></div></div>
        <div className="deadline-list">
          {[...active].sort((a, b) => a.product.deadline.localeCompare(b.product.deadline)).map((item) => <button key={item.product.id} onClick={() => onOpenProduct(item.product)}>
            <time><b>{new Date(`${item.product.deadline}T00:00:00`).getMonth() + 1}</b><span>{new Date(`${item.product.deadline}T00:00:00`).getDate()}</span></time>
            <div><h3>{item.product.name}</h3><p>制作 {item.remainingHours}h + 等待 {item.product.productionDays} 天</p></div>
            <span className={`deadline-dot ${item.risk}`} />
          </button>)}
        </div>
      </aside>
    </div>
  </section>;
}

function MarketBook({ markets, products, onOpenMarket, onDeleteMarket }) {
  const calculated = useMemo(() => markets.map((market) => ({ market, ...getMarketMetrics(market) })), [markets]);
  const totals = calculated.reduce((sum, item) => ({
    revenue: sum.revenue + item.revenue,
    cashInvestment: sum.cashInvestment + item.cashInvestment,
    cashResult: sum.cashResult + item.cashResult,
    operatingProfit: sum.operatingProfit + item.operatingProfit,
    sold: sum.sold + item.sold,
  }), { revenue: 0, cashInvestment: 0, cashResult: 0, operatingProfit: 0, sold: 0 });
  const maxRevenue = Math.max(1, ...calculated.map((item) => item.revenue));
  const best = [...calculated].sort((a, b) => b.operatingProfit - a.operatingProfit)[0];
  const inventoryValue = products.reduce((sum, product) => sum + number(product.stock) * number(product.unitCost), 0);
  return <section className="view market-view">
    <div className="view-title-row compact"><div className="title-block"><div className="issue-line"><span>LEDGER</span><i /><em>{String(markets.length).padStart(2, "0")} MARKETS</em></div><span className="section-kicker">MARKET BOOK / 集市账本</span><h1>每一场，都算清楚。</h1><p>同时查看现金是否回本，以及这场集市真正赚了多少。</p></div><button className="primary-btn desktop-cta" onClick={() => onOpenMarket(null)}><Icon name="plus" />新建集市</button></div>
    <div className="market-summary-grid">
      <StatCard eyebrow="累计销售额" value={money(totals.revenue)} note={`共售出 ${totals.sold} 件商品`} tone="paper"><span className="stat-mark">R</span></StatCard>
      <StatCard eyebrow="累计现金投入" value={money(totals.cashInvestment)} note="含本场新制库存与全部一次性费用" tone="sand"><span className="stat-mark">I</span></StatCard>
      <StatCard eyebrow="累计经营净利润" value={money(totals.operatingProfit)} note="扣除已售成本、赠品损耗与全部费用" tone={totals.operatingProfit >= 0 ? "sage" : "coral"}><span className="stat-mark">P</span></StatCard>
      <StatCard eyebrow="累计现金差额" value={money(totals.cashResult)} note={totals.cashResult >= 0 ? "现金投入已经收回" : "尚未收回的资金投入"} tone={totals.cashResult >= 0 ? "blue" : "coral"}><span className="stat-mark">C</span></StatCard>
    </div>
    <div className="market-layout">
      <article className="panel market-list-panel">
        <div className="panel-head"><div><span className="section-kicker">EVENT RECORDS</span><h2>集市记录</h2></div><button className="link-btn mobile-market-add" onClick={() => onOpenMarket(null)}><Icon name="plus" size={14} />新建</button></div>
        {calculated.length ? <div className="market-list">
          {calculated.sort((a, b) => b.market.startDate.localeCompare(a.market.startDate)).map((item, index) => <div className="market-record" key={item.market.id}>
            <button className="market-record-main" onClick={() => onOpenMarket(item.market)}>
              <span className="market-no">{String(index + 1).padStart(2, "0")}</span>
              <div className="market-identity"><span>{item.market.city || "未填写城市"} · {item.market.startDate}</span><h3>{item.market.name}</h3><div className="market-revenue-bar"><i style={{ width: `${(item.revenue / maxRevenue) * 100}%` }} /></div></div>
              <div className="market-metric"><small>销售额</small><b>{money(item.revenue)}</b></div>
              <div className="market-metric"><small>经营利润</small><b className={item.operatingProfit < 0 ? "negative" : "positive"}>{money(item.operatingProfit)}</b></div>
              <div className="market-metric"><small>现金差额</small><b className={item.cashResult < 0 ? "negative" : "positive"}>{money(item.cashResult)}</b></div>
              <span className={`market-status ${item.market.status}`}>{item.market.status === "closed" ? "已结算" : "计划中"}</span>
            </button>
            <button className="market-delete" onClick={() => onDeleteMarket(item.market)} aria-label={`删除${item.market.name}`}><Icon name="trash" size={15} /></button>
          </div>)}
        </div> : <div className="market-empty"><div className="empty-ticket"><span>NO. 001</span><b>第一场集市<br />从这里开始记录</b><small>费用、销量、利润和库存会自动关联。</small></div><button className="primary-btn" onClick={() => onOpenMarket(null)}><Icon name="plus" />新建集市账本</button></div>}
      </article>
      <aside className="panel market-insight-panel">
        <div className="panel-head"><div><span className="section-kicker">TOTAL SIGNAL</span><h2>经营信号</h2></div></div>
        <div className="ledger-signal"><span>当前库存成本</span><strong>{money(inventoryValue)}</strong><p>按产品池中的现有库存 × 单件成本估算。</p></div>
        <div className="ledger-rule" />
        {best ? <div className="ledger-best"><span>利润最高的一场</span><h3>{best.market.name}</h3><b>{money(best.operatingProfit)}</b><p>利润率 {Math.round(best.margin * 100)}% · 售罄率 {Math.round(best.sellThrough * 100)}%</p></div> : <div className="ledger-best"><span>等待第一份记录</span><p>完成一次集市结算后，这里会比较每场表现。</p></div>}
      </aside>
    </div>
  </section>;
}

function MarketEditor({ market, markets, products, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(market || EMPTY_MARKET)));
  const isNew = !market?.id;
  const metrics = getMarketMetrics(draft);
  const otherReservations = useMemo(() => getReservedInventory(markets, market?.id), [markets, market?.id]);
  const update = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));
  const updateSale = (id, key, value) => setDraft((prev) => ({ ...prev, sales: prev.sales.map((row) => row.id === id ? { ...row, [key]: value } : row) }));
  const updateExpense = (id, key, value) => setDraft((prev) => ({ ...prev, expenses: prev.expenses.map((row) => row.id === id ? { ...row, [key]: value } : row) }));
  const addProduct = (productId) => {
    const product = products.find((item) => item.id === productId);
    if (!product || draft.sales.some((row) => row.productId === product.id)) return;
    const available = getInventoryState(product, otherReservations).available;
    setDraft((prev) => ({ ...prev, sales: [...prev.sales, { id: `sale-${Date.now()}`, productId: product.id, productName: product.name, productSeries: productSeries(product), broughtQty: available, newQty: 0, soldQty: 0, giftQty: 0, eventPrice: product.price, revenueOverride: "", unitCost: product.unitCost }] }));
  };
  const addExpense = () => setDraft((prev) => ({ ...prev, expenses: [...prev.expenses, { id: `expense-${Date.now()}`, category: "其他", label: "", amount: 0, kind: "direct", useCount: 1 }] }));
  const submit = (event) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    onSave({ ...draft, id: draft.id || `market-${Date.now()}`, name: draft.name.trim(), expenses: draft.expenses.map((expense) => ({ ...expense, kind: "direct", useCount: 1, category: expense.category === "共用展陈" ? "展陈物料" : expense.category })) });
  };
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="editor market-editor" role="dialog" aria-modal="true" aria-label={isNew ? "新建集市" : "编辑集市"}>
      <header className="editor-head"><div><span className="section-kicker">MARKET SETTLEMENT</span><h2>{isNew ? "新建一场集市" : "集市结算单"}</h2></div><button className="icon-btn" onClick={onClose} aria-label="关闭"><Icon name="close" /></button></header>
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label>集市名称</label><input autoFocus value={draft.name} onChange={(e) => update("name", e.target.value)} placeholder="例如：上海秋季手帐集市" required /></div>
          <div className="field"><label>城市</label><input value={draft.city} onChange={(e) => update("city", e.target.value)} placeholder="上海" /></div>
          <div className="field"><label>开始日期</label><input type="date" value={draft.startDate} onChange={(e) => update("startDate", e.target.value)} /></div>
          <div className="field"><label>结束日期</label><input type="date" value={draft.endDate} onChange={(e) => update("endDate", e.target.value)} /></div>
          <div className="field"><label>结算状态</label><select value={draft.status} onChange={(e) => update("status", e.target.value)}><option value="planning">计划中</option><option value="closed">已结算</option></select></div>
          <NumberField label="订单数" value={draft.orders} onChange={(value) => update("orders", value)} suffix="单" />
        </div>

        <div className="form-section-title market-section-title"><span>01 / 产品销售</span><i /><select value="" onChange={(e) => { addProduct(e.target.value); e.target.value = ""; }}><option value="">＋ 从产品池添加</option>{products.filter((product) => isSkuProduct(product) && !draft.sales.some((row) => row.productId === product.id)).map((product) => <option value={product.id} key={product.id}>【{productSeries(product)}】{product.name} · 可用 {getInventoryState(product, otherReservations).available} 件</option>)}</select></div>
        <div className="sale-entry-list">
          {draft.sales.map((row) => {
            const product = products.find((item) => item.id === row.productId);
            const availableBeforeMarket = getInventoryState(product, otherReservations).available;
            const reservedFromStock = Math.max(0, number(row.broughtQty) - number(row.newQty));
            const remainingAfterSave = availableBeforeMarket - reservedFromStock;
            return <div className="sale-entry" key={row.id}>
            <div className="sale-entry-head"><b>{row.productSeries && <small>{row.productSeries}</small>}{row.productName}</b><button type="button" onClick={() => update("sales", draft.sales.filter((item) => item.id !== row.id))}><Icon name="close" size={14} /></button></div>
            <div className="sale-entry-grid">
              <MiniNumber label="带去" value={row.broughtQty} onChange={(v) => updateSale(row.id, "broughtQty", v)} />
              <MiniNumber label="本场新制" value={row.newQty} onChange={(v) => updateSale(row.id, "newQty", v)} />
              <MiniNumber label="售出" value={row.soldQty} onChange={(v) => updateSale(row.id, "soldQty", v)} />
              <MiniNumber label="赠品/损耗" value={row.giftQty} onChange={(v) => updateSale(row.id, "giftQty", v)} />
              <MiniNumber label="单件成本" value={row.unitCost} onChange={(v) => updateSale(row.id, "unitCost", v)} prefix="¥" step="0.01" />
              <MiniNumber label="本场售价" value={row.eventPrice} onChange={(v) => updateSale(row.id, "eventPrice", v)} prefix="¥" step="0.01" />
              <div className="mini-number revenue-override"><label>实际销售额 <em>可选</em></label><div><span>¥</span><input type="number" inputMode="decimal" min="0" step="0.01" value={row.revenueOverride} placeholder={String(number(row.soldQty) * number(row.eventPrice))} onFocus={(e) => e.target.select()} onChange={(e) => updateSale(row.id, "revenueOverride", e.target.value === "" ? "" : number(e.target.value))} /></div></div>
            </div>
            {draft.status === "planning" ? <p className={`sale-stock-note ${remainingAfterSave < 0 ? "shortage" : ""}`}>产品池当前可用 {availableBeforeMarket} 件 · 保存后{remainingAfterSave < 0 ? `超出库存 ${Math.abs(remainingAfterSave)} 件` : `剩余 ${remainingAfterSave} 件`}{number(row.newQty) > 0 && `（本场新制 ${number(row.newQty)} 件不占用原库存）`}</p> : <p className="sale-stock-note">结算后将按本场新制、售出及赠品/损耗自动更新库存。</p>}
          </div>})}
          {!draft.sales.length && <div className="editor-empty-row">从产品池添加本场带去的商品，再填写售出数量。</div>}
        </div>

        <div className="form-section-title market-section-title"><span>02 / 本场费用</span><i /><button type="button" onClick={addExpense}>＋ 添加费用</button></div>
        <div className="expense-entry-list">
          {draft.expenses.map((expense) => <div className="expense-entry" key={expense.id}>
            <select value={expense.category} onChange={(e) => updateExpense(expense.id, "category", e.target.value)}>{EXPENSE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select>
            <input value={expense.label} onChange={(e) => updateExpense(expense.id, "label", e.target.value)} placeholder="费用说明" />
            <div className="expense-amount"><span>¥</span><input type="number" inputMode="decimal" min="0" step="0.01" value={expense.amount} onFocus={(e) => e.target.select()} onChange={(e) => updateExpense(expense.id, "amount", e.target.value === "" ? "" : number(e.target.value))} /></div>
            <button type="button" className="expense-remove" onClick={() => update("expenses", draft.expenses.filter((item) => item.id !== expense.id))}><Icon name="trash" size={14} /></button>
          </div>)}
        </div>

        <div className="market-live-summary">
          <div><small>销售额</small><b>{money(metrics.revenue)}</b></div>
          <div><small>现金投入</small><b>{money(metrics.cashInvestment)}</b><em>新制库存＋全部一次性费用</em></div>
          <div className={metrics.cashResult < 0 ? "negative" : "positive"}><small>现金差额</small><b>{money(metrics.cashResult)}</b><em>{metrics.cashResult >= 0 ? "现金已回本" : "尚未回收"}</em></div>
          <div className={metrics.operatingProfit < 0 ? "negative" : "positive"}><small>经营净利润</small><b>{money(metrics.operatingProfit)}</b><em>利润率 {Math.round(metrics.margin * 100)}%</em></div>
          <div><small>赠品 / 损耗成本</small><b>{money(metrics.giftLossCost)}</b><em>{metrics.gifts} 件，不计入销售收入</em></div>
          <div><small>售罄率 / 客单</small><b>{Math.round(metrics.sellThrough * 100)}% · {money(metrics.averageOrder)}</b><em>售出 {metrics.sold} / 带去 {metrics.brought}</em></div>
        </div>

        <label className="inventory-sync"><input type="checkbox" checked={draft.syncInventory} onChange={(e) => update("syncInventory", e.target.checked)} /><span><b>结算后自动同步产品库存</b><small>计划中只占用“带去－本场新制”的数量；标记为已结算后，再按新制、售出和赠品/损耗更新真实库存。</small></span></label>
        <div className="field wide"><label>复盘备注</label><textarea rows="3" value={draft.notes} onChange={(e) => update("notes", e.target.value)} placeholder="记录人流、顾客反馈、畅销品和下次需要调整的地方" /></div>
        <footer className="editor-actions">{!isNew && <button type="button" className="text-danger" onClick={() => onDelete(market)}>删除集市</button>}<div><button type="button" className="secondary-btn" onClick={onClose}>取消</button><button type="submit" className="primary-btn">保存结算单</button></div></footer>
      </form>
    </section>
  </div>;
}

function MiniNumber({ label, value, onChange, prefix, step = "1" }) {
  return <div className="mini-number"><label>{label}</label><div>{prefix && <span>{prefix}</span>}<input type="number" inputMode={step === "1" ? "numeric" : "decimal"} min="0" step={step} value={value} onFocus={(e) => e.target.select()} onChange={(e) => onChange(e.target.value === "" ? "" : number(e.target.value))} /></div></div>;
}

function DataMenu({ products, markets, settings, onImport, onReset }) {
  const [open, setOpen] = useState(false);
  const input = useRef(null);
  const download = (format) => {
    let content, type, filename;
    if (format === "json") {
      content = JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), settings, products, markets }, null, 2);
      type = "application/json";
      filename = `文创产品工作台备份-${new Date().toISOString().slice(0, 10)}.json`;
    } else if (format === "products") {
      const header = ["产品", "系列", "品类", "产品阶段", "本轮定位", "制作状态", "优先级", "所需柄图", "已完成柄图", "图稿方案", "绘制小时", "已投入小时", "生产等待天", "单件成本", "固定成本", "售价", "首批数量", "现有库存", "补货提醒线", "补货目标库存", "制作方式", "截止日期", "预计利润", "现金回本件数", "备注"];
      const rows = products.map((p) => { const m = getMetrics(p, settings.dailyHours); return [p.name, productSeries(p), p.category, CATALOG_STAGE[productCatalogStage(p)].label, LAUNCH_PRIORITY[p.launchPriority] || "", STATUS[p.status].label, p.priority, p.artNeeded, p.artDone, p.artPlan || "", p.designHours, p.hoursDone, p.productionDays, p.unitCost, p.fixedCost, p.price, p.plannedQty, p.stock, p.restockThreshold ?? 5, p.restockTarget ?? p.plannedQty, p.selfMade ? "独立制作" : "厂家生产", p.deadline, isSkuProduct(p) ? m.profit : "不计入", isSkuProduct(p) ? m.breakEvenUnits ?? "无法回本" : "不计入", p.notes]; });
      const escape = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
      content = "\uFEFF" + [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
      type = "text/csv;charset=utf-8";
      filename = `文创产品目录-${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      const header = ["集市", "城市", "开始日期", "结束日期", "状态", "销售额", "现金投入", "现金差额", "已售商品成本", "赠品损耗成本", "展陈物料", "经营净利润", "利润率", "带去件数", "售出件数", "赠品损耗件数", "售罄率", "订单数", "客单价", "备注"];
      const rows = markets.map((market) => { const m = getMarketMetrics(market); return [market.name, market.city, market.startDate, market.endDate, market.status === "closed" ? "已结算" : "计划中", m.revenue, m.cashInvestment, m.cashResult, m.cogs, m.giftLossCost, m.displayCosts, m.operatingProfit, m.margin, m.brought, m.sold, m.gifts, m.sellThrough, market.orders, m.averageOrder, market.notes]; });
      const escape = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
      content = "\uFEFF" + [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
      type = "text/csv;charset=utf-8";
      filename = `集市收益总览-${new Date().toISOString().slice(0, 10)}.csv`;
    }
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); setOpen(false);
  };
  const importFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { const parsed = JSON.parse(await file.text()); onImport(parsed); } catch { alert("无法读取这个备份文件，请确认它是从本工作台导出的 JSON。"); }
    event.target.value = ""; setOpen(false);
  };
  return <div className="data-menu-wrap"><button className="ghost-icon" onClick={() => setOpen(!open)} aria-label="数据与备份"><Icon name="more" /></button>{open && <div className="data-menu">
    <div className="data-menu-title"><b>数据与备份</b><span>数据仅保存在当前浏览器</span></div>
    <button onClick={() => download("json")}><Icon name="download" />导出完整备份</button>
    <button onClick={() => download("products")}><Icon name="download" />导出产品目录 CSV</button>
    <button onClick={() => download("markets")}><Icon name="download" />导出集市收益 CSV</button>
    <button onClick={() => input.current?.click()}><Icon name="upload" />导入备份</button>
    <button className="danger" onClick={() => { onReset(); setOpen(false); }}><Icon name="trash" />恢复示例数据</button>
    <input ref={input} hidden type="file" accept="application/json,.json" onChange={importFile} />
  </div>}</div>;
}

function DesktopInstall({ onNotify }) {
  const [promptEvent, setPromptEvent] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const updateInstalled = () => setInstalled(window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true);
    const rememberPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    const completeInstall = () => {
      setInstalled(true);
      setPromptEvent(null);
      setHelpOpen(false);
    };
    const displayMode = window.matchMedia("(display-mode: standalone)");
    updateInstalled();
    window.addEventListener("beforeinstallprompt", rememberPrompt);
    window.addEventListener("appinstalled", completeInstall);
    displayMode.addEventListener?.("change", updateInstalled);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => {
      window.removeEventListener("beforeinstallprompt", rememberPrompt);
      window.removeEventListener("appinstalled", completeInstall);
      displayMode.removeEventListener?.("change", updateInstalled);
    };
  }, []);

  if (installed) return <span className="desktop-installed"><i />桌面版已安装</span>;
  const install = async () => {
    if (!promptEvent) {
      setHelpOpen((open) => !open);
      return;
    }
    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    if (choice.outcome === "accepted") onNotify("正在安装桌面版");
    else setHelpOpen(true);
  };
  return <div className="desktop-install-wrap">
    <button className="desktop-install-button" onClick={install}><Icon name="download" size={15} /><span>安装桌面版</span></button>
    {helpOpen && <div className="desktop-install-help" role="dialog" aria-label="桌面版安装方法">
      <button className="install-help-close" onClick={() => setHelpOpen(false)} aria-label="关闭"><Icon name="close" size={13} /></button>
      <b>把工作台装到电脑</b>
      <p><strong>Chrome / Edge</strong>：点击地址栏右侧的安装图标，或打开浏览器菜单选择“安装应用”。</p>
      <p><strong>Mac Safari</strong>：打开“文件”，选择“添加到程序坞”。</p>
      <small>安装后会独立窗口运行。建议先从右侧菜单导出一次完整备份。</small>
    </div>}
  </div>;
}

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [products, setProducts] = useState(SAMPLE_PRODUCTS);
  const [markets, setMarkets] = useState([]);
  const [view, setView] = useState("dashboard");
  const [editorProduct, setEditorProduct] = useState(undefined);
  const [editorMarket, setEditorMarket] = useState(undefined);
  const [dailyHours, setDailyHours] = useState(2);
  const [globalDeadline, setGlobalDeadline] = useState("2026-09-25");
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedMarkets = localStorage.getItem(MARKET_STORAGE_KEY);
      const settings = localStorage.getItem(SETTINGS_KEY);
      const startingProducts = saved ? JSON.parse(saved) : SAMPLE_PRODUCTS;
      if (localStorage.getItem(CATALOG_MIGRATION_KEY)) {
        setProducts(startingProducts.map(normalizeProduct));
      } else {
        const imported = mergeCatalogProducts(startingProducts);
        setProducts(imported.products);
        localStorage.setItem(CATALOG_MIGRATION_KEY, "done");
        setToast("产品清单已补录，并按阶段完成分类");
        window.setTimeout(() => setToast(""), 3200);
      }
      if (savedMarkets) setMarkets(JSON.parse(savedMarkets));
      if (settings) { const parsed = JSON.parse(settings); setDailyHours(parsed.dailyHours ?? 2); setGlobalDeadline(parsed.globalDeadline ?? "2026-09-25"); }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(products)); }, [products, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem(MARKET_STORAGE_KEY, JSON.stringify(markets)); }, [markets, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem(SETTINGS_KEY, JSON.stringify({ dailyHours, globalDeadline })); }, [dailyHours, globalDeadline, loaded]);

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(""), 2200); };
  const saveProduct = (product) => {
    setProducts((list) => list.some((p) => p.id === product.id) ? list.map((p) => p.id === product.id ? product : p) : [product, ...list]);
    setEditorProduct(undefined);
    if (product.status === "ready" && view === "products") { setView("restock"); notify("产品已保存并移入补货池"); }
    else if (product.status !== "ready" && view === "restock") { setView("products"); notify("产品已移回开发池"); }
    else notify("产品已保存");
  };
  const deleteProduct = (product) => {
    if (window.confirm(`确定删除“${product.name}”吗？`)) { setProducts((list) => list.filter((p) => p.id !== product.id)); setEditorProduct(undefined); notify("产品已删除"); }
  };
  const duplicateProduct = (product) => { setProducts((list) => [{ ...product, id: `p-${Date.now()}`, name: `${product.name}（副本）`, status: "idea" }, ...list]); notify("已复制产品"); };
  const moveProductSeries = (productId, nextSeries) => {
    const product = products.find((item) => item.id === productId);
    if (!product || productSeries(product) === nextSeries) return;
    setProducts((list) => list.map((item) => item.id === productId ? { ...item, series: nextSeries === "未分类" ? "" : nextSeries } : item));
    notify(`已将“${product.name}”移到${nextSeries}`);
  };
  const saveMarket = (market) => {
    const previous = markets.find((item) => item.id === market.id);
    const previousDeductions = previous?.inventoryDeductions || {};
    const nextDeductions = market.status === "closed" && market.syncInventory ? (market.sales || []).reduce((result, row) => {
      result[row.productId] = (result[row.productId] || 0) + number(row.soldQty) + number(row.giftQty) - number(row.newQty);
      return result;
    }, {}) : {};
    setProducts((list) => list.map((product) => ({ ...product, stock: number(product.stock) + number(previousDeductions[product.id]) - number(nextDeductions[product.id]) })));
    const savedMarket = { ...market, inventoryDeductions: nextDeductions };
    setMarkets((list) => list.some((item) => item.id === savedMarket.id) ? list.map((item) => item.id === savedMarket.id ? savedMarket : item) : [savedMarket, ...list]);
    setEditorMarket(undefined); notify("集市结算单已保存");
  };
  const deleteMarket = (market) => {
    if (!window.confirm(`确定删除“${market.name}”吗？已同步的库存会自动恢复。`)) return;
    const deductions = market.inventoryDeductions || {};
    setProducts((list) => list.map((product) => ({ ...product, stock: number(product.stock) + number(deductions[product.id]) })));
    setMarkets((list) => list.filter((item) => item.id !== market.id));
    setEditorMarket(undefined); notify("集市记录已删除");
  };
  const importData = (data) => {
    if (!Array.isArray(data.products)) { alert("备份文件中没有有效的产品数据。"); return; }
    if (!window.confirm(`将用备份中的 ${data.products.length} 个产品覆盖当前数据，是否继续？`)) return;
    setProducts(data.products.map(normalizeProduct));
    if (Array.isArray(data.markets)) setMarkets(data.markets);
    if (data.settings) { setDailyHours(data.settings.dailyHours ?? 2); setGlobalDeadline(data.settings.globalDeadline ?? "2026-09-25"); }
    notify("备份已导入");
  };
  const reset = () => { if (window.confirm("恢复示例数据会覆盖当前产品和集市账本。建议先导出备份，是否继续？")) { setProducts(mergeCatalogProducts(SAMPLE_PRODUCTS).products); setMarkets([]); setDailyHours(2); setGlobalDeadline("2026-09-25"); notify("已恢复示例数据与产品清单"); } };
  if (!loaded) return <div className="loading-screen"><span /></div>;
  const settings = { dailyHours, globalDeadline };
  const skuCount = products.filter(isSkuProduct).length;
  const seriesOptions = [...new Set(products.map(productSeries).filter((series) => series !== "未分类"))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><span>A</span></div><div><b>阿拉蕾</b><small>PRODUCT STUDIO</small></div></div>
      <div className="edition-label"><span>WORKING EDITION</span><b>001</b><small>SEP · 2026</small></div>
      <nav>
        <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><Icon name="grid" /><span>总览</span></button>
        <button className={["skus", "products", "restock", "planner"].includes(view) ? "active" : ""} onClick={() => setView("skus")}><Icon name="box" /><span>产品 SKU</span><em>{skuCount}</em></button>
        <button className={view === "markets" ? "active" : ""} onClick={() => setView("markets")}><Icon name="receipt" /><span>集市账本</span><em>{markets.length}</em></button>
      </nav>
      <div className="privacy-note"><span className="privacy-dot" /><div><b>本机私密保存</b><small>数据不会上传到服务器</small></div></div>
      <div className="sidebar-signature">MAKE SMALL THINGS<br />WITH GREAT CARE.</div>
    </aside>
    <header className="topbar">
      <div className="mobile-brand"><div className="brand-mark"><span>A</span></div><b>产品工作台</b></div>
      <div className="topbar-folio"><span>ALALÉI'S PRODUCT DESK</span><i>PRIVATE WORKING FILE</i></div>
      <div className="top-actions"><span className="save-state"><i />已自动保存</span><DesktopInstall onNotify={notify} /><DataMenu products={products} markets={markets} settings={settings} onImport={importData} onReset={reset} /></div>
    </header>
    <div className="content">
      {view === "dashboard" && <Dashboard products={products} dailyHours={dailyHours} onOpenProduct={(p) => setEditorProduct(p || null)} onNavigate={setView} />}
      {view === "skus" && <AllSkuCatalog products={products} markets={markets} onOpenProduct={(p) => setEditorProduct(p)} onNavigate={setView} />}
      {view === "products" && <ProductList products={products} markets={markets} dailyHours={dailyHours} onOpenProduct={(p) => setEditorProduct(p || null)} onDuplicate={duplicateProduct} onDelete={deleteProduct} onMoveSeries={moveProductSeries} onNavigate={setView} />}
      {view === "restock" && <RestockPool products={products} markets={markets} onOpenProduct={(p) => setEditorProduct(p)} onNavigate={setView} />}
      {view === "planner" && <Planner products={products} dailyHours={dailyHours} setDailyHours={setDailyHours} globalDeadline={globalDeadline} setGlobalDeadline={setGlobalDeadline} onOpenProduct={(p) => setEditorProduct(p)} onNavigate={setView} />}
      {view === "markets" && <MarketBook markets={markets} products={products} onOpenMarket={(market) => setEditorMarket(market || null)} onDeleteMarket={deleteMarket} />}
    </div>
    <button className="floating-add" onClick={() => view === "markets" ? setEditorMarket(null) : setEditorProduct(null)} aria-label={view === "markets" ? "新建集市" : "添加产品"}><Icon name="plus" /></button>
    <nav className="bottom-nav"><button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><Icon name="grid" /><span>总览</span></button><button className={["skus", "products", "restock", "planner"].includes(view) ? "active" : ""} onClick={() => setView("skus")}><Icon name="box" /><span>产品 SKU</span></button><button className={view === "markets" ? "active" : ""} onClick={() => setView("markets")}><Icon name="receipt" /><span>集市账本</span></button></nav>
    {editorProduct !== undefined && <ProductEditor product={editorProduct} seriesOptions={seriesOptions} onClose={() => setEditorProduct(undefined)} onSave={saveProduct} onDelete={deleteProduct} />}
    {editorMarket !== undefined && <MarketEditor market={editorMarket} markets={markets} products={products} onClose={() => setEditorMarket(undefined)} onSave={saveMarket} onDelete={deleteMarket} />}
    {toast && <div className="toast"><span>✓</span>{toast}</div>}
  </main>;
}
