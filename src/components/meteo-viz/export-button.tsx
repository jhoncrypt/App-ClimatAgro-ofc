
"use client";

import { Button } from "@/components/ui/button";
import { DownloadIcon } from "@/components/icons";
import * as XLSX from "xlsx";
import { useLanguage } from "@/context/language-context";

type ExportButtonProps<T> = {
  data: T[];
  filename: string;
};

export function ExportButton<T extends Record<string, any>>({
  data,
  filename,
}: ExportButtonProps<T>) {
  const { t } = useLanguage();
  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  return (
    <Button onClick={handleExport} variant="outline">
      <DownloadIcon className="mr-2 h-4 w-4" />
      {t('exportButton')}
    </Button>
  );
}
