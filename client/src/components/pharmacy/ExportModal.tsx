import { useState } from "react";
import { Download, FileText, Table as TableIcon, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ExportFormat = "csv" | "excel" | "pdf";
export type ExportScope = "current" | "all" | "selected";

export interface ExportColumn {
  id: string;
  label: string;
  enabled: boolean;
}

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  columns: ExportColumn[];
  rowCount: number;
  selectedCount?: number;
  defaultFilename: string;
  onExport: (options: {
    format: ExportFormat;
    scope: ExportScope;
    columns: string[];
    filename: string;
  }) => void;
}

export function ExportModal({
  open,
  onOpenChange,
  title,
  description,
  columns: initialColumns,
  rowCount,
  selectedCount = 0,
  defaultFilename,
  onExport,
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [scope, setScope] = useState<ExportScope>(selectedCount > 0 ? "selected" : "current");
  const [columns, setColumns] = useState<ExportColumn[]>(initialColumns);
  const [filename, setFilename] = useState(defaultFilename);
  const [allColumnsSelected, setAllColumnsSelected] = useState(true);

  const handleToggleAllColumns = (checked: boolean) => {
    setAllColumnsSelected(checked);
    setColumns(columns.map(col => ({ ...col, enabled: checked })));
  };

  const handleToggleColumn = (columnId: string, enabled: boolean) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, enabled } : col
    ));
    setAllColumnsSelected(columns.every(col => col.id === columnId ? enabled : col.enabled));
  };

  const handleExport = () => {
    const enabledColumns = allColumnsSelected 
      ? columns.map(col => col.id)
      : columns.filter(col => col.enabled).map(col => col.id);

    if (enabledColumns.length === 0) {
      return; // Don't export if no columns selected
    }

    onExport({
      format,
      scope,
      columns: enabledColumns,
      filename,
    });

    onOpenChange(false);
  };

  const getExportRowCount = () => {
    if (scope === "selected") return selectedCount;
    if (scope === "all") return rowCount;
    return rowCount; // "current" view
  };

  const enabledColumnsCount = columns.filter(col => col.enabled).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-5">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(value: any) => setFormat(value)}>
              <div className="grid grid-cols-3 gap-3">
                <div className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all
                               ${format === "csv" 
                                 ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20" 
                                 : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                     onClick={() => setFormat("csv")}>
                  <RadioGroupItem value="csv" id="csv" className="sr-only" />
                  <Label htmlFor="csv" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <span className="text-sm font-medium">CSV</span>
                    </div>
                  </Label>
                </div>

                <div className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all
                               ${format === "excel" 
                                 ? "border-green-600 bg-green-50 dark:bg-green-900/20" 
                                 : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                     onClick={() => setFormat("excel")}>
                  <RadioGroupItem value="excel" id="excel" className="sr-only" />
                  <Label htmlFor="excel" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                      <span className="text-sm font-medium">Excel</span>
                    </div>
                  </Label>
                </div>

                <div className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all
                               ${format === "pdf" 
                                 ? "border-red-600 bg-red-50 dark:bg-red-900/20" 
                                 : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                     onClick={() => setFormat("pdf")}>
                  <RadioGroupItem value="pdf" id="pdf" className="sr-only" />
                  <Label htmlFor="pdf" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <TableIcon className="w-8 h-8 text-red-600" />
                      <span className="text-sm font-medium">PDF</span>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Scope Selection */}
          <div className="space-y-3">
            <Label>Data Range</Label>
            <RadioGroup value={scope} onValueChange={(value: any) => setScope(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="current" id="current" />
                <Label htmlFor="current" className="cursor-pointer">
                  Current view ({rowCount} rows)
                </Label>
              </div>
              {selectedCount > 0 && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="selected" id="selected" />
                  <Label htmlFor="selected" className="cursor-pointer">
                    Selected rows only ({selectedCount} rows)
                  </Label>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer">
                  All data ({rowCount} rows)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Column Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Columns to Include</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={allColumnsSelected}
                  onCheckedChange={handleToggleAllColumns}
                />
                <Label htmlFor="select-all" className="cursor-pointer text-sm">
                  Select All
                </Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-3 border rounded-lg">
              {columns.map((column) => (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.id}
                    checked={column.enabled}
                    onCheckedChange={(checked) => handleToggleColumn(column.id, checked as boolean)}
                  />
                  <Label htmlFor={column.id} className="cursor-pointer text-sm">
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {enabledColumnsCount} of {columns.length} columns selected
            </p>
          </div>

          {/* Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">File Name</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename"
            />
          </div>

          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Ready to export <strong>{getExportRowCount()} rows</strong> with{" "}
              <strong>{enabledColumnsCount} columns</strong> as{" "}
              <strong>{format.toUpperCase()}</strong>
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={enabledColumnsCount === 0}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export ({getExportRowCount()} rows)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
