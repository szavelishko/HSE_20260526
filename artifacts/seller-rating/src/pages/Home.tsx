import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { calculateScore, CalculationResult, SellerMetrics } from "@/lib/scoring";
import BulkUpload from "@/pages/BulkUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  sellerName: z.string().min(1, "Обязательное поле"),
  rating: z.coerce
    .number({ invalid_type_error: "Обязательное поле" })
    .min(0, "Значение должно быть от 0 до 5")
    .max(5, "Значение должно быть от 0 до 5"),
  returnRate: z.coerce
    .number({ invalid_type_error: "Обязательное поле" })
    .min(0, "От 0 до 100")
    .max(100, "От 0 до 100"),
  shippingDays: z.coerce
    .number({ invalid_type_error: "Обязательное поле" })
    .min(0, "Значение не может быть отрицательным"),
  deliveryOnTime: z.coerce
    .number({ invalid_type_error: "Обязательное поле" })
    .min(0, "От 0 до 100")
    .max(100, "От 0 до 100"),
  cancellationRate: z.coerce
    .number({ invalid_type_error: "Обязательное поле" })
    .min(0, "От 0 до 100")
    .max(100, "От 0 до 100"),
  complaintsCount: z.coerce
    .number({ invalid_type_error: "Обязательное поле" })
    .min(0, "Значение не может быть отрицательным")
    .int("Должно быть целым числом"),
  responseHours: z.coerce
    .number({ invalid_type_error: "Обязательное поле" })
    .min(0, "Значение не может быть отрицательным"),
});

type FormValues = z.infer<typeof formSchema>;

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + (value - start) * easeOutQuart;
      
      setDisplayValue(Number(current.toFixed(1)));

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [value]);

  return <span>{displayValue.toFixed(1)}</span>;
}

