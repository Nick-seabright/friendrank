import { Expo, ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

export async function sendPush(pushToken: string | null | undefined, title: string, body: string, data?: Record<string, unknown>) {
  if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
    return;
  }
  const message: ExpoPushMessage = { to: pushToken, sound: "default", title, body, data };
  try {
    await expo.sendPushNotificationsAsync([message]);
  } catch (err) {
    console.error("Push send failed:", err);
  }
}
