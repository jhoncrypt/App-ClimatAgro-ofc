
"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SortAscIcon, SortDescIcon, SortIcon } from "@/components/icons";
import { useLanguage } from "@/context/language-context";

type Column<T> = {
  accessorKey: keyof T;
  header: React.ReactNode;
  cell?: (value: any) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
};

type SortConfig<T> = {
  key: keyof T;
  direction: "ascending" | "descending";
} | null;

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig<T>>(null);
  const { t } = useLanguage();

  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const requestSort = (key: keyof T) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof T) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <SortIcon className="h-4 w-4 text-muted-foreground" />;
    }
    if (sortConfig.direction === "ascending") {
      return <SortAscIcon className="h-4 w-4" />;
    }
    return <SortDescIcon className="h-4 w-4" />;
  };

  return (
    <div className="w-full rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.accessorKey)}>
                <Button
                  variant="ghost"
                  onClick={() => requestSort(column.accessorKey)}
                  className="px-2 py-1"
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {getSortIcon(column.accessorKey)}
                  </div>
                </Button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length > 0 ? (
            sortedData.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={String(column.accessorKey)}>
                    {column.cell
                      ? column.cell(row[column.accessorKey])
                      : String(row[column.accessorKey])}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                {t('dataTable.noResults')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
