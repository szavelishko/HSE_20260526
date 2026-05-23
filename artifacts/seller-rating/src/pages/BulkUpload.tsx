import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUpDown } from "lucide-react";
import { calculateScore, CalculationResult, SellerMetrics } from "@/lib/scoring";

const fields = [
  { key: "sellerName", label: "Название продавца", aliases: ["назван", "продав", "name", "seller"] },
  { key: "rating", label: "Рейтинг", aliases: ["рейтинг", "rating"] },
  { key: "returnRate", label: "Возвраты (%)", aliases: ["возврат", "return"] },
  { key: "shippingDays", label: "Срок отгрузки (дни)", aliases: ["отгрузк", "shipping", "срок"] },
  { key: "deliveryOnTime", label: "Доставка в срок (%)", aliases: ["доставк", "delivery"] },
  { key: "cancellationRate", label: "Отмены (%)", aliases: ["отмен", "cancel"] },
  { key: "complaintsCount", label: "Жалобы (шт)", aliases: ["жалоб", "complaint"] },
  { key: "responseHours", label: "Время ответа (часы)", aliases: ["ответ", "response", "время"] },
];

interface BulkResult extends CalculationResult {
  id: number;
  sellerName: string;
}

interface BulkUploadProps {
  onSellersLoaded?: (sellers: SellerMetrics[]) => void;
}

export default function BulkUpload({ onSellersLoaded }: BulkUploadProps) {
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [results, setResults] = useState<BulkResult[]>([]);
  const [sortAsc, setSortAsc] = useState(false);
  const [filename, setFilename] = useState<string>("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length === 0) return;

    // Detect delimiter
    const headerLine = lines[0];
    const commaCount = (headerLine.match(/,/g) || []).length;
    const semiCount = (headerLine.match(/;/g) || []).length;
    const delimiter = semiCount > commaCount ? ";" : ",";

    const parsedData = lines.map(line => {
      const regex = new RegExp(`(?:^|${delimiter})("(?:[^"]|"")*"|[^${delimiter}]*)`, "g");
      const row: string[] = [];
      let match;
      while ((match = regex.exec(line))) {
        let val = match[1] || "";
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1).replace(/""/g, '"');
        }
        row.push(val.trim());
      }
      return row;
    });

    const parsedHeaders = parsedData[0];
    const dataRows = parsedData.slice(1);
    
    setHeaders(parsedHeaders);
    setCsvData(dataRows);

    // Auto-detect mapping
    const newMapping: Record<string, string> = {};
    fields.forEach(field => {
      const match = parsedHeaders.find(h => 
        field.aliases.some(alias => h.toLowerCase().includes(alias.toLowerCase()))
      );
      if (match) {
        newMapping[field.key] = match;
      }
    });
    setMapping(newMapping);
    setResults([]);
  };

  const handleProcess = () => {
    if (csvData.length === 0) return;

    const allMetrics: SellerMetrics[] = csvData.map((row, index) => {
      const getVal = (key: string): string => {
        const headerName = mapping[key];
        if (!headerName) return "";
        const colIndex = headers.indexOf(headerName);
        if (colIndex === -1) return "";
        return row[colIndex] || "";
      };

      return {
        sellerName: getVal("sellerName") || `Продавец ${index + 1}`,
        rating: Number(getVal("rating")) || 0,
        returnRate: Number(getVal("returnRate")) || 0,
        shippingDays: Number(getVal("shippingDays")) || 0,
        deliveryOnTime: Number(getVal("deliveryOnTime")) || 0,
        cancellationRate: Number(getVal("cancellationRate")) || 0,
        complaintsCount: Number(getVal("complaintsCount")) || 0,
        responseHours: Number(getVal("responseHours")) || 0,
      };
    });

    const newResults = allMetrics.map((metrics, index) => {
      const res = calculateScore(metrics);
      return { ...res, id: index + 1, sellerName: metrics.sellerName };
    });

    setResults(newResults);
    onSellersLoaded?.(allMetrics);
  };

  const handleSort = () => {
    setSortAsc(!sortAsc);
  };

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => sortAsc ? a.score - b.score : b.score - a.score);
  }, [results, sortAsc]);

  const stats = useMemo(() => {
    return {
      total: results.length,
      green: results.filter(r => r.zone === "green").length,
      yellow: results.filter(r => r.zone === "yellow").length,
      red: results.filter(r => r.zone === "red").length,
    };
  }, [results]);

  const zoneBadgeColors = {
    green: "bg-green-100 text-green-800 hover:bg-green-100",
    yellow: "bg-amber-100 text-amber-800 hover:bg-amber-100",
    red: "bg-red-100 text-red-800 hover:bg-red-100",
  };

  const zoneScoreColors = {
    green: "text-green-600",
    yellow: "text-amber-600",
    red: "text-red-600",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Загрузить список (CSV)</CardTitle>
          <CardDescription>Загрузите файл с данными продавцов для массовой оценки.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="csv-upload">Файл CSV</Label>
              <Input 
                id="csv-upload" 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload}
                data-testid="csv-upload-input"
              />
            </div>
            {filename && (
              <div className="text-sm text-slate-500 pb-2">
                Выбран: {filename} ({csvData.length} строк)
              </div>
            )}
          </div>

          {headers.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="font-medium text-slate-900 dark:text-slate-100">Настройка колонок</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {fields.map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs text-slate-500">{field.label}</Label>
                    <Select
                      value={mapping[field.key] || "—"}
                      onValueChange={(val) => setMapping(prev => ({ ...prev, [field.key]: val === "—" ? "" : val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="—">—</SelectItem>
                        {headers.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              
              <div className="pt-2">
                <Button 
                  onClick={handleProcess}
                  data-testid="button-process-csv"
                >
                  Рассчитать всех
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle>Результаты оценки</CardTitle>
              <div className="text-sm font-medium flex gap-4 text-slate-600 dark:text-slate-400">
                <span>Всего: {stats.total}</span>
                <span className="text-green-600 dark:text-green-500">Зелёная зона: {stats.green}</span>
                <span className="text-amber-600 dark:text-amber-500">Жёлтая: {stats.yellow}</span>
                <span className="text-red-600 dark:text-red-500">Красная: {stats.red}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-slate-200 dark:border-slate-800">
              <Table data-testid="bulk-results-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Продавец</TableHead>
                    <TableHead className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" onClick={handleSort}>
                      <div className="flex items-center">
                        Оценка
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Зона</TableHead>
                    <TableHead>Основная проблема</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedResults.map((res) => (
                    <TableRow key={res.id}>
                      <TableCell className="text-slate-500">{res.id}</TableCell>
                      <TableCell className="font-medium">{res.sellerName}</TableCell>
                      <TableCell className={`font-bold ${zoneScoreColors[res.zone]}`}>{res.score.toFixed(1)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={zoneBadgeColors[res.zone]}>
                          {res.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {res.topProblems[0]?.label || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
