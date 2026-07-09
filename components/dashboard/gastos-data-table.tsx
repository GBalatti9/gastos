'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Loader2,
} from 'lucide-react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Gasto, Pago, Categoria } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

interface Usuario {
  email: string
  nombre: string
}

interface Props {
  gastos: Gasto[]
  pagos: Pago[]
  categorias: Categoria[]
  usuarios: Usuario[]
  mostrarTipo?: boolean
  /** Mi costo por gasto (id → monto). Si está presente, agrega la columna "Mi parte". */
  miPartes?: Record<string, number>
  /** Agrega filtros de mes, pagador y estado en la toolbar (usado en /gastos). */
  conFiltros?: boolean
}

interface GastoRow {
  id: string
  descripcion: string
  categoria: string
  icono: string
  pagadorNombre: string
  cuotasPagadas: number
  cuotasTotal: number
  esCuotas: boolean
  esPersonal: boolean
  monto: number
  miParte: number
  simbolo: string
  vencimiento: string
  estado: string
  meses: string[]
}

function SortHeader({
  column,
  children,
  className,
}: {
  column: {
    getIsSorted: () => false | 'asc' | 'desc'
    toggleSorting: (desc?: boolean) => void
  }
  children: React.ReactNode
  className?: string
}) {
  const sorted = column.getIsSorted()
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`-ml-2 ${className ?? ''}`}
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {children}
      {sorted === 'asc' ? (
        <ArrowUp data-icon="inline-end" />
      ) : sorted === 'desc' ? (
        <ArrowDown data-icon="inline-end" />
      ) : (
        <ArrowUpDown data-icon="inline-end" />
      )}
    </Button>
  )
}

