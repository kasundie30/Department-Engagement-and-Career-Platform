import 'dart:io';

import 'package:dio/dio.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_client.dart';

final pushNotificationServiceProvider = Provider<PushNotificationService>((ref) {
  final dio = ref.watch(dioProvider);
  return PushNotificationService(dio);
});

// Background message handler
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // Handle background notifications
  print("Handling a background message: ${message.messageId}");
}

class PushNotificationService {
  final Dio _dio;
  bool _initialized = false;

  PushNotificationService(this._dio);

  Future<void> initialize() async {
    if (_initialized) return;

    try {
      // Intentionally omitting FirebaseOptions for simplicity if defaults exist
      // In a real app we'd pass DefaultFirebaseOptions.currentPlatform
      await Firebase.initializeApp();

      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Request permissions
      NotificationSettings settings = await FirebaseMessaging.instance.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      print('User granted permission: ${settings.authorizationStatus}');

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        // Get FCM Token
        final String? token = await FirebaseMessaging.instance.getToken();
        if (token != null) {
          await _registerTokenWithBackend(token);
        }

        // Listen for token refreshes
        FirebaseMessaging.instance.onTokenRefresh.listen(_registerTokenWithBackend);

        // Foreground messages
        FirebaseMessaging.onMessage.listen((RemoteMessage message) {
          print('Got a message whilst in the foreground!');
          print('Message data: ${message.data}');
          
          if (message.notification != null) {
            print('Message also contained a notification: ${message.notification}');
          }
        });
      }

      _initialized = true;
    } catch (e) {
      print('Failed to initialize push notifications: $e');
    }
  }

  Future<void> _registerTokenWithBackend(String token) async {
    try {
      await _dio.post('/notification-service/tokens', data: {
        'token': token,
        'type': 'FCM',
      });
      print('Successfully registered device token with backend');
    } catch (e) {
      print('Failed to register device token: $e');
    }
  }
}
