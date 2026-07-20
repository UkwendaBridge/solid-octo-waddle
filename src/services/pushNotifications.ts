// Push Notification Service

const VAPID_PUBLIC_KEY = 'BIoHk0PBsUvfL65sg7OdCBHdXMgeCO9uUf7MUt-s3q11Pk6qux5eHsIPQsueAVRVfaErEzRwyCs3QX8RZIr9mV8';

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('Notification permission:', permission);
  return permission;
}

export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  try {
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer
    });
    console.log('Push subscription created:', subscription);
    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

export async function sendSubscriptionToServer(subscription: PushSubscription, token: string): Promise<boolean> {
  const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://maest-dist.onrender.com').replace(/\/+$/, '');
  
  try {
    const response = await fetch(`${API_BASE_URL}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subscription: subscription.toJSON() })
    });

    if (!response.ok) {
      throw new Error('Failed to send subscription to server');
    }

    console.log('Subscription sent to server');
    return true;
  } catch (error) {
    console.error('Failed to send subscription:', error);
    return false;
  }
}

export async function setupPushNotifications(token: string): Promise<boolean> {
  // 1. Register service worker
  const registration = await registerServiceWorker();
  if (!registration) return false;

  // 2. Request permission
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return false;

  // 3. Subscribe to push
  const subscription = await subscribeToPush(registration);
  if (!subscription) return false;

  // 4. Send subscription to server
  const success = await sendSubscriptionToServer(subscription, token);
  return success;
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | null {
  if (!('Notification' in window)) return null;
  return Notification.permission;
}
