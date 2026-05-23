import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

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

interface CalculationResult {
  score: number;
  zone: "green" | "yellow" | "red";
  label: string;
  breakdown: {
    ratingScore: number;
    returnScore: number;
    shippingScore: number;
    deliveryScore: number;
    cancellationScore: number;
    complaintsScore: number;
    responseScore: number;
  };
}

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

  function onSubmit(data: FormValues) {
    // 1. Rating (25%)
    const ratingScore = (data.rating / 5) * 100;
    // 2. Return Rate (15%)
    const returnScore = Math.max(0, 100 - data.returnRate * 5);
    // 3. Shipping Days (10%)
    const shippingScore = Math.max(0, 100 - data.shippingDays * 10);
    // 4. Delivery On Time (20%)
    const deliveryScore = data.deliveryOnTime;
    // 5. Cancellation Rate (10%)
    const cancellationScore = Math.max(0, 100 - data.cancellationRate * 5);
    // 6. Complaints Count (10%)
    const complaintsScore = Math.max(0, 100 - data.complaintsCount * 5);
    // 7. Response Hours (10%)
    const responseScore = Math.max(0, 100 - data.responseHours * 4);

    const finalScoreRaw =
      ratingScore * 0.25 +
      returnScore * 0.15 +
      shippingScore * 0.10 +
      deliveryScore * 0.20 +
      cancellationScore * 0.10 +
      complaintsScore * 0.10 +
      responseScore * 0.10;

    const finalScore = Number(finalScoreRaw.toFixed(1));

    let zone: "green" | "yellow" | "red" = "red";
    let label = "Высокий риск";

    if (finalScore > 80) {
      zone = "green";
      label = "Надёжный продавец";
    } else if (finalScore >= 50) {
      zone = "yellow";
      label = "Требует внимания";
    }

    setResult({
      score: finalScore,
      zone,
      label,
      breakdown: {
        ratingScore,
        returnScore,
        shippingScore,
        deliveryScore,
        cancellationScore,
        complaintsScore,
        responseScore,
      },
    });
  }

  const zoneColors = {
    green: "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-900",
    yellow: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-900",
    red: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-900",
  };

  const zoneProgressColors = {
    green: "[&>div]:bg-green-500",
    yellow: "[&>div]:bg-amber-500",
    red: "[&>div]:bg-red-500",
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 flex justify-center font-sans">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-7 xl:col-span-8">
          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-6">
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Панель ввода показателей
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-base">
                Укажите точные метрики продавца для расчета комплексной оценки качества.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 bg-white dark:bg-slate-900">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="sellerName"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-slate-700 dark:text-slate-300 font-semibold">Название продавца</FormLabel>
                          <FormControl>
                            <Input placeholder="Например: ООО 'Альфа'" data-testid="input-seller-name" {...field} className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 font-semibold">Рейтинг (0-5)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" data-testid="input-rating" {...field} className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="returnRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 font-semibold">Процент возвратов (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" data-testid="input-return-rate" {...field} className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shippingDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 font-semibold">Средний срок отгрузки (дни)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" data-testid="input-shipping-days" {...field} className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deliveryOnTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 font-semibold">Доставка в срок (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" data-testid="input-delivery-on-time" {...field} className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cancellationRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 font-semibold">Процент отмен продавцом (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" data-testid="input-cancellation-rate" {...field} className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="complaintsCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 font-semibold">Количество жалоб за 30 дней</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" data-testid="input-complaints" {...field} className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="responseHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300 font-semibold">Среднее время ответа (часы)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" data-testid="input-response-hours" {...field} className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full md:w-auto px-8 h-12 text-base font-semibold shadow-md"
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

        <div className="lg:col-span-5 xl:col-span-4 sticky top-8">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result-panel"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
              >
                <Card className={`shadow-xl border-2 overflow-hidden ${zoneColors[result.zone]}`}>
                  <CardHeader className="pb-4 text-center">
                    <CardDescription className="uppercase tracking-widest text-xs font-bold opacity-80 mb-2">
                      Итоговая оценка
                    </CardDescription>
                    <div className="text-6xl md:text-7xl font-black tracking-tighter tabular-nums" data-testid="result-score">
                      <AnimatedCounter value={result.score} />
                    </div>
                    <div className="mt-4 inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/50 dark:bg-black/20 font-bold backdrop-blur-sm" data-testid="result-zone">
                      {result.label}
                    </div>
                  </CardHeader>
                  <CardContent className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md pt-6">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                      Анализ метрик
                    </h4>
                    
                    <div className="space-y-4">
                      <MetricBar 
                        label="Рейтинг (25%)" 
                        score={result.breakdown.ratingScore} 
                        colorClass={zoneProgressColors[result.zone]} 
                      />
                      <MetricBar 
                        label="Возвраты (15%)" 
                        score={result.breakdown.returnScore} 
                        colorClass={zoneProgressColors[result.zone]} 
                      />
                      <MetricBar 
                        label="Отгрузка (10%)" 
                        score={result.breakdown.shippingScore} 
                        colorClass={zoneProgressColors[result.zone]} 
                      />
                      <MetricBar 
                        label="Доставка (20%)" 
                        score={result.breakdown.deliveryScore} 
                        colorClass={zoneProgressColors[result.zone]} 
                      />
                      <MetricBar 
                        label="Отмены (10%)" 
                        score={result.breakdown.cancellationScore} 
                        colorClass={zoneProgressColors[result.zone]} 
                      />
                      <MetricBar 
                        label="Жалобы (10%)" 
                        score={result.breakdown.complaintsScore} 
                        colorClass={zoneProgressColors[result.zone]} 
                      />
                      <MetricBar 
                        label="Ответы (10%)" 
                        score={result.breakdown.responseScore} 
                        colorClass={zoneProgressColors[result.zone]} 
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="shadow-sm border-slate-200 dark:border-slate-800 border-dashed bg-transparent">
                  <CardContent className="flex flex-col items-center justify-center h-[400px] text-slate-400 dark:text-slate-500">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-800 mb-4 flex items-center justify-center">
                      <div className="w-8 h-8 border-t-2 border-r-2 border-slate-300 dark:border-slate-600 rounded-full" />
                    </div>
                    <p className="text-center font-medium">Ожидание данных...</p>
                    <p className="text-sm text-center mt-2 max-w-[250px] opacity-80">
                      Заполните все поля и нажмите «Рассчитать» для получения оценки
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

function MetricBar({ label, score, colorClass }: { label: string; score: number; colorClass: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{score.toFixed(1)}</span>
      </div>
      <Progress value={score} className={`h-2 bg-slate-100 dark:bg-slate-800 ${colorClass}`} />
    </div>
  );
}
