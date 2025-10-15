import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/Spinner';
import { Modal } from '@/components/Modal';
import styles from './AdminPage.module.css';

type ColumnType =
  | 'id'
  | 'text'
  | 'email'
  | 'url'
  | 'datetime'
  | 'boolean'
  | 'array'
  | 'json'
  | 'number'
  | 'status'
  | 'message';

type SortDirection = 'asc' | 'desc';

type PageIndicator = number | 'ellipsis';

interface AdminTableColumn {
  key: string;
  label: string;
  type?: ColumnType;
  enumLabels?: Record<string, string>;
  width?: string;
  highlight?: boolean;
  defaultSortDirection?: SortDirection;
  sortable?: boolean;
}

interface AdminTable {
  key: string;
  label: string;
  description?: string;
  primaryKey?: string;
  defaultSort?: string;
  defaultSortDirection?: SortDirection;
  columns?: AdminTableColumn[];
}

type ModalMode = 'create' | 'edit';

const classNames = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ');

const ROW_LIMIT = 500;
const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = [25, 50, 100];

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const formatDateTime = (value: unknown) => {
  if (!value) return '';
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return String(value);
  return dateFormatter.format(date);
};

const stringIncludes = (value: unknown, term: string): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.toLowerCase().includes(term);
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).toLowerCase().includes(term);
  }
  if (Array.isArray(value)) {
    return value.some((item) => stringIncludes(item, term));
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value).toLowerCase().includes(term);
    } catch (error) {
      console.warn('Failed to stringify value for search', error);
      return false;
    }
  }
  return false;
};

const getComparableValue = (
  value: unknown,
  column?: AdminTableColumn
): number | string => {
  if (value === null || value === undefined) {
    if (column?.type === 'number' || column?.type === 'datetime') {
      return Number.NEGATIVE_INFINITY;
    }
    return '';
  }

  switch (column?.type) {
    case 'number':
      return typeof value === 'number'
        ? value
        : Number(value) || Number.NEGATIVE_INFINITY;
    case 'datetime': {
      const timestamp = Date.parse(String(value));
      return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
    }
    case 'boolean':
      return value ? 1 : 0;
    case 'array':
      return Array.isArray(value) ? value.length : 0;
    case 'json':
      return (() => {
        try {
          return JSON.stringify(value);
        } catch {
          return '';
        }
      })();
    default:
      break;
  }

  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return String(value).toLowerCase();
};