export function GastosDataTable({ gastos, pagos, categorias, usuarios, mostrarTipo, miPartes, conFiltros }: Props) {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'vencimiento', desc: true },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [deleting, setDeleting] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [mesFilter, setMesFilter] = React.useState('todos')
  const [estadoFilter, setEstadoFilter] = React.useState('activo')

  const rows = React.useMemo<GastoRow[]>(
    () =>
      gastos.map((gasto) => {
        const gastoPagos = pagos.filter((p) => p.gasto_id === gasto.id)
        const cat = categorias.find((c) => c.nombre === gasto.categoria)
        const pagador = usuarios.find((u) => u.email === gasto.pagado_por)
        return {
          id: gasto.id,
          descripcion: gasto.descripcion,
          categoria: gasto.categoria || 'Sin categoría',
          icono: cat?.icono || '📦',
          pagadorNombre: pagador?.nombre || gasto.pagado_por,
          cuotasPagadas: gastoPagos.filter((p) => p.estado === 'pagado').length,
          cuotasTotal: gastoPagos.length || gasto.cuotas,
          esCuotas: gasto.cuotas > 1,
          esPersonal: gasto.tipo_division === 'personal',
          monto: gasto.monto_total,
          miParte: miPartes?.[gasto.id] ?? 0,
          simbolo: gasto.moneda === 'USD' ? 'U$S' : '$',
          // Vencimiento de la primera cuota: define en qué mes cuenta el gasto
          vencimiento:
            gastoPagos.map((p) => p.fecha_vencimiento).sort()[0] || gasto.fecha_inicio,
          estado: gasto.estado,
          meses: [...new Set(gastoPagos.map((p) => p.fecha_vencimiento.slice(0, 7)))],
        }
      }),
    [gastos, pagos, categorias, usuarios, miPartes]
  )

  // Meses disponibles para el filtro (yyyy-MM únicos, más recientes primero)
  const mesOptions = React.useMemo(() => {
    if (!conFiltros) return []
    return [...new Set(rows.flatMap((r) => r.meses))].sort().reverse()
  }, [rows, conFiltros])

  const filteredRows = React.useMemo(() => {
    if (!conFiltros) return rows
    return rows.filter(
      (r) =>
        (mesFilter === 'todos' || r.meses.includes(mesFilter)) &&
        (estadoFilter === 'todos' || r.estado === estadoFilter)
    )
  }, [rows, conFiltros, mesFilter, estadoFilter])

  const columns = React.useMemo<ColumnDef<GastoRow>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Seleccionar todo"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Seleccionar fila"
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'descripcion',
        header: ({ column }) => <SortHeader column={column}>Descripción</SortHeader>,
        cell: ({ row }) => (
          <Link
            href={`/gastos/${row.original.id}`}
            className="flex items-center gap-2 font-medium hover:underline"
          >
            <span className="text-base leading-none">{row.original.icono}</span>
            <span className="truncate">{row.original.descripcion}</span>
            {row.original.estado === 'cancelado' && (
              <Badge variant="destructive" className="ml-1">Cancelado</Badge>
            )}
          </Link>
        ),
      },
      {
        accessorKey: 'categoria',
        header: ({ column }) => <SortHeader column={column}>Categoría</SortHeader>,
        cell: ({ row }) => (
          <Badge variant="outline" className="text-muted-foreground">
            {row.original.categoria}
          </Badge>
        ),
        filterFn: 'equals',
      },
      ...(mostrarTipo
        ? ([
            {
              accessorKey: 'esPersonal',
              header: 'Tipo',
              cell: ({ row }) => (
                <Badge variant={row.original.esPersonal ? 'secondary' : 'outline'}>
                  {row.original.esPersonal ? 'Personal' : 'Compartido'}
                </Badge>
              ),
              enableSorting: false,
            },
          ] satisfies ColumnDef<GastoRow>[])
        : []),
      {
        accessorKey: 'pagadorNombre',
        header: ({ column }) => <SortHeader column={column}>Pagado por</SortHeader>,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.pagadorNombre}</span>
        ),
        filterFn: 'equals',
      },
      {
        accessorKey: 'cuotasPagadas',
        header: () => <div className="text-center">Cuotas</div>,
        cell: ({ row }) => (
          <div className="text-center tabular-nums">
            {row.original.esCuotas
              ? `${row.original.cuotasPagadas}/${row.original.cuotasTotal}`
              : '—'}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'vencimiento',
        header: ({ column }) => <SortHeader column={column}>Vencimiento</SortHeader>,
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {row.original.vencimiento}
          </span>
        ),
      },
      {
        accessorKey: 'monto',
        header: ({ column }) => (
          <div className="flex justify-end">
            <SortHeader column={column} className="-mr-2 ml-0">
              Monto
            </SortHeader>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-medium tabular-nums">
            {row.original.simbolo} {row.original.monto.toLocaleString('es-AR')}
          </div>
        ),
      },
      ...(miPartes
        ? ([
            {
              accessorKey: 'miParte',
              header: ({ column }) => (
                <div className="flex justify-end">
                  <SortHeader column={column} className="-mr-2 ml-0">
                    Mi parte
                  </SortHeader>
                </div>
              ),
              cell: ({ row }) => (
                <div className="text-right font-medium tabular-nums">
                  {row.original.simbolo}{' '}
                  {Math.round(row.original.miParte).toLocaleString('es-AR')}
                </div>
              ),
            },
          ] satisfies ColumnDef<GastoRow>[])
        : []),
    ],
    [mostrarTipo, miPartes]
  )

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting, columnFilters, rowSelection },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const seleccionados = table.getFilteredSelectedRowModel().rows
  const catFilter = (table.getColumn('categoria')?.getFilterValue() as string) ?? 'todas'
  const pagadorFilter =
    (table.getColumn('pagadorNombre')?.getFilterValue() as string) ?? 'todos'

  async function handleEliminar() {
    setDeleting(true)
    try {
      const results = await Promise.all(
        seleccionados.map((r) =>
          fetch(`/api/gastos/${r.original.id}/cancelar`, { method: 'POST' })
        )
      )
      const fallidos = results.filter((r) => !r.ok).length
      if (fallidos > 0) {
        toast.error(`No se pudieron eliminar ${fallidos} gastos`)
      } else {
        toast.success(
          seleccionados.length === 1
            ? 'Gasto eliminado'
            : `${seleccionados.length} gastos eliminados`
        )
      }
      setRowSelection({})
      setConfirmOpen(false)
      router.refresh()
    } catch {
      toast.error('Error al eliminar los gastos')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar gasto..."
          value={(table.getColumn('descripcion')?.getFilterValue() as string) ?? ''}
          onChange={(e) =>
            table.getColumn('descripcion')?.setFilterValue(e.target.value)
          }
          className="w-full sm:max-w-56"
        />
        <Select
          value={catFilter}
          onValueChange={(v) =>
            table
              .getColumn('categoria')
              ?.setFilterValue(v === 'todas' ? undefined : v)
          }
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="todas">Todas</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.nombre}>
                  {c.icono} {c.nombre}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {conFiltros && (
          <>
            <Select value={mesFilter} onValueChange={(v) => setMesFilter(v ?? 'todos')}>
              <SelectTrigger size="sm" className="w-40 capitalize">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="todos">Todos los meses</SelectItem>
                  {mesOptions.map((mes) => {
                    const [y, m] = mes.split('-').map(Number)
                    return (
                      <SelectItem key={mes} value={mes} className="capitalize">
                        {format(new Date(y, m - 1, 1), 'MMMM yyyy', { locale: es })}
                      </SelectItem>
                    )
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={pagadorFilter}
              onValueChange={(v) =>
                table
                  .getColumn('pagadorNombre')
                  ?.setFilterValue(v === 'todos' ? undefined : v)
              }
            >
              <SelectTrigger size="sm" className="w-32">
                <SelectValue placeholder="Pagador" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="todos">Todos</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.email} value={u.nombre}>
                      {u.nombre}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={estadoFilter} onValueChange={(v) => setEstadoFilter(v ?? 'activo')}>
              <SelectTrigger size="sm" className="w-32">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="activo">Activos</SelectItem>
                  <SelectItem value="cancelado">Cancelados</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          {seleccionados.length > 0 && (
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                <Trash2 data-icon="inline-start" />
                Eliminar ({seleccionados.length})
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    ¿Eliminar {seleccionados.length === 1 ? 'este gasto' : `${seleccionados.length} gastos`}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Los gastos se marcarán como cancelados y dejarán de contar en el
                    saldo. Esta acción no se puede deshacer desde la app.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                  <Button variant="destructive" onClick={handleEliminar} disabled={deleting}>
                    {deleting ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <Trash2 data-icon="inline-start" />
                    )}
                    Eliminar
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Badge variant="secondary">{table.getFilteredRowModel().rows.length} gastos</Badge>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No hay gastos que coincidan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="hidden text-sm text-muted-foreground sm:block">
          {seleccionados.length} de {table.getFilteredRowModel().rows.length} seleccionados
        </div>
        <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
          <div className="text-sm font-medium">
            Página {table.getState().pagination.pageIndex + 1} de{' '}
            {Math.max(table.getPageCount(), 1)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              className="hidden sm:inline-flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Primera página</span>
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Página anterior</span>
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Página siguiente</span>
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="hidden sm:inline-flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Última página</span>
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
