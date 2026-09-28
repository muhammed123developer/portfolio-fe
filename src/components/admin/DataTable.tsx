import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/states'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ApiError } from '@/services/api'
import { cn } from '@/lib/utils'

/**
 * The admin table, used by every management screen.
 *
 * Handles loading, error and empty in one place so no screen can ship without
 * them, and so all six behave identically.
 *
 * Responsive by switching layout rather than by scrolling: below `md` each row
 * becomes a stacked card with its column headers as labels. A horizontally
 * scrolling table technically "works" on a phone but is miserable to use, and
 * the action buttons end up off-screen where nobody finds them.
 */

export interface Column<T> {
  /** Stable key for React and for the mobile label. */
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  /** Hide on mobile cards — useful for low-value columns. */
  hideOnMobile?: boolean
  className?: string
}

interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  loading?: boolean
  error?: ApiError | null
  onRetry?: () => void
  emptyTitle: string
  emptyMessage?: string
  emptyAction?: React.ReactNode
  /** Rendered at the right of each row/card. */
  actions?: (row: T) => React.ReactNode
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyMessage,
  emptyAction,
  actions,
}: DataTableProps<T>) {
  if (error) {
    return <ErrorState message={error.message} onRetry={onRetry} />
  }

  if (loading) {
    return <TableSkeleton rows={5} columns={Math.min(columns.length + 1, 5)} />
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />
  }

  return (
    <>
      {/* ------------------------------------------- Desktop: a table --- */}
      <div className="border-border/60 hidden overflow-hidden rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
              {actions && <TableHead className="w-16 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
                {actions && <TableCell className="text-right">{actions(row)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* --------------------------------------- Mobile: stacked cards --- */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className="border-border/60 bg-card space-y-2.5 rounded-lg border p-4"
          >
            {columns
              .filter((column) => !column.hideOnMobile)
              .map((column, index) => (
                <div
                  key={column.key}
                  className={cn(
                    index === 0
                      ? 'text-base font-medium'
                      : 'flex items-baseline justify-between gap-3 text-sm'
                  )}
                >
                  {/* The first column is the card's title, so it needs no
                      label; the rest are label/value pairs. */}
                  {index > 0 && (
                    <span className="text-muted-foreground shrink-0 text-xs">{column.header}</span>
                  )}
                  <span className={cn(index > 0 && 'text-right')}>{column.cell(row)}</span>
                </div>
              ))}

            {actions && (
              <div className="border-border/60 flex justify-end border-t pt-2.5">
                {actions(row)}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
