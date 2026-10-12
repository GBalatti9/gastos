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
  Pencil,
  SlidersHorizontal,
  Search,
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
import { Spinner } from '@/components/ui/spinner'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
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
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from '@/components/ui/drawer'
import { cn } from '@/lib/utils'

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
  /** IDs de gastos que son liquidaciones de deuda (se marcan con badge). */
  liquidaciones?: string[]
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
  esLiquidacion: boolean
  monto: number
  miParte: number
  simbolo: string
  vencimiento: string
  estado: string
  meses: string[]
}

const fmtMonto = (simbolo: string, n: number) => `${simbolo} ${Math.round(n).toLocaleString('es-AR')}`

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

function FiltroSelect({
  label,
  value,
  onChange,
  children,
  className,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={(v) => onChange((v as string) ?? '')}>
        <SelectTrigger size="sm" className={cn('w-full md:w-36', className)}>
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>{children}</SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export function GastosDataTable({ gastos, pagos, categorias, usuarios, mostrarTipo, miPartes, conFiltros, liquidaciones }: Props) {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'vencimiento', desc: true },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [deleting, setDeleting] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const anioActual = String(new Date().getFullYear())
  const [anioFilter, setAnioFilter] = React.useState(anioActual)
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
          esLiquidacion: liquidaciones?.includes(gasto.id) ?? false,
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
    [gastos, pagos, categorias, usuarios, miPartes, liquidaciones]
  )

  // Años disponibles para el filtro (más recientes primero)
  const anioOptions = React.useMemo(() => {
    if (!conFiltros) return []
    return [...new Set(rows.flatMap((r) => r.meses.map((m) => m.slice(0, 4))))]
      .sort()
      .reverse()
  }, [rows, conFiltros])

  // Meses disponibles (MM únicos) dentro del año seleccionado
  const mesOptions = React.useMemo(() => {
    if (!conFiltros) return []
    return [
      ...new Set(
        rows
          .flatMap((r) => r.meses)
          .filter((m) => anioFilter === 'todos' || m.startsWith(anioFilter))
          .map((m) => m.slice(5, 7))
      ),
    ].sort()
  }, [rows, conFiltros, anioFilter])

  const filteredRows = React.useMemo(() => {
    if (!conFiltros) return rows
    return rows.filter((r) => {
      const matchFecha =
        anioFilter === 'todos' && mesFilter === 'todos'
          ? true
          : r.meses.some(
              (m) =>
                (anioFilter === 'todos' || m.startsWith(anioFilter)) &&
                (mesFilter === 'todos' || m.slice(5, 7) === mesFilter)
            )
      return matchFecha && (estadoFilter === 'todos' || r.estado === estadoFilter)
    })
  }, [rows, conFiltros, anioFilter, mesFilter, estadoFilter])

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
            {row.original.esLiquidacion && (
              <Badge variant="secondary" className="ml-1">Liquidación</Badge>
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
              filterFn: 'equals',
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
                  {fmtMonto(row.original.simbolo, row.original.miParte)}
                </div>
              ),
            },
          ] satisfies ColumnDef<GastoRow>[])
        : []),
      {
        id: 'acciones',
        header: () => <span className="sr-only">Acciones</span>,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Editar gasto"
            render={<Link href={`/gastos/${row.original.id}`} />}
            nativeButton={false}
          >
            <Pencil />
          </Button>
        ),
        enableSorting: false,
      },
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
  const tipoFilterValue = table.getColumn('esPersonal')?.getFilterValue() as
    | boolean
    | undefined
  const tipoFilter =
    tipoFilterValue === undefined ? 'todos' : tipoFilterValue ? 'personal' : 'compartido'

  const filtrosActivos =
    (catFilter !== 'todas' ? 1 : 0) +
    (tipoFilter !== 'todos' ? 1 : 0) +
    (conFiltros
      ? (anioFilter !== anioActual ? 1 : 0) +
        (mesFilter !== 'todos' ? 1 : 0) +
        (pagadorFilter !== 'todos' ? 1 : 0) +
        (estadoFilter !== 'activo' ? 1 : 0)
      : 0)

  function limpiarFiltros() {
    table.getColumn('categoria')?.setFilterValue(undefined)
    table.getColumn('esPersonal')?.setFilterValue(undefined)
    table.getColumn('pagadorNombre')?.setFilterValue(undefined)
    setAnioFilter(anioActual)
    setMesFilter('todos')
    setEstadoFilter('activo')
  }

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

  // Los mismos controles de filtro se usan inline (desktop) y en un Drawer (mobile)
  const filtros = (
    <>
      <FiltroSelect
        label="Categoría"
        value={catFilter}
        onChange={(v) => table.getColumn('categoria')?.setFilterValue(v === 'todas' ? undefined : v)}
        className="md:w-40"
      >
        <SelectItem value="todas">Todas</SelectItem>
        {categorias.map((c) => (
          <SelectItem key={c.id} value={c.nombre}>
            {c.icono} {c.nombre}
          </SelectItem>
        ))}
      </FiltroSelect>
      {mostrarTipo && (
        <FiltroSelect
          label="Tipo"
          value={tipoFilter}
          onChange={(v) => table.getColumn('esPersonal')?.setFilterValue(v === 'todos' ? undefined : v === 'personal')}
        >
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="personal">Personal</SelectItem>
          <SelectItem value="compartido">Compartido</SelectItem>
        </FiltroSelect>
      )}
      {conFiltros && (
        <>
          <FiltroSelect
            label="Año"
            value={anioFilter}
            onChange={(v) => {
              setAnioFilter(v || 'todos')
              setMesFilter('todos')
            }}
            className="md:w-28"
          >
            <SelectItem value="todos">Todos</SelectItem>
            {anioOptions.map((anio) => (
              <SelectItem key={anio} value={anio}>
                {anio}
              </SelectItem>
            ))}
          </FiltroSelect>
          <FiltroSelect label="Mes" value={mesFilter} onChange={(v) => setMesFilter(v || 'todos')} className="capitalize">
            <SelectItem value="todos">Todos los meses</SelectItem>
            {mesOptions.map((mes) => (
              <SelectItem key={mes} value={mes} className="capitalize">
                {format(new Date(2000, Number(mes) - 1, 1), 'MMMM', { locale: es })}
              </SelectItem>
            ))}
          </FiltroSelect>
          <FiltroSelect
            label="Pagador"
            value={pagadorFilter}
            onChange={(v) => table.getColumn('pagadorNombre')?.setFilterValue(v === 'todos' ? undefined : v)}
            className="md:w-32"
          >
            <SelectItem value="todos">Todos</SelectItem>
            {usuarios.map((u) => (
              <SelectItem key={u.email} value={u.nombre}>
                {u.nombre}
              </SelectItem>
            ))}
          </FiltroSelect>
          <FiltroSelect label="Estado" value={estadoFilter} onChange={(v) => setEstadoFilter(v || 'activo')} className="md:w-32">
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </FiltroSelect>
        </>
      )}
    </>
  )

  const eliminarDialog = seleccionados.length > 0 && (
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
            {deleting ? <Spinner data-icon="inline-start" /> : <Trash2 data-icon="inline-start" />}
            Eliminar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  const pageRows = table.getRowModel().rows
  const totalFiltrado = table.getFilteredRowModel().rows.length

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1 md:flex-none">
          <span className="hidden text-xs font-medium text-muted-foreground md:block">Buscar</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar gasto…"
              aria-label="Buscar gasto"
              value={(table.getColumn('descripcion')?.getFilterValue() as string) ?? ''}
              onChange={(e) =>
                table.getColumn('descripcion')?.setFilterValue(e.target.value)
              }
              className="w-full pl-8 text-base md:max-w-56 md:text-sm"
            />
          </div>
        </div>

        {/* Mobile: filtros en drawer */}
        <div className="md:hidden">
          <Drawer showSwipeHandle>
            <DrawerTrigger render={<Button variant="outline" />}>
              <SlidersHorizontal data-icon="inline-start" />
              Filtros
              {filtrosActivos > 0 && <Badge className="ml-1">{filtrosActivos}</Badge>}
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Filtros</DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-col gap-4 overflow-y-auto p-4">{filtros}</div>
              <DrawerFooter className="flex-row pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Button variant="outline" className="flex-1" onClick={limpiarFiltros}>
                  Limpiar
                </Button>
                <DrawerClose render={<Button className="flex-1" />}>Ver {totalFiltrado}</DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Desktop: filtros inline */}
        <div className="hidden flex-wrap items-end gap-2 md:flex">{filtros}</div>

        <div className="ml-auto flex items-center gap-2">
          {eliminarDialog}
          <Badge variant="secondary">{totalFiltrado} gastos</Badge>
        </div>
      </div>

      {/* Mobile: lista */}
      <div className="flex flex-col gap-2 md:hidden">
        {pageRows.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Sin gastos</EmptyTitle>
              <EmptyDescription>No hay gastos que coincidan con los filtros.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          pageRows.map((row) => {
            const r = row.original
            return (
              <div
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 data-[state=selected]:border-primary/40 data-[state=selected]:bg-accent/40"
              >
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(!!value)}
                  aria-label="Seleccionar gasto"
                />
                <Link href={`/gastos/${r.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
                    {r.icono}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium">{r.descripcion}</p>
                      {r.estado === 'cancelado' && <Badge variant="destructive">Cancelado</Badge>}
                      {r.esLiquidacion && <Badge variant="secondary">Liq.</Badge>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.categoria} · {r.pagadorNombre}
                      {r.esCuotas && ` · ${r.cuotasPagadas}/${r.cuotasTotal}`}
                      {mostrarTipo && r.esPersonal && ' · personal'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {fmtMonto(r.simbolo, r.monto)}
                    </p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {miPartes ? `mi parte ${fmtMonto(r.simbolo, r.miParte)}` : r.vencimiento}
                    </p>
                  </div>
                </Link>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
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
              {pageRows.length ? (
                pageRows.map((row) => (
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
          {seleccionados.length} de {totalFiltrado} seleccionados
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
              size="icon-lg"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Página anterior</span>
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-lg"
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