export default function Home() {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loadedSellers, setLoadedSellers] = useState<SellerMetrics[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sellerName: "",
      rating: 0,
      returnRate: 0,
      shippingDays: 0,
      deliveryOnTime: 0,
      cancellationRate: 0,
      complaintsCount: 0,
      responseHours: 0,
    },
  });

  const sellerNameValue = form.watch("sellerName");

  function onSubmit(data: FormValues) {
    setResult(calculateScore(data));
  }

  function handleSellerSelect(index: string) {
    const seller = loadedSellers[Number(index)];
    if (!seller) return;
    form.reset({
      sellerName: seller.sellerName,
      rating: seller.rating,
      returnRate: seller.returnRate,
      shippingDays: seller.shippingDays,
      deliveryOnTime: seller.deliveryOnTime,
      cancellationRate: seller.cancellationRate,
      complaintsCount: seller.complaintsCount,
      responseHours: seller.responseHours,
    });
    setResult(calculateScore(seller));
  }

  const zoneBadges = {
    green: "bg-green-100 text-green-700 border border-green-200",
    yellow: "bg-amber-100 text-amber-700 border border-amber-200",
    red: "bg-red-100 text-red-700 border border-red-200",
  };

  const zoneScoreColors = {
    green: "text-green-400",
    yellow: "text-amber-400",
    red: "text-red-400",
  };

  const zoneBorderColors = {
    green: "border-green-500",
    yellow: "border-amber-500",
    red: "border-red-500",
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 flex justify-center font-sans">
      <div className="max-w-7xl w-full">
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="mb-6 w-full justify-start h-11 bg-transparent border-b border-slate-200 rounded-none p-0">
            <TabsTrigger 
              value="single" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11 px-6 text-sm font-medium"
            >
              Один продавец
            </TabsTrigger>
            <TabsTrigger 
              value="bulk" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-11 px-6 text-sm font-medium"
            >
              Загрузить список
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="focus-visible:outline-none">
            {!result ? (
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="w-full lg:w-[42%]">
                  <Card className="shadow-sm border-slate-200 dark:border-slate-800 rounded-xl">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                      <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Панель ввода показателей
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {loadedSellers.length > 0 && (
                        <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
                            Выбрать из загруженных
                          </label>
                          <Select onValueChange={handleSellerSelect} data-testid="select-loaded-seller">
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder={`${loadedSellers.length} продавцов загружено...`} />
                            </SelectTrigger>
                            <SelectContent>
                              {loadedSellers.map((s, i) => (
                                <SelectItem key={i} value={String(i)}>
                                  {s.sellerName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                          <FormField
                            control={form.control}
                            name="sellerName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Название продавца</FormLabel>
                                <FormControl>
                                  <Input placeholder="Например: ООО 'Альфа'" data-testid="input-seller-name" {...field} className="h-8 text-sm" />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-3 gap-3">
                            <FormField control={form.control} name="rating" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Рейтинг (0-5)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.1" data-testid="input-rating" {...field} className="h-8 text-sm" />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="returnRate" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Возвраты (%)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.1" data-testid="input-return-rate" {...field} className="h-8 text-sm" />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="shippingDays" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Срок отгрузки</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.1" data-testid="input-shipping-days" {...field} className="h-8 text-sm" />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="deliveryOnTime" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">В срок (%)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.1" data-testid="input-delivery-on-time" {...field} className="h-8 text-sm" />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="cancellationRate" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Отмены (%)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.1" data-testid="input-cancellation-rate" {...field} className="h-8 text-sm" />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="complaintsCount" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Жалобы (шт)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="1" data-testid="input-complaints" {...field} className="h-8 text-sm" />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="responseHours" render={({ field }) => (
                              <FormItem className="col-span-3">
                                <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Время ответа (часы)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.1" data-testid="input-response-hours" {...field} className="h-8 text-sm" />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )} />
                          </div>
                          <div className="pt-2">
                            <Button 
                              type="submit" 
                              className="w-full h-9 text-sm font-semibold"
                              data-testid="button-calculate"
                            >
                              Рассчитать рейтинг
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </div>

                <div className="w-full lg:w-[58%]">
                  <Card className="h-full min-h-[400px] shadow-sm border-slate-200 dark:border-slate-800 border-dashed bg-transparent rounded-xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-800 mb-4 flex items-center justify-center">
                      <div className="w-8 h-8 border-t-2 border-r-2 border-slate-300 dark:border-slate-600 rounded-full" />
                    </div>
                    <p className="text-center font-medium">Ожидание данных...</p>
                    <p className="text-sm text-center mt-2 max-w-[250px] opacity-80">
                      Заполните форму слева и нажмите «Рассчитать»
                    </p>
                  </Card>
                </div>
              </div>
            ) : (
              <AnimatePresence>
                <div className="flex flex-col gap-3">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`h-[90px] shadow-sm border-0 border-l-4 rounded-xl flex items-center overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 ${zoneBorderColors[result.zone]}`}>
                      <div className="flex items-center w-full h-full text-white px-6">
                        <div className="w-[180px] shrink-0 border-r border-slate-700/50 pr-4 flex flex-col justify-center">
                          <div className="flex items-baseline gap-1">
                            <span className={`text-5xl font-black tabular-nums tracking-tighter ${zoneScoreColors[result.zone]}`} data-testid="result-score">
                              <AnimatedCounter value={result.score} />
                            </span>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">ИЗ 100 БАЛЛОВ</span>
                        </div>
                        
                        <div className="flex-1 px-6 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-3 mb-1.5">
                            <h2 className="text-lg font-bold truncate">{sellerNameValue || "Неизвестный продавец"}</h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${zoneBadges[result.zone]}`} data-testid="result-zone">
                              {result.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed opacity-90 max-w-2xl" title={result.summary}>
                            {result.summary}
                          </p>
                        </div>

                        <div className="w-[150px] shrink-0 pl-4 border-l border-slate-700/50 flex justify-end">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => setResult(null)}
                            data-testid="button-edit"
                            className="bg-white/10 hover:bg-white/20 text-white border-0 text-xs font-semibold h-9 px-4"
                          >
                            Изменить данные
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="h-full"
                    >
                      <Card className="h-full shadow-sm border-slate-200 dark:border-slate-800 rounded-xl min-h-[380px]">
                        <CardContent className="p-5">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                            Анализ метрик
                          </h3>
                          <div className="space-y-4">
                            <MetricBar label="Рейтинг (25%)" score={result.breakdown.ratingScore} />
                            <MetricBar label="Возвраты (20%)" score={result.breakdown.returnScore} />
                            <MetricBar label="Доставка в срок (20%)" score={result.breakdown.deliveryScore} />
                            <MetricBar label="Жалобы (15%)" score={result.breakdown.complaintsScore} />
                            <MetricBar label="Срок отгрузки (10%)" score={result.breakdown.shippingScore} />
                            <MetricBar label="Время ответа (10%)" score={result.breakdown.responseScore} />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.15 }}
                      className="h-full"
                    >
                      <Card className="h-full shadow-sm border-slate-200 dark:border-slate-800 rounded-xl min-h-[380px]" data-testid="top-problems">
                        <CardContent className="p-5 flex flex-col h-full">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                            Основные проблемы
                          </h3>
                          <div className="space-y-3 flex-1">
                            {result.topProblems.map((problem, index) => (
                              <div
                                key={problem.key}
                                className="flex items-start gap-3 rounded-lg px-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                                data-testid={`problem-item-${index}`}
                              >
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-600 border border-red-200 text-xs font-bold flex items-center justify-center mt-0.5">
                                  {index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate mb-1">
                                    {problem.label}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Вес {problem.weight}% · Балл: {problem.score.toFixed(1)}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {result.topProblems.length === 0 && (
                              <div className="flex items-center justify-center h-full text-sm text-slate-400">
                                Проблем не выявлено
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="h-full"
                    >
                      <Card className="h-full shadow-sm border-slate-200 dark:border-slate-800 rounded-xl min-h-[380px]" data-testid="recommendations-block">
                        <CardContent className="p-5 flex flex-col h-full">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                            Рекомендации
                          </h3>
                          <div className="flex flex-col h-full justify-start">
                            {result.recommendations.slice(0, 3).map((rec, i) => (
                              <div key={i} className="mb-4 last:mb-0">
                                <div className="flex items-start gap-2 mb-1.5">
                                  <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                  <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">{rec.title}</h5>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed ml-6 line-clamp-3">
                                  {rec.text.length > 90 ? rec.text.slice(0, 90) + "..." : rec.text}
                                </p>
                                {i < Math.min(2, result.recommendations.length - 1) && (
                                  <Separator className="mt-4 bg-slate-100 dark:bg-slate-800 ml-6" />
                                )}
                              </div>
                            ))}
                            {result.recommendations.length === 0 && (
                              <div className="flex items-center justify-center h-full text-sm text-slate-400">
                                Нет рекомендаций
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </div>
              </AnimatePresence>
            )}
          </TabsContent>

          <TabsContent value="bulk" className="focus-visible:outline-none">
            <BulkUpload onSellersLoaded={setLoadedSellers} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MetricBar({ label, score }: { label: string; score: number }) {
  let colorClass = "[&>div]:bg-red-500";
  if (score >= 70) colorClass = "[&>div]:bg-green-500";
  else if (score >= 40) colorClass = "[&>div]:bg-amber-500";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end text-xs">
        <span className="font-medium text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{score.toFixed(1)}</span>
      </div>
      <Progress value={score} className={`h-1.5 bg-slate-100 dark:bg-slate-800 ${colorClass}`} />
    </div>
  );
}
