export interface SellerMetrics {
  sellerName: string;
  rating: number;          // 0-5
  returnRate: number;      // % 0-100, lower is better
  shippingDays: number;    // days, lower is better
  deliveryOnTime: number;  // % 0-100, higher is better
  cancellationRate: number;// % 0-100, not used in score
  complaintsCount: number; // count, lower is better
  responseHours: number;   // hours, lower is better
}

export interface MetricInfo {
  key: string;
  label: string;
  score: number;
  weight: number;
}

export interface ScoreBreakdown {
  ratingScore: number;
  returnScore: number;
  shippingScore: number;
  deliveryScore: number;
  complaintsScore: number;
  responseScore: number;
}

export interface CalculationResult {
  score: number;
  zone: "green" | "yellow" | "red";
  label: string;
  breakdown: ScoreBreakdown;
  allMetrics: MetricInfo[];
  topProblems: MetricInfo[];
  summary: string;
  recommendations: { title: string; text: string }[];
}

const recommendationData: Record<string, { title: string; text: string }> = {
  return: {
    title: "Снижение процента возвратов",
    text: "Проверьте качество карточек товаров и соответствие описания реальным характеристикам. Убедитесь в правильности размерных сеток и актуальности фотографий.",
  },
  delivery: {
    title: "Улучшение доставки в срок",
    text: "Пересмотрите логистическую цепочку и надёжность партнёров по доставке. Рассмотрите подключение резервных служб доставки на случай пиковой нагрузки.",
  },
  complaints: {
    title: "Работа с жалобами",
    text: "Проанализируйте причины жалоб по категориям. Введите систему мониторинга отзывов и регламент оперативного реагирования в течение 2 часов.",
  },
  shipping: {
    title: "Оптимизация срока отгрузки",
    text: "Оптимизируйте складские процессы и сборку заказов. Рассмотрите подключение фулфилмент-сервиса для ускорения обработки.",
  },
  response: {
    title: "Ускорение ответов клиентам",
    text: "Подключите шаблонные ответы на типовые вопросы и настройте чат-бот для первичной обработки запросов. Цель — ответ в течение 2 часов.",
  },
  rating: {
    title: "Повышение рейтинга",
    text: "Стимулируйте довольных покупателей оставлять отзывы с помощью постпродажных сообщений. Отрабатывайте каждый негативный отзыв публично и конструктивно.",
  },
};

export function calculateScore(data: SellerMetrics): CalculationResult {
  const ratingScore = (data.rating / 5) * 100;
  const returnScore = Math.max(0, 100 - data.returnRate * 5);
  const shippingScore = Math.max(0, 100 - data.shippingDays * 10);
  const deliveryScore = data.deliveryOnTime;
  const complaintsScore = Math.max(0, 100 - data.complaintsCount * 5);
  const responseScore = Math.max(0, 100 - data.responseHours * 4);

  const finalScoreRaw =
    ratingScore * 0.25 +
    returnScore * 0.2 +
    deliveryScore * 0.2 +
    complaintsScore * 0.15 +
    shippingScore * 0.1 +
    responseScore * 0.1;

  const score = Number(finalScoreRaw.toFixed(1));

  let zone: "green" | "yellow" | "red" = "red";
  let label = "Высокий риск";

  if (score > 80) {
    zone = "green";
    label = "Надёжный продавец";
  } else if (score >= 50) {
    zone = "yellow";
    label = "Требует внимания";
  }

  const allMetrics: MetricInfo[] = [
    { key: "rating", label: "Рейтинг", score: ratingScore, weight: 25 },
    { key: "return", label: "Процент возвратов", score: returnScore, weight: 20 },
    { key: "delivery", label: "Доставка в срок", score: deliveryScore, weight: 20 },
    { key: "complaints", label: "Жалобы за 30 дней", score: complaintsScore, weight: 15 },
    { key: "shipping", label: "Срок отгрузки", score: shippingScore, weight: 10 },
    { key: "response", label: "Время ответа", score: responseScore, weight: 10 },
  ];

  const topProblems = [...allMetrics].sort((a, b) => a.score - b.score).slice(0, 3);

  let summary = "";
  if (score > 80) {
    summary = "Продавец демонстрирует стабильно высокие показатели по всем ключевым метрикам. Отклонений от нормы не выявлено — работа сервиса соответствует стандартам надёжного партнёра.";
  } else if (data.returnRate > 15 && data.complaintsCount > 5) {
    summary = "Высокий процент возвратов (" + data.returnRate + "%) в сочетании с " + data.complaintsCount + " жалобами за месяц указывает на системную проблему: товар не соответствует ожиданиям покупателей. Вероятно, причина кроется в качестве карточек товара или фактических характеристиках продукта.";
  } else if (data.deliveryOnTime < 70 && data.shippingDays > 5) {
    summary = "Медленная отгрузка (" + data.shippingDays + " дн.) совпадает с низким процентом доставки в срок (" + data.deliveryOnTime + "%) — вероятна перегрузка на стороне логистики или нехватка складских ресурсов. Проблема носит операционный характер.";
  } else if (data.rating < 3.5 && data.responseHours > 12) {
    summary = "Низкий рейтинг (" + data.rating + ") при медленных ответах клиентам (" + data.responseHours + " ч.) говорит о неудовлетворительном покупательском опыте. Покупатели не получают своевременной поддержки, что ведёт к негативным отзывам.";
  } else if (data.returnRate > 20) {
    summary = "Процент возвратов " + data.returnRate + "% существенно превышает норму. Рекомендуется проверить качество товара и соответствие описания реальным характеристикам.";
  } else if (data.deliveryOnTime < 60) {
    summary = "Доставка в срок всего " + data.deliveryOnTime + "% — критический показатель, напрямую влияющий на удовлетворённость покупателей и позиции в поиске маркетплейса.";
  } else if (data.complaintsCount > 10) {
    summary = "Более " + data.complaintsCount + " жалоб за 30 дней — тревожный сигнал. Необходим детальный анализ причин обращений и принятие системных мер.";
  } else if (score >= 50) {
    summary = "Продавец работает в допустимых пределах, однако ряд показателей требует внимания. Планомерное улучшение слабых метрик позволит перейти в зелёную зону.";
  } else {
    summary = "Показатели продавца критически низкие по нескольким ключевым направлениям. Требуется немедленное вмешательство и пересмотр операционных процессов.";
  }

  const recommendations = topProblems.map((p) => recommendationData[p.key]).filter(Boolean);

  return {
    score,
    zone,
    label,
    breakdown: {
      ratingScore,
      returnScore,
      shippingScore,
      deliveryScore,
      complaintsScore,
      responseScore,
    },
    allMetrics,
    topProblems,
    summary,
    recommendations,
  };
}
