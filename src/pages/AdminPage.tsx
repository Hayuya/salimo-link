import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/Spinner';
import { Modal } from '@/components/Modal';
import styles from './AdminPage.module.css';

interface AdminTable {
  key: string;
  label: string;
  primaryKey?: string;
  description?: string;
  defaultSort?: string;
}

const ADMIN_TABLES: AdminTable[] = [
  {
    key: 'students',
    label: '学生',
    description: '学生ユーザーの基本情報',
    primaryKey: 'id',
    defaultSort: 'created_at',
  },
  {
    key: 'salons',
    label: 'サロン',
    description: 'サロンユーザーのプロフィール',
    primaryKey: 'id',
    defaultSort: 'created_at',
  },
  {
    key: 'recruitments',
    label: '募集',
    description: '募集スロットや応募条件',
    primaryKey: 'id',
    defaultSort: 'created_at',
  },
  {
    key: 'reservations',
    label: '予約',
    description: '予約とステータスの履歴',
    primaryKey: 'id',
    defaultSort: 'created_at',
  },
  {
    key: 'reservation_messages',
    label: 'チャット',
    description: '予約に紐づくメッセージ',
    primaryKey: 'id',
    defaultSort: 'created_at',
  },
];

const TABLE_CONFIG = ADMIN_TABLES.reduce<Record<string, AdminTable>>((acc, table) => {
  acc[table.key] = table;
  return acc;
}, {});

type ModalMode = 'create' | 'edit';

const ROW_LIMIT = 200;

export const AdminPage = () => {
  const [selectedTable, setSelectedTable] = useState<string>(ADMIN_TABLES[0]?.key ?? '');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalValue, setModalValue] = useState('{\n  \n}');
  const [modalError, setModalError] = useState<string | null>(null);
  const [workingRow, setWorkingRow] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const currentTable = TABLE_CONFIG[selectedTable];

  const fetchRows = useCallback(async () => {
    if (!selectedTable) return;

    setLoading(true);
    setError(null);
    setFeedback(null);

    let query = supabase.from(selectedTable).select('*').limit(ROW_LIMIT);

    if (currentTable?.defaultSort) {
      query = query.order(currentTable.defaultSort, { ascending: false });
    }

    const { data, error: queryError } = await query;

    if (queryError) {
      console.error('Failed to fetch table data:', queryError);
      setError(`データの取得に失敗しました: ${queryError.message}`);
      setRows([]);
    } else {
      setRows(data ?? []);
      if ((data?.length ?? 0) >= ROW_LIMIT) {
        setFeedback(`最新${ROW_LIMIT}件を表示しています。必要に応じて絞り込んでください。`);
      }
    }

    setLoading(false);
  }, [selectedTable, currentTable?.defaultSort]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const columnNames = useMemo(() => {
    const keys = new Set<string>();
    rows.forEach((row) => {
      Object.keys(row ?? {}).forEach((key) => keys.add(key));
    });
    return Array.from(keys).sort();
  }, [rows]);

  const openCreateModal = () => {
    setModalMode('create');
    setWorkingRow(null);
    setModalValue('{\n  \n}');
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

  const closeModal = () => {
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

    const confirmed = window.confirm('このレコードを削除しますか？この操作は元に戻せません。');
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
    } catch (parseError: any) {
      setModalError(`JSONのパースに失敗しました: ${parseError.message}`);
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
      closeModal();
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
    closeModal();
    await fetchRows();
  };

  const renderCellValue = (column: string, value: unknown) => {
    if (value === null || value === undefined) {
      return <span className={styles.nullValue}>null</span>;
    }

    if (typeof value === 'object') {
      return (
        <pre className={styles.jsonCell}>
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <span className={value ? styles.booleanTrue : styles.booleanFalse}>
          {value ? 'true' : 'false'}
        </span>
      );
    }

    if (typeof value === 'string') {
      const lowerColumn = column.toLowerCase();
      const looksLikeId =
        lowerColumn.endsWith('id') ||
        /^[0-9a-f-]{16,}$/i.test(value);

      if (looksLikeId) {
        return (
          <span className={styles.codeCell} title={value}>
            {value}
          </span>
        );
      }

      return <span className={styles.textCell}>{value}</span>;
    }

    return <span className={styles.textCell}>{String(value)}</span>;
  };

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <h1 className={styles.title}>管理ツール</h1>
        <ul className={styles.tableList}>
          {ADMIN_TABLES.map((table) => (
            <li
              key={table.key}
              className={`${styles.tableItem} ${
                selectedTable === table.key ? styles.active : ''
              }`}
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
            <h2 className={styles.contentTitle}>{currentTable?.label ?? selectedTable}</h2>
            {currentTable?.description && (
              <p className={styles.description}>{currentTable.description}</p>
            )}
            <p className={styles.meta}>
              {rows.length}件を表示中（最大{ROW_LIMIT}件）
            </p>
          </div>
          <div className={styles.actionGroup}>
            <button className={`${styles.button} ${styles.ghostButton}`} onClick={fetchRows}>
              再読み込み
            </button>
            <button className={`${styles.button} ${styles.primaryButton}`} onClick={openCreateModal}>
              新規作成
            </button>
          </div>
        </header>

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
                  {columnNames.map((col) => (
                    <th key={col} className={styles.headerCell}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className={styles.emptyCell} colSpan={columnNames.length + 1}>
                      データがありません。
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const key = (currentTable?.primaryKey ?? 'id') as string;
                    const rowKey = (row?.[key] as string | number | undefined) ?? JSON.stringify(row);
                    return (
                      <tr key={rowKey} className={styles.tableRow}>
                        <td className={styles.actionCell}>
                          <button
                            className={`${styles.smallButton} ${styles.ghostButton}`}
                            onClick={() => openEditModal(row)}
                          >
                            編集
                          </button>
                          <button
                            className={`${styles.smallButton} ${styles.dangerButton}`}
                            onClick={() => handleDelete(row)}
                          >
                            削除
                          </button>
                        </td>
                        {columnNames.map((col) => (
                          <td key={`${rowKey}-${col}`} className={styles.dataCell}>
                            {renderCellValue(col, row[col])}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
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
            rows={16}
          />
          {modalError && <div className={styles.modalError}>{modalError}</div>}
          <div className={styles.modalActions}>
            <button className={`${styles.button} ${styles.ghostButton}`} onClick={closeModal} disabled={saving}>
              キャンセル
            </button>
            <button
              className={`${styles.button} ${styles.primaryButton}`}
              onClick={handleModalSubmit}
              disabled={saving}
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
