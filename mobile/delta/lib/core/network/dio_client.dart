import 'package:dio/dio.dart';
import 'package:delta/core/config/app_config.dart';
import 'package:delta/features/auth/repositories/auth_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Creates a Dio instance with JWT auth injection and 401-retry logic pointed
/// at [baseUrl]. Each service gets its own provider to avoid a single shared
/// base URL. Token refresh is handled via [AuthRepository].
Dio _buildDio(String baseUrl, AuthRepository authRepository) {
  final dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
      },
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await authRepository.getValidAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401 &&
            e.requestOptions.extra['retriedWithRefresh'] != true) {
          final refreshedToken = await authRepository.refreshAccessToken();
          if (refreshedToken != null) {
            final retryRequest = e.requestOptions;
            retryRequest.headers['Authorization'] = 'Bearer $refreshedToken';
            retryRequest.extra['retriedWithRefresh'] = true;

            try {
              final retryResponse = await dio.fetch(retryRequest);
              return handler.resolve(retryResponse);
            } on DioException catch (_) {
              // Allow the original error to pass through after retry failure.
            }
          }
        }
        return handler.next(e);
      },
    ),
  );

  return dio;
}

/// Legacy single-provider — kept for backward compatibility with tests.
/// Resolves to [userDioProvider].
final dioProvider = Provider<Dio>((ref) => ref.watch(userDioProvider));

// --- Per-service Dio providers ---

final userDioProvider = Provider<Dio>((ref) {
  final auth = ref.watch(authRepositoryProvider);
  final config = ref.watch(appConfigProvider);
  return _buildDio('${config.userServiceUrl}/api/v1', auth);
});

final feedDioProvider = Provider<Dio>((ref) {
  final auth = ref.watch(authRepositoryProvider);
  final config = ref.watch(appConfigProvider);
  return _buildDio('${config.feedServiceUrl}/api/v1', auth);
});

final jobDioProvider = Provider<Dio>((ref) {
  final auth = ref.watch(authRepositoryProvider);
  final config = ref.watch(appConfigProvider);
  return _buildDio('${config.jobServiceUrl}/api/v1', auth);
});

final eventDioProvider = Provider<Dio>((ref) {
  final auth = ref.watch(authRepositoryProvider);
  final config = ref.watch(appConfigProvider);
  return _buildDio('${config.eventServiceUrl}/api/v1', auth);
});

final notificationDioProvider = Provider<Dio>((ref) {
  final auth = ref.watch(authRepositoryProvider);
  final config = ref.watch(appConfigProvider);
  return _buildDio('${config.notificationServiceUrl}/api/v1', auth);
});

final researchDioProvider = Provider<Dio>((ref) {
  final auth = ref.watch(authRepositoryProvider);
  final config = ref.watch(appConfigProvider);
  return _buildDio('${config.researchServiceUrl}/api/v1', auth);
});

final analyticsDioProvider = Provider<Dio>((ref) {
  final auth = ref.watch(authRepositoryProvider);
  final config = ref.watch(appConfigProvider);
  return _buildDio('${config.analyticsServiceUrl}/api/v1', auth);
});

final messagingDioProvider = Provider<Dio>((ref) {
  final auth = ref.watch(authRepositoryProvider);
  final config = ref.watch(appConfigProvider);
  return _buildDio('${config.messagingServiceUrl}/api/v1', auth);
});
