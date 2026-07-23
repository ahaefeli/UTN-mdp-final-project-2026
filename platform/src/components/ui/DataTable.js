import styles from './DataTable.module.css';

function hasRenderableRows(children) {
  if (children == null || children === false) return false;
  const list = Array.isArray(children) ? children.flat() : [children];
  return list.some((child) => child != null && child !== false);
}

export default function DataTable({ columns = [], children, emptyMessage = 'No hay datos.' }) {
  const hasRows = hasRenderableRows(children);

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key || col.label} style={col.width ? { width: col.width } : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasRows ? (
            children
          ) : (
            <tr>
              <td className={styles.emptyCell} colSpan={columns.length || 1}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
