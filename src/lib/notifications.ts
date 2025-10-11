import { supabase } from './supabase';

type ReservationNotificationEvent =
  | 'reservation_pending'
  | 'reservation_confirmed'
  | 'reservation_cancelled_by_salon'
  | 'reservation_cancelled_by_student';

export const sendReservationNotification = async (
  reservationId: string,
  event: ReservationNotificationEvent
) => {
  try {
    await supabase.functions.invoke('reservation-notification', {
      body: {
        reservationId,
        event,
      },
    });
  } catch (error) {
    console.error('予約通知メールの送信に失敗しました', error);
  }
};
