import 'dart:developer' as developer;

import 'package:flutter_riverpod/flutter_riverpod.dart';

enum AppEnvironment {
  emulator,
  // USB-only debug mode used with `adb reverse`.
  usb,
  device,
  release,
}

final appConfigProvider = Provider<AppConfig>((ref) {
  final config = AppConfig.fromEnvironment();
  _logResolvedConfig(config, source: 'dart-define');
  return config;
});

class AppConfigException implements Exception {
  final List<String> errors;

  AppConfigException(this.errors);

  @override
  String toString() => 'AppConfigException: ${errors.join('; ')}';
}

class AppConfig {
  // --- Auth0 / OIDC ---
  final String oidcDiscoveryUrl;
  final String oidcClientId;
  final String oidcRedirectUri;
  final String oidcAudience;

  // --- Per-service production URLs ---
  final String userServiceUrl;
  final String feedServiceUrl;
  final String jobServiceUrl;
  final String eventServiceUrl;
  final String notificationServiceUrl;
  final String researchServiceUrl;
  final String analyticsServiceUrl;
  final String messagingServiceUrl;

  final AppEnvironment appEnvironment;

  const AppConfig._({
    required this.oidcDiscoveryUrl,
    required this.oidcClientId,
    required this.oidcRedirectUri,
    required this.oidcAudience,
    required this.userServiceUrl,
    required this.feedServiceUrl,
    required this.jobServiceUrl,
    required this.eventServiceUrl,
    required this.notificationServiceUrl,
    required this.researchServiceUrl,
    required this.analyticsServiceUrl,
    required this.messagingServiceUrl,
    required this.appEnvironment,
  });

  // Production Render service URLs as compile-time constants. Override with
  // --dart-define=USER_SERVICE_URL=... for local/staging environments.
  factory AppConfig.fromEnvironment() {
    return AppConfig._(
      oidcDiscoveryUrl: const String.fromEnvironment(
        'OIDC_DISCOVERY_URL',
        defaultValue:
            'https://dev-ql54xjx71jnttf1o.us.auth0.com/.well-known/openid-configuration',
      ),
      oidcClientId: const String.fromEnvironment(
        'OIDC_CLIENT_ID',
        defaultValue: 'MUKsKjXPuBpmgamSIKhFl62jhC1kqD88',
      ),
      oidcRedirectUri: const String.fromEnvironment(
        'OIDC_REDIRECT_URI',
        defaultValue: 'com.example.delta://login-callback',
      ),
      oidcAudience: const String.fromEnvironment(
        'OIDC_AUDIENCE',
        defaultValue: 'https://api.decp-co528.com',
      ),
      userServiceUrl: const String.fromEnvironment(
        'USER_SERVICE_URL',
        defaultValue: 'https://user-service-a60z.onrender.com',
      ),
      feedServiceUrl: const String.fromEnvironment(
        'FEED_SERVICE_URL',
        defaultValue: 'https://feed-service-oafo.onrender.com',
      ),
      jobServiceUrl: const String.fromEnvironment(
        'JOB_SERVICE_URL',
        defaultValue: 'https://job-service-h3pb.onrender.com',
      ),
      eventServiceUrl: const String.fromEnvironment(
        'EVENT_SERVICE_URL',
        defaultValue: 'https://event-service-at2l.onrender.com',
      ),
      notificationServiceUrl: const String.fromEnvironment(
        'NOTIFICATION_SERVICE_URL',
        defaultValue: 'https://notification-service-n0ph.onrender.com',
      ),
      researchServiceUrl: const String.fromEnvironment(
        'RESEARCH_SERVICE_URL',
        defaultValue: 'https://research-service-befz.onrender.com',
      ),
      analyticsServiceUrl: const String.fromEnvironment(
        'ANALYTICS_SERVICE_URL',
        defaultValue: 'https://analytics-service-5ppc.onrender.com',
      ),
      messagingServiceUrl: const String.fromEnvironment(
        'MESSAGING_SERVICE_URL',
        defaultValue: 'https://messaging-service-dss7.onrender.com',
      ),
      appEnvironment: _parseEnvironment(
        const String.fromEnvironment('APP_ENV', defaultValue: 'device'),
      ),
    ).validated();
  }

