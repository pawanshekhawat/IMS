import React from 'react';

export interface TableColumn<T> {
  header: string;
  accessor?: keyof T | ((item: T) => React.ReactNode);
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found',
  onRowClick,
}: TableProps<T>) {
  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      overflowX: 'auto',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-neutral-300)',
      background: 'var(--color-neutral-50)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{
            backgroundColor: 'var(--color-neutral-200)',
            borderBottom: '1px solid var(--color-neutral-300)',
          }}>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  padding: '12px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--color-neutral-700)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: col.width,
                  textAlign: col.align || 'left',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '40px 16px',
                  textAlign: 'center',
                  color: 'var(--color-neutral-500)',
                  fontSize: '14px',
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                style={{
                  borderBottom: '1px solid var(--color-neutral-250)',
                  transition: 'background-color 0.1s ease',
                  cursor: onRowClick ? 'pointer' : 'default',
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) e.currentTarget.style.backgroundColor = 'var(--color-neutral-200)';
                }}
                onMouseLeave={(e) => {
                  if (onRowClick) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    style={{
                      padding: '14px 16px',
                      fontSize: '13px',
                      color: 'var(--color-neutral-900)',
                      textAlign: col.align || 'left',
                      verticalAlign: 'middle',
                      width: col.width,
                    }}
                  >
                    {typeof col.accessor === 'function'
                      ? col.accessor(item)
                      : col.accessor
                      ? (item[col.accessor] as unknown as React.ReactNode)
                      : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
