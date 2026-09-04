import { useMemo, useState } from 'react'
import { ChevronUp, ChevronDown, Search } from 'lucide-react'
import Button from './Button'
import Input from './Input'

const Table = ({
  columns,
  data,
  sortable = true,
  searchable = true,
  pagination = true,
  pageSize = 10,
  onRowClick,
  emptyMessage = 'No data found',
  className = '',
  /**
   * Optional per-row card for narrow screens. A table with more than about
   * four columns can only be read on a phone by scrolling sideways, which
   * hides whatever is rightmost — usually the row's own action buttons. When
   * this is supplied, phones get a stacked list and the table appears from
   * `md` up. Search and pagination are shared by both.
   */
  renderCard
}) => {
  const [sort, setSort] = useState({ key: null, direction: 'asc' })
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')

  const handleSort = (key) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Narrowing the result set must reset paging, otherwise a search made while
  // on a later page lands on an empty slice.
  const handleSearch = (value) => {
    setQuery(value)
    setPage(1)
  }

  const processed = useMemo(() => {
    let rows = [...(data ?? [])]

    if (query) {
      const needle = query.toLowerCase()
      rows = rows.filter((row) =>
        Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(needle))
      )
    }

    if (sort.key) {
      const factor = sort.direction === 'asc' ? 1 : -1
      rows.sort((a, b) => {
        const left = a[sort.key]
        const right = b[sort.key]
        if (left === right) return 0
        if (left === null || left === undefined) return 1
        if (right === null || right === undefined) return -1
        return (left < right ? -1 : 1) * factor
      })
    }

    return rows
  }, [data, query, sort])

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const rows = pagination ? processed.slice(start, start + pageSize) : processed

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="panel overflow-hidden">
        {/* Search belongs to the panel, not the page. Floating above it, a
            320px box against a 1100px table looked like a stray control and
            left an odd gap; as a header row the two read as one object at any
            width. Full width on phones, compact from `sm` up. */}
        {searchable && (
          <div
            className="border-b px-4 py-3"
            style={{ borderColor: 'var(--line-subtle)' }}
          >
            <div className="w-full sm:max-w-xs">
              <Input
                icon={Search}
                placeholder="Search…"
                value={query}
                onChange={(event) => handleSearch(event.target.value)}
                aria-label="Search table"
              />
            </div>
          </div>
        )}

        {renderCard && rows.length > 0 && (
          <div className="divide-y divide-[color:var(--line-subtle)] md:hidden">
            {rows.map((row, rowIndex) => (
              <div
                key={row.id ?? rowIndex}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={
                  onRowClick ? 'cursor-pointer transition-colors hover:bg-[color:var(--surface-hover)]' : ''
                }
              >
                {renderCard(row, rowIndex)}
              </div>
            ))}
          </div>
        )}

        <div className={`overflow-x-auto ${renderCard ? 'hidden md:block' : ''}`}>
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--surface-overlay)' }}>
                {columns.map((column) => {
                  const canSort = sortable && column.sortable !== false
                  const isSorted = sort.key === column.key

                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={
                        isSorted
                          ? sort.direction === 'asc' ? 'ascending' : 'descending'
                          : undefined
                      }
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-faint"
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={() => handleSort(column.key)}
                          className="focus-ring inline-flex items-center gap-1.5 rounded transition-colors hover:text-strong"
                        >
                          {column.title}
                          <span className="flex flex-col">
                            <ChevronUp
                              className={`h-2.5 w-2.5 ${
                                isSorted && sort.direction === 'asc' ? 'text-violet-400' : 'text-faint'
                              }`}
                            />
                            <ChevronDown
                              className={`-mt-0.5 h-2.5 w-2.5 ${
                                isSorted && sort.direction === 'desc' ? 'text-violet-400' : 'text-faint'
                              }`}
                            />
                          </span>
                        </button>
                      ) : (
                        column.title
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-[color:var(--line-subtle)]">
              {rows.map((row, rowIndex) => (
                <tr
                  key={row.id ?? rowIndex}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-[color:var(--surface-hover)]' : ''
                  }`}
                >
                  {columns.map((column) => (
                    <td
                      key={`${row.id ?? rowIndex}-${column.key}`}
                      className="px-4 py-3 text-sm text-muted"
                    >
                      {column.render
                        ? column.render(row[column.key], row, rowIndex)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-muted">{emptyMessage}</p>
            {query && (
              <p className="mt-1 text-xs text-faint">Try a different search term.</p>
            )}
          </div>
        )}
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-faint">
            {start + 1}–{Math.min(start + pageSize, processed.length)} of {processed.length}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === 1}
              onClick={() => setPage(safePage - 1)}
            >
              Previous
            </Button>
            <span className="numeric text-xs text-faint">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === totalPages}
              onClick={() => setPage(safePage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Table