const ADMIN_TABLES: AdminTable[] = [
  {
    key: 'students',
    label: '学生',
    description: '学生ユーザーの基本情報',
    primaryKey: 'id',
    defaultSort: 'created_at',
    defaultSortDirection: 'desc',
    columns: [
      { key: 'id', label: 'ID', type: 'id', width: '180px' },
      { key: 'name', label: '氏名', type: 'text', highlight: true },
      { key: 'email', label: 'メールアドレス', type: 'email', width: '220px' },
      { key: 'school_name', label: '学校名', type: 'text' },
      { key: 'instagram_url', label: 'Instagram', type: 'url', width: '200px' },
      { key: 'created_at', label: '登録日', type: 'datetime', width: '160px' },
      { key: 'updated_at', label: '更新日', type: 'datetime', width: '160px' },
    ],
  },
  {
    key: 'salons',
    label: 'サロン',
    description: 'サロンユーザーのプロフィール',
    primaryKey: 'id',
    defaultSort: 'created_at',
    defaultSortDirection: 'desc',
    columns: [
      { key: 'id', label: 'ID', type: 'id', width: '180px' },
      { key: 'salon_name', label: 'サロン名', type: 'text', highlight: true },
      { key: 'email', label: 'メールアドレス', type: 'email', width: '220px' },
      { key: 'phone_number', label: '電話番号', type: 'text', width: '150px' },
      { key: 'address', label: '住所', type: 'text', width: '260px' },
      { key: 'created_at', label: '登録日', type: 'datetime', width: '160px' },
      { key: 'updated_at', label: '更新日', type: 'datetime', width: '160px' },
    ],
  },
  {
    key: 'recruitments',
    label: '募集',
    description: '募集スロットや条件の管理',
    primaryKey: 'id',
    defaultSort: 'created_at',
    defaultSortDirection: 'desc',
    columns: [
      { key: 'id', label: 'ID', type: 'id', width: '180px' },
      { key: 'salon_id', label: 'サロンID', type: 'id', width: '180px' },
      { key: 'title', label: 'タイトル', type: 'text', highlight: true, width: '240px' },
      { key: 'status', label: 'ステータス', type: 'status', width: '120px' },
      {
        key: 'payment_type',
        label: '報酬',
        type: 'status',
        width: '120px',
        enumLabels: { free: '無料', paid: '有償' },
      },
      { key: 'has_reward', label: '特典', type: 'boolean', width: '90px' },
      { key: 'available_dates', label: '予約枠', type: 'array', width: '140px' },
      { key: 'is_fully_booked', label: '満席', type: 'boolean', width: '90px' },
      { key: 'created_at', label: '作成日', type: 'datetime', width: '160px' },
      { key: 'updated_at', label: '更新日', type: 'datetime', width: '160px' },
    ],
  },
  {
    key: 'reservations',
    label: '予約',
    description: '予約と進捗の管理',
    primaryKey: 'id',
    defaultSort: 'created_at',
    defaultSortDirection: 'desc',
    columns: [
      { key: 'id', label: 'ID', type: 'id', width: '180px' },
      { key: 'recruitment_id', label: '募集ID', type: 'id', width: '180px' },
      { key: 'student_id', label: '学生ID', type: 'id', width: '180px' },
      { key: 'salon_id', label: 'サロンID', type: 'id', width: '180px' },
      { key: 'status', label: 'ステータス', type: 'status', width: '130px' },
      {
        key: 'reservation_datetime',
        label: '予約日時',
        type: 'datetime',
        width: '170px',
      },
      {
        key: 'is_chat_consultation',
        label: '事前相談',
        type: 'boolean',
        width: '110px',
      },
      { key: 'created_at', label: '作成日', type: 'datetime', width: '160px' },
      { key: 'updated_at', label: '更新日', type: 'datetime', width: '160px' },
    ],
  },
  {
    key: 'reservation_messages',
    label: 'チャット',
    description: '予約に紐づく連絡履歴',
    primaryKey: 'id',
    defaultSort: 'created_at',
    defaultSortDirection: 'desc',
    columns: [
      { key: 'id', label: 'ID', type: 'id', width: '180px' },
      { key: 'reservation_id', label: '予約ID', type: 'id', width: '180px' },
      {
        key: 'sender_type',
        label: '送信者',
        type: 'status',
        width: '100px',
        enumLabels: { student: '学生', salon: 'サロン' },
        defaultSortDirection: 'asc',
      },
      { key: 'message', label: 'メッセージ', type: 'message', width: '320px', highlight: true },
      { key: 'created_at', label: '送信日時', type: 'datetime', width: '170px' },
    ],
  },
];

const TABLE_CONFIG = ADMIN_TABLES.reduce<Record<string, AdminTable>>(
  (acc, table) => {
    acc[table.key] = table;
    return acc;
  },
  {}
);