  factory AppConfig.fromMap(Map<String, String> env) {
    return AppConfig._(
      oidcDiscoveryUrl: env['OIDC_DISCOVERY_URL'] ??
          'https://dev-ql54xjx71jnttf1o.us.auth0.com/.well-known/openid-configuration',
      oidcClientId: env['OIDC_CLIENT_ID'] ?? 'MUKsKjXPuBpmgamSIKhFl62jhC1kqD88',
      oidcRedirectUri: env['OIDC_REDIRECT_URI'] ?? 'com.example.delta://login-callback',
      oidcAudience: env['OIDC_AUDIENCE'] ?? 'https://api.decp-co528.com',
      userServiceUrl:
          env['USER_SERVICE_URL'] ?? 'https://user-service-a60z.onrender.com',
      feedServiceUrl:
          env['FEED_SERVICE_URL'] ?? 'https://feed-service-oafo.onrender.com',
      jobServiceUrl:
          env['JOB_SERVICE_URL'] ?? 'https://job-service-h3pb.onrender.com',
      eventServiceUrl:
          env['EVENT_SERVICE_URL'] ?? 'https://event-service-at2l.onrender.com',
      notificationServiceUrl: env['NOTIFICATION_SERVICE_URL'] ??
          'https://notification-service-n0ph.onrender.com',
      researchServiceUrl:
          env['RESEARCH_SERVICE_URL'] ?? 'https://research-service-befz.onrender.com',
      analyticsServiceUrl: env['ANALYTICS_SERVICE_URL'] ??
          'https://analytics-service-5ppc.onrender.com',
      messagingServiceUrl: env['MESSAGING_SERVICE_URL'] ??
          'https://messaging-service-dss7.onrender.com',
      appEnvironment: _parseEnvironment(env['APP_ENV'] ?? 'device'),
    ).validated();
  }

  bool get requiresHttps =>
      appEnvironment == AppEnvironment.device ||
      appEnvironment == AppEnvironment.release;

  AppConfig validated() {
    final errors = <String>[];

    if (oidcDiscoveryUrl.trim().isEmpty) {
      errors.add('OIDC_DISCOVERY_URL is required.');
    }
    if (oidcClientId.trim().isEmpty) {
      errors.add('OIDC_CLIENT_ID is required.');
    }
    if (oidcRedirectUri.trim().isEmpty) {
      errors.add('OIDC_REDIRECT_URI is required.');
    }

    final discoveryUri = Uri.tryParse(oidcDiscoveryUrl);
    if (oidcDiscoveryUrl.trim().isNotEmpty && !_isValidAbsoluteUri(discoveryUri)) {
      errors.add('OIDC_DISCOVERY_URL must be a valid absolute URL.');
    }

    final redirectUri = Uri.tryParse(oidcRedirectUri);
    if (oidcRedirectUri.trim().isNotEmpty && !_isValidUri(redirectUri)) {
      errors.add('OIDC_REDIRECT_URI must be a valid URI.');
    }

    if (requiresHttps) {
      if ((discoveryUri?.scheme.toLowerCase() ?? '') != 'https') {
        errors.add(
          'OIDC_DISCOVERY_URL must use https for APP_ENV=device or APP_ENV=release.',
        );
      }
    }

    if (errors.isNotEmpty) {
      throw AppConfigException(errors);
    }

    return this;
  }

  static AppEnvironment _parseEnvironment(String value) {
    switch (value.trim().toLowerCase()) {
      case 'emulator':
        return AppEnvironment.emulator;
      case 'usb':
        return AppEnvironment.usb;
      case 'device':
        return AppEnvironment.device;
      case 'release':
        return AppEnvironment.release;
      default:
        throw AppConfigException([
          'APP_ENV is required and must be one of: emulator, usb, device, release.',
        ]);
    }
  }

  static bool _isValidAbsoluteUri(Uri? uri) {
    return _isValidUri(uri) && uri!.hasAuthority;
  }

  static bool _isValidUri(Uri? uri) {
    return uri != null && uri.hasScheme;
  }
}

void _logResolvedConfig(AppConfig config, {required String source}) {
  developer.log(
    'Resolved AppConfig from $source: env=${config.appEnvironment.name}, '
    'requiresHttps=${config.requiresHttps}, '
    'userService=${config.userServiceUrl}, '
    'oidc=${config.oidcDiscoveryUrl}',
    name: 'delta.app_config',
  );
}
