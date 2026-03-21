import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../../core/config/app_config.dart';
import '../../auth/repositories/auth_repository.dart';
import '../models/message_model.dart';

final socketServiceProvider = Provider<SocketService>((ref) {
  final appConfig = ref.watch(appConfigProvider);
  final authRepo = ref.watch(authRepositoryProvider);
  return SocketService(appConfig.apiBaseUrl, authRepo);
});

class SocketService {
  final String _apiBaseUrl;
  final AuthRepository _authRepo;
  IO.Socket? _socket;
  final _messageController = StreamController<Message>.broadcast();

  SocketService(this._apiBaseUrl, this._authRepo);

  Stream<Message> get onNewMessage => _messageController.stream;

  Future<void> connect() async {
    if (_socket != null && _socket!.connected) return;

    final token = await _authRepo.getValidAccessToken();
    if (token == null) return;

    final uri = Uri.parse(_apiBaseUrl);
    final wsUrl = '${uri.scheme}://${uri.host}:${uri.port}';

    _socket = IO.io(wsUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'auth': {
        'token': token,
      },
    });

    _socket!.onConnect((_) {
      print('Socket.IO connected');
    });

    _socket!.on('newMessage', (data) {
      if (data != null) {
        final message = Message.fromJson(data);
        _messageController.add(message);
      }
    });

    _socket!.onDisconnect((_) {
      print('Socket.IO disconnected');
    });

    _socket!.connect();
  }

  void joinConversation(String conversationId) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('joinConversation', conversationId);
    }
  }

  void leaveConversation(String conversationId) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('leaveConversation', conversationId);
    }
  }

  void sendMessage(String conversationId, String content) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('sendMessage', {
        'conversationId': conversationId,
        'content': content,
      });
    }
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  void dispose() {
    disconnect();
    _messageController.close();
  }
}