export const AdminPage = () => {
  const [selectedTable, setSelectedTable] = useState<string>(
    ADMIN_TABLES[0]?.key ?? ''
  );
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalValue, setModalValue] = useState('{\n  \n}');
  const [modalError, setModalError] = useState<string | null>(null);
  const [workingRow, setWorkingRow] = useState<Record<string, unknown> | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(
    ADMIN_TABLES[0]?.defaultSort ?? null
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    ADMIN_TABLES[0]?.defaultSortDirection ?? 'desc'
  );
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewRow, setViewRow] = useState<Record<string, unknown> | null>(null);

  const currentTable =
    useMemo(() => TABLE_CONFIG[selectedTable], [selectedTable]) ??
    ADMIN_TABLES[0];

  const fetchRows = useCallback(async () => {
    if (!selectedTable) return;

    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      let query = supabase.from(selectedTable).select('*').limit(ROW_LIMIT);

      if (currentTable?.defaultSort) {
        query = query.order(currentTable.defaultSort, {
          ascending: (currentTable.defaultSortDirection ?? 'desc') === 'asc',
        });
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        console.error('Failed to fetch table data:', queryError);
        setError(`データの取得に失敗しました: ${queryError.message}`);
        setRows([]);
      } else {
        setRows(data ?? []);
        setCurrentPage(1);
        if ((data?.length ?? 0) >= ROW_LIMIT) {
          setFeedback(`最新${ROW_LIMIT}件を取得しました。絞り込みを活用してください。`);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTable, currentTable?.defaultSort, currentTable?.defaultSortDirection]);

  useEffect(() => {
    setSearchTerm('');
    setCurrentPage(1);
    setSortKey(currentTable?.defaultSort ?? null);
    setSortDirection(currentTable?.defaultSortDirection ?? 'desc');
  }, [selectedTable, currentTable?.defaultSort, currentTable?.defaultSortDirection]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const columnDefinitions = useMemo(() => {
    const baseColumns = currentTable?.columns ?? [];
    const knownKeys = new Set(baseColumns.map((column) => column.key));

    const dynamicKeys = new Set<string>();
    rows.forEach((row) => {
      Object.keys(row ?? {}).forEach((key) => {
        if (!knownKeys.has(key)) {
          dynamicKeys.add(key);
        }
      });
    });

    const dynamicColumns = Array.from(dynamicKeys)
      .sort()
      .map<AdminTableColumn>((key) => ({
        key,
        label: key,
        type: key.toLowerCase().includes('id') ? 'id' : undefined,
      }));

    return [...baseColumns, ...dynamicColumns];
  }, [currentTable?.columns, rows]);

  const columnLookup = useMemo(() => {
    const map = new Map<string, AdminTableColumn>();
    columnDefinitions.forEach((column) => {
      map.set(column.key, column);
    });
    return map;
  }, [columnDefinitions]);

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row) =>
      columnDefinitions.some((column) => stringIncludes(row[column.key], term))
    );
  }, [rows, searchTerm, columnDefinitions]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;

    const column = columnLookup.get(sortKey);
    const rowsToSort = [...filteredRows];
    rowsToSort.sort((a, b) => {
      const aValue = getComparableValue(a[sortKey], column);
      const bValue = getComparableValue(b[sortKey], column);

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }

      return String(aValue).localeCompare(String(bValue), 'ja', {
        numeric: true,
        sensitivity: 'base',
      });
    });

    return sortDirection === 'desc' ? rowsToSort.reverse() : rowsToSort;
  }, [filteredRows, sortKey, sortDirection, columnLookup]);

  const totalItems = sortedRows.length;
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [pageCount, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = sortedRows.slice(startIndex, startIndex + pageSize);

  const rangeLabel =
    totalItems === 0
      ? '0件'
      : `${startIndex + 1}-${Math.min(startIndex + pageSize, totalItems)}件 / ${totalItems}件`;

  const pageIndicators = useMemo<PageIndicator[]>(() => {
    if (pageCount <= 6) {
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    }

    const candidates = new Set<number>([
      1,
      pageCount,
      currentPage,
      currentPage - 1,
      currentPage + 1,
    ]);

    const sorted = Array.from(candidates)
      .filter((page) => page >= 1 && page <= pageCount)
      .sort((a, b) => a - b);

    const indicators: PageIndicator[] = [];

    sorted.forEach((page, index) => {
      indicators.push(page);
      const nextPage = sorted[index + 1];
      if (nextPage && nextPage - page > 1) {
        indicators.push('ellipsis');
      }
    });

    return indicators;
  }, [pageCount, currentPage]);

  const openCreateModal = () => {
    setModalMode('create');
    setWorkingRow(null);

    const template: Record<string, unknown> = {};
    columnDefinitions.forEach((column) => {
      if (column.key === currentTable?.primaryKey) return;
      switch (column.type) {
        case 'boolean':
          template[column.key] = false;
          break;
        case 'array':
          template[column.key] = [];
          break;
        case 'json':
          template[column.key] = {};
          break;
        default:
          template[column.key] = '';
          break;
      }
    });

    setModalValue(JSON.stringify(template, null, 2));
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (row: Record<string, unknown>) => {
    setModalMode('edit');
    setWorkingRow(row);
    setModalValue(JSON.stringify(row, null, 2));
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setModalError(null);
    setSaving(false);
  };

  const handleDelete = async (row: Record<string, unknown>) => {
    const primaryKey = currentTable?.primaryKey ?? 'id';
    const primaryValue = row?.[primaryKey];

    if (!primaryValue) {
      setFeedback(null);
      setError('このレコードには主キーが見つかりません。手動で削除してください。');
      return;
    }

    const confirmed = window.confirm(
      'このレコードを削除しますか？この操作は元に戻せません。'
    );
    if (!confirmed) return;

    setError(null);
    setFeedback(null);

    const { error: deleteError } = await supabase
      .from(selectedTable)
      .delete()
      .eq(primaryKey, primaryValue);

    if (deleteError) {
      console.error('Failed to delete row:', deleteError);
      setError(`削除に失敗しました: ${deleteError.message}`);
      return;
    }

    setFeedback('レコードを削除しました。');
    await fetchRows();
  };

  const handleModalSubmit = async () => {
    setSaving(true);
    setModalError(null);
    setError(null);
    setFeedback(null);

    let parsed: unknown;

    try {
      parsed = JSON.parse(modalValue);
    } catch (parseError: unknown) {
      const err = parseError as Error;
      setModalError(`JSONのパースに失敗しました: ${err.message}`);
      setSaving(false);
      return;
    }

    if (modalMode === 'create') {
      const payload = Array.isArray(parsed) ? parsed : [parsed];

      if (payload.length === 0) {
        setModalError('1件以上のレコードを指定してください。');
        setSaving(false);
        return;
      }

      const { error: insertError } = await supabase
        .from(selectedTable)
        .insert(payload);

      if (insertError) {
        console.error('Failed to insert row:', insertError);
        setModalError(`登録に失敗しました: ${insertError.message}`);
        setSaving(false);
        return;
      }

      setFeedback(`${payload.length}件のレコードを追加しました。`);
      closeEditModal();
      await fetchRows();
      return;
    }

    const primaryKey = currentTable?.primaryKey ?? 'id';
    const primaryValue = workingRow?.[primaryKey];

    if (!primaryValue) {
      setModalError('このレコードには主キーが見つかりません。');
      setSaving(false);
      return;
    }

    if (Array.isArray(parsed)) {
      setModalError('更新時は1件のオブジェクトのみ指定してください。');
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from(selectedTable)
      .update(parsed as Record<string, unknown>)
      .eq(primaryKey, primaryValue);

    if (updateError) {
      console.error('Failed to update row:', updateError);
      setModalError(`更新に失敗しました: ${updateError.message}`);
      setSaving(false);
      return;
    }

    setFeedback('レコードを更新しました。');
    closeEditModal();
    await fetchRows();
  };

  const handleSort = (columnKey: string) => {
    if (sortKey === columnKey) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      const column = columnLookup.get(columnKey);
      setSortKey(columnKey);
      setSortDirection(column?.defaultSortDirection ?? 'asc');
    }
    setCurrentPage(1);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  };

  const renderCellValue = (
    column: AdminTableColumn,
    row: Record<string, unknown>
  ) => {
    const rawValue = row[column.key];
    const rawString =
      typeof rawValue === 'string'
        ? rawValue
        : rawValue === null || rawValue === undefined
        ? ''
        : String(rawValue);
    const localizedValue = column.enumLabels?.[rawString] ?? rawString;

    switch (column.type) {
      case 'id':
        if (!rawString) return <span className={styles.muted}>-</span>;
        return (
          <span className={styles.codeCell} title={rawString}>
            {rawString}
          </span>
        );
      case 'email':
        if (!rawString) return <span className={styles.muted}>-</span>;
        return (
          <a href={`mailto:${rawString}`} className={styles.linkText}>
            {rawString}
          </a>
        );
      case 'url':
        if (!rawString) return <span className={styles.muted}>-</span>;
        return (
          <a
            href={rawString}
            target="_blank"
            rel="noreferrer"
            className={styles.linkText}
          >
            {rawString}
          </a>
        );
      case 'datetime':
        if (!rawValue) return <span className={styles.muted}>-</span>;
        return <span title={rawString}>{formatDateTime(rawValue)}</span>;
      case 'boolean':
        return (
          <span
            className={classNames(
              styles.booleanChip,
              rawValue ? styles.booleanTrueChip : styles.booleanFalseChip
            )}
          >
            {rawValue ? 'はい' : 'いいえ'}
          </span>
        );
      case 'array':
        if (!Array.isArray(rawValue)) {
          return <span className={styles.muted}>-</span>;
        }

        if (column.key === 'available_dates') {
          const total = rawValue.length;
          const openCount = rawValue.filter((item) => {
            if (!item || typeof item !== 'object') return false;
            const record = item as { is_booked?: boolean };
            return record.is_booked !== true;
          }).length;

          return (
            <span
              className={styles.arrayBadge}
              title={`空き: ${openCount} / 総数: ${total}`}
            >
              空き {openCount}/{total}
            </span>
          );
        }

        if (rawValue.length === 0) {
          return <span className={styles.muted}>0件</span>;
        }

        return (
          <div className={styles.arrayList}>
            {rawValue.slice(0, 3).map((item, index) => (
              <span
                key={`${column.key}-${index}`}
                className={styles.arrayBadge}
                title={String(item)}
              >
                {typeof item === 'object' ? '…' : String(item)}
              </span>
            ))}
            {rawValue.length > 3 && (
              <span className={styles.arrayBadge}>
                +{rawValue.length - 3}
              </span>
            )}
          </div>
        );
      case 'json':
        if (!rawValue) return <span className={styles.muted}>-</span>;
        try {
          const jsonText = JSON.stringify(rawValue);
          return (
            <span className={styles.jsonSummary} title={jsonText}>
              {jsonText.length > 80 ? `${jsonText.slice(0, 80)}…` : jsonText}
            </span>
          );
        } catch (error) {
          console.warn('Failed to stringify JSON column', error);
          return <span className={styles.muted}>N/A</span>;
        }
      case 'number':
        if (rawValue === null || rawValue === undefined) {
          return <span className={styles.muted}>-</span>;
        }
        return (
          <span>
            {new Intl.NumberFormat('ja-JP').format(Number(rawValue))}
          </span>
        );
      case 'status': {
        if (!rawString) return <span className={styles.muted}>-</span>;
        const normalized = rawString.toLowerCase();
        let variant = styles.statusDefault;

        if (['active', 'enabled', 'open', 'paid'].includes(normalized)) {
          variant = styles.statusActive;
        } else if (['closed', 'inactive', 'disabled'].includes(normalized)) {
          variant = styles.statusClosed;
        } else if (['pending', 'free'].includes(normalized)) {
          variant = styles.statusPending;
        } else if (['confirmed'].includes(normalized)) {
          variant = styles.statusConfirmed;
        } else if (normalized.startsWith('cancel')) {
          variant = styles.statusWarning;
        } else if (['student', 'salon'].includes(normalized)) {
          variant = styles.statusNeutral;
        }

        return (
          <span
            className={classNames(styles.statusBadge, variant)}
            title={rawString}
          >
            {localizedValue || rawString}
          </span>
        );
      }
      case 'message':
        if (!rawString) return <span className={styles.muted}>-</span>;
        return (
          <span className={styles.messageCell} title={rawString}>
            {rawString}
          </span>
        );
      default:
        if (!rawString) return <span className={styles.muted}>-</span>;
        return <span>{localizedValue || rawString}</span>;
    }
  };

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <h1 className={styles.title}>管理ツール</h1>
        <ul className={styles.tableList}>
          {ADMIN_TABLES.map((table) => (
            <li
              key={table.key}
              className={classNames(
                styles.tableItem,
                selectedTable === table.key && styles.active
              )}
              onClick={() => setSelectedTable(table.key)}
            >
              {table.label}
            </li>
          ))}
        </ul>
      </aside>

      <section className={styles.content}>
        <header className={styles.contentHeader}>
          <div>
            <h2 className={styles.contentTitle}>
              {currentTable?.label ?? selectedTable}
            </h2>
            {currentTable?.description && (
              <p className={styles.description}>{currentTable.description}</p>
            )}
            <p className={styles.meta}>
              全{rows.length}件中 {filteredRows.length}件を対象に表示
              （最大{ROW_LIMIT}件）
            </p>
          </div>
          <div className={styles.actionGroup}>
            <button
              className={classNames(styles.button, styles.ghostButton)}
              onClick={fetchRows}
            >
              再読み込み
            </button>
            <button
              className={classNames(styles.button, styles.primaryButton)}
              onClick={openCreateModal}
            >
              新規作成
            </button>
          </div>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.searchInputWrapper}>
              <input
                value={searchTerm}
                onChange={handleSearchChange}
                className={styles.searchInput}
                placeholder="キーワードで絞り込み（ID、氏名、ステータス など）"
                aria-label="データの検索"
              />
            </div>
          </div>
          <div className={styles.toolbarRight}>
            <span className={styles.toolbarStat}>{rangeLabel}</span>
            <label className={styles.toolbarStat}>
              表示件数
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className={styles.pageSizeSelect}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {feedback && <div className={styles.feedback}>{feedback}</div>}

        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.loader}>
              <Spinner />
            </div>
          ) : (
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th className={styles.headerCell}>操作</th>
                  {columnDefinitions.map((column) => {
                    const isSortable =
                      column.sortable ?? !['json'].includes(column.type ?? '');
                    const isActiveSort = sortKey === column.key;
                    const headerStyle = column.width
                      ? { width: column.width, minWidth: column.width }
                      : undefined;

                    return (
                      <th
                        key={column.key}
                        className={styles.headerCell}
                        style={headerStyle}
                      >
                        {isSortable ? (
                          <button
                            type="button"
                            className={classNames(
                              styles.sortButton,
                              isActiveSort && styles.sortActive
                            )}
                            onClick={() => handleSort(column.key)}
                          >
                            <span>{column.label}</span>
                            <span className={styles.sortIcon}>
                              {isActiveSort
                                ? sortDirection === 'asc'
                                  ? '▲'
                                  : '▼'
                                : '⇅'}
                            </span>
                          </button>
                        ) : (
                          column.label
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedRows.length === 0 ? (
                  <tr>
                    <td
                      className={styles.emptyCell}
                      colSpan={columnDefinitions.length + 1}
                    >
                      {searchTerm
                        ? '検索条件に一致するデータがありません。'
                        : 'データがありません。'}
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => {
                    const primaryKey = currentTable?.primaryKey ?? 'id';
                    const rowKey =
                      (row?.[primaryKey] as string | number | undefined) ??
                      JSON.stringify(row);

                    return (
                      <tr key={rowKey} className={styles.tableRow}>
                        <td className={styles.actionCell}>
                          <button
                            className={classNames(
                              styles.smallButton,
                              styles.infoButton
                            )}
                            onClick={() => setViewRow(row)}
                          >
                            詳細
                          </button>
                          <button
                            className={classNames(
                              styles.smallButton,
                              styles.ghostButton
                            )}
                            onClick={() => openEditModal(row)}
                          >
                            編集
                          </button>
                          <button
                            className={classNames(
                              styles.smallButton,
                              styles.dangerButton
                            )}
                            onClick={() => handleDelete(row)}
                          >
                            削除
                          </button>
                        </td>
                        {columnDefinitions.map((column) => {
                          const cellStyle = column.width
                            ? { width: column.width, minWidth: column.width }
                            : undefined;
                          const cellClassName = classNames(
                            styles.dataCell,
                            column.highlight && styles.highlightCell,
                            column.type === 'message' && styles.wrapCell
                          );

                          return (
                            <td
                              key={`${rowKey}-${column.key}`}
                              className={cellClassName}
                              style={cellStyle}
                            >
                              {renderCellValue(column, row)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {sortedRows.length > 0 && (
          <div className={styles.paginationBar}>
            <div className={styles.paginationInfo}>{rangeLabel}</div>
            <div className={styles.paginationControls}>
              <button
                className={styles.paginationButton}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                前へ
              </button>
              {pageIndicators.map((indicator, index) =>
                indicator === 'ellipsis' ? (
                  <span key={`ellipsis-${index}`} className={styles.paginationEllipsis}>
                    …
                  </span>
                ) : (
                  <button
                    key={indicator}
                    className={classNames(
                      styles.paginationButton,
                      indicator === currentPage &&
                        styles.paginationButtonActive
                    )}
                    onClick={() => setCurrentPage(indicator)}
                  >
                    {indicator}
                  </button>
                )
              )}
              <button
                className={styles.paginationButton}
                onClick={() =>
                  setCurrentPage((page) => Math.min(pageCount, page + 1))
                }
                disabled={currentPage === pageCount}
              >
                次へ
              </button>
            </div>
          </div>
        )}
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={closeEditModal}
        title={modalMode === 'create' ? 'レコードを追加' : 'レコードを編集'}
        size="lg"
      >
        <div className={styles.modalBody}>
          <p className={styles.modalHint}>
            JSON形式でレコードを入力してください。新規作成は単一オブジェクトまたは配列を受け付けます。
          </p>
          <textarea
            className={styles.jsonTextarea}
            value={modalValue}
            onChange={(event) => setModalValue(event.target.value)}
            spellCheck={false}
            rows={18}
          />
          {modalError && <div className={styles.modalError}>{modalError}</div>}
          <div className={styles.modalActions}>
            <button
              className={classNames(styles.button, styles.ghostButton)}
              onClick={closeEditModal}
              disabled={saving}
            >
              キャンセル
            </button>
            <button
              className={classNames(styles.button, styles.primaryButton)}
              onClick={handleModalSubmit}
              disabled={saving}
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(viewRow)}
        onClose={() => setViewRow(null)}
        title="レコード詳細"
        size="lg"
      >
        <div className={styles.modalBody}>
          <p className={styles.modalHint}>
            JSON形式でレコードの内容を確認できます。編集する場合は「編集」ボタンを押してください。
          </p>
          <pre className={styles.jsonPreview}>
            {viewRow ? JSON.stringify(viewRow, null, 2) : ''}
          </pre>
          <div className={styles.modalActions}>
            <button
              className={classNames(styles.button, styles.ghostButton)}
              onClick={() => setViewRow(null)}
            >
              閉じる
            </button>
            {viewRow && (
              <button
                className={classNames(styles.button, styles.primaryButton)}
                onClick={() => {
                  openEditModal(viewRow);
                  setViewRow(null);
                }}
              >
                編集を開く
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
