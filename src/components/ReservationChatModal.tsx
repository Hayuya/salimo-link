import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ReservationWithDetails, ReservationMessage, UserType } from '@/types';
import { formatDateTime } from '@/utils/date';
import { Modal } from './Modal';
import { Button } from './Button';
import styles from './ReservationChatModal.module.css';

interface ReservationChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationWithDetails | null;
  currentUserId: string;
  currentUserType: UserType;
  onMessageActivity?: (message: ReservationMessage | null) => void;
}

export const ReservationChatModal = ({
  isOpen,
  onClose,
  reservation,
  currentUserId,
  currentUserType,
  onMessageActivity,
}: ReservationChatModalProps) => {
  const [messages, setMessages] = useState<ReservationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const reservationId = reservation?.id ?? null;

  const chatPartner = useMemo(() => {
    if (!reservation) return '';
    if (currentUserType === 'student') {
      return reservation.recruitment.salon.salon_name;
    }
    return reservation.student.name;
  }, [reservation, currentUserType]);

  const fetchMessages = useCallback(async () => {
    if (!reservationId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('reservation_messages')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch messages:', error);
    } else {
      setMessages(data || []);
      if (data && data.length > 0) {
        onMessageActivity?.(data[data.length - 1]);
      } else {
        onMessageActivity?.(null);
      }
    }
    setLoading(false);
  }, [reservationId, onMessageActivity]);

  const handleSendMessage = useCallback(async () => {
    const trimmed = newMessage.trim();
    if (!reservationId || !trimmed) return;
    setSending(true);
    const { error } = await supabase.from('reservation_messages').insert({
      reservation_id: reservationId,
      sender_id: currentUserId,
      sender_type: currentUserType,
      message: trimmed,
    });
    if (error) {
      console.error('Failed to send message:', error);
      alert('メッセージの送信に失敗しました。');
    } else {
      setNewMessage('');
    }
    setSending(false);
  }, [reservationId, newMessage, currentUserId, currentUserType]);

  useEffect(() => {
    if (!isOpen || !reservationId) {
      setMessages([]);
      setNewMessage('');
      return;
    }
    fetchMessages();
  }, [isOpen, reservationId, fetchMessages]);

  useEffect(() => {
    if (!isOpen || !reservationId) return;
    const channel = supabase
      .channel(`reservation-messages-${reservationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservation_messages',
          filter: `reservation_id=eq.${reservationId}`,
        },
        payload => {
          const newRecord = payload.new as ReservationMessage;
          setMessages(prev => {
            if (prev.some(message => message.id === newRecord.id)) {
              return prev;
            }
            return [...prev, newRecord];
          });
          onMessageActivity?.(newRecord);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, reservationId, onMessageActivity]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!reservation) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="チャット"
      size="lg"
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.partnerName}>{chatPartner}</h3>
          <span>予約日時: {formatDateTime(reservation.reservation_datetime)}</span>
        </div>

        <div className={styles.messageList}>
          {loading && <p className={styles.emptyState}>読み込み中...</p>}
          {!loading && messages.length === 0 && (
            <p className={styles.emptyState}>まだメッセージはありません。最初のメッセージを送ってみましょう。</p>
          )}
          {!loading &&
            messages.map(message => {
              const isSelf = message.sender_id === currentUserId;
              const author =
                message.sender_type === 'student'
                  ? reservation.student.name
                  : reservation.recruitment.salon.salon_name;
              return (
                <div
                  key={message.id}
                  className={[
                    styles.messageItem,
                    isSelf ? styles.messageItemSelf : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className={styles.messageAuthor}>{author}</span>
                  <p className={styles.messageText}>{message.message}</p>
                  <span className={styles.messageMeta}>
                    {new Date(message.created_at).toLocaleString('ja-JP')}
                  </span>
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          <textarea
            className={styles.textarea}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="メッセージを入力"
            disabled={sending}
          />
          {sending && <span className={styles.sendingIndicator}>送信中...</span>}
          <Button
            variant="primary"
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            loading={sending}
          >
            送信
          </Button>
        </div>
      </div>
    </Modal>
  );
};
